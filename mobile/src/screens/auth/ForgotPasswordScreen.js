import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail, ChevronLeft, CheckCircle2 } from 'lucide-react-native';
import api from '../../services/api';
import MyButton from '../../components/MyButton';
import MyInput from '../../components/MyInput';
import { COLORS } from '../../theme/theme';

const ForgotPasswordScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);

    const handleReset = async () => {
        if (!email) {
            Alert.alert('Error', 'Please enter your email address');
            return;
        }

        setIsLoading(true);
        try {
            // Using fetch to bypass potential axios network issues on Android
            console.log('Attempting password reset for:', email);
            const response = await fetch(`${api.defaults.baseURL}/auth/forgot-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Something went wrong');
            }

            setIsSent(true);
        } catch (err) {
            console.error('Forgot password error:', err);
            Alert.alert('Error', err.message || 'Network request failed');
        } finally {
            setIsLoading(false);
        }
    };

    if (isSent) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.content}>
                    <CheckCircle2 size={80} color={COLORS.success} style={styles.icon} />
                    <Text style={styles.title}>Email Sent!</Text>
                    <Text style={styles.subtitle}>
                        We have sent a password reset link to {email}. Please check your inbox.
                    </Text>
                    <MyButton
                        title="Back to Login"
                        onPress={() => navigation.navigate('Login')}
                        style={styles.btn}
                    />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => {
                    if (navigation.canGoBack()) {
                        navigation.goBack();
                    } else {
                        navigation.navigate('Login');
                    }
                }} style={styles.backBtn}>
                    <ChevronLeft color={COLORS.primary} size={28} />
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.info}>
                        <Text style={styles.title}>Forgot Password?</Text>
                        <Text style={styles.subtitle}>
                            Enter your email address and we'll send you a link to reset your password.
                        </Text>
                    </View>

                    <View style={styles.form}>
                        <MyInput
                            label="Email Address"
                            placeholder="Enter your email"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            icon={Mail}
                        />

                        <MyButton
                            title="Send Reset Link"
                            onPress={handleReset}
                            loading={isLoading}
                            style={styles.btn}
                        />
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
    header: {
        padding: 10,
    },
    backBtn: {
        padding: 5,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 30,
    },
    scrollContent: {
        flexGrow: 1,
        padding: 20,
    },
    info: {
        marginBottom: 30,
        marginTop: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: COLORS.textLight,
        lineHeight: 24,
    },
    form: {
        width: '100%',
    },
    btn: {
        marginTop: 20,
        width: '100%',
    },
    icon: {
        marginBottom: 20,
    }
});

export default ForgotPasswordScreen;
