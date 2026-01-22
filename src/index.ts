import { Agent, routeAgentRequest } from "agents";
import type { Connection } from "agents";
import { createWorkersAI } from "workers-ai-provider";
import { streamText } from "ai";

// --- Configuration ---
const MODEL_ID = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";

// 🚀 UPDATED PROMPT: PRETTY FORMATTING
const SYSTEM_PROMPT = `You are an expert Technical Interview Coach (LeetCode Helper).
Your goal is to analyze the user's solution and guide them toward the optimal approach *without* giving away the answer.

**STRICT RESPONSE RULES:**
1. **Analyze:** First, determine the Time and Space complexity.
2. **Coach:** Then, provide a helpful nudge or confirmation.
3. **Format:** You MUST use the following Markdown structure exactly:

## 📊 Analysis
* **Time:** \`O(...)\`
* **Space:** \`O(...)\`

## 💡 Coach's Hint
> (Write your verbal nudge here inside a blockquote. If the solution is already optimal, congratulate them! If not, explain the concept they are missing, like "Hash Map" or "Two Pointers", without writing the code.)

## 📚 Similar Problems (Only if Optimal)
* [Problem Name 1]
* [Problem Name 2]
* [Problem Name 3]
`;

// --- State Definition ---
interface ReviewState {
	currentCode?: string;
	history: { role: "system" | "user" | "assistant"; content: string }[];
}

export class CodeReviewAgent extends Agent<Env, ReviewState> {
	async onStart() {
		this.setState({
			currentCode: undefined,
			history: [],
		});
	}

	async onMessage(connection: Connection, message: string) {
		const state = this.state;

		if (message === "/reset") {
			this.setState({ currentCode: undefined, history: [] });
			connection.send(JSON.stringify({ type: "reset" }));
			return;
		}

		// Smart Context Logic
		let isCodeSnippet = false;
		if (!state.currentCode) {
			isCodeSnippet = true;
		} else {
			if (message.length > 200 && (message.includes("function") || message.includes("class"))) {
				isCodeSnippet = true;
			}
		}

		// Manage History
		if (state.history.length > 6) {
			state.history = state.history.slice(-6);
		}

		let messages: any[] = [];

		if (isCodeSnippet) {
			state.currentCode = message;
			state.history = [];
			const userContent = `Analyze this LeetCode solution:\n\n${message}`;

			messages = [
				{ role: "system", content: SYSTEM_PROMPT },
				{ role: "user", content: userContent }
			];
			state.history.push({ role: "user", content: userContent });

		} else {
			messages = [
				{ role: "system", content: SYSTEM_PROMPT },
				{ role: "user", content: `Context - User's Solution:\n\`\`\`\n${state.currentCode}\n\`\`\`` },
				...state.history,
				{ role: "user", content: message }
			];
			state.history.push({ role: "user", content: message });
		}

		connection.send(JSON.stringify({ type: "start" }));

		try {
			const workersai = createWorkersAI({ binding: this.env.AI });

			const result = streamText({
				model: workersai(MODEL_ID),
				messages: messages,
				maxTokens: 2048,
				temperature: 0.2,
			});

			let fullResponse = "";

			for await (const textPart of result.textStream) {
				fullResponse += textPart;
				connection.send(JSON.stringify({ type: "chunk", text: textPart }));
			}

			connection.send(JSON.stringify({ type: "done" }));

			state.history.push({ role: "assistant", content: fullResponse });
			this.setState(state);

		} catch (error: any) {
			console.error("AI Error:", error);
			connection.send(JSON.stringify({ type: "error", text: `Error: ${error.message}` }));
		}
	}
}

export interface Env {
	AI: any;
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext) {
		return (await routeAgentRequest(request, env)) || new Response("Not found", { status: 404 });
	},
};
