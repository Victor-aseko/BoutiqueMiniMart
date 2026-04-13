import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, FlatList, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Calendar, TrendingUp, DollarSign, ShoppingBag, Eye, Filter } from 'lucide-react-native';
import api from '../../services/api';
import { COLORS } from '../../theme/theme';
import MyInput from '../../components/MyInput';

const AdminAnalyticsScreen = ({ navigation }) => {
    const [loading, setLoading] = useState(true);
    const [analytics, setAnalytics] = useState(null);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const params = {};
            if (startDate) params.startDate = startDate;
            if (endDate) params.endDate = endDate;

            const { data } = await api.get('/orders/analytics', { params });
            setAnalytics(data);
        } catch (error) {
            console.error('Fetch analytics error:', error);
        } finally {
            setLoading(false);
        }
    };

    const StatCard = ({ title, value, icon: Icon, color }) => (
        <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: color + '15' }]}>
                <Icon size={24} color={color} />
            </View>
            <View style={styles.statTextContainer}>
                <Text style={styles.statTitle}>{title}</Text>
                <Text style={styles.statValue}>{value}</Text>
            </View>
        </View>
    );

    const ProductStatItem = ({ item, count, icon: Icon, iconColor }) => (
        <View style={styles.productStatItem}>
            <Image source={{ uri: item.image }} style={styles.productThumb} />
            <View style={styles.productStatInfo}>
                <Text style={styles.productStatName} numberOfLines={1}>{item.name}</Text>
                <View style={styles.productStatCountRow}>
                    <Icon size={14} color={iconColor} style={{ marginRight: 4 }} />
                    <Text style={styles.productStatCount}>{count}</Text>
                </View>
            </View>
        </View>
    );

    if (loading && !analytics) {
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
                <Text style={styles.headerTitle}>Sales Analytics</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Date Filter */}
                <View style={styles.filterSection}>
                    <View style={styles.filterHeader}>
                        <Filter size={18} color={COLORS.primary} />
                        <Text style={styles.filterTitle}>Filter by Date Range</Text>
                    </View>
                    <View style={styles.filterRow}>
                        <View style={{ flex: 1, marginRight: 10 }}>
                            <MyInput
                                placeholder="YYYY-MM-DD"
                                value={startDate}
                                onChangeText={setStartDate}
                                label="Start Date"
                                icon={Calendar}
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <MyInput
                                placeholder="YYYY-MM-DD"
                                value={endDate}
                                onChangeText={setEndDate}
                                label="End Date"
                                icon={Calendar}
                            />
                        </View>
                    </View>
                    <TouchableOpacity style={styles.applyBtn} onPress={fetchAnalytics}>
                        <Text style={styles.applyBtnText}>Apply Filter</Text>
                    </TouchableOpacity>
                </View>

                {/* Summary Stats */}
                <View style={styles.statsRow}>
                    <StatCard 
                        title="Total Revenue" 
                        value={`Kshs ${analytics?.totalRevenue.toLocaleString()}`} 
                        icon={DollarSign} 
                        color="#4CAF50" 
                    />
                    <StatCard 
                        title="Total Orders" 
                        value={analytics?.totalSales} 
                        icon={ShoppingBag} 
                        color="#2196F3" 
                    />
                </View>

                {/* Top Products Sections */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <TrendingUp size={20} color={COLORS.accent} />
                        <Text style={styles.sectionTitle}>Top Selling Products</Text>
                    </View>
                    <View style={styles.statsList}>
                        {analytics?.topProductsBySales.map((item) => (
                            <ProductStatItem 
                                key={item._id} 
                                item={item} 
                                count={`${item.ordersCount} sold`} 
                                icon={ShoppingBag} 
                                iconColor={COLORS.accent}
                            />
                        ))}
                    </View>
                </View>

                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Eye size={20} color={COLORS.primary} />
                        <Text style={styles.sectionTitle}>Most Viewed Products</Text>
                    </View>
                    <View style={styles.statsList}>
                        {analytics?.topProductsByViews.map((item) => (
                            <ProductStatItem 
                                key={item._id} 
                                item={item} 
                                count={`${item.views} views`} 
                                icon={Eye} 
                                iconColor={COLORS.primary}
                            />
                        ))}
                    </View>
                </View>

                {/* Sales Records */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Sales Record ({analytics?.orders.length})</Text>
                    <View style={styles.recordList}>
                        {analytics?.orders.map((order) => (
                            <View key={order._id} style={styles.recordItem}>
                                <View>
                                    <Text style={styles.recordId}>Order #{order._id.slice(-6).toUpperCase()}</Text>
                                    <Text style={styles.recordDate}>{new Date(order.createdAt).toLocaleDateString()}</Text>
                                    <Text style={styles.recordUser}>{order.user?.name || 'Guest'}</Text>
                                </View>
                                <Text style={styles.recordAmount}>Kshs {order.totalPrice.toFixed(2)}</Text>
                            </View>
                        ))}
                    </View>
                </View>
                
                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.primary },
    scrollContent: { padding: 16 },
    filterSection: {
        backgroundColor: COLORS.white,
        padding: 16,
        borderRadius: 15,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    filterHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    filterTitle: { marginLeft: 8, fontSize: 16, fontWeight: 'bold', color: COLORS.primary },
    filterRow: { flexDirection: 'row' },
    applyBtn: {
        backgroundColor: COLORS.primary,
        paddingVertical: 12,
        borderRadius: 10,
        marginTop: 10,
        alignItems: 'center',
    },
    applyBtnText: { color: COLORS.white, fontWeight: 'bold', fontSize: 14 },
    statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    statCard: {
        width: '48%',
        backgroundColor: COLORS.white,
        padding: 15,
        borderRadius: 15,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    statIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    statTextContainer: { flex: 1 },
    statTitle: { fontSize: 12, color: COLORS.textLight, marginBottom: 2 },
    statValue: { fontSize: 13, fontWeight: 'bold', color: COLORS.primary },
    section: { marginBottom: 25 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    sectionTitle: { marginLeft: 8, fontSize: 16, fontWeight: 'bold', color: COLORS.primary },
    statsList: {
        backgroundColor: COLORS.white,
        borderRadius: 15,
        padding: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    productStatItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.background,
    },
    productThumb: { width: 40, height: 40, borderRadius: 8, marginRight: 12 },
    productStatInfo: { flex: 1 },
    productStatName: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
    productStatCountRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
    productStatCount: { fontSize: 12, color: COLORS.textLight, fontWeight: '600' },
    recordList: {
        backgroundColor: COLORS.white,
        borderRadius: 15,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    recordItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    recordId: { fontSize: 14, fontWeight: 'bold', color: COLORS.primary },
    recordDate: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
    recordUser: { fontSize: 12, color: COLORS.accent, fontWeight: '600', marginTop: 1 },
    recordAmount: { fontSize: 14, fontWeight: 'bold', color: COLORS.primary },
});

export default AdminAnalyticsScreen;
