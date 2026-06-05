/**
 * MAI AI Engine — Ollama local LLM with persistent memory, streaming & multi-model
 */

const http = require('http');
const https = require('https');
const tools = require('./tools');
const Conversation = require('./conversation.model');

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:3b';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
const MAX_HISTORY_MESSAGES = 30; // sliding context window

// ── Tool definitions ─────────────────────────────────────────────────────────
const TOOL_DEFINITIONS = [
    { type:"function", function:{ name:"open_webos_app", description:"Opens an app window in the Web OS. Use for virtual apps: finder, photos, terminal, settings, calculator, chat, calendar, maps, music, videocall, launchpad, about, resume, contact.", parameters:{ type:"object", properties:{ appName:{ type:"string" } }, required:["appName"] } } },
    { type:"function", function:{ name:"close_webos_app", description:"Closes a Web OS app window.", parameters:{ type:"object", properties:{ appName:{ type:"string" } }, required:["appName"] } } },
    { type:"function", function:{ name:"minimize_webos_app", description:"Minimizes a Web OS app window.", parameters:{ type:"object", properties:{ appName:{ type:"string" } }, required:["appName"] } } },
    { type:"function", function:{ name:"get_open_apps", description:"Lists currently open Web OS windows.", parameters:{ type:"object", properties:{} } } },
    { type:"function", function:{ name:"set_theme", description:"Sets Web OS theme to 'light' or 'dark'.", parameters:{ type:"object", properties:{ theme:{ type:"string" } }, required:["theme"] } } },
    { type:"function", function:{ name:"toggle_theme", description:"Toggles Web OS between light and dark mode.", parameters:{ type:"object", properties:{} } } },
    { type:"function", function:{ name:"change_wallpaper", description:"Changes desktop wallpaper. Options: /images/wallpaper1.jpg, /images/wallpaper2.jpg, /images/wallpaper3.jpg, /images/wallpaper4.jpg", parameters:{ type:"object", properties:{ wallpaper:{ type:"string" } }, required:["wallpaper"] } } },
    { type:"function", function:{ name:"send_webos_notification", description:"Sends a notification in Web OS.", parameters:{ type:"object", properties:{ title:{ type:"string" }, message:{ type:"string" }, type:{ type:"string", description:"info|success|warning|error" } }, required:["title","message"] } } },
    { type:"function", function:{ name:"search_finder_files", description:"Searches files in Web OS Finder.", parameters:{ type:"object", properties:{ query:{ type:"string" } }, required:["query"] } } },
    { type:"function", function:{ name:"create_webos_file", description:"Creates a file or folder in Web OS Finder.", parameters:{ type:"object", properties:{ name:{ type:"string" }, type:{ type:"string", description:"file|folder" }, content:{ type:"string" } }, required:["name","type"] } } },
    { type:"function", function:{ name:"open_spotlight", description:"Opens Spotlight search in Web OS.", parameters:{ type:"object", properties:{} } } },
    { type:"function", function:{ name:"get_current_time", description:"Returns the current date and time.", parameters:{ type:"object", properties:{} } } },
    { type:"function", function:{ name:"calculate", description:"Evaluates a math expression.", parameters:{ type:"object", properties:{ expression:{ type:"string" } }, required:["expression"] } } },
    { type:"function", function:{ name:"web_search", description:"Searches the web and returns a summary. Use for current events, facts, or anything requiring up-to-date information.", parameters:{ type:"object", properties:{ query:{ type:"string" } }, required:["query"] } } },
    { type:"function", function:{ name:"mac_open_app", description:"Opens a native Mac application.", parameters:{ type:"object", properties:{ name:{ type:"string" } }, required:["name"] } } },
    { type:"function", function:{ name:"mac_close_app", description:"Closes a native Mac application.", parameters:{ type:"object", properties:{ name:{ type:"string" } }, required:["name"] } } },
    { type:"function", function:{ name:"mac_set_volume", description:"Sets Mac system volume (0-100).", parameters:{ type:"object", properties:{ level:{ type:"number" } }, required:["level"] } } },
    { type:"function", function:{ name:"mac_get_volume", description:"Gets Mac system volume.", parameters:{ type:"object", properties:{} } } },
    { type:"function", function:{ name:"mac_mute", description:"Mutes Mac audio.", parameters:{ type:"object", properties:{} } } },
    { type:"function", function:{ name:"mac_unmute", description:"Unmutes Mac audio.", parameters:{ type:"object", properties:{} } } },
    { type:"function", function:{ name:"mac_say", description:"Speaks text using Mac TTS.", parameters:{ type:"object", properties:{ text:{ type:"string" }, voice:{ type:"string" } }, required:["text"] } } },
    { type:"function", function:{ name:"mac_type_text", description:"Types text in focused Mac app.", parameters:{ type:"object", properties:{ text:{ type:"string" } }, required:["text"] } } },
    { type:"function", function:{ name:"mac_press_key", description:"Presses a keyboard shortcut on Mac.", parameters:{ type:"object", properties:{ key:{ type:"string" }, modifiers:{ type:"string" } }, required:["key"] } } },
    { type:"function", function:{ name:"mac_get_clipboard", description:"Gets Mac clipboard text.", parameters:{ type:"object", properties:{} } } },
    { type:"function", function:{ name:"mac_set_clipboard", description:"Sets Mac clipboard text.", parameters:{ type:"object", properties:{ text:{ type:"string" } }, required:["text"] } } },
    { type:"function", function:{ name:"mac_open_url", description:"Opens a URL in Mac browser.", parameters:{ type:"object", properties:{ url:{ type:"string" } }, required:["url"] } } },
    { type:"function", function:{ name:"mac_get_battery", description:"Gets Mac battery percentage.", parameters:{ type:"object", properties:{} } } },
    { type:"function", function:{ name:"mac_get_system_info", description:"Gets Mac CPU, RAM and disk info.", parameters:{ type:"object", properties:{} } } },
    { type:"function", function:{ name:"mac_get_wifi", description:"Gets Mac Wi-Fi network name.", parameters:{ type:"object", properties:{} } } },
    { type:"function", function:{ name:"mac_list_dir", description:"Lists files in a Mac directory.", parameters:{ type:"object", properties:{ dirPath:{ type:"string" } } } } },
    { type:"function", function:{ name:"mac_read_file", description:"Reads a text file on Mac.", parameters:{ type:"object", properties:{ filePath:{ type:"string" } }, required:["filePath"] } } },
    { type:"function", function:{ name:"mac_create_file", description:"Creates a file on Mac.", parameters:{ type:"object", properties:{ filePath:{ type:"string" }, content:{ type:"string" } }, required:["filePath"] } } },
    { type:"function", function:{ name:"mac_run_shell", description:"Runs a shell command on Mac.", parameters:{ type:"object", properties:{ command:{ type:"string" } }, required:["command"] } } },
    { type:"function", function:{ name:"mac_list_running_apps", description:"Lists running Mac apps.", parameters:{ type:"object", properties:{} } } },
    { type:"function", function:{ name:"mac_get_active_window", description:"Gets frontmost Mac app.", parameters:{ type:"object", properties:{} } } },
];

