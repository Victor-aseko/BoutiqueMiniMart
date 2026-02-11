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
    const [conversations, setConversations] = useState([]);

    const parseMessage = (msg) => {
        let cleanText = msg.text || '';
        let replyData = null;

        if (cleanText.startsWith('|REPLY|')) {
            const parts = cleanText.split('|');
            replyData = {
                name: parts[2],
                repliedToText: parts[3],
                actualText: parts[4]
            };
            cleanText = parts[4] || '';
        }

        return {
            _id: msg._id,
            text: cleanText,
            replyData,
            image: msg.image,
            createdAt: msg.createdAt,
            user: {
                _id: msg.senderId || msg.sender,
                name: msg.sender === user?._id ? user.name : (msg.senderName || 'Boutique Stylist'),
                avatar: msg.sender === user?._id ? null : 'https://api.dicebear.com/7.x/avataaars/svg?seed=Stylist'
            }
        };
    };

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
            // Update messages if the message is for the current active chat
            if (activeChat === message.senderId || activeChat === message.recipientId || activeChat === message.sender || activeChat === message.recipient) {
                const parsed = parseMessage(message);
                setMessages((prev) => [parsed, ...prev]);
            }
            // Always refresh conversations list for admins to show new message alerts
            if (user.isAdmin) {
                fetchConversations();
            }
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
    }, [user, activeChat]);

    useEffect(() => {
        if (user) {
            connectSocket();
            if (user.isAdmin) {
                fetchConversations();
            }
        } else {
            if (socket) socket.close();
            setSocket(null);
        }
    }, [user, connectSocket]);

    const fetchConversations = async () => {
        if (!user || !user.isAdmin) return;
        try {
            const response = await api.get('/messages/users');
            setConversations(response.data);
        } catch (error) {
            console.error('--- CHAT LIST ERROR ---');
            console.error('Status:', error.response?.status);
            console.error('Response Body:', JSON.stringify(error.response?.data, null, 2));
            console.error('Error Msg:', error.message);
            setConversations([]);
        }
    };

    const fetchMessages = async (recipientId) => {
        if (!user) return;
        setIsLoading(true);
        setActiveChat(recipientId);
        try {
            const response = await api.get(`/messages/${recipientId}`);
            const formattedMessages = response.data.map(msg => parseMessage(msg)).reverse();
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

            const parsedMessage = parseMessage({
                ...response.data,
                sender: user._id,
                senderName: user.name
            });

            // 2. Emit via Socket for real-time
            if (socket) {
                socket.emit('sendMessage', {
                    ...response.data,
                    senderId: user._id
                });
            }

            // 3. Update local state
            setMessages(prev => [parsedMessage, ...prev]);

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
            onlineUsers,
            conversations,
            fetchConversations
        }}>
            {children}
        </ChatContext.Provider>
    );
};

export const useChat = () => useContext(ChatContext);
