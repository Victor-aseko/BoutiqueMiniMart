import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import ContactScreen from '../screens/profile/ContactScreen';
import { HeaderLeft, HeaderRight } from './MainNavigator';
import BrandLogo from '../components/BrandLogo';
import { COLORS } from '../theme/theme';

const Stack = createStackNavigator();

const ContactStack = ({ navigation }) => (
    <Stack.Navigator
        screenOptions={{
            headerShown: true,
            headerStyle: {
                backgroundColor: COLORS.accent,
                borderBottomWidth: 1,
                borderBottomColor: 'rgba(0,0,0,0.1)',
            },
            headerTintColor: "white",
            headerTitleStyle: {
                fontWeight: 'bold',
                fontSize: 18,
            },
            headerLeft: (props) => <HeaderLeft {...props} navigation={navigation} title="Contact" />,
            headerRight: () => <HeaderRight navigation={navigation} />,
            headerTitle: () => <BrandLogo light />,
            headerTitleAlign: 'center',
        }}
    >
        <Stack.Screen
            name="ContactScreen"
            component={ContactScreen}
            options={{ title: 'Contact Us' }}
        />
    </Stack.Navigator>
);

export default ContactStack;
