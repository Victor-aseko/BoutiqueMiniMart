import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Image,
    Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import MyButton from '../../components/MyButton';
import MyInput from '../../components/MyInput';
import { COLORS } from '../../theme/theme';
import { Mail, Lock, ChevronLeft } from 'lucide-react-native';
import { useOAuth, useUser } from '@clerk/clerk-expo';
import { useWarmUpBrowser } from '../../hooks/useWarmUpBrowser';
import * as WebBrowser from 'expo-web-browser';

import * as Linking from 'expo-linking';

WebBrowser.maybeCompleteAuthSession();

const LoginScreen = ({ navigation, route }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isNewGoogleUser, setIsNewGoogleUser] = useState(false);
    const { login, authLoading, error, setError, clearError } = useAuth();

    useEffect(() => {
        // Clear errors when navigating to this screen
        clearError();
    }, []);

    const handleEmailChange = (text) => {
        setEmail(text);
        if (error) clearError();
    };

    const handlePasswordChange = (text) => {
        setPassword(text);
        if (error) clearError();
    };

    const handleLogin = async () => {
        try {
            if (!email || !password) {
                setError('Please enter both email and password to continue.');
                return;
            }

            const success = await login(email, password);
            if (success) {
                // If a redirect destination was provided, navigate there
                const redirectTo = route?.params?.redirectTo;
                if (redirectTo) {
                    console.log('Redirecting to:', redirectTo);

                    if (redirectTo.screen === 'OrdersScreen') {
                        navigation.getParent()?.reset({
                            index: 0,
                            routes: [{
                                name: 'Main',
                                state: {
                                    routes: [{
                                        name: 'Orders',
                                        state: {
                                            routes: [{
                                                name: 'OrdersScreen',
                                                params: redirectTo.params
                                            }]
                                        }
                                    }]
                                }
                            }]
                        });
                        return;
                    }

                    navigation.navigate('Main', {
                        screen: redirectTo.screen,
                        params: redirectTo.params
                    });
                    return;
                }

                // Default redirect using navigate with nested screen
                // We use navigate because we want to go into the Drawer -> ProfileStack -> ProfileScreen
                try {
                    // Navigate is safer than replace for cross-stack transitions
                    navigation.navigate('Main', {
                        screen: 'Profile',
                        params: { screen: 'ProfileScreen' }
                    });
                } catch (e) {
                    console.log('Direct navigation failed, attempting parent navigation');
                    navigation.getParent()?.navigate('Main', { screen: 'Profile' });
                }

                // If we're still on the Auth stack after a short delay, force a reset
                // This is a safety measure for production builds
                setTimeout(() => {
                    // Check if we are still in Login - if so, navigation failed to trigger
                    try {
                        const state = navigation.getState();
                        const currentRoute = state?.routes[state.index]?.name;
                        if (currentRoute === 'Login') {
                            navigation.getParent()?.reset({
                                index: 0,
                                routes: [{ name: 'Main' }]
                            });
                        }
                    } catch (e) {
                        // If state check fails, just try reset anyway as last resort
                        navigation.getParent()?.reset({
                            index: 0,
                            routes: [{ name: 'Main' }]
                        });
                    }
                }, 800);
            } else {
                if (!error) setError('Invalid credentials. Please try again.');
            }
        } catch (err) {
            console.error('Login Exception:', err);
            setError('An unexpected error occurred. Please check your connection and try again.');
        }
    };

    const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });
    useWarmUpBrowser();

    const handleGoogleLogin = React.useCallback(async () => {
        try {
            const { createdSessionId, setActive, signUp } = await startOAuthFlow({
                redirectUrl: Linking.createURL('/', { scheme: 'boutiqueminimart' }),
                additionalOAuthParameters: {
                    prompt: 'select_account',
                    access_type: 'offline'
                }
            });

            if (signUp && signUp.status === 'complete') {
                setIsNewGoogleUser(true);
            } else {
                setIsNewGoogleUser(false);
            }

            if (createdSessionId) {
                await setActive({ session: createdSessionId });
                console.log('Clerk Session Activated on LoginScreen');
            }
        } catch (err) {
            console.error('OAuth error', err);
            Alert.alert('Google Sign-In Error', 'The Google login process was cancelled or failed.');
        }
    }, [startOAuthFlow]);

    // Effect to handle Clerk session activation and backend sync
    const { user: clerkUser, isLoaded: clerkLoaded } = useUser();

    useEffect(() => {
        if (clerkLoaded && clerkUser) {
            console.log('Clerk User detected on LoginScreen:', clerkUser.id);
            const syncWithBackend = async () => {
                const email = clerkUser.primaryEmailAddress?.emailAddress || clerkUser.emailAddresses[0]?.emailAddress;

                navigation.navigate('GoogleConfirm', {
                    userEmail: email,
                    userName: clerkUser.fullName || clerkUser.firstName || 'User',
                    userPicture: clerkUser.imageUrl,
                    redirectTo: route?.params?.redirectTo,
                    isNewUser: isNewGoogleUser
                });
            };
            syncWithBackend();
        }
    }, [clerkUser, clerkLoaded, isNewGoogleUser]);

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <ChevronLeft size={28} color={COLORS.primary} />
                    </TouchableOpacity>
                    <View style={styles.header}>
                        <Text style={styles.title}>Welcome back</Text>
                        <Text style={styles.subtitle}>Sign In to Your Account to Continue Shopping</Text>
                    </View>

                    <View style={styles.form}>
                        {error && (
                            <View style={styles.errorContainer}>
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        )}
                        <MyInput
                            label="Email"
                            placeholder="Enter your email"
                            value={email}
                            onChangeText={handleEmailChange}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            icon={Mail}
                            error={error && email === '' ? 'Email is required' : null}
                        />
                        <MyInput
                            label="Password"
                            placeholder="Enter your password"
                            value={password}
                            onChangeText={handlePasswordChange}
                            secureTextEntry
                            icon={Lock}
                            error={error && password === '' ? 'Password is required' : null}
                        />

                        <TouchableOpacity
                            style={styles.forgotPass}
                            onPress={() => navigation.navigate('ForgotPassword')}
                        >
                            <Text style={styles.forgotPassText}>Forgot Password?</Text>
                        </TouchableOpacity>

                        <MyButton
                            title="Sign In"
                            onPress={handleLogin}
                            loading={authLoading}
                            style={styles.loginBtn}
                        />

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
                            <Image source={require('../../../assets/icons/google.png')} style={styles.googleIcon} />
                            <Text style={styles.googleBtnText}>Continue with Google</Text>
                        </TouchableOpacity>

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>Don't have an account? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Register', { redirectTo: route?.params?.redirectTo })}>
                                <Text style={styles.link}>Sign Up</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
    },
    backButton: {
        position: 'absolute',
        top: 10,
        left: 0,
        padding: 10,
        zIndex: 10,
    },
    header: {
        marginBottom: 40,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    subtitle: {
        fontSize: 16,
        color: COLORS.textLight,
        marginTop: 5,
    },
    form: {
        width: '100%',
    },
    forgotPass: {
        alignSelf: 'flex-end',
        marginBottom: 20,
    },
    forgotPassText: {
        color: COLORS.accent,
        fontWeight: '500',
    },
    loginBtn: {
        marginTop: 10,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 30,
    },
    footerText: {
        color: COLORS.textLight,
    },
    link: {
        color: COLORS.accent,
        fontWeight: 'bold',
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
        fontSize: 14,
        textAlign: 'center',
        fontWeight: '600',
    },
    apiError: {
        display: 'none', // replaced by errorContainer
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 25,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: COLORS.border,
    },
    dividerText: {
        paddingHorizontal: 15,
        color: COLORS.textLight,
        fontSize: 14,
    },
    googleBtn: {
        flexDirection: 'row',
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingVertical: 14,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    googleIcon: {
        width: 40,
        height: 40,
        marginRight: 15,
        borderRadius: 20,
    },
    googleBtnText: {
        fontSize: 16,
        color: COLORS.primary,
        fontWeight: 'bold',
    }
});

export default LoginScreen;
