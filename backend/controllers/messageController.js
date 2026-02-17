const asyncHandler = require('express-async-handler');
const Message = require('../models/Message');
const User = require('../models/User');

// @desc    Get all messages for a specific conversation
// @route   GET /api/messages/:userId
// @access  Private
// @desc    Get all messages for a specific conversation
// @route   GET /api/messages/:userId
// @access  Private
const getMessages = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    if (userId === 'users') {
        return res.status(400).json({ message: 'Invalid User ID' });
    }

    // Get all admin IDs to treat them as a single "Support" entity
    const admins = await User.find({ isAdmin: true }).select('_id');
    const adminIds = admins.map(a => a._id.toString());

    const isCurrentUserAdmin = adminIds.includes(currentUserId.toString());

    let query;

    if (isCurrentUserAdmin) {
        // I am admin, viewing chat with Customer `userId`
        // Show messages between Customer and ANY Admin
        query = {
            $or: [
                { sender: userId, recipient: { $in: adminIds } },
                { sender: { $in: adminIds }, recipient: userId },
            ]
        };
    } else {
        // I am customer, viewing chat with Admin
        // Show messages between Me (Customer) and ANY Admin
        query = {
            $or: [
                { sender: currentUserId, recipient: { $in: adminIds } },
                { sender: { $in: adminIds }, recipient: currentUserId },
            ]
        };
    }

    const messages = await Message.find(query).sort({ createdAt: 1 });
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

    // Determine if the current user is an admin
    const requester = await User.findById(currentUserId);
    const isRequesterAdmin = requester && requester.isAdmin;

    if (!isRequesterAdmin) {
        // I am a customer clearing my "Stylist" messages
        // Get all admin IDs to clear messages from ANY admin
        const admins = await User.find({ isAdmin: true }).select('_id');
        const adminIds = admins.map(a => a._id);

        await Message.updateMany(
            { sender: { $in: adminIds }, recipient: currentUserId, isRead: false },
            { $set: { isRead: true } }
        );
    } else {
        // I am an admin clearing messages from a specific customer
        await Message.updateMany(
            { sender: userId, recipient: currentUserId, isRead: false },
            { $set: { isRead: true } }
        );
    }

    res.json({ message: 'Messages marked as read' });
});

// @desc    Get list of users who have chatted with ANY admin
// @route   GET /api/messages/users
// @access  Private
const getChatUsers = asyncHandler(async (req, res) => {
    try {
        if (!req.user) {
            res.status(401);
            throw new Error('User context missing');
        }

        // Get all admin IDs to create a shared inbox view
        const admins = await User.find({ isAdmin: true }).select('_id');
        const adminIds = admins.map(a => a._id.toString());
        const adminIdSet = new Set(adminIds);

        // Find all messages involving ANY admin
        const messages = await Message.find({
            $or: [
                { sender: { $in: adminIds } },
                { recipient: { $in: adminIds } }
            ]
        }).sort({ createdAt: -1 }).limit(1000);

        const userMap = new Map();

        messages.forEach(msg => {
            if (!msg.sender || !msg.recipient) return;

            const senderId = msg.sender.toString();
            const recipientId = msg.recipient.toString();

            // Determine who the "Customer" is in this interaction
            let customerId = null;
            if (!adminIdSet.has(senderId)) customerId = senderId;
            else if (!adminIdSet.has(recipientId)) customerId = recipientId;

            // If it's an internal admin chat (rare), skip or handle differently
            if (!customerId) return;

            if (!userMap.has(customerId)) {
                // Check if message is unread AND directed at an Admin
                // (We count unread if Recipient is ANY Admin and !isRead)
                const isUnread = adminIdSet.has(recipientId) && !msg.isRead;

                userMap.set(customerId, {
                    _id: customerId,
                    lastMessage: msg.text || '📷 Media message',
                    createdAt: msg.createdAt,
                    unreadCount: isUnread ? 1 : 0
                });
            } else {
                const isUnread = adminIdSet.has(recipientId) && !msg.isRead;
                if (isUnread) {
                    userMap.get(customerId).unreadCount += 1;
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

// @desc    Update a message
// @route   PUT /api/messages/:id
// @access  Private
const updateMessage = asyncHandler(async (req, res) => {
    const { text } = req.body;
    const message = await Message.findById(req.params.id);

    if (!message) {
        res.status(404);
        throw new Error('Message not found');
    }

    // Only sender can edit their message
    if (message.sender.toString() !== req.user._id.toString()) {
        res.status(401);
        throw new Error('User not authorized to edit this message');
    }

    message.text = text || message.text;
    const updatedMessage = await message.save();

    res.json(updatedMessage);
});

// @desc    Delete a message
// @route   DELETE /api/messages/:id
// @access  Private
const deleteMessage = asyncHandler(async (req, res) => {
    const message = await Message.findById(req.params.id);

    if (!message) {
        res.status(404);
        throw new Error('Message not found');
    }

    // Only sender can delete their message (or Admin)
    if (message.sender.toString() !== req.user._id.toString() && !req.user.isAdmin) {
        res.status(401);
        throw new Error('User not authorized to delete this message');
    }

    await message.deleteOne();
    res.json({ message: 'Message removed' });
});

// @desc    Delete all messages between current user and specified user
// @route   DELETE /api/messages/conversation/:userId
// @access  Private
const deleteConversation = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    await Message.deleteMany({
        $or: [
            { sender: currentUserId, recipient: userId },
            { sender: userId, recipient: currentUserId }
        ]
    });

    res.json({ message: 'Conversation cleared' });
});

// @desc    Get total unread message count for current user
// @route   GET /api/messages/unread/count
// @access  Private
const getUnreadCount = asyncHandler(async (req, res) => {
    const currentUserId = req.user._id;
    const count = await Message.countDocuments({
        recipient: currentUserId,
        isRead: false
    });
    res.json({ count });
});

module.exports = {
    getMessages,
    sendMessage,
    markMessagesRead,
    getChatUsers,
    deleteMessage,
    deleteConversation,
    updateMessage,
    getUnreadCount
};
