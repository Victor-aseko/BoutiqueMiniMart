import { useCart } from '../../context/CartContext';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRecentlyViewed } from '../../context/RecentlyViewedContext';
import { COLORS } from '../../theme/theme';
import ProductCard from '../../components/ProductCard';
import AddToCartModal from '../../components/AddToCartModal';

const RecentlyViewedScreen = ({ navigation }) => {
    const { recentlyViewed, clearRecentlyViewed } = useRecentlyViewed();
    const { addToCart } = useCart();

    const handleClear = () => {
        Alert.alert(
            'Clear Browsing History',
            'Are you sure you want to clear your recently browsing history?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Clear', style: 'destructive', onPress: clearRecentlyViewed }
            ]
        );
    };

    const [selectedProductForCart, setSelectedProductForCart] = useState(null);
    const [cartModalVisible, setCartModalVisible] = useState(false);

    const handleAddToCart = (product) => {
        setSelectedProductForCart(product);
        setCartModalVisible(true);
    };

    const executeAddToCart = async (product, qty, color, size) => {
        const success = await addToCart(product, qty, color, size);
        if (success) {
            Alert.alert('Added to cart', 'Item added to cart successfully.', [
                { text: 'View Cart', onPress: () => { try { navigation.getParent()?.getParent()?.navigate('Cart'); } catch (e) { navigation.navigate('Cart'); } } },
                { text: 'OK' }
            ]);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.headerRow}>
                <Text style={styles.title}>Recently Viewed</Text>
                {recentlyViewed.length > 0 && (
                    <TouchableOpacity onPress={handleClear}>
                        <Text style={styles.clearLink}>Clear</Text>
                    </TouchableOpacity>
                )}
            </View>
            {recentlyViewed.length === 0 ? (
                <View style={styles.emptyBox}>
                    <Text style={styles.emptyText}>No recently viewed products.</Text>
                </View>
            ) : (
                <FlatList
                    data={recentlyViewed}
                    keyExtractor={item => item._id}
                    renderItem={({ item }) => <ProductCard product={item} onAddToCart={handleAddToCart} />}
                    contentContainerStyle={styles.list}
                />
            )}
            <AddToCartModal
                visible={cartModalVisible}
                onClose={() => setCartModalVisible(false)}
                product={selectedProductForCart}
                onAddToCart={executeAddToCart}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    clearLink: {
        color: COLORS.error,
        fontWeight: 'bold',
        fontSize: 15,
    },
    emptyBox: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        color: COLORS.textLight,
        fontSize: 16,
    },
    list: {
        padding: 15,
    },
});

export default RecentlyViewedScreen;
