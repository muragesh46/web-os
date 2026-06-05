import { useState, useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Send, Sparkles, Trash2, Copy, Code2, Bug, Wand2, TestTube2, X, Bot } from 'lucide-react';
import useAgentStore from '@store/agent';

const CODE_IDE_SESSION = 'mai-code-ide';

const QUICK_PROMPTS = [
    { id: 'explain', label: 'Explain', icon: Code2,    text: 'Explain what this code does in simple terms.' },
    { id: 'fix',     label: 'Fix bugs', icon: Bug,     text: 'Find bugs and suggest fixes. Show corrected code in a fenced block.' },
    { id: 'refactor',label: 'Refactor', icon: Wand2,   text: 'Refactor this code for clarity and best practices. Return the full improved version in a code block.' },
    { id: 'tests',   label: 'Tests',    icon: TestTube2,text: 'Write unit tests for this code in the same language.' },
];

function extractCodeBlocks(content) {
    const blocks = [];
    const re = /```[\w]*\n([\s\S]*?)```/g;
    let m;
    while ((m = re.exec(content)) !== null) {
        if (m[1]?.trim()) blocks.push(m[1].trim());
    }
    return blocks;
}

const MD = ({ content }) => (
    <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
            code({ inline, children, ...p }) {
                return inline
                    ? <code className="ide-agent-inline-code" {...p}>{children}</code>
                    : <pre className="ide-agent-code"><code {...p}>{children}</code></pre>;
            },
            p: ({ children }) => <p className="ide-agent-p">{children}</p>,
        }}
    >
        {content}
    </ReactMarkdown>
);

