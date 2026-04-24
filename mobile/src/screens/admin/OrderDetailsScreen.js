import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, MapPin, Phone, Mail, CreditCard, Package, CheckCircle, Truck, XCircle, Printer } from 'lucide-react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
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
            Alert.alert('Success', `Order marked as ${newPaidStatus ? 'FULLY PAID' : 'NOT FULLY PAID'}`);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to update payment status');
        } finally {
            setStatusUpdating(false);
        }
    };

    const toggleDepositStatus = async () => {
        setStatusUpdating(true);
        try {
            const newStatus = !order.isDepositPaid;
            const response = await api.put(`/orders/${orderId}/status`, { isDepositPaid: newStatus });
            setOrder(response.data);
            Alert.alert('Success', `Deposit marked as ${newStatus ? 'RECEIVED' : 'NOT RECEIVED'}`);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to update deposit status');
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
                                navigation.navigate('AddReview', {
                                    product: {
                                        ...order.orderItems[0],
                                        _id: order.orderItems[0].product || order.orderItems[0]._id
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

    const handlePrintReceipt = async () => {
        try {
            const html = `
                <html>
                <head>
                    <style>
                        body { 
                            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; 
                            padding: 20px; 
                            color: #333; 
                            max-width: 600px;
                            margin: 0 auto;
                        }
                        .header { 
                            text-align: center; 
                            border-bottom: 2px solid #2C3E50; 
                            padding-bottom: 15px; 
                            margin-bottom: 20px;
                        }
                        .shop-name { 
                            font-size: 28px; 
                            font-weight: bold; 
                            color: #2C3E50; 
                            text-transform: uppercase;
                            letter-spacing: 2px;
                            margin: 0;
                        }
                        .shop-info { font-size: 13px; color: #7f8c8d; margin-top: 5px; }
                        
                        .receipt-title {
                            font-size: 18px;
                            font-weight: bold;
                            margin: 20px 0;
                            text-align: center;
                            text-decoration: underline;
                        }

                        .info-grid { 
                            display: flex; 
                            justify-content: space-between; 
                            margin-bottom: 25px;
                            background: #fdfdfd;
                            padding: 15px;
                            border: 1px solid #eee;
                            border-radius: 8px;
                        }
                        .info-col p { margin: 4px 0; font-size: 14px; }
                        .order-id { color: #e67e22; font-weight: bold; }

                        table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
                        th { 
                            text-align: left; 
                            border-bottom: 2px solid #eee; 
                            padding: 10px 5px; 
                            font-size: 12px; 
                            color: #95a5a6;
                            text-transform: uppercase;
                        }
                        td { padding: 12px 5px; border-bottom: 1px solid #f9f9f9; font-size: 14px; }
                        .item-name { font-weight: 600; color: #2c3e50; }
                        .item-meta { font-size: 11px; color: #95a5a6; display: block; margin-top: 2px; }

                        .totals-container { 
                            margin-left: auto; 
                            width: 60%; 
                            border-top: 1px dashed #ddd;
                            padding-top: 15px;
                        }
                        .total-row { 
                            display: flex; 
                            justify-content: space-between; 
                            padding: 5px 0; 
                            font-size: 14px; 
                        }
                        .grand-total-row { 
                            margin-top: 10px;
                            padding: 12px 0;
                            border-top: 2px solid #2c3e50;
                            font-size: 18px;
                            font-weight: bold;
                        }
                        .paid-label { color: #27ae60; text-transform: uppercase; }
                        .due-label { color: #c0392b; text-transform: uppercase; }

                        .footer { 
                            text-align: center; 
                            margin-top: 40px; 
                            padding-top: 20px;
                            border-top: 1px solid #eee;
                            font-size: 12px; 
                            color: #95a5a6; 
                        }
                        .footer p { margin: 5px 0; }
                        .signature {
                             margin-top: 30px;
                             border-top: 1px solid #ddd;
                             width: 150px;
                             text-align: center;
                             font-style: italic;
                             font-size: 12px;
                             padding-top: 5px;
                        }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1 class="shop-name">MiniBoutique</h1>
                        <div class="shop-info">
                            Premium Fashion & Essentials<br>
                            Tel: +254 759 108 018 / +254 723 281 004
                        </div>
                    </div>

                    <div class="receipt-title">OFFICIAL INVOICE / RECEIPT</div>

                    <div class="info-grid">
                        <div class="info-col">
                            <p><strong>Billed To:</strong></p>
                            <p>${order.user?.name || order.guestUser?.name || 'Valued Customer'}</p>
                            <p>${order.shippingAddress?.phone || order.guestUser?.phone || 'N/A'}</p>
                            <p>${order.shippingAddress?.address || 'N/A'}, ${order.shippingAddress?.city || 'N/A'}</p>
                        </div>
                        <div class="info-col" style="text-align: right;">
                            <p><strong>Order ID:</strong> <span class="order-id">#${order._id.toString().toUpperCase()}</span></p>
                            <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
                            <p><strong>Method:</strong> ${order.paymentMethod}</p>
                            <p><strong>Status:</strong> ${order.status}</p>
                        </div>
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th>Item Description</th>
                                <th style="text-align: center;">Qty</th>
                                <th style="text-align: right;">Price</th>
                                <th style="text-align: right;">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${order.orderItems.map(item => `
                                <tr>
                                    <td>
                                        <span class="item-name">${item.name}</span>
                                        <span class="item-meta">Color: ${item.color || 'Default'} | Size: ${item.size || 'Default'}</span>
                                    </td>
                                    <td style="text-align: center;">${item.qty}</td>
                                    <td style="text-align: right;">${item.price.toFixed(2)}</td>
                                    <td style="text-align: right;">${(item.qty * item.price).toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>

                    <div class="totals-container">
                        <div class="total-row">
                            <span>Subtotal:</span>
                            <span>Kshs ${order.itemsPrice.toFixed(2)}</span>
                        </div>
                        <div class="total-row">
                            <span>Shipping Fee:</span>
                            <span>Kshs ${order.shippingPrice.toFixed(2)}</span>
                        </div>
                        
                        ${order.depositAmount ? `
                            <div class="total-row" style="color: ${order.isDepositPaid ? '#27ae60' : '#e67e22'}">
                                <span>Deposit ${order.isDepositPaid ? 'Paid' : 'Required'}:</span>
                                <span>${order.isDepositPaid ? '-' : ''} Kshs ${order.depositAmount.toFixed(2)}</span>
                            </div>
                        ` : ''}

                        <div class="grand-total-row">
                            <span class="${order.isPaid ? 'paid-label' : 'due-label'}">
                                ${order.isPaid ? 'PAID IN FULL' : (order.isDepositPaid ? 'BALANCE DUE' : 'TOTAL DUE')}
                            </span>
                            <span>Kshs ${order.isPaid ? order.totalPrice.toFixed(2) : (order.totalPrice - (order.isDepositPaid ? order.depositAmount : 0)).toFixed(2)}</span>
                        </div>
                    </div>

                    <div style="margin-top: 20px; padding: 10px; background: #f9f9f9; border-radius: 5px; font-size: 11px; color: #7f8c8d;">                        
                        ${order.depositPaidAt ? `<p style="margin: 2px 0;">• Deposit Paid On: ${new Date(order.depositPaidAt).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' })}</p>` : ''}
                        ${order.paidAt ? `<p style="margin: 2px 0;">• Balance Cleared On: ${new Date(order.paidAt).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' })}</p>` : ''}
                    </div>

                    <div style="margin-top: 30px; display: flex; justify-content: space-between;">
                        <div class="signature">Authorized Signature</div>
                        <div style="font-size: 10px; color: #95a5a6; vertical-align: bottom; text-align: right;">
                            Invoice Generated: ${new Date().toLocaleString()}
                        </div>
                    </div>

                    <div class="footer">
                        <p><strong>Thank you for shopping at MiniBoutique Shop!</strong></p>
                        <p>Goods returned within 2 days are eligible for exchange.</p>
                        <p>www.miniboutique.co.ke</p>
                    </div>
                </body>
                </html>
            `;

            const { uri } = await Print.printToFileAsync({ html });
            console.log('File has been saved to:', uri);
            await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
        } catch (error) {
            console.error('Print Error:', error);
            Alert.alert('Error', 'Could not generate receipt');
        }
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
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {(order.isDepositPaid || order.isPaid || ['Confirmed', 'Processing', 'Shipped', 'Delivered'].includes(order.status)) && (
                        <TouchableOpacity onPress={handlePrintReceipt} style={{ marginRight: 15 }}>
                            <Printer size={22} color={COLORS.accent} />
                        </TouchableOpacity>
                    )}
                    {isFromAdmin && (
                        <TouchableOpacity onPress={() => setStatusModalVisible(true)}>
                            <Text style={styles.editBtn}>Edit</Text>
                        </TouchableOpacity>
                    )}
                </View>
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
                                        navigation.navigate('AddReview', {
                                            product: {
                                                ...order.orderItems[0],
                                                _id: order.orderItems[0].product || order.orderItems[0]._id
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
                        <Text style={styles.label}>Date Created:</Text>
                        <Text style={styles.value}>{new Date(order.createdAt).toLocaleString()}</Text>
                    </View>
                    {((!isFromAdmin && order.status !== 'Pending') || (isFromAdmin && order.status === 'Delivered')) && order.statusUpdatedAt && (
                        <View style={styles.row}>
                            <Text style={styles.label}>Status Last Updated:</Text>
                            <Text style={[styles.value, { color: COLORS.accent }]}>
                                {new Date(order.statusUpdatedAt).toLocaleString()}
                            </Text>
                        </View>
                    )}
                    {isFromAdmin && (
                        <View style={styles.row}>
                            <Text style={styles.label}>Customer:</Text>
                            <Text style={styles.value}>
                                {order.user?.name || order.guestUser?.name || 'Guest User'}
                                {order.user?.email ? ` (${order.user.email})` : ''}
                            </Text>
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
                            <View style={{ flexDirection: 'row' }}>
                                <TouchableOpacity
                                    style={[styles.miniBtn, { backgroundColor: order.isDepositPaid ? COLORS.success : COLORS.error, marginRight: 8 }]}
                                    onPress={() => {
                                        Alert.alert(
                                            'Update Deposit',
                                            `Mark deposit as ${order.isDepositPaid ? 'NOT RECEIVED' : 'RECEIVED'}?`,
                                            [
                                                { text: 'Cancel', style: 'cancel' },
                                                { text: 'Yes, Update', onPress: toggleDepositStatus }
                                            ]
                                        );
                                    }}
                                >
                                    <Text style={styles.miniBtnText}>{order.isDepositPaid ? 'Deposit ✅' : 'Mark Deposit'}</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.miniBtn, { backgroundColor: order.isPaid ? COLORS.success : COLORS.error }]}
                                    onPress={() => {
                                        Alert.alert(
                                            'Update Full Payment',
                                            `Mark as ${order.isPaid ? 'UNPAID' : 'FULLY PAID'}?`,
                                            [
                                                { text: 'Cancel', style: 'cancel' },
                                                { text: 'Yes, Update', onPress: togglePaidStatus }
                                            ]
                                        );
                                    }}
                                >
                                    <Text style={styles.miniBtnText}>{order.isPaid ? 'Fully Paid ✅' : 'Mark Paid'}</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                    <View style={styles.iconRow}>
                        <CreditCard size={18} color={COLORS.textLight} />
                        <Text style={styles.iconText}>{order.paymentMethod}</Text>
                    </View>
                    <View style={[styles.iconRow, { marginTop: 4 }]}>
                        <View style={{ flexDirection: 'column', width: '100%' }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                                <Text style={styles.label}>Order Total:</Text>
                                <Text style={[styles.label, { fontWeight: 'bold' }]}>Kshs {Number(order.totalPrice || 0).toFixed(2)}</Text>
                            </View>

                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                                <Text style={[styles.label, { color: order.isDepositPaid ? COLORS.success : COLORS.error }]}>
                                    Deposit ({order.isDepositPaid ? 'Paid' : 'Required'}):
                                </Text>
                                <Text style={[styles.label, { color: order.isDepositPaid ? COLORS.success : COLORS.error, fontWeight: 'bold' }]}>
                                    {order.isDepositPaid ? '-' : ''} Kshs {Number(order.depositAmount || 0).toFixed(2)}
                                </Text>
                            </View>

                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 4, marginTop: 4 }}>
                                <Text style={[styles.label, { fontWeight: 'bold', color: order.isPaid ? COLORS.success : COLORS.primary }]}>
                                    {order.isPaid ? 'Paid in Full:' : 'Balance Due on Delivery:'}
                                </Text>
                                <Text style={[styles.label, { fontWeight: 'bold', color: order.isPaid ? COLORS.success : COLORS.primary, fontSize: 16 }]}>
                                    Kshs {order.isPaid ? Number(order.totalPrice || 0).toFixed(2) : (Number(order.totalPrice || 0) - (order.isDepositPaid ? Number(order.depositAmount || 0) : 0)).toFixed(2)}
                                </Text>
                            </View>
                        </View>
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
                                        {item.color ? `Color: ${typeof item.color === 'string' ? item.color : (item.color?.name || 'Default')}` : ''}
                                        {item.color && item.size ? ' | ' : ''}
                                        {item.size ? `Size: ${typeof item.size === 'string' ? item.size : (item.size?.name || 'Default')}` : ''}
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
