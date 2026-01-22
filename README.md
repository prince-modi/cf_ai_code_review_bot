# 🤖 Cloudflare AI Code Reviewer

An AI-powered Code Review Agent built on the **Cloudflare Agents SDK**. It acts as a Senior Software Engineer, analyzing code for security, performance, and bugs in real-time.

**[Live Demo Link Here](https://code-review-bot.princebmodi.workers.dev/)** 

---

## 🚀 Features (Assignment Requirements)

This project satisfies the assignment requirements using the following stack:

* **LLM:** **Llama 3.3** (`@cf/meta/llama-3.3-70b-instruct-fp8-fast`) running on Workers AI.
* **Workflow & Coordination:** **Durable Objects** manage the agent's lifecycle and handle WebSocket connections.
* **User Input:** **Real-time Streaming Chat** interface built with React & WebSockets.
* **Memory / State:** **SQLite (via Durable Objects)** persists conversation history and code context, allowing users to ask follow-up questions about the same snippet.

### Extra Capabilities
* **Streaming Responses:** Uses the Vercel AI SDK to stream Llama 3.3 tokens for instant feedback.
* **Syntax Highlighting:** Automatically formats and highlights code blocks in the chat.
* **Context Awareness:** The agent "remembers" the code you pasted earlier, so you can ask "How do I fix that bug?" without re-pasting.

---

## 🛠️ Tech Stack

* **Framework:** [Cloudflare Agents SDK](https://github.com/cloudflare/agents)
* **Runtime:** Cloudflare Workers (Durable Objects)
* **AI Provider:** Workers AI (Llama 3.3)
* **Frontend:** React + Vite
* **Tools:** `workers-ai-provider`, `ai` (Vercel SDK), `react-syntax-highlighter`

---

## 🏃‍♂️ How to Run Locally

1.  **Clone the repo**
    ```bash
    git clone https://github.com/prince-modi/cf_ai_code_review_bot.git
    cd cf_ai_code_review_bot
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Start the development server**
    ```bash
    npm run dev
    ```
    Open `http://localhost:5173` to start reviewing code.

---

## ☁️ Deployment

Deploy to Cloudflare's global network:

```bash
npm run deploy
