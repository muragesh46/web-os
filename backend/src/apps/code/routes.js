const express = require('express');
const router = express.Router();
const { executeCode } = require('./code.controller');
const { protect } = require('../../middleware/auth.middleware');

router.post('/execute', protect, executeCode);

module.exports = router;
