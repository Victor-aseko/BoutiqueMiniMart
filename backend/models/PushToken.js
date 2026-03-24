const mongoose = require('mongoose');

const pushTokenSchema = mongoose.Schema(
    {
        token: {
            type: String,
            required: true,
            unique: true,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        platform: {
            type: String,
            enum: ['ios', 'android', 'web', 'unknown'],
            default: 'unknown',
        },
        lastUsed: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

const PushToken = mongoose.model('PushToken', pushTokenSchema);

module.exports = PushToken;
