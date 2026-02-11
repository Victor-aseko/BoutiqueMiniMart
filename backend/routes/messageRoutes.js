const express = require('express');
const router = express.Router();
const {
    getMessages,
    sendMessage,
    markMessagesRead,
    getChatUsers,
    deleteMessage,
    deleteConversation,
    updateMessage
} = require('../controllers/messageController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/').post(protect, sendMessage);
router.route('/users').get(protect, admin, getChatUsers);
router.route('/conversation/:userId').delete(protect, deleteConversation);
router.route('/:userId').get(protect, getMessages);
router.route('/:userId/read').put(protect, markMessagesRead);
router.route('/:id').put(protect, updateMessage).delete(protect, deleteMessage);

module.exports = router;
