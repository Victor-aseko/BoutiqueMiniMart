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
    ScrollView,
    Image,
    Alert,
    Modal,
    BackHandler
} from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../services/api';
import { COLORS, SIZES } from '../../theme/theme';
import { Package, ChevronRight, X, Check, Bell, Phone, Truck, Zap, RotateCcw } from 'lucide-react-native';

import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useCart } from '../../context/CartContext';

const OrdersScreen = ({ navigation, route }) => {
    const { user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [fetchingOrders, setFetchingOrders] = useState(false);
    const [pendingOrder, setPendingOrder] = useState(null);
    const [placingOrder, setPlacingOrder] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('Cash (Pay on Delivery)');
    const [shippingPrice, setShippingPrice] = useState(0);
    const [isFromCart, setIsFromCart] = useState(false);
    const [exitModalVisible, setExitModalVisible] = useState(false);
    const [guestUser, setGuestUser] = useState(null);
    const { loginQuietly } = useAuth();
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
            params: {
                returnScreen: 'OrdersScreen',
                // Pass current order data so it's not lost if the screen unmounts in background
                product: route.params?.product || pendingOrder?.items[0]?.product,
                qty: route.params?.qty || pendingOrder?.items[0]?.qty,
                color: route.params?.color || pendingOrder?.items[0]?.color,
                size: route.params?.size || pendingOrder?.items[0]?.size,
                price: route.params?.price || pendingOrder?.items[0]?.price,
                location: route.params?.location || pendingOrder?.location,
                cartItems: route.params?.cartItems,
                isFromCart: route.params?.isFromCart || isFromCart
            }
        });
    };

    // Simplified: No auto-redirect. The UI will handle guest state by showing a login placeholder if no user is found.

    useFocusEffect(
        useCallback(() => {
            fetchOrders();
        }, [user])
    );

    useFocusEffect(
        useCallback(() => {
            const onBackPress = () => {
                if (pendingOrder) {
                    setExitModalVisible(true);
                    return true; // prevent default behavior
                }
                return false;
            };

            const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);

            return () => backHandler.remove();
        }, [pendingOrder])
    );

    useEffect(() => {
        // Recover isFromCart state from params if provided (for recovery after unmount)
        if (route.params?.isFromCart !== undefined && route.params?.isFromCart !== null) {
            setIsFromCart(route.params.isFromCart);
        }

        // 1. Handle incoming address selection (from AddressScreen)
        if (route.params?.selectedAddress && pendingOrder) {
            console.log('Applying selected address to pending order. Guest mode:', !!route.params.guestUser);
            setPendingOrder(prev => ({
                ...prev,
                shippingAddress: route.params.selectedAddress,
                location: route.params.selectedAddress.city || prev.location
            }));
            
            if (route.params.guestUser) {
                setGuestUser(route.params.guestUser);
            }

            // IMPORTANT: Clear params so we don't re-trigger this logic
            navigation.setParams({ selectedAddress: null, guestUser: null });
        }

        // 2. Handle initial order creation from ProductDetails
        if (route.params?.product) {
            // Only initialize if we don't have a pending order yet, OR if it's a DIFFERENT product
            // Explicitly check for route.params.product existence before accessing properties
            const isDifferentProduct = !pendingOrder ||
                (route.params.product?._id && pendingOrder.items[0]?.product?._id !== route.params.product._id);

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
                setIsFromCart(false);
                
                if (route.params.guestUser) {
                    setGuestUser(route.params.guestUser);
                }
            }
            // Clear the product param once consumed to prevent re-initialization loops
            navigation.setParams({ product: null, guestUser: null });
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
            setIsFromCart(true);

            if (route.params.guestUser) {
                setGuestUser(route.params.guestUser);
            }

            navigation.setParams({ cartItems: null, isFromCart: null, guestUser: null });
        }
    }, [route.params?.selectedAddress, route.params?.product, route.params?.cartItems, route.params?.isFromCart, route.params?.guestUser]);

    const { clearCart } = useCart();

    const handlePlaceOrder = async () => {
        if (!pendingOrder || (!user && !guestUser)) {
            Alert.alert('Error', 'Please provide a shipping address and contact details');
            return;
        }

        setPlacingOrder(true);
        try {
            const sa = pendingOrder.shippingAddress || {};
            const shippingAddress = {
                street: sa.street || sa.address || pendingOrder.location || 'N/A',
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
                    ...(user?.token ? { 'Authorization': `Bearer ${user.token}` } : {})
                },
                body: JSON.stringify({
                    ...orderData,
                    guestUser: !user ? guestUser : null
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to place order');
            }

            // Handle Silent Account Creation / Automatic Login
            if (!user && data.auth) {
                console.log('Silent account created. Logging in guest...');
                await loginQuietly(data.auth);
            }

            // Clear cart if this order came from the cart
            if (isFromCart) {
                console.log('Clearing cart after successful order');
                clearCart();
                setIsFromCart(false);
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
        setIsFromCart(false);
        navigation.setParams({ product: null, cartItems: null });
    };

    const fetchOrders = async () => {
        if (!user) {
            setFetchingOrders(false);
            setIsLoading(false);
            return;
        }
        setFetchingOrders(true);
        try {
            const response = await api.get('/orders/myorders');
            setOrders(response.data);
        } catch (err) {
            console.log('Error fetching orders', err);
        } finally {
            setFetchingOrders(false);
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
                <View>
                    <Text style={styles.date}>Ordered: {new Date(item.createdAt).toLocaleDateString()}</Text>
                    {item.isPaid && item.paidAt && (
                        <Text style={[styles.updateTime, { color: COLORS.success }]}>
                            Paid: {new Date(item.paidAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </Text>
                    )}
                    {item.status !== 'Pending' && item.statusUpdatedAt && (
                        <Text style={styles.updateTime}>
                            Status Updated: {new Date(item.statusUpdatedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </Text>
                    )}
                </View>
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
                        setExitModalVisible(true);
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

            {!user && !pendingOrder ? (
                <View style={styles.guestContainer}>
                    <Package size={80} color={COLORS.border} />
                    <Text style={styles.guestTitle}>Your Orders</Text>
                    <Text style={styles.guestSubtitle}>Please login to view your order history and track your deliveries.</Text>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('Auth')}
                        style={styles.guestLoginBtn}
                    >
                        <Text style={styles.guestLoginText}>Login / Register</Text>
                    </TouchableOpacity>
                </View>
            ) : pendingOrder ? (
                <ScrollView contentContainerStyle={{ paddingBottom: 110 }}>
                    <View style={styles.pendingOrderContainer}>
                        <View style={styles.pendingHeader}>
                            <Text style={styles.pendingTitle}>Review Items</Text>
                        </View>
                        {pendingOrder.items.map((item, idx) => (
                            <View key={idx} style={[styles.pendingCard, idx > 0 && { borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 15 }]}>
                                {(() => {
                                    // Robust image selection: variant image -> specific image -> main product image
                                    const variant = item.colors?.find(c => c.name === item.color);
                                    const imgUri = variant?.image || item.image || item.product?.image;
                                    return <Image source={{ uri: imgUri }} style={styles.pendingImage} key={imgUri} />;
                                })()}
                                <View style={styles.pendingInfo}>
                                    <Text style={styles.pendingName} numberOfLines={2}>{item.name}</Text>
                                    <View style={styles.variantContainer}>
                                        <Text style={styles.pendingDetail}>Qty: {item.qty}</Text>
                                        {item.size && item.size !== 'Default' && (
                                            <Text style={styles.pendingVariant}>Size: {typeof item.size === 'string' ? item.size : (item.size?.name || 'Default')}</Text>
                                        )}
                                        {item.color && item.color !== 'Default' && (
                                            <Text style={styles.pendingVariant}>Color: {typeof item.color === 'string' ? item.color : (item.color?.name || 'Default')}</Text>
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

            <Modal
                visible={exitModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setExitModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Leaving Checkout now!</Text>
                        <Text style={styles.modalSubtitle}>Don't miss out on the <Text style={{ color: 'red', fontWeight: 'bold' }}>Affordable Prices & Fast Delivery</Text></Text>

                        <View style={styles.benefitsContainer}>
                            <View style={styles.benefitItem}>
                                <Truck size={24} color={COLORS.accent} />
                                <Text style={styles.benefitText}>Vehicle Shipping</Text>
                            </View>
                            <View style={styles.benefitItem}>
                                <Zap size={24} color={COLORS.accent} />
                                <Text style={styles.benefitText}>Fast Delivery</Text>
                            </View>
                            <View style={styles.benefitItem}>
                                <RotateCcw size={24} color={COLORS.accent} />
                                <Text style={styles.benefitText}>Free Returns</Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[styles.modalBtn, { backgroundColor: COLORS.accent, marginBottom: 12 }]}
                            onPress={() => setExitModalVisible(false)}
                        >
                            <Text style={[styles.modalBtnText, { color: COLORS.white }]}>Continue to Checkout</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.modalBtn, { backgroundColor: 'rgba(174, 172, 172, 0.40)', borderWidth: 1, borderColor: COLORS.border }]}
                            onPress={() => {
                                setExitModalVisible(false);
                                cancelPendingOrder();
                            }}
                        >
                            <Text style={[styles.modalBtnText, { color: COLORS.textLight }]}>Leave Anyway</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={{ marginTop: 20 }}
                            onPress={() => {
                                setExitModalVisible(false);
                                navigation.navigate('Contact');
                            }}
                        >
                            <Text>Any Questions or Issues? <Text style={styles.contactLink}>Contact us</Text></Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
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
        paddingBottom: 110,
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
        fontSize: 12,
    },
    updateTime: {
        fontSize: 11,
        color: COLORS.accent,
        marginTop: 2,
        fontWeight: '500',
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
    },
    guestContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 30,
        backgroundColor: COLORS.background,
    },
    guestTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginTop: 20,
    },
    guestSubtitle: {
        fontSize: 16,
        color: COLORS.textLight,
        textAlign: 'center',
        marginTop: 10,
        marginBottom: 30,
    },
    guestLoginBtn: {
        backgroundColor: COLORS.accent,
        paddingHorizontal: 40,
        paddingVertical: 15,
        borderRadius: 30,
        elevation: 4,
        shadowColor: COLORS.accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    guestLoginText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: 'rgba(255,255,255,0.80)',
        borderRadius: 20,
        padding: 20,
        width: '85%',
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginBottom: 8,
        textAlign: 'center',
    },
    modalSubtitle: {
        fontSize: 14,
        color: COLORS.textLight,
        textAlign: 'center',
        marginBottom: 24,
        paddingHorizontal: 10,
    },
    benefitsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 30,
        paddingHorizontal: 10,
    },
    benefitItem: {
        alignItems: 'center',
        flex: 1,
    },
    benefitText: {
        fontSize: 12,
        color: COLORS.accent,
        marginTop: 8,
        fontWeight: '500',
        textAlign: 'center',
    },
    modalBtn: {
        width: '100%',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalBtnText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    contactLink: {
        color: COLORS.accent,
        fontSize: 14,
        fontWeight: '600',
        textDecorationLine: 'underline',
    },
});

export default OrdersScreen;
