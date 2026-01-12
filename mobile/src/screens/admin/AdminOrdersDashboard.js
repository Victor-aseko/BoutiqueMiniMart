import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert, RefreshControl, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Package, User, MapPin, DollarSign, Clock, Bell, Phone } from 'lucide-react-native';
import api from '../../services/api';
import { COLORS, SIZES } from '../../theme/theme';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

const AdminOrdersDashboard = ({ navigation }) => {
    const { user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const { unreadCount } = useNotifications();

    useFocusEffect(
        useCallback(() => {
            fetchOrders();
        }, [])
    );

    const fetchOrders = async () => {
        try {
            const response = await api.get('/orders');
            // Provide desc sorting locally as API might not sort
            setOrders(response.data.reverse());
        } catch (error) {
            console.error('Fetch orders error:', error);
            Alert.alert('Error', 'Failed to fetch orders');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchOrders();
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

    const renderOrderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.orderCard}
            onPress={() => navigation.navigate('OrderDetails', { orderId: item._id, isFromAdmin: true })}
        >
            <View style={styles.cardHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Package size={20} color={COLORS.primary} style={{ marginRight: 8 }} />
                    <Text style={styles.orderId}>#{item._id.substring(item._id.length - 6).toUpperCase()}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
                </View>
            </View>

            <View style={styles.cardBody}>
                <View style={styles.infoRow}>
                    <User size={14} color={COLORS.textLight} />
                    <Text style={styles.infoText}>{item.user?.name || 'Unknown User'}</Text>
                </View>
                <View style={styles.infoRow}>
                    <MapPin size={14} color={COLORS.textLight} />
                    <Text style={styles.infoText} numberOfLines={1}>
                        {item.shippingAddress.address}, {item.shippingAddress.city}
                    </Text>
                </View>
                <View style={styles.infoRow}>
                    <Clock size={14} color={COLORS.textLight} />
                    <Text style={styles.infoText}>{new Date(item.createdAt).toLocaleString()}</Text>
                </View>
                {item.shippingAddress?.phone && (
                    <View style={styles.infoRow}>
                        <Phone size={14} color={COLORS.textLight} />
                        <Text style={styles.infoText}>{item.shippingAddress.phone}</Text>
                    </View>
                )}
            </View>

            <View style={styles.cardFooter}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.itemsCount}>{item.orderItems.length} Items</Text>
                    <Text style={[styles.infoText, { fontSize: 11, marginLeft: 0 }]}>
                        Sub: Ksh {Number(item.itemsPrice || (item.totalPrice - (item.shippingPrice || 0))).toFixed(0)} | Ship: Ksh {Number(item.shippingPrice || 0).toFixed(0)}
                    </Text>
                </View>
                <Text style={styles.totalPrice}>Kshs {Number(item.totalPrice || 0).toFixed(2)}</Text>
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.centered}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ChevronLeft color={COLORS.primary} size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Admin Dashboard</Text>
                <TouchableOpacity
                    onPress={() => navigation.navigate('Notifications')}
                    style={styles.notificationBtn}
                >
                    <Bell color={COLORS.primary} size={22} />
                    {unreadCount > 0 && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{unreadCount}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            <FlatList
                data={orders}
                keyExtractor={item => item._id}
                renderItem={renderOrderItem}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Package size={64} color={COLORS.border} />
                        <Text style={styles.emptyText}>No orders received yet.</Text>
                    </View>
                }
            />
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
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    backBtn: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.primary,
        flex: 1,
        textAlign: 'center',
    },
    notificationBtn: {
        padding: 4,
        position: 'relative',
    },
    badge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: COLORS.error,
        minWidth: 16,
        height: 16,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.white,
    },
    badgeText: {
        color: COLORS.white,
        fontSize: 9,
        fontWeight: 'bold',
    },
    listContent: {
        padding: 16,
    },
    orderCard: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    orderId: {
        fontWeight: 'bold',
        fontSize: 16,
        color: COLORS.primary,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    statusText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    cardBody: {
        marginBottom: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.background,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    infoText: {
        marginLeft: 8,
        color: COLORS.text,
        fontSize: 14,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    itemsCount: {
        color: COLORS.textLight,
        fontSize: 14,
    },
    totalPrice: {
        fontWeight: 'bold',
        fontSize: 16,
        color: COLORS.accent,
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 64,
    },
    emptyText: {
        marginTop: 16,
        color: COLORS.textLight,
        fontSize: 16,
    }
});

export default AdminOrdersDashboard;
