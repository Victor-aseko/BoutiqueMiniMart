import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, FlatList, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, Calendar, TrendingUp, DollarSign, ShoppingBag, Eye, Filter, Package, BarChart2, PieChart as PieChartIcon, Clock } from 'lucide-react-native';
import { BarChart, PieChart } from 'react-native-chart-kit';
import dayjs from 'dayjs';
import api from '../../services/api';
import { COLORS } from '../../theme/theme';
import MyInput from '../../components/MyInput';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { cacheDirectory, writeAsStringAsync } from 'expo-file-system/legacy';
import { Download, FileText } from 'lucide-react-native';

const screenWidth = Dimensions.get('window').width;

const AdminAnalyticsScreen = ({ navigation }) => {
    const [loading, setLoading] = useState(true);
    const [analytics, setAnalytics] = useState(null);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [page, setPage] = useState(1);
    const [exportLoading, setExportLoading] = useState(false);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async (s = startDate, e = endDate, p = page) => {
        try {
            setLoading(true);
            const params = { page: p, limit: 10 };
            if (s) params.startDate = s;
            if (e) params.endDate = e;

            const { data } = await api.get('/orders/analytics', { params });
            setAnalytics(data);
        } catch (error) {
            console.error('Fetch analytics error:', error);
        } finally {
            setLoading(false);
        }
    };

    const generatePDF = async () => {
        try {
            setExportLoading(true);
            const { data } = await api.get('/orders/export', { 
                params: { startDate, endDate } 
            });

            const orders = data.orders;
            const totalRevenue = orders.reduce((acc, o) => acc + (o.totalPrice || 0), 0);

            const htmlContent = `
                <html>
                <head>
                    <style>
                        body { font-family: 'Helvetica', sans-serif; padding: 20px; color: #333; }
                        .header { text-align: center; border-bottom: 2px solid #E91E63; padding-bottom: 10px; margin-bottom: 20px; }
                        .title { font-size: 24px; font-weight: bold; color: #E91E63; }
                        .subtitle { font-size: 14px; color: #666; margin-top: 5px; }
                        .summary { display: flex; justify-content: space-between; margin-bottom: 30px; background: #f9f9f9; padding: 15px; border-radius: 8px; }
                        .summary-item { text-align: center; }
                        .summary-label { font-size: 12px; color: #666; }
                        .summary-value { font-size: 18px; font-weight: bold; color: #333; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 11px; }
                        th { background-color: #E91E63; color: white; padding: 10px; text-align: left; }
                        td { border-bottom: 1px solid #ddd; padding: 10px; }
                        tr:nth-child(even) { background-color: #f2f2f2; }
                        .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #999; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div class="title">MiniBoutique - Sales Report</div>
                        <div class="subtitle">Range: ${startDate || 'All Time'} to ${endDate || dayjs().format('YYYY-MM-DD')}</div>
                        <div class="subtitle">Generated on: ${new Date().toLocaleString()}</div>
                    </div>
                    
                    <div class="summary">
                        <div class="summary-item">
                            <div class="summary-label">Total Orders</div>
                            <div class="summary-value">${orders.length}</div>
                        </div>
                        <div class="summary-item">
                            <div class="summary-label">Total Revenue</div>
                            <div class="summary-value">Kshs ${totalRevenue.toLocaleString()}</div>
                        </div>
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Order ID</th>
                                <th>Customer</th>
                                <th>Phone</th>
                                <th>Status</th>
                                <th>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${orders.map(order => `
                                <tr>
                                    <td>${new Date(order.createdAt).toLocaleDateString()}</td>
                                    <td>#${order._id.slice(-6).toUpperCase()}</td>
                                    <td>${order.user?.name || 'Customer'}</td>
                                    <td>${order.shippingAddress?.phone || 'N/A'}</td>
                                    <td>${order.status}</td>
                                    <td>Kshs ${order.totalPrice.toLocaleString()}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>

                    <div class="footer">
                        © ${new Date().getFullYear()} MiniBoutique. All rights reserved.
                    </div>
                </body>
                </html>
            `;

            const { uri } = await Print.printToFileAsync({ html: htmlContent });
            await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
        } catch (error) {
            console.error('PDF Generation Error:', error);
            alert('Failed to generate PDF report');
        } finally {
            setExportLoading(false);
        }
    };

    const generateExcel = async () => {
        try {
            setExportLoading(true);
            const { data } = await api.get('/orders/export', { 
                params: { startDate, endDate } 
            });

            const orders = data.orders;
            
            // Generate CSV content
            let csvContent = 'Date,Order ID,Customer,Email,Phone,Status,Amount (Kshs)\n';
            
            orders.forEach(order => {
                const date = new Date(order.createdAt).toLocaleDateString();
                const id = `#${order._id.slice(-6).toUpperCase()}`;
                const user = order.user?.name || 'Customer';
                const email = order.user?.email || 'N/A';
                const phone = order.shippingAddress?.phone || 'N/A';
                const status = order.status;
                const amount = order.totalPrice;
                
                csvContent += `"${date}","${id}","${user}","${email}","${phone}","${status}","${amount}"\n`;
            });

            const fileName = `Sales_Report_${dayjs().format('YYYYMMDD_HHmmss')}.csv`;
            const fileUri = cacheDirectory + fileName;
            
            await writeAsStringAsync(fileUri, csvContent, { encoding: 'utf8' });
            await Sharing.shareAsync(fileUri, { mimeType: 'text/csv', dialogTitle: 'Share Sales Report' });

        } catch (error) {
            console.error('Excel Generation Error:', error);
            alert('Failed to generate CSV report');
        } finally {
            setExportLoading(false);
        }
    };

    const handlePageChange = (newPage) => {
        setPage(newPage);
        fetchAnalytics(startDate, endDate, newPage);
    };

    const setQuickFilter = (type) => {
        let start = '';
        let end = dayjs().format('YYYY-MM-DD');

        if (type === 'today') {
            start = dayjs().format('YYYY-MM-DD');
        } else if (type === 'week') {
            start = dayjs().subtract(7, 'day').format('YYYY-MM-DD');
        } else if (type === 'month') {
            start = dayjs().startOf('month').format('YYYY-MM-DD');
        } else if (type === 'year') {
            start = dayjs().startOf('year').format('YYYY-MM-DD');
        }

        setStartDate(start);
        setEndDate(end);
        setPage(1); // Reset page on filter change
        fetchAnalytics(start, end, 1);
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
                {/* Quick Filters */}
                <View style={styles.quickFilterRow}>
                    <TouchableOpacity 
                        style={[styles.quickFilterBtn, startDate === dayjs().format('YYYY-MM-DD') && styles.activeQuickFilter]} 
                        onPress={() => setQuickFilter('today')}
                    >
                        <Clock size={12} color={startDate === dayjs().format('YYYY-MM-DD') ? COLORS.white : COLORS.primary} />
                        <Text style={[styles.quickFilterText, startDate === dayjs().format('YYYY-MM-DD') && styles.activeQuickFilterText]}>Today</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.quickFilterBtn, startDate === dayjs().subtract(7, 'day').format('YYYY-MM-DD') && styles.activeQuickFilter]} 
                        onPress={() => setQuickFilter('week')}
                    >
                        <Text style={[styles.quickFilterText, startDate === dayjs().subtract(7, 'day').format('YYYY-MM-DD') && styles.activeQuickFilterText]}>Weekly</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.quickFilterBtn, startDate === dayjs().startOf('month').format('YYYY-MM-DD') && styles.activeQuickFilter]} 
                        onPress={() => setQuickFilter('month')}
                    >
                        <Text style={[styles.quickFilterText, startDate === dayjs().startOf('month').format('YYYY-MM-DD') && styles.activeQuickFilterText]}>Monthly</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.quickFilterBtn, startDate === dayjs().startOf('year').format('YYYY-MM-DD') && styles.activeQuickFilter]} 
                        onPress={() => setQuickFilter('year')}
                    >
                        <Text style={[styles.quickFilterText, startDate === dayjs().startOf('year').format('YYYY-MM-DD') && styles.activeQuickFilterText]}>Yearly</Text>
                    </TouchableOpacity>
                </View>

                {/* Date Filter */}
                <View style={styles.filterSection}>
                    <View style={styles.filterHeader}>
                        <Filter size={18} color={COLORS.primary} />
                        <Text style={styles.filterTitle}>Custom Date Range</Text>
                    </View>
                    <View style={styles.filterRow}>
                        <View style={{ flex: 1, marginRight: 10 }}>
                            <MyInput
                                placeholder="YYYY-MM-DD"
                                value={startDate}
                                onChangeText={setStartDate}
                                label="From"
                                icon={Calendar}
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <MyInput
                                placeholder="YYYY-MM-DD"
                                value={endDate}
                                onChangeText={setEndDate}
                                label="To"
                                icon={Calendar}
                            />
                        </View>
                    </View>
                    <TouchableOpacity style={styles.applyBtn} onPress={() => fetchAnalytics()}>
                        <Text style={styles.applyBtnText}>Apply Filter</Text>
                    </TouchableOpacity>
                </View>

                {/* Export Options */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Download size={20} color={COLORS.primary} />
                        <Text style={styles.sectionTitle}>Generate Reports</Text>
                    </View>
                    <View style={styles.exportRow}>
                        <TouchableOpacity 
                            style={[styles.exportBtn, styles.pdfBtn, exportLoading && styles.exportBtnDisabled]} 
                            onPress={generatePDF}
                            disabled={exportLoading}
                        >
                            <Download size={18} color={COLORS.white} style={{ marginRight: 8 }} />
                            <Text style={styles.exportBtnText}>Export PDF</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.exportBtn, styles.excelBtn, exportLoading && styles.exportBtnDisabled]} 
                            onPress={generateExcel}
                            disabled={exportLoading}
                        >
                            <FileText size={18} color={COLORS.white} style={{ marginRight: 8 }} />
                            <Text style={styles.exportBtnText}>Export Excel</Text>
                        </TouchableOpacity>
                    </View>
                    {exportLoading && (
                        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 10 }} />
                    )}
                </View>

                {/* Summary Stats */}
                <View style={styles.statsRow}>
                    <StatCard 
                        title="Revenue (Net)" 
                        value={`Kshs ${analytics?.totalRevenue.toLocaleString()}`} 
                        icon={DollarSign} 
                        color="#4CAF50" 
                    />
                    <StatCard 
                        title="Confirmed Orders" 
                        value={analytics?.totalSales} 
                        icon={ShoppingBag} 
                        color="#2196F3" 
                    />
                </View>

                {/* Summary Charts */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <BarChart2 size={20} color={COLORS.primary} />
                        <Text style={styles.sectionTitle}>Order Pipeline Distribution</Text>
                    </View>
                    <View style={styles.chartContainer}>
                        <BarChart
                            data={{
                                labels: ["Pndg", "Proc", "Ship", "Dlvd"],
                                datasets: [{
                                    data: [
                                        analytics?.statusCounts?.pending || 0,
                                        analytics?.statusCounts?.processing || 0,
                                        analytics?.statusCounts?.shipped || 0,
                                        analytics?.statusCounts?.delivered || 0
                                    ],
                                    colors: [
                                        (opacity = 1) => '#FF9800', // Pending
                                        (opacity = 1) => '#3F51B5', // Processing
                                        (opacity = 1) => '#FF5722', // Shipped
                                        (opacity = 1) => '#4CAF50'  // Delivered
                                    ]
                                }]
                            }}
                            width={screenWidth - 20}
                            height={250}
                            chartConfig={{
                                backgroundColor: COLORS.white,
                                backgroundGradientFrom: COLORS.white,
                                backgroundGradientTo: COLORS.white,
                                decimalPlaces: 0,
                                color: (opacity = 1) => COLORS.primary,
                                labelColor: (opacity = 1) => COLORS.text,
                                style: { borderRadius: 16 },
                                fillShadowGradientFrom: COLORS.primary,
                                fillShadowGradientTo: COLORS.accent,
                                fillShadowGradientOpacity: 1,
                                barPercentage: 0.7,
                                propsForLabels: { fontSize: 10, fontWeight: 'bold' }
                            }}
                            style={{ marginVertical: 8, borderRadius: 16, paddingRight: 40 }}
                            fromZero
                            showValuesOnTopOfBars
                            flatColor={true}
                            withCustomBarColorFromData={true}
                        />
                    </View>
                </View>

                {/* Pie Chart for Categories */}
                {analytics?.categoryData?.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <PieChartIcon size={20} color={COLORS.accent} />
                            <Text style={styles.sectionTitle}>Revenue by Category</Text>
                        </View>
                        <View style={styles.chartContainer}>
                            <PieChart
                                data={(() => {
                                    return analytics.categoryData.map(item => {
                                        return {
                                            ...item,
                                            // Let the library append the (%) by using absolute={false}
                                            name: `Kshs ${item.count.toLocaleString()}`,
                                            legendFontColor: '#555',
                                            legendFontSize: 11,
                                        };
                                    })
                                })()}
                                width={screenWidth - 20}
                                height={220}
                                chartConfig={{
                                    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                                }}
                                accessor={"count"}
                                backgroundColor={"transparent"}
                                paddingLeft={"5"}
                                absolute={false} // This enables the percentage auto-display
                                hasLegend={true}
                            />
                            
                            {/* Key (Only Category Names) */}
                            <View style={styles.customLegend}>
                                {analytics.categoryData.map((item, idx) => (
                                    <View key={idx} style={styles.legendItem}>
                                        <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                                        <Text style={styles.legendText}>{item.name}</Text>
                                    </View>
                                ))}
                            </View>

                            <View style={styles.pieSummary}>
                                <Text style={styles.pieSummaryText}>Total Category Revenue: Kshs {analytics.categoryData.reduce((acc, curr) => acc + curr.count, 0).toLocaleString()}</Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Fulfillment Status Row */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Package size={20} color={COLORS.primary} />
                        <Text style={styles.sectionTitle}>Fulfillment Counts</Text>
                    </View>
                    <View style={styles.statusRow}>
                        <View style={styles.statusCountCard}>
                            <Text style={[styles.statusCountValue, { color: '#FF9800' }]}>{analytics?.statusCounts?.pending || 0}</Text>
                            <Text style={styles.statusCountLabel}>Pending</Text>
                        </View>
                        <View style={styles.statusCountCard}>
                            <Text style={[styles.statusCountValue, { color: '#3F51B5' }]}>{analytics?.statusCounts?.processing || 0}</Text>
                            <Text style={styles.statusCountLabel}>Processing</Text>
                        </View>
                        <View style={styles.statusCountCard}>
                            <Text style={[styles.statusCountValue, { color: '#FF5722' }]}>{analytics?.statusCounts?.shipped || 0}</Text>
                            <Text style={styles.statusCountLabel}>Shipped</Text>
                        </View>
                        <View style={styles.statusCountCard}>
                            <Text style={[styles.statusCountValue, { color: '#4CAF50' }]}>{analytics?.statusCounts?.delivered || 0}</Text>
                            <Text style={styles.statusCountLabel}>Delivered</Text>
                        </View>
                    </View>
                </View>

                {/* Top Products Sections */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <TrendingUp size={20} color={COLORS.accent} />
                        <Text style={styles.sectionTitle}>Top Selling Products</Text>
                    </View>
                    <View style={styles.statsList}>
                        {analytics?.topProductsBySales?.length > 0 ? (
                            analytics.topProductsBySales.map((item) => (
                                <ProductStatItem 
                                    key={item._id} 
                                    item={item} 
                                    count={`${item.ordersCount} sold`} 
                                    icon={ShoppingBag} 
                                    iconColor={COLORS.accent}
                                />
                            ))
                        ) : (
                            <Text style={styles.emptySmallText}>No sales recorded yet.</Text>
                        )}
                    </View>
                </View>

                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Eye size={20} color={COLORS.primary} />
                        <Text style={styles.sectionTitle}>Most Viewed Products</Text>
                    </View>
                    <View style={styles.statsList}>
                        {analytics?.topProductsByViews?.length > 0 ? (
                            analytics.topProductsByViews.map((item) => (
                                <ProductStatItem 
                                    key={item._id} 
                                    item={item} 
                                    count={`${item.views} views`} 
                                    icon={Eye} 
                                    iconColor={COLORS.primary}
                                />
                            ))
                        ) : (
                            <Text style={styles.emptySmallText}>No views recorded yet.</Text>
                        )}
                    </View>
                </View>

                {/* Sales Records */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Sales Record ({analytics?.totalOrders || 0})</Text>
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

                    {/* Pagination Controls */}
                    {analytics?.totalOrders > 10 && (
                        <View style={styles.paginationRow}>
                            <TouchableOpacity 
                                style={[styles.pageBtn, page === 1 && styles.pageBtnDisabled]} 
                                onPress={() => page > 1 && handlePageChange(page - 1)}
                                disabled={page === 1}
                            >
                                <ChevronLeft size={20} color={page === 1 ? COLORS.textLight : COLORS.primary} />
                                <Text style={[styles.pageBtnText, page === 1 && styles.pageBtnTextDisabled]}>Prev</Text>
                            </TouchableOpacity>
                            
                            <Text style={styles.pageIndicator}>Page {page} of {Math.ceil(analytics.totalOrders / 10)}</Text>
                            
                            <TouchableOpacity 
                                style={[styles.pageBtn, page >= Math.ceil(analytics.totalOrders / 10) && styles.pageBtnDisabled]} 
                                onPress={() => page < Math.ceil(analytics.totalOrders / 10) && handlePageChange(page + 1)}
                                disabled={page >= Math.ceil(analytics.totalOrders / 10)}
                            >
                                <Text style={[styles.pageBtnText, page >= Math.ceil(analytics.totalOrders / 10) && styles.pageBtnTextDisabled]}>Next</Text>
                                <ChevronRight size={20} color={page >= Math.ceil(analytics.totalOrders / 10) ? COLORS.textLight : COLORS.primary} />
                            </TouchableOpacity>
                        </View>
                    )}
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
    quickFilterRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    quickFilterBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.primary,
        justifyContent: 'center',
        flex: 1,
        marginHorizontal: 4,
    },
    activeQuickFilter: {
        backgroundColor: COLORS.primary,
    },
    quickFilterText: {
        fontSize: 11,
        color: COLORS.primary,
        fontWeight: 'bold',
        marginLeft: 4,
    },
    activeQuickFilterText: {
        color: COLORS.white,
    },
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
    chartContainer: {
        backgroundColor: COLORS.white,
        padding: 10,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: COLORS.border,
        alignItems: 'center',
    },
    pieSummary: {
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: COLORS.background,
        width: '100%',
        alignItems: 'center',
    },
    pieSummaryText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    customLegend: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        paddingHorizontal: 20,
        marginTop: 5,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 8,
        marginVertical: 4,
    },
    legendColor: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 5,
    },
    legendText: {
        fontSize: 11,
        color: COLORS.text,
        fontWeight: '600',
    },
    statusRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: COLORS.white,
        padding: 15,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    statusCountCard: {
        alignItems: 'center',
        flex: 1,
    },
    statusCountValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginBottom: 2,
    },
    statusCountLabel: {
        fontSize: 10,
        color: COLORS.textLight,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
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
    exportRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 5,
    },
    exportBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        marginHorizontal: 5,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    pdfBtn: {
        backgroundColor: '#E91E63', // PDF Red/Pink
    },
    excelBtn: {
        backgroundColor: '#4CAF50', // Excel Green
    },
    exportBtnDisabled: {
        opacity: 0.6,
    },
    exportBtnText: {
        color: COLORS.white,
        fontWeight: 'bold',
        fontSize: 14,
    },
    paginationRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 15,
        paddingHorizontal: 5,
    },
    pageBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 15,
        backgroundColor: COLORS.white,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    pageBtnDisabled: {
        borderColor: COLORS.background,
        opacity: 0.5,
    },
    pageBtnText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginHorizontal: 5,
    },
    pageBtnTextDisabled: {
        color: COLORS.textLight,
    },
    pageIndicator: {
        fontSize: 13,
        color: COLORS.textLight,
        fontWeight: '600',
    },
    emptySmallText: {
        fontSize: 14,
        color: COLORS.textLight,
        textAlign: 'center',
        paddingVertical: 10,
        fontStyle: 'italic',
    },
});

export default AdminAnalyticsScreen;