export default function CodeIDEAgent({ fileName, language, code, onInsertCode, onClose }) {
    const [input, setInput] = useState('');
    const [ready, setReady] = useState(false);
    const chatEndRef = useRef(null);
    const inputRef = useRef(null);

    const {
        conversationHistory,
        isProcessing,
        isStreaming,
        processCommand,
        clearConversation,
        initAgent,
        switchSession,
        currentSessionId,
        aiStatus,
    } = useAgentStore();

    useEffect(() => {
        let cancelled = false;
        (async () => {
            await initAgent();
            if (cancelled) return;
            if (currentSessionId !== CODE_IDE_SESSION) {
                await switchSession(CODE_IDE_SESSION, 'Code IDE');
            }
            setReady(true);
        })();
        return () => { cancelled = true; };
    }, []);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView?.({ behavior: 'smooth' });
    }, [conversationHistory, isProcessing]);

    const buildApiMessage = useCallback((userText) => {
        const snippet = code.length > 12000 ? `${code.slice(0, 12000)}\n…(truncated)` : code;
        return `${userText}

---
**Code IDE context**
- File: \`${fileName}\`
- Language: ${language}

\`\`\`${language}
${snippet}
\`\`\``;
    }, [code, fileName, language]);

    const sendMessage = useCallback(async (text) => {
        const trimmed = text.trim();
        if (!trimmed || isProcessing) return;
        setInput('');
        await processCommand(trimmed, {
            apiMessage: buildApiMessage(trimmed),
            extraContext: {
                personaTone: 'expert coding assistant — concise and practical',
                personaPrompt: `You are embedded in Code IDE. Focus on the user's code: explain, debug, refactor, generate snippets. Prefer fenced code blocks matching ${language}. When suggesting edits, provide complete runnable snippets.`,
            },
        });
    }, [buildApiMessage, isProcessing, processCommand]);

    const handleSubmit = (e) => {
        e.preventDefault();
        sendMessage(input);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage(input);
        }
    };

    const visibleHistory = conversationHistory.filter(m => m.role === 'user' || m.role === 'agent');

    return (
        <aside className="ide-agent-panel">

            {/* ── Header ── */}
            <div className="ide-agent-header">
                <div className="ide-agent-title">
                    <div className="ide-agent-sparkle-bg">
                        <Sparkles size={13} color="#fff" />
                    </div>
                    <div>
                        <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.2 }}>MAI</div>
                        <div style={{ fontSize: 10, color: 'var(--ide-text-muted)', lineHeight: 1.2 }}>
                            {fileName}
                        </div>
                    </div>
                    <span className={`ide-agent-status ${aiStatus === 'ok' ? 'online' : ''}`}>
                        {aiStatus === 'ok' ? '● Online' : '○ Offline'}
                    </span>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                    <button
                        type="button"
                        className="ide-agent-icon-btn"
                        onClick={clearConversation}
                        title="Clear chat"
                        disabled={!visibleHistory.length}
                    >
                        <Trash2 size={12} />
                    </button>
                    {onClose && (
                        <button
                            type="button"
                            className="ide-agent-icon-btn"
                            onClick={onClose}
                            title="Close AI panel"
                        >
                            <X size={12} />
                        </button>
                    )}
                </div>
            </div>

            {/* ── Quick Prompts ── */}
            <div className="ide-agent-quick">
                {QUICK_PROMPTS.map(({ id, label, icon: Icon, text }) => (
                    <button
                        key={id}
                        type="button"
                        className="ide-agent-quick-btn"
                        onClick={() => sendMessage(text)}
                        disabled={isProcessing || !ready}
                        title={text}
                    >
                        <Icon size={11} />
                        {label}
                    </button>
                ))}
            </div>

            {/* ── Chat ── */}
            <div className="ide-agent-chat">
                {!ready && (
                    <div className="ide-agent-empty">
                        <div className="ide-agent-typing">
                            <span /><span /><span />
                        </div>
                        <p style={{ marginTop: 8, color: 'var(--ide-text-dim)', fontSize: 11 }}>
                            Connecting to MAI…
                        </p>
                    </div>
                )}

                {ready && visibleHistory.length === 0 && (
                    <div className="ide-agent-empty">
                        <div className="ide-agent-bot-icon">
                            <Bot size={22} color="#a78bfa" />
                        </div>
                        <p style={{ margin: 0, fontWeight: 600, color: 'var(--ide-text)', fontSize: 13 }}>
                            Ask MAI anything
                        </p>
                        <p style={{ margin: '6px 0 0', color: 'var(--ide-text-muted)', fontSize: 11.5, lineHeight: 1.5, maxWidth: 200, textAlign: 'center' }}>
                            Explain, debug, refactor, or generate tests for your code.
                        </p>
                    </div>
                )}

                {visibleHistory.map((msg, i) => {
                    const isUser = msg.role === 'user';
                    const blocks = !isUser ? extractCodeBlocks(msg.content) : [];
                    return (
                        <div key={i} className={`ide-agent-msg ${isUser ? 'user' : 'agent'}`}>
                            {!isUser && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                    <div className="ide-agent-sparkle-sm">
                                        <Sparkles size={9} color="#fff" />
                                    </div>
                                    <span style={{ fontSize: 10, color: 'var(--ide-text-dim)', fontWeight: 600 }}>MAI</span>
                                </div>
                            )}
                            <div className="ide-agent-bubble">
                                {isUser ? (
                                    <span style={{ fontSize: 12.5, lineHeight: 1.5 }}>{msg.content}</span>
                                ) : (
                                    <div className="ide-agent-md">
                                        <MD content={msg.content} />
                                        {msg.isStreaming && <span className="ide-agent-cursor">▋</span>}
                                    </div>
                                )}
                            </div>
                            {!isUser && !msg.isStreaming && blocks.length > 0 && (
                                <button
                                    type="button"
                                    className="ide-agent-insert"
                                    onClick={() => onInsertCode(blocks[blocks.length - 1])}
                                    title="Insert this code into the editor"
                                >
                                    ↳ Insert code
                                </button>
                            )}
                            {!isUser && !msg.isStreaming && (
                                <button
                                    type="button"
                                    className="ide-agent-copy"
                                    onClick={() => navigator.clipboard.writeText(msg.content)}
                                    title="Copy response"
                                >
                                    <Copy size={10} />
                                </button>
                            )}
                        </div>
                    );
                })}

                {(isProcessing || isStreaming) && !visibleHistory.at(-1)?.isStreaming && (
                    <div className="ide-agent-msg agent">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                            <div className="ide-agent-sparkle-sm">
                                <Sparkles size={9} color="#fff" />
                            </div>
                            <span style={{ fontSize: 10, color: 'var(--ide-text-dim)', fontWeight: 600 }}>MAI</span>
                        </div>
                        <div className="ide-agent-typing">
                            <span /><span /><span />
                        </div>
                    </div>
                )}

                <div ref={chatEndRef} />
            </div>

            {/* ── Input ── */}
            <form className="ide-agent-input-row" onSubmit={handleSubmit}>
                <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={ready ? "Ask about your code… (Enter to send)" : "Connecting…"}
                    disabled={isProcessing || !ready}
                />
                <button
                    type="submit"
                    disabled={!input.trim() || isProcessing || !ready}
                    aria-label="Send message"
                    title="Send"
                >
                    <Send size={13} />
                </button>
            </form>
        </aside>
    );
}
