const asyncHandler = require('express-async-handler');
const Inquiry = require('../models/Inquiry');
const User = require('../models/User');
const Notification = require('../models/Notification');
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
        // Send automated response to customer
        try {
            const customerSubject = `We've received your inquiry - Boutique Mini Mart`;
            const customerMessage = `Hi ${name},\n\nThank you for contacting Boutique Mini Mart! We have received your inquiry regarding "${subject}".\n\nOur team will review your message and get back to you as soon as possible (usually within 24 hours).\n\nBest regards,\nThe Boutique Mini Mart Team`;
            await sendEmail({ email, subject: customerSubject, message: customerMessage });
        } catch (err) {
            console.error('Failed to send auto-response to customer:', err.message || err);
        }

        // attempt to email the inquiry to the site owner
        try {
            const to = process.env.CONTACT_EMAIL || 'victoraseko2004@gmail.com';
            const subjectLine = `New Inquiry: ${subject || 'No subject'}`;
            const body = `You have received a new inquiry from ${name} <${email}>\n\nSubject: ${subject}\n\nMessage:\n${message}`;
            await sendEmail({ email: to, subject: subjectLine, message: body });
        } catch (err) {
            // Log but don't fail the request — saving to DB succeeded
            console.error('Failed to send inquiry notification to owner:', err.message || err);
        }

        // Notify Admins in-app (Background Process)
        const notifyAdminsInApp = async () => {
            try {
                const admins = await User.find({ isAdmin: true });
                const notifications = admins.map(admin => ({
                    user: admin._id,
                    title: 'New Support Request! 💬',
                    message: `Customer ${name} is asking for help: "${subject}"`,
                    type: 'SUPPORT_REQUEST'
                }));
                await Notification.insertMany(notifications);
            } catch (e) {
                console.error('Failed to create in-app notification for admins:', e);
            }
        };
        notifyAdminsInApp();

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
