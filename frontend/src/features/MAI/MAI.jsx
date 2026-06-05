import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
    Mic, MicOff, Send, Trash2, ChevronDown, Volume2, VolumeX,
    Paperclip, X, Zap, ZapOff, ChevronRight, Activity, Star,
    Search, Download, Settings, Plus, MessageSquare, Bell, AlertCircle, Wifi, WifiOff,
    Copy, RefreshCw, MoreVertical
} from 'lucide-react';
import useAgentStore from '@store/agent';
import '../../style/MAI.css';

// ── Helpers ────────────────────────────────────────────────────────────────────
const fmt = d => new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

// ── Markdown renderer ─────────────────────────────────────────────────────────
const MD = ({ content }) => (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
        code({ inline, children, ...p }) {
            return inline
                ? <code className="mai-inline-code" {...p}>{children}</code>
                : <div className="mai-code-block"><pre><code {...p}>{children}</code></pre></div>;
        },
        p: ({ children }) => <p className="mai-md-p">{children}</p>,
        ul: ({ children }) => <ul className="mai-md-ul">{children}</ul>,
        ol: ({ children }) => <ol className="mai-md-ol">{children}</ol>,
        li: ({ children }) => <li className="mai-md-li">{children}</li>,
        strong: ({ children }) => <strong className="mai-md-strong">{children}</strong>,
        a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="mai-md-a">{children}</a>,
        h1: ({ children }) => <h3 className="mai-md-h">{children}</h3>,
        h2: ({ children }) => <h3 className="mai-md-h">{children}</h3>,
        h3: ({ children }) => <h3 className="mai-md-h">{children}</h3>,
    }}>{content}</ReactMarkdown>
);

const StreamCursor = () => <span className="mai-stream-cursor">▋</span>;

