const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// @desc    Get current user profile
// @route   GET /api/users/me
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            isAdmin: user.isAdmin,
            addresses: user.addresses,
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Update user profile
// @route   PUT /api/users/me
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        user.name = req.body.name || user.name;
        user.email = req.body.email || user.email;

        if (req.body.password) {
            user.password = req.body.password;
        }

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            isAdmin: updatedUser.isAdmin,
            token: req.body.token, // Usually we don't return token on profile update unless changed logic
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Update user password
// @route   PUT /api/users/password
// @access  Private
const updateUserPassword = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        if (await user.matchPassword(req.body.oldPassword)) {
            user.password = req.body.newPassword;
            await user.save();
            res.json({ message: 'Password updated successfully' });
        } else {
            res.status(400);
            throw new Error('Invalid old password');
        }
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Get user addresses
// @route   GET /api/users/addresses
// @access  Private
const getAddresses = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    res.json(user.addresses);
});

// @desc    Add new address
// @route   POST /api/users/addresses
// @access  Private
const addAddress = asyncHandler(async (req, res) => {
    const { street, city, postalCode, country, isDefault } = req.body;
    const user = await User.findById(req.user._id);

    if (user) {
        const newAddress = { street, city, postalCode, country, isDefault };
        if (isDefault) {
            // Reset other addresses default status
            user.addresses.forEach(a => a.isDefault = false);
        }
        user.addresses.push(newAddress);
        await user.save();
        res.status(201).json(user.addresses);
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Save user push token
// @route   POST /api/users/push-token
// @access  Private
const savePushToken = asyncHandler(async (req, res) => {
    const { token } = req.body;
    const user = await User.findById(req.user._id);

    if (user) {
        user.pushToken = token;
        await user.save();
        res.json({ message: 'Push token saved successfully' });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

module.exports = {
    getUserProfile,
    updateUserProfile,
    updateUserPassword,
    getAddresses,
    addAddress,
    savePushToken,
};
