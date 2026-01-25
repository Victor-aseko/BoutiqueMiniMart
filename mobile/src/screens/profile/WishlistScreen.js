import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWishlist } from '../../context/WishlistContext';
import { COLORS } from '../../theme/theme';
import ProductCard from '../../components/ProductCard';

const WishlistScreen = () => {
    const { wishlist, removeFromWishlist } = useWishlist();

    return (
        <SafeAreaView style={styles.container}>
            {/* Redundant header removed - using Stack header instead */}
            {wishlist.length === 0 ? (
                <View style={styles.emptyBox}>
                    <Text style={styles.emptyText}>Your wishlist is empty.</Text>
                </View>
            ) : (
                <FlatList
                    data={wishlist}
                    keyExtractor={item => item._id}
                    renderItem={({ item }) => (
                        <ProductCard
                            product={item}
                            onRemove={removeFromWishlist}
                        />
                    )}
                    contentContainerStyle={styles.list}
                />
            )}
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

export default WishlistScreen;