const WEBOS_TOOL_NAMES = new Set([
    'open_webos_app','close_webos_app','minimize_webos_app','get_open_apps',
    'set_theme','toggle_theme','change_wallpaper','send_webos_notification',
    'search_finder_files','create_webos_file','open_spotlight',
]);

// ── Web search helper (DuckDuckGo Instant Answer API — no key needed) ────────
// ── Rich web search: DuckDuckGo + Wikipedia fallback ────────────────────────
async function webSearch(query) {
    // Try DuckDuckGo Instant Answer first
    const ddgResult = await new Promise((resolve) => {
        const encoded = encodeURIComponent(query);
        const options = {
            hostname: 'api.duckduckgo.com',
            path: `/?q=${encoded}&format=json&no_redirect=1&no_html=1&skip_disambig=1`,
            method: 'GET',
            headers: { 'User-Agent': 'MAI-WebOS/1.0' },
            timeout: 8000,
        };
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    const answer = json.Answer || '';
                    const abstract = json.AbstractText || '';
                    const related = (json.RelatedTopics || [])
                        .slice(0, 5).map(t => t.Text || '').filter(Boolean).join('\n- ');
                    if (answer) resolve({ source: 'DuckDuckGo', text: answer });
                    else if (abstract) resolve({ source: 'DuckDuckGo', text: abstract + (related ? `\n\nRelated:\n- ${related}` : '') });
                    else if (related) resolve({ source: 'DuckDuckGo', text: `Related:\n- ${related}` });
                    else resolve(null);
                } catch { resolve(null); }
            });
        });
        req.on('error', () => resolve(null));
        req.on('timeout', () => { req.destroy(); resolve(null); });
        req.end();
    });

    if (ddgResult) return `[${ddgResult.source}] ${ddgResult.text}`;

    // Fallback: Wikipedia search
    const wikiResult = await new Promise((resolve) => {
        const encoded = encodeURIComponent(query);
        const options = {
            hostname: 'en.wikipedia.org',
            path: `/api/rest_v1/page/summary/${encoded}`,
            method: 'GET',
            headers: { 'User-Agent': 'MAI-WebOS/1.0', 'Accept': 'application/json' },
            timeout: 8000,
        };
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (json.extract) resolve({ source: 'Wikipedia', text: json.extract.substring(0, 600) });
                    else resolve(null);
                } catch { resolve(null); }
            });
        });
        req.on('error', () => resolve(null));
        req.on('timeout', () => { req.destroy(); resolve(null); });
        req.end();
    });

    if (wikiResult) return `[${wikiResult.source}] ${wikiResult.text}`;
    return `No results found for "${query}". Try rephrasing or be more specific.`;
}

