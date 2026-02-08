import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SIZES } from '../../theme/theme';
import { ChevronLeft, Info, CheckCircle, XCircle } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { Alert } from 'react-native';

const GoogleConfirmScreen = ({ navigation, route }) => {
    const { userEmail, userName, userPicture, redirectTo, isNewUser } = route.params || {};
    const { loginWithGoogle } = useAuth();

    const [isLoading, setIsLoading] = useState(false);

    const handleContinue = async () => {
        setIsLoading(true);
        try {
            const success = await loginWithGoogle({
                email: userEmail,
                name: userName,
                picture: userPicture
            });

            if (success) {
                // Short delay to ensure state is synchronized across the app
                setTimeout(() => {
                    if (redirectTo) {
                        const { tab, screen, params } = redirectTo;

                        // Use reset for a cleaner transition across stacks
                        navigation.getParent()?.reset({
                            index: 0,
                            routes: [{
                                name: 'Main',
                                state: {
                                    routes: [{
                                        name: tab || 'MainTabs',
                                        state: {
                                            routes: [{
                                                name: screen || 'HomeTab',
                                                params: params
                                            }]
                                        }
                                    }]
                                }
                            }]
                        });
                    } else {
                        // Default redirection to Profile or Home as requested
                        // Navigating to Main -> Profile stack -> ProfileScreen
                        navigation.getParent()?.reset({
                            index: 0,
                            routes: [{
                                name: 'Main',
                                state: {
                                    routes: [{
                                        name: 'Profile',
                                        state: {
                                            routes: [{
                                                name: 'ProfileScreen'
                                            }]
                                        }
                                    }]
                                }
                            }]
                        });
                    }
                }, 100);
            } else {
                setIsLoading(false);
                Alert.alert('Error', 'Failed to complete Google Sign-In with our server.');
            }
        } catch (err) {
            console.error('Confirm error:', err);
            setIsLoading(false);
            Alert.alert('Error', 'Something went wrong during login.');
        }
    };

    const handleCancel = () => {
        if (navigation.canGoBack()) {
            navigation.goBack();
        } else {
            // If we land directly here (e.g. from a deep link) and cancel, 
            // go back to the main app experience
            navigation.navigate('Main');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={handleCancel} style={styles.backBtn}>
                    <ChevronLeft color={COLORS.primary} size={28} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{isNewUser ? 'Create Account' : 'Google Sign-In'}</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.avatarContainer}>
                    {userPicture ? (
                        <Image source={{ uri: userPicture }} style={styles.googleCircle} />
                    ) : (
                        <View style={styles.googleCircle}>
                            <Text style={styles.googleLetter}>{userName ? userName.charAt(0) : 'G'}</Text>
                        </View>
                    )}
                    <CheckCircle size={24} color={COLORS.success} style={styles.checkIcon} />
                </View>

                <Text style={styles.welcomeText}>
                    {isNewUser ? "Welcome to MiniBoutique!" : "You're signing in as"}
                </Text>
                <Text style={styles.brandText}>
                    {isNewUser ? "Create account as " + (userName || 'User') : (userName || 'Google User')}
                </Text>

                <View style={styles.emailBadge}>
                    <Text style={styles.emailText}>{userEmail}</Text>
                </View>

                <View style={styles.infoCard}>
                    <Info size={20} color={COLORS.accent} style={styles.infoIcon} />
                    <Text style={styles.infoText}>
                        You can preview our <Text style={styles.linkText} onPress={() => { }}>Terms and Conditions</Text> and <Text style={styles.linkText} onPress={() => { }}>Privacy Policy</Text> before continuing.
                    </Text>
                </View>

                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={[styles.button, styles.continueBtn, isLoading && { opacity: 0.8 }]}
                        onPress={handleContinue}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color={COLORS.white} />
                        ) : (
                            <Text style={styles.continueText}>Continue</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, styles.cancelBtn]}
                        onPress={handleCancel}
                    >
                        <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    backBtn: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginLeft: 15,
    },
    content: {
        alignItems: 'center',
        padding: 30,
        paddingTop: 50,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 30,
    },
    googleCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: COLORS.background,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.border,
    },
    googleLetter: {
        fontSize: 50,
        fontWeight: 'bold',
        color: '#4285F4', // Google Blue
    },
    checkIcon: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: COLORS.white,
        borderRadius: 12,
    },
    welcomeText: {
        fontSize: 18,
        color: COLORS.textLight,
        textAlign: 'center',
    },
    brandText: {
        fontSize: 26,
        fontWeight: 'bold',
        color: COLORS.primary,
        textAlign: 'center',
        marginBottom: 20,
    },
    emailBadge: {
        backgroundColor: COLORS.background,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 25,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginBottom: 40,
    },
    emailText: {
        fontSize: 16,
        color: COLORS.primary,
        fontWeight: '500',
    },
    infoCard: {
        flexDirection: 'row',
        backgroundColor: 'rgba(231, 76, 60, 0.05)',
        padding: 20,
        borderRadius: 15,
        marginBottom: 50,
        alignItems: 'center',
    },
    infoIcon: {
        marginRight: 15,
    },
    infoText: {
        flex: 1,
        fontSize: 14,
        color: COLORS.text,
        lineHeight: 20,
    },
    linkText: {
        color: COLORS.accent,
        fontWeight: 'bold',
        textDecorationLine: 'underline',
    },
    buttonContainer: {
        width: '100%',
    },
    button: {
        paddingVertical: 16,
        borderRadius: 15,
        alignItems: 'center',
        marginBottom: 15,
    },
    continueBtn: {
        backgroundColor: COLORS.accent,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
    },
    continueText: {
        color: COLORS.white,
        fontSize: 18,
        fontWeight: 'bold',
    },
    cancelBtn: {
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    cancelText: {
        color: COLORS.textLight,
        fontSize: 16,
        fontWeight: '600',
    }
});

export default GoogleConfirmScreen;
