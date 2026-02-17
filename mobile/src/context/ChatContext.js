import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import io from 'socket.io-client';
import api, { BASE_URL } from '../services/api';
import { useAuth } from './AuthContext';

const ChatContext = createContext();

const SOCKET_URL = BASE_URL;

export const ChatProvider = ({ children }) => {
    const { user } = useAuth();
    const [socket, setSocket] = useState(null);
    const [messages, setMessages] = useState([]);
    const [activeChat, setActiveChat] = useState(null); // Admin ID or Stylist ID
    const [isLoading, setIsLoading] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState(new Set());
    const [conversations, setConversations] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const activeChatRef = useRef(activeChat);
    const userRef = useRef(user);

    // Sync Refs with state to avoid stale closures in socket listeners
    useEffect(() => {
        activeChatRef.current = activeChat;
    }, [activeChat]);

    useEffect(() => {
        userRef.current = user;
    }, [user]);

    const parseMessage = useCallback((msg) => {
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

        const currentUser = userRef.current;
        const msgSenderId = msg.senderId || msg.sender;

        return {
            _id: msg._id || Math.random().toString(),
            text: cleanText,
            replyData,
            image: msg.image,
            createdAt: msg.createdAt || new Date(),
            user: {
                _id: msgSenderId,
                name: String(msgSenderId) === String(currentUser?._id) ? currentUser.name : (msg.senderName || 'Boutique Stylist'),
                avatar: String(msgSenderId) === String(currentUser?._id) ? null : 'https://api.dicebear.com/7.x/avataaars/svg?seed=Stylist'
            }
        };
    }, []);
    const fetchConversations = useCallback(async () => {
        const currentUser = userRef.current;
        if (!currentUser || !currentUser.isAdmin) return;
        try {
            const response = await api.get('/messages/users');
            setConversations(response.data || []);
        } catch (error) {
            console.error('Error fetching conversations:', error);
        }
    }, []);

    const fetchUnreadCount = useCallback(async () => {
        const currentUser = userRef.current;
        if (!currentUser) return;
        try {
            const response = await api.get('/messages/unread/count');
            setUnreadCount(response.data.count || 0);
        } catch (error) {
            console.warn('Failed to fetch unread count:', error.message);
        }
    }, []);

    const clearUnread = useCallback(async (otherUserId) => {
        const currentUser = userRef.current;
        if (!currentUser || !otherUserId) return;

        // OPTIMISTIC UPDATE: Update local state instantly before API call
        if (currentUser.isAdmin) {
            setConversations(prev => {
                const convo = prev.find(c => String(c._id) === String(otherUserId));
                if (convo && convo.unreadCount > 0) {
                    setUnreadCount(total => Math.max(0, total - convo.unreadCount));
                }
                return prev.map(c => String(c._id) === String(otherUserId) ? { ...c, unreadCount: 0 } : c);
            });
        } else {
            setUnreadCount(0);
        }

        try {
            await api.put(`/messages/${otherUserId}/read`);
            // Refresh from server to ensure perfect sync
            if (currentUser.isAdmin) fetchConversations();
            fetchUnreadCount();
        } catch (error) {
            console.error('Error clearing unread:', error);
        }
    }, [fetchConversations, fetchUnreadCount]);

    const fetchMessages = useCallback(async (recipientId) => {
        const currentUser = userRef.current;
        if (!currentUser) return;
        setIsLoading(true);
        setActiveChat(recipientId);
        try {
            const response = await api.get(`/messages/${recipientId}`);
            const formattedMessages = response.data.map(msg => parseMessage(msg)).reverse();
            setMessages(formattedMessages);

            // AUTOMATICALLY CLEAR UNREAD when viewing messages
            clearUnread(recipientId);
        } catch (error) {
            console.error('Error fetching messages:', error);
        } finally {
            setIsLoading(false);
        }
    }, [parseMessage, clearUnread]);

    const sendMessage = useCallback(async (recipientId, text, image = null) => {
        const currentUser = userRef.current;
        if (!currentUser || (!text && !image)) return;

        try {
            // 1. Save to Database
            const response = await api.post('/messages', {
                recipientId,
                text,
                image
            });

            const msgData = response.data;
            const parsedMessage = parseMessage({
                ...msgData,
                sender: currentUser._id,
                senderName: currentUser.name
            });

            // 2. Emit via Socket using Ref to avoid stale connection state
            if (socketRef.current && socketRef.current.connected) {
                socketRef.current.emit('sendMessage', {
                    ...msgData,
                    recipientId: recipientId,
                    senderId: currentUser._id
                });
            } else {
                console.warn('[SOCKET] Not connected, message sent to DB only');
                if (currentUser._id) connectSocket(currentUser);
            }

            // 3. Update local state instantly
            setMessages(prev => [parsedMessage, ...prev]);

            if (currentUser.isAdmin) {
                fetchConversations();
            }

        } catch (error) {
            console.error('Error sending message:', error);
        }
    }, [parseMessage, fetchConversations, connectSocket]);

    const socketRef = useRef(null);

    // Monitor AppState to ensure socket is alive when app comes to foreground
    useEffect(() => {
        const handleAppStateChange = (nextAppState) => {
            if (nextAppState === 'active' && userRef.current?._id) {
                console.log('[SOCKET] App came to foreground, checking connection...');
                if (!socketRef.current || !socketRef.current.connected) {
                    console.log('[SOCKET] Reconnecting stale socket...');
                    connectSocket(userRef.current);
                }
            }
        };

        const subscription = require('react-native').AppState.addEventListener('change', handleAppStateChange);
        return () => subscription.remove();
    }, [connectSocket]);

    const connectSocket = useCallback((userToConnect) => {
        if (!userToConnect || !userToConnect._id) return null;

        // Cleanup existing socket if any
        if (socketRef.current) {
            socketRef.current.disconnect();
        }

        console.log(`[SOCKET] Connecting for user: ${userToConnect.name} (${userToConnect._id})`);

        // Use standard configuration for maximum compatibility
        const newSocket = io(SOCKET_URL, {
            query: { userId: userToConnect._id },
            transports: ['websocket'], // Force websocket for better performance and reliability
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 20000,
            autoConnect: true,
        });

        newSocket.on('connect', () => {
            console.log('[SOCKET] Connected Successfully. ID:', newSocket.id);
            newSocket.emit('join', userToConnect._id);
            fetchUnreadCount();
            if (userToConnect.isAdmin) fetchConversations();

            // Refresh current active chat if exists to catch any missed messages
            const currentActiveChat = activeChatRef.current;
            if (currentActiveChat) {
                fetchMessages(currentActiveChat);
            }
        });

        newSocket.on('connect_error', (error) => {
            console.error('[SOCKET] Connection Error:', error.message);
        });

        newSocket.on('disconnect', (reason) => {
            console.log('[SOCKET] Disconnected:', reason);
            if (reason === 'io server disconnect') {
                newSocket.connect();
            }
        });

        newSocket.on('receiveMessage', (message) => {
            const currentActiveChat = activeChatRef.current;
            const currentAppUser = userRef.current;

            if (!currentAppUser) return;

            const msgSender = String(message.senderId || message.sender || '');
            const msgRecipient = String(message.recipientId || message.recipient || '');
            const activeId = String(currentActiveChat || '');
            const myId = String(currentAppUser._id);

            let isRelatedToActiveChat = false;

            if (currentAppUser.isAdmin) {
                isRelatedToActiveChat = activeId && (msgSender === activeId || msgRecipient === activeId);
            } else {
                // For CUSTOMER: only clear instantly if they are actively LOOKING at the chat screen
                isRelatedToActiveChat = activeId && (msgRecipient === myId) && (msgSender !== myId);
            }

            if (isRelatedToActiveChat) {
                const parsed = parseMessage(message);
                setMessages((prev) => {
                    if (prev.some(m => m._id === parsed._id)) return prev;
                    return [parsed, ...prev];
                });
                clearUnread(msgSender);
            } else {
                // Only increment badge if message is addressed to this user
                if (msgRecipient === myId) {
                    console.log('[CHAT] Incrementing unread badge for message from:', msgSender);
                    setUnreadCount(prev => prev + 1);
                }
            }

            if (currentAppUser.isAdmin) {
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

        newSocket.on('initialOnlineUsers', (userIds) => {
            setOnlineUsers(new Set(userIds));
        });

        setSocket(newSocket);
        socketRef.current = newSocket;
        return newSocket;
    }, [fetchConversations, parseMessage, clearUnread, fetchUnreadCount, fetchMessages]);

    useEffect(() => {
        if (user?._id) {
            fetchUnreadCount();
            if (user.isAdmin) fetchConversations();

            // Periodic sync every 60 seconds while logged in
            const interval = setInterval(() => {
                fetchUnreadCount();
            }, 60000);

            return () => clearInterval(interval);
        }
    }, [user?._id, fetchUnreadCount, fetchConversations]);

    useEffect(() => {
        let currentSocket = null;
        if (user?._id) {
            currentSocket = connectSocket(user);
        } else {
            setMessages([]);
            setConversations([]);
            setUnreadCount(0); // Clear on logout
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
                setSocket(null);
            }
        }

        return () => {
            if (currentSocket) {
                console.log('[SOCKET] Closing connection');
                currentSocket.disconnect();
            }
        };
    }, [user?._id, connectSocket]);


    return (
        <ChatContext.Provider value={{
            messages,
            setMessages,
            socket,
            isLoading,
            activeChat,
            setActiveChat,
            fetchMessages,
            sendMessage,
            isTyping,
            onlineUsers,
            conversations,
            setConversations,
            fetchConversations,
            unreadCount,
            setUnreadCount,
            fetchUnreadCount,
            clearUnread
        }}>
            {children}
        </ChatContext.Provider>
    );
};

export const useChat = () => useContext(ChatContext);
