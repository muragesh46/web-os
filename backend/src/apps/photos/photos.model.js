const mongoose = require('mongoose');

const photoSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    imageUrl: {
        type: String,
        required: true,
    },
    title: {
        type: String,
        default: 'Untitled',
    },
    isFavorite: {
        type: Boolean,
        default: false,
    },
    album: {
        type: String,
        default: 'Library',
        // e.g., 'Library', 'Memories', 'Places', 'People'
    }
}, { timestamps: true });

const Photo = mongoose.model('Photo', photoSchema);
module.exports = Photo;
