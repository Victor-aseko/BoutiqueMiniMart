import { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { View, Text, StyleSheet, FlatList, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWishlist } from '../../context/WishlistContext';
import { COLORS } from '../../theme/theme';
import ProductCard from '../../components/ProductCard';
import AddToCartModal from '../../components/AddToCartModal';

const WishlistScreen = ({ navigation }) => {
    const { wishlist, removeFromWishlist } = useWishlist();
    const { addToCart } = useCart();

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
                            onAddToCart={handleAddToCart}
                        />
                    )}
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
