import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Image,
    TouchableOpacity
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Alert } from 'react-native';
import { Trash2, Plus, Minus, ShoppingBag, ChevronLeft } from 'lucide-react-native';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { COLORS, SIZES } from '../../theme/theme';
import MyButton from '../../components/MyButton';

const CartScreen = ({ navigation }) => {
    const { cartItems, updateCartQty, removeFromCart, cartTotal } = useCart();
    const { user } = useAuth();

    const getShippingFee = (city, itemsPrice) => {
        if (!city) return 50; // Default for Nairobi/Unknown
        const c = city.trim().toLowerCase();
        let distance = 250;

        const distances = {
            'nairobi': 0, 'thika': 45, 'kiambu': 15, 'machakos': 65,
            'kajiado': 80, 'naivasha': 90, 'nakuru': 160, 'nyeri': 150,
            'eldoret': 310, 'kisumu': 345, 'mombasa': 485,
        };

        if (distances[c] !== undefined) distance = distances[c];

        let baseFee = 0;
        if (distance === 0) baseFee = 50;
        else if (distance < 100) baseFee = 150;
        else if (distance < 300) baseFee = 250;
        else baseFee = 320;

        return Math.ceil(baseFee + (itemsPrice * 0.01));
    };

    const userCity = user?.addresses?.find(a => a.isDefault)?.city || user?.addresses?.[0]?.city || 'Nairobi';
    const shippingPrice = getShippingFee(userCity, cartTotal);
    const finalTotal = cartTotal + shippingPrice;

    const renderItem = ({ item }) => (
        <View style={styles.cartItem}>
            <Image source={{ uri: item.image }} style={styles.itemImage} />
            <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.itemPrice}>Kshs {Number(item.price).toFixed(2)}</Text>

                {(item.color || item.size) && (
                    <Text style={styles.itemVariant}>
                        {item.color ? `Color: ${item.color}` : ''}
                        {item.color && item.size ? ' | ' : ''}
                        {item.size ? `Size: ${item.size}` : ''}
                    </Text>
                )}

                <View style={styles.qtyRow}>
                    <View style={styles.qtyPicker}>
                        <TouchableOpacity
                            onPress={() => item.qty > 1 && updateCartQty(item, item.qty - 1)}
                            style={styles.qtyBtn}
                        >
                            <Minus size={16} color={COLORS.primary} />
                        </TouchableOpacity>
                        <Text style={styles.qtyText}>{item.qty}</Text>
                        <TouchableOpacity
                            onPress={() => updateCartQty(item, item.qty + 1)}
                            style={styles.qtyBtn}
                        >
                            <Plus size={16} color={COLORS.primary} />
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity onPress={() => removeFromCart(item.product || item._id)}>
                        <Trash2 size={20} color={COLORS.error} />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    if (cartItems.length === 0) {
        return (
            <SafeAreaView style={styles.centered}>
                <ShoppingBag size={80} color={COLORS.border} />
                <Text style={styles.emptyTitle}>Your cart is empty</Text>
                <Text style={styles.emptySubtitle}>Looks like you haven't added anything yet.</Text>
                <MyButton
                    title="Start Shopping"
                    onPress={() => navigation.navigate('MainTabs', { screen: 'HomeTab' })}
                    style={{ width: '60%', marginTop: 20 }}
                />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Redundant header removed - using Stack header instead */}

            <FlatList
                data={cartItems}
                keyExtractor={(item, index) => item._id || item.product || String(index)}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
            />

            <View style={styles.summary}>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Subtotal</Text>
                    <Text style={styles.summaryValue}>Kshs {cartTotal.toFixed(2)}</Text>
                </View>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Shipping ({userCity})</Text>
                    <Text style={styles.summaryValue}>Kshs {shippingPrice.toFixed(2)}</Text>
                </View>
                <View style={[styles.summaryRow, styles.totalRow]}>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={styles.totalValue}>Kshs {finalTotal.toFixed(2)}</Text>
                </View>

                <MyButton
                    title="Checkout"
                    onPress={() => {
                        if (!user) {
                            navigation.navigate('Auth');
                            return;
                        }
                        navigation.navigate('Orders', {
                            screen: 'OrdersScreen',
                            params: { cartItems }
                        });
                    }}
                    style={styles.checkoutBtn}
                />
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: COLORS.background,
    },
    header: {
        padding: 20,
        backgroundColor: COLORS.white,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.primary,
        flex: 1,
        textAlign: 'center',
    },
    backBtn: { padding: 8, marginRight: 8 },
    itemCount: {
        color: COLORS.textLight,
    },
    list: {
        padding: 15,
    },
    cartItem: {
        flexDirection: 'row',
        backgroundColor: COLORS.white,
        borderRadius: SIZES.radius,
        padding: 12,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    itemImage: {
        width: 90,
        height: 90,
        borderRadius: 10,
        backgroundColor: '#eee',
    },
    itemInfo: {
        flex: 1,
        marginLeft: 15,
        justifyContent: 'space-between',
    },
    itemName: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.primary,
    },
    itemPrice: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.accent,
    },
    itemVariant: {
        fontSize: 12,
        color: COLORS.textLight,
        marginTop: 2,
    },
    qtyRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    qtyPicker: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        borderRadius: 8,
    },
    qtyBtn: {
        padding: 5,
        paddingHorizontal: 8,
    },
    qtyText: {
        fontSize: 14,
        fontWeight: 'bold',
        paddingHorizontal: 8,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginTop: 20,
    },
    emptySubtitle: {
        fontSize: 15,
        color: COLORS.textLight,
        textAlign: 'center',
        marginTop: 10,
    },
    summary: {
        backgroundColor: COLORS.white,
        padding: 20,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    summaryLabel: {
        color: COLORS.textLight,
        fontSize: 14,
    },
    summaryValue: {
        color: COLORS.primary,
        fontWeight: '600',
    },
    totalRow: {
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    totalLabel: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    totalValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.accent,
    },
    checkoutBtn: {
        marginTop: 20,
    }
});

export default CartScreen;