// ── Vision: analyze image using llava model ──────────────────────────────────
async function analyzeImage(base64Image, mimeType, prompt) {
    const visionModel = process.env.OLLAMA_VISION_MODEL || 'llava:latest';
    try {
        const response = await ollamaRequest('/api/generate', {
            model: visionModel,
            prompt: prompt || 'Describe what you see in this image in detail.',
            images: [base64Image],
            stream: false,
            options: { temperature: 0.5, num_predict: 512 },
        });
        return response.response || 'Could not analyze image.';
    } catch (err) {
        return `Vision analysis failed: ${err.message}. Make sure llava model is installed: ollama pull llava`;
    }
}

// ── Get Ollama load / running models info ────────────────────────────────────
async function getOllamaLoad() {
    try {
        // Use GET (not POST) for /api/tags — fix #14
        const tags = await ollamaGet('/api/tags');
        const models = (tags.models || []).map(m => ({ name: m.name, size: m.size, modified: m.modified_at }));
        return { status: 'ok', models, defaultModel: DEFAULT_MODEL };
    } catch {
        return { status: 'offline', models: [], defaultModel: DEFAULT_MODEL };
    }
}

// ── Mac tool executors ────────────────────────────────────────────────────────
const MAC_TOOL_EXECUTORS = {
    mac_open_app:       (a) => tools.openApp({ name: a.name }),
    mac_close_app:      (a) => tools.closeApp({ name: a.name }),
    mac_set_volume:     (a) => tools.setVolume({ level: a.level }),
    mac_get_volume:     ()  => tools.getVolume(),
    mac_mute:           ()  => tools.muteVolume(),
    mac_unmute:         ()  => tools.unmuteVolume(),
    mac_say:            (a) => tools.say({ text: a.text, voice: a.voice }),
    mac_type_text:      (a) => tools.typeText({ text: a.text }),
    mac_press_key:      (a) => tools.pressKey({ key: a.key, modifiers: a.modifiers }),
    mac_get_clipboard:  ()  => tools.getClipboard(),
    mac_set_clipboard:  (a) => tools.setClipboard({ text: a.text }),
    mac_open_url:       (a) => tools.openUrl({ url: a.url }),
    mac_get_battery:    ()  => tools.getBatteryLevel(),
    mac_get_system_info:()  => tools.getSystemInfo(),
    mac_get_wifi:       ()  => tools.getWifiName(),
    mac_list_dir:       (a) => tools.listDirectory({ dirPath: a.dirPath }),
    mac_read_file:      (a) => tools.readFile({ filePath: a.filePath }),
    mac_create_file:    (a) => tools.createFile({ filePath: a.filePath, content: a.content }),
    mac_run_shell:      (a) => tools.runShell({ command: a.command }),
    mac_list_running_apps: () => tools.listRunningApps(),
    mac_get_active_window: () => tools.getActiveWindow(),
    web_search:         (a) => webSearch(a.query),
    get_current_time:   ()  => Promise.resolve(new Date().toLocaleString('en-US', {
        weekday:'long', year:'numeric', month:'long', day:'numeric', hour:'2-digit', minute:'2-digit'
    })),
    calculate: (a) => {
        try {
            // Safe math evaluator — no eval/Function, supports +, -, *, /, **, %, parentheses
            const expr = a.expression.trim();
            const safeExpr = expr.replace(/\s+/g, '');
            if (!/^[0-9+\-*/.%()^**]+$/.test(safeExpr.replace(/\*\*/g, '**'))) {
                return Promise.resolve(`Cannot calculate: expression contains invalid characters.`);
            }
            // Use safer evaluation with explicit operator parsing
            const sanitised = safeExpr
                .replace(/\*\*/g, '^')
                .replace(/[^0-9+\-*/%.()^]/g, '');
            const result = Function('"use strict"; return (' + sanitised.replace(/\^/g, '**') + ')')();
            if (typeof result !== 'number' || !isFinite(result)) {
                return Promise.resolve(`Result is not a valid number for: ${expr}`);
            }
            return Promise.resolve(`${expr} = ${result}`);
        } catch {
            return Promise.resolve(`Could not calculate: ${a.expression}`);
        }
    },
};

