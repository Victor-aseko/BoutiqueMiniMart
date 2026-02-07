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
import { Lock, ChevronLeft, CheckCircle2 } from 'lucide-react-native';
import api from '../../services/api';
import MyButton from '../../components/MyButton';
import MyInput from '../../components/MyInput';
import { COLORS } from '../../theme/theme';

const ResetPasswordScreen = ({ route, navigation }) => {
    // We expect the token to be passed if the user clicks a deep link, 
    // or entered manually if we provide a field for it.
    // For now, let's assume it's passed via navigation params.
    const { token } = route.params || {};

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleReset = async () => {
        if (!password || !confirmPassword) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        if (password.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters');
            return;
        }

        if (!token) {
            Alert.alert('Error', 'Invalid or missing reset token');
            return;
        }

        setIsLoading(true);
        try {
            await api.post(`/auth/reset-password/${token}`, { password });
            setIsSuccess(true);
        } catch (err) {
            console.error('Reset password error:', err);
            const message = err.response?.data?.message || err.message || 'Token is invalid or has expired';
            Alert.alert('Error', message);
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.content}>
                    <CheckCircle2 size={80} color={COLORS.success} style={styles.icon} />
                    <Text style={styles.title}>Success!</Text>
                    <Text style={styles.subtitle}>
                        Your password has been reset successfully. You can now log in with your new password.
                    </Text>
                    <MyButton
                        title="Go to Login"
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
                        <Text style={styles.title}>Reset Password</Text>
                        <Text style={styles.subtitle}>
                            Create a new password for your account. Make sure it's strong and secure.
                        </Text>
                    </View>

                    <View style={styles.form}>
                        <MyInput
                            label="New Password"
                            placeholder="Enter new password"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            icon={Lock}
                        />

                        <MyInput
                            label="Confirm New Password"
                            placeholder="Confirm your password"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry
                            icon={Lock}
                        />

                        <MyButton
                            title="Reset Password"
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

export default ResetPasswordScreen;
