import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    Keyboard,
    Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Search, X } from 'lucide-react-native';
import { COLORS } from '../../theme/theme';
import api from '../../services/api';
import ProductCard from '../../components/ProductCard';
import AddToCartModal from '../../components/AddToCartModal';
import { useCart } from '../../context/CartContext';

const SearchScreen = ({ navigation }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const inputRef = useRef(null);
    const { addToCart } = useCart();

    useEffect(() => {
        // Auto-focus the search input
        if (inputRef.current) {
            setTimeout(() => inputRef.current.focus(), 100);
        }
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const response = await api.get('/products');
            setProducts(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Fetch error:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredProducts([]);
        } else {
            const query = searchQuery.toLowerCase();
            const filtered = products.filter(p =>
                p.name.toLowerCase().includes(query) ||
                p.category.toLowerCase().includes(query) ||
                p.description.toLowerCase().includes(query)
            );
            setFilteredProducts(filtered);
        }
    }, [searchQuery, products]);

    const handleClear = () => {
        setSearchQuery('');
        inputRef.current?.focus();
    };

    const [selectedProductForCart, setSelectedProductForCart] = useState(null);
    const [cartModalVisible, setCartModalVisible] = useState(false);

    const handleAddToCart = (product) => {
        setSelectedProductForCart(product);
        setCartModalVisible(true);
    };

    const executeAddToCart = async (product, qty, color, size) => {
        try {
            const success = await addToCart(product, qty, color, size);
            if (success) {
                Alert.alert('Added to cart', 'The item has been successfully added to the cart. Please proceed to make an order or checkout.', [
                    { text: 'View Cart', onPress: () => { try { navigation.getParent()?.getParent()?.navigate('Cart'); } catch (e) { navigation.navigate('Cart'); } } },
                    { text: 'Continue Shopping', style: 'cancel' }
                ]);
            } else {
                Alert.alert('Failed', 'Failed to add item to cart.');
            }
        } catch (error) {
            console.error('Error adding to cart:', error);
            Alert.alert('Error', 'An error occurred while adding to cart.');
        }
    };

    const renderItem = ({ item }) => (
        <View style={styles.productWrapper}>
            <ProductCard
                product={item}
                onPress={() => navigation.navigate('ProductDetails', { product: item, isOffer: item.isOffer })}
                onAddToCart={handleAddToCart}
                isOffer={item.isOffer}
            />
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ChevronLeft color={COLORS.primary} size={26} />
                </TouchableOpacity>
                <View style={styles.searchBar}>
                    <Search color={COLORS.textLight} size={20} style={styles.searchIcon} />
                    <TextInput
                        ref={inputRef}
                        style={styles.input}
                        placeholder="Search products..."
                        placeholderTextColor={COLORS.textLight}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        returnKeyType="search"
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={handleClear}>
                            <X color={COLORS.textLight} size={20} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : (
                <FlatList
                    data={filteredProducts}
                    keyExtractor={item => item._id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        searchQuery.trim() !== '' ? (
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyText}>No products found for "{searchQuery}"</Text>
                            </View>
                        ) : (
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyText}>Type to search...</Text>
                            </View>
                        )
                    }
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
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    backBtn: {
        marginRight: 10,
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        borderRadius: 12,
        paddingHorizontal: 10,
        height: 45,
    },
    searchIcon: {
        marginRight: 8,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: COLORS.primary,
        height: '100%',
    },
    listContent: {
        padding: 15,
    },
    productWrapper: {
        marginBottom: 15,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 50,
    },
    emptyText: {
        color: COLORS.textLight,
        fontSize: 16,
    }
});

export default SearchScreen;
