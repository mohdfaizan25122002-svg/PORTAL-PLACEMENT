import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

export default function Chatbot() {
  const { auth } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "👋 Hi! I am PlacementBot, your AI Placement & Career Assistant. How can I help you today?",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setHasUnread(false);
    }
  }, [messages, isOpen]);

  if (!auth) return null;

  const handleSend = async (customText) => {
    const textToSend = customText || input;
    if (!textToSend.trim()) return;

    const userMsg = {
      sender: "user",
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setInput("");
    setIsTyping(true);

    try {
      const res = await fetch("http://localhost:5000/api/chatbot/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({ message: textToSend }),
      });
      const data = await res.json();
      
      const botReply = data.reply || "I am currently analyzing your placement query. Try asking about your readiness score or skill gaps!";
      
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            sender: "bot",
            text: botReply,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
        setIsTyping(false);
      }, 500);
    } catch (err) {
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            sender: "bot",
            text: "💡 Tip: You can boost your Placement Readiness Score by taking more assessments and practicing high-demand technical skills!",
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
        setIsTyping(false);
      }, 500);
    }
  };

  const quickPrompts = [
    "How to boost my score?",
    "What are my skill gaps?",
    "Show top job matches",
    "Interview prep tips",
  ];

  return (
    <div style={{ position: "fixed", bottom: "24px", right: "24px", zIndex: 9999 }}>
      {/* Chat Window */}
      {isOpen && (
        <div
          className="glass-panel"
          style={{
            width: "380px",
            height: "500px",
            display: "flex",
            flexDirection: "column",
            marginBottom: "16px",
            padding: "0",
            overflow: "hidden",
            boxShadow: "0 12px 40px rgba(0, 0, 0, 0.5)",
            border: "1px solid rgba(99, 102, 241, 0.3)",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "14px 18px",
              background: "linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.95))",
              borderBottom: "1px solid var(--border-glass)",
              display: "flex",
              justify: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  background: "linear-gradient(135deg, var(--primary), var(--accent-cyan))",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.1rem",
                  boxShadow: "0 2px 10px rgba(99, 102, 241, 0.4)",
                }}
              >
                🤖
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>PlacementBot AI</div>
                <div style={{ fontSize: "0.72rem", color: "var(--accent-emerald)", display: "flex", alignItems: "center", gap: "4px" }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--accent-emerald)" }} />
                  Online & Active
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--text-muted)",
                fontSize: "1.2rem",
                cursor: "pointer",
                padding: "4px",
              }}
            >
              ✕
            </button>
          </div>

          {/* Message Stream */}
          <div
            style={{
              flex: 1,
              padding: "16px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              background: "rgba(15, 23, 42, 0.4)",
            }}
          >
            {messages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
                  maxWidth: "85%",
                }}
              >
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: msg.sender === "user" ? "14px 14px 2px 14px" : "14px 14px 14px 2px",
                    background:
                      msg.sender === "user"
                        ? "linear-gradient(135deg, var(--primary), var(--primary-hover))"
                        : "rgba(30, 41, 59, 0.9)",
                    border: msg.sender === "bot" ? "1px solid var(--border-glass)" : "none",
                    color: "#ffffff",
                    fontSize: "0.88rem",
                    lineHeight: 1.4,
                  }}
                >
                  {msg.text}
                </div>
                <div
                  style={{
                    fontSize: "0.68rem",
                    color: "var(--text-muted)",
                    marginTop: "3px",
                    textAlign: msg.sender === "user" ? "right" : "left",
                  }}
                >
                  {msg.time}
                </div>
              </div>
            ))}

            {isTyping && (
              <div style={{ alignSelf: "flex-start", fontSize: "0.8rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                🤖 PlacementBot is typing...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions Chips */}
          <div
            style={{
              padding: "8px 12px",
              background: "rgba(15, 23, 42, 0.7)",
              borderTop: "1px solid rgba(255, 255, 255, 0.05)",
              display: "flex",
              gap: "6px",
              overflowX: "auto",
              whiteSpace: "nowrap",
            }}
          >
            {quickPrompts.map((prompt, pIdx) => (
              <button
                key={pIdx}
                onClick={() => handleSend(prompt)}
                style={{
                  padding: "4px 10px",
                  fontSize: "0.72rem",
                  borderRadius: "9999px",
                  background: "rgba(99, 102, 241, 0.15)",
                  border: "1px solid rgba(99, 102, 241, 0.3)",
                  color: "var(--accent-cyan)",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            style={{
              padding: "10px 12px",
              background: "rgba(15, 23, 42, 0.95)",
              borderTop: "1px solid var(--border-glass)",
              display: "flex",
              gap: "8px",
            }}
          >
            <input
              type="text"
              placeholder="Ask PlacementBot..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="form-input"
              style={{
                padding: "8px 12px",
                fontSize: "0.85rem",
                borderRadius: "8px",
              }}
            />
            <button type="submit" className="btn btn-primary btn-sm">
              Send
            </button>
          </form>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, var(--primary) 0%, var(--accent-cyan) 100%)",
          border: "2px solid rgba(255, 255, 255, 0.2)",
          color: "#ffffff",
          fontSize: "1.6rem",
          cursor: "pointer",
          boxShadow: "0 6px 20px rgba(99, 102, 241, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          transition: "transform 0.2s ease",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.08)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
      >
        {isOpen ? "✕" : "💬"}
        {!isOpen && hasUnread && (
          <span
            style={{
              position: "absolute",
              top: "-2px",
              right: "-2px",
              width: "14px",
              height: "14px",
              borderRadius: "50%",
              background: "var(--accent-rose)",
              border: "2px solid var(--bg-dark)",
            }}
          />
        )}
      </button>
    </div>
  );
}
