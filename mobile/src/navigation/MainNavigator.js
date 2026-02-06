import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform, TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Home, ShoppingBag, Info, Menu, ShoppingCart, MessageSquare } from 'lucide-react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { Heart } from 'lucide-react-native';
import { COLORS } from '../theme/theme';

// Screens
import HomeScreen from '../screens/main/HomeScreen';
import ShopScreen from '../screens/main/ShopScreen';
import AboutUsScreen from '../screens/main/AboutUsScreen';
import SupportScreen from '../screens/main/SupportScreen';
import ProductDetailsScreen from '../screens/product/ProductDetailsScreen';
import AddReviewScreen from '../screens/product/AddReviewScreen';
import SearchScreen from '../screens/main/SearchScreen';
import BrandLogo from '../components/BrandLogo';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Header Left with Screen Title
export const HeaderLeft = ({ navigation, title }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 15 }}>
        <TouchableOpacity
            onPress={() => navigation.openDrawer()}
            style={{ marginRight: 10 }}
        >
            <Menu size={24} color="white" />
        </TouchableOpacity>
        {title ? (
            <Text style={{
                fontSize: 16,
                fontWeight: 'bold',
                color: "white",
                width: 80, // Limit width to avoid crowding center
            }} numberOfLines={1}>
                {title}
            </Text>
        ) : null}
    </View>
);

// Header Icons (Wishlist and Cart)
export const HeaderRight = ({ navigation }) => {
    const { cartCount } = useCart();
    const { wishlist } = useWishlist();

    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 10 }}>
            <TouchableOpacity
                onPress={() => {
                    // Try to navigate to Wishlist in Profile stack or just open it
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
                onPress={() => {
                    // Cart is a sibling in the Drawer navigator
                    try {
                        navigation.navigate('Cart');
                    } catch (e) {
                        // Fallback attempt
                        navigation.reset({
                            index: 0,
                            routes: [{ name: 'Cart' }],
                        });
                    }
                }}
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

// Home Stack to handle Product Details
const HomeStack = ({ navigation }) => (
    <Stack.Navigator
        screenOptions={{
            headerShown: true,
            headerStyle: {
                backgroundColor: COLORS.accent,
                borderBottomWidth: 1,
                borderBottomColor: 'rgba(0,0,0,0.1)',
            },
            headerTintColor: COLORS.white,
            headerTitleStyle: {
                fontWeight: 'bold',
                fontSize: 18,
            },
            headerLeft: (props) => <HeaderLeft {...props} navigation={navigation} title="Home" />,
            headerRight: () => <HeaderRight navigation={navigation} />,
            headerTitle: () => <BrandLogo light />,
            headerTitleAlign: 'center',
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
        <Stack.Screen
            name="SearchScreen"
            component={SearchScreen}
            options={{ headerShown: false }}
        />
    </Stack.Navigator>
);

const ShopStack = ({ navigation }) => (
    <Stack.Navigator
        screenOptions={{
            headerShown: true,
            headerStyle: {
                backgroundColor: COLORS.accent,
                borderBottomWidth: 1,
                borderBottomColor: 'rgba(0,0,0,0.1)',
            },
            headerTintColor: COLORS.white,
            headerTitleStyle: {
                fontWeight: 'bold',
                fontSize: 18,
            },
            headerLeft: (props) => <HeaderLeft {...props} navigation={navigation} title="Shop" />,
            headerRight: () => <HeaderRight navigation={navigation} />,
            headerTitle: () => <BrandLogo light />,
            headerTitleAlign: 'center',
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
        <Stack.Screen
            name="SearchScreen"
            component={SearchScreen}
            options={{ headerShown: false }}
        />
    </Stack.Navigator>
);

const AboutStack = ({ navigation }) => (
    <Stack.Navigator
        screenOptions={{
            headerShown: true,
            headerStyle: {
                backgroundColor: COLORS.accent,
                borderBottomWidth: 1,
                borderBottomColor: 'rgba(0,0,0,0.1)',
            },
            headerTintColor: COLORS.white,
            headerTitleStyle: {
                fontWeight: 'bold',
                fontSize: 18,
            },
            headerLeft: (props) => <HeaderLeft {...props} navigation={navigation} title="About" />,
            headerRight: () => <HeaderRight navigation={navigation} />,
            headerTitle: () => <BrandLogo light />,
            headerTitleAlign: 'center',
        }}
    >
        <Stack.Screen
            name="AboutUsScreen"
            component={AboutUsScreen}
            options={{ title: 'About Us' }}
        />
    </Stack.Navigator>
);

const SupportStack = ({ navigation }) => (
    <Stack.Navigator
        screenOptions={{
            headerShown: true,
            headerStyle: {
                backgroundColor: COLORS.accent,
                borderBottomWidth: 1,
                borderBottomColor: 'rgba(0,0,0,0.1)',
            },
            headerTintColor: COLORS.white,
            headerTitleStyle: {
                fontWeight: 'bold',
                fontSize: 18,
            },
            headerLeft: (props) => <HeaderLeft {...props} navigation={navigation} title="Support" />,
            headerRight: () => <HeaderRight navigation={navigation} />,
            headerTitle: () => <BrandLogo light />,
            headerTitleAlign: 'center',
        }}
    >
        <Stack.Screen
            name="SupportScreen"
            component={SupportScreen}
            options={{ title: 'Support' }}
        />
    </Stack.Navigator>
);

const MainNavigator = ({ navigation }) => {
    return (
        <Tab.Navigator
            screenOptions={{
                tabBarShowLabel: true, // Force labels to show
                tabBarActiveTintColor: COLORS.accent,
                tabBarInactiveTintColor: COLORS.textLight,
                headerShown: false,
                tabBarStyle: {
                    height: Platform.OS === 'ios' ? 130 : 110,
                    paddingBottom: Platform.OS === 'ios' ? 40 : 35,
                    paddingTop: 12,
                    borderTopWidth: 1,
                    borderTopColor: COLORS.border,
                    backgroundColor: COLORS.white,
                    elevation: 20,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -4 },
                    shadowOpacity: 0.15,
                    shadowRadius: 8,
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '700',
                    marginBottom: Platform.OS === 'ios' ? 0 : 5,
                },
                tabBarIconStyle: {
                    marginBottom: 2,
                },
                tabBarItemStyle: {
                    height: 65,
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
            <Tab.Screen
                name="SupportTab"
                component={SupportStack}
                options={{
                    tabBarLabel: 'Support',
                    tabBarIcon: ({ color, size }) => <MessageSquare color={color} size={size} />,
                }}
            />
        </Tab.Navigator>
    );
};

export default MainNavigator;

const drawerStyles = StyleSheet.create({
    badge: {
        position: 'absolute',
        right: -8,
        top: -8,
        backgroundColor: COLORS.error,
        minWidth: 16,
        height: 16,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 2,
    },
    badgeText: {
        color: COLORS.white,
        fontSize: 10,
        fontWeight: '700',
    }
});

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
