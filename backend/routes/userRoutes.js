const express = require('express');
const router = express.Router();
const {
    getUserProfile,
    updateUserProfile,
    updateUserPassword,
    getAddresses,
    addAddress,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.route('/me').get(protect, getUserProfile).put(protect, updateUserProfile);
router.route('/password').put(protect, updateUserPassword);
router.route('/addresses').get(protect, getAddresses).post(protect, addAddress);

module.exports = router;
