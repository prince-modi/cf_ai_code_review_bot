# Cloudflare AI Code Review Bot

**Live Demo:** [https://code-review-bot.princebmodi.workers.dev/](https://code-review-bot.princebmodi.workers.dev/)

An AI-powered Coach built on the Cloudflare Developer Platform. This application acts as a socratic tutor, analyzing your code's complexity and guiding you toward optimal solutions without giving away the answer.

---

This project was built to satisfy the specific technical requirements of the Cloudflare "AI-Powered Application" assignment:

| Component | Implementation Details |
| :--- | :--- |
| **LLM** | **Llama 3.3** (`@cf/meta/llama-3.3-70b-instruct-fp8-fast`) via **Workers AI** for high-accuracy code reasoning. |
| **Coordination** | **Cloudflare Agents** (powered by **Durable Objects**) to manage the coaching session lifecycle and isolate user contexts. |
| **Memory / State** | **Durable Object State** persists the conversation history and the user's current code snippet across multiple turns. |
| **User Input** | **React** frontend with real-time streaming chat, custom Markdown rendering, and syntax highlighting. |

---


## Architecture

The application runs entirely on the Cloudflare network using a monolithic Worker approach:

1.  **Frontend:** A React Single Page Application (SPA) bundled with Vite. It connects to the backend agent via HTTP/WebSocket.
2.  **Backend Agent (`src/server.ts`):** A Durable Object that maintains the "Coach" persona.
    * **State:** Stores the chat history (`history`) and the user's code (`currentCode`).
    * **Logic:** Prompts Llama 3.3 with a specialized System Prompt to enforce the "Coach" behavior and output specific Markdown formatting.
3.  **Inference:** Cloudflare Workers AI handles the Llama 3.3 inference requests.

---

## Tech Stack

* **Runtime:** Cloudflare Workers
* **Framework:** Cloudflare Agents SDK
* **Model:** Llama 3.3 70B
* **Frontend:** React, Tailwind CSS, Vite
* **Streaming:** Vercel AI SDK (`streamText`)
* **Language:** TypeScript

---

## Local Development

To run this project locally, you will need Node.js and a Cloudflare account.

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/prince-modi/cf_ai_code_review_bot.git](https://github.com/prince-modi/cf_ai_code_review_bot.git)
    cd cf_ai_code_review_bot
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Start the development server:**
    ```bash
    npm run dev
    ```
    This command starts both the Vite frontend and the local Workers environment (Miniflare).

4.  **Deploy to Cloudflare:**
    ```bash
    npm run deploy
    ```

---

## How to Use

1.  Open the application.
2.  Paste a LeetCode solution (e.g., a brute-force Two Sum in JavaScript/Python).
3.  The Coach will analyze the code and display the Big O complexity.

---
