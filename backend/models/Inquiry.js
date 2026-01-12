const mongoose = require('mongoose');

const inquirySchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
        },
        subject: {
            type: String,
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
        isRead: {
            type: Boolean,
            required: true,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

const Inquiry = mongoose.model('Inquiry', inquirySchema);

module.exports = Inquiry;
