import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { COLORS } from '../theme/theme';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/auth/ResetPasswordScreen';
import GoogleConfirmScreen from '../screens/auth/GoogleConfirmScreen';

import { useUser } from '@clerk/clerk-expo';
import { useAuth } from '../context/AuthContext';

const Stack = createStackNavigator();

const AuthNavigator = () => {
    const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
    const { user: appUser } = useAuth();

    // If clerkUser is present but appUser is not, it means we are in the middle of a Google Auth confirmation
    // We should make GoogleConfirm the initial route to LAND directly on it after redirection.
    const shouldGoToConfirm = clerkLoaded && clerkUser && !appUser;

    if (!clerkLoaded) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.white }}>
                <ActivityIndicator size="large" color={COLORS.accent} />
            </View>
        );
    }

    return (
        <Stack.Navigator
            screenOptions={{ headerShown: false }}
            initialRouteName={shouldGoToConfirm ? "GoogleConfirm" : "Login"}
        >
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
            <Stack.Screen
                name="GoogleConfirm"
                component={GoogleConfirmScreen}
                initialParams={shouldGoToConfirm ? {
                    userEmail: clerkUser?.primaryEmailAddress?.emailAddress || clerkUser?.emailAddresses[0]?.emailAddress,
                    userName: clerkUser?.fullName || clerkUser?.firstName || 'User',
                    userPicture: clerkUser?.imageUrl,
                    isNewUser: false // default to existing, GoogleConfirm will handle details
                } : {}}
            />
        </Stack.Navigator>
    );
};

export default AuthNavigator;
