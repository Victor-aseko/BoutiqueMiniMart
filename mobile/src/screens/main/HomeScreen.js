import React, { useState, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    RefreshControl,
    TextInput as RNTextInput,
    TouchableOpacity,
    Modal,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Keyboard,
    Dimensions,
    Image
} from 'react-native';
import { Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Tag, Facebook, Instagram, Send, X, MessageSquare } from 'lucide-react-native';
import { Linking } from 'react-native';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import ProductCard from '../../components/ProductCard';
import { COLORS } from '../../theme/theme';

const whatsappIcon = require('../../../assets/icons/whatsapp.png');
const facebookIcon = require('../../../assets/icons/facebook.png');

const HomeScreen = ({ navigation }) => {
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showAllArrivals, setShowAllArrivals] = useState(false);
    const [showAllOffers, setShowAllOffers] = useState(false);

    const { user } = useAuth();
    const { addToCart } = useCart();

    useEffect(() => {
        fetchProducts();
    }, []);

    useFocusEffect(
        React.useCallback(() => {
            fetchProducts();
        }, [])
    );

    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredProducts(products);
        } else {
            const filtered = products.filter(p =>
                p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.description.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredProducts(filtered);
        }
    }, [searchQuery, products]);

    const fetchProducts = async () => {
        try {
            const response = await api.get('/products');
            setProducts(response.data);
            setFilteredProducts(response.data);
        } catch (err) {
            console.error('Error fetching products:', err.message);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    const handleAddToCart = async (product) => {
        if (!user) {
            Alert.alert('Sign in required', 'Please sign in to add items to your cart.', [
                { text: 'Sign In', onPress: () => navigation.navigate('Auth') },
                { text: 'Cancel', style: 'cancel' }
            ]);
            return;
        }
        try {
            const success = await addToCart(product, 1);
            if (success) {
                Alert.alert('Added to cart', 'The item has been successfully added to the cart. Please proceed to make an order or checkout.', [
                    { text: 'View Cart', onPress: () => { try { navigation.getParent()?.getParent()?.navigate('Cart'); } catch (e) { navigation.navigate('Cart'); } } },
                    { text: 'Continue Shopping', style: 'cancel' }
                ]);
                // Redirect to Shopping Cart (Drawer) instead of Orders
                try {
                    // climb to drawer navigator and open Cart
                    navigation.getParent()?.getParent()?.navigate('Cart');
                } catch (e) {
                    navigation.navigate('Cart');
                }
            } else {
                Alert.alert('Failed', 'Failed to add item to cart. Please try again.');
            }
        } catch (error) {
            console.error('Error adding to cart:', error);
            Alert.alert('Error', 'There was an error adding the item to the cart. Please try again.');
        }
    };

    const onRefresh = () => {
        setIsRefreshing(true);
        fetchProducts();
    };

    const renderSectionHeader = (title, onSeeAll, rightLabel = 'See All') => (
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <TouchableOpacity onPress={onSeeAll}>
                <Text style={styles.seeAll}>{rightLabel}</Text>
            </TouchableOpacity>
        </View>
    );

    const { width } = Dimensions.get('window');
    const CARD_WIDTH = (width - 50) / 2; // (Screen width - 40px padding - 20px gap) / 2

    const renderNewArrivals = () => {
        // Limit to 4 items, 2 visible per screen
        const displayProducts = products.slice(0, 4);
        return (
            <View style={styles.newArrivalsContainer}>
                <FlatList
                    data={displayProducts}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    scrollEnabled={true}
                    keyExtractor={(item) => item._id}
                    initialNumToRender={2}
                    maxToRenderPerBatch={2}
                    renderItem={({ item }) => (
                        <View style={{ width: CARD_WIDTH, marginRight: 10 }}>
                            <ProductCard
                                product={item}
                                onPress={() => navigation.navigate('ProductDetails', { product: item, isOffer: false })}
                                onAddToCart={handleAddToCart}
                                isOffer={false}
                            />
                        </View>
                    )}
                />
            </View>
        );
    };

    const renderAllArrivalsModal = () => {
        return (
            <Modal
                visible={showAllArrivals}
                transparent={false}
                animationType="slide"
                onRequestClose={() => setShowAllArrivals(false)}
            >
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>All New Arrivals</Text>
                        <TouchableOpacity onPress={() => setShowAllArrivals(false)}>
                            <X size={24} color={COLORS.primary} />
                        </TouchableOpacity>
                    </View>
                    <ScrollView style={styles.modalContent} contentContainerStyle={styles.modalContentContainer}>
                        <View style={styles.productsGrid}>
                            {products.map((product) => (
                                <View key={product._id} style={{ width: '48%', marginBottom: 15 }}>
                                    <ProductCard
                                        product={product}
                                        onPress={() => {
                                            setShowAllArrivals(false);
                                            navigation.navigate('ProductDetails', { product });
                                        }}
                                        onAddToCart={handleAddToCart}
                                    />
                                </View>
                            ))}
                        </View>
                    </ScrollView>
                </SafeAreaView>
            </Modal>
        );
    };

    const renderAllOffersModal = () => {
        // Show 4 products for offers (5-9)
        const limitedProducts = products.slice(5, 9);
        return (
            <Modal
                visible={showAllOffers}
                transparent={false}
                animationType="slide"
                onRequestClose={() => setShowAllOffers(false)}
            >
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Special Offers</Text>
                        <TouchableOpacity onPress={() => setShowAllOffers(false)}>
                            <X size={24} color={COLORS.primary} />
                        </TouchableOpacity>
                    </View>
                    <ScrollView style={styles.modalContent} contentContainerStyle={styles.modalContentContainer}>
                        <View style={styles.productsGrid}>
                            {limitedProducts.map((product) => (
                                <View key={product._id} style={{ width: '48%', marginBottom: 15 }}>
                                    <ProductCard
                                        product={product}
                                        onPress={() => {
                                            setShowAllOffers(false);
                                            navigation.navigate('ProductDetails', { product, isOffer: true });
                                        }}
                                        onAddToCart={handleAddToCart}
                                        isOffer={true}
                                    />
                                    <View style={styles.offerBadge}>
                                        <Text style={styles.offerBadgeText}>-10% OFF</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </ScrollView>
                </SafeAreaView>
            </Modal>
        );
    };

    // Header content for FlatList (without the persistent search input)
    const renderHeader = () => (
        <View style={styles.headerContainer}>
            {renderSectionHeader('New Arrivals', () => setShowAllArrivals(true))}
            {renderNewArrivals()}
        </View>
    );

    const renderFooter = () => (
        <View>
            <View style={styles.offersSection}>
                {renderSectionHeader('Special Offers', () => setShowAllOffers(true), 'View Offers')}
                <View style={[styles.offersContainer, { paddingHorizontal: 0 }]}>
                    {/* Just display two cards close to one another */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20 }}>
                        {products.slice(5, 7).map((item) => (
                            <View key={item._id} style={{ width: '48%', position: 'relative' }}>
                                <ProductCard
                                    product={item}
                                    onPress={() => navigation.navigate('ProductDetails', { product: item, isOffer: true })}
                                    onAddToCart={handleAddToCart}
                                    isOffer={true}
                                />
                                <View style={styles.offerBadge}>
                                    <Text style={styles.offerBadgeText}>-10% OFF</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>
            </View>

            <View style={styles.mainFooter}>
                <Text style={styles.footerBrand}>MiniBoutique Shop</Text>
                <Text style={styles.footerSlogan}>Your ultimate destination for quality & style.</Text>

                <View style={styles.footerLinks}>
                    <TouchableOpacity style={styles.socialIcon} onPress={() => Linking.openURL('https://chat.whatsapp.com/IVGjYlhsLZb4h0oeXbJ98P')}>
                        <Image source={whatsappIcon} style={styles.socialIconImage} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.socialIcon} onPress={() => Linking.openURL('https://www.facebook.com/yourpage')}>
                        <Image source={facebookIcon} style={styles.socialIconImage} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.socialIcon} onPress={() => Linking.openURL('https://www.instagram.com/yourpage')}>
                        <Instagram size={20} color={COLORS.accent} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.socialIcon} onPress={() => Linking.openURL('https://www.tiktok.com/@yourpage')}>
                        <Send size={20} color={'#000'} />
                    </TouchableOpacity>
                </View>

                <View style={styles.footerBottom}>
                    <Text style={styles.footerCopyright}>© 2025 MiniBoutique. All rights reserved.</Text>
                    <View style={styles.footerPolicies}>
                        <TouchableOpacity onPress={() => Linking.openURL('https://www.blueberiboutique.com/pages/privacy-policy?')}>
                            <Text style={styles.policyText}>Privacy Policy</Text>
                        </TouchableOpacity>
                        <Text style={styles.dot}>•</Text>
                        <TouchableOpacity onPress={() => Linking.openURL('https://www.blueberiboutique.com/pages/privacy-policy?')}>
                            <Text style={styles.policyText}>Terms of Use</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </View>
    );

    if (isLoading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.headerContainer}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={10}
                >
                    <View style={styles.searchBar}>
                        <Search size={20} color={COLORS.textLight} style={styles.searchIcon} />
                        <RNTextInput
                            placeholder="Search boutique products..."
                            style={styles.searchInput}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholderTextColor={COLORS.textLight}
                        />
                    </View>
                </KeyboardAvoidingView>
            </View>

            <FlatList
                data={searchQuery.trim() !== '' ? filteredProducts : []}
                keyExtractor={(item) => item._id}
                scrollEnabled={true}
                renderItem={({ item }) => (
                    <View style={styles.searchResultItem}>
                        <ProductCard
                            product={item}
                            onPress={() => navigation.navigate('ProductDetails', { product: item })}
                            onAddToCart={handleAddToCart}
                        />
                    </View>
                )}
                ListHeaderComponent={renderHeader}
                ListFooterComponent={renderFooter}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={
                    searchQuery.trim() !== '' && (
                        <View style={styles.empty}>
                            <Text>No products found</Text>
                        </View>
                    )
                }
            />
            {renderAllArrivalsModal()}
            {renderAllOffersModal()}

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
    headerContainer: {
        padding: 20,
        backgroundColor: COLORS.white,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        borderRadius: 12,
        paddingHorizontal: 15,
        height: 50,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginBottom: 20,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: COLORS.primary,
        padding: 0,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    seeAll: {
        fontSize: 14,
        color: COLORS.accent,
        fontWeight: '600',
    },
    newArrivalsContainer: {
        paddingLeft: 20,
        marginBottom: 20,
        backgroundColor: COLORS.white,
        paddingBottom: 20,
    },
    productsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    productWrapper: {
        width: '100%',
        marginBottom: 15,
    },
    horizontalProductCard: {
        width: 140,
        marginRight: 10,
    },
    horizontalOfferCard: {
        width: 140,
        marginRight: 10,
    },
    offerCardContainer: {
        position: 'relative',
    },
    list: {
        paddingBottom: 20,
    },
    searchResultItem: {
        paddingHorizontal: 15,
        marginBottom: 15,
    },
    empty: {
        alignItems: 'center',
        marginTop: 50,
    },
    footer: {
        marginTop: 10,
        marginBottom: 0,
    },
    offersSection: {
        paddingHorizontal: 20,
        marginBottom: 30,
    },
    offersContainer: {
        marginHorizontal: -10,
        paddingHorizontal: 20,
    },
    offerBadge: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: COLORS.error,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 5,
        zIndex: 10,
    },
    offerBadgeText: {
        color: COLORS.white,
        fontSize: 10,
        fontWeight: 'bold',
    },
    mainFooter: {
        backgroundColor: 'rgba(229, 231, 235, 0.2)',
        paddingVertical: 25,
        paddingHorizontal: 20,
        marginHorizontal: -20,
        alignItems: 'center',
    },
    footerBrand: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginBottom: 2,
    },
    footerSlogan: {
        fontSize: 12,
        color: COLORS.textLight,
        marginBottom: 15,
        textAlign: 'center',
    },
    footerLinks: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    socialIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 10,
        overflow: 'hidden',
    },
    socialIconImage: {
        width: 40,
        height: 40,
        resizeMode: 'contain',
    },
    footerBottom: {
        width: '100%',
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.1)',
        paddingTop: 20,
        alignItems: 'center',
    },
    footerCopyright: {
        color: COLORS.textLight,
        fontSize: 12,
        marginBottom: 10,
    },
    footerPolicies: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    policyText: {
        color: COLORS.textLight,
        fontSize: 12,
    },
    dot: {
        color: COLORS.textLight,
        marginHorizontal: 10,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    modalContent: {
        flex: 1,
    },
    modalContentContainer: {
        padding: 15,
    }
});

export default HomeScreen;
