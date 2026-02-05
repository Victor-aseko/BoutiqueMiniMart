import React from 'react';
import {
    createDrawerNavigator,
    DrawerContentScrollView,
    DrawerItemList,
    DrawerItem
} from '@react-navigation/drawer';
import { Home, ShoppingBag, Info, Phone, Package, ShoppingCart, User, LogOut } from 'lucide-react-native';
import MainNavigator, { HeaderRight, HeaderLeft } from './MainNavigator';
import { useCart } from '../context/CartContext';
import ContactScreen from '../screens/profile/ContactScreen';
import OrdersScreen from '../screens/main/OrdersScreen';
import CartScreen from '../screens/cart/CartScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import AddressScreen from '../screens/profile/AddressScreen';
import NotificationsScreen from '../screens/main/NotificationsScreen';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../theme/theme';
import { View, Text, StyleSheet } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import BrandLogo from '../components/BrandLogo';

const Drawer = createDrawerNavigator();
const Stack = createStackNavigator();

const CustomDrawerContent = (props) => {
    const { user, logout } = useAuth();

    return (
        <View style={{ flex: 1 }}>
            <DrawerContentScrollView {...props}>
                <View style={styles.drawerHeader}>
                    <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={styles.headerInfo}>
                        <Text style={styles.userName}>{user?.name}</Text>
                        <Text style={styles.userEmail}>{user?.email}</Text>
                    </View>
                </View>
                <DrawerItemList {...props} />
                <DrawerItem
                    label="Logout"
                    onPress={logout}
                    icon={({ color, size }) => <LogOut color={COLORS.error} size={size} />}
                    labelStyle={{ color: COLORS.error }}
                />
            </DrawerContentScrollView>
        </View>
    );
};

// Stack for Orders with header
const OrdersStack = ({ navigation }) => (
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
            headerLeft: (props) => <HeaderLeft {...props} navigation={navigation} title="Orders" />,
            headerRight: () => <HeaderRight navigation={navigation} />,
            headerTitle: () => <BrandLogo light />,
            headerTitleAlign: 'center',
        }}
    >
        <Stack.Screen
            name="OrdersScreen"
            component={OrdersScreen}
            options={{ title: 'Orders' }}
        />
    </Stack.Navigator>
);

// Stack for Cart with header
const CartStack = ({ navigation }) => (
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
            headerLeft: (props) => <HeaderLeft {...props} navigation={navigation} title="Cart" />,
            headerRight: () => <HeaderRight navigation={navigation} />,
            headerTitle: () => <BrandLogo light />,
            headerTitleAlign: 'center',
        }}
    >
        <Stack.Screen
            name="CartScreen"
            component={CartScreen}
            options={{ title: 'Cart' }}
        />
    </Stack.Navigator>
);

// Stack for Profile with header, add RecentlyViewed and Wishlist
import RecentlyViewedScreen from '../screens/profile/RecentlyViewedScreen';
import WishlistScreen from '../screens/profile/WishlistScreen';
import AdminOrdersDashboard from '../screens/admin/AdminOrdersDashboard';
import OrderDetailsScreen from '../screens/admin/OrderDetailsScreen';
import AdminProductsScreen from '../screens/admin/AdminProductsScreen';

const ProfileStack = ({ navigation }) => (
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
            headerLeft: (props) => <HeaderLeft {...props} navigation={navigation} title="Profile" />,
            headerRight: () => <HeaderRight navigation={navigation} />,
            headerTitle: () => <BrandLogo light />,
            headerTitleAlign: 'center',
        }}
    >
        <Stack.Screen
            name="ProfileScreen"
            component={ProfileScreen}
            options={{ title: 'Profile' }}
        />
        <Stack.Screen
            name="RecentlyViewed"
            component={RecentlyViewedScreen}
            options={{ title: 'Recently Viewed' }}
        />
        <Stack.Screen
            name="Wishlist"
            component={WishlistScreen}
            options={{ title: 'My Wishlist' }}
        />
        <Stack.Screen
            name="AddressScreen"
            component={AddressScreen}
            options={{ title: 'Delivery Address' }}
        />
        <Stack.Screen
            name="AdminOrdersDashboard"
            component={AdminOrdersDashboard}
            options={{ headerShown: false }}
        />
        <Stack.Screen
            name="OrderDetails"
            component={OrderDetailsScreen}
            options={{ headerShown: false }}
        />
        <Stack.Screen
            name="AdminProducts"
            component={AdminProductsScreen}
            options={{ headerShown: false }}
        />
        <Stack.Screen
            name="Notifications"
            component={NotificationsScreen}
            options={{ headerShown: false }}
        />
    </Stack.Navigator>
);

const DrawerNavigator = () => {
    return (
        <Drawer.Navigator
            drawerContent={(props) => <CustomDrawerContent {...props} />}
            screenOptions={{
                headerShown: false,
                drawerActiveTintColor: COLORS.accent,
                drawerInactiveTintColor: COLORS.text,
            }}
        >
            <Drawer.Screen
                name="MainTabs"
                component={MainNavigator}
                options={{
                    title: 'Home',
                    drawerIcon: ({ color, size }) => <Home color={color} size={size} />
                }}
            />
            <Drawer.Screen
                name="Orders"
                component={OrdersStack}
                options={{
                    drawerIcon: ({ color, size }) => <Package color={color} size={size} />
                }}
            />
            <Drawer.Screen
                name="Cart"
                component={CartStack}
                options={{
                    drawerIcon: ({ color, size }) => {
                        // show badge on drawer icon
                        return (
                            <CartDrawerIcon color={color} size={size} />
                        );
                    }
                }}
            />
            <Drawer.Screen
                name="Profile"
                component={ProfileStack}
                options={{
                    title: 'My Profile',
                    drawerIcon: ({ color, size }) => <User color={color} size={size} />
                }}
            />
            <Drawer.Screen
                name="Contact"
                component={ContactScreen}
                options={{
                    title: 'Contact Us',
                    drawerIcon: ({ color, size }) => <Phone color={color} size={size} />
                }}
            />
        </Drawer.Navigator>
    );
};

const CartDrawerIcon = ({ color, size }) => {
    const { cartCount } = useCart();
    return (
        <View>
            <ShoppingCart color={color} size={size} />
            {cartCount > 0 && (
                <View style={drawerStyles.badge}>
                    <Text style={drawerStyles.badgeText}>{cartCount}</Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    drawerHeader: {
        padding: 20,
        backgroundColor: COLORS.background,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarPlaceholder: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: COLORS.accent,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: COLORS.white,
        fontSize: 24,
        fontWeight: 'bold',
    },
    headerInfo: {
        marginLeft: 15,
    },
    userName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    userEmail: {
        fontSize: 12,
        color: COLORS.textLight,
    }
});

export default DrawerNavigator;

const drawerStyles = StyleSheet.create({
    badge: {
        position: 'absolute',
        right: -8,
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
