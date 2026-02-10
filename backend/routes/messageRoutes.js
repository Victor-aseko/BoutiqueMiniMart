const express = require('express');
const router = express.Router();
const {
    getMessages,
    sendMessage,
    markMessagesRead,
} = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').post(protect, sendMessage);
router.route('/:userId').get(protect, getMessages);
router.route('/:userId/read').put(protect, markMessagesRead);

module.exports = router;
