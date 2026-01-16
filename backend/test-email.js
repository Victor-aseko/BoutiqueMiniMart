require('dotenv').config();
const sendEmail = require('./utils/sendEmail');

const test = async () => {
    try {
        console.log('Testing email send...');
        await sendEmail({
            email: 'victoraseko2004@gmail.com', // sending to self
            subject: 'Test Email',
            message: 'This is a test email to verify SMTP settings.'
        });
        console.log('Test email sent successfully!');
    } catch (error) {
        console.error('Test failed:', error);
    }
};

test();
