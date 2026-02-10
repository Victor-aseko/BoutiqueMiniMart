const asyncHandler = require('express-async-handler');
const Message = require('../models/Message');

// @desc    Get all messages for a specific conversation
// @route   GET /api/messages/:userId
// @access  Private
const getMessages = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    const messages = await Message.find({
        $or: [
            { sender: currentUserId, recipient: userId },
            { sender: userId, recipient: currentUserId },
        ],
    }).sort({ createdAt: 1 });

    res.json(messages);
});

// @desc    Send a message
// @route   POST /api/messages
// @access  Private
const sendMessage = asyncHandler(async (req, res) => {
    const { recipientId, text, image } = req.body;
    const senderId = req.user._id;

    if (!text && !image) {
        res.status(400);
        throw new Error('Please provide either text or an image');
    }

    const message = await Message.create({
        sender: senderId,
        recipient: recipientId,
        text,
        image,
    });

    if (message) {
        // Send Push Notification to recipient
        const User = require('../models/User');
        const sendPushNotification = require('../utils/pushNotifications');
        const recipient = await User.findById(recipientId);

        if (recipient && recipient.pushToken) {
            const sender = await User.findById(senderId);
            const title = `New Message from ${sender.name} 💬`;
            const body = text || 'Sent an image';
            await sendPushNotification([recipient.pushToken], title, body, {
                screen: 'Chat',
                senderId: senderId
            });
        }

        res.status(201).json(message);
    } else {
        res.status(400);
        throw new Error('Invalid message data');
    }
});

// @desc    Mark messages as read
// @route   PUT /api/messages/:userId/read
// @access  Private
const markMessagesRead = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    await Message.updateMany(
        { sender: userId, recipient: currentUserId, isRead: false },
        { $set: { isRead: true } }
    );

    res.json({ message: 'Messages marked as read' });
});

module.exports = {
    getMessages,
    sendMessage,
    markMessagesRead,
};
