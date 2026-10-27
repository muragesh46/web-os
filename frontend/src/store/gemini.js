/**
 * ═══════════════════════════════════════════════════════════════════════════════
 *  Ask AI — Google Gemini Intelligence Service
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 *  Supports backend proxying as well as direct client-side fallback
 *  using the user's stored Google Gemini API key.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || (import.meta.env.PROD ? '' : 'http://localhost:3001');

// Generate unique session ID for each "Ask" chat window
let askSessionId = `ask-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

/**
 * Direct call to Google Gemini API
 */
export async function directGeminiGenerate(prompt, apiKey) {
    const key = apiKey || localStorage.getItem('gemini_api_key') || import.meta.env.VITE_GEMINI_API_KEY || '';
    if (!key) throw new Error("Please enter your Gemini API key to activate AI.");

    const candidateModels = ['gemini-3.8-flash'];
    let lastError = null;

    for (const model of candidateModels) {
        try {
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ role: 'user', parts: [{ text: prompt }] }],
                }),
            });

            if (res.ok) {
                const data = await res.json();
                const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
                if (reply) return reply;
            } else {
                const errData = await res.json().catch(() => ({}));
                const errMsg = errData.error?.message || `Gemini API error: ${res.status}`;
                if (res.status === 429 || errMsg.includes('quota') || errMsg.includes('rate limit') || errMsg.includes('leaked')) {
                    throw new Error(errMsg);
                }
                lastError = new Error(errMsg);
            }
        } catch (err) {
            if (err.message && (err.message.includes('quota') || err.message.includes('rate limit') || err.message.includes('leaked'))) {
                throw err;
            }
            lastError = err;
        }
    }

    throw lastError || new Error("Failed to get response from Gemini API.");
}

/**
 * Send a message to AI and get a response.
 */
export async function askGemini(prompt) {
    const text = String(prompt ?? "").trim();
    if (!text) return "Please type something to ask.";

    const key = localStorage.getItem('gemini_api_key') || import.meta.env.VITE_GEMINI_API_KEY || '';

    // First try backend proxy
    try {
        const res = await axios.post(`${API_BASE_URL}/api/agent/simple-chat`, {
            sessionId: askSessionId,
            message: text,
            apiKey: key || undefined,
        }, { timeout: 15000 });

        if (res.data?.response) return res.data.response;
    } catch (err) {
        const errMsg = err.response?.data?.error || err.message || '';
        // If backend returned a rate limit, quota exceeded, or leaked key error, fail fast - do NOT double-request directly
        if (err.response?.status === 429 || errMsg.includes('rate limit') || errMsg.includes('quota') || errMsg.includes('leaked')) {
            throw new Error(errMsg || "Gemini rate limit / quota exceeded. Please wait a moment.");
        }
        console.warn("[Ask] Backend proxy failed, attempting direct Gemini:", err.message);
    }

    // Direct Gemini fallback only if proxy failed due to network / offline backend
    return await directGeminiGenerate(text, key);
}

/**
 * Start a new chat session.
 * Returns a session object compatible with chat API.
 */
export async function startChatSession() {
    askSessionId = `ask-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    try {
        await axios.post(`${API_BASE_URL}/api/agent/clear-session`, {
            sessionId: askSessionId,
        });
    } catch {
        // Ignore if backend isn't ready
    }

    return {
        sendMessage: async (text) => {
            const reply = await askGemini(text);
            return {
                response: {
                    text: () => reply || "",
                }
            };
        }
    };
}