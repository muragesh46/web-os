const express = require('express');
const router = express.Router();
const tools = require('./tools');
const aiEngine = require('./ai-engine');
const { protect } = require('../../middleware/auth.middleware');
const Conversation = require('./conversation.model');
const Reminder = require('./reminder.model');

// Fix #4: Shell command allowlist — blocks dangerous system commands
const ALLOWED_SHELL_PREFIXES = [
    'ls', 'pwd', 'echo', 'cat', 'head', 'tail', 'grep', 'find',
    'df', 'du', 'top', 'ps', 'whoami', 'date', 'uptime', 'uname',
    'open', 'osascript', 'say', 'curl', 'ping',
];
const BLOCKED_SHELL_PATTERNS = [
    /rm\s+-rf/i, /sudo/i, /chmod/i, /chown/i, /mkfs/i,
    /dd\s+if/i, /:\s*\(\s*\)\s*\{/i, // fork bomb pattern
    />\s*\/dev\/(disk|null)/i,
    /\bkillall\b/i, /\bshutdown\b/i, /\breboot\b/i,
];

function isShellCommandAllowed(command) {
    const cmd = command.trim().toLowerCase();
    // Block any dangerous patterns first
    for (const pattern of BLOCKED_SHELL_PATTERNS) {
        if (pattern.test(command)) return false;
    }
    // Allow only if starts with an approved command
    return ALLOWED_SHELL_PREFIXES.some(prefix => cmd.startsWith(prefix));
}

function getUserId(req) {
    try { if (req.user?._id) return req.user._id.toString(); } catch { }
    return null;
}

// ── AI Chat (tool calling, persistent memory, persona) ────────────────────────
router.post('/chat', protect, async (req, res) => {
    try {
        const { sessionId, message, context, model, provider } = req.body;
        if (!message?.trim()) return res.status(400).json({ error: 'Message is required' });
        const result = await aiEngine.chat(
            sessionId || 'default', message.trim(),
            { ...context, userName: req.user?.displayName },
            getUserId(req), model || null, provider
        );
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message,
            hint: error.message.includes('Ollama') ? 'Make sure Ollama is running: ollama serve' : undefined });
    }
});

