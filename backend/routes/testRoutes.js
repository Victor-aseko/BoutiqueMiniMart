const express = require('express');
const router = express.Router();
const sendEmail = require('../utils/sendEmail');

// GET /api/test-email -> unauthenticated test for SMTP
router.get('/', async (req, res) => {
    try {
        const to = process.env.CONTACT_EMAIL || process.env.SMTP_EMAIL;
        const info = await sendEmail({
            email: to,
            subject: 'SMTP Test from BoutiqueMiniMart',
            message: `This is a test email sent at ${new Date().toISOString()}`
        });
        res.json({ success: true, info: info && info.messageId ? info.messageId : info });
    } catch (err) {
        res.status(500).json({ success: false, error: err && (err.message || err.toString()) });
    }
});

module.exports = router;
