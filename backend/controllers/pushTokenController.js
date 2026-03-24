const asyncHandler = require('express-async-handler');
const PushToken = require('../models/PushToken');

// @desc    Register a push token
// @route   POST /api/push-tokens
// @access  Public
const registerPushToken = asyncHandler(async (req, res) => {
    const { token, platform, user } = req.body;

    if (!token) {
        res.status(400);
        throw new Error('Token is required');
    }

    // Try to find if the token already exists
    let pushToken = await PushToken.findOne({ token });

    if (pushToken) {
        // Update user if provided (e.g. user just logged in)
        if (user) {
            pushToken.user = user;
        }
        pushToken.lastUsed = Date.now();
        if (platform) {
            pushToken.platform = platform;
        }
        await pushToken.save();
    } else {
        // Create new push token entry
        pushToken = await PushToken.create({
            token,
            user: user || null,
            platform: platform || 'unknown',
            lastUsed: Date.now(),
        });
    }

    res.status(201).json(pushToken);
});

module.exports = {
    registerPushToken,
};