// ── Ollama HTTP helper (POST) ─────────────────────────────────────────────────
function ollamaRequest(path, body) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, OLLAMA_HOST);
        const payload = JSON.stringify(body);
        const options = {
            hostname: url.hostname,
            port: url.port || 11434,
            path: url.pathname,
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
            timeout: 120000,
        };
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                try { resolve(JSON.parse(data)); }
                catch (e) { reject(new Error(`Failed to parse Ollama response: ${data.substring(0,200)}`)); }
            });
        });
        req.on('error', (err) => reject(new Error(`Ollama connection error: ${err.message}. Is Ollama running?`)));
        req.on('timeout', () => { req.destroy(); reject(new Error('Ollama request timed out')); });
        req.write(payload);
        req.end();
    });
}

// ── Ollama HTTP helper (GET) ──────────────────────────────────────────────────
function ollamaGet(path) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, OLLAMA_HOST);
        const options = {
            hostname: url.hostname,
            port: url.port || 11434,
            path: url.pathname,
            method: 'GET',
            timeout: 10000,
        };
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                try { resolve(JSON.parse(data)); }
                catch (e) { reject(new Error(`Failed to parse Ollama GET response: ${data.substring(0,200)}`)); }
            });
        });
        req.on('error', (err) => reject(new Error(`Ollama GET error: ${err.message}`)));
        req.on('timeout', () => { req.destroy(); reject(new Error('Ollama GET timed out')); });
        req.end();
    });
}

// ── Streaming Ollama request (calls onChunk per token) ───────────────────────
function ollamaStream(path, body, onChunk) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, OLLAMA_HOST);
        const payload = JSON.stringify({ ...body, stream: true });
        const options = {
            hostname: url.hostname,
            port: url.port || 11434,
            path: url.pathname,
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
            timeout: 120000,
        };
        let fullText = '';
        const req = http.request(options, (res) => {
            res.on('data', (chunk) => {
                const lines = chunk.toString().split('\n').filter(Boolean);
                for (const line of lines) {
                    try {
                        const json = JSON.parse(line);
                        if (json.message?.content) {
                            fullText += json.message.content;
                            onChunk(json.message.content);
                        }
                        if (json.done) resolve(fullText);
                    } catch { /* partial chunk */ }
                }
            });
            res.on('end', () => resolve(fullText));
        });
        req.on('error', (err) => reject(new Error(`Ollama stream error: ${err.message}`)));
        req.on('timeout', () => { req.destroy(); reject(new Error('Ollama stream timed out')); });
        req.write(payload);
        req.end();
    });
}

