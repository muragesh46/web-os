import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import WindowWrapper from '@hoc/WindowWrapper.jsx';
import WindowControls from '@components/common/WindowControl.jsx';
import useAgentStore from '@store/agent';
import { askGemini } from '@store/gemini';
import useNotificationStore from '@store/notifications';
import {
    Send, KeyRound, Trash2, Eye, EyeOff, Sparkles, ExternalLink,
    Check, Copy, RefreshCw, Zap
} from 'lucide-react';
import '@style/ask.css';

const DEFAULT_DEMO_KEY = 'AIzaSyBleqWtfAQ6gGlKhP8rNFcOR2jxDrQrbQo';

const SUGGESTIONS = [
    "Explain quantum computing in simple terms",
    "Help me write a clean React custom hook",
    "Switch my Web OS desktop to dark mode",
    "What are 5 interesting facts about the universe?"
];

const Ask = () => {
    const { geminiApiKey, setGeminiApiKey, executeWebOSAction } = useAgentStore();

    // Persisted API key check
    const storedKey = geminiApiKey || localStorage.getItem('gemini_api_key') || '';
    const [apiKey, setApiKey] = useState(storedKey);
    const [hasConfiguredKey, setHasConfiguredKey] = useState(Boolean(storedKey));
    const [showKeyModal, setShowKeyModal] = useState(!storedKey);
    const [keyInput, setKeyInput] = useState(storedKey);
    const [showKeyText, setShowKeyText] = useState(false);
    const [savedSuccess, setSavedSuccess] = useState(false);

    // Chat state
    const [messages, setMessages] = useState(() => {
        try {
            const saved = localStorage.getItem('ask_chat_history');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatEndRef = useRef(null);
    const inputRef = useRef(null);

    // Save chat history to localStorage
    useEffect(() => {
        try {
            localStorage.setItem('ask_chat_history', JSON.stringify(messages.slice(-50)));
        } catch {}
    }, [messages]);

    // Scroll to bottom when new messages arrive
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    // Focus input when window is open and configured
    useEffect(() => {
        if (hasConfiguredKey && !showKeyModal) {
            setTimeout(() => inputRef.current?.focus(), 150);
        }
    }, [hasConfiguredKey, showKeyModal]);

    // Save and activate API key
    const handleSaveKey = (keyToSave) => {
        const finalKey = (keyToSave !== undefined ? keyToSave : keyInput).trim();
        if (!finalKey) return;

        setGeminiApiKey(finalKey);
        localStorage.setItem('gemini_api_key', finalKey);
        setApiKey(finalKey);
        setKeyInput(finalKey);
        setHasConfiguredKey(true);
        setShowKeyModal(false);
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 2500);

        useNotificationStore.getState().addNotification(
            'Ask AI',
            'Gemini API Key activated successfully!',
            'success'
        );
    };

    // Use default demo key
    const handleUseDemoKey = () => {
        setKeyInput(DEFAULT_DEMO_KEY);
        handleSaveKey(DEFAULT_DEMO_KEY);
    };

    // Send chat prompt
    const handleSend = async (textToSend) => {
        const query = (textToSend || input).trim();
        if (!query || isLoading) return;

        // If key is not configured, open onboarding
        if (!hasConfiguredKey && !apiKey) {
            setShowKeyModal(true);
            return;
        }

        setInput('');
        const userMsg = { role: 'user', content: query, timestamp: Date.now() };
        setMessages((prev) => [...prev, userMsg]);
        setIsLoading(true);

        try {
            const reply = await askGemini(query);

            // Check if reply contains any Web OS actions
            const actionRegex = /\[WEBOS_ACTION:([^:]+):(.*?)\]/g;
            let match;
            while ((match = actionRegex.exec(reply)) !== null) {
                try {
                    executeWebOSAction(match[1], JSON.parse(match[2]));
                } catch {}
            }
            const cleanReply = reply.replace(actionRegex, '').trim();

            const assistantMsg = {
                role: 'assistant',
                content: cleanReply || "I've processed your request.",
                timestamp: Date.now()
            };
            setMessages((prev) => [...prev, assistantMsg]);
        } catch (err) {
            const errorMsg = {
                role: 'assistant',
                content: `⚠️ **AI Error**: ${err.message || 'Failed to get response.'}\n\nPlease verify your Gemini API key in settings.`,
                timestamp: Date.now(),
                isError: true,
            };
            setMessages((prev) => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClearChat = () => {
        setMessages([]);
        localStorage.removeItem('ask_chat_history');
    };

    const handleCopy = (text) => {
        navigator.clipboard.writeText(text);
        useNotificationStore.getState().addNotification('Ask AI', 'Copied to clipboard', 'info');
    };

    return (
        <section id="Ask" className="ask-window">
            {/* Header / Drag Handle */}
            <div id="window-header" className="ask-header" data-drag-handle="true">
                <WindowControls target="Ask" />

                <div className="ask-header-center">
                    <img src="/images/Ask.png" alt="Ask AI" className="ask-header-avatar" />
                    <span>Ask AI</span>
                    <span className="ask-model-pill">
                        <Zap size={11} /> Gemini 2.5
                    </span>
                </div>

                <div className="ask-header-actions">
                    <button
                        className="ask-header-btn"
                        onClick={() => setShowKeyModal(!showKeyModal)}
                        title="Gemini API Key Settings"
                    >
                        <KeyRound size={15} />
                    </button>
                    {messages.length > 0 && (
                        <button
                            className="ask-header-btn"
                            onClick={handleClearChat}
                            title="Clear conversation"
                        >
                            <Trash2 size={15} />
                        </button>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="ask-chat-body">
                {/* Onboarding / API Key configuration modal */}
                {showKeyModal ? (
                    <div className="ask-onboarding">
                        <img src="/images/Ask.png" alt="Gemini" className="ask-onboarding-icon" />
                        <h2 className="ask-onboarding-title">Activate Ask AI</h2>
                        <p className="ask-onboarding-desc">
                            Connect Google Gemini to unlock instant intelligent answers, code generation, and system control.
                            Your key is stored securely in your browser and you won't be asked again.
                        </p>

                        <div className="ask-key-input-wrap">
                            <input
                                type={showKeyText ? 'text' : 'password'}
                                className="ask-key-input"
                                placeholder="Paste your Gemini API key (AIzaSy…)"
                                value={keyInput}
                                onChange={(e) => setKeyInput(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleSaveKey(); }}
                                autoFocus
                            />
                            <button
                                type="button"
                                className="ask-key-toggle-btn"
                                onClick={() => setShowKeyText(!showKeyText)}
                                title={showKeyText ? 'Hide key' : 'Show key'}
                            >
                                {showKeyText ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                        </div>

                        <button
                            type="button"
                            className="ask-btn-primary"
                            onClick={() => handleSaveKey()}
                            disabled={!keyInput.trim()}
                        >
                            Save & Start Chatting
                        </button>

                        <button
                            type="button"
                            className="ask-btn-secondary"
                            onClick={handleUseDemoKey}
                        >
                            <Sparkles size={14} /> Use Free Default Key
                        </button>

                        <div>
                            <a
                                href="https://aistudio.google.com/app/apikey"
                                target="_blank"
                                rel="noreferrer"
                                className="ask-get-key-link"
                            >
                                Get a free Gemini API key from Google AI Studio <ExternalLink size={12} />
                            </a>
                        </div>
                    </div>
                ) : messages.length === 0 ? (
                    /* Empty state with suggested prompts */
                    <div className="ask-empty-state">
                        <img src="/images/Ask.png" alt="Ask AI" className="ask-onboarding-icon" />
                        <h3 className="ask-empty-title">What can I help with?</h3>
                        <p className="ask-empty-subtitle">Powered by Google Gemini 2.5 Flash</p>

                        <div className="ask-suggestions">
                            {SUGGESTIONS.map((item, idx) => (
                                <button
                                    key={idx}
                                    className="ask-suggestion-chip"
                                    onClick={() => handleSend(item)}
                                >
                                    <Sparkles size={13} style={{ color: '#3b82f6', flexShrink: 0 }} />
                                    <span>{item}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    /* Messages List */
                    messages.map((msg, index) => {
                        const isUser = msg.role === 'user';
                        return (
                            <div
                                key={index}
                                className={`ask-message-row ${isUser ? 'ask-message-user-row' : 'ask-message-assistant-row'}`}
                            >
                                {!isUser && (
                                    <img
                                        src="/images/Ask.png"
                                        alt="AI"
                                        style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, marginTop: 4 }}
                                    />
                                )}
                                <div className={`ask-bubble ${isUser ? 'ask-bubble-user' : 'ask-bubble-assistant'}`}>
                                    {isUser ? (
                                        <p>{msg.content}</p>
                                    ) : (
                                        <div className="ask-markdown">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {msg.content}
                                            </ReactMarkdown>
                                        </div>
                                    )}
                                    <div className="ask-bubble-footer">
                                        <span>{new Date(msg.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        {!isUser && (
                                            <button
                                                className="ask-copy-btn"
                                                onClick={() => handleCopy(msg.content)}
                                                title="Copy message"
                                            >
                                                <Copy size={11} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}

                {/* Loading indicator */}
                {isLoading && (
                    <div className="ask-typing-row">
                        <img
                            src="/images/Ask.png"
                            alt="AI"
                            style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0 }}
                        />
                        <div className="ask-typing-bubble">
                            <span className="ask-dot" />
                            <span className="ask-dot" />
                            <span className="ask-dot" />
                        </div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>

            {/* Bottom Input Area */}
            <form
                className="ask-input-bar"
                onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                }}
            >
                <input
                    ref={inputRef}
                    type="text"
                    className="ask-text-input"
                    placeholder="Ask Gemini anything or type a command…"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={isLoading}
                />
                <button
                    type="submit"
                    className="ask-send-btn"
                    disabled={!input.trim() || isLoading}
                    title="Send"
                >
                    <Send size={15} />
                </button>
            </form>
        </section>
    );
};

const AskWindow = WindowWrapper(Ask, 'Ask');

export default AskWindow;
