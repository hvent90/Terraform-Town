import { useState, useRef } from "react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export function AssistantPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  function handleSend() {
    const trimmed = input.trim();
    if (!trimmed) return;
    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setInput("");
  }

  return (
    <div
      data-testid="assistant-panel"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "#1e1e1e",
        color: "#ccc",
        borderLeft: "1px solid #333",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "8px 12px",
          borderBottom: "1px solid #333",
        }}
      >
        <span style={{ fontWeight: "bold", fontSize: "13px" }}>Assistant</span>
        <button
          data-testid="chat-toggle"
          onClick={() => setCollapsed((c) => !c)}
          style={{
            background: "none",
            border: "1px solid #555",
            color: "#ccc",
            cursor: "pointer",
            padding: "2px 8px",
            fontSize: "12px",
          }}
        >
          {collapsed ? "Expand" : "Collapse"}
        </button>
      </div>

      {!collapsed && (
        <>
          <div
            data-testid="chat-thread"
            style={{
              flex: 1,
              overflow: "auto",
              padding: "8px",
            }}
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                data-testid="chat-message"
                data-role={msg.role}
                style={{
                  padding: "6px 10px",
                  marginBottom: "6px",
                  borderRadius: "4px",
                  background: msg.role === "user" ? "#094771" : "#2d2d2d",
                  fontSize: "13px",
                  whiteSpace: "pre-wrap",
                }}
              >
                {msg.content}
              </div>
            ))}
          </div>

          <div
            style={{
              display: "flex",
              gap: "6px",
              padding: "8px",
              borderTop: "1px solid #333",
            }}
          >
            <textarea
              ref={inputRef}
              data-testid="chat-input"
              rows={2}
              value={input}
              onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
              placeholder="Ask about your Terraform config..."
              style={{
                flex: 1,
                background: "#2d2d2d",
                color: "#ccc",
                border: "1px solid #555",
                padding: "6px 10px",
                fontSize: "13px",
                resize: "none",
                fontFamily: "inherit",
              }}
            />
            <button
              data-testid="chat-send"
              onClick={handleSend}
              style={{
                background: "#333",
                color: "#ccc",
                border: "1px solid #555",
                padding: "6px 12px",
                cursor: "pointer",
                fontSize: "13px",
                alignSelf: "flex-end",
              }}
            >
              Send
            </button>
          </div>
        </>
      )}
    </div>
  );
}