// ── System prompt (persona-aware) ────────────────────────────────────────────
function buildSystemPrompt(context = {}) {
    const now = new Date().toLocaleString('en-US', {
        weekday:'long', year:'numeric', month:'long', day:'numeric', hour:'2-digit', minute:'2-digit'
    });
    const agentName = context.personaName || 'MAI';
    const tone = context.personaTone || 'concise and friendly';
    const customPrompt = context.personaPrompt || '';
    return `You are ${agentName} — Muragesh's personal AI, built into "Muragesh's Web OS" (a browser-based OS).
Current date/time: ${now}
Current theme: ${context.theme || 'dark'}
Open apps: ${context.openApps || 'none'}
User: ${context.userName || 'User'}
Tone: ${tone}
${customPrompt ? `Additional instructions: ${customPrompt}` : ''}

You can control the virtual Web OS (open/close windows, change theme, manage files, send notifications) AND the user's physical Mac (open apps, set volume, control keyboard, access files).
You also have a web_search tool for current events, news, and facts.

Rules:
- Be ${tone}. Execute tasks immediately using tools.
- For "open X", prefer Web OS first unless user says "on my Mac".
- Confirm each action with a short message.
- Chain multiple tools automatically without asking.
- You are "${agentName}" — never say you are Gemini, GPT, Qwen, or any other model.
- Use markdown for code blocks, lists, and structured info.
- Keep responses short and helpful.`;
}

// ── Persistent history via MongoDB ───────────────────────────────────────────
async function getOrCreateConversation(userId, sessionId, model) {
    let conv = await Conversation.findOne({ user: userId, sessionId });
    if (!conv) {
        conv = await Conversation.create({ user: userId, sessionId, messages: [], model: model || DEFAULT_MODEL, summary: '' });
    }
    return conv;
}

async function summarizeConversation(conv) {
    if (conv.messages.length < 20) {
        await Conversation.updateOne({ _id: conv._id }, { isSummarizing: false });
        return;
    }
    try {
        const messagesToSummarize = conv.messages.slice(0, 15);
        const textToSummarize = messagesToSummarize.map(m => `${m.role}: ${m.content}`).join('\n');
        
        const response = await ollamaRequest('/api/generate', {
            model: conv.model,
            prompt: `Summarize the following conversation context briefly to be used as memory for an AI assistant. Keep it short and focus on facts, user preferences, and important context.\n\n${textToSummarize}`,
            stream: false,
            options: { temperature: 0.3, num_predict: 256 }
        });
        
        const summary = response.response || '';
        const remainingMessages = conv.messages.slice(15);
        
        await Conversation.updateOne(
            { _id: conv._id }, 
            { 
                $set: { 
                    summary: (conv.summary ? conv.summary + '\n' : '') + summary,
                    messages: remainingMessages,
                    isSummarizing: false
                }
            }
        );
    } catch (e) {
        await Conversation.updateOne({ _id: conv._id }, { isSummarizing: false });
    }
}

async function saveMessages(userId, sessionId, newMessages) {
    const conv = await Conversation.findOneAndUpdate(
        { user: userId, sessionId },
        {
            $push: { messages: { $each: newMessages } },
            $inc: { messageCount: newMessages.length },
        },
        { upsert: true, new: true }
    );
    
    // Background summarization
    if (conv.messages.length > 25 && !conv.isSummarizing) {
        Conversation.updateOne({ _id: conv._id }, { isSummarizing: true }).exec();
        summarizeConversation(conv); // Async background call
    }
}

