import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import io from 'socket.io-client';
import api from '../services/api';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationContext';

const ChatContext = createContext();

const SOCKET_URL = 'http://172.21.64.1:5000'; // Update with your server IP if needed

export const ChatProvider = ({ children }) => {
    const { user } = useAuth();
    const [socket, setSocket] = useState(null);
    const [messages, setMessages] = useState([]);
    const [activeChat, setActiveChat] = useState(null); // Admin ID or Stylist ID
    const [isLoading, setIsLoading] = useState(false);
    const [isTyping, setIsTyping] = useState(false);

    const [onlineUsers, setOnlineUsers] = useState(new Set());

    const connectSocket = useCallback(() => {
        if (!user || !user._id) return;

        const newSocket = io(SOCKET_URL, {
            transports: ['websocket'],
            query: { userId: user._id }
        });

        newSocket.on('connect', () => {
            console.log('Socket Connected');
            newSocket.emit('join', user._id);
        });

        newSocket.on('receiveMessage', (message) => {
            setMessages((prev) => [...prev, message]);
        });

        newSocket.on('userStatus', ({ userId, status }) => {
            setOnlineUsers(prev => {
                const newSet = new Set(prev);
                if (status === 'online') newSet.add(userId);
                else newSet.delete(userId);
                return newSet;
            });
        });

        setSocket(newSocket);

        return () => newSocket.close();
    }, [user]);

    useEffect(() => {
        if (user) {
            connectSocket();
        } else {
            if (socket) socket.close();
            setSocket(null);
        }
    }, [user, connectSocket]);

    const fetchMessages = async (recipientId) => {
        if (!user) return;
        setIsLoading(true);
        try {
            const response = await api.get(`/messages/${recipientId}`);
            const formattedMessages = response.data.map(msg => ({
                _id: msg._id,
                text: msg.text,
                createdAt: msg.createdAt,
                user: {
                    _id: msg.sender,
                    name: msg.sender === user._id ? user.name : 'Boutique Stylist',
                    avatar: msg.sender === user._id ? null : 'https://api.dicebear.com/7.x/avataaars/svg?seed=Stylist'
                },
                image: msg.image
            })).reverse();
            setMessages(formattedMessages);
        } catch (error) {
            console.error('Error fetching messages:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const sendMessage = async (recipientId, text, image = null) => {
        if (!user || (!text && !image)) return;

        try {
            // 1. Save to DB via REST API
            const response = await api.post('/messages', {
                recipientId,
                text,
                image
            });

            const newMessage = {
                _id: response.data._id,
                text,
                image,
                createdAt: response.data.createdAt,
                user: {
                    _id: user._id,
                    name: user.name,
                }
            };

            // 2. Emit via Socket for real-time
            if (socket) {
                socket.emit('sendMessage', {
                    ...response.data,
                    senderId: user._id
                });
            }

            // 3. Update local state
            setMessages(prev => [newMessage, ...prev]);

        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    return (
        <ChatContext.Provider value={{
            messages,
            socket,
            isLoading,
            activeChat,
            setActiveChat,
            fetchMessages,
            sendMessage,
            isTyping,
            onlineUsers
        }}>
            {children}
        </ChatContext.Provider>
    );
};

export const useChat = () => useContext(ChatContext);
