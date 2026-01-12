import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Bell, Trash2, CheckCheck, Package, Info } from 'lucide-react-native';
import { useNotifications } from '../../context/NotificationContext';
import { COLORS, SIZES } from '../../theme/theme';

const NotificationsScreen = ({ navigation }) => {
    const {
        notifications,
        isLoading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification
    } = useNotifications();

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={[styles.notificationCard, !item.isRead && styles.unreadCard]}
            onPress={() => {
                if (!item.isRead) markAsRead(item._id);
                if (item.orderId) {
                    // Navigate to order details if it's an order notification
                    navigation.navigate('Profile', {
                        screen: 'OrderDetails',
                        params: { orderId: item.orderId, isFromAdmin: item.type === 'ORDER_PLACED' }
                    });
                }
            }}
        >
            <View style={styles.iconContainer}>
                {item.type === 'ORDER_PLACED' || item.type === 'ORDER_STATUS_UPDATE' ? (
                    <Package size={24} color={COLORS.accent} />
                ) : (
                    <Info size={24} color={COLORS.primary} />
                )}
                {!item.isRead && <View style={styles.unreadDot} />}
            </View>

            <View style={styles.contentContainer}>
                <View style={styles.cardHeader}>
                    <Text style={styles.title}>{item.title}</Text>
                    <Text style={styles.time}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                </View>
                <Text style={styles.message} numberOfLines={2}>{item.message}</Text>
            </View>

            <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => deleteNotification(item._id)}
            >
                <Trash2 size={18} color={COLORS.textLight} />
            </TouchableOpacity>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ChevronLeft color={COLORS.primary} size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Notifications</Text>
                {notifications.length > 0 && (
                    <TouchableOpacity onPress={markAllAsRead} style={styles.markAllBtn}>
                        <CheckCheck size={20} color={COLORS.accent} />
                    </TouchableOpacity>
                )}
            </View>

            <FlatList
                data={notifications}
                keyExtractor={item => item._id}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={isLoading} onRefresh={fetchNotifications} />
                }
                ListEmptyComponent={
                    !isLoading && (
                        <View style={styles.empty}>
                            <Bell size={60} color={COLORS.border} />
                            <Text style={styles.emptyText}>No notifications yet.</Text>
                        </View>
                    )
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    backBtn: { padding: 4 },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    markAllBtn: { padding: 4 },
    list: {
        padding: 15,
    },
    notificationCard: {
        flexDirection: 'row',
        backgroundColor: COLORS.white,
        borderRadius: SIZES.radius,
        padding: 15,
        marginBottom: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    unreadCard: {
        borderColor: COLORS.accent,
        backgroundColor: COLORS.white,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.accent,
    },
    iconContainer: {
        marginRight: 15,
        position: 'relative',
    },
    unreadDot: {
        position: 'absolute',
        top: -2,
        right: -2,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: COLORS.error,
        borderWidth: 2,
        borderColor: COLORS.white,
    },
    contentContainer: {
        flex: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    title: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.primary,
        flex: 1,
    },
    time: {
        fontSize: 10,
        color: COLORS.textLight,
    },
    message: {
        fontSize: 13,
        color: COLORS.text,
        lineHeight: 18,
    },
    deleteBtn: {
        marginLeft: 10,
        padding: 5,
    },
    empty: {
        alignItems: 'center',
        marginTop: 100,
    },
    emptyText: {
        marginTop: 15,
        color: COLORS.textLight,
        fontSize: 16,
    }
});

export default NotificationsScreen;
