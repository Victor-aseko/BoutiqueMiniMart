import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, TouchableOpacity, Image } from 'react-native';
import { GiftedChat, Bubble, Send, InputToolbar, Actions } from 'react-native-gifted-chat';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { COLORS } from '../../theme/theme';
import { Image as ImageIcon, Send as SendIcon, ChevronLeft } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import api from '../../services/api';

const ChatScreen = ({ navigation }) => {
    const { user } = useAuth();
    const { messages, sendMessage, fetchMessages, isLoading, activeChat, setActiveChat } = useChat();
    const [admin, setAdmin] = useState(null);
    const [isLocalLoading, setIsLocalLoading] = useState(true);

    useEffect(() => {
        const getAdmin = async () => {
            try {
                const response = await api.get('/users/admin');
                setAdmin(response.data);
                setActiveChat(response.data._id);
                fetchMessages(response.data._id);
            } catch (error) {
                console.error('Error fetching admin:', error);
            } finally {
                setIsLocalLoading(false);
            }
        };

        if (user) {
            getAdmin();
        }
    }, [user]);

    const onSend = useCallback((newMessages = []) => {
        if (!admin) return;
        const { text, image } = newMessages[0];
        sendMessage(admin._id, text, image);
    }, [admin, sendMessage]);

    const handlePickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.5,
        });

        if (!result.canceled) {
            const formData = new FormData();
            formData.append('image', {
                uri: result.assets[0].uri,
                type: 'image/jpeg',
                name: 'chat_image.jpg',
            });

            try {
                const uploadRes = await api.post('/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                onSend([{ image: uploadRes.data.url, user: { _id: user._id } }]);
            } catch (error) {
                console.error('Error uploading chat image:', error);
            }
        }
    };

    const renderActions = (props) => (
        <Actions
            {...props}
            containerStyle={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginLeft: 4, marginBottom: 0 }}
            icon={() => <ImageIcon size={24} color={COLORS.accent} />}
            onPressActionButton={handlePickImage}
        />
    );

    const renderBubble = (props) => (
        <Bubble
            {...props}
            wrapperStyle={{
                right: { backgroundColor: COLORS.accent },
                left: { backgroundColor: '#F0F0F0' }
            }}
            textStyle={{
                right: { color: COLORS.white },
                left: { color: COLORS.primary }
            }}
        />
    );

    const renderSend = (props) => (
        <Send {...props} containerStyle={{ justifyContent: 'center', paddingHorizontal: 10 }}>
            <View style={{ backgroundColor: COLORS.accent, borderRadius: 20, padding: 8 }}>
                <SendIcon size={20} color={COLORS.white} />
            </View>
        </Send>
    );

    if (isLocalLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.accent} />
                <Text style={styles.loadingText}>Connecting to Stylist...</Text>
            </View>
        );
    }

    if (!user) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Please login to chat with our stylist.</Text>
                <TouchableOpacity
                    style={styles.loginBtn}
                    onPress={() => navigation.navigate('Auth')}
                >
                    <Text style={styles.loginBtnText}>Login Now</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.stylistInfo}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>S</Text>
                        <View style={[styles.onlineDot, { backgroundColor: isAdminOnline ? '#4CAF50' : '#BBB' }]} />
                    </View>
                    <View>
                        <Text style={styles.stylistName}>Boutique Stylist</Text>
                        <Text style={[styles.statusText, { color: isAdminOnline ? '#4CAF50' : COLORS.textLight }]}>
                            {isAdminOnline ? 'Online - Ready to help' : 'Offline - Be Right Back'}
                        </Text>
                    </View>
                </View>
            </View>

            <GiftedChat
                messages={messages}
                onSend={messages => onSend(messages)}
                user={{
                    _id: user._id,
                    name: user.name,
                }}
                renderBubble={renderBubble}
                renderSend={renderSend}
                renderActions={renderActions}
                placeholder="Type your message..."
                alwaysShowSend
                scrollToBottom
                infiniteScroll
                loadEarlier={isLoading}
                renderLoading={() => <ActivityIndicator size="small" color={COLORS.accent} />}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    header: {
        paddingTop: 10,
        paddingBottom: 15,
        paddingHorizontal: 20,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
        flexDirection: 'row',
        alignItems: 'center',
    },
    stylistInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        backgroundColor: COLORS.accent,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: {
        color: COLORS.white,
        fontSize: 20,
        fontWeight: 'bold',
    },
    onlineDot: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#4CAF50',
        borderWidth: 2,
        borderColor: COLORS.white,
    },
    stylistName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    statusText: {
        fontSize: 12,
        color: '#4CAF50',
        fontWeight: '600',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        padding: 20
    },
    loadingText: {
        marginTop: 15,
        fontSize: 16,
        color: COLORS.textLight,
        textAlign: 'center'
    },
    loginBtn: {
        marginTop: 20,
        backgroundColor: COLORS.accent,
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 25,
    },
    loginBtnText: {
        color: COLORS.white,
        fontWeight: 'bold',
        fontSize: 16,
    }
});

export default ChatScreen;
