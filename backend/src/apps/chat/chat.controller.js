const Message = require('./message.model');
const User = require('../auth/user.model');

// @desc    Get contacts of the current user
// @route   GET /api/chat/users
// @access  Protected
const getUsers = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate({
            path: 'contacts',
            select: 'fullName displayName email isOnline',
            options: { sort: { isOnline: -1, displayName: 1 } }
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const validContacts = (user.contacts || []).filter((c) => c != null);
        res.json(validContacts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Search for users to add as contacts
// @route   GET /api/chat/search?query=...
// @access  Protected
const searchUsers = async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) {
            return res.json([]);
        }

        const currentUser = await User.findById(req.user._id);
        const contactIds = (currentUser && currentUser.contacts) ? currentUser.contacts : [];
        const validContactIds = contactIds.filter(id => id != null);

        const users = await User.find({
            $and: [
                { _id: { $ne: req.user._id } }, // Not me
                { _id: { $nin: validContactIds } },  // Not already a contact
                {
                    $or: [
                        { displayName: { $regex: query, $options: 'i' } },
                        { email: { $regex: query, $options: 'i' } },
                        { fullName: { $regex: query, $options: 'i' } }
                    ]
                }
            ]
        })
            .select('fullName displayName email isOnline')
            .limit(10);

        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add a user to contacts
// @route   POST /api/chat/add-contact
// @access  Protected
const addContact = async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        const currentUser = await User.findById(req.user._id);
        const otherUser = await User.findById(userId);

        if (!otherUser) {
            return res.status(404).json({ message: 'User to add not found' });
        }

        // Check if already in contacts
        const isAlreadyContact = (currentUser.contacts || []).some(
            (id) => id && id.toString() === userId.toString()
        );

        if (isAlreadyContact) {
            return res.status(400).json({ message: 'User is already in contacts' });
        }

        // Add to the current user's contacts
        if (!currentUser.contacts) currentUser.contacts = [];
        currentUser.contacts.push(userId);
        await currentUser.save();

        // Mutual add: Also add current user to the other person's contacts
        if (!otherUser.contacts) otherUser.contacts = [];
        const otherUserHasCurrentUser = otherUser.contacts.some(
            (id) => id && id.toString() === currentUser._id.toString()
        );

        if (!otherUserHasCurrentUser) {
            otherUser.contacts.push(currentUser._id);
            await otherUser.save();
        }

        const addedUser = await User.findById(userId).select('fullName displayName email isOnline');
        res.json(addedUser);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get messages between current user and another user
// @route   GET /api/chat/messages/:userId
// @access  Protected
const getMessages = async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user._id;

        const messages = await Message.find({
            $or: [
                { sender: currentUserId, receiver: userId },
                { sender: userId, receiver: currentUserId },
            ],
        })
            .sort({ createdAt: 1 })
            .limit(200)
            .populate('sender', 'displayName fullName email')
            .populate('receiver', 'displayName fullName email');

        // Mark unread messages from the other user as read
        await Message.updateMany(
            { sender: userId, receiver: currentUserId, read: false },
            { $set: { read: true } }
        );

        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get unread message counts per sender
// @route   GET /api/chat/unread
// @access  Protected
const getUnreadCounts = async (req, res) => {
    try {
        const counts = await Message.aggregate([
            { $match: { receiver: req.user._id, read: false } },
            { $group: { _id: '$sender', count: { $sum: 1 } } },
        ]);

        const result = {};
        counts.forEach((c) => {
            result[c._id.toString()] = c.count;
        });

        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getUsers, searchUsers, addContact, getMessages, getUnreadCounts };
