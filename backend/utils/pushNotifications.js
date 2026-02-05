const { Expo } = require('expo-server-sdk');

// Create a new Expo SDK client
let expo = new Expo();

/**
 * Send a push notification to one or more users
 * @param {Array} pushTokens - Array of Expo push tokens
 * @param {String} title - Notification title
 * @param {String} body - Notification body text
 * @param {Object} data - Additional data to send with notification
 */
const sendPushNotification = async (pushTokens, title, body, data = {}) => {
    let messages = [];

    // Filter and prepare messages
    for (let pushToken of pushTokens) {
        // Check that all your push tokens appear to be valid Expo push tokens
        if (!Expo.isExpoPushToken(pushToken)) {
            console.error(`Push token ${pushToken} is not a valid Expo push token`);
            continue;
        }

        // Construct a message
        messages.push({
            to: pushToken,
            sound: 'default',
            title: title,
            body: body,
            data: data,
        });
    }

    // Batch messages to send to Expo
    let chunks = expo.chunkPushNotifications(messages);
    let tickets = [];

    (async () => {
        // Send the chunks to the Expo push notification service
        for (let chunk of chunks) {
            try {
                let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
                console.log('Push tickets:', ticketChunk);
                tickets.push(...ticketChunk);
                // NOTE: If a ticket contains an error code in ticket.details.error, you
                // must handle it appropriately. The error codes are listed in the Expo
                // documentation, and mean things like the token is invalid or no longer
                // working for this person.
            } catch (error) {
                console.error('Error sending push notification chunk:', error);
            }
        }
    })();
};

module.exports = sendPushNotification;