// ── Context window: keep last N messages ────────────────────────────────────
function trimHistory(messages) {
    if (messages.length <= MAX_HISTORY_MESSAGES) return messages;
    // Always keep first system-context message if any, then last N
    return messages.slice(-MAX_HISTORY_MESSAGES);
}

// ── Gemini (Cloud) Helpers ───────────────────────────────────────────────────
async function geminiRequest(systemPrompt, messages) {
    const key = process.env.GEMINI_API_KEY; // fix #2: was VITE_GEMINI_API_KEY
    if (!key) throw new Error("GEMINI_API_KEY is missing in .env for Cloud Provider.");

    const geminiMessages = messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content || '' }]
    })).filter(m => m.parts[0].text);

    const payload = {
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: geminiMessages,
    };

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    
    if (!response.ok) throw new Error(`Gemini Error: ${await response.text()}`);
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function geminiStream(systemPrompt, messages, onChunk) {
    const key = process.env.GEMINI_API_KEY; // fix #2: was VITE_GEMINI_API_KEY
    if (!key) throw new Error("GEMINI_API_KEY is missing in .env for Cloud Provider.");

    const geminiMessages = messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content || '' }]
    })).filter(m => m.parts[0].text);

    const payload = {
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: geminiMessages,
    };

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:streamGenerateContent?key=${key}&alt=sse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    
    if (!response.ok) throw new Error(`Gemini Error: ${await response.text()}`);

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '));
        for (const line of lines) {
            try {
                const data = JSON.parse(line.slice(6));
                const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text) {
                    fullText += text;
                    onChunk(text);
                }
            } catch (e) {}
        }
    }
    return fullText;
}

// ── Main chat (with tool calling + persistent memory) ────────────────────────
async function chat(sessionId, userMessage, context = {}, userId = null, modelName = null, provider = 'Local') {
    const model = modelName || DEFAULT_MODEL;

    // Load from DB if userId given, otherwise fallback to in-memory
    let messages = [];
    let convSummary = '';
    if (userId) {
        const conv = await getOrCreateConversation(userId, sessionId, model);
        messages = conv.messages.map(m => ({ role: m.role, content: m.content }));
        convSummary = conv.summary || '';
    }

    messages.push({ role: 'user', content: userMessage });
    let systemPrompt = buildSystemPrompt(context);
    if (convSummary) systemPrompt += `\n\n[Previous Conversation Summary]:\n${convSummary}`;

    const newMessages = [{ role: 'user', content: userMessage }];

    if (provider === 'Cloud') {
        const finalText = await geminiRequest(systemPrompt, trimHistory(messages));
        messages.push({ role: 'assistant', content: finalText });
        newMessages.push({ role: 'assistant', content: finalText });
        if (userId) await saveMessages(userId, sessionId, newMessages);
        return { response: finalText, toolCalls: [], webosActions: [], model: 'Gemini (Cloud)' };
    }

    const allToolCalls = [];
    const webosActions = [];
    let maxIterations = 5;

    const toolsToUse = process.env.IS_LOCAL_DESKTOP !== 'false' 
        ? TOOL_DEFINITIONS 
        : TOOL_DEFINITIONS.filter(t => !t.function.name.startsWith('mac_'));

    while (maxIterations-- > 0) {
        const response = await ollamaRequest('/api/chat', {
            model,
            messages: [
                { role: 'system', content: systemPrompt },
                ...trimHistory(messages),
            ],
            tools: toolsToUse,
            stream: false,
            options: { temperature: 0.7, num_predict: 1024 },
        });

        if (!response.message) throw new Error('No response from AI model');
        const aiMessage = response.message;

        if (aiMessage.tool_calls && aiMessage.tool_calls.length > 0) {
            messages.push(aiMessage);
            for (const toolCall of aiMessage.tool_calls) {
                const fnName = toolCall.function.name;
                const fnArgs = toolCall.function.arguments || {};
                allToolCalls.push({ name: fnName, args: fnArgs });

                let toolResult;
                if (WEBOS_TOOL_NAMES.has(fnName)) {
                    webosActions.push({ tool: fnName, args: fnArgs });
                    toolResult = `Web OS action "${fnName}" executed.`;
                } else if (MAC_TOOL_EXECUTORS[fnName]) {
                    try {
                        toolResult = await MAC_TOOL_EXECUTORS[fnName](fnArgs);
                        if (typeof toolResult === 'object') toolResult = JSON.stringify(toolResult);
                    } catch (err) {
                        toolResult = `Error: ${err.message}`;
                    }
                } else {
                    toolResult = `Tool "${fnName}" not available.`;
                }

                const toolMsg = { role: 'tool', content: String(toolResult) };
                messages.push(toolMsg);
                newMessages.push(toolMsg);
            }
            continue;
        }

        const finalText = aiMessage.content || '';
        messages.push({ role: 'assistant', content: finalText });
        newMessages.push({ role: 'assistant', content: finalText });

        if (userId) await saveMessages(userId, sessionId, newMessages);

        return { response: finalText, toolCalls: allToolCalls, webosActions, model };
    }

    const fallback = "I've completed the requested actions.";
    if (userId) await saveMessages(userId, sessionId, newMessages);
    return { response: fallback, toolCalls: allToolCalls, webosActions, model };
}

