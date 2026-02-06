import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    RefreshControl,
    TouchableOpacity,
    ScrollView
} from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../services/api';
import { COLORS, SIZES } from '../../theme/theme';
import { Package, ChevronRight, X, Check, Bell, Phone } from 'lucide-react-native';
import { Image, Alert } from 'react-native';

import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useCart } from '../../context/CartContext';

const OrdersScreen = ({ navigation, route }) => {
    const { user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [pendingOrder, setPendingOrder] = useState(null);
    const [placingOrder, setPlacingOrder] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('Cash (Pay on Delivery)');
    const [shippingPrice, setShippingPrice] = useState(0);
    const { unreadCount } = useNotifications();

    const getShippingFee = (city, itemsPrice) => {
        if (!city) return 0;
        const c = city.toString().trim().toLowerCase();
        let distance = 250; // default

        const distances = {
            'nairobi': 0,
            'thika': 45,
            'kiambu': 15,
            'machakos': 65,
            'kajiado': 80,
            'naivasha': 90,
            'nakuru': 160,
            'nyeri': 150,
            'eldoret': 310,
            'kisumu': 345,
            'mombasa': 485,
        };

        if (distances[c] !== undefined) {
            distance = distances[c];
        }

        let baseFee = 0;
        if (distance === 0) baseFee = 50;
        else if (distance < 100) baseFee = 150;
        else if (distance < 300) baseFee = 250;
        else baseFee = 320;

        // Add 1% of item price for handling/insurance
        const handling = itemsPrice * 0.01;
        return Math.ceil(baseFee + handling);
    };

    useEffect(() => {
        if (pendingOrder) {
            const itemsPrice = pendingOrder.items.reduce((acc, item) => acc + (Number(item.price || 0) * Number(item.qty || 1)), 0);
            const city = pendingOrder.shippingAddress?.city || pendingOrder.location;
            const fee = getShippingFee(city, itemsPrice);
            setShippingPrice(fee);
        }
    }, [pendingOrder]);

    const handleAddressSelection = () => {
        navigation.navigate('Profile', {
            screen: 'AddressScreen',
            params: { returnScreen: 'OrdersScreen' }
        });
    };

    useEffect(() => {
        if (!user) {
            navigation.navigate('Auth');
            return;
        }
    }, [user]);

    useFocusEffect(
        useCallback(() => {
            fetchOrders();
        }, [user])
    );

    useEffect(() => {
        // 1. Handle incoming address selection (from AddressScreen)
        if (route.params?.selectedAddress && pendingOrder) {
            console.log('Applying selected address to pending order');
            setPendingOrder(prev => ({
                ...prev,
                shippingAddress: route.params.selectedAddress,
                location: route.params.selectedAddress.city || prev.location
            }));
            // IMPORTANT: Clear the selectedAddress param so we don't re-trigger this logic
            navigation.setParams({ selectedAddress: null });
            return;
        }

        // 2. Handle initial order creation from ProductDetails
        if (route.params?.product) {
            // Only initialize if we don't have a pending order yet, OR if it's a DIFFERENT product
            const isDifferentProduct = !pendingOrder ||
                (pendingOrder.items[0]?.product?._id !== route.params.product._id &&
                    pendingOrder.items[0]?.product !== route.params.product._id);

            if (isDifferentProduct) {
                console.log('Initializing pending order from product param');
                setPendingOrder({
                    items: [{
                        product: route.params.product,
                        qty: route.params.qty || 1,
                        color: route.params.color || 'Default',
                        size: route.params.size || 'Default',
                        price: route.params.price || route.params.product.price,
                        name: route.params.product.name,
                        image: route.params.product.image,
                        colors: route.params.product.colors || []
                    }],
                    location: route.params.location || 'Nairobi',
                    shippingAddress: route.params.shippingAddress || null
                });
            }
            // Clear the product param once consumed to prevent re-initialization loops
            navigation.setParams({ product: null });
            return;
        }

        // 3. Handle initial order creation from Cart
        if (route.params?.cartItems) {
            console.log('Initializing pending order from cartItems');
            setPendingOrder({
                items: route.params.cartItems.map(item => ({
                    product: item.product?._id || item.product,
                    qty: item.qty,
                    color: item.color,
                    size: item.size,
                    price: item.price,
                    name: item.name,
                    image: item.image,
                    colors: item.product?.colors || []
                })),
                location: user?.addresses?.find(a => a.isDefault)?.city || 'Nairobi',
                shippingAddress: user?.addresses?.find(a => a.isDefault) || user?.addresses?.[0] || null
            });
            // Clear the cartItems param
            navigation.setParams({ cartItems: null });
        }
    }, [route.params?.selectedAddress, route.params?.product, route.params?.cartItems]);

    const { clearCart } = useCart();

    const handlePlaceOrder = async () => {
        if (!pendingOrder || !user) return;

        setPlacingOrder(true);
        try {
            const sa = pendingOrder.shippingAddress || {};
            const shippingAddress = {
                address: sa.street || sa.address || pendingOrder.location || 'N/A',
                city: sa.city || pendingOrder.location || 'N/A',
                postalCode: sa.postalCode || '00100',
                country: sa.country || 'Kenya',
                phone: sa.phone || 'N/A'
            };

            const orderItems = pendingOrder.items.map(item => {
                const variant = item.colors?.find(c => c.name === item.color);
                return {
                    product: item.product,
                    name: item.name,
                    qty: Number(item.qty || 1),
                    image: variant?.image || item.image,
                    price: Number(item.price || 0),
                    color: item.color,
                    size: item.size,
                };
            });

            const itemsPrice = orderItems.reduce((acc, item) => acc + (item.price * item.qty), 0);

            const orderData = {
                orderItems,
                shippingAddress,
                paymentMethod: paymentMethod,
                itemsPrice,
                taxPrice: 0,
                shippingPrice,
                totalPrice: itemsPrice + shippingPrice,
            };

            // Using fetch to bypass potential axios network issues
            console.log('Placing order with fetch...');
            const response = await fetch(`${api.defaults.baseURL}/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify(orderData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to place order');
            }

            // Clear cart if this order came from the cart
            if (route.params?.cartItems) {
                console.log('Clearing cart after successful order');
                clearCart();
            }

            Alert.alert('Success', 'Order placed successfully!', [
                {
                    text: 'OK', onPress: () => {
                        setPendingOrder(null);
                        navigation.setParams({ product: null, cartItems: null });
                        // Refresh orders
                        fetchOrders();
                        setIsRefreshing(true);
                    }
                }
            ]);
        } catch (error) {
            console.error('Order placement error:', error);
            Alert.alert('Error', `Failed to place order: ${error.message}`);
        } finally {
            setPlacingOrder(false);
        }
    };

    const cancelPendingOrder = () => {
        setPendingOrder(null);
        navigation.setParams({ product: null, cartItems: null });
    };

    const fetchOrders = async () => {
        if (!user) return; // Guard clause for extra safety
        try {
            const response = await api.get('/orders/myorders');
            setOrders(response.data);
        } catch (err) {
            console.log('Error fetching orders', err);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Delivered': return COLORS.success;
            case 'Shipped': return '#3498DB';
            case 'Confirmed': return COLORS.accent;
            case 'Pending': return '#F39C12';
            case 'Cancelled': return COLORS.error;
            default: return COLORS.textLight;
        }
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity style={styles.orderCard} activeOpacity={0.7}>
            <View style={styles.orderHeader}>
                <View style={styles.orderMeta}>
                    <Package size={20} color={COLORS.primary} />
                    <Text style={styles.orderId}>Order #{item._id.substring(item._id.length - 6).toUpperCase()}</Text>
                </View>
                <Text style={[styles.status, { color: getStatusColor(item.status) }]}>{item.status}</Text>
            </View>

            <View style={styles.orderBody}>
                <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                <Text style={styles.total}>Kshs {Number(item.totalPrice || 0).toFixed(2)}</Text>
            </View>

            <View style={styles.orderFooter}>
                <Text style={styles.itemCount}>{item.orderItems.length} items</Text>
                <TouchableOpacity
                    style={styles.detailsBtn}
                    onPress={() => navigation.navigate('Profile', {
                        screen: 'OrderDetails',
                        params: { orderId: item._id, isFromAdmin: false }
                    })}
                >
                    <Text style={styles.detailsText}>View Details</Text>
                    <ChevronRight size={16} color={COLORS.accent} />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    if (isLoading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.headerRow}>
                <TouchableOpacity onPress={() => {
                    if (pendingOrder) {
                        cancelPendingOrder();
                    } else {
                        navigation.goBack();
                    }
                }} style={styles.backBtn}>
                    <ChevronLeft color={COLORS.primary} size={22} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{pendingOrder ? 'Confirm Order' : 'My Orders'}</Text>
                {!pendingOrder && (
                    <TouchableOpacity
                        onPress={() => navigation.navigate('Profile', { screen: 'Notifications' })}
                        style={styles.notificationBtn}
                    >
                        <Bell color={COLORS.primary} size={22} />
                        {unreadCount > 0 && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{unreadCount}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                )}
            </View>

            {pendingOrder ? (
                <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
                    <View style={styles.pendingOrderContainer}>
                        <View style={styles.pendingHeader}>
                            <Text style={styles.pendingTitle}>Review Items</Text>
                        </View>
                        {pendingOrder.items.map((item, idx) => (
                            <View key={idx} style={[styles.pendingCard, idx > 0 && { borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 15 }]}>
                                {(() => {
                                    const variant = item.colors?.find(c => c.name === item.color);
                                    return <Image source={{ uri: variant?.image || item.image }} style={styles.pendingImage} />;
                                })()}
                                <View style={styles.pendingInfo}>
                                    <Text style={styles.pendingName} numberOfLines={2}>{item.name}</Text>
                                    <View style={styles.variantContainer}>
                                        <Text style={styles.pendingDetail}>Qty: {item.qty}</Text>
                                        {item.size && item.size !== 'Default' && (
                                            <Text style={styles.pendingVariant}>Size: {item.size}</Text>
                                        )}
                                        {item.color && item.color !== 'Default' && (
                                            <Text style={styles.pendingVariant}>Color: {item.color}</Text>
                                        )}
                                    </View>
                                    <Text style={styles.pendingPrice}>Kshs {(Number(item.price || 0) * Number(item.qty || 1)).toFixed(2)}</Text>
                                </View>
                            </View>
                        ))}

                        <View style={styles.summaryBox}>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Items Price:</Text>
                                <Text style={styles.summaryValue}>Kshs {pendingOrder.items.reduce((acc, i) => acc + (Number(i.price) * Number(i.qty)), 0).toFixed(2)}</Text>
                            </View>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Shipping:</Text>
                                <Text style={styles.summaryValue}>Kshs {shippingPrice.toFixed(2)}</Text>
                            </View>
                            <View style={[styles.summaryRow, styles.totalRow]}>
                                <Text style={styles.totalLabel}>Total:</Text>
                                <Text style={styles.totalValue}>Kshs {(pendingOrder.items.reduce((acc, i) => acc + (Number(i.price) * Number(i.qty)), 0) + shippingPrice).toFixed(2)}</Text>
                            </View>
                        </View>

                        <View style={styles.addressBox}>
                            <View style={styles.addressSectionHeader}>
                                <Text style={styles.sectionTitle}>Shipping Address</Text>
                                <TouchableOpacity onPress={handleAddressSelection}>
                                    <Text style={styles.changeAddressBtn}>Change</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.addressCard}>
                                <Text style={styles.pendingLocation}>📍 {pendingOrder.shippingAddress?.street || pendingOrder.location || 'N/A'}, {pendingOrder.shippingAddress?.city || 'N/A'}</Text>
                                <Text style={styles.pendingLocation}>📞 {pendingOrder.shippingAddress?.phone || 'N/A'}</Text>
                            </View>
                        </View>

                        <Text style={styles.sectionTitle}>Payment Method</Text>
                        <View style={styles.paymentMethods}>
                            {['Cash (Pay on Delivery)', 'M-Pesa', 'Card'].map((method) => (
                                <TouchableOpacity
                                    key={method}
                                    style={[styles.paymentBtn, paymentMethod === method && styles.paymentBtnActive]}
                                    onPress={() => setPaymentMethod(method)}
                                >
                                    <Text style={[styles.paymentText, paymentMethod === method && styles.paymentTextActive]}>{method}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TouchableOpacity
                            style={styles.placeOrderBtn}
                            onPress={handlePlaceOrder}
                            disabled={placingOrder}
                        >
                            {placingOrder ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <>
                                    <Text style={styles.placeOrderText}>Confirm & Place Order</Text>
                                    <Check size={20} color="#fff" style={{ marginLeft: 10 }} />
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            ) : (
                <FlatList
                    data={orders}
                    keyExtractor={(item) => item._id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl refreshing={isRefreshing} onRefresh={() => {
                            setIsRefreshing(true);
                            fetchOrders();
                        }} />
                    }
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Package size={60} color={COLORS.border} />
                            <Text style={styles.emptyText}>You haven't placed any orders yet.</Text>
                        </View>
                    }
                />
            )}
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
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        backgroundColor: COLORS.white,
    },
    backBtn: { padding: 8, marginRight: 8 },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.primary,
        flex: 1,
    },
    notificationBtn: {
        padding: 8,
        position: 'relative',
    },
    badge: {
        position: 'absolute',
        top: 2,
        right: 2,
        backgroundColor: COLORS.error,
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.white,
    },
    badgeText: {
        color: COLORS.white,
        fontSize: 10,
        fontWeight: 'bold',
    },
    list: {
        padding: 15,
    },
    orderCard: {
        backgroundColor: COLORS.white,
        borderRadius: SIZES.radius,
        padding: 15,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    orderMeta: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    orderId: {
        marginLeft: 10,
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    status: {
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    orderBody: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.background,
    },
    date: {
        color: COLORS.textLight,
    },
    total: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    orderFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    itemCount: {
        fontSize: 14,
        color: COLORS.textLight,
    },
    detailsBtn: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    detailsText: {
        color: COLORS.accent,
        fontWeight: '600',
        marginRight: 5,
    },
    empty: {
        alignItems: 'center',
        marginTop: 100,
    },
    emptyText: {
        marginTop: 10,
        color: COLORS.textLight,
    },
    pendingOrderContainer: {
        margin: 15,
        marginBottom: 5,
        padding: 15,
        backgroundColor: COLORS.white,
        borderRadius: SIZES.radius,
        borderWidth: 1,
        borderColor: COLORS.accent,
        shadowColor: COLORS.accent,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    pendingHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    pendingTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.accent,
    },
    pendingCard: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    pendingImage: {
        width: 80,
        height: 80,
        borderRadius: 10,
        backgroundColor: COLORS.background,
    },
    pendingInfo: {
        flex: 1,
        marginLeft: 15,
        justifyContent: 'center',
    },
    pendingName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginBottom: 4,
    },
    pendingDetail: {
        fontSize: 13,
        color: COLORS.textLight,
        marginBottom: 4,
    },
    pendingPrice: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginBottom: 4,
    },
    pendingLocation: {
        fontSize: 12,
        color: COLORS.text,
        fontWeight: '500',
    },
    placeOrderBtn: {
        backgroundColor: COLORS.accent,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 12,
        borderRadius: 10,
    },
    placeOrderText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginBottom: 10,
    },
    paymentMethods: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 20,
    },
    paymentBtn: {
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: COLORS.background,
        marginRight: 10,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    paymentBtnActive: {
        backgroundColor: COLORS.accent,
        borderColor: COLORS.accent,
    },
    paymentText: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.text,
    },
    paymentTextActive: {
        color: COLORS.white,
    },
    summaryBox: {
        backgroundColor: COLORS.background,
        padding: 12,
        borderRadius: 10,
        marginBottom: 15,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
    },
    summaryLabel: {
        fontSize: 14,
        color: COLORS.textLight,
    },
    summaryValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    totalRow: {
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        paddingTop: 8,
        marginTop: 5,
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    totalValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.accent,
    },
    addressBox: {
        marginBottom: 20,
    },
    addressCard: {
        backgroundColor: COLORS.background,
        padding: 10,
        borderRadius: 8,
    },
    variantContainer: {
        marginTop: 4,
        marginBottom: 4,
    },
    pendingVariant: {
        fontSize: 13,
        color: COLORS.textLight,
        fontWeight: '500',
    },
    addressSectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    changeAddressBtn: {
        color: COLORS.accent,
        fontWeight: 'bold',
        fontSize: 13,
    }
});

export default OrdersScreen;
