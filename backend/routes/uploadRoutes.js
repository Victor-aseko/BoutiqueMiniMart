const express = require('express');
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const dotenv = require('dotenv');

dotenv.config();

const router = express.Router();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'djsgmue0r',
    api_key: process.env.CLOUDINARY_API_KEY || '461177557342769',
    api_secret: process.env.CLOUDINARY_API_SECRET || '5oDpli1BZ_xp3fgeNvl_u6zUxXU',
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'boutique_mini_mart',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    },
});

const upload = multer({ storage: storage });

router.post('/', upload.single('image'), (req, res) => {
    res.send({
        image: req.file.path,
    });
});

module.exports = router;
