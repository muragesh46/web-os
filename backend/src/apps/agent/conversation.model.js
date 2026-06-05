const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    role: { type: String, enum: ['user', 'assistant', 'tool'], required: true },
    content: { type: String, required: true },
    toolCalls: { type: Array, default: [] },
    isError: { type: Boolean, default: false },
}, { _id: false, timestamps: false });

const conversationSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    sessionId: { type: String, required: true, index: true },
    title: { type: String, default: '' },
    summary: { type: String, default: '' },
    isSummarizing: { type: Boolean, default: false },
    messages: [messageSchema],
    starredIndices: [{ type: Number }],
    model: { type: String, default: 'qwen2.5:3b' },
    tokenCount: { type: Number, default: 0 },
    messageCount: { type: Number, default: 0 },
}, { timestamps: true });

// Compound index for fast user+session lookups
conversationSchema.index({ user: 1, sessionId: 1 }, { unique: true });

module.exports = mongoose.model('Conversation', conversationSchema);
