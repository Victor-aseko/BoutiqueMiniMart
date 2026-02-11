import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, TouchableOpacity, Platform, Animated, KeyboardAvoidingView, Keyboard, Dimensions, FlatList, Alert } from 'react-native';
import { GiftedChat, Bubble, Send, InputToolbar, Composer, Message, MessageText, Time } from 'react-native-gifted-chat';
import { useHeaderHeight } from '@react-navigation/elements';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { COLORS } from '../../theme/theme';
import { Image as ImageIcon, Send as SendIcon, X, CornerUpLeft, ChevronLeft, User as UserIcon, Trash2 } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import api from '../../services/api';
import dayjs from 'dayjs';
import { Swipeable } from 'react-native-gesture-handler';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const formatDate = (dateValue) => {
    if (!dateValue) return '';
    const date = dayjs(dateValue);
    const now = dayjs();

    if (date.isSame(now, 'day')) {
        return date.format('h:mm A');
    } else if (date.isSame(now.subtract(1, 'day'), 'day')) {
        return 'Yesterday';
    } else if (date.isSame(now, 'year')) {
        return date.format('MMM D');
    }
    return date.format('MM/DD/YYYY');
};

const ChatScreen = ({ navigation }) => {
    const { user } = useAuth();
    const {
        messages,
        setMessages,
        sendMessage,
        fetchMessages,
        isLoading,
        onlineUsers,
        conversations,
        fetchConversations,
        setActiveChat,
        activeChat
    } = useChat();

    const [primaryAdmin, setPrimaryAdmin] = useState(null);
    const [allAdmins, setAllAdmins] = useState([]);
    const [isLocalLoading, setIsLocalLoading] = useState(false);
    const [replyingTo, setReplyingTo] = useState(null);
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [inputText, setInputText] = useState('');
    const [editingMessageId, setEditingMessageId] = useState(null);
    const [typingResetKey, setTypingResetKey] = useState(0);

    const headerHeight = useHeaderHeight();
    const insets = useSafeAreaInsets();

    useEffect(() => {
        const getAdmins = async () => {
            try {
                // Get the main admin for customer reference
                const response = await api.get('/users/admin');
                setPrimaryAdmin(response.data);

                // If the user isn't an admin, they chat with the primary stylist
                if (!user?.isAdmin) {
                    fetchMessages(response.data._id);
                }

                // Try to get all admins to verify "Online" status for the Boutique
                // If there's no bulk endpoint, we at least have the primary one
                setAllAdmins([response.data]);
            } catch (error) {
                console.error('Error fetching admins:', error);
            } finally {
                setIsLocalLoading(false);
            }
        };

        if (user) {
            getAdmins();
        } else {
            setIsLocalLoading(false);
        }

        const keyboardDidShow = (e) => setKeyboardHeight(e.endCoordinates.height);
        const keyboardDidHide = () => setKeyboardHeight(0);

        const showSubscription = Keyboard.addListener('keyboardDidShow', keyboardDidShow);
        const hideSubscription = Keyboard.addListener('keyboardDidHide', keyboardDidHide);

        const timer = setTimeout(() => setIsLocalLoading(false), 5000);

        return () => {
            clearTimeout(timer);
            showSubscription.remove();
            hideSubscription.remove();
        };
    }, [user]);

    const onSend = useCallback(async (newMessages = []) => {
        const message = newMessages[0];
        const recipientId = user?.isAdmin ? selectedCustomer?._id : primaryAdmin?._id;

        if (!recipientId) {
            console.log('No recipient found for message');
            return;
        }

        // IF EDITING: Update existing message instead of sending new one
        if (editingMessageId) {
            try {
                await api.put(`/messages/${editingMessageId}`, { text: message.text });
                setMessages(prev => prev.map(m => m._id === editingMessageId ? { ...m, text: message.text } : m));
                setEditingMessageId(null);
                setInputText('');
                setTypingResetKey(prev => prev + 1); // Reset the input field completely
                return;
            } catch (error) {
                console.error('Error updating message:', error);
                Alert.alert("Error", "Could not update message");
                return;
            }
        }

        let finalText = message.text || (message.image ? '📷 Sent an image' : '');

        if (replyingTo) {
            const replyText = replyingTo.text || (replyingTo.image ? '📷 Media message' : 'Message');
            finalText = `|REPLY|${replyingTo.user.name}|${replyText}|${finalText}`;
            setReplyingTo(null);
        }

        sendMessage(recipientId, finalText, message.image);
    }, [primaryAdmin, selectedCustomer, sendMessage, replyingTo, user?.isAdmin]);

    const handleInputTextChanged = useCallback((text) => {
        setInputText(text);
    }, []);

    const handleSend = useCallback((messages) => {
        onSend(messages);
        setInputText('');
    }, [onSend]);

    const handleDeleteConversation = useCallback((userId, name) => {
        Alert.alert(
            "Delete Chat",
            `Are you sure you want to delete all messages with ${name}? This cannot be undone.`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await api.delete(`/messages/conversation/${userId}`);
                            // OPTIMISTIC UPDATE: Clear messages instantly
                            setMessages([]);

                            if (selectedCustomer?._id === userId) {
                                setSelectedCustomer(null);
                            }
                            fetchConversations();
                        } catch (error) {
                            console.error('Error deleting conversation:', error);
                            Alert.alert("Error", "Could not delete conversation");
                        }
                    }
                }
            ]
        );
    }, [selectedCustomer?._id, setSelectedCustomer, setMessages, fetchConversations]);

    const handleMessageOptions = useCallback((message) => {
        if (!message || !user) return;
        const isMine = message.user?._id?.toString() === user?._id?.toString();
        const isAdmin = user?.isAdmin;
        const canDelete = isMine || isAdmin;

        const options = [];

        // 1. Edit Option (if it's my message)
        if (isMine && message.text) {
            options.push({
                text: "Edit Message ✏️",
                onPress: () => {
                    setEditingMessageId(message._id);
                    setInputText(message.text);
                    setTypingResetKey(prev => prev + 1);
                }
            });
        }

        // 2. Delete Option
        if (canDelete) {
            options.push({
                text: "Delete Message 🗑️",
                style: "destructive",
                onPress: () => {
                    Alert.alert(
                        "Delete Message",
                        "Are you sure you want to delete this message?",
                        [
                            { text: "Cancel", style: "cancel" },
                            { text: "Delete", style: "destructive", onPress: () => performDelete(message._id) }
                        ]
                    );
                }
            });
        }

        // 3. Always add a Cancel option at the end
        options.push({ text: "Cancel", style: "cancel" });

        // Alert.alert supports up to 3 buttons (Edit, Delete, Cancel)
        if (options.length > 0) {
            Alert.alert(
                "Message Options",
                "What would you like to do?",
                options
            );
        }
    }, [user, performDelete, setEditingMessageId, setInputText, setTypingResetKey]);

    const performDelete = useCallback(async (messageId) => {
        try {
            await api.delete(`/messages/${messageId}`);
            // Optimistic update
            setMessages(prev => prev.filter(m => m._id !== messageId));

            // Sync with server
            const currentRecipient = user?.isAdmin ? selectedCustomer?._id : primaryAdmin?._id;
            if (currentRecipient) fetchMessages(currentRecipient);
        } catch (error) {
            console.error('Error deleting message:', error);
            Alert.alert("Error", "Could not delete message. Please try again.");
        }
    }, [user, selectedCustomer, primaryAdmin, fetchMessages]);

    const handlePickMedia = useCallback(async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') return;

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images', 'videos'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.7,
        });

        if (!result.canceled) {
            const formData = new FormData();
            const asset = result.assets[0];
            formData.append('image', {
                uri: asset.uri,
                type: asset.type === 'video' ? 'video/mp4' : 'image/jpeg',
                name: asset.uri.split('/').pop(),
            });

            try {
                setIsLocalLoading(true);
                const uploadRes = await api.post('/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                onSend([{ image: uploadRes.data.image, user: { _id: user._id } }]);
            } catch (error) {
                console.error('Error uploading:', error);
            } finally {
                setIsLocalLoading(false);
            }
        }
    }, [user, onSend]);

    const renderCustomView = useCallback((props) => {
        const { currentMessage } = props;
        if (currentMessage.replyData) {
            const { name, repliedToText } = currentMessage.replyData;
            return (
                <View style={[styles.bubbleReplyBox, {
                    backgroundColor: currentMessage.user._id === user._id ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.05)'
                }]}>
                    <View style={styles.bubbleReplyLine} />
                    <View style={styles.bubbleReplyTextColumn}>
                        <Text style={[styles.bubbleReplyNameText, { color: currentMessage.user._id === user._id ? '#FFF' : COLORS.accent }]}>
                            {name}
                        </Text>
                        <Text style={[styles.bubbleReplyContentText, { color: currentMessage.user._id === user._id ? '#EEE' : COLORS.textLight }]} numberOfLines={1}>
                            {repliedToText}
                        </Text>
                    </View>
                </View>
            );
        }
        return null;
    }, [user, COLORS.accent, COLORS.textLight]);

    const renderBubble = useCallback((props) => {
        const { currentMessage } = props;
        return (
            <Bubble
                {...props}
                renderCustomView={renderCustomView}
                onLongPress={() => handleMessageOptions(currentMessage)}
                touchableProps={{
                    onLongPress: () => handleMessageOptions(currentMessage),
                    activeOpacity: 0.6,
                }}
                wrapperStyle={{
                    right: {
                        backgroundColor: COLORS.accent,
                        borderRadius: 20,
                        marginBottom: 8,
                        padding: 6,
                        maxWidth: SCREEN_WIDTH * 0.82
                    },
                    left: {
                        backgroundColor: '#F1F3F5',
                        borderRadius: 20,
                        marginBottom: 8,
                        padding: 6,
                        maxWidth: SCREEN_WIDTH * 0.82
                    }
                }}
                textStyle={{
                    right: { color: COLORS.white, fontSize: 15, lineHeight: 22 },
                    left: { color: COLORS.primary, fontSize: 15, lineHeight: 22 }
                }}
            />
        );
    }, [renderCustomView, handleMessageOptions, COLORS.accent, COLORS.primary, SCREEN_WIDTH]);

    const renderSend = useCallback((props) => {
        const isTyped = props.text && props.text.trim().length > 0;
        return (
            <Send {...props} alwaysShowSend={true} containerStyle={styles.sendContainer}>
                <View style={[
                    styles.sendIconPill,
                    {
                        backgroundColor: isTyped ? COLORS.accent : '#2D3436', // Gunmetal Black when empty
                        borderWidth: 0,
                    }
                ]}>
                    <SendIcon size={18} color={COLORS.white} />
                </View>
            </Send>
        );
    }, [COLORS.accent]);

    const renderComposer = useCallback((props) => (
        <Composer
            {...props}
            textInputStyle={styles.composerStyle}
            placeholder="Type your message..."
            multiline
        />
    ), []);

    const renderTime = useCallback((props) => (
        <Time
            {...props}
            timeTextStyle={{
                right: { color: 'rgba(255, 255, 255, 0.7)', fontSize: 10 },
                left: { color: COLORS.textLight, fontSize: 10 },
            }}
        />
    ), [COLORS.textLight]);

    const renderDay = useCallback((props) => {
        if (!props.currentMessage) return null;
        const date = dayjs(props.currentMessage.createdAt);
        const now = dayjs();

        let dateText = '';
        if (date.isSame(now, 'day')) {
            dateText = 'Today';
        } else if (date.isSame(now.subtract(1, 'day'), 'day')) {
            dateText = 'Yesterday';
        } else if (date.isAfter(now.subtract(7, 'days'), 'day')) {
            dateText = date.format('dddd'); // e.g., "Monday"
        } else if (date.isSame(now, 'year')) {
            dateText = date.format('MMMM D');
        } else {
            dateText = date.format('MMMM D, YYYY');
        }

        // Only show if this is the first message or the previous message was on a different day
        const isSameDay = props.previousMessage && dayjs(props.previousMessage.createdAt).isSame(date, 'day');
        if (isSameDay) return null;

        return (
            <View style={styles.daySeparatorWrap}>
                <View style={styles.daySeparatorPill}>
                    <Text style={styles.daySeparatorText}>{dateText}</Text>
                </View>
            </View>
        );
    }, []);

    const renderMessage = useCallback((props) => {
        const { currentMessage } = props;
        const renderLeftActions = (progress, dragX) => {
            const scale = dragX.interpolate({ inputRange: [0, 50], outputRange: [0, 1], extrapolate: 'clamp' });
            return (
                <View style={styles.swipeHintWrap}>
                    <Animated.View style={{ transform: [{ scale }] }}><CornerUpLeft size={22} color={COLORS.accent} /></Animated.View>
                </View>
            );
        };
        return (
            <Swipeable renderLeftActions={renderLeftActions} onSwipeableLeftOpen={() => setReplyingTo(currentMessage)}>
                <Message {...props} />
            </Swipeable>
        );
    }, [setReplyingTo, COLORS.accent]);

    const renderAccessory = useCallback(() => {
        if (!replyingTo && !editingMessageId) return null;

        if (editingMessageId) {
            return (
                <View style={styles.replyPreviewHeader}>
                    <View style={[styles.replyPreviewLine, { backgroundColor: COLORS.warning || '#FF9F43' }]} />
                    <View style={styles.replyPreviewInfo}>
                        <Text style={[styles.replyPreviewName, { color: COLORS.warning || '#FF9F43' }]}>Editing Message</Text>
                        <Text style={styles.replyPreviewMsg} numberOfLines={1}>Modify your text in the box below</Text>
                    </View>
                    <TouchableOpacity onPress={() => {
                        setEditingMessageId(null);
                        setInputText('');
                        setTypingResetKey(prev => prev + 1);
                    }} style={styles.replyPreviewClose}>
                        <X size={16} color={COLORS.textLight} />
                    </TouchableOpacity>
                </View>
            );
        }

        const displayName = replyingTo.replyData ? replyingTo.replyData.actualText : (replyingTo.text || (replyingTo.image ? '📷 Media message' : 'Message'));
        return (
            <View style={styles.replyPreviewHeader}>
                <View style={styles.replyPreviewLine} />
                <View style={styles.replyPreviewInfo}>
                    <Text style={styles.replyPreviewName}>{replyingTo.user.name}</Text>
                    <Text style={styles.replyPreviewMsg} numberOfLines={1}>{displayName}</Text>
                </View>
                <TouchableOpacity onPress={() => setReplyingTo(null)} style={styles.replyPreviewClose}><X size={16} color={COLORS.textLight} /></TouchableOpacity>
            </View>
        );
    }, [replyingTo, editingMessageId, setEditingMessageId, setInputText, setReplyingTo, COLORS.warning, COLORS.textLight]);

    const renderInputToolbar = useCallback((props) => (
        <InputToolbar
            {...props}
            containerStyle={styles.toolbarStyle}
            primaryStyle={{ alignItems: 'center', paddingRight: 8, justifyContent: 'center' }}
        />
    ), []);

    const renderActions = useCallback(() => (
        <TouchableOpacity onPress={handlePickMedia} style={styles.mediaBtn}>
            <ImageIcon size={22} color={COLORS.accent} />
        </TouchableOpacity>
    ), [handlePickMedia, COLORS.accent]);

    const renderConversationItem = useCallback(({ item }) => {
        const isOnline = onlineUsers.has(item._id);
        return (
            <TouchableOpacity
                style={styles.convoItem}
                onPress={() => {
                    setSelectedCustomer(item);
                    fetchMessages(item._id);
                }}
            >
                <View style={styles.convoAvatar}>
                    <UserIcon size={24} color={COLORS.white} />
                    {isOnline && <View style={styles.onlineDot} />}
                </View>
                <View style={styles.convoInfo}>
                    <View style={styles.convoHeaderRow}>
                        <Text style={styles.convoName}>{item.name}</Text>
                        <Text style={styles.convoDate}>{formatDate(item.createdAt)}</Text>
                    </View>
                    <Text style={styles.convoLastMsg} numberOfLines={1}>{item.lastMessage || 'Click to respond...'}</Text>
                </View>
                {item.unreadCount > 0 && (
                    <View style={styles.unreadBadge}>
                        <Text style={styles.unreadBadgeText}>{item.unreadCount}</Text>
                    </View>
                )}
                <TouchableOpacity
                    style={styles.convoDeleteBtn}
                    onPress={() => handleDeleteConversation(item._id, item.name)}
                >
                    <Trash2 size={18} color={COLORS.error} />
                </TouchableOpacity>
            </TouchableOpacity>
        );
    }, [onlineUsers, setSelectedCustomer, fetchMessages, COLORS.white, COLORS.error, formatDate, handleDeleteConversation]);

    if (!user) {
        return (
            <View style={styles.simpleCenter}>
                <Text style={styles.simpleText}>Please login to chat with our stylist.</Text>
                <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Auth')}>
                    <Text style={styles.actionBtnText}>Login Now</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (isLocalLoading) {
        return <View style={styles.simpleCenter}><ActivityIndicator size="large" color={COLORS.accent} /></View>;
    }

    // SHARED ADMIN WORKSPACE: All admins see this list
    if (user.isAdmin && !selectedCustomer) {
        return (
            <View style={styles.mainContainer}>
                <View style={styles.chatHeader}>
                    <Text style={[styles.stylistTitle, { fontSize: 18 }]}>Boutique Dashboard (Stylist)</Text>
                    <View style={styles.adminBadge}><Text style={styles.adminBadgeText}>Active Admin</Text></View>
                </View>
                <FlatList
                    data={conversations}
                    keyExtractor={item => item._id}
                    renderItem={renderConversationItem}
                    contentContainerStyle={{ padding: 15 }}
                    refreshing={isLoading}
                    onRefresh={fetchConversations}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <UserIcon size={50} color={COLORS.border} />
                            <Text style={styles.emptyText}>No customer conversations yet.</Text>
                        </View>
                    }
                />
            </View>
        );
    }

    const isCustomerOnline = selectedCustomer && onlineUsers.has(selectedCustomer._id);

    // For customers, the "Stylist" is online if ANY admin is online (checking primary one for now as a reliable proxy)
    const isStylistOnline = allAdmins.some(admin => onlineUsers.has(admin?._id));

    const headerTitle = user.isAdmin ? selectedCustomer?.name : 'Boutique Stylist';
    const activeHeaderOnline = user.isAdmin ? isCustomerOnline : isStylistOnline;

    const chatUser = useMemo(() => ({
        _id: user._id,
        name: user.name
    }), [user._id, user.name]);

    const handleLongPress = useCallback((context, message) => {
        handleMessageOptions(message);
    }, [handleMessageOptions]);

    const renderLoading = useCallback(() => (
        <ActivityIndicator size="small" color={COLORS.accent} />
    ), []);

    return (
        <View style={styles.mainContainer}>
            <View style={styles.chatHeader}>
                {user.isAdmin && (
                    <TouchableOpacity onPress={() => setSelectedCustomer(null)} style={{ marginRight: 15 }}>
                        <ChevronLeft size={28} color={COLORS.primary} />
                    </TouchableOpacity>
                )}
                <View style={[styles.avatarWrap, { backgroundColor: user.isAdmin ? COLORS.primary : COLORS.accent }]}>
                    <Text style={styles.avatarChar}>{headerTitle.charAt(0)}</Text>
                    <View style={[styles.onlineIndicator, { backgroundColor: activeHeaderOnline ? '#4CAF50' : '#BBB' }]} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.stylistTitle}>{headerTitle}</Text>
                    <Text style={styles.stylistStatus}>{activeHeaderOnline ? 'Online Now' : 'Currently Offline'}</Text>
                </View>
                <TouchableOpacity
                    onPress={() => handleDeleteConversation(user.isAdmin ? selectedCustomer?._id : primaryAdmin?._id, headerTitle)}
                    style={{ padding: 5 }}
                >
                    <Trash2 size={20} color={COLORS.textLight} />
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? headerHeight : headerHeight + 5}
            >
                <View style={{ flex: 1 }}>
                    <GiftedChat
                        key={`chat-${typingResetKey}`}
                        messages={messages}
                        onSend={handleSend}
                        user={chatUser}
                        initialText={inputText}
                        renderBubble={renderBubble}
                        renderSend={renderSend}
                        renderDay={renderDay}
                        renderComposer={renderComposer}
                        renderTime={renderTime}
                        renderAccessory={renderAccessory}
                        renderMessage={renderMessage}
                        onLongPress={handleLongPress}
                        alwaysShowSend={true}
                        scrollToBottom
                        infiniteScroll
                        loadEarlier={isLoading}
                        renderLoading={renderLoading}
                        bottomOffset={0}
                        minInputToolbarHeight={60}
                        renderInputToolbar={renderInputToolbar}
                        renderActions={renderActions}
                    />
                </View>
            </KeyboardAvoidingView>
            {!keyboardHeight && <View style={{ height: Platform.OS === 'ios' ? insets.bottom : 10 }} />}
        </View>
    );
};

