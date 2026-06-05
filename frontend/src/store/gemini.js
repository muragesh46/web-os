/**
 * ═══════════════════════════════════════════════════════════════════════════════
 *  Muragesh's AI — Local LLM Chat Service (replaces Gemini)
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 *  This talks to YOUR OWN AI model running on Ollama via the backend.
 *  No API keys. No Google. Fully yours.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001';

// Generate unique session ID for each "Ask" chat window
let askSessionId = `ask-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

/**
 * Send a message to your own AI model and get a response.
 * Replaces the old askGemini() function.
 */
export async function askGemini(prompt) {
    try {
        const text = String(prompt ?? "").trim();
        if (!text) return "Please type something to ask.";

        const res = await axios.post(`${API_BASE_URL}/api/agent/simple-chat`, {
            sessionId: askSessionId,
            message: text,
        });

        return res.data.response || "";
    } catch (err) {
        console.error("[Ask] AI error:", err);
        if (err.response?.data?.hint) {
            throw new Error(`${err.response.data.error}. ${err.response.data.hint}`);
        }
        throw err;
    }
}

/**
 * Start a new chat session.
 * Returns a session object compatible with the old Gemini chat API.
 */
export async function startChatSession() {
    // Reset session ID for a fresh chat
    askSessionId = `ask-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // Clear old session on backend
    try {
        await axios.post(`${API_BASE_URL}/api/agent/clear-session`, {
            sessionId: askSessionId,
        });
    } catch {
        // Ignore if backend isn't ready yet
    }

    // Return a session-like object with sendMessage() to maintain API compatibility
    return {
        sendMessage: async (text) => {
            const res = await axios.post(`${API_BASE_URL}/api/agent/simple-chat`, {
                sessionId: askSessionId,
                message: String(text).trim(),
            });
            return {
                response: {
                    text: () => res.data.response || "",
                }
            };
        }
    };
}