import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import MyButton from '../../components/MyButton';
import MyInput from '../../components/MyInput';
import { COLORS } from '../../theme/theme';
import { Mail, Lock, ChevronLeft } from 'lucide-react-native';

const LoginScreen = ({ navigation, route }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login, isLoading, error, clearError } = useAuth();

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
            alert('Please enter email and password');
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
                        {error && <Text style={styles.apiError}>{error}</Text>}
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
    apiError: {
        color: COLORS.error,
        textAlign: 'center',
        marginBottom: 10,
    }
});

export default LoginScreen;