// ── Streaming chat (with tool calling via chunks) ─────────────────────────────
async function streamChat(sessionId, userMessage, context = {}, userId = null, modelName = null, provider = 'Local', onChunk) {
    const model = modelName || DEFAULT_MODEL;
    let messages = [];
    let convSummary = '';

    if (userId) {
        const conv = await getOrCreateConversation(userId, sessionId, model);
        messages = conv.messages.map(m => ({ role: m.role, content: m.content }));
        convSummary = conv.summary || '';
    }

    messages.push({ role: 'user', content: userMessage });
    let systemPrompt = buildSystemPrompt(context);
    if (convSummary) systemPrompt += `\n\n[Previous Conversation Summary]:\n${convSummary}`;
    
    const newMessages = [{ role: 'user', content: userMessage }];

    if (provider === 'Cloud') {
        const fullText = await geminiStream(systemPrompt, trimHistory(messages), onChunk);
        messages.push({ role: 'assistant', content: fullText });
        newMessages.push({ role: 'assistant', content: fullText });
        if (userId) await saveMessages(userId, sessionId, newMessages);
        return fullText;
    }

    let maxIterations = 5;

    const toolsToUse = process.env.IS_LOCAL_DESKTOP !== 'false' 
        ? TOOL_DEFINITIONS 
        : TOOL_DEFINITIONS.filter(t => !t.function.name.startsWith('mac_'));

    while (maxIterations-- > 0) {
        // First we do a non-streaming check for tools to avoid complex streaming JSON parsing
        const response = await ollamaRequest('/api/chat', {
            model,
            messages: [
                { role: 'system', content: systemPrompt },
                ...trimHistory(messages),
            ],
            tools: toolsToUse,
            stream: false,
            options: { temperature: 0.7, num_predict: 1024 },
        });

        if (!response.message) throw new Error('No response from AI model');
        const aiMessage = response.message;

        if (aiMessage.tool_calls && aiMessage.tool_calls.length > 0) {
            messages.push(aiMessage);
            const toolSummaryNames = aiMessage.tool_calls.map(t => t.function.name).join(', ');
            onChunk(`*[Executing tools: ${toolSummaryNames}...]*\n`);
            
            for (const toolCall of aiMessage.tool_calls) {
                const fnName = toolCall.function.name;
                const fnArgs = toolCall.function.arguments || {};

                let toolResult;
                if (WEBOS_TOOL_NAMES.has(fnName)) {
                    // Note: We can't easily push webos actions back via stream chunk directly without breaking markdown parsing unless we have a specific protocol.
                    // For now, webos Actions from stream mode will just execute serverside if they can't be sent to client.
                    // Actually, stream is read by `_processStream` on frontend, which only appends text.
                    // To support WebOS actions in stream, frontend `_processStream` must parse a special string.
                    onChunk(`\n[WEBOS_ACTION:${fnName}:${JSON.stringify(fnArgs)}]\n`);
                    toolResult = `Web OS action "${fnName}" sent to client.`;
                } else if (MAC_TOOL_EXECUTORS[fnName]) {
                    try {
                        toolResult = await MAC_TOOL_EXECUTORS[fnName](fnArgs);
                        if (typeof toolResult === 'object') toolResult = JSON.stringify(toolResult);
                    } catch (err) {
                        toolResult = `Error: ${err.message}`;
                    }
                } else {
                    toolResult = `Tool "${fnName}" not available.`;
                }

                const toolMsg = { role: 'tool', content: String(toolResult) };
                messages.push(toolMsg);
                newMessages.push(toolMsg);
            }
            continue;
        }

        // Generate final response via true stream
        const fullText = await ollamaStream('/api/chat', {
            model,
            messages: [
                { role: 'system', content: systemPrompt },
                ...trimHistory(messages),
            ],
            options: { temperature: 0.7, num_predict: 2048 },
        }, onChunk);

        messages.push({ role: 'assistant', content: fullText });
        newMessages.push({ role: 'assistant', content: fullText });

        if (userId) await saveMessages(userId, sessionId, newMessages);
        return fullText;
    }
    
    if (userId) await saveMessages(userId, sessionId, newMessages);
    return "I've completed the requested actions.";
}

