const Order = require('../models/Order');

const Notification = require('../models/Notification');

/**
 * Automates background tasks like cleaning up old orders and notifications.
 * Runs once every 24 hours when the server starts.
 */
const initScheduler = () => {
    console.log('--- Cleanup Scheduler Initialized ---');

    // Run cleanup once on startup
    cleanupOldOrders();
    cleanupOldNotifications();

    // Set interval to run every 24 hours (24 * 60 * 60 * 1000 ms)
    setInterval(() => {
        cleanupOldOrders();
        cleanupOldNotifications();
    }, 24 * 60 * 60 * 1000);
};

const cleanupOldOrders = async () => {
    try {
        console.log('Running scheduled task: Deleting orders older than 7 days...');

        // Calculate the date 7 days ago
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        // Delete orders where createdAt is less than sevenDaysAgo
        const result = await Order.deleteMany({
            createdAt: { $lt: sevenDaysAgo }
        });

        if (result.deletedCount > 0) {
            console.log(`Success: Deleted ${result.deletedCount} old orders.`);
        } else {
            console.log('No orders older than 7 days found.');
        }
    } catch (error) {
        console.error('Error during scheduled order cleanup:', error);
    }
};

const cleanupOldNotifications = async () => {
    try {
        console.log('Running scheduled task: Deleting notifications older than 3 days...');

        // Calculate the date 3 days ago
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

        // Delete notifications where createdAt is less than threeDaysAgo
        const result = await Notification.deleteMany({
            createdAt: { $lt: threeDaysAgo }
        });

        if (result.deletedCount > 0) {
            console.log(`Success: Deleted ${result.deletedCount} old notifications.`);
        } else {
            console.log('No notifications older than 3 days found.');
        }
    } catch (error) {
        console.error('Error during scheduled notification cleanup:', error);
    }
};

module.exports = initScheduler;
