import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ActivityIndicator,
    Alert
} from 'react-native';
import { X, Mail, Lock, User, ChevronRight, LogIn } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOAuth, useUser } from '@clerk/clerk-expo';
import { useWarmUpBrowser } from '../hooks/useWarmUpBrowser';
import { Image } from 'react-native';
import { COLORS, SIZES } from '../theme/theme';
import { useAuth } from '../context/AuthContext';
import MyInput from './MyInput';
import MyButton from './MyButton';

import * as Linking from 'expo-linking';

const AuthModal = ({ visible, onClose, onAuthSuccess, navigation, redirectTo }) => {
    const insets = useSafeAreaInsets();
    const [isLogin, setIsLogin] = useState(true);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isNewGoogleUser, setIsNewGoogleUser] = useState(false);

    const { login, register, authLoading, error, setError, clearError } = useAuth();

    // Clerk OAuth setup
    const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });
    useWarmUpBrowser();

    const handleGoogleLogin = React.useCallback(async () => {
        try {
            const { createdSessionId, setActive, signUp } = await startOAuthFlow({
                redirectUrl: Linking.createURL('/', { scheme: 'boutiqueminimart' })
            });

            if (signUp && signUp.status === 'complete') {
                setIsNewGoogleUser(true);
            } else {
                setIsNewGoogleUser(false);
            }

            if (createdSessionId) {
                await setActive({ session: createdSessionId });
                console.log('Clerk Session Activated');
            }
        } catch (err) {
            console.error('OAuth error', err);
            setError('Google login failed or was cancelled.');
        }
    }, [startOAuthFlow]);

    // Track Clerk user state to bridge to our backend
    const { user: clerkUser, isLoaded } = useUser();

    useEffect(() => {
        if (isLoaded && clerkUser && visible) {
            onClose();
            // Bridging Clerk user to our backend confirmation flow
            setTimeout(() => {
                const email = clerkUser.primaryEmailAddress?.emailAddress || clerkUser.emailAddresses[0]?.emailAddress;

                navigation?.navigate('Auth', {
                    screen: 'GoogleConfirm',
                    params: {
                        userEmail: email,
                        userName: clerkUser.fullName || clerkUser.firstName || 'User',
                        userPicture: clerkUser.imageUrl,
                        redirectTo: redirectTo,
                        isNewUser: isNewGoogleUser
                    }
                });
            }, 600);
        }
    }, [clerkUser, isLoaded, visible, isNewGoogleUser]);

    useEffect(() => {
        if (visible) {
            clearError();
            // Reset fields when opening
            // setName('');
            // setEmail('');
            // setPassword('');
            // setConfirmPassword('');
        }
    }, [visible]);

    const handleAuth = async () => {
        try {
            if (isLogin) {
                if (!email || !password) {
                    setError('Please fill in all fields');
                    return;
                }
                const success = await login(email, password);
                if (success) {
                    onClose();
                    // Delay success callback to ensure modal is dismissed and state is stable
                    setTimeout(() => {
                        onAuthSuccess();
                    }, 300);
                }
            } else {
                if (!name || !email || !password || !confirmPassword) {
                    setError('Please fill in all fields');
                    return;
                }
                if (password !== confirmPassword) {
                    setError('Passwords do not match');
                    return;
                }
                if (password.length < 6) {
                    setError('Password must be at least 6 characters');
                    return;
                }
                const success = await register(name, email, password);
                if (success) {
                    onClose();
                    setTimeout(() => {
                        onAuthSuccess();
                    }, 300);
                }
            }
        } catch (err) {
            console.error('Auth Modal Error:', err);
            setError('An error occurred. Please try again.');
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardView}
                >
                    <View style={styles.modalContainer}>
                        <View style={styles.header}>
                            <View>
                                <Text style={styles.title}>{isLogin ? 'Welcome, and Happy Shopping!' : 'Create Account'}</Text>
                                <Text style={styles.subtitle}>{isLogin ? 'Login to continue with your order' : 'Join us to place your first order'}</Text>
                            </View>
                            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                                <X size={24} color={COLORS.primary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={[styles.form, { paddingBottom: 40 + insets.bottom }]}
                        >
                            {error && (
                                <View style={styles.errorContainer}>
                                    <Text style={styles.errorText}>{error}</Text>
                                </View>
                            )}

                            {!isLogin && (
                                <MyInput
                                    label="Full Name"
                                    placeholder="Enter your name"
                                    value={name}
                                    onChangeText={(text) => { setName(text); clearError(); }}
                                    icon={User}
                                />
                            )}

                            <MyInput
                                label="Email"
                                placeholder="Enter your email"
                                value={email}
                                onChangeText={(text) => { setEmail(text); clearError(); }}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                icon={Mail}
                            />

                            <MyInput
                                label="Password"
                                placeholder="Enter your password"
                                value={password}
                                onChangeText={(text) => { setPassword(text); clearError(); }}
                                secureTextEntry
                                icon={Lock}
                            />

                            {!isLogin && (
                                <MyInput
                                    label="Confirm Password"
                                    placeholder="Re-enter password"
                                    value={confirmPassword}
                                    onChangeText={(text) => { setConfirmPassword(text); clearError(); }}
                                    secureTextEntry
                                    icon={Lock}
                                />
                            )}

                            <MyButton
                                title={isLogin ? 'Sign In' : 'Create Account'}
                                onPress={handleAuth}
                                loading={authLoading}
                                style={styles.authBtn}
                            />

                            {isLogin && (
                                <>
                                    <View style={styles.divider}>
                                        <View style={styles.dividerLine} />
                                        <Text style={styles.dividerText}>OR</Text>
                                        <View style={styles.dividerLine} />
                                    </View>

                                    <TouchableOpacity
                                        style={styles.googleBtn}
                                        onPress={handleGoogleLogin}
                                        activeOpacity={0.8}
                                    >
                                        <Image source={require('../../assets/icons/google.png')} style={styles.googleIcon} />
                                        <Text style={styles.googleBtnText}>Continue with Google</Text>
                                    </TouchableOpacity>
                                </>
                            )}

                            <View style={styles.switchContainer}>
                                <Text style={styles.switchText}>
                                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                                </Text>
                                <TouchableOpacity onPress={() => { setIsLogin(!isLogin); clearError(); }}>
                                    <Text style={styles.switchLink}>
                                        {isLogin ? 'Sign Up' : 'Sign In'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    keyboardView: {
        width: '100%',
    },
    modalContainer: {
        // backgroundColor: COLORS.white,
        backgroundColor: 'rgba(248, 246, 246, 0.9)',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 25,
        maxHeight: SIZES.height * 0.9,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 25,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.textLight,
        marginTop: 4,
    },
    closeBtn: {
        backgroundColor: COLORS.background,
        padding: 8,
        borderRadius: 20,
    },
    form: {
        paddingBottom: 20,
    },
    errorContainer: {
        backgroundColor: '#FEE2E2',
        padding: 12,
        borderRadius: 12,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#FECACA',
    },
    errorText: {
        color: '#B91C1C',
        fontSize: 13,
        textAlign: 'center',
        fontWeight: '600',
    },
    authBtn: {
        marginTop: 20,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 20,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: COLORS.border,
    },
    dividerText: {
        marginHorizontal: 15,
        color: COLORS.textLight,
        fontSize: 12,
        fontWeight: 'bold',
    },
    googleBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.white,
        paddingVertical: 14,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: COLORS.border,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    googleIcon: {
        width: 20,
        height: 20,
        marginRight: 10,
    },
    googleBtnText: {
        fontSize: 16,
        color: COLORS.primary,
        fontWeight: '600',
    },
    switchContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 25,
        alignItems: 'center',
    },
    switchText: {
        color: COLORS.textLight,
        fontSize: 14,
    },
    switchLink: {
        color: COLORS.accent,
        fontWeight: 'bold',
        fontSize: 14,
    }
});

export default AuthModal;
