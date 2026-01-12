const express = require('express');
const router = express.Router();
const {
    getMyNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getMyNotifications);
router.route('/read-all').put(protect, markAllAsRead);
router.route('/:id/read').put(protect, markAsRead);
router.route('/:id').delete(protect, deleteNotification);

module.exports = router;