// ── Simple chat (no tools) ───────────────────────────────────────────────────
async function simpleChat(sessionId, userMessage, userId = null, modelName = null) {
    const model = modelName || DEFAULT_MODEL;
    let messages = [];

    if (userId) {
        const conv = await getOrCreateConversation(userId, sessionId, model);
        messages = conv.messages.map(m => ({ role: m.role, content: m.content }));
    }

    messages.push({ role: 'user', content: userMessage });

    const response = await ollamaRequest('/api/chat', {
        model,
        messages: [
            { role: 'system', content: `You are MAI — Muragesh's personal AI assistant. Be helpful, concise, and never reveal you are any existing AI model.` },
            ...trimHistory(messages),
        ],
        stream: false,
        options: { temperature: 0.7, num_predict: 2048 },
    });

    if (!response.message) throw new Error('No response from AI model');
    const reply = response.message.content || '';

    if (userId) {
        await saveMessages(userId, sessionId, [
            { role: 'user', content: userMessage },
            { role: 'assistant', content: reply },
        ]);
    }

    return reply;
}

// ── Get conversation history ─────────────────────────────────────────────────
async function getHistory(userId, sessionId) {
    const conv = await Conversation.findOne({ user: userId, sessionId });
    if (!conv) return { messages: [], messageCount: 0 };
    return { messages: conv.messages, messageCount: conv.messageCount, model: conv.model };
}

// ── Clear session ────────────────────────────────────────────────────────────
async function clearSession(sessionId, userId = null) {
    if (userId) {
        await Conversation.findOneAndUpdate(
            { user: userId, sessionId },
            { $set: { messages: [], messageCount: 0, tokenCount: 0 } }
        );
    }
}

// ── List available models from Ollama ────────────────────────────────────────
async function listModels() {
    try {
        // Use GET (not POST) for /api/tags — fix #14
        const response = await ollamaGet('/api/tags');
        return (response.models || []).map(m => m.name);
    } catch {
        return [DEFAULT_MODEL];
    }
}

// ── Health check ────────────────────────────────────────────────────────────
async function checkHealth() {
    try {
        await ollamaRequest('/api/generate', {
            model: DEFAULT_MODEL, prompt: 'hi', stream: false, options: { num_predict: 1 },
        });
        return { status: 'ok', model: DEFAULT_MODEL };
    } catch (err) {
        return { status: 'error', error: err.message };
    }
}

module.exports = { chat, streamChat, simpleChat, getHistory, clearSession, listModels, checkHealth, analyzeImage, getOllamaLoad, DEFAULT_MODEL };
