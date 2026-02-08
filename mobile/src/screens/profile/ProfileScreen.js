import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { COLORS } from '../../theme/theme';
import { LogOut, User as UserIcon, Package, ShoppingCart, Heart, MapPin, ChevronRight, Settings } from 'lucide-react-native';
import { ScrollView } from 'react-native';
import { useCart } from '../../context/CartContext';

const ProfileScreen = ({ navigation }) => {
    const { user, logout } = useAuth();
    const { cartCount } = useCart();

    // Navigation is handled by AppNavigator switching stacks based on user state
    if (!user) return null;

    const MenuLink = ({ icon: Icon, label, onPress, badge }) => (
        <TouchableOpacity style={styles.menuItem} onPress={onPress}>
            <View style={styles.menuLeft}>
                <View style={styles.menuIconContainer}>
                    <Icon size={20} color={COLORS.primary} />
                </View>
                <Text style={styles.menuLabel}>{label}</Text>
            </View>
            <View style={styles.menuRight}>
                {badge > 0 && (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{badge}</Text>
                    </View>
                )}
                <ChevronRight size={20} color={COLORS.textLight} />
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <View style={styles.profileInfo}>
                        <View style={styles.avatar}>
                            <UserIcon color={COLORS.white} size={40} />
                        </View>
                        <View style={styles.textContainer}>
                            <Text style={styles.name}>{user?.name}</Text>
                            <Text style={styles.email}>{user?.email}</Text>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.settingsBtn}>
                        <Settings size={24} color={COLORS.primary} />
                    </TouchableOpacity>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Dashboard</Text>
                    <View style={styles.menuList}>
                        {user?.isAdmin && (
                            <>
                                <MenuLink
                                    icon={Package}
                                    label="Manage Orders"
                                    onPress={() => navigation.navigate('AdminOrdersDashboard')}
                                />
                                <MenuLink
                                    icon={ShoppingCart}
                                    label="Manage Products"
                                    onPress={() => navigation.navigate('AdminProducts')}
                                />
                            </>
                        )}
                        <MenuLink
                            icon={Package}
                            label="My Orders"
                            onPress={() => navigation.navigate('Orders')}
                        />
                        <MenuLink
                            icon={ShoppingCart}
                            label="Shopping Cart"
                            onPress={() => navigation.navigate('Cart')}
                            badge={cartCount}
                        />
                        <MenuLink
                            icon={Heart}
                            label="My Wishlist"
                            onPress={() => navigation.navigate('Wishlist')}
                        />
                        <MenuLink
                            icon={UserIcon}
                            label="Recently Viewed"
                            onPress={() => navigation.navigate('RecentlyViewed')}
                        />
                        <MenuLink
                            icon={MapPin}
                            label="Shipping Addresses"
                            onPress={() => navigation.navigate('AddressScreen')}
                        />
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Account Actions</Text>
                    <View style={styles.menuList}>
                        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
                            <LogOut size={20} color={COLORS.error} />
                            <Text style={styles.logoutText}>Logout</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 30,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    profileInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: COLORS.accent,
        justifyContent: 'center',
        alignItems: 'center'
    },
    textContainer: {
        marginLeft: 15,
    },
    name: { fontSize: 18, fontWeight: 'bold', color: COLORS.primary },
    email: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
    settingsBtn: {
        padding: 10,
        backgroundColor: COLORS.background,
        borderRadius: 12,
    },
    section: {
        marginTop: 25,
        paddingHorizontal: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.textLight,
        marginBottom: 15,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    menuList: {
        backgroundColor: COLORS.white,
        borderRadius: 15,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    menuLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    menuIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: COLORS.background,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    menuLabel: {
        fontSize: 16,
        fontWeight: '500',
        color: COLORS.primary,
    },
    menuRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    badge: {
        backgroundColor: COLORS.accent,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        marginRight: 10,
    },
    badgeText: {
        color: COLORS.white,
        fontSize: 10,
        fontWeight: 'bold',
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: COLORS.white,
    },
    logoutText: {
        marginLeft: 12,
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.error,
    }
});

export default ProfileScreen;
