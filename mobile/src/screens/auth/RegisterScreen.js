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
import { User, Mail, Lock, ChevronLeft } from 'lucide-react-native';

const RegisterScreen = ({ navigation, route }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const { register, authLoading, error, setError, clearError } = useAuth();
    const [nameError, setNameError] = useState('');
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [confirmPasswordError, setConfirmPasswordError] = useState('');

    useEffect(() => {
        clearError();
    }, []);

    const handleInputChange = (field, setter) => (text) => {
        setter(text);
        if (error) clearError();

        // Real-time validation
        if (field === 'name') {
            if (!text.trim()) setNameError('Full Name is required');
            else setNameError('');
        }

        if (field === 'email') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!text.trim()) setEmailError('Email is required');
            else if (!emailRegex.test(text.trim())) setEmailError('Enter a valid email address');
            else setEmailError('');
        }

        if (field === 'password') {
            if (!text) setPasswordError('Password is required');
            else if (text.length < 8) setPasswordError('Min 8 characters required');
            else setPasswordError('');

            // Also re-validate confirm password if it's already filled
            if (confirmPassword && text !== confirmPassword) setConfirmPasswordError('Passwords do not match');
            else if (confirmPassword && text === confirmPassword) setConfirmPasswordError('');
        }

        if (field === 'confirmPassword') {
            if (!text) setConfirmPasswordError('Please confirm your password');
            else if (text !== password) setConfirmPasswordError('Passwords do not match');
            else setConfirmPasswordError('');
        }
    };

    const handleRegister = async () => {
        // Final validation check
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        let hasError = false;
        if (!name.trim()) { setNameError('Full Name is required'); hasError = true; }
        if (!email.trim()) { setEmailError('Email is required'); hasError = true; }
        else if (!emailRegex.test(email.trim())) { setEmailError('Enter a valid email address'); hasError = true; }
        
        if (!password) { setPasswordError('Password is required'); hasError = true; }
        else if (password.length < 8) { setPasswordError('Password must be at least 8 characters long'); hasError = true; }
        
        if (password !== confirmPassword) { setConfirmPasswordError("Passwords do not match"); hasError = true; }

        if (hasError) {
            setError('Please correct the errors in the form.');
            return;
        }
        try {
            const success = await register(name, email, password);
            if (success) {
                const redirectTo = route?.params?.redirectTo;
                if (redirectTo) {
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

                    // Generic redirect
                    navigation.navigate('Main', {
                        screen: redirectTo.screen,
                        params: redirectTo.params
                    });
                    return;
                }
                try {
                    navigation.navigate('Main', { screen: 'Profile' });
                } catch (e) {
                    navigation.getParent()?.navigate('Main', { screen: 'Profile' });
                }

                // Safety reset for production builds
                setTimeout(() => {
                    const state = navigation.getState();
                    if (state?.routes[state.index]?.name === 'Register') {
                        navigation.getParent()?.reset({
                            index: 0,
                            routes: [{ name: 'Main' }]
                        });
                    }
                }, 500);
            }
        } catch (error) {
            console.error('Registration Exception:', error);
            setError('An unexpected error occurred. Please try again.');
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
                        onPress={() => {
                            if (navigation.canGoBack()) {
                                navigation.goBack();
                            } else {
                                navigation.navigate('Main');
                            }
                        }}
                    >
                        <ChevronLeft size={28} color={COLORS.primary} />
                    </TouchableOpacity>
                    <View style={styles.header}>
                        <Text style={styles.title}>Create Account</Text>
                        <Text style={styles.subtitle}>Start your boutique experience</Text>
                    </View>

                    <View style={styles.form}>
                        {error && (
                            <View style={styles.errorContainer}>
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        )}
                        <MyInput
                            label="Full Name"
                            placeholder="mini Boutique"
                            value={name}
                            onChangeText={handleInputChange('name', setName)}
                            icon={User}
                            error={nameError}
                        />
                        <MyInput
                            label="Email"
                            placeholder="miniboutique043@gmail.com"
                            value={email}
                            onChangeText={handleInputChange('email', setEmail)}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            icon={Mail}
                            error={emailError}
                        />
                        <MyInput
                            label="Password"
                            placeholder="Min 8 characters"
                            value={password}
                            onChangeText={handleInputChange('password', setPassword)}
                            secureTextEntry
                            icon={Lock}
                            error={passwordError}
                        />
                        <MyInput
                            label="Confirm Password"
                            placeholder="Re-enter password"
                            value={confirmPassword}
                            onChangeText={handleInputChange('confirmPassword', setConfirmPassword)}
                            secureTextEntry
                            icon={Lock}
                            error={confirmPasswordError}
                        />

                        <MyButton
                            title="Register"
                            onPress={handleRegister}
                            loading={authLoading}
                            style={styles.registerBtn}
                        />



                        <View style={styles.footer}>
                            <Text style={styles.footerText}>Already have an account? </Text>
                            <TouchableOpacity onPress={() => navigation.goBack()}>
                                <Text style={styles.link}>Sign In</Text>
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
        padding: 20,
        justifyContent: 'center'
    },
    backButton: {
        position: 'absolute',
        top: 10,
        left: 0,
        padding: 10,
        zIndex: 10,
    },
    header: {
        marginBottom: 30,
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
    registerBtn: {
        marginTop: 20,
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
        display: 'none',
    }
});

export default RegisterScreen;
