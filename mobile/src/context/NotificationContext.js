import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform, Alert } from 'react-native';
import api from '../services/api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

const IS_EXPO_GO = Constants.executionEnvironment === 'storeClient';

// Enable notifications globally by default to handle foreground alerts
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

if (IS_EXPO_GO) {
    console.log('--- NOTICE: Native Push Notifications are limited in Expo Go (SDK 51+). For background alerts and sound when the app is closed, a Development Build is required. ---');
}

export const NotificationProvider = ({ children }) => {
    const { user, isLoggingOut } = useAuth();
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
        if (IS_EXPO_GO) {
            console.log('Push Notifications: expo-notifications has limited support in Expo Go for background delivery. Use a Development Build for full functionality.');
        }

        if (!Device.isDevice) {
            console.log('Push Notifications: Must use physical device for Push Notifications');
            return null;
        }

        let token;
        try {
            // Step 1: Request Permissions
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;

            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }

            if (finalStatus !== 'granted') {
                console.log('Push Notifications: Permission not granted');
                return null;
            }

            // Step 2: Fetch Token
            const projectId = Constants?.expoConfig?.extra?.eas?.projectId || Constants?.easConfig?.projectId;
            if (!projectId) {
                console.warn('Push Notifications: Project ID missing from app.json/Constants');
            }

            token = (await Notifications.getExpoPushTokenAsync({
                projectId: projectId,
            })).data;
            console.log('Push Notifications: Token Generated:', token);
            setExpoPushToken(token);

            // Step 3: Send token to backend
            if (user && token) {
                await api.post('/users/push-token', { token });
                console.log('Push Notifications: Token saved to backend');
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
        } catch (e) {
            console.error('Push Notifications: Setup Error:', e.message);
            return null;
        }
    };

    useEffect(() => {
        // If logged out or logging out, clear and stop
        if (!user || isLoggingOut) {
            setNotifications([]);
            setUnreadCount(0);
            return;
        }

        if (user) {
            fetchNotifications();

            // Setup push and listeners
            registerForPushNotificationsAsync();

            // Foreground listener: This handles what happens when a notification arrives while the app is open
            notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
                console.log('Notification Received:', notification);
                fetchNotifications();
            });

            // Tap listener: This handles what happens when a user clicks on a notification
            responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
                console.log('Notification Interaction:', response);
                // Potential navigation logic here
            });

            const interval = setInterval(fetchNotifications, 30000);
            return () => {
                clearInterval(interval);
                if (notificationListener.current) notificationListener.current.remove();
                if (responseListener.current) responseListener.current.remove();
            };
        }
    }, [user, isLoggingOut, fetchNotifications]);

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

    const deleteNotification = async (id) => {
        try {
            await api.delete(`/notifications/${id}`);
            setNotifications(prev => prev.filter(n => n._id !== id));
            // Recalculate unread count
            const unread = notifications.filter(n => n._id !== id && !n.isRead).length;
            setUnreadCount(unread);
        } catch (error) {
            console.error('Error deleting notification:', error);
            Alert.alert('Error', 'Failed to delete notification');
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
            deleteNotification,
            registerForPushNotificationsAsync
        }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => useContext(NotificationContext);
