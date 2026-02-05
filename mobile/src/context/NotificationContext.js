import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform, Alert } from 'react-native';
import api from '../services/api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

// SILENCE PATCH: Disable module in Expo Go to avoid SDK 53+ red-box errors
const IS_EXPO_GO = Constants.appOwnership === 'expo';

if (!IS_EXPO_GO) {
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
        }),
    });
}

export const NotificationProvider = ({ children }) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [expoPushToken, setExpoPushToken] = useState('');
    const notificationListener = useRef();
    const responseListener = useRef();

    const fetchNotifications = useCallback(async () => {
        if (!user || !user.token) return;
        setIsLoading(true);
        try {
            const response = await api.get('/notifications');
            setNotifications(response.data);
            const unread = response.data.filter(n => !n.isRead).length;
            setUnreadCount(unread);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    const registerForPushNotificationsAsync = async () => {
        let token;

        console.log('Registering for notifications... Environment:', IS_EXPO_GO ? 'Expo Go' : 'Standard');

        // Step 1: Request Permissions
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.log('Permission not granted');
            return;
        }

        // Step 2: Fetch Token (This part IS skipped in Expo Go to avoid crashes)
        if (!IS_EXPO_GO) {
            try {
                const projectId = Constants?.expoConfig?.extra?.eas?.projectId || Constants?.easConfig?.projectId;
                token = (await Notifications.getExpoPushTokenAsync({
                    projectId: projectId,
                })).data;
                console.log('Push Token Generated:', token);
            } catch (e) {
                console.warn('Notification Token Error:', e.message);
                if (Constants.appOwnership === 'expo') {
                    console.warn('Note: Push notifications require a development build in Expo SDK 53+');
                }
            }
        } else {
            console.log('Token generation skipped in Expo Go');
        }

        // Step 3: Send token to backend
        if (user && token) {
            try {
                await api.post('/users/push-token', { token });
                console.log('Push token saved to backend');
            } catch (error) {
                console.error('Error saving push token:', error);
            }
        }
        // Step 4: Android Channel
        if (Platform.OS === 'android') {
            Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        }

        return token;
    };

    useEffect(() => {
        if (user) {
            fetchNotifications();
            registerForPushNotificationsAsync().then(token => setExpoPushToken(token));

            // This listener is fired whenever a notification is received while the app is foregrounded
            notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
                // Refresh local notifications list when one arrives
                fetchNotifications();
            });

            // This listener is fired whenever a user taps on or interacts with a notification
            responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
                console.log('Notification tapped:', response);
            });

            const interval = setInterval(fetchNotifications, 30000);
            return () => {
                clearInterval(interval);
                Notifications.removeNotificationSubscription(notificationListener.current);
                Notifications.removeNotificationSubscription(responseListener.current);
            };
        } else {
            setNotifications([]);
            setUnreadCount(0);
        }
    }, [user, fetchNotifications]);

    const markAsRead = async (id) => {
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications(prev =>
                prev.map(n => n._id === id ? { ...n, isRead: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.put('/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    };

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            isLoading,
            expoPushToken,
            fetchNotifications,
            markAsRead,
            markAllAsRead,
            registerForPushNotificationsAsync
        }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => useContext(NotificationContext);
