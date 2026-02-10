const asyncHandler = require('express-async-handler');
const Message = require('../models/Message');
const User = require('../models/User');

// @desc    Get all messages for a specific conversation
// @route   GET /api/messages/:userId
// @access  Private
const getMessages = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    // Prevention: If userId is 'users', don't run the find query to avoid CastError
    if (userId === 'users') {
        return res.status(400).json({ message: 'Invalid User ID' });
    }

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

    if (userId === 'users') return res.status(400).send();

    await Message.updateMany(
        { sender: userId, recipient: currentUserId, isRead: false },
        { $set: { isRead: true } }
    );

    res.json({ message: 'Messages marked as read' });
});

// @desc    Get list of users who have chatted with the admin
// @route   GET /api/messages/users
// @access  Private
const getChatUsers = asyncHandler(async (req, res) => {
    try {
        if (!req.user) {
            res.status(401);
            throw new Error('User context missing');
        }

        const adminId = req.user._id;

        // Find all messages involving the admin
        const messages = await Message.find({
            $or: [{ sender: adminId }, { recipient: adminId }]
        }).sort({ createdAt: -1 }).limit(500);

        const userMap = new Map();

        messages.forEach(msg => {
            if (!msg.sender || !msg.recipient) return;

            const otherUserId = msg.sender.toString() === adminId.toString()
                ? msg.recipient.toString()
                : msg.sender.toString();

            if (otherUserId === adminId.toString()) return;

            if (!userMap.has(otherUserId)) {
                userMap.set(otherUserId, {
                    _id: otherUserId,
                    lastMessage: msg.text || '📷 Media message',
                    createdAt: msg.createdAt,
                    unreadCount: (msg.recipient.toString() === adminId.toString() && !msg.isRead) ? 1 : 0
                });
            } else {
                if (msg.recipient.toString() === adminId.toString() && !msg.isRead) {
                    userMap.get(otherUserId).unreadCount += 1;
                }
            }
        });

        const userIds = Array.from(userMap.keys());

        if (userIds.length === 0) return res.json([]);

        const users = await User.find({ _id: { $in: userIds } }).select('name email');

        const result = users.map(user => {
            const extra = userMap.get(user._id.toString());
            return {
                ...extra,
                name: user.name,
                email: user.email
            };
        }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.json(result);
    } catch (error) {
        console.error('SERVER CHAT ERROR:', error);
        res.status(500).json({ message: error.message, stack: error.stack });
    }
});

module.exports = {
    getMessages,
    sendMessage,
    markMessagesRead,
    getChatUsers,
};
