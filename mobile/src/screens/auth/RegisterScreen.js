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

const RegisterScreen = ({ navigation }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const { register, isLoading, error, clearError } = useAuth();

    useEffect(() => {
        clearError();
    }, []);

    const handleInputChange = (setter) => (text) => {
        setter(text);
        if (error) clearError();
    };

    const handleRegister = async () => {
        if (!name || !email || !password) {
            alert('Please fill in all fields');
            return;
        }
        if (password !== confirmPassword) {
            alert("Passwords don't match");
            return;
        }
        await register(name, email, password);
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
                        <Text style={styles.title}>Create Account</Text>
                        <Text style={styles.subtitle}>Start your boutique experience</Text>
                    </View>

                    <View style={styles.form}>
                        {error && <Text style={styles.apiError}>{error}</Text>}
                        <MyInput
                            label="Full Name"
                            placeholder="John Doe"
                            value={name}
                            onChangeText={handleInputChange(setName)}
                            icon={User}
                        />
                        <MyInput
                            label="Email"
                            placeholder="john@example.com"
                            value={email}
                            onChangeText={handleInputChange(setEmail)}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            icon={Mail}
                        />
                        <MyInput
                            label="Password"
                            placeholder="Min 6 characters"
                            value={password}
                            onChangeText={handleInputChange(setPassword)}
                            secureTextEntry
                            icon={Lock}
                        />
                        <MyInput
                            label="Confirm Password"
                            placeholder="Re-enter password"
                            value={confirmPassword}
                            onChangeText={handleInputChange(setConfirmPassword)}
                            secureTextEntry
                            icon={Lock}
                        />

                        <MyButton
                            title="Register"
                            onPress={handleRegister}
                            loading={isLoading}
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
    apiError: {
        color: COLORS.error,
        textAlign: 'center',
        marginBottom: 10,
    }
});

export default RegisterScreen;
