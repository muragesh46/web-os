const Photo = require('./photos.model');

// @desc    Get all photos for the logged-in user
// @route   GET /api/photos
// @access  Private
const getPhotos = async (req, res) => {
    try {
        const photos = await Photo.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.json(photos);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Upload a new photo
// @route   POST /api/photos
// @access  Private
const uploadPhoto = async (req, res) => {
    try {
        const { imageUrl, title, album, isFavorite } = req.body;

        if (!imageUrl) {
            return res.status(400).json({ message: 'imageUrl is required' });
        }

        const photo = await Photo.create({
            user: req.user._id,
            imageUrl,
            title: title || 'Untitled',
            album: album || 'Library',
            isFavorite: isFavorite || false,
        });

        res.status(201).json(photo);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a photo
// @route   DELETE /api/photos/:id
// @access  Private
const deletePhoto = async (req, res) => {
    try {
        const photo = await Photo.findOne({ _id: req.params.id, user: req.user._id });

        if (!photo) {
            return res.status(404).json({ message: 'Photo not found' });
        }

        await Photo.deleteOne({ _id: photo._id });
        res.json({ message: 'Photo deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update a photo
// @route   PUT /api/photos/:id
// @access  Private
const updatePhoto = async (req, res) => {
    try {
        const { isFavorite, album } = req.body;
        const photo = await Photo.findOne({ _id: req.params.id, user: req.user._id });

        if (!photo) {
            return res.status(404).json({ message: 'Photo not found' });
        }

        if (isFavorite !== undefined) photo.isFavorite = isFavorite;
        if (album !== undefined) photo.album = album;

        await photo.save();
        res.json(photo);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getPhotos,
    uploadPhoto,
    deletePhoto,
    updatePhoto,
};
