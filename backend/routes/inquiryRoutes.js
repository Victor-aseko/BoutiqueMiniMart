const express = require('express');
const router = express.Router();
const {
    createInquiry,
    getInquiries,
} = require('../controllers/inquiryController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, createInquiry)
    .get(protect, admin, getInquiries);

module.exports = router;