// ── Chat Bubble ────────────────────────────────────────────────────────────────
function ChatBubble({ message, index, starred, onStar, visible, onCopy, onRegenerate }) {
    if (!visible) return null;
    const isUser = message.role === 'user';
    return (
        <div className={`agent-bubble-row ${isUser ? 'agent-bubble-user-row' : 'agent-bubble-agent-row'}`}>
            {!isUser && (
                <div className="agent-header-orb" style={{ padding: 0, background: 'transparent', boxShadow: 'none' }}>
                    <img src="/images/Ask.png" alt="AI" style={{ width: 24, height: 24, objectFit: 'cover', borderRadius: '50%' }} />
                </div>
            )}
            <div className={`agent-bubble ${isUser ? 'agent-bubble-user' : 'agent-bubble-agent'} ${message.isError ? 'agent-bubble-error' : ''}`}>
                {message.image && <img src={message.image} alt="attached" className="mai-attached-img" />}
                {isUser
                    ? <p className="agent-bubble-text">{message.content}</p>
                    : <div className="agent-bubble-text mai-markdown"><MD content={message.content} />{message.isStreaming && <StreamCursor />}</div>
                }
                {!message.isStreaming && (
                    <div className="mai-bubble-footer">
                        <span className="agent-bubble-time">{fmt(message.timestamp)}</span>
                        {!isUser && (
                            <div className="mai-bubble-actions">
                                <button className="mai-action-btn" onClick={() => onCopy(message.content)} title="Copy"><Copy size={11} /></button>
                                <button className="mai-action-btn" onClick={() => onRegenerate()} title="Regenerate"><RefreshCw size={11} /></button>
                                <button className={`mai-star-btn ${starred ? 'mai-star-active' : ''}`} onClick={() => onStar(index)} title={starred ? 'Unstar' : 'Star'}>
                                    <Star size={11} fill={starred ? 'currentColor' : 'none'} />
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Typing indicator ──────────────────────────────────────────────────────────
function TypingIndicator({ toolName }) {
    const names = { web_search: 'Searching web', mac_open_app: 'Opening Mac app', mac_set_volume: 'Adjusting volume', mac_say: 'Speaking', mac_get_battery: 'Checking battery', mac_get_system_info: 'Getting info', mac_run_shell: 'Running command', get_current_time: 'Checking time', calculate: 'Calculating', open_webos_app: 'Opening app', send_webos_notification: 'Sending notification' };
    const label = toolName ? (names[toolName] || toolName.replace(/_/g, ' ')) : 'Thinking';
    return (
        <div className="agent-typing-row">
            <div className="agent-header-orb" style={{ padding: 0, background: 'transparent', boxShadow: 'none' }}>
                <img src="/images/Ask.png" alt="AI" style={{ width: 24, height: 24, objectFit: 'cover', borderRadius: '50%' }} />
            </div>
            <div className="agent-typing-bubble">
                <span className="agent-tool-label">{label}…</span>
                <div className="agent-typing-dots"><span /><span /><span /></div>
            </div>
        </div>
    );
}

// ── Offline Banner ────────────────────────────────────────────────────────────
function OfflineBanner({ status }) {
    if (status === 'ok' || status === 'unknown') return null;
    return (
        <div className="mai-offline-banner">
            <WifiOff size={12} />
            <span>Ollama offline — run <code>ollama serve</code> to connect</span>
        </div>
    );
}

// ── Threads Sidebar ───────────────────────────────────────────────────────────
function ThreadsSidebar({ sessions, currentId, onSwitch, onDelete, onNew, onClose }) {
    return (
        <div className="mai-sidebar">
            <div className="mai-sidebar-header">
                <span className="mai-sidebar-title">Conversations</span>
                <button className="agent-icon-btn" onClick={onNew} title="New conversation"><Plus size={14} /></button>
                <button className="agent-icon-btn" onClick={onClose} title="Close"><X size={14} /></button>
            </div>
            <div className="mai-sidebar-list">
                {sessions.length === 0 && <p className="mai-sidebar-empty">No saved conversations</p>}
                {sessions.map(s => (
                    <div key={s.sessionId} className={`mai-sidebar-item ${s.sessionId === currentId ? 'mai-sidebar-active' : ''}`}>
                        <button className="mai-sidebar-btn" onClick={() => onSwitch(s.sessionId, s.title)}>
                            <MessageSquare size={12} />
                            <span>{s.title || `Chat ${s.sessionId.slice(-6)}`}</span>
                            <span className="mai-sidebar-count">{s.messageCount}</span>
                        </button>
                        <button className="mai-sidebar-del" onClick={() => onDelete(s.sessionId)} title="Delete"><X size={11} /></button>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Settings Panel ────────────────────────────────────────────────────────────
function SettingsPanel({ store, onClose }) {
    const [name, setName] = useState(store.personaName);
    const [tone, setTone] = useState(store.personaTone);
    const [prompt, setPrompt] = useState(store.personaPrompt);
    const [reminderMsg, setReminderMsg] = useState('');
    const [reminderMin, setReminderMin] = useState(5);

    const save = () => { store.setPersona(name, tone, prompt); onClose(); };
    const scheduleReminder = () => {
        if (reminderMsg.trim()) {
            store.scheduleReminder(reminderMsg.trim(), reminderMin * 60000);
            setReminderMsg('');
        }
    };

    return (
        <div className="mai-settings-panel">
            <div className="mai-settings-header">
                <span>MAI Settings</span>
                <button className="agent-icon-btn" onClick={onClose}><X size={14} /></button>
            </div>
            <div className="mai-settings-body">
                {/* Persona */}
                <div className="mai-settings-section">
                    <h4 className="mai-settings-h">Persona</h4>
                    <label className="mai-settings-label">Agent name</label>
                    <input className="mai-settings-input" value={name} onChange={e => setName(e.target.value)} placeholder="MAI" />
                    <label className="mai-settings-label">Tone</label>
                    <select className="mai-settings-input" value={tone} onChange={e => setTone(e.target.value)}>
                        <option>concise and friendly</option>
                        <option>professional and formal</option>
                        <option>casual and witty</option>
                        <option>detailed and thorough</option>
                    </select>
                    <label className="mai-settings-label">Custom instructions</label>
                    <textarea className="mai-settings-input mai-settings-ta" value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="e.g. Always respond in bullet points..." />
                </div>
                {/* Voice */}
                <div className="mai-settings-section">
                    <h4 className="mai-settings-h">Voice (TTS)</h4>
                    <label className="mai-settings-label">Voice</label>
                    <select className="mai-settings-input" value={store.selectedVoiceURI || ''} onChange={e => store.setSelectedVoiceURI(e.target.value || null)}>
                        <option value="">System default</option>
                        {store.availableVoices.map(v => <option key={v.voiceURI} value={v.voiceURI}>{v.name} ({v.lang})</option>)}
                    </select>
                </div>
                {/* Reminders */}
                <div className="mai-settings-section">
                    <h4 className="mai-settings-h">Proactive Reminders</h4>
                    <label className="mai-settings-label">Reminder message</label>
                    <input className="mai-settings-input" value={reminderMsg} onChange={e => setReminderMsg(e.target.value)} placeholder="e.g. Take a break!" />
                    <label className="mai-settings-label">In (minutes)</label>
                    <input className="mai-settings-input" type="number" min={1} max={60} value={reminderMin} onChange={e => setReminderMin(Number(e.target.value))} />
                    <button className="mai-settings-btn mai-settings-btn-sm" onClick={scheduleReminder} disabled={!reminderMsg.trim()}>
                        <Bell size={12} /> Schedule Reminder
                    </button>
                    {store.pendingReminders.length > 0 && (
                        <div className="mai-reminder-list">
                            {store.pendingReminders.map(r => (
                                <div key={r.id} className="mai-reminder-item">
                                    <Bell size={10} /> {r.message} <span>@ {new Date(r.firesAt).toLocaleTimeString()}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                {/* Quota */}
                {store.ollamaLoad && (
                    <div className="mai-settings-section">
                        <h4 className="mai-settings-h">Ollama Status</h4>
                        <div className="mai-quota-bar">
                            <div className={`mai-quota-dot ${store.ollamaLoad.status === 'ok' ? 'mai-quota-ok' : 'mai-quota-off'}`} />
                            <span>{store.ollamaLoad.status === 'ok' ? `Online · ${store.ollamaLoad.models?.length || 0} model(s) loaded` : 'Offline'}</span>
                        </div>
                        {store.ollamaLoad.models?.map(m => (
                            <div key={m.name} className="mai-quota-model">
                                <Activity size={10} /> {m.name} · {m.size ? `${(m.size / 1e9).toFixed(1)} GB` : ''}
                            </div>
                        ))}
                    </div>
                )}
                <button className="mai-settings-btn" onClick={save}>Save Changes</button>
            </div>
        </div>
    );
}

// ── Provider selector ────────────────────────────────────────────────────────
function ProviderPill({ selected, onSelect }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="mai-model-wrap">
            <button className="mai-model-btn" onClick={() => setOpen(!open)}>
                <Activity size={11} /><span>{selected}</span>
                <ChevronRight size={10} style={{ transform: open ? 'rotate(90deg)' : '', transition: '0.2s' }} />
            </button>
            {open && (
                <div className="mai-model-dropdown">
                    <button className={`mai-model-item ${selected === 'Local' ? 'mai-model-active' : ''}`} onClick={() => { onSelect('Local'); setOpen(false); }}>Local</button>
                    <button className={`mai-model-item ${selected === 'Cloud' ? 'mai-model-active' : ''}`} onClick={() => { onSelect('Cloud'); setOpen(false); }}>Cloud</button>
                </div>
            )}
        </div>
    );
}

// ── Model selector ────────────────────────────────────────────────────────────
function ModelPill({ models, selected, onSelect }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="mai-model-wrap">
            <button className="mai-model-btn" onClick={() => setOpen(!open)}>
                <Activity size={11} /><span>{selected?.split(':')[0] || 'default'}</span>
                <ChevronRight size={10} style={{ transform: open ? 'rotate(90deg)' : '', transition: '0.2s' }} />
            </button>
            {open && (
                <div className="mai-model-dropdown">
                    <button className={`mai-model-item ${!selected ? 'mai-model-active' : ''}`} onClick={() => { onSelect(null); setOpen(false); }}>default</button>
                    {models.map(m => <button key={m} className={`mai-model-item ${selected === m ? 'mai-model-active' : ''}`} onClick={() => { onSelect(m); setOpen(false); }}>{m}</button>)}
                </div>
            )}
        </div>
    );
}

// ── Main MAI Component ────────────────────────────────────────────────────────
const MAI = () => {
    const store = useAgentStore();
    const {
        isListening, isProcessing, isStreaming, transcript, setListening, setTranscript,
        processCommand, conversationHistory, isExpanded, setExpanded, inputMode, setInputMode,
        activeToolCall, clearConversation, initAgent, availableModels, selectedModel,
        setSelectedModel, ttsEnabled, setTtsEnabled, useStreaming, setUseStreaming,
        attachedImage, setAttachedImage, usageStats, aiStatus, starredIndices, toggleStar,
        searchQuery, setSearchQuery, exportConversation, sessions, currentSessionId,
        switchSession, newSession, deleteSession, sessionTitle, setSessionTitle, renameSession,
        aiProvider, setAiProvider,
    } = store;

    const recogRef = useRef(null);
    const chatEndRef = useRef(null);
    const inputRef = useRef(null);
    const fileRef = useRef(null);
    const [text, setText] = useState('');
    const [showSidebar, setShowSidebar] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [editingTitle, setEditingTitle] = useState(false);
    const [titleDraft, setTitleDraft] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const [showMore, setShowMore] = useState(false);

    // ── Init ──────────────────────────────────────────────────────────────────
    useEffect(() => {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SR) {
            recogRef.current = new SR();
            recogRef.current.continuous = false;
            recogRef.current.interimResults = true;
            recogRef.current.lang = 'en-US';
            recogRef.current.onstart = () => setListening(true);
            recogRef.current.onresult = (e) => {
                let t = '';
                for (let i = e.resultIndex; i < e.results.length; i++) t += e.results[i][0].transcript;
                setTranscript(t);
            };
            recogRef.current.onerror = () => setListening(false);
            recogRef.current.onend = () => {
                setListening(false);
                const ft = useAgentStore.getState().transcript;
                if (ft.trim()) { processCommand(ft); setTranscript(''); }
            };
        }
        initAgent();
    }, []);

    // ── Keyboard shortcut ─────────────────────────────────────────────────────
    useEffect(() => {
        const h = (e) => { if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'A') { e.preventDefault(); setExpanded(!useAgentStore.getState().isExpanded); } };
        window.addEventListener('keydown', h);
        return () => window.removeEventListener('keydown', h);
    }, []);

    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [conversationHistory, isProcessing]);
    useEffect(() => { if (isExpanded && inputMode === 'text') setTimeout(() => inputRef.current?.focus(), 200); }, [isExpanded, inputMode]);

    const toggleListen = useCallback(() => {
        if (isListening) recogRef.current?.stop();
        else { setTranscript(''); recogRef.current?.start(); }
    }, [isListening]);

    const send = useCallback(() => {
        const msg = text.trim();
        if (!msg || isProcessing || isStreaming) return;
        setText(''); processCommand(msg);
    }, [text, isProcessing, isStreaming]);

    const onFile = (e) => {
        const f = e.target.files?.[0]; if (!f) return;
        const r = new FileReader();
        r.onload = ev => setAttachedImage({ dataUrl: ev.target.result, mimeType: f.type });
        r.readAsDataURL(f); e.target.value = '';
    };

    const saveTitle = () => {
        if (titleDraft.trim()) renameSession(currentSessionId, titleDraft.trim());
        setEditingTitle(false);
    };

    const handleCopy = (content) => {
        navigator.clipboard.writeText(content);
        store.executeWebOSAction('send_webos_notification', { title: 'MAI', message: 'Message copied to clipboard', type: 'success' });
    };

    const handleRegenerate = () => {
        // Find last user message
        const lastUser = [...conversationHistory].reverse().find(m => m.role === 'user');
        if (lastUser) processCommand(lastUser.content);
    };

    // Filter chat by search
    const visible = conversationHistory.map((msg, i) => ({
        msg, i, show: !searchQuery || msg.content.toLowerCase().includes(searchQuery.toLowerCase())
    }));

    const hasHistory = conversationHistory.length > 0;
    const isBusy = isProcessing || isStreaming;

    const onDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
    const onDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
    const onDrop = (e) => {
        e.preventDefault(); setIsDragging(false);
        const f = e.dataTransfer.files?.[0]; 
        if (!f || !f.type.startsWith('image/')) return;
        const r = new FileReader();
        r.onload = ev => setAttachedImage({ dataUrl: ev.target.result, mimeType: f.type });
        r.readAsDataURL(f);
    };

    return (
        <div className="agent-root" onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
            <div className={`agent-panel ${isExpanded ? 'agent-panel-open' : ''} ${isDragging ? 'mai-drag-active' : ''}`}>

                {/* Threads sidebar */}
                {showSidebar && (
                    <ThreadsSidebar
                        sessions={sessions} currentId={currentSessionId}
                        onSwitch={(id, t) => { switchSession(id, t); setShowSidebar(false); }}
                        onDelete={deleteSession} onNew={() => { newSession(); setShowSidebar(false); }}
                        onClose={() => setShowSidebar(false)}
                    />
                )}

                {/* Settings panel */}
                {showSettings && <SettingsPanel store={store} onClose={() => setShowSettings(false)} />}

                {/* Header */}
                <div className="agent-header">
                    <div className="agent-header-left">
                        <button className="agent-icon-btn mai-sidebar-toggle" onClick={() => setShowSidebar(!showSidebar)} title="Conversations">
                            <MessageSquare size={14} />
                        </button>
                        <div>
                            {editingTitle ? (
                                <input className="mai-title-input" autoFocus value={titleDraft}
                                    onChange={e => setTitleDraft(e.target.value)}
                                    onBlur={saveTitle} onKeyDown={e => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') setEditingTitle(false); }} />
                            ) : (
                                <span className="agent-header-title" onDoubleClick={() => { setTitleDraft(sessionTitle || ''); setEditingTitle(true); }} title="Double-click to rename">
                                    {store.personaName || 'MAI'}
                                </span>
                            )}
                            <div className="mai-header-meta">
                                <ProviderPill selected={aiProvider} onSelect={setAiProvider} />
                                {aiProvider === 'Local' && <ModelPill models={availableModels} selected={selectedModel} onSelect={setSelectedModel} />}
                                {usageStats.messageCount > 0 && <span className="mai-usage-badge">{usageStats.messageCount} msgs</span>}
                            </div>
                        </div>
                    </div>
                    <div className="agent-header-actions">
                        <OfflineBanner status={aiStatus} />
                        <button className="agent-icon-btn" onClick={() => setTtsEnabled(!ttsEnabled)} title={ttsEnabled ? 'Mute TTS' : 'Enable TTS'}>
                            {ttsEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
                        </button>
                        {ttsEnabled && window.speechSynthesis?.speaking && (
                            <button className="agent-icon-btn" onClick={() => window.speechSynthesis.cancel()} title="Stop Speaking">
                                <VolumeX size={14} style={{ color: '#ef4444' }} />
                            </button>
                        )}
                        <button className="agent-icon-btn" onClick={() => setUseStreaming(!useStreaming)} title={useStreaming ? 'Streaming ON' : 'Tool mode ON'}>
                            {useStreaming ? <Zap size={14} style={{ color: '#ffffff' }} /> : <ZapOff size={14} />}
                        </button>
                        <div style={{ position: 'relative' }}>
                            <button className="agent-icon-btn" onClick={() => setShowMore(!showMore)} title="More options">
                                <MoreVertical size={14} />
                            </button>
                            {showMore && (
                                <div className="mai-model-dropdown" style={{ right: 0, left: 'auto', minWidth: '140px', padding: '6px', top: 'calc(100% + 4px)' }}>
                                    <button className="mai-model-item" onClick={() => { setShowSearch(!showSearch); setShowMore(false); }} style={{display:'flex', alignItems:'center'}}><Search size={12} style={{marginRight:8}}/> Search</button>
                                    <button className="mai-model-item" onClick={() => { setShowSettings(!showSettings); setShowMore(false); }} style={{display:'flex', alignItems:'center'}}><Settings size={12} style={{marginRight:8}}/> Settings</button>
                                    {hasHistory && <button className="mai-model-item" onClick={() => { exportConversation('md'); setShowMore(false); }} style={{display:'flex', alignItems:'center'}}><Download size={12} style={{marginRight:8}}/> Export Chat</button>}
                                    {hasHistory && <button className="mai-model-item" onClick={() => { clearConversation(); setShowMore(false); }} style={{display:'flex', alignItems:'center', color: '#ef4444'}}><Trash2 size={12} style={{marginRight:8}}/> Clear Chat</button>}
                                </div>
                            )}
                        </div>
                        <button className="agent-icon-btn" onClick={() => setExpanded(false)} title="Close"><ChevronDown size={16} /></button>
                    </div>
                </div>

                {/* Offline banner (inline) */}
                {aiStatus === 'error' && (
                    <div className="mai-offline-banner-inline">
                        <AlertCircle size={12} />
                        <span>Ollama is not running — start it with <code>ollama serve</code></span>
                    </div>
                )}

                {/* Search bar */}
                {showSearch && (
                    <div className="mai-search-bar">
                        <Search size={13} />
                        <input className="mai-search-input" placeholder="Search messages…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} autoFocus />
                        {searchQuery && <button className="mai-search-clear" onClick={() => setSearchQuery('')}><X size={12} /></button>}
                    </div>
                )}

                {/* Chat area */}
                <div className="agent-chat">
                    {!hasHistory && !isBusy && (
                        <div className="agent-empty-state">
                            <div className="agent-empty-orb" style={{ background: 'transparent', border: 'none', boxShadow: 'none' }}>
                                <img src="/images/Ask.png" alt="AI" style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: '50%' }} />
                            </div>
                            <p className="agent-empty-title">How can I help?</p>
                            <p className="agent-empty-sub">Control your Web OS with natural language</p>
                        </div>
                    )}

                    {visible.map(({ msg, i, show }) => (
                        <ChatBubble key={i} message={msg} index={i} starred={starredIndices.includes(i)} onStar={toggleStar} visible={show} onCopy={handleCopy} onRegenerate={handleRegenerate} />
                    ))}

                    {isListening && transcript && (
                        <div className="agent-bubble-row agent-bubble-user-row">
                            <div className="agent-bubble agent-bubble-user">
                                <p className="agent-bubble-text">{transcript}</p>
                                <span className="agent-interim-badge">listening…</span>
                            </div>
                        </div>
                    )}

                    {isProcessing && !isStreaming && <TypingIndicator toolName={activeToolCall?.name} />}
                    <div ref={chatEndRef} />
                </div>

                {/* Attached image preview */}
                {attachedImage && (
                    <div className="mai-img-preview">
                        <img src={attachedImage.dataUrl} alt="preview" />
                        <button className="mai-img-remove" onClick={() => setAttachedImage(null)}><X size={12} /></button>
                    </div>
                )}
                
                {isDragging && (
                    <div className="mai-drag-overlay">
                        <Paperclip size={32} />
                        <p>Drop image to attach</p>
                    </div>
                )}

                {/* Input row */}
                <div className="agent-input-row">
                    <button className={`agent-mode-btn ${inputMode === 'voice' ? 'agent-mode-active' : ''}`}
                        onClick={() => setInputMode(inputMode === 'voice' ? 'text' : 'voice')}>
                        {inputMode === 'voice' ? <Mic size={15} /> : <MicOff size={15} />}
                    </button>

                    {inputMode === 'text' ? (
                        <>
                            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onFile} id="mai-file-input" />
                            <button className="agent-icon-btn mai-attach-btn" onClick={() => fileRef.current?.click()} disabled={isBusy} title="Attach image">
                                <Paperclip size={14} />
                            </button>
                            <input ref={inputRef} id="agent-text-input" className="agent-text-input" type="text"
                                placeholder="Type a command…" value={text} onChange={e => setText(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                                disabled={isBusy} />
                            <button className={`agent-send-btn ${(!text.trim() || isBusy) ? 'agent-send-disabled' : ''}`}
                                onClick={send} disabled={!text.trim() || isBusy}><Send size={14} /></button>
                        </>
                    ) : (
                        <button className={`agent-voice-btn ${isListening ? 'agent-voice-listening' : ''}`} onClick={toggleListen} disabled={isBusy}>
                            {isListening ? <><Mic size={15} /><span>Listening…</span></> : <><MicOff size={15} /><span>Tap to speak</span></>}
                        </button>
                    )}
                </div>
            </div>

            {/* Floating orb */}
            <div id="agent-orb" className={`agent-orb ${isListening ? 'agent-orb-listening' : ''} ${isBusy ? 'agent-orb-processing' : ''} ${isExpanded ? 'agent-orb-active' : ''}`}
                onClick={() => setExpanded(!isExpanded)} title="MAI (Cmd+Shift+A)">
                <img src="/images/Ask.png" alt="AI" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
            </div>
        </div>
    );
};

export default MAI;
