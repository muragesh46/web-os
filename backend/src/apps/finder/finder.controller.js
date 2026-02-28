const Finder = require('./finder.model');

// @desc    Get all files/folders for a user (optionally filtered by parentId and isTrash)
// @route   GET /api/finder
// @access  Private
const getFiles = async (req, res) => {
    try {
        const { parentId, isTrash, search } = req.query;

        const query = { user: req.user._id };

        if (isTrash === 'true') {
            query.isTrash = true;
        } else {
            query.isTrash = { $ne: true };
            if (search) {
                query.name = { $regex: search, $options: 'i' };
            } else if (parentId) {
                query.parentId = parentId === 'root' ? null : parentId;
            }
        }

        const files = await Finder.find(query).sort({ type: -1, name: 1 }); // Folders first, then alphabetical
        res.json(files);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a new file or folder
// @route   POST /api/finder
// @access  Private
const createFile = async (req, res) => {
    try {
        const { name, type, parentId, fileType, content, icon, size, tags, details } = req.body;

        // Check if item with same name exists in the same folder
        const existingFile = await Finder.findOne({
            user: req.user._id,
            name,
            parentId: parentId || null,
            isTrash: false
        });

        if (existingFile) {
            return res.status(400).json({ message: `A ${type} with this name already exists in this location.` });
        }

        const file = await Finder.create({
            user: req.user._id,
            name,
            type,
            parentId: parentId || null,
            fileType: fileType || (type === 'folder' ? 'folder' : 'txt'),
            content: content || '',
            icon: icon || (type === 'folder' ? '/images/folder.png' : '/images/txt.png'),
            size: size || 0,
            tags: tags || [],
            details: details || {}
        });

        res.status(201).json(file);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update a file or folder (Rename, Move, Trash)
// @route   PUT /api/finder/:id
// @access  Private
const updateFile = async (req, res) => {
    try {
        const { name, parentId, isTrash, content, tags, details } = req.body;
        const fileId = req.params.id;

        const file = await Finder.findOne({ _id: fileId, user: req.user._id });

        if (!file) {
            return res.status(404).json({ message: 'File/Folder not found' });
        }

        // If renaming or moving, check for conflicts
        if ((name && name !== file.name) || (parentId !== undefined && parentId !== file.parentId)) {
            const checkName = name || file.name;
            const checkParent = parentId !== undefined ? (parentId || null) : file.parentId;

            const existingFile = await Finder.findOne({
                user: req.user._id,
                name: checkName,
                parentId: checkParent,
                isTrash: false,
                _id: { $ne: fileId }
            });

            if (existingFile) {
                return res.status(400).json({ message: `A file/folder named "${checkName}" already exists in the destination.` });
            }
        }

        if (name) file.name = name;
        if (parentId !== undefined) file.parentId = parentId || null;
        if (isTrash !== undefined) file.isTrash = isTrash;
        if (content !== undefined) file.content = content;
        if (tags) file.tags = tags;
        if (details) file.details = details;

        const updatedFile = await file.save();

        // If moving a folder to trash, we should probably handle its children too, 
        // but for simplicity, we can filter them out in the frontend or we can recursively trash them here.
        if (isTrash === true && file.type === 'folder') {
            // Optional: recursively trash children. 
            // await Finder.updateMany({ parentId: file._id }, { isTrash: true });
        }

        res.json(updatedFile);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a file or folder permanently
// @route   DELETE /api/finder/:id
// @access  Private
const deleteFile = async (req, res) => {
    try {
        const file = await Finder.findOne({ _id: req.params.id, user: req.user._id });

        if (!file) {
            return res.status(404).json({ message: 'File/Folder not found' });
        }

        // Keep deleting children if it's a folder
        if (file.type === 'folder') {
            await Finder.deleteMany({ parentId: file._id, user: req.user._id });
        }

        await Finder.deleteOne({ _id: file._id });

        res.json({ message: 'File removed permanently' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getFiles,
    createFile,
    updateFile,
    deleteFile
};