const styles = StyleSheet.create({
    mainContainer: { flex: 1, backgroundColor: '#F8F9FA' },
    chatHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 12, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: '#EEE' },
    avatarWrap: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    avatarChar: { color: COLORS.white, fontWeight: 'bold' },
    onlineIndicator: { position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: COLORS.white },
    stylistTitle: { fontSize: 14, fontWeight: 'bold', color: COLORS.primary },
    stylistStatus: { fontSize: 11, color: '#4CAF50' },
    toolbarStyle: {
        borderTopWidth: 1,
        borderTopColor: '#EEE',
        backgroundColor: COLORS.white,
        paddingVertical: 4,
        width: SCREEN_WIDTH,
        minHeight: 54,
        justifyContent: 'center'
    },
    mediaBtn: { padding: 5, marginLeft: 8, justifyContent: 'center' },
    composerStyle: {
        backgroundColor: '#F1F3F5',
        borderRadius: 22,
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 8,
        fontSize: 14,
        color: COLORS.primary,
        marginTop: 5,
        marginBottom: 5,
        marginLeft: 8,
        borderWidth: 1,
        borderColor: '#E9ECEF',
        marginRight: 4,
        minHeight: 40
    },
    sendContainer: {
        width: 50,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 2,
    },
    sendIconPill: { backgroundColor: COLORS.accent, width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center', elevation: 2 },
    daySeparatorWrap: { alignItems: 'center', justifyContent: 'center', marginVertical: 24 },
    daySeparatorPill: { backgroundColor: '#E2E8F0', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 15, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 1 },
    daySeparatorText: { fontSize: 11, color: COLORS.primary, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },
    swipeHintWrap: { justifyContent: 'center', paddingLeft: 22, width: 60 },
    replyPreviewHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 12, borderTopWidth: 1, borderTopColor: '#EEE' },
    replyPreviewLine: { width: 4, backgroundColor: COLORS.accent, borderRadius: 2, marginRight: 10, height: '90%' },
    replyPreviewInfo: { flex: 1 },
    replyPreviewName: { fontSize: 12, fontWeight: 'bold', color: COLORS.accent },
    replyPreviewMsg: { fontSize: 12, color: COLORS.textLight },
    replyPreviewClose: { padding: 6 },
    bubbleReplyBox: { margin: 5, padding: 8, borderRadius: 10, flexDirection: 'row', alignItems: 'center' },
    bubbleReplyLine: { width: 3, backgroundColor: COLORS.accent, borderRadius: 2, marginRight: 8, height: '90%' },
    bubbleReplyTextColumn: { flex: 1 },
    bubbleReplyNameText: { fontSize: 11, fontWeight: 'bold' },
    bubbleReplyContentText: { fontSize: 11 },
    simpleCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.white },
    simpleText: { marginBottom: 20, color: COLORS.textLight },
    actionBtn: { backgroundColor: COLORS.accent, paddingHorizontal: 25, paddingVertical: 10, borderRadius: 20 },
    actionBtnText: { color: COLORS.white, fontWeight: 'bold' },
    adminBadge: { marginLeft: 'auto', backgroundColor: 'rgba(9, 132, 227, 0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    adminBadgeText: { color: COLORS.primary, fontSize: 10, fontWeight: 'bold' },
    convoItem: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: COLORS.white, borderRadius: 12, marginBottom: 10, elevation: 1 },
    convoAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.accent, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    onlineDot: { position: 'absolute', bottom: 2, right: 2, width: 12, height: 12, borderRadius: 6, backgroundColor: '#4CAF50', borderWidth: 2, borderColor: COLORS.white },
    convoInfo: { flex: 1 },
    convoHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    convoName: { fontSize: 16, fontWeight: 'bold', color: COLORS.primary },
    convoDate: { fontSize: 11, color: COLORS.textLight },
    convoLastMsg: { fontSize: 13, color: COLORS.textLight, marginTop: 2, marginRight: 20 },
    unreadBadge: { backgroundColor: COLORS.error, width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginLeft: 5 },
    unreadBadgeText: { color: COLORS.white, fontSize: 10, fontWeight: 'bold' },
    emptyState: { alignItems: 'center', marginTop: 100 },
    emptyText: { color: COLORS.textLight, marginTop: 20, fontSize: 14 },
    convoDeleteBtn: { padding: 8, marginLeft: 10 },
});

export default ChatScreen;
