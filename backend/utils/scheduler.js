const Order = require('../models/Order');

/**
 * Automates background tasks like cleaning up old orders.
 * Runs once every 24 hours when the server starts.
 */
const initScheduler = () => {
    console.log('--- Order Cleanup Scheduler Initialized ---');

    // Run cleanup once on startup
    cleanupOldOrders();

    // Set interval to run every 24 hours (24 * 60 * 60 * 1000 ms)
    setInterval(cleanupOldOrders, 24 * 60 * 60 * 1000);
};

const cleanupOldOrders = async () => {
    try {
        console.log('Running scheduled task: Deleting orders older than 7 days...');

        // Calculate the date 7 days ago
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        // Delete orders where createdAt is less than sevenDaysAgo
        // IMPORTANT: We might only want to delete 'Delivered' or 'Cancelled' orders, 
        // but the request was to "clear orders that has last for 7 days".
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

module.exports = initScheduler;
