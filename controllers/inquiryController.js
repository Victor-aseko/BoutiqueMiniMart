const asyncHandler = require('express-async-handler');
const Inquiry = require('../models/Inquiry');
const sendEmail = require('../utils/sendEmail');

// @desc    Create new inquiry
// @route   POST /api/inquiries
// @access  Private
const createInquiry = asyncHandler(async (req, res) => {
    const { name, email, subject, message } = req.body;

    const inquiry = await Inquiry.create({
        user: req.user._id,
        name,
        email,
        subject,
        message,
    });

    if (inquiry) {
        // attempt to email the inquiry to the site owner
        try {
            const to = process.env.CONTACT_EMAIL || 'victoraseko2004@gmail.com';
            const subjectLine = `New Inquiry: ${subject || 'No subject'}`;
            const body = `You have received a new inquiry from ${name} <${email}>\n\nSubject: ${subject}\n\nMessage:\n${message}`;
            await sendEmail({ email: to, subject: subjectLine, message: body });
        } catch (err) {
            // Log but don't fail the request — saving to DB succeeded
            console.error('Failed to send inquiry email:', err.message || err);
        }

        res.status(201).json({
            success: true,
            data: inquiry
        });
    } else {
        res.status(400);
        throw new Error('Invalid inquiry data');
    }
});

// @desc    Get all inquiries
// @route   GET /api/inquiries
// @access  Private/Admin
const getInquiries = asyncHandler(async (req, res) => {
    const inquiries = await Inquiry.find({}).populate('user', 'name email');
    res.json(inquiries);
});

module.exports = {
    createInquiry,
    getInquiries,
};
