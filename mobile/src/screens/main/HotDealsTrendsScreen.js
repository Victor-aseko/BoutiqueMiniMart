import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    RefreshControl,
    TextInput,
    TouchableOpacity,
    Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, ChevronLeft, X } from 'lucide-react-native';
import api from '../../services/api';
import ProductCard from '../../components/ProductCard';
import AddToCartModal from '../../components/AddToCartModal';
import { COLORS } from '../../theme/theme';
import { useCart } from '../../context/CartContext';

const { width } = Dimensions.get('window');

const HotDealsTrendsScreen = ({ navigation }) => {
    const [products, setProducts] = useState([]);
    const [allProducts, setAllProducts] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    
    // Cart Modal State
    const [selectedProductForCart, setSelectedProductForCart] = useState(null);
    const [selectedColorForCart, setSelectedColorForCart] = useState(null);
    const [cartModalVisible, setCartModalVisible] = useState(false);

    const { addToCart } = useCart();

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const response = await api.get('/products');
            setAllProducts(response.data);
            // Exclusive filter for Hot Deals and Trends
            const filteredData = response.data.filter(p => (p.isHotDeal || p.isTrending) && p.countInStock > 0);
            setProducts(filteredData);
        } catch (err) {
            console.error('Error fetching hot deals:', err);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    const onRefresh = () => {
        setIsRefreshing(true);
        fetchProducts();
    };

    const handleAddToCart = useCallback((product, color) => {
        setSelectedProductForCart(product);
        setSelectedColorForCart(color);
        setCartModalVisible(true);
    }, []);

    const navigateToDetails = useCallback((product, color) => {
        navigation.navigate('ProductDetails', { product, selectedColor: color });
    }, [navigation]);

    const executeAddToCart = async (product, qty, color, size) => {
        const success = await addToCart(product, qty, color, size);
        if (success) {
            // Success alert is handled by CartContext or we could add one here
        }
    };

    const filteredProducts = useMemo(() => {
        if (!searchQuery.trim()) return products;
        
        const query = searchQuery.toLowerCase().trim();
        return products.filter(p => 
            p.name.toLowerCase().includes(query) || 
            p.category.toLowerCase().includes(query) ||
            (p.brand && p.brand.toLowerCase().includes(query))
        );
    }, [products, searchQuery]);

    const suggestedProducts = useMemo(() => {
        if (!searchQuery.trim() || filteredProducts.length > 0) return [];
        const words = searchQuery.toLowerCase().split(' ').filter(w => w.length > 2);
        if (words.length === 0) return [];

        return allProducts.filter(p =>
            words.some(word =>
                p.category.toLowerCase().includes(word) ||
                p.name.toLowerCase().includes(word)
            )
        ).slice(0, 4);
    }, [searchQuery, allProducts, filteredProducts]);

    const renderProduct = useCallback(({ item }) => (
        <View style={styles.productWrapper}>
            <ProductCard
                product={item}
                onPress={(p, color) => navigateToDetails(p, color)}
                onAddToCart={handleAddToCart}
            />
        </View>
    ), [navigateToDetails, handleAddToCart]);

    return (
        <SafeAreaView style={styles.container}>
            {/* Custom Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ChevronLeft size={24} color={COLORS.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Hot Deals & Trends</Text>
                <View style={{ width: 40 }} /> 
            </View>

            {/* Inline Search Bar */}
            <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                    <Search size={20} color={COLORS.textLight} style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search within hot deals & trends..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor={COLORS.textLight}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <X size={18} color={COLORS.textLight} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {isLoading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={COLORS.accent} />
                </View>
            ) : (
                <FlatList
                    data={filteredProducts}
                    keyExtractor={item => item._id}
                    numColumns={2}
                    columnWrapperStyle={styles.row}
                    renderItem={renderProduct}
                    contentContainerStyle={styles.list}
                    refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Text style={styles.emptyText}>
                                {searchQuery ? `No matching deals found for "${searchQuery}"` : 'No Hot Deals or Trends available right now.'}
                            </Text>
                            {(searchQuery && suggestedProducts.length > 0) && (
                                <View style={styles.suggestionSection}>
                                    <Text style={styles.suggestionTitle}>Wait! You may also like...</Text>
                                    <View style={styles.suggestionGrid}>
                                        {suggestedProducts.map((item) => (
                                            <View key={item._id} style={{ width: '48%', marginBottom: 15 }}>
                                                <ProductCard
                                                    product={item}
                                                    onPress={(p, color) => navigateToDetails(p, color)}
                                                    onAddToCart={handleAddToCart}
                                                />
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            )}
                        </View>
                    }
                />
            )}

            <AddToCartModal
                visible={cartModalVisible}
                onClose={() => {
                    setCartModalVisible(false);
                    setSelectedColorForCart(null);
                }}
                product={selectedProductForCart}
                initialColor={selectedColorForCart}
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
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingVertical: 12,
        backgroundColor: COLORS.white,
    },
    backBtn: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    searchContainer: {
        paddingHorizontal: 15,
        paddingVertical: 10,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 44,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: COLORS.primary,
        height: '100%',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    list: {
        paddingHorizontal: 10,
        paddingTop: 15,
        paddingBottom: 40,
    },
    row: {
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    productWrapper: {
        width: '48%',
        marginBottom: 5,
    },
    empty: {
        alignItems: 'center',
        marginTop: 50,
        paddingHorizontal: 40,
    },
    emptyText: {
        fontSize: 16,
        color: COLORS.textLight,
        textAlign: 'center',
        marginBottom: 20,
    },
    suggestionSection: {
        width: '100%',
        marginTop: 20,
    },
    suggestionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginBottom: 15,
        paddingHorizontal: 0,
    },
    suggestionGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    }
});

export default HotDealsTrendsScreen;
