import { Agent, routeAgentRequest } from "agents";
import type { Connection } from "agents";

// --- Configuration ---
const MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
const SYSTEM_PROMPT = `You are a Senior Software Engineer acting as a Code Reviewer.
Your goal is to improve code quality, security, and performance.

When reviewing code:
1. Identify critical bugs or security risks first.
2. If you suggest a code fix, use a "git diff" style format in a code block.
   - Use "-" for lines to remove.
   - Use "+" for lines to add.
   - Keep unchanged context lines around the changes.
3. Be concise.
4. Use Markdown for all code snippets.`;

// --- State Definition ---
interface ReviewState {
	currentCode?: string;
	history: { role: "system" | "user" | "assistant"; content: string }[];
}

export class CodeReviewAgent extends Agent<Env, ReviewState> {
	// Initialize Memory
	async onStart() {
		this.setState({
			currentCode: undefined,
			history: [],
		});
	}

	// Helper: Run Llama 3.3
	// Helper: Run Llama 3.3
	async runAI(messages: any[]) {
		try {
			const response = await this.env.AI.run(MODEL, {
				messages,
				// FIX: Allow the model to generate up to ~2000 words
				max_tokens: 2500
			});

			return "response" in response ? (response.response as string) : "";
		} catch (error) {
			console.error("AI Error:", error);
			return "⚠️ I encountered an error while analyzing your code. Please try again.";
		}
	}
	// Handle User Input (Chat)
	async onMessage(connection: Connection, message: string) {
		const state = this.state;
		let reply = "";

		// Heuristic: Is this a new code snippet or a chat message?
		// If it has multiple lines or braces, we treat it as code to review.
		const isCodeSnippet = message.includes("\n") || message.includes("{") || message.length > 200;

		if (isCodeSnippet) {
			// Logic: New Review
			state.currentCode = message;
			state.history = []; // Reset context for new code

			const prompt = `Please review this code:\n\n${message}`;

			// Send "Thinking" signal (Optional, handled by UI spinner usually)

			reply = await this.runAI([
				{ role: "system", content: SYSTEM_PROMPT },
				{ role: "user", content: prompt }
			]);

			// Update Memory
			state.history.push({ role: "user", content: prompt });
			state.history.push({ role: "assistant", content: reply });

		} else {
			// Logic: Follow-up Question
			if (!state.currentCode) {
				connection.send(JSON.stringify({ text: "Please paste the code you want me to review first." }));
				return;
			}

			// Contextual Prompt
			const messages = [
				{ role: "system", content: SYSTEM_PROMPT },
				{ role: "user", content: `Context - The code we are discussing:\n${state.currentCode}` },
				...state.history,
				{ role: "user", content: message }
			];

			reply = await this.runAI(messages);

			// Update Memory
			state.history.push({ role: "user", content: message });
			state.history.push({ role: "assistant", content: reply });
		}

		// Save State (Durable Object)
		this.setState(state);

		// Send Response
		connection.send(JSON.stringify({ text: reply }));
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
