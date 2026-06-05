import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import usewindowstore from './window';
import useSettingsStore from './settings';
import useFinderStore from './finder';
import useNotificationStore from './notifications';
import useSpotlightStore from './spotlight';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001';

function getAuthHeader() {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user?.token) return { Authorization: `Bearer ${user.token}` };
    } catch { }
    return {};
}

// Generate unique session ID per tab — but keep it stable per session
function makeSessionId() { return `mai-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; }
let SESSION_ID = sessionStorage.getItem('mai_session_id');
if (!SESSION_ID) { SESSION_ID = makeSessionId(); sessionStorage.setItem('mai_session_id', SESSION_ID); }

// ── Browser TTS ───────────────────────────────────────────────────────────────
function speakText(text, voiceURI) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text.replace(/[#*`_~>]/g, '').substring(0, 400));
    utter.rate = 1.05; utter.pitch = 1;
    if (voiceURI) {
        const voices = window.speechSynthesis.getVoices();
        const match = voices.find(v => v.voiceURI === voiceURI);
        if (match) utter.voice = match;
    }
    window.speechSynthesis.speak(utter);
}

// ── Export helpers ─────────────────────────────────────────────────────────────
function exportAsMarkdown(history, sessionTitle) {
    const lines = [`# MAI Conversation — ${sessionTitle || 'Export'}\n`, `*${new Date().toLocaleString()}*\n\n---\n`];
    for (const msg of history) {
        const prefix = msg.role === 'user' ? '**You:**' : '**MAI:**';
        lines.push(`${prefix}\n${msg.content}\n`);
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `mai-conversation-${Date.now()}.md`; a.click();
    URL.revokeObjectURL(url);
}

function exportAsText(history, sessionTitle) {
    const lines = [`MAI Conversation — ${sessionTitle || 'Export'}`, new Date().toLocaleString(), '='.repeat(40), ''];
    for (const msg of history) {
        const prefix = msg.role === 'user' ? 'YOU:' : 'MAI:';
        lines.push(`${prefix}\n${msg.content}\n`);
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `mai-conversation-${Date.now()}.txt`; a.click();
    URL.revokeObjectURL(url);
}

// ── Zustand store ─────────────────────────────────────────────────────────────
const useAgentStore = create(
    persist(
        (set, get) => ({
            // ── Core state ────────────────────────────────────────────────
            isListening: false,
            isProcessing: false,
            isStreaming: false,
            streamingText: '',
            transcript: '',
            response: '',
            conversationHistory: [],
            isExpanded: false,
            inputMode: 'text',
            activeToolCall: null,
            error: null,

            // ── AI status & quota ────────────────────────────────────────
            aiStatus: 'unknown',
            ollamaLoad: null,        // { status, models, defaultModel }
            availableModels: [],

            // ── Settings (persisted) ─────────────────────────────────────
            selectedModel: null,
            aiProvider: 'Local',
            ttsEnabled: false,
            selectedVoiceURI: null,
            useStreaming: true,
            personaName: 'MAI',
            personaTone: 'concise and friendly',
            personaPrompt: '',

            // ── Session / thread management ──────────────────────────────
            currentSessionId: SESSION_ID,
            sessionTitle: '',
            sessions: [],           // [{ sessionId, title, messageCount, updatedAt }]

            // ── Features ─────────────────────────────────────────────────────
            attachedImage: null,    // { dataUrl, mimeType }
            searchQuery: '',        // for in-chat search
            starredIndices: [],     // indices of starred messages in current conversation
            usageStats: { messageCount: 0, sessionStart: Date.now() },
            pendingReminders: [],   // proactive notifications pending
            availableVoices: [],    // browser TTS voices

            // Fix #3: store interval IDs to prevent leak on re-init
            _reminderIntervalId: null,
            _healthIntervalId: null,

            // ── Setters ───────────────────────────────────────────────────
            setListening: v => set({ isListening: v }),
            setTranscript: v => set({ transcript: v }),
            setExpanded: v => set({ isExpanded: v }),
            setInputMode: v => set({ inputMode: v }),
            setSelectedModel: v => set({ selectedModel: v }),
            setAiProvider: v => set({ aiProvider: v }),
            setTtsEnabled: v => set({ ttsEnabled: v }),
            setSelectedVoiceURI: v => set({ selectedVoiceURI: v }),
            setUseStreaming: v => set({ useStreaming: v }),
            setAttachedImage: v => set({ attachedImage: v }),
            setSearchQuery: v => set({ searchQuery: v }),
            setPersona: (name, tone, prompt) => set({ personaName: name, personaTone: tone, personaPrompt: prompt }),
            setSessionTitle: v => set({ sessionTitle: v }),

            // ── Load TTS voices ───────────────────────────────────────────
            loadVoices: () => {
                const update = () => set({ availableVoices: window.speechSynthesis?.getVoices() || [] });
                update();
                if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = update;
            },

            // ── Load available Ollama models ──────────────────────────────
            loadModels: async () => {
                try {
                    const res = await axios.get(`${API_BASE_URL}/api/agent/models`);
                    set({ availableModels: res.data.models || [] });
                } catch { }
            },

            // ── Load Ollama load / quota ──────────────────────────────────
            loadOllamaLoad: async () => {
                try {
                    const res = await axios.get(`${API_BASE_URL}/api/agent/load`);
                    set({ ollamaLoad: res.data, aiStatus: res.data.status === 'ok' ? 'ok' : 'error' });
                } catch {
                    set({ ollamaLoad: { status: 'offline' }, aiStatus: 'error' });
                }
            },

            // ── Load session list for sidebar ────────────────────────────
            loadSessions: async () => {
                try {
                    const res = await axios.get(`${API_BASE_URL}/api/agent/sessions`, { headers: getAuthHeader() });
                    set({ sessions: res.data.sessions || [] });
                } catch { }
            },

            // ── Load history from DB on mount / session switch ────────────
            loadHistory: async (sessionId) => {
                const sid = sessionId || get().currentSessionId;
                try {
                    const res = await axios.get(`${API_BASE_URL}/api/agent/history/${sid}`, { headers: getAuthHeader() });
                    const msgs = (res.data.messages || [])
                        .map(m => ({
                            role: m.role === 'assistant' ? 'agent' : m.role,
                            content: m.content,
                            timestamp: new Date(),
                        }))
                        .filter(m => m.role === 'user' || m.role === 'agent');
                    const starred = res.data.starredIndices || [];
                    if (msgs.length > 0) set({ conversationHistory: msgs, starredIndices: starred, usageStats: { messageCount: res.data.messageCount || 0, sessionStart: Date.now() } });
                } catch { }
            },

            // ── Switch to a different session thread ─────────────────────
            switchSession: async (sessionId, title) => {
                set({ conversationHistory: [], starredIndices: [], usageStats: { messageCount: 0, sessionStart: Date.now() } });
                SESSION_ID = sessionId;
                sessionStorage.setItem('mai_session_id', sessionId);
                set({ currentSessionId: sessionId, sessionTitle: title || '' });
                await get().loadHistory(sessionId);
            },

            // ── Create new session thread ────────────────────────────────
            newSession: () => {
                const newId = makeSessionId();
                SESSION_ID = newId;
                sessionStorage.setItem('mai_session_id', newId);
                set({ currentSessionId: newId, conversationHistory: [], starredIndices: [], sessionTitle: '', usageStats: { messageCount: 0, sessionStart: Date.now() } });
            },

            // ── Delete a session ─────────────────────────────────────────
            deleteSession: async (sessionId) => {
                try {
                    await axios.delete(`${API_BASE_URL}/api/agent/session/${sessionId}`, { headers: getAuthHeader() });
                    set(state => ({ sessions: state.sessions.filter(s => s.sessionId !== sessionId) }));
                    if (get().currentSessionId === sessionId) get().newSession();
                } catch (e) { console.warn('[Agent] deleteSession error:', e.message); }
            },

            // ── Rename session ────────────────────────────────────────────
            renameSession: async (sessionId, title) => {
                try {
                    await axios.patch(`${API_BASE_URL}/api/agent/session/${sessionId}`, { title }, { headers: getAuthHeader() });
                    set(state => ({
                        sessions: state.sessions.map(s => s.sessionId === sessionId ? { ...s, title } : s),
                        sessionTitle: state.currentSessionId === sessionId ? title : state.sessionTitle,
                    }));
                } catch (e) { console.warn('[Agent] renameSession error:', e.message); }
            },

            // ── Clear conversation ────────────────────────────────────────
            clearConversation: async () => {
                try {
                    await axios.post(`${API_BASE_URL}/api/agent/clear-session`, { sessionId: get().currentSessionId }, { headers: getAuthHeader() });
                } catch { }
                set({ conversationHistory: [], response: '', transcript: '', error: null, streamingText: '', starredIndices: [], usageStats: { messageCount: 0, sessionStart: Date.now() } });
            },

            // ── Export conversation ───────────────────────────────────────
            exportConversation: (format = 'md') => {
                const { conversationHistory, sessionTitle } = get();
                if (format === 'md') exportAsMarkdown(conversationHistory, sessionTitle);
                else exportAsText(conversationHistory, sessionTitle);
            },

            // ── Star / unstar a message ───────────────────────────────────
            toggleStar: (index) => {
                set(state => {
                    const starred = state.starredIndices.includes(index)
                        ? state.starredIndices.filter(i => i !== index)
                        : [...state.starredIndices, index];
                    return { starredIndices: starred };
                });
            },

            // ── Schedule proactive reminder ───────────────────────────────
            scheduleReminder: async (message, delayMs) => {
                try {
                    const res = await axios.post(`${API_BASE_URL}/api/agent/reminder`, { message, delayMs }, { headers: getAuthHeader() });
                    return res.data;
                } catch (e) { console.warn('[Agent] reminder error:', e.message); }
            },

            // ── Poll for fired reminders ──────────────────────────────────
            pollReminders: async () => {
                try {
                    const res = await axios.get(`${API_BASE_URL}/api/agent/reminders`, { headers: getAuthHeader() });
                    const fired = res.data.fired || [];
                    if (fired.length > 0) {
                        for (const r of fired) {
                            useNotificationStore.getState().addNotification('MAI Reminder', r.message, 'info');
                        }
                    }
                    set({ pendingReminders: res.data.pending || [] });
                } catch { }
            },

            // ── Health check ──────────────────────────────────────────────
            checkHealth: async () => {
                try {
                    const res = await axios.get(`${API_BASE_URL}/api/agent/health`);
                    set({ aiStatus: res.data.status === 'ok' ? 'ok' : 'error' });
                    return res.data;
                } catch {
                    set({ aiStatus: 'error' });
                    return { status: 'error' };
                }
            },

            // ── Init ────────────────────────────────────────────────────────────
            initAgent: async () => {
                get().loadVoices();
                await Promise.all([
                    get().checkHealth(),
                    get().loadModels(),
                    get().loadOllamaLoad(),
                    get().loadHistory(),
                    get().loadSessions(),
                    get().pollReminders(),
                ]);

                // Fix #7: validate persisted model still exists in Ollama
                const { selectedModel, availableModels } = get();
                if (selectedModel && availableModels.length > 0 && !availableModels.includes(selectedModel)) {
                    console.warn(`[Agent] Persisted model "${selectedModel}" no longer available. Resetting to default.`);
                    set({ selectedModel: null });
                    useNotificationStore.getState().addNotification(
                        'MAI', `Model "${selectedModel}" not found. Switched to default.`, 'warning'
                    );
                }

                // Fix #3: clear any existing intervals before starting new ones
                const state = get();
                if (state._reminderIntervalId) clearInterval(state._reminderIntervalId);
                if (state._healthIntervalId) clearInterval(state._healthIntervalId);

                // Fix #3 + #15: stable interval IDs, health check every 60s
                const reminderInterval = setInterval(() => get().pollReminders(), 30_000);
                const healthInterval = setInterval(() => get().checkHealth(), 60_000);
                set({ _reminderIntervalId: reminderInterval, _healthIntervalId: healthInterval });
            },

            // ── Execute Web OS actions ────────────────────────────────────
            executeWebOSAction: (tool, args) => {
                switch (tool) {
                    case 'open_webos_app':   usewindowstore.getState().openwindow(args.appName); break;
                    case 'close_webos_app':  usewindowstore.getState().closewindow(args.appName); break;
                    case 'minimize_webos_app': usewindowstore.getState().minimisewindow(args.appName); break;
                    case 'set_theme':        useSettingsStore.getState().setTheme(args.theme); break;
                    case 'toggle_theme':     useSettingsStore.getState().toggleTheme(); break;
                    case 'change_wallpaper': useSettingsStore.getState().setWallpaper(args.wallpaper); break;
                    case 'send_webos_notification':
                        useNotificationStore.getState().addNotification(args.title, args.message, args.type || 'info'); break;
                    case 'search_finder_files':
                        usewindowstore.getState().openwindow('finder');
                        setTimeout(() => useFinderStore.getState().setSearchQuery(args.query), 300); break;
                    case 'create_webos_file':
                        useFinderStore.getState().createItem({ name: args.name, type: args.type === 'folder' ? 'folder' : 'file', content: args.content || '', parentId: useFinderStore.getState().currentFolder || null });
                        usewindowstore.getState().openwindow('finder'); break;
                    case 'open_spotlight': useSpotlightStore.getState().openSpotlight(); break;
                    default: console.warn(`[Agent] Unknown WebOS action: ${tool}`);
                }
            },

            // ── Vision: analyze image before sending ─────────────────────
            analyzeAttachedImage: async (imageData, userPrompt) => {
                try {
                    const res = await axios.post(`${API_BASE_URL}/api/agent/vision`, {
                        imageBase64: imageData.dataUrl,
                        mimeType: imageData.mimeType,
                        prompt: userPrompt || 'Describe this image in detail.',
                    }, { headers: getAuthHeader() });
                    return res.data.description || 'Image analyzed.';
                } catch (e) {
                    return `[Image attached — vision analysis unavailable: ${e.message}]`;
                }
            },

            // ── Stream processing ─────────────────────────────────────────
            _processStream: async (text, context) => {
                const { selectedModel, aiProvider, currentSessionId } = get();
                set({ isStreaming: true, streamingText: '', isProcessing: true });
                set(state => ({
                    conversationHistory: [...state.conversationHistory, { role: 'agent', content: '', timestamp: new Date(), isStreaming: true }]
                }));
                let fullText = '';
                try {
                    const response = await fetch(`${API_BASE_URL}/api/agent/stream`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
                        body: JSON.stringify({ sessionId: currentSessionId, message: text, context, model: selectedModel || undefined, provider: aiProvider }),
                    });
                    const reader = response.body.getReader();
                    const decoder = new TextDecoder();
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        const lines = decoder.decode(value).split('\n').filter(l => l.startsWith('data:'));
                        for (const line of lines) {
                            const data = line.slice(5).trim();
                            if (data === '[DONE]') break;
                            try {
                                const json = JSON.parse(data);
                                if (json.chunk) {
                                    let chunkStr = json.chunk;
                                    const actionRegex = /\[WEBOS_ACTION:([^:]+):(.*?)\]/g;
                                    let match;
                                    while ((match = actionRegex.exec(chunkStr)) !== null) {
                                        try {
                                            get().executeWebOSAction(match[1], JSON.parse(match[2]));
                                        } catch(e) {}
                                    }
                                    chunkStr = chunkStr.replace(actionRegex, '');

                                    fullText += chunkStr;
                                    set(state => {
                                        const history = [...state.conversationHistory];
                                        const last = history.length - 1;
                                        if (history[last]?.isStreaming) history[last] = { ...history[last], content: fullText };
                                        return { conversationHistory: history, streamingText: fullText };
                                    });
                                }
                            } catch { }
                        }
                    }
                } catch (err) { fullText = `Stream error: ${err.message}`; }

                set(state => {
                    const history = [...state.conversationHistory];
                    const last = history.length - 1;
                    if (history[last]?.isStreaming) history[last] = { role: 'agent', content: fullText, timestamp: new Date(), isStreaming: false };
                    return {
                        conversationHistory: history, isStreaming: false, isProcessing: false,
                        streamingText: '', response: fullText,
                        usageStats: { ...state.usageStats, messageCount: state.usageStats.messageCount + 1 },
                    };
                });
                if (get().ttsEnabled) speakText(fullText, get().selectedVoiceURI);
                return fullText;
            },

            // ── Main entry point ──────────────────────────────────────────
            // options.apiMessage — payload sent to the model (defaults to text)
            // options.extraContext — merged into Web OS context (e.g. Code IDE)
            processCommand: async (text, options = {}) => {
                const { apiMessage, extraContext = {} } = options;
                const { useStreaming, selectedModel, aiProvider, attachedImage, personaName, personaTone, personaPrompt, currentSessionId } = get();
                set({ isProcessing: true, response: '', error: null, attachedImage: null });

                let messageText = apiMessage || text;

                // Vision: if image attached, analyze it first then include description
                if (attachedImage) {
                    const desc = await get().analyzeAttachedImage(attachedImage, text);
                    messageText = `${text}\n\n[Image analysis: ${desc}]`;
                }

                set(state => ({
                    conversationHistory: [...state.conversationHistory, {
                        role: 'user', content: text, timestamp: new Date(),
                        image: attachedImage?.dataUrl || null,
                    }]
                }));

                const openApps = Object.entries(usewindowstore.getState().window || {})
                    .filter(([, w]) => w.isOpen).map(([k]) => k).join(', ') || 'none';
                const theme = useSettingsStore.getState().theme;
                const context = { theme, openApps, personaName, personaTone, personaPrompt, ...extraContext };

                if (useStreaming) return get()._processStream(messageText, context);

                try {
                    const res = await axios.post(`${API_BASE_URL}/api/agent/chat`, {
                        sessionId: currentSessionId, message: messageText, context, model: selectedModel || undefined, provider: aiProvider,
                    }, { headers: getAuthHeader() });

                    const { response: aiResponse, toolCalls, webosActions } = res.data;

                    if (webosActions?.length > 0) {
                        for (const action of webosActions) {
                            set({ activeToolCall: { name: action.tool, status: 'running' } });
                            get().executeWebOSAction(action.tool, action.args);
                            set({ activeToolCall: null });
                        }
                    }
                    if (toolCalls?.length > 0) {
                        set({ activeToolCall: { name: toolCalls[toolCalls.length - 1].name, status: 'done' } });
                        await new Promise(r => setTimeout(r, 200));
                        set({ activeToolCall: null });
                    }

                    set(state => ({
                        response: aiResponse, isProcessing: false,
                        conversationHistory: [...state.conversationHistory, { role: 'agent', content: aiResponse, timestamp: new Date(), toolCalls }],
                        usageStats: { ...state.usageStats, messageCount: state.usageStats.messageCount + 1 },
                    }));
                    if (get().ttsEnabled) speakText(aiResponse, get().selectedVoiceURI);
                    return aiResponse;
                } catch (error) {
                    const errMsg = error.response?.data?.hint
                        ? `${error.response.data.error}. ${error.response.data.hint}`
                        : error.response?.data?.error || (error.message?.includes('Network Error') ? "Can't reach the backend." : `Error: ${error.message}`);
                    set(state => ({
                        response: errMsg, isProcessing: false, error: errMsg,
                        conversationHistory: [...state.conversationHistory, { role: 'agent', content: errMsg, timestamp: new Date(), isError: true }],
                    }));
                }
            },
        }),
        {
            name: 'mai-settings',
            // Persist user preferences AND guest conversation history (fix #12)
            partialize: (state) => ({
                selectedModel: state.selectedModel,
                ttsEnabled: state.ttsEnabled,
                selectedVoiceURI: state.selectedVoiceURI,
                useStreaming: state.useStreaming,
                personaName: state.personaName,
                personaTone: state.personaTone,
                personaPrompt: state.personaPrompt,
                aiProvider: state.aiProvider,
                // Fix #12: persist conversation for guests (unauthenticated sessions)
                // Cap at 50 messages to keep localStorage manageable
                conversationHistory: state.conversationHistory.slice(-50),
                starredIndices: state.starredIndices,
                currentSessionId: state.currentSessionId,
                sessionTitle: state.sessionTitle,
            }),
        }
    )
);

export default useAgentStore;
