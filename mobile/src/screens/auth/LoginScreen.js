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
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

const LoginScreen = ({ navigation, route }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login, isLoading, error, setError, clearError } = useAuth();

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
        if (!email || !password) {
            setError('Please enter both email and password to continue.');
            return;
        }
        const success = await login(email, password);
        if (success) {
            // If a redirect destination was provided, navigate there
            const redirectTo = route?.params?.redirectTo;
            if (redirectTo) {
                const tab = redirectTo.tab || 'HomeTab';
                navigation.navigate('Main', { screen: tab, params: { screen: redirectTo.screen, params: redirectTo.params } });
                return;
            }

            navigation.navigate('Main', { screen: 'MainTabs', params: { screen: 'ProfileTab' } });
        }
    };

    const [request, response, promptAsync] = Google.useAuthRequest({
        androidClientId: __DEV__
            ? "780227151309-5t3tohn4vplmq4ms3qocoh7ojbtusnfm.apps.googleusercontent.com" // Debug
            : "780227151309-ra956k5pbspsfu0fgginc2c5t4jdlcso.apps.googleusercontent.com", // Release
        iosClientId: "780227151309-o5m6385lhv9n1uffh4rsmrv7cah94eav.apps.googleusercontent.com",
        webClientId: "780227151309-alj2ia0vf7pgsi27d23113rfsmonqfq7.apps.googleusercontent.com",
    }, {
        // useProxy: true is required for Expo Go (development)
        // This will use https://auth.expo.io as the base for redirection
        useProxy: true,
        redirectUri: AuthSession.makeRedirectUri({
            useProxy: true,
        }),
    });

    // Configuration removed for performance

    useEffect(() => {
        if (response?.type === 'success') {
            const { authentication } = response;
            handleGoogleSuccess(authentication.accessToken);
        }
    }, [response]);

    const handleGoogleSuccess = async (token) => {
        try {
            const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const userData = await response.json();
            console.log('Google User Data:', userData);
            navigation.navigate('GoogleConfirm', {
                userEmail: userData.email,
                userName: userData.name,
                userPicture: userData.picture,
                redirectTo: route?.params?.redirectTo
            });
        } catch (err) {
            console.error('Google Sign-In Error:', err);
            Alert.alert('Authentication Error', 'Failed to fetch user data from Google');
        }
    };

    const handleGoogleLogin = () => {
        if (request) {
            promptAsync();
        } else {
            Alert.alert('System Busy', 'Google authentication is initializing. Please try again.');
        }
    };

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
                            loading={isLoading}
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
                            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
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