// ── Streaming SSE chat ─────────────────────────────────────────────────────────
router.post('/stream', protect, async (req, res) => {
    try {
        const { sessionId, message, context, model, provider } = req.body;
        if (!message?.trim()) return res.status(400).json({ error: 'Message is required' });
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');
        res.flushHeaders();
        await aiEngine.streamChat(
            sessionId || 'default', message.trim(),
            { ...context, userName: req.user?.displayName },
            getUserId(req), model || null, provider,
            (chunk) => res.write(`data: ${JSON.stringify({ chunk })}\n\n`)
        );
        res.write('data: [DONE]\n\n');
        res.end();
    } catch (error) {
        if (!res.headersSent) res.status(500).json({ error: error.message });
        else { res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`); res.end(); }
    }
});

// ── Vision: analyze attached image ────────────────────────────────────────────
router.post('/vision', protect, async (req, res) => {
    try {
        const { imageBase64, mimeType, prompt } = req.body;
        if (!imageBase64) return res.status(400).json({ error: 'imageBase64 is required' });
        // Strip data URI prefix if present
        const base64 = imageBase64.replace(/^data:[^;]+;base64,/, '');
        const result = await aiEngine.analyzeImage(base64, mimeType || 'image/png', prompt || 'Describe this image in detail.');
        res.json({ description: result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ── Simple chat (Ask window) ──────────────────────────────────────────────────
router.post('/simple-chat', protect, async (req, res) => {
    try {
        const { sessionId, message, model } = req.body;
        if (!message?.trim()) return res.status(400).json({ error: 'Message is required' });
        const reply = await aiEngine.simpleChat(sessionId || 'default-ask', message.trim(), getUserId(req), model || null);
        res.json({ response: reply });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ── Get conversation history ──────────────────────────────────────────────────
router.get('/history/:sessionId', protect, async (req, res) => {
    try {
        const userId = getUserId(req);
        if (!userId) return res.json({ messages: [], messageCount: 0 });
        const history = await aiEngine.getHistory(userId, req.params.sessionId);
        res.json(history);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// ── List all sessions for user ────────────────────────────────────────────────
router.get('/sessions', protect, async (req, res) => {
    try {
        const userId = getUserId(req);
        if (!userId) return res.json({ sessions: [] });
        const convs = await Conversation.find({ user: userId })
            .select('sessionId messageCount model title createdAt updatedAt')
            .sort({ updatedAt: -1 })
            .limit(20);
        res.json({ sessions: convs });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// ── Clear session ─────────────────────────────────────────────────────────────
router.post('/clear-session', protect, async (req, res) => {
    await aiEngine.clearSession(req.body.sessionId || 'default', getUserId(req));
    res.json({ success: true });
});

// ── Delete a session entirely ─────────────────────────────────────────────────
router.delete('/session/:sessionId', protect, async (req, res) => {
    try {
        const userId = getUserId(req);
        if (!userId) return res.status(401).json({ error: 'Not authenticated' });
        await Conversation.findOneAndDelete({ user: userId, sessionId: req.params.sessionId });
        res.json({ success: true });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// ── Rename a session ──────────────────────────────────────────────────────────
router.patch('/session/:sessionId', protect, async (req, res) => {
    try {
        const userId = getUserId(req);
        if (!userId) return res.status(401).json({ error: 'Not authenticated' });
        await Conversation.findOneAndUpdate(
            { user: userId, sessionId: req.params.sessionId },
            { $set: { title: req.body.title } }
        );
        res.json({ success: true });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// ── List models ───────────────────────────────────────────────────────────────
router.get('/models', async (req, res) => {
    try { res.json({ models: await aiEngine.listModels() }); }
    catch (error) { res.status(500).json({ error: error.message }); }
});

// ── Ollama load / quota stats ─────────────────────────────────────────────────
router.get('/load', async (req, res) => {
    try { res.json(await aiEngine.getOllamaLoad()); }
    catch (error) { res.status(500).json({ error: error.message }); }
});

// ── Health check ──────────────────────────────────────────────────────────────
router.get('/health', async (req, res) => {
    try { res.json(await aiEngine.checkHealth()); }
    catch (error) { res.status(500).json({ status: 'error', error: error.message }); }
});

// Fix #1: Persistent reminders stored in MongoDB (was in-memory Map)
router.post('/reminder', protect, async (req, res) => {
    const { message, delayMs } = req.body;
    if (!message || !delayMs) return res.status(400).json({ error: 'message and delayMs required' });
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });
    const maxDelay = Math.min(delayMs, 3_600_000); // max 1 hr
    const firesAt = new Date(Date.now() + maxDelay);
    const reminder = await Reminder.create({ user: userId, message, firesAt });
    res.json({ success: true, reminderId: reminder._id, firesAt: reminder.firesAt.toISOString() });
});

// Poll for fired reminders — mark them as fired and return
router.get('/reminders', protect, async (req, res) => {
    const userId = getUserId(req);
    if (!userId) return res.json({ fired: [], pending: [] });
    const now = new Date();
    // Fetch fired (due and not yet marked)
    const firedDocs = await Reminder.find({ user: userId, firesAt: { $lte: now }, fired: false });
    if (firedDocs.length > 0) {
        await Reminder.updateMany(
            { _id: { $in: firedDocs.map(r => r._id) } },
            { $set: { fired: true, firedAt: now } }
        );
    }
    // Fetch pending (not yet due)
    const pendingDocs = await Reminder.find({ user: userId, firesAt: { $gt: now }, fired: false });
    res.json({
        fired: firedDocs.map(r => ({ id: r._id, message: r.message, firedAt: r.firesAt.toISOString() })),
        pending: pendingDocs.map(r => ({ id: r._id, message: r.message, firesAt: r.firesAt.toISOString() })),
    });
});

// Fix #4: Mac tool executor with shell allowlist
router.post('/mac-tool', protect, async (req, res) => {
    try {
        const { toolName, args } = req.body;
        if (!tools[toolName]) return res.status(400).json({ error: `Tool "${toolName}" not found.` });
        // Enforce shell allowlist for mac_run_shell
        if (toolName === 'mac_run_shell' || (args && args.command)) {
            const cmd = args?.command || '';
            if (!isShellCommandAllowed(cmd)) {
                return res.status(403).json({
                    error: `Shell command blocked for security: "${cmd.substring(0, 60)}". Only safe read-only commands are permitted.`
                });
            }
        }
        const result = await tools[toolName](args || {});
        res.json({ result });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// ── Screenshot ────────────────────────────────────────────────────────────────
router.post('/screenshot', protect, async (req, res) => {
    try {
        const result = await tools.takeScreenshot({});
        if (result.error) return res.status(500).json({ error: result.error });
        res.json({ base64: result.base64, mimeType: result.mimeType });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// ── Model info ────────────────────────────────────────────────────────────────
router.get('/model-info', (req, res) => {
    res.json({ model: aiEngine.DEFAULT_MODEL, engine: 'Ollama (Local)', description: "MAI — Muragesh's own AI" });
});

module.exports = router;
