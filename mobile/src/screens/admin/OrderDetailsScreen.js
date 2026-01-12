import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, MapPin, Phone, Mail, CreditCard, Package, CheckCircle, Truck, XCircle } from 'lucide-react-native';
import api from '../../services/api';
import { COLORS, SIZES } from '../../theme/theme';
import MyButton from '../../components/MyButton';

const OrderDetailsScreen = ({ navigation, route }) => {
    const { orderId, isFromAdmin } = route.params;
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [statusUpdating, setStatusUpdating] = useState(false);
    const [statusModalVisible, setStatusModalVisible] = useState(false);

    useEffect(() => {
        fetchOrderDetails();
    }, [orderId]);

    const fetchOrderDetails = async () => {
        try {
            const response = await api.get(`/orders/${orderId}`);
            setOrder(response.data);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to load order details');
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (newStatus) => {
        setStatusModalVisible(false);
        setStatusUpdating(true);
        try {
            const response = await api.put(`/orders/${orderId}/status`, { status: newStatus });
            if (newStatus === 'Cancelled') {
                Alert.alert('Removed', 'Order has been cancelled and removed successfully', [
                    { text: 'OK', onPress: () => navigation.goBack() }
                ]);
            } else {
                setOrder(response.data);
                Alert.alert('Success', `Order status updated to ${newStatus}`);
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to update order status');
        } finally {
            setStatusUpdating(false);
        }
    };

    const togglePaidStatus = async () => {
        setStatusUpdating(true);
        try {
            const newPaidStatus = !order.isPaid;
            const response = await api.put(`/orders/${orderId}/status`, { isPaid: newPaidStatus });
            setOrder(response.data);
            Alert.alert('Success', `Order marked as ${newPaidStatus ? 'PAID' : 'NOT PAID'}`);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to update payment status');
        } finally {
            setStatusUpdating(false);
        }
    };

    const markAsReceived = async () => {
        setStatusUpdating(true);
        try {
            const response = await api.put(`/orders/${orderId}/deliver`);
            setOrder(response.data);
            Alert.alert(
                'Order Delivered',
                'Thank you for confirming! Would you like to share your experience by reviewing the products?',
                [
                    { text: 'Not Now', style: 'cancel' },
                    {
                        text: 'Review Products',
                        onPress: () => {
                            // If order has multiple items, it might be better to go to a list,
                            // but for now let's go to the first item's review page
                            if (order.orderItems?.length > 0) {
                                navigation.navigate('MainTabs', {
                                    screen: 'HomeTab',
                                    params: {
                                        screen: 'AddReview',
                                        params: {
                                            product: {
                                                ...order.orderItems[0],
                                                _id: order.orderItems[0].product || order.orderItems[0]._id
                                            }
                                        }
                                    }
                                });
                            }
                        }
                    }
                ]
            );
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to update order status');
        } finally {
            setStatusUpdating(false);
        }
    };

    const handleCancelOrder = () => {
        Alert.alert(
            'Delete Order',
            'Are you sure you want to delete this order? This action cannot be undone.',
            [
                { text: 'No', style: 'cancel' },
                {
                    text: 'Yes, Delete',
                    onPress: async () => {
                        setStatusUpdating(true);
                        try {
                            await api.put(`/orders/${orderId}/cancel`);
                            Alert.alert('Success', 'Order has been deleted', [
                                {
                                    text: 'OK',
                                    onPress: () => {
                                        if (isFromAdmin) {
                                            navigation.goBack();
                                        } else {
                                            navigation.navigate('Orders', { screen: 'OrdersScreen' });
                                        }
                                    }
                                }
                            ]);
                        } catch (error) {
                            console.error(error);
                            const msg = error.response?.data?.message || 'Failed to delete order';
                            Alert.alert('Error', msg);
                        } finally {
                            setStatusUpdating(false);
                        }
                    }
                }
            ]
        );
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Delivered': return COLORS.success;
            case 'Shipped': return '#3498DB';
            case 'Processing': return '#9B59B6';
            case 'Confirmed': return COLORS.accent;
            case 'Pending': return '#F39C12';
            case 'Cancelled': return COLORS.error;
            default: return COLORS.textLight;
        }
    };

    if (loading || !order) {
        return (
            <SafeAreaView style={styles.centered}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => {
                        if (isFromAdmin) {
                            navigation.goBack();
                        } else {
                            // Ensure we go back to My Orders, not anywhere else in history
                            // Start by jumping to the 'Orders' tab in the Drawer
                            navigation.navigate('Orders', { screen: 'OrdersScreen' });
                        }
                    }}
                    style={styles.backBtn}
                >
                    <ChevronLeft color={COLORS.primary} size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Order Details</Text>
                {isFromAdmin ? (
                    <TouchableOpacity onPress={() => setStatusModalVisible(true)}>
                        <Text style={styles.editBtn}>Edit Status</Text>
                    </TouchableOpacity>
                ) : <View style={{ width: 24 }} />}
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Status Banner */}
                <View style={[styles.statusBanner, { backgroundColor: getStatusColor(order.status) + '20' }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <Text style={[styles.statusBannerText, { color: getStatusColor(order.status) }]}>
                            Status: {order.status}
                        </Text>
                        {!isFromAdmin && order.status === 'Shipped' && (
                            <TouchableOpacity
                                style={[styles.miniBtn, { backgroundColor: COLORS.success }]}
                                onPress={() => {
                                    Alert.alert(
                                        'Confirm Delivery',
                                        'Have you received your package?',
                                        [
                                            { text: 'No', style: 'cancel' },
                                            { text: 'Yes, I received it', onPress: markAsReceived }
                                        ]
                                    );
                                }}
                            >
                                <Text style={styles.miniBtnText}>Mark as Received</Text>
                            </TouchableOpacity>
                        )}
                        {!isFromAdmin && order.status === 'Delivered' && (
                            <TouchableOpacity
                                style={[styles.miniBtn, { backgroundColor: COLORS.accent }]}
                                onPress={() => {
                                    if (order.orderItems?.length > 0) {
                                        navigation.navigate('MainTabs', {
                                            screen: 'HomeTab',
                                            params: {
                                                screen: 'AddReview',
                                                params: {
                                                    product: {
                                                        ...order.orderItems[0],
                                                        _id: order.orderItems[0].product || order.orderItems[0]._id
                                                    }
                                                }
                                            }
                                        });
                                    }
                                }}
                            >
                                <Text style={styles.miniBtnText}>Share Experience</Text>
                            </TouchableOpacity>
                        )}
                        {!isFromAdmin && order.status === 'Pending' && (
                            <TouchableOpacity
                                style={[styles.miniBtn, { backgroundColor: COLORS.error }]}
                                onPress={handleCancelOrder}
                            >
                                <Text style={styles.miniBtnText}>Cancel Order</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Order Meta */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Order Information</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>Order ID:</Text>
                        <Text style={styles.value}>#{order._id}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Date:</Text>
                        <Text style={styles.value}>{new Date(order.createdAt).toLocaleString()}</Text>
                    </View>
                    {isFromAdmin && (
                        <View style={styles.row}>
                            <Text style={styles.label}>Customer:</Text>
                            <Text style={styles.value}>{order.user?.name} ({order.user?.email})</Text>
                        </View>
                    )}
                </View>

                {/* Shipping Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Shipping Details</Text>
                    <View style={styles.iconRow}>
                        <MapPin size={18} color={COLORS.textLight} />
                        <Text style={styles.iconText}>
                            {order.shippingAddress.address}, {order.shippingAddress.city}, {order.shippingAddress.country}
                        </Text>
                    </View>
                    <View style={styles.iconRow}>
                        <Phone size={18} color={COLORS.textLight} />
                        <Text style={styles.iconText}>{order.shippingAddress?.phone || 'N/A'}</Text>
                    </View>
                </View>

                {/* Payment Info */}
                <View style={styles.section}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <Text style={styles.sectionTitleNoMargin}>Payment</Text>
                        {isFromAdmin && (
                            <TouchableOpacity
                                style={[styles.miniBtn, { backgroundColor: order.isPaid ? COLORS.error : COLORS.success }]}
                                onPress={() => {
                                    Alert.alert(
                                        'Update Payment',
                                        `Mark this order as ${order.isPaid ? 'UNPAID' : 'PAID'}?`,
                                        [
                                            { text: 'Cancel', style: 'cancel' },
                                            { text: 'Yes, Update', onPress: togglePaidStatus }
                                        ]
                                    );
                                }}
                            >
                                <Text style={styles.miniBtnText}>{order.isPaid ? 'Mark Unpaid' : 'Mark Paid'}</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                    <View style={styles.iconRow}>
                        <CreditCard size={18} color={COLORS.textLight} />
                        <Text style={styles.iconText}>{order.paymentMethod}</Text>
                    </View>
                    <View style={[styles.iconRow, { marginTop: 4 }]}>
                        <Text style={[styles.label, { color: order.isPaid ? COLORS.success : COLORS.error, fontWeight: 'bold' }]}>
                            {order.isPaid ? 'PAID' : 'NOT PAID'}
                        </Text>
                        {order.paidAt && (
                            <Text style={[styles.iconText, { fontSize: 12, color: COLORS.textLight }]}>
                                {new Date(order.paidAt).toLocaleDateString()}
                            </Text>
                        )}
                    </View>
                </View>

                {/* Order Items */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Items ({order.orderItems.length})</Text>
                    {order.orderItems.map((item, index) => (
                        <View key={index} style={styles.itemCard}>
                            <Image source={{ uri: item.image }} style={styles.itemImage} />
                            <View style={styles.itemDetails}>
                                <Text style={styles.itemName}>{item.name}</Text>
                                <Text style={styles.itemSub}>Qty: {item.qty}  x  Kshs {item.price}</Text>
                                {(item.color || item.size) && (
                                    <Text style={styles.itemVariant}>
                                        {item.color ? `Color: ${item.color}` : ''}
                                        {item.color && item.size ? ' | ' : ''}
                                        {item.size ? `Size: ${item.size}` : ''}
                                    </Text>
                                )}
                            </View>
                            <Text style={styles.itemTotal}>Kshs {(Number(item.qty || 0) * Number(item.price || 0)).toFixed(2)}</Text>
                        </View>
                    ))}
                </View>

                {/* Summary */}
                <View style={styles.summarySection}>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Subtotal</Text>
                        <Text style={styles.summaryValue}>Kshs {Number(order.itemsPrice || order.orderItems.reduce((acc, item) => acc + (item.qty * item.price), 0)).toFixed(2)}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Shipping</Text>
                        <Text style={styles.summaryValue}>Kshs {Number(order.shippingPrice || 0).toFixed(2)}</Text>
                    </View>
                    <View style={[styles.summaryRow, styles.totalRow]}>
                        <Text style={styles.totalLabel}>Total</Text>
                        <Text style={styles.totalValue}>Kshs {Number(order.totalPrice || 0).toFixed(2)}</Text>
                    </View>
                </View>
            </ScrollView>

            <Modal
                transparent={true}
                visible={statusModalVisible}
                animationType="slide"
                onRequestClose={() => setStatusModalVisible(false)}
            >
                <TouchableOpacity style={styles.modalOverlay} onPress={() => setStatusModalVisible(false)} activeOpacity={1}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Update Order Status</Text>
                        {['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map((status) => (
                            <TouchableOpacity
                                key={status}
                                style={styles.statusOption}
                                onPress={() => updateStatus(status)}
                            >
                                <Text style={[styles.statusOptionText, { color: getStatusColor(status) }]}>{status}</Text>
                                {order.status === status && <CheckCircle size={20} color={getStatusColor(status)} />}
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: COLORS.white,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    editBtn: {
        color: COLORS.accent,
        fontWeight: 'bold',
    },
    content: {
        padding: 16,
    },
    statusBanner: {
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    statusBannerText: {
        fontWeight: 'bold',
        fontSize: 16,
        textTransform: 'uppercase',
    },
    section: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.background,
        paddingBottom: 8,
    },
    sectionTitleNoMargin: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    miniBtn: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 4,
    },
    miniBtnText: {
        color: COLORS.white,
        fontSize: 12,
        fontWeight: 'bold',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    label: {
        color: COLORS.textLight,
        fontSize: 14,
    },
    value: {
        color: COLORS.text,
        fontSize: 14,
        fontWeight: '500',
        flex: 1,
        textAlign: 'right',
        marginLeft: 16,
    },
    iconRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    iconText: {
        marginLeft: 10,
        color: COLORS.text,
        fontSize: 14,
        flex: 1,
    },
    itemCard: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    itemImage: {
        width: 50,
        height: 50,
        borderRadius: 8,
        backgroundColor: COLORS.background,
    },
    itemDetails: {
        flex: 1,
        marginLeft: 12,
    },
    itemName: {
        color: COLORS.primary,
        fontWeight: '600',
        fontSize: 14,
    },
    itemSub: {
        color: COLORS.textLight,
        fontSize: 12,
        marginTop: 2,
    },
    itemTotal: {
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    itemVariant: {
        fontSize: 12,
        color: COLORS.textLight,
        marginTop: 1,
    },
    summarySection: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 16,
        marginBottom: 30,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    summaryLabel: {
        color: COLORS.textLight,
    },
    summaryValue: {
        color: COLORS.primary,
        fontWeight: '600',
    },
    totalRow: {
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    totalLabel: {
        fontWeight: 'bold',
        fontSize: 16,
        color: COLORS.primary,
    },
    totalValue: {
        fontWeight: 'bold',
        fontSize: 18,
        color: COLORS.accent,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginBottom: 16,
        textAlign: 'center',
    },
    statusOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.background,
    },
    statusOptionText: {
        fontSize: 16,
        fontWeight: '500',
    }
});

export default OrderDetailsScreen;
