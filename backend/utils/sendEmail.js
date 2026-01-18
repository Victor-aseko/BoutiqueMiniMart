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
            host: 'smtp.gmail.com',
            port: 587,
            secure: false, // Use STARTTLS
            auth: {
                user: process.env.SMTP_EMAIL,
                pass: (process.env.SMTP_PASSWORD || '').replace(/\s+/g, ''),
            },
            connectionTimeout: 15000,
            greetingTimeout: 15000,
            socketTimeout: 15000,
            tls: {
                rejectUnauthorized: false
            }
        }
        : {
            host: process.env.SMTP_HOST,
            port,
            secure: port === 465, // true for 465, false for other ports
            requireTLS: true,
            tls: { rejectUnauthorized: false },
            connectionTimeout: 15000,
            socketTimeout: 15000,
            auth: {
                user: process.env.SMTP_EMAIL,
                pass: process.env.SMTP_PASSWORD,
            },
        };

    console.log('Final transport configuration:', {
        host: transportOptions.host,
        port: transportOptions.port,
        secure: transportOptions.secure,
        connectionType: transportOptions.secure ? 'SSL/TLS (Port 465)' : 'STARTTLS (Port 587)',
        user: transportOptions.auth.user
    });

    const transporter = nodemailer.createTransport(transportOptions);

    try {
        // verify connection configuration
        await transporter.verify();
        console.log('SMTP transporter verified successfully');
    } catch (err) {
        console.error('SMTP transporter verification failed:', err);
        throw new Error(`SMTP Verification Error: ${err.message}`);
    }

    const message = {
        from: `"${process.env.FROM_NAME || 'BoutiqueMiniMart'}" <${process.env.FROM_EMAIL}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
    };

    console.log(`Sending email to: ${options.email} with subject: ${options.subject}`);

    try {
        const info = await transporter.sendMail(message);
        console.log('Email sent successfully! Message ID:', info.messageId);
        return info;
    } catch (err) {
        console.error('Error in sendMail:', err);
        if (err.code === 'EAUTH') {
            console.error('CRITICAL: SMTP Authentication Failed. Check App Password.');
        }
        throw new Error(`Email delivery failed: ${err.message}`);
    }
};

module.exports = sendEmail;
