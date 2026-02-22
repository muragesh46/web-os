const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
    {
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        receiver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        text: {
            type: String,
            required: [true, 'Message cannot be empty'],
            trim: true,
        },
        read: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// Index for fast query of conversations between two users
messageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });

const Message = mongoose.model('Message', messageSchema);
module.exports = Message;
