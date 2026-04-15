import React from 'react';
import {
    createDrawerNavigator,
    DrawerContentScrollView,
    DrawerItemList,
    DrawerItem
} from '@react-navigation/drawer';
import { Home, Heart, ShoppingBag, Info, Phone, Package, ShoppingCart, User, LogOut, Bell } from 'lucide-react-native';
import MainNavigator, { HeaderRight, HeaderLeft } from './MainNavigator';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useNotifications } from '../context/NotificationContext';
import ContactStack from './ContactStack';
import OrdersScreen from '../screens/main/OrdersScreen';
import CartScreen from '../screens/cart/CartScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import AddressScreen from '../screens/profile/AddressScreen';
import NotificationsScreen from '../screens/main/NotificationsScreen';
import SupportScreen from '../screens/main/SupportScreen';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../theme/theme';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { Bot } from 'lucide-react-native';
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
                        <Text style={styles.avatarText}>{user?.name ? user.name.charAt(0).toUpperCase() : '?'}</Text>
                    </View>
                    <View style={styles.headerInfo}>
                        <Text style={styles.userName}>{user?.name || 'Guest'}</Text>
                        <Text style={styles.userEmail}>{user?.email || 'Login to sync your data'}</Text>
                    </View>
                </View>
                <DrawerItemList {...props} />
                {user ? (
                    <DrawerItem
                        label="Logout"
                        onPress={async () => {
                            try {
                                await logout();
                                // Navigate to Home (MainTabs) after state is cleared
                                // Using a small timeout to ensure native stability on Android
                                setTimeout(() => {
                                    props.navigation.navigate('MainTabs');
                                }, 100);
                            } catch (e) {
                                console.log('Logout error in drawer', e);
                            }
                        }}
                        icon={({ color, size }) => <LogOut color={COLORS.error} size={size} />}
                        labelStyle={{ color: COLORS.error }}
                    />
                ) : (
                    <DrawerItem
                        label="Login / Register"
                        onPress={() => props.navigation.navigate('Auth')}
                        icon={({ color, size }) => <User color={COLORS.accent} size={size} />}
                        labelStyle={{ color: COLORS.accent }}
                    />
                )}
            </DrawerContentScrollView>
        </View>
    );
};

const OrdersHeaderRight = ({ navigation }) => {
    const { cartCount } = useCart();
    const { wishlist } = useWishlist();
    const { unreadCount } = useNotifications();

    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 10 }}>
            <TouchableOpacity
                onPress={() => navigation.navigate('Profile', { screen: 'Notifications' })}
                style={{ marginRight: 12, padding: 5 }}
            >
                <View>
                    <Bell size={22} color="white" />
                    {unreadCount > 0 && (
                        <View style={drawerStyles.badge}>
                            <Text style={drawerStyles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>

            <TouchableOpacity
                onPress={() => {
                    try {
                        navigation.navigate('Profile', { screen: 'Wishlist' });
                    } catch (e) {
                        navigation.navigate('Wishlist');
                    }
                }}
                style={{ marginRight: 12, padding: 5 }}
            >
                <View>
                    <Heart size={22} color="white" />
                    {wishlist.length > 0 && (
                        <View style={drawerStyles.badge}>
                            <Text style={drawerStyles.badgeText}>{wishlist.length}</Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>

            <TouchableOpacity
                onPress={() => navigation.navigate('Cart')}
                style={{ padding: 5, marginRight: 5 }}
            >
                <View>
                    <ShoppingCart size={22} color="white" />
                    {cartCount > 0 && (
                        <View style={drawerStyles.badge}>
                            <Text style={drawerStyles.badgeText}>{cartCount}</Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
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
            headerRight: () => <OrdersHeaderRight navigation={navigation} />,
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

// Stack for Support with header
const SupportStack = ({ navigation }) => (
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
            headerLeft: (props) => <HeaderLeft {...props} navigation={navigation} title="Assistant" />,
            headerRight: () => <HeaderRight navigation={navigation} />,
            headerTitle: () => <BrandLogo light />,
            headerTitleAlign: 'center',
        }}
    >
        <Stack.Screen
            name="SupportScreen"
            component={SupportScreen}
            options={{ title: 'Boutique Assistant' }}
        />
    </Stack.Navigator>
);

// Stack for Profile with header, add RecentlyViewed and Wishlist
import RecentlyViewedScreen from '../screens/profile/RecentlyViewedScreen';
import WishlistScreen from '../screens/profile/WishlistScreen';
import AdminOrdersDashboard from '../screens/admin/AdminOrdersDashboard';
import OrderDetailsScreen from '../screens/admin/OrderDetailsScreen';
import AdminProductsScreen from '../screens/admin/AdminProductsScreen';
import AddReviewScreen from '../screens/product/AddReviewScreen';
import ProductDetailsScreen from '../screens/product/ProductDetailsScreen';
import AdminAnalyticsScreen from '../screens/admin/AdminAnalyticsScreen';

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
            name="AdminAnalytics"
            component={AdminAnalyticsScreen}
            options={{ title: 'Sales Analytics' }}
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
        <Stack.Screen
            name="AddReview"
            component={AddReviewScreen}
            options={{ headerShown: false }}
        />
        <Stack.Screen
            name="ProductDetails"
            component={ProductDetailsScreen}
            options={{ title: 'Product Details' }}
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
                listeners={({ navigation }) => ({
                    drawerItemPress: (e) => {
                        // Prevent default action
                        e.preventDefault();
                        // Reset the stack by navigating directly to the ProfileScreen
                        navigation.navigate('Profile', { screen: 'ProfileScreen' });
                    },
                })}
            />
            <Drawer.Screen
                name="Support"
                component={SupportStack}
                options={{
                    title: 'AI Assistant',
                    drawerIcon: ({ color, size }) => <Bot color={color} size={size} />
                }}
            />
            <Drawer.Screen
                name="Contact"
                component={ContactStack}
                options={{
                    title: 'Contact Us',
                    drawerIcon: ({ color, size }) => <Phone color={color} size={size} />
                }}
            />
            <Drawer.Screen
                name="NotificationsDrawer"
                component={NotificationsScreen}
                options={{
                    title: 'Notifications',
                    drawerIcon: ({ color, size }) => <NotificationDrawerIcon color={color} size={size} />
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

const NotificationDrawerIcon = ({ color, size }) => {
    const { unreadCount } = useNotifications();
    return (
        <View>
            <Bell color={color} size={size} />
            {unreadCount > 0 && (
                <View style={drawerStyles.badge}>
                    <Text style={drawerStyles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
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
