const mongoose = require('mongoose');

const finderSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        type: {
            type: String,
            required: true,
            enum: ['file', 'folder'],
        },
        parentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Finder',
            default: null, // null means it's in the root directory
        },
        fileType: {
            type: String, // e.g., 'txt', 'pdf', 'img', 'url', 'folder'
            default: 'folder',
        },
        content: {
            type: String, // Can store text content, URL, or image path
            default: '',
        },
        icon: {
            type: String, // e.g., '/images/folder.png'
            default: '/images/folder.png',
        },
        size: {
            type: Number, // File size in bytes (optional)
            default: 0,
        },
        isTrash: {
            type: Boolean,
            default: false, // true if moved to Trash
        },
        tags: [
            {
                type: String,
            }
        ],
        // Additional properties that might be needed for specific file types
        details: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        }
    },
    {
        timestamps: true,
    }
);

const Finder = mongoose.model('Finder', finderSchema);
module.exports = Finder;
