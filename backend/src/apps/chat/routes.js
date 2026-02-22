const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth.middleware');
const { getUsers, getMessages, getUnreadCounts, searchUsers, addContact } = require('./chat.controller');

router.get('/users', protect, getUsers);
router.get('/search', protect, searchUsers);
router.post('/add-contact', protect, addContact);
router.get('/messages/:userId', protect, getMessages);
router.get('/unread', protect, getUnreadCounts);

module.exports = router;
