const express = require('express');
const { registerUser, loginUser, guestLogin } = require('./auth.controller');
const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/guest', guestLogin);

module.exports = router;
