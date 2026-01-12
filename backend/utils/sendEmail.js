const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // Debug log to verify configuration is loaded
    console.log('Attempting to send email with settings:', {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        user: process.env.SMTP_EMAIL,
        from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`
    });

    const port = Number(process.env.SMTP_PORT) || 587;
    const isGmail = (process.env.SMTP_HOST && process.env.SMTP_HOST.includes('gmail')) || process.env.SMTP_SERVICE === 'gmail';

    const transportOptions = isGmail
        ? {
            service: 'gmail',
            auth: {
                user: process.env.SMTP_EMAIL,
                pass: (process.env.SMTP_PASSWORD || '').replace(/\s+/g, ''),
            },
        }
        : {
            host: process.env.SMTP_HOST,
            port,
            secure: port === 465, // true for 465, false for other ports
            requireTLS: true,
            tls: { rejectUnauthorized: false },
            auth: {
                user: process.env.SMTP_EMAIL,
                pass: process.env.SMTP_PASSWORD,
            },
        };

    console.log('Using transport options for email send', { isGmail, port });

    const transporter = nodemailer.createTransport(transportOptions);

    try {
        // verify connection configuration
        await transporter.verify();
        console.log('SMTP transporter verified');
    } catch (err) {
        console.error('SMTP transporter verification failed:', err && err.message ? err.message : err);
        throw err;
    }

    const message = {
        from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
    };

    try {
        const info = await transporter.sendMail(message);
        console.log('Message sent: %s', info.messageId);
        return info;
    } catch (err) {
        console.error('Error sending email:', err && (err.response || err.message) ? (err.response || err.message) : err);
        throw err;
    }
};

module.exports = sendEmail;
