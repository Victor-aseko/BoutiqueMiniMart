const express = require('express');
const router = express.Router();
const {
    getMessages,
    sendMessage,
    markMessagesRead,
    getChatUsers,
} = require('../controllers/messageController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/').post(protect, sendMessage);
router.route('/users').get(protect, admin, getChatUsers);
router.route('/:userId').get(protect, getMessages);
router.route('/:userId/read').put(protect, markMessagesRead);

module.exports = router;
