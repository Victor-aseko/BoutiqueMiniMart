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
            priority: 'high',
            channelId: 'default', // Highly critical for Android standalone apps (APK) to show popups/sound
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
                
                // Handle invalid tokens
                for (let i = 0; i < ticketChunk.length; i++) {
                    const ticket = ticketChunk[i];
                    if (ticket.status === 'error') {
                        if (ticket.details && ticket.details.error === 'DeviceNotRegistered') {
                            const staleToken = chunk[i].to;
                            const PushToken = require('../models/PushToken');
                            await PushToken.deleteOne({ token: staleToken });
                            console.log(`Notification System: Removed stale token ${staleToken}`);
                        }
                    }
                }
            } catch (error) {
                console.error('Error sending push notification chunk:', error);
            }
        }
    })();
};

module.exports = sendPushNotification;
