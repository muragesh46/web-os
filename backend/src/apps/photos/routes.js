const express = require('express');
const router = express.Router();
const { getPhotos, uploadPhoto, deletePhoto, updatePhoto } = require('./photos.controller');
const { protect } = require('../../middleware/auth.middleware');

router.route('/')
    .get(protect, getPhotos)
    .post(protect, uploadPhoto);

router.route('/:id')
    .put(protect, updatePhoto)
    .delete(protect, deletePhoto);

module.exports = router;
