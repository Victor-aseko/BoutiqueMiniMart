import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, TextInput, TouchableOpacity, Modal, ScrollView, Dimensions, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, ChevronDown } from 'lucide-react-native';
import api from '../../services/api';
import ProductCard from '../../components/ProductCard';
import { COLORS, SIZES } from '../../theme/theme';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

const { width } = Dimensions.get('window');

const ShopScreen = ({ navigation }) => {
    const [products, setProducts] = useState([]);
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
        { label: 'Low to High', value: 'lowHigh' },
        { label: 'High to Low', value: 'highLow' }
    ];

    const categoryOptions = [
        'All',
        'Men',
        'Women',
        'Children',
        'Shoes',
        'Beddings'
    ];

    const priceRanges = [
        { label: 'All Prices', min: 0, max: 19999 },
        { label: '0 - 5,000 Kshs', min: 0, max: 5000 },
        { label: '5,000 - 10,000 Kshs', min: 5000, max: 10000 },
        { label: '10,000+ Kshs', min: 10000, max: 19999 }

    ];

    // Selected states
    const [selectedSort, setSelectedSort] = useState('newest');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedBrandFilter, setSelectedBrandFilter] = useState('All');
    const [selectedPriceRange, setSelectedPriceRange] = useState({ label: 'All Prices', min: 0, max: 999999 });

    // Extract unique brands from products
    const [availableBrands, setAvailableBrands] = useState(['All']);

    useEffect(() => {
        fetchProducts();
    }, []);

    useEffect(() => {
        // Extract unique brands from products
        if (products.length > 0) {
            const brands = ['All', ...new Set(products.map(p => p.brand).filter(Boolean))];
            setAvailableBrands(brands);
        }
    }, [products]);

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

    const handleAddToCart = async (product) => {
        if (!user) {
            navigation.navigate('Auth');
            return;
        }
        const success = await addToCart(product, 1);
        if (success) {
            Alert.alert('Added to cart', 'The item has been successfully added to the cart. Please proceed to make an order or checkout.', [
                { text: 'View Cart', onPress: () => { try { navigation.getParent()?.getParent()?.navigate('Cart'); } catch (e) { navigation.navigate('Cart'); } } },
                { text: 'Continue Shopping', style: 'cancel' }
            ]);
        }
    };

    // Apply filters
    const filtered = useMemo(() => {
        return products.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.category.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
            const matchesBrand = selectedBrandFilter === 'All' || (p.brand && p.brand === selectedBrandFilter);
            const matchesPrice = p.price >= selectedPriceRange.min && p.price <= selectedPriceRange.max;
            return matchesSearch && matchesCategory && matchesBrand && matchesPrice;
        });
    }, [products, searchQuery, selectedCategory, selectedBrandFilter, selectedPriceRange]);

    // Apply sorting
    const sortedProducts = useMemo(() => {
        const list = [...filtered];
        if (selectedSort === 'highLow') list.sort((a, b) => b.price - a.price);
        else if (selectedSort === 'lowHigh') list.sort((a, b) => a.price - b.price);
        else if (selectedSort === 'newest') list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        return list;
    }, [filtered, selectedSort]);

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
                    <ScrollView style={styles.modalScroll}>
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
                <View style={styles.searchBar}>
                    <Search size={20} color={COLORS.textLight} style={styles.searchIcon} />
                    <TextInput
                        placeholder="Search products..."
                        style={styles.searchInput}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor={COLORS.textLight}
                    />
                </View>
            </View>

            {/* Filter Dropdowns */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar}>
                <DropdownButton
                    label="Sort by"
                    value={sortOptions.find(o => o.value === selectedSort)?.label || 'Newest'}
                    onPress={() => setSortModalVisible(true)}
                />
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
                    renderItem={({ item }) => (
                        <ProductCard
                            product={item}
                            onPress={() => navigation.navigate('ProductDetails', { product: item })}
                            onAddToCart={handleAddToCart}
                            style={{ width: '100%' }}
                        />
                    )}
                    contentContainerStyle={styles.list}
                    refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
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
                onSelect={(option) => setSelectedSort(option.value)}
                onClose={() => setSortModalVisible(false)}
            />

            <DropdownModal
                visible={categoryModalVisible}
                title="Categories"
                options={categoryOptions}
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
        padding: 15,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        borderRadius: 10,
        paddingHorizontal: 12,
        height: 45,
    },
    searchIcon: {
        marginRight: 10,
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
        maxHeight: 400,
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
