import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import AuthNavigator from './AuthNavigator';
import DrawerNavigator from './DrawerNavigator';
import { View, ActivityIndicator } from 'react-native';
import { COLORS } from '../theme/theme';

import { createStackNavigator } from '@react-navigation/stack';

const Stack = createStackNavigator();

const AppNavigator = ({ linking }) => {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <NavigationContainer linking={linking}>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                <Stack.Screen name="Main" component={DrawerNavigator} />
                <Stack.Screen name="Auth" component={AuthNavigator} />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;
