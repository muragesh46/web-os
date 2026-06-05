const mongoose = require('mongoose');

/**
 * Persistent reminder model — fix #1 (was in-memory Map, lost on restart).
 */
const reminderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    message: { type: String, required: true },
    firesAt: { type: Date, required: true, index: true },
    fired: { type: Boolean, default: false },
    firedAt: { type: Date, default: null },
}, { timestamps: true });

// Auto-expire documents 7 days after firing
reminderSchema.index({ firedAt: 1 }, { expireAfterSeconds: 604800, sparse: true });

module.exports = mongoose.model('Reminder', reminderSchema);
