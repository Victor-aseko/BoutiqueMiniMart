const mongoose = require('mongoose');

const notificationSchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        title: {
            type: String,
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            required: true,
            enum: ['ORDER_PLACED', 'ORDER_STATUS_UPDATE', 'PROMOTIONAL', 'SYSTEM', 'SUPPORT_REQUEST'],
        },
        isRead: {
            type: Boolean,
            required: true,
            default: false,
        },
        orderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order',
        },
    },
    {
        timestamps: true,
    }
);

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
