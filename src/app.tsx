import { useAgent } from "agents/react";
import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
// Import the highlighter and a nice dark theme
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

export default function App() {
	const agent = useAgent({
		agent: "CodeReviewAgent",
		name: "review-session",
	});

	const [input, setInput] = useState("");
	const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
	const [isLoading, setIsLoading] = useState(false);

	const bottomRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLTextAreaElement>(null);

	useEffect(() => {
		if (!agent) return;

		agent.onmessage = (event: MessageEvent) => {
			setIsLoading(false);
			try {
				const data = JSON.parse(event.data);
				if (data.text) {
					setMessages((p) => [...p, { role: "assistant", content: data.text }]);
				}
			} catch (e) {
				setMessages((p) => [...p, { role: "assistant", content: event.data }]);
			}
		};
	}, [agent]);

	const sendMessage = () => {
		if (!input.trim() || !agent) return;

		setIsLoading(true);
		setMessages((p) => [...p, { role: "user", content: input }]);
		agent.send(input);
		setInput("");
	};

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages, isLoading]);

	const handleEmptyStateClick = () => {
		inputRef.current?.focus();
	};

	return (
		<div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 20px", fontFamily: "system-ui, sans-serif" }}>
			<header style={{ marginBottom: "30px", borderBottom: "1px solid #eee", paddingBottom: "20px" }}>
				<h1 style={{ margin: 0, fontSize: "24px" }}>🔍 Code Review Agent</h1>
				<p style={{ margin: "5px 0 0", color: "#666" }}>Powered by Llama 3.3 & Cloudflare Agents</p>
			</header>

			<div style={{
				border: "1px solid #e1e1e1",
				borderRadius: "12px",
				height: "60vh",
				overflowY: "auto",
				padding: "20px",
				backgroundColor: "#fff",
				boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
			}}>
				{messages.length === 0 && (
					<div
						onClick={handleEmptyStateClick}
						style={{
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							height: "100%",
							color: "#999",
							cursor: "text",
							flexDirection: "column"
						}}
					>
						<p style={{ fontSize: "1.2rem", fontWeight: "bold" }}>Paste your code snippet here to begin...</p>
						<p style={{ fontSize: "0.9rem" }}>(Click to focus input)</p>
					</div>
				)}

				{messages.map((msg, i) => (
					<div key={i} style={{ marginBottom: "20px", textAlign: msg.role === "user" ? "right" : "left" }}>
						<div style={{
							display: "inline-block",
							padding: "0", // Padding handled by markdown container
							borderRadius: "12px",
							background: msg.role === "user" ? "#000" : "transparent",
							color: msg.role === "user" ? "#fff" : "#000",
							maxWidth: "100%", // Allow code blocks to take full width
							width: msg.role === "user" ? "auto" : "100%",
							textAlign: "left",
							overflow: "hidden"
						}}>
							{msg.role === "user" ? (
								<div style={{ padding: "12px 18px", whiteSpace: "pre-wrap" }}>{msg.content}</div>
							) : (
								<div style={{ fontSize: "15px", lineHeight: "1.6" }}>
									<ReactMarkdown
										remarkPlugins={[remarkGfm]}
										components={{
											// Custom Code Block Renderer
											code(props) {
												const { children, className, node, ...rest } = props
												const match = /language-(\w+)/.exec(className || '')
												return match ? (
													<SyntaxHighlighter
														{...rest}
														PreTag="div"
														children={String(children).replace(/\n$/, '')}
														language={match[1]}
														style={vscDarkPlus} // VS Code Dark Theme
														customStyle={{ borderRadius: "8px", margin: "10px 0" }}
													/>
												) : (
													<code {...rest} style={{ background: "#f4f4f5", padding: "2px 5px", borderRadius: "4px" }}>
														{children}
													</code>
												)
											}
										}}
									>
										{msg.content}
									</ReactMarkdown>
								</div>
							)}
						</div>
					</div>
				))}

				{isLoading && (
					<div style={{ color: "#888", fontStyle: "italic", marginLeft: "10px" }}>Thinking...</div>
				)}
				<div ref={bottomRef} />
			</div>

			<div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
				<textarea
					ref={inputRef}
					value={input}
					onChange={(e) => setInput(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
					}}
					placeholder="Paste code or ask a follow-up question..."
					style={{
						flex: 1,
						padding: "15px",
						borderRadius: "8px",
						border: "1px solid #ccc",
						minHeight: "60px",
						fontFamily: "monospace",
						fontSize: "14px"
					}}
				/>
				<button
					onClick={sendMessage}
					disabled={isLoading}
					style={{
						padding: "0 30px",
						borderRadius: "8px",
						border: "none",
						background: isLoading ? "#ccc" : "#000",
						color: "white",
						cursor: isLoading ? "not-allowed" : "pointer",
						fontWeight: "bold"
					}}
				>
					{isLoading ? "..." : "Send"}
				</button>
			</div>
		</div>
	);
}
