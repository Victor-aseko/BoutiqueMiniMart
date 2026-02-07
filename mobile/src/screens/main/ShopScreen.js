import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, TextInput, TouchableOpacity, Modal, ScrollView, Dimensions, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Search, ChevronDown } from 'lucide-react-native';
import api from '../../services/api';
import ProductCard from '../../components/ProductCard';
import AddToCartModal from '../../components/AddToCartModal';
import { COLORS, SIZES } from '../../theme/theme';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

const { width } = Dimensions.get('window');

const ShopScreen = ({ navigation, route }) => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const { user } = useAuth();
    const { addToCart } = useCart();

    // Dropdown states
    const [sortModalVisible, setSortModalVisible] = useState(false);
    const [categoryModalVisible, setCategoryModalVisible] = useState(false);
    const [brandModalVisible, setBrandModalVisible] = useState(false);
    const [priceModalVisible, setPriceModalVisible] = useState(false);

    // Filter options
    const sortOptions = [
        { label: 'Newest', value: 'newest' },
        { label: 'In Stock', value: 'inStock' },
        { label: 'Low to High', value: 'lowHigh' },
        { label: 'High to Low', value: 'highLow' }
    ];

    const priceRanges = [
        { label: 'All Prices', min: 0, max: 999999 },
        { label: '0 - 5,000 Kshs', min: 0, max: 5000 },
        { label: '5,000 - 10,000 Kshs', min: 5000, max: 10000 },
        { label: '10,000 - 20,000 Kshs', min: 10000, max: 20000 },
        { label: '20,000 - 50,000 Kshs', min: 20000, max: 50000 },
        { label: '50,000+ Kshs', min: 50000, max: 999999 }
    ];

    // Selected states
    const [selectedSort, setSelectedSort] = useState('newest');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedBrandFilter, setSelectedBrandFilter] = useState('All');
    const [selectedPriceRange, setSelectedPriceRange] = useState({ label: 'All Prices', min: 0, max: 999999 });

    // Extract unique brands from products
    const [availableBrands, setAvailableBrands] = useState(['All']);

    useEffect(() => {
        fetchCategories();
        if (route.params?.params?.category || route.params?.category) {
            const cat = route.params.params?.category || route.params.category;
            setSelectedCategory(cat);
            // Reset other filters when navigating from Home category
            setSearchQuery('');
            setSelectedBrandFilter('All');
            setSelectedPriceRange({ label: 'All Prices', min: 0, max: 999999 });
            setSelectedSort('inStock'); // Default to showing in-stock items
        }

        if (route.params?.params?.search) {
            setSearchQuery(route.params.params.search);
        }
    }, [route.params]);

    useFocusEffect(
        React.useCallback(() => {
            fetchProducts();
        }, [])
    );

    // Normalize category names for inclusive yet distinct matching
    const normalizeCategory = name => {
        if (!name) return '';
        let n = name.toLowerCase();
        // Check for 'bag' first as requested so 'Women's Bags' goes to Bags
        if (n.includes('bag') || n.includes('handbag') || n.includes('purse') || n.includes('suitcase')) return 'bags';
        // Check for 'women' first to avoid 'men' matching 'women'
        if (n.includes('women')) return 'women';
        if (n.includes('men')) return 'men';
        if (n.includes('child') || n.includes('kid')) return 'children';
        if (n.includes('shoe') || n.includes('footwear')) return 'shoes';
        if (n.includes('bed')) return 'beddings';
        return n;
    };
    const normalizeText = s => (s || '').toString().trim().toLowerCase();

    useEffect(() => {
        // Extract unique brands from products
        if (products.length > 0) {
            const brands = ['All', ...new Set(products.map(p => p.brand).filter(Boolean))];
            setAvailableBrands(brands);
        }
    }, [products]);

    const fetchCategories = async () => {
        try {
            const response = await api.get('/categories');
            const mappedCategories = response.data.map(cat => normalizeCategory(cat.name));
            // Ensure essential categories are present and remove duplicates
            const categoryNames = ['All', ...new Set([...mappedCategories, 'men', 'women', 'children', 'shoes', 'bags', 'beddings'])];
            setCategories(categoryNames);
        } catch (err) {
            console.log('Error fetching categories', err);
            // Fallback to default categories
            setCategories(['All', 'Men', 'Women', 'Children', 'Shoes', 'Bags', 'Beddings']);
        }
    };

    const fetchProducts = async () => {
        try {
            const response = await api.get('/products');
            setProducts(response.data);
        } catch (err) {
            console.log('Error fetching products', err);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    const onRefresh = () => {
        setIsRefreshing(true);
        fetchProducts();
    };

    const [selectedProductForCart, setSelectedProductForCart] = useState(null);
    const [cartModalVisible, setCartModalVisible] = useState(false);

    const handleAddToCart = React.useCallback((product) => {
        setSelectedProductForCart(product);
        setCartModalVisible(true);
    }, []);

    const navigateToDetails = React.useCallback((product) => {
        navigation.navigate('ProductDetails', { product });
    }, [navigation]);

    const executeAddToCart = async (product, qty, color, size) => {
        const success = await addToCart(product, qty, color, size);
        if (success) {
            Alert.alert('Added to cart', 'The item has been successfully added to the cart. Please proceed to make an order or checkout.', [
                { text: 'View Cart', onPress: () => { try { navigation.getParent()?.getParent()?.navigate('Cart'); } catch (e) { navigation.navigate('Cart'); } } },
                { text: 'Continue Shopping', style: 'cancel' }
            ]);
        }
    };

    // Apply filters with proper category matching
    const filtered = useMemo(() => {
        return products.filter(p => {
            const pName = normalizeText(p.name);
            const pDesc = normalizeText(p.description);
            const pBrand = normalizeText(p.brand);
            const pCat = normalizeText(p.category);

            // Search Query
            const query = normalizeText(searchQuery);
            const matchesSearch = pName.includes(query) || pDesc.includes(query) || pBrand.includes(query);

            // Category Filter
            let matchesCategory = true;
            if (selectedCategory !== 'All') {
                const selected = normalizeText(selectedCategory);
                const pCatNormalized = normalizeText(normalizeCategory(p.category));

                if (selected === 'bags') {
                    matchesCategory = pCatNormalized.includes('bag') || pCatNormalized.includes('suitcase') ||
                        pName.includes('bag') || pName.includes('handbag') || pName.includes('purse') ||
                        pName.includes('jeep') || pName.includes('suitcase');
                } else if (selected === 'shoes') {
                    matchesCategory = pCatNormalized.includes('shoe') || pCatNormalized.includes('footwear') || pName.includes('sneaker') || pName.includes('sandal') || pName.includes('boot');
                } else if (selected === 'men' || selected === 'women' || selected === 'children' || selected === 'kids') {
                    matchesCategory = pCatNormalized === selected || (selected === 'children' && pCatNormalized === 'kids') || (selected === 'kids' && pCatNormalized === 'children');
                } else {
                    matchesCategory = pCatNormalized === selected || pCatNormalized.includes(selected);
                }
            }

            // Brand Filter
            const selectedBrandRaw = typeof selectedBrandFilter === 'string' ? selectedBrandFilter : (selectedBrandFilter && (selectedBrandFilter.label || selectedBrandFilter.value));
            const selectedBrand = normalizeText(selectedBrandRaw);
            const matchesBrand = selectedBrandFilter === 'All' || pBrand === selectedBrand;

            // Price Filter
            const matchesPrice = p.price >= selectedPriceRange.min && p.price <= selectedPriceRange.max;

            // Stock Filter
            const matchesStock = p.countInStock > 0;

            return matchesSearch && matchesCategory && matchesBrand && matchesPrice && matchesStock;
        });
    }, [products, searchQuery, selectedCategory, selectedBrandFilter, selectedPriceRange]);

    // Apply sorting
    const sortedProducts = useMemo(() => {
        let list = [...filtered];
        if (selectedSort === 'highLow') list.sort((a, b) => b.price - a.price);
        else if (selectedSort === 'lowHigh') list.sort((a, b) => a.price - b.price);
        else if (selectedSort === 'newest') list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        else if (selectedSort === 'inStock') {
            return list.filter(p => p.countInStock > 0);
        }
        return list;
    }, [filtered, selectedSort]);

    const renderProduct = React.useCallback(({ item }) => (
        <View style={styles.productWrapper}>
            <ProductCard
                product={item}
                onPress={() => navigateToDetails(item)}
                onAddToCart={handleAddToCart}
            />
        </View>
    ), [navigateToDetails, handleAddToCart]);

    const DropdownButton = ({ label, value, onPress }) => (
        <TouchableOpacity style={styles.dropdownBtn} onPress={onPress}>
            <Text style={styles.dropdownLabel}>{label}</Text>
            <Text style={styles.dropdownValue}>{value}</Text>
            <ChevronDown size={16} color={COLORS.primary} />
        </TouchableOpacity>
    );

    const DropdownModal = ({ visible, title, options, selectedValue, onSelect, onClose, isPrice }) => (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>{title}</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Text style={styles.modalClose}>✕</Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView
                        style={styles.modalScroll}
                        contentContainerStyle={{ paddingBottom: 40 }}
                        showsVerticalScrollIndicator={false}
                    >
                        {options.map((option, index) => {
                            const isSelected = isPrice
                                ? selectedValue.label === option.label
                                : selectedValue === option.value || selectedValue === option;
                            return (
                                <TouchableOpacity
                                    key={index}
                                    style={[styles.modalOption, isSelected && styles.modalOptionActive]}
                                    onPress={() => {
                                        onSelect(option);
                                        onClose();
                                    }}
                                >
                                    <Text style={[styles.modalOptionText, isSelected && styles.modalOptionTextActive]}>
                                        {isPrice ? option.label : option.label || option}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Header with Search */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.searchBar}
                    onPress={() => navigation.navigate('SearchScreen')}
                >
                    <Search size={20} color={COLORS.textLight} style={styles.searchIcon} />
                    <Text style={styles.searchText}>Search products...</Text>
                </TouchableOpacity>
            </View>

            {/* Filter and Sort Bar - Layout: Filters on Left, Sort on Right */}
            <View style={styles.filterSortBar}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.filterSection}
                    contentContainerStyle={styles.filterContent}
                >
                    <DropdownButton
                        label="Category"
                        value={selectedCategory}
                        onPress={() => setCategoryModalVisible(true)}
                    />
                    <DropdownButton
                        label="Brand"
                        value={selectedBrandFilter}
                        onPress={() => setBrandModalVisible(true)}
                    />
                    <DropdownButton
                        label="Price"
                        value={selectedPriceRange.label}
                        onPress={() => setPriceModalVisible(true)}
                    />
                </ScrollView>

                {/* Sort Button on Right */}
                <View style={styles.sortSection}>
                    <DropdownButton
                        label="Sort"
                        value={sortOptions.find(o => o.value === selectedSort)?.label || 'Newest'}
                        onPress={() => setSortModalVisible(true)}
                    />
                </View>
            </View>

            {/* Products List */}
            {isLoading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : (
                <FlatList
                    data={sortedProducts}
                    keyExtractor={item => item._id}
                    numColumns={2}
                    columnWrapperStyle={styles.row}
                    renderItem={renderProduct}
                    contentContainerStyle={styles.list}
                    refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
                    initialNumToRender={6}
                    maxToRenderPerBatch={10}
                    windowSize={5}
                    removeClippedSubviews={true}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Text style={styles.emptyText}>No products found</Text>
                        </View>
                    }
                />
            )}

            {/* Modals */}
            <DropdownModal
                visible={sortModalVisible}
                title="Sort By"
                options={sortOptions}
                selectedValue={selectedSort}
                onSelect={(option) => {
                    setSelectedSort(option.value);
                }}
                onClose={() => setSortModalVisible(false)}
            />

            <DropdownModal
                visible={categoryModalVisible}
                title="Categories"
                options={categories}
                selectedValue={selectedCategory}
                onSelect={(option) => setSelectedCategory(option)}
                onClose={() => setCategoryModalVisible(false)}
            />

            <DropdownModal
                visible={brandModalVisible}
                title="Brands"
                options={availableBrands}
                selectedValue={selectedBrandFilter}
                onSelect={(option) => setSelectedBrandFilter(option)}
                onClose={() => setBrandModalVisible(false)}
            />

            <DropdownModal
                visible={priceModalVisible}
                title="Price Range (Kshs)"
                options={priceRanges}
                selectedValue={selectedPriceRange}
                onSelect={(option) => setSelectedPriceRange(option)}
                onClose={() => setPriceModalVisible(false)}
                isPrice={true}
            />
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
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: 15, // Move to left
        paddingRight: 80, // Keep it short
        paddingVertical: 12,
        backgroundColor: COLORS.white,
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderRadius: 22,
        paddingHorizontal: 15,
        height: 44,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.08)',
    },
    searchIcon: {
        marginRight: 8,
    },
    searchText: {
        flex: 1,
        fontSize: 14,
        color: COLORS.textLight,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: COLORS.primary,
    },
    filterBar: {
        paddingHorizontal: 15,
        paddingVertical: 10,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    filterSortBar: {
        flexDirection: 'row',
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        alignItems: 'center',
        paddingVertical: 10,
    },
    filterSection: {
        flex: 1,
        paddingHorizontal: 15,
    },
    filterContent: {
        paddingVertical: 0,
    },
    sortSection: {
        paddingHorizontal: 15,
        marginLeft: 'auto',
    },
    dropdownBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginRight: 10,
        backgroundColor: COLORS.background,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    dropdownLabel: {
        fontSize: 12,
        color: COLORS.textLight,
        marginRight: 6,
    },
    dropdownValue: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.primary,
        marginRight: 6,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '80%',
        paddingTop: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    modalClose: {
        fontSize: 24,
        color: COLORS.textLight,
    },
    modalScroll: {
        flexGrow: 0,
    },
    modalOption: {
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 0.5,
        borderBottomColor: COLORS.border,
    },
    modalOptionActive: {
        backgroundColor: COLORS.background,
    },
    modalOptionText: {
        fontSize: 16,
        color: COLORS.text,
    },
    modalOptionTextActive: {
        color: COLORS.accent,
        fontWeight: '600',
    },
    list: {
        paddingBottom: 20,
        paddingHorizontal: 10,
    },
    row: {
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    productWrapper: {
        width: '48%',
        marginBottom: 15,
    },
    empty: {
        alignItems: 'center',
        marginTop: 50,
    },
    emptyText: {
        fontSize: 16,
        color: COLORS.textLight,
    },
});

export default ShopScreen;
