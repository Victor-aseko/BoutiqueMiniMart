import React, { useState, useEffect, useCallback } from 'react';
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
    Image,
    ImageBackground,
    Animated
} from 'react-native';
import { Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Tag, Facebook, Instagram, Music, X, MessageSquare, Heart, ShoppingCart } from 'lucide-react-native';
import { Linking } from 'react-native';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import ProductCard from '../../components/ProductCard';
import { COLORS } from '../../theme/theme';
import AddToCartModal from '../../components/AddToCartModal';

const whatsappIcon = require('../../../assets/icons/whatsapp.png');
const facebookIcon = require('../../../assets/icons/facebook.png');
const instagramIcon = require('../../../assets/icons/instagram.png');
const tiktokIcon = require('../../../assets/icons/tiktok.png');

const HomeScreen = ({ navigation }) => {
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showAllArrivals, setShowAllArrivals] = useState(false);
    const [showAllOffers, setShowAllOffers] = useState(false);
    const [categoryGroups, setCategoryGroups] = useState([]);

    // Normalize category names consistently with ShopScreen
    const normalizeCategory = name => {
        if (!name) return '';
        let n = name.toLowerCase();
        // Check for 'bag' first so 'Women's Bags' goes to Bags
        if (n.includes('bag') || n.includes('handbag') || n.includes('purse') || n.includes('suitcase')) return 'bags';
        if (n.includes('women')) return 'women';
        if (n.includes('men')) return 'men';
        if (n.includes('child') || n.includes('kid')) return 'children';
        if (n.includes('shoe') || n.includes('footwear')) return 'shoes';
        if (n.includes('bed')) return 'beddings';
        return n;
    };

    // Extract categories matching the user request
    useEffect(() => {
        if (products.length > 0) {
            // Helper to find image for a specific query
            const findImage = (catLabel, query = '') => {
                const normTarget = catLabel.toLowerCase();
                const p = products.find(p => {
                    const pCatNormalized = normalizeCategory(p.category);
                    const pName = p.name.toLowerCase();

                    // Match normalized category
                    const catMatch = pCatNormalized === normTarget;

                    // Match query if provided
                    const queryMatch = query ? pName.includes(query.toLowerCase()) : true;

                    return catMatch && queryMatch;
                });
                return p ? p.image : null;
            };

            // Define the 6 target categories as requested
            const targets = [
                { label: "SHOES", category: "shoes", defaultImage: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=500&q=60' },
                { label: "WOMEN", category: "women", defaultImage: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=500&q=60' },
                { label: "MEN", category: "men", query: "Classic Mens Shirt", defaultImage: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=500&q=60' },
                { label: "CHILDREN", category: "children", query: "Kids Pajama set", defaultImage: 'https://images.unsplash.com/photo-1621451537084-482c73073a0f?auto=format&fit=crop&w=500&q=60' },
                { label: "BAGS", category: "bags", defaultImage: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=500&q=60' },
                { label: "BEDDINGS", category: "beddings", defaultImage: 'https://images.unsplash.com/photo-1522771753035-0a58223213af?auto=format&fit=crop&w=500&q=60' }
            ];

            const mappedData = targets.map(t => ({
                ...t,
                // Try to find image with specific query first if defined
                image: findImage(t.category, t.query) || t.defaultImage
            }));

            // Group into chunks of 2 for the 2-row layout
            const chunks = [];
            for (let i = 0; i < mappedData.length; i += 2) {
                chunks.push(mappedData.slice(i, i + 2));
            }
            setCategoryGroups(chunks);
        }
    }, [products]);

    // Derived state for filtered products - only show in-stock items
    const specialOffers = products.filter(p => p.isOffer && p.countInStock > 0);
    const newArrivals = products.filter(p => !p.isOffer && p.countInStock > 0);
    const inStockProducts = products.filter(p => p.countInStock > 0);

    const { user } = useAuth();
    const { addToCart, cartCount } = useCart();
    const { wishlist } = useWishlist();

    // Simplified fetching logic to prevent redundant calls
    useFocusEffect(
        React.useCallback(() => {
            fetchProducts();
        }, [])
    );

    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredProducts(inStockProducts);
        } else {
            const filtered = inStockProducts.filter(p =>
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

    const [selectedProductForCart, setSelectedProductForCart] = useState(null);
    const [cartModalVisible, setCartModalVisible] = useState(false);

    const handleAddToCart = useCallback((product) => {
        setSelectedProductForCart(product);
        setCartModalVisible(true);
    }, []);

    const navigateToDetails = useCallback((product, isOffer = false) => {
        navigation.navigate('ProductDetails', { product, isOffer });
    }, [navigation]);

    const executeAddToCart = async (product, qty = 1, color, size) => {
        try {
            const success = await addToCart(product, qty, color, size);
            if (success) {
                Alert.alert('Added to cart', 'The item has been successfully added to the cart. Please proceed to make an order or checkout.', [
                    { text: 'View Cart', onPress: () => { try { navigation.getParent()?.getParent()?.navigate('Cart'); } catch (e) { navigation.navigate('Cart'); } } },
                    { text: 'Continue Shopping', style: 'cancel' }
                ]);
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

    const [titleText, setTitleText] = useState('');
    const fullTitle = "CATEGORIES BY TYPE";

    const [heroText, setHeroText] = useState('');
    const [heroColor, setHeroColor] = useState(COLORS.white);
    const fullHeroTitle = "MINIBOUTIQUE COLLECTION";
    const neonColors = ['#FF0055', '#00FF99', '#00D4FF', '#FFCC00', '#FF00FF', '#8F00FF', '#50FF00', '#FF6600'];

    useEffect(() => {
        let currentText = '';
        let index = 0;
        const timer = setInterval(() => {
            currentText += fullTitle[index];
            setTitleText(currentText);
            index++;
            if (index >= fullTitle.length) clearInterval(timer);
        }, 150);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        let isCancelled = false;

        const typeLoop = async () => {
            while (!isCancelled) {
                // Type in
                let current = '';
                for (let i = 0; i < fullHeroTitle.length; i++) {
                    if (isCancelled) return;
                    current += fullHeroTitle[i];
                    setHeroText(current + (i % 2 === 0 ? '_' : ' ')); // Blinking cursor
                    setHeroColor(neonColors[i % neonColors.length]);
                    await new Promise(r => setTimeout(r, 140));
                }

                setHeroText(fullHeroTitle);
                await new Promise(r => setTimeout(r, 2000)); // Pause at end

                // Reset
                if (!isCancelled) {
                    setHeroText('');
                    await new Promise(r => setTimeout(r, 500));
                }
            }
        };

        typeLoop();
        return () => { isCancelled = true; };
    }, []);

    const { width: windowWidth } = Dimensions.get('window');
    const CARD_WIDTH = (windowWidth - 40) / 2; // Reduced gap for larger images

    const renderCategories = () => {
        return (
            <View style={styles.sectionContainer}>
                <View style={styles.centeredSectionHeader}>
                    <Text style={styles.centeredSectionTitle}>{titleText}</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: 15 }}>
                    {categoryGroups.map((group, colIndex) => (
                        <View key={colIndex} style={{ marginRight: 10 }}>
                            {group.map((item, index) => (
                                <View key={index} style={[styles.categoryCard, { marginTop: index > 0 ? 20 : 0 }]}>
                                    <TouchableOpacity
                                        activeOpacity={0.8}
                                        style={styles.categoryImageContainer}
                                        onPress={() => navigation.navigate('ShopTab', {
                                            screen: 'ShopScreen',
                                            params: {
                                                category: item.category
                                            }
                                        })}
                                    >
                                        <Image source={{ uri: item.image }} style={styles.categoryImage} />
                                    </TouchableOpacity>
                                    <View style={styles.categoryInfo}>
                                        <Text style={styles.categoryName} numberOfLines={1}>{item.label}</Text>
                                        <TouchableOpacity
                                            onPress={() => navigation.navigate('ShopTab', {
                                                screen: 'ShopScreen',
                                                params: {
                                                    category: item.category
                                                },
                                                // This is where the tabBarStyle should be, but it's for the navigator, not a screen param.
                                                // The instruction seems to imply a fix for MainNavigator, not here.
                                                // Keeping the original structure as the instruction's code edit was malformed.
                                            })}
                                        >
                                            <Text style={styles.categoryShopNowText}>SHOP NOW</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))}
                        </View>
                    ))}
                </ScrollView>
            </View>
        );
    };

    const renderNewArrivals = () => {
        // Show all products except maybe strictly offers? Or just all latest
        // For 'New Arrivals', usually we show the latest items. 
        // Let's stick to slicing the main sorted list, but we can prioritize non-offers if needed.
        const displayProducts = inStockProducts.slice(0, 4);
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
                    <FlatList
                        data={inStockProducts}
                        keyExtractor={item => item._id}
                        numColumns={2}
                        columnWrapperStyle={styles.row}
                        initialNumToRender={6}
                        maxToRenderPerBatch={10}
                        windowSize={5}
                        removeClippedSubviews={true}
                        contentContainerStyle={styles.modalContentContainer}
                        renderItem={({ item }) => (
                            <View style={{ width: '48%', marginBottom: 15 }}>
                                <ProductCard
                                    product={item}
                                    onPress={() => {
                                        setShowAllArrivals(false);
                                        navigateToDetails(item);
                                    }}
                                    onAddToCart={handleAddToCart}
                                />
                            </View>
                        )}
                    />
                </SafeAreaView>
            </Modal>
        );
    };

    const renderAllOffersModal = () => {
        // Show all products flagged as offer
        const limitedProducts = specialOffers;
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
                    <FlatList
                        data={limitedProducts}
                        keyExtractor={item => item._id}
                        numColumns={2}
                        columnWrapperStyle={styles.row}
                        initialNumToRender={6}
                        maxToRenderPerBatch={10}
                        windowSize={5}
                        removeClippedSubviews={true}
                        contentContainerStyle={styles.modalContentContainer}
                        renderItem={({ item }) => (
                            <View style={{ width: '48%', marginBottom: 15 }}>
                                <ProductCard
                                    product={item}
                                    onPress={() => {
                                        setShowAllOffers(false);
                                        navigateToDetails(item, true);
                                    }}
                                    onAddToCart={handleAddToCart}
                                    isOffer={true}
                                />
                                <View style={styles.offerBadge}>
                                    <Text style={styles.offerBadgeText}>-5% OFF</Text>
                                </View>
                            </View>
                        )}
                    />
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
                        {specialOffers.slice(0, 2).map((item) => (
                            <View key={item._id} style={{ width: '48%', position: 'relative' }}>
                                <ProductCard
                                    product={item}
                                    onPress={() => navigation.navigate('ProductDetails', { product: item, isOffer: true })}
                                    onAddToCart={handleAddToCart}
                                    isOffer={true}
                                />
                                <View style={styles.offerBadge}>
                                    <Text style={styles.offerBadgeText}>-5% OFF</Text>
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
                    <TouchableOpacity style={styles.socialIcon} onPress={() => Linking.openURL('https://www.facebook.com/')}>
                        <Image source={facebookIcon} style={styles.socialIconImage} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.socialIcon} onPress={() => Linking.openURL('https://www.instagram.com/')}>
                        <Image source={instagramIcon} style={styles.socialIconImage} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.socialIcon} onPress={() => Linking.openURL('https://www.tiktok.com/')}>
                        <Image source={tiktokIcon} style={styles.socialIconImage} />
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
            <View style={styles.searchBarWrapper}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={10}
                >
                    <View style={styles.searchRow}>
                        <TouchableOpacity
                            style={styles.searchBarButton}
                            onPress={() => navigation.navigate('SearchScreen')}
                        >
                            <Search size={20} color={COLORS.textLight} style={styles.searchIcon} />
                            <Text style={styles.searchText}>Search boutique products...</Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </View>

            <ScrollView
                refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
                showsVerticalScrollIndicator={false}
            >
                {/* Hero Section */}
                <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => navigation.navigate('ShopTab')}
                >
                    <ImageBackground
                        source={{ uri: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?auto=format&fit=crop&w=1350&q=80' }}
                        style={styles.heroContainer}
                        resizeMode="cover"
                    >
                        <View style={styles.heroOverlay}>
                            <Text style={[styles.heroTitle, { color: heroColor, textShadowColor: heroColor }]}>{heroText}</Text>
                            <TouchableOpacity
                                style={styles.heroBtn}
                                onPress={() => navigation.navigate('ShopTab')}
                            >
                                <Text style={styles.heroBtnText}>Shop Now</Text>
                            </TouchableOpacity>
                        </View>
                    </ImageBackground>
                </TouchableOpacity>

                {/* New Arrivals Section */}
                <View style={styles.sectionContainer}>
                    {renderSectionHeader('New Arrivals', () => setShowAllArrivals(true))}
                    {renderNewArrivals()}
                </View>

                {/* Special Offers Section */}
                <View style={styles.offersSection}>
                    {renderSectionHeader('Special Offers', () => setShowAllOffers(true), 'View Offers')}
                    <View style={styles.offersContainer}>
                        {/* Display offers horizontally */}
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
                            {specialOffers.slice(0, 4).map((item, index) => (
                                <View key={item._id} style={{ width: CARD_WIDTH, marginRight: 10, position: 'relative' }}>
                                    <ProductCard
                                        product={item}
                                        onPress={() => navigation.navigate('ProductDetails', { product: item, isOffer: true })}
                                        onAddToCart={handleAddToCart}
                                        isOffer={true}
                                    />
                                    <View style={styles.offerBadge}>
                                        <Text style={styles.offerBadgeText}>-5% OFF</Text>
                                    </View>
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                </View>

                {/* Category Section */}
                {renderCategories()}

                {/* Footer Section */}
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
                            <Image source={instagramIcon} style={styles.socialIconImage} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.socialIcon} onPress={() => Linking.openURL('https://www.tiktok.com/@yourpage')}>
                            <Image source={tiktokIcon} style={styles.socialIconImage} />
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

            </ScrollView>

            {renderAllArrivalsModal()}
            {renderAllOffersModal()}
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
    searchBarWrapper: {
        paddingHorizontal: 20,
        paddingBottom: 15,
        backgroundColor: COLORS.white,
    },
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 5,
    },
    searchBarButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        borderRadius: 12,
        paddingHorizontal: 15,
        height: 50,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchText: {
        flex: 1,
        fontSize: 14,
        color: COLORS.textLight,
    },
    headerIconBtn: {
        position: 'relative',
        padding: 5,
        marginLeft: 8,
    },
    badge: {
        position: 'absolute',
        top: 0,
        right: -5,
        backgroundColor: COLORS.error,
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    badgeText: {
        color: COLORS.white,
        fontSize: 10,
        fontWeight: 'bold',
    },
    sectionContainer: {
        paddingTop: 30,
        paddingBottom: 10,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
        paddingHorizontal: 15,
    },
    centeredSectionHeader: {
        width: '100%',
        alignItems: 'center',
        marginBottom: 20,
        marginTop: 10,
    },
    centeredSectionTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.primary,
        letterSpacing: 1.5,
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
        paddingLeft: 10,
        marginBottom: 40,
        backgroundColor: COLORS.white,
        paddingBottom: 20,
    },
    productsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    offersSection: {
        marginBottom: 50,
        marginTop: 10,
    },
    offersContainer: {
        paddingHorizontal: 0,
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
        alignItems: 'center',
        marginTop: 20,
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
        color: '#007AFF',
        fontSize: 12,
        fontWeight: 'bold',
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

    heroContainer: {
        height: 520, // Increased height
        width: '100%',
        marginHorizontal: 0,
        marginBottom: 30,
        justifyContent: 'flex-end',
    },
    heroOverlay: {
        width: '100%',
        height: '100%',
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: 30, // Moved down from 60
        backgroundColor: 'rgba(0,0,0,0.45)', // Darker overlay for better visibility
    },
    heroTitle: {
        fontSize: 34,
        fontWeight: '900',
        marginBottom: 20,
        textAlign: 'center',
        letterSpacing: 3,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 15,
        textShadowColor: 'rgba(255, 255, 255, 0.8)', // Adjusting based on color state
    },
    heroBtn: {
        backgroundColor: COLORS.white,
        paddingHorizontal: 25,
        paddingVertical: 10,
        borderRadius: 25,
    },
    heroBtnText: {
        color: COLORS.primary,
        fontWeight: 'bold',
        fontSize: 14,
        textTransform: 'uppercase',
    },
    modalContentContainer: {
        padding: 15,
    },
    categoryCard: {
        width: 200,
        backgroundColor: COLORS.white,
        borderRadius: 15,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    categoryImageContainer: {
        width: '100%',
        height: 200,
    },
    categoryImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    categoryInfo: {
        padding: 12,
        alignItems: 'center',
    },
    categoryName: {
        color: COLORS.primary,
        fontWeight: 'bold',
        fontSize: 15,
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    categoryShopNowText: {
        color: COLORS.accent,
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 1,
    },
});

export default HomeScreen;
