import { useAgent } from "agents/react";
import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

export default function App() {
	const agent = useAgent({
		agent: "CodeReviewAgent",
		name: "leetcode-session",
	});

	const [input, setInput] = useState("");
	const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
	const [isStreaming, setIsStreaming] = useState(false);

	const bottomRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLTextAreaElement>(null);

	useEffect(() => {
		if (!agent) return;

		agent.onmessage = (event: MessageEvent) => {
			try {
				const data = JSON.parse(event.data);
				if (data.type === "start") {
					setIsStreaming(true);
					setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
				} else if (data.type === "chunk") {
					setMessages((prev) => {
						const newHistory = [...prev];
						const lastMsg = newHistory[newHistory.length - 1];
						if (lastMsg && lastMsg.role === "assistant") lastMsg.content += data.text;
						return newHistory;
					});
				} else if (data.type === "done") {
					setIsStreaming(false);
				} else if (data.type === "reset") {
					setMessages([]);
				}
			} catch (e) { console.error(e); }
		};
	}, [agent]);

	const sendMessage = () => {
		if (!input.trim() || !agent) return;
		setMessages((p) => [...p, { role: "user", content: input }]);
		agent.send(input);
		setInput("");
	};

	const handleReset = () => {
		if (confirm("Start a new problem?")) agent?.send("/reset");
	};

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages, isStreaming]);

	return (
		<div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 20px", fontFamily: "system-ui, sans-serif" }}>
			<header style={{ marginBottom: "30px", borderBottom: "1px solid #eee", paddingBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
				<div>
					<h1 style={{ margin: 0, fontSize: "24px" }}>🚀 LeetCode Coach</h1>
					<p style={{ margin: "5px 0 0", color: "#666" }}>Analyze Big O & Get Hints</p>
				</div>
				{messages.length > 0 && (
					<button onClick={handleReset} style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #ddd", background: "#fff", cursor: "pointer", fontSize: "12px" }}>
						New Problem
					</button>
				)}
			</header>

			<div style={{ border: "1px solid #e1e1e1", borderRadius: "12px", height: "60vh", overflowY: "auto", padding: "20px", backgroundColor: "#fff", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}>
				{messages.length === 0 && (
					<div onClick={() => inputRef.current?.focus()} style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#999", flexDirection: "column", cursor: "text" }}>
						<p style={{ fontSize: "1.2rem", fontWeight: "bold" }}>Paste your solution here...</p>
						<p style={{ fontSize: "0.9rem" }}>I will tell you the Time & Space complexity.</p>
					</div>
				)}

				{messages.map((msg, i) => (
					<div key={i} style={{ marginBottom: "20px", textAlign: msg.role === "user" ? "right" : "left" }}>
						<div style={{ display: "inline-block", borderRadius: "12px", background: msg.role === "user" ? "#000" : "transparent", color: msg.role === "user" ? "#fff" : "#000", maxWidth: "100%", width: msg.role === "user" ? "auto" : "100%", textAlign: "left" }}>
							{msg.role === "user" ? (
								<div style={{ padding: "12px 18px", whiteSpace: "pre-wrap" }}>{msg.content}</div>
							) : (
								<div style={{ fontSize: "15px", lineHeight: "1.6" }}>
									<ReactMarkdown
										remarkPlugins={[remarkGfm]}
										components={{
											// --- PRETTY STYLES ---
											h2: ({ node, ...props }) => (
												<h2 style={{ fontSize: "1.2rem", borderBottom: "1px solid #eee", paddingBottom: "5px", marginTop: "20px", marginBottom: "10px", color: "#333" }} {...props} />
											),
											blockquote: ({ node, ...props }) => (
												<div style={{ borderLeft: "4px solid #007aff", background: "#f0f7ff", padding: "10px 15px", borderRadius: "0 8px 8px 0", margin: "10px 0", color: "#004499" }} {...props} />
											),
											ul: ({ node, ...props }) => (
												<ul style={{ paddingLeft: "20px", marginBottom: "10px" }} {...props} />
											),
											li: ({ node, ...props }) => (
												<li style={{ marginBottom: "5px" }} {...props} />
											),
											code(props) {
												const { children, className, node, ...rest } = props;
												const match = /language-(\w+)/.exec(className || '');
												return match ? (
													<SyntaxHighlighter {...rest} PreTag="div" children={String(children).replace(/\n$/, '')} language={match[1]} style={vscDarkPlus} customStyle={{ borderRadius: "8px", margin: "10px 0" }} />
												) : <code {...rest} style={{ background: "#f4f4f5", padding: "2px 5px", borderRadius: "4px", color: "#d63384", fontFamily: "monospace" }}>{children}</code>;
											}
										}}>{msg.content}</ReactMarkdown>
								</div>
							)}
						</div>
					</div>
				))}
				{isStreaming && <span style={{ display: "inline-block", width: "8px", height: "15px", background: "#000", animation: "blink 1s infinite", marginLeft: "5px" }}></span>}
				<div ref={bottomRef} />
			</div>

			<div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
				<textarea ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} placeholder="Paste solution..." style={{ flex: 1, padding: "15px", borderRadius: "8px", border: "1px solid #ccc", minHeight: "60px", fontFamily: "monospace", fontSize: "14px" }} />
				<button onClick={sendMessage} disabled={isStreaming} style={{ padding: "0 30px", borderRadius: "8px", border: "none", background: isStreaming ? "#ccc" : "#000", color: "white", cursor: isStreaming ? "not-allowed" : "pointer", fontWeight: "bold" }}>Send</button>
			</div>
		</div>
	);
}
