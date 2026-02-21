import { GoogleGenerativeAI } from "@google/generative-ai";


let modelInstance = null;

function getModel() {
    if (modelInstance) return modelInstance;
    const apiKey = import.meta.env?.VITE_GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error(
            "Missing VITE_GEMINI_API_KEY. Please add it to your .env file."
        );
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    modelInstance = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    return modelInstance;
}

export async function askGemini(prompt) {
    try {
        const text = String(prompt ?? "").trim();
        if (!text) return "Please type something to ask.";
        const model = getModel();
        const result = await model.generateContent(text);
        return result?.response?.text?.() ?? "";
    } catch (err) {
        console.error("[Ask] Gemini error:", err);
        throw err;
    }
}

export async function startChatSession(history = []) {
    try {
        const model = getModel();
        return model.startChat({
            history: history,
        });
    } catch (err) {
        console.error("[Ask] Start chat error:", err);
        throw err;
    }
}