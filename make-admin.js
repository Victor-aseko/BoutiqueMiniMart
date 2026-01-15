
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const makeUserAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        // You can change this email to the user you want to make admin
        const email = 'Miniboutique043@gmail.com';
        // OR ask the user for their email? 
        // For now, I'll list users and ask to pick or just pick the first one?
        // Let's just update the specific user IF they exist, or list all users.

        console.log(`Attempting to make user with email ${email} an admin...`);

        // Try to find the user likely to be the owner/admin
        let user = await User.findOne({ email: email });

        if (!user) {
            console.log(`User ${email} not found. Listing all users...`);
            const users = await User.find({});
            users.forEach(u => {
                console.log(`- ${u.name} (${u.email}) [Admin: ${u.isAdmin}]`);
            });
            console.log('\nPlease edit this script (backend/make-admin.js) to set the correct email variable at line 12 if you want to promote a specific user.');
        } else {
            user.isAdmin = true;
            await user.save();
            console.log(`SUCCESS: User ${user.name} (${user.email}) is now an Admin.`);
        }

        process.exit();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

makeUserAdmin();
