const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth.middleware.js');
const { getFiles, createFile, updateFile, deleteFile } = require('./finder.controller.js');

router.route('/')
    .get(protect, getFiles)
    .post(protect, createFile);

router.route('/:id')
    .put(protect, updateFile)
    .delete(protect, deleteFile);

module.exports = router;
