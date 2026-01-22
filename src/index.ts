import { Agent, routeAgentRequest } from "agents";
import type { Connection } from "agents";
import { createWorkersAI } from "workers-ai-provider";
import { streamText } from "ai";

// --- Configuration ---
const MODEL_ID = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
const SYSTEM_PROMPT = `You are a Senior Software Engineer acting as a Code Reviewer.
Your goal is to improve code quality, security, and performance.

When reviewing code:
1. Identify critical bugs or security risks first.
2. If you suggest a code fix, use a "git diff" style format in a code block.
   - Use "-" for lines to remove.
   - Use "+" for lines to add.
3. Be concise.
4. Use Markdown for all code snippets.`;

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

		// 1. Reset Command
		if (message === "/reset") {
			this.setState({ currentCode: undefined, history: [] });
			connection.send(JSON.stringify({ type: "reset" }));
			return;
		}

		// 2. Determine Context
		const isCodeSnippet = message.includes("\n") || message.includes("{") || message.length > 200;
		let messages: any[] = []; // Vercel AI SDK compatible messages

		if (isCodeSnippet) {
			state.currentCode = message;
			state.history = [];
			const userContent = `Please review this code:\n\n${message}`;

			// Setup initial messages
			messages = [
				{ role: "system", content: SYSTEM_PROMPT },
				{ role: "user", content: userContent }
			];
			state.history.push({ role: "user", content: userContent });
		} else {
			if (!state.currentCode) {
				connection.send(JSON.stringify({ type: "error", text: "Please paste the code you want me to review first." }));
				return;
			}
			messages = [
				{ role: "system", content: SYSTEM_PROMPT },
				{ role: "user", content: `Context - Code:\n${state.currentCode}` },
				...state.history,
				{ role: "user", content: message }
			];
			state.history.push({ role: "user", content: message });
		}

		// 3. START STREAMING
		connection.send(JSON.stringify({ type: "start" }));

		try {
			// Initialize the Vercel AI Provider
			const workersai = createWorkersAI({ binding: this.env.AI });

			// Use the SDK to handle the stream parsing for us
			const result = streamText({
				model: workersai(MODEL_ID),
				messages: messages, // Pass the array directly
				maxTokens: 2500,
			});

			let fullResponse = "";

			// 4. Iterate over clean text chunks
			for await (const textPart of result.textStream) {
				fullResponse += textPart;
				connection.send(JSON.stringify({ type: "chunk", text: textPart }));
			}

			// 5. Finish
			connection.send(JSON.stringify({ type: "done" }));

			// Save to memory
			state.history.push({ role: "assistant", content: fullResponse });
			this.setState(state);

		} catch (error: any) {
			console.error("AI Error:", error);
			connection.send(JSON.stringify({ type: "error", text: `Error: ${error.message || "Unknown error"}` }));
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
