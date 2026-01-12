import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    const fetchNotifications = useCallback(async () => {
        if (!user || !user.token) return;
        setIsLoading(true);
        try {
            // Ensure header is set (extra safety for race conditions)
            const expected = `Bearer ${user.token}`;
            if (api.defaults.headers.common['Authorization'] !== expected) {
                api.defaults.headers.common['Authorization'] = expected;
            }

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

    useEffect(() => {
        if (user) {
            fetchNotifications();
            // Poll for notifications every 30 seconds
            const interval = setInterval(fetchNotifications, 30000);
            return () => clearInterval(interval);
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

    const deleteNotification = async (id) => {
        try {
            await api.delete(`/notifications/${id}`);
            const wasUnread = notifications.find(n => n._id === id)?.isRead === false;
            setNotifications(prev => prev.filter(n => n._id !== id));
            if (wasUnread) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            isLoading,
            fetchNotifications,
            markAsRead,
            markAllAsRead,
            deleteNotification
        }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => useContext(NotificationContext);
