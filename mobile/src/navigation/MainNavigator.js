import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform, TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Home, ShoppingBag, Info, Menu, ShoppingCart } from 'lucide-react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { useCart } from '../context/CartContext';
import { COLORS } from '../theme/theme';

// Screens
import HomeScreen from '../screens/main/HomeScreen';
import ShopScreen from '../screens/main/ShopScreen';
import AboutUsScreen from '../screens/main/AboutUsScreen';
import ProductDetailsScreen from '../screens/product/ProductDetailsScreen';
import AddReviewScreen from '../screens/product/AddReviewScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Cart button shown in headers
const CartButton = ({ navigation }) => {
    const { cartCount } = useCart();
    return (
        <TouchableOpacity onPress={() => navigation.getParent()?.getParent()?.navigate('Cart')} style={{ marginRight: 15 }}>
            <View>
                <ShoppingCart size={22} color={COLORS.primary} />
                {cartCount > 0 && (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{cartCount}</Text>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );
};

// Home Stack to handle Product Details
const HomeStack = ({ navigation }) => (
    <Stack.Navigator
        screenOptions={{
            headerShown: true,
            headerStyle: {
                backgroundColor: COLORS.white,
                borderBottomWidth: 1,
                borderBottomColor: COLORS.border,
            },
            headerTintColor: COLORS.primary,
            headerTitleStyle: {
                fontWeight: 'bold',
                fontSize: 18,
            },
            headerLeft: () => (
                <TouchableOpacity 
                    onPress={() => navigation.openDrawer()}
                    style={{ marginLeft: 15 }}
                >
                    <Menu size={24} color={COLORS.primary} />
                </TouchableOpacity>
            ),
            
        }}
    >
        <Stack.Screen
            name="HomeScreen"
            component={HomeScreen}
            options={{ title: 'Home' }}
        />
        <Stack.Screen
            name="ProductDetails"
            component={ProductDetailsScreen}
            options={{ title: 'Product Details' }}
        />
        <Stack.Screen
            name="AddReview"
            component={AddReviewScreen}
            options={{ title: 'Add Review' }}
        />
    </Stack.Navigator>
);

const ShopStack = ({ navigation }) => (
    <Stack.Navigator
        screenOptions={{
            headerShown: true,
            headerStyle: {
                backgroundColor: COLORS.white,
                borderBottomWidth: 1,
                borderBottomColor: COLORS.border,
            },
            headerTintColor: COLORS.primary,
            headerTitleStyle: {
                fontWeight: 'bold',
                fontSize: 18,
            },
            headerLeft: () => (
                <TouchableOpacity 
                    onPress={() => navigation.openDrawer()}
                    style={{ marginLeft: 15 }}
                >
                    <Menu size={24} color={COLORS.primary} />
                </TouchableOpacity>
            ),
            
        }}
    >
        <Stack.Screen
            name="ShopScreen"
            component={ShopScreen}
            options={{ title: 'Shop' }}
        />
        <Stack.Screen
            name="ProductDetails"
            component={ProductDetailsScreen}
            options={{ title: 'Product Details' }}
        />
        <Stack.Screen
            name="AddReview"
            component={AddReviewScreen}
            options={{ title: 'Add Review' }}
        />
    </Stack.Navigator>
);

const AboutStack = ({ navigation }) => (
    <Stack.Navigator
        screenOptions={{
            headerShown: true,
            headerStyle: {
                backgroundColor: COLORS.white,
                borderBottomWidth: 1,
                borderBottomColor: COLORS.border,
            },
            headerTintColor: COLORS.primary,
            headerTitleStyle: {
                fontWeight: 'bold',
                fontSize: 18,
            },
            headerLeft: () => (
                <TouchableOpacity 
                    onPress={() => navigation.openDrawer()}
                    style={{ marginLeft: 15 }}
                >
                    <Menu size={24} color={COLORS.primary} />
                </TouchableOpacity>
            ),
            
        }}
    >
        <Stack.Screen
            name="AboutUsScreen"
            component={AboutUsScreen}
            options={{ title: 'About Us' }}
        />
    </Stack.Navigator>
);

const MainNavigator = ({ navigation }) => {
    return (
        <Tab.Navigator
            screenOptions={{
                tabBarActiveTintColor: COLORS.accent,
                tabBarInactiveTintColor: COLORS.textLight,
                headerShown: false,
                tabBarStyle: {
                    paddingBottom: Platform.OS === 'ios' ? 35 : 25,
                    height: Platform.OS === 'ios' ? 100 : 85,
                    borderTopWidth: 1,
                    borderTopColor: COLORS.border,
                    backgroundColor: COLORS.white,
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    marginBottom: 10,
                    fontWeight: '500',
                },
                tabBarItemStyle: {
                    flex: 1,
                }
            }}
        >
            <Tab.Screen
                name="HomeTab"
                component={HomeStack}
                options={{
                    tabBarLabel: 'Home',
                    tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
                }}
            />
            <Tab.Screen
                name="ShopTab"
                component={ShopStack}
                options={{
                    tabBarLabel: 'Shop',
                    tabBarIcon: ({ color, size }) => <ShoppingBag color={color} size={size} />,
                }}
            />
            <Tab.Screen
                name="AboutTab"
                component={AboutStack}
                options={{
                    tabBarLabel: 'About',
                    tabBarIcon: ({ color, size }) => <Info color={color} size={size} />,
                }}
            />
        </Tab.Navigator>
    );
};

export default MainNavigator;

const styles = StyleSheet.create({
    badge: {
        position: 'absolute',
        right: -6,
        top: -6,
        backgroundColor: COLORS.error,
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    badgeText: {
        color: COLORS.white,
        fontSize: 11,
        fontWeight: '700',
    }
});
