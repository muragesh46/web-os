import { useCallback, useState, useEffect, useRef } from "react";
import { startChatSession } from "@store/gemini";
import WindowControls from "@components/common/WindowControl.jsx";
import WindowWrapper from "@hoc/WindowWrapper.jsx";
import { Send, RotateCcw, AlertCircle, Bot, User } from "lucide-react";
import "@style/ask.css";

function Ask() {
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [chatSession, setChatSession] = useState(null);
    const messagesEndRef = useRef(null);
    const textareaRef = useRef(null);

    useEffect(() => {
        startChatSession()
            .then((session) => setChatSession(session))
            .catch((e) => setError(e?.message || "Failed to initialize chat."));
    }, []);

    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    useEffect(() => scrollToBottom(), [messages, error, loading]);

    const send = useCallback(async () => {
        const text = input.trim();
        if (!text || loading) return;
        if (!chatSession) return setError("Chat session not ready. Please click Retry.");

        setLoading(true);
        setError("");
        setMessages((prev) => [...prev, { role: "user", text }]);
        setInput("");

        try {
            const result = await chatSession.sendMessage(text);
            const responseText = result.response.text();
            setMessages((prev) => [...prev, { role: "model", text: responseText }]);
        } catch (e) {
            setError(e?.message || "Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    }, [input, loading, chatSession]);

    const onKeyDown = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } };

    const handleReconnect = async () => {
        if (loading) return;
        setLoading(true);
        startChatSession()
            .then((session) => { setChatSession(session); setError(""); })
            .catch((e) => setError(e?.message || "Reconnect failed."))
            .finally(() => setLoading(false));
    };

    const clearChat = async () => {
        setMessages([]);
        setError("");
        startChatSession().then(setChatSession).catch((e) => setError(e.message));
    };

    return (
        <div className="ask-container">
            <div id="window-header" className="ask-header">
                <div className="ask-header-left">
                    <WindowControls target="Ask" />
                    <h2 className="ask-title">Ask Muragesh's AI</h2>
                </div>
                <button onClick={clearChat} title="Clear Chat" className="ask-clear-btn">
                    <RotateCcw size={14} />
                </button>
            </div>

            <div className="ask-messages">
                {messages.length === 0 && !error && (
                    <div className="ask-empty">
                        <div className="ask-empty-logo"><Bot size={32} /></div>
                        <h3 className="ask-empty-heading">I am Muragesh's AI</h3>
                        <p className="ask-empty-text">
                            I can help you with coding, writing, or just having a conversation.
                        </p>
                    </div>
                )}

                {messages.map((msg, i) => (
                    <div key={i} className={`ask-msg ${msg.role === "user" ? "ask-user" : "ask-bot"}`}>
                        <div className={`ask-avatar ${msg.role === "user" ? "ask-avatar-user" : "ask-avatar-bot"}`}>
                            {msg.role === "user" ? <User size={14} /> : <Bot size={14} />}
                        </div>
                        <div className={`ask-bubble ${msg.role === "user" ? "ask-bubble-user" : "ask-bubble-bot"}`}>
                            <p className="whitespace-pre-wrap">{msg.text}</p>
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className="ask-loading">
                        <div className="ask-avatar ask-avatar-bot">
                            <Bot size={14} /></div>
                        <div className="ask-loading-dots">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="ask-error">
                        <AlertCircle size={16} />
                        <p>{error}</p>
                        <button onClick={handleReconnect} disabled={loading}>Retry</button>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            <div className="ask-input">
                <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={onKeyDown}
                    placeholder={!chatSession ? "Chat not connected. Click Retry." : loading ? "Sending..." : "Type a message..."}
                    disabled={loading || !chatSession}
                />
                <button onClick={send} disabled={!input.trim() || loading || !chatSession}>
                    <Send size={16} />
                </button>
            </div>
        </div>
    );
}

const AskWindow = WindowWrapper(Ask, "Ask");
export default AskWindow;