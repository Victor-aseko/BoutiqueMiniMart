import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    Image,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Platform,
    Modal,
    TextInput,
    KeyboardAvoidingView,
    Dimensions
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, Plus, Minus, ShoppingBag, Heart, Share as ShareIcon, Phone } from 'lucide-react-native';
import api from '../../services/api';
import { useFocusEffect } from '@react-navigation/native';
import { Share, Alert } from 'react-native';
import { COLORS, SIZES } from '../../theme/theme';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useWishlist } from '../../context/WishlistContext';
import { useRecentlyViewed } from '../../context/RecentlyViewedContext';
import MyButton from '../../components/MyButton';
import Rating from '../../components/Rating';
import AuthModal from '../../components/AuthModal';
import GuestOptionModal from '../../components/GuestOptionModal';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const ProductDetailsScreen = ({ route, navigation }) => {
    // Helper to check if an offer is still valid based on its end date
    const isOfferActive = (p) => {
        if (!p.isOffer) return false;
        if (!p.offerEndDate) return true;
        return new Date(p.offerEndDate) > new Date();
    };

    const insets = useSafeAreaInsets();
    const initialProduct = route.params?.product;
    const [product, setProduct] = useState(initialProduct || {});
    const [qty, setQty] = useState(1);
    const [isFavorite, setIsFavorite] = useState(false);
    const [orderModalVisible, setOrderModalVisible] = useState(false);
    const [orderQty, setOrderQty] = useState(1);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [selectedColor, setSelectedColor] = useState(null); // { name, image }
    const [selectedSize, setSelectedSize] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const { addToCart } = useCart();
    const { user } = useAuth();
    const [authModalVisible, setAuthModalVisible] = useState(false);
    const [guestModalVisible, setGuestModalVisible] = useState(false);
    const { addToWishlist, wishlist } = useWishlist();
    const { addRecentlyViewed } = useRecentlyViewed();

    // Handle initial selection from route params (passed from ProductCard)
    useEffect(() => {
        if (route.params?.selectedColor) {
            setSelectedColor(route.params.selectedColor);
        } else if (product.selectedColorForWishlist) {
            setSelectedColor(product.selectedColorForWishlist);
        } else if (product.colors && product.colors.length > 0) {
            setSelectedColor(product.colors[0]);
        }

        if (route.params?.selectedSize) {
            setSelectedSize(route.params.selectedSize);
        } else if (product.selectedSizeForWishlist) {
            setSelectedSize(product.selectedSizeForWishlist);
        } else if (product.sizes && product.sizes.length > 0) {
            const firstSize = typeof product.sizes[0] === 'string' ? product.sizes[0] : product.sizes[0].name;
            setSelectedSize(firstSize);
        }
    }, [route.params?.selectedColor, route.params?.selectedSize, product._id]);

    const handleAddToCart = async () => {
        // Find color-specific size first, then global
        let currentSizeObj = product.sizes?.find(s => (typeof s === 'string' ? s : s.name) === selectedSize && s.color === selectedColor?.name);
        if (!currentSizeObj) {
            currentSizeObj = product.sizes?.find(s => (typeof s === 'string' ? s : s.name) === selectedSize && !s.color);
        }

        const isSizeSold = typeof currentSizeObj === 'object' && currentSizeObj.status === 'Sold';
        const isSizeOut = typeof currentSizeObj === 'object' && currentSizeObj.status === 'Out of Stock';

        const isColorSold = selectedColor?.status === 'Sold';
        const isColorOut = selectedColor?.status === 'Out of Stock';

        const finalSold = product.status === 'Sold' || isColorSold || isSizeSold;
        const finalOut = product.status === 'Out of Stock' || isColorOut || isSizeOut;

        if (finalSold || finalOut) {
            Alert.alert('Not Available', `Sorry, this item (${selectedColor?.name || ''} ${selectedSize || ''}) is currently ${finalSold ? 'sold' : 'out of stock'}.`);
            return;
        }
        const finalColor = (selectedColor?.name || (product.colors && product.colors.length > 0 ? product.colors[0].name : product.color) || 'Default').toString();
        const finalColorImage = selectedColor?.image || (product.colors && product.colors.length > 0 ? product.colors[0].image : product.image);

        const defaultSize = product.sizes && product.sizes.length > 0
            ? (typeof product.sizes[0] === 'string' ? product.sizes[0] : product.sizes[0].name)
            : product.size;
        const finalSize = (selectedSize || defaultSize || 'Default').toString();

        const currentPrice = (route.params?.isOffer || isOfferActive(product))
            ? Math.floor(Number(product.price))
            : (product.originalPrice ? Math.floor(Number(product.originalPrice)) : Math.floor(Number(product.price)));

        const productToAdd = {
            ...product,
            image: finalColorImage,
            price: currentPrice,
            size: finalSize, // Ensure string
            color: finalColor // Ensure string
        };

        const success = await addToCart(productToAdd, qty, finalColor, finalSize);
        if (success) {
            Alert.alert('Added to cart', 'The item has been successfully added to the cart. Please proceed to make an order or checkout.', [
                { text: 'View Cart', onPress: () => { try { navigation.getParent()?.getParent()?.navigate('Cart'); } catch (e) { navigation.navigate('Cart'); } } },
                { text: 'Continue Shopping', style: 'cancel' }
            ]);
        }
    };

    const handleShare = async () => {
        try {
            await Share.share({
                message: `Check out this ${product.name} at BoutiqueMiniMart! Price: Kshs ${Number(product.price).toFixed(2)}`,
                url: product.image,
                title: product.name
            });
        } catch (error) {
            console.log(error.message);
        }
    };

    // Sync size when color changes to ensure the selected size is valid for the new color
    useEffect(() => {
        if (!product || !selectedColor) return;

        const filteredSizes = product.sizes?.filter(s => !s.color || s.color === selectedColor.name) || [];
        const isCurrentSizeValid = filteredSizes.some(s => (typeof s === 'string' ? s : s.name) === selectedSize);

        if (!isCurrentSizeValid && filteredSizes.length > 0) {
            const firstValidSize = typeof filteredSizes[0] === 'string' ? filteredSizes[0] : filteredSizes[0].name;
            setSelectedSize(firstValidSize);
        }
    }, [selectedColor?.name, product.sizes]);

    // Add to recently viewed on mount/focus
    useEffect(() => {
        if (product && product._id) {
            addRecentlyViewed(product);
        }
    }, [product && product._id]);

    const toggleFavorite = () => {
        const alreadyInWishlist = wishlist.find(p => p._id === product._id);
        if (alreadyInWishlist) {
            Alert.alert('Already in Wishlist');
            return;
        }

        const productForWishlist = {
            ...product,
            selectedColorForWishlist: selectedColor,
            selectedSizeForWishlist: selectedSize
        };

        addToWishlist(productForWishlist);
        setIsFavorite(true);
        Alert.alert('Added to Wishlist!');
    };

    const handleOrderNow = () => {
        // Find color-specific size first, then global
        let currentSizeObj = product.sizes?.find(s => (typeof s === 'string' ? s : s.name) === selectedSize && s.color === selectedColor?.name);
        if (!currentSizeObj) {
            currentSizeObj = product.sizes?.find(s => (typeof s === 'string' ? s : s.name) === selectedSize && !s.color);
        }

        const isSizeSold = typeof currentSizeObj === 'object' && currentSizeObj.status === 'Sold';
        const isSizeOut = typeof currentSizeObj === 'object' && currentSizeObj.status === 'Out of Stock';

        const isColorSold = selectedColor?.status === 'Sold';
        const isColorOut = selectedColor?.status === 'Out of Stock';

        const finalSold = product.status === 'Sold' || isColorSold || isSizeSold;
        const finalOut = product.status === 'Out of Stock' || isColorOut || isSizeOut;

        if (finalSold || finalOut) {
            Alert.alert('Not Available', `Sorry, this item (${selectedColor?.name || ''} ${selectedSize || ''}) is currently ${finalSold ? 'sold' : 'out of stock'}.`);
            return;
        }
        if (!user) {
            setGuestModalVisible(true);
        } else {
            setOrderModalVisible(true);
        }
    };

    const handleAuthSuccess = () => {
        setOrderModalVisible(true);
    };

    const handleConfirmOrder = () => {
        if (!selectedAddress && user?.addresses?.length > 0) {
            Alert.alert('Please select a shipping address');
            return;
        }
        if (!selectedAddress && (!user?.addresses || user?.addresses.length === 0)) {
            Alert.alert('Please add a shipping address');
            return;
        }

        // Check for sold status before confirming
        const isGlobalSold = product.status === 'Sold';
        const isColorSold = selectedColor?.status === 'Sold';

        let currentSizeObj = product.sizes?.find(s => (typeof s === 'string' ? s : s.name) === selectedSize && s.color === selectedColor?.name);
        if (!currentSizeObj) {
            currentSizeObj = product.sizes?.find(s => (typeof s === 'string' ? s : s.name) === selectedSize && !s.color);
        }
        const isSizeSold = typeof currentSizeObj === 'object' && currentSizeObj.status === 'Sold';

        if (isGlobalSold || isColorSold || isSizeSold) {
            Alert.alert('Not Available', 'Sorry, this color/size selection is sold out. Please select another option.');
            return;
        }
        const finalColor = (selectedColor?.name || (product.colors && product.colors.length > 0 ? product.colors[0].name : product.color) || 'Default').toString();
        const finalSize = (selectedSize || (product.sizes && product.sizes.length > 0 ? (typeof product.sizes[0] === 'string' ? product.sizes[0] : product.sizes[0].name) : product.size) || 'Default').toString();

        const currentPrice = (route.params?.isOffer || isOfferActive(product))
            ? Math.floor(Number(product.price))
            : (product.originalPrice ? Math.floor(Number(product.originalPrice)) : Math.floor(Number(product.price)));

        const finalColorImage = selectedColor?.image || (product.colors && product.colors.length > 0 ? product.colors[0].image : product.image);

        navigation.navigate('Orders', {
            screen: 'OrdersScreen',
            params: {
                product: { ...product, image: finalColorImage, price: currentPrice },
                qty: orderQty,
                shippingAddress: {
                    ...selectedAddress,
                    phone: phoneNumber
                },
                location: selectedAddress.city,
                color: finalColor,
                size: finalSize,
                price: currentPrice, // Pass price explicitly too
                guestUser: route.params?.guestUser || null
            }
        });

        // Delay closing the modal and clearing state until the navigation transition starts
        setTimeout(() => {
            setOrderModalVisible(false);
            setSelectedAddress(null);
            setSelectedColor(null);
            setSelectedSize('');
            setPhoneNumber('');
            setOrderQty(1);
        }, 500);
    };

    // refresh product when screen focused to reflect new reviews/ratings
    useFocusEffect(
        useCallback(() => {
            let isActive = true;
            const load = async () => {
                try {
                    if (product && product._id) {
                        const resp = await api.get(`/products/${product._id}`);
                        if (isActive) setProduct(resp.data);
                    }
                } catch (e) {
                    // ignore
                }
            };
            load();
            return () => { isActive = false; };
        }, [route.params?.product?._id])
    );

    // If route params include a product object, keep local product in sync so counts update
    useEffect(() => {
        if (route.params?.product) {
            setProduct(route.params.product);
        }
        if (route.params?.selectedColor) {
            setSelectedColor(route.params.selectedColor);
        }
        if (route.params?.selectedSize) {
            setSelectedSize(route.params.selectedSize);
        }
        if (route.params?.selectedAddress) {
            setSelectedAddress(route.params.selectedAddress);
            setPhoneNumber(route.params.selectedAddress.phone || '');
            // Re-open modal if we just came back with an address
            setOrderModalVisible(true);
            // Clear param so it doesn't persist weirdly
            navigation.setParams({ selectedAddress: null, guestUser: route.params.guestUser });
        }
    }, [route.params?.product, route.params?.selectedAddress]);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
                    <ChevronLeft color={COLORS.primary} size={24} />
                </TouchableOpacity>
                <View style={styles.headerIcons}>
                    <TouchableOpacity onPress={handleShare} style={styles.headerBtn}>
                        <ShareIcon color={COLORS.primary} size={20} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={toggleFavorite} style={[styles.headerBtn, { marginLeft: 10 }]}>
                        <Heart color={isFavorite ? COLORS.error : COLORS.primary} size={20} fill={isFavorite ? COLORS.error : 'transparent'} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                <View style={styles.imageContainer}>
                    <Image source={{ uri: selectedColor?.image || product.image }} style={styles.image} resizeMode="contain" />
                    {(() => {
                        const currentStatus = selectedColor?.status && selectedColor?.status !== 'In Stock'
                            ? selectedColor.status
                            : (product.status && product.status !== 'In Stock' ? product.status : null);

                        if (!currentStatus) return null;

                        return (
                            <View style={[styles.statusBadge, currentStatus === 'Sold' ? styles.soldBadge : styles.outOfStockBadge]}>
                                <Text style={styles.statusBadgeText}>{currentStatus.toUpperCase()}</Text>
                            </View>
                        );
                    })()}
                </View>

                <View style={styles.content}>
                    <View style={styles.topRow}>
                        <Text style={styles.category}>{product.category}</Text>
                        <TouchableOpacity style={styles.ratingBox} onPress={() => navigation.navigate('AddReview', { product })}>
                            <Rating rating={product.rating} size={14} />
                            <Text style={styles.ratingText}>{product.rating || 0} ({product.numReviews} Reviews)</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.name}>{product.name}</Text>
                    <View style={styles.brandRow}>
                        <Text style={styles.brandLabel}>Brand:</Text>
                        <Text style={styles.brandValue}>{product.brand || 'Boutique'}</Text>
                    </View>

                    <View style={styles.priceContainer}>
                        <View style={{ flex: 1 }}>
                            {isOfferActive(product) && product.originalPrice > product.price ? (
                                <>
                                    <Text style={styles.offerOldPrice}>Kshs {Math.floor(Number(product.originalPrice))}</Text>
                                    <Text style={styles.price}>Kshs {Math.floor(Number(product.price))} <Text style={styles.offTxt}>({product.offerPercentage || Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF)</Text></Text>
                                </>
                            ) : (
                                <Text style={styles.price}>Kshs {product.originalPrice ? Math.floor(Number(product.originalPrice)) : Math.floor(Number(product.price))}</Text>
                            )}
                        </View>
                        {product.status && product.status !== 'In Stock' && (
                            <View style={[
                                styles.statusDetailBadge,
                                { backgroundColor: product.status === 'Sold' ? COLORS.error : COLORS.secondary }
                            ]}>
                                <Text style={styles.statusDetailBadgeText}>{product.status.toUpperCase()}</Text>
                            </View>
                        )}
                    </View>

                    <Text style={styles.sectionTitle}>Description</Text>
                    <Text style={styles.description}>{product.description}</Text>

                    <View style={styles.tagsContainer}>
                        <Text style={styles.sectionTitle}>Tags</Text>
                        <View style={styles.tagsRow}>
                            {['Fashion', 'Premium', 'New'].map((tag, i) => (
                                <View key={i} style={styles.tag}>
                                    <Text style={styles.tagText}>#{tag}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Color and Size Selection Row */}
                    {/* Variant Selections */}
                    <View style={styles.variantsContainer}>
                        {product.colors && product.colors.length > 0 && (
                            <View style={styles.variantSection}>
                                <Text style={styles.sectionTitle}>Color</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionsScroll}>
                                    {product.colors.map((c, i) => (
                                        <TouchableOpacity
                                            key={i}
                                            style={[
                                                styles.colorChip,
                                                (selectedColor?.name === c.name || (!selectedColor && i === 0)) && styles.colorChipSelected,
                                                (c.status === 'Sold' || c.status === 'Out of Stock') && { opacity: 0.5 }
                                            ]}
                                            onPress={() => setSelectedColor(c)}
                                        >
                                            <Image source={{ uri: c.image }} style={styles.colorChipImg} />
                                            <Text style={[
                                                styles.chipText,
                                                (selectedColor?.name === c.name || (!selectedColor && i === 0)) && styles.chipTextSelected
                                            ]}>{c.name}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        )}

                        {product.sizes && product.sizes.length > 0 && (
                            <View style={styles.variantSection}>
                                <Text style={styles.sectionTitle}>Size</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionsScroll}>
                                    {product.sizes
                                        .filter(s => !s.color || s.color === (selectedColor?.name || product.colors?.[0]?.name))
                                        .map((s, i) => {
                                            const sizeName = typeof s === 'string' ? s : s.name;
                                            const isSold = typeof s === 'object' && s.status === 'Sold';
                                            return (
                                                <TouchableOpacity
                                                    key={i}
                                                    style={[
                                                        styles.sizeChip,
                                                        selectedSize === sizeName && styles.sizeChipSelected,
                                                        isSold && { opacity: 0.5, borderColor: COLORS.error }
                                                    ]}
                                                    onPress={() => setSelectedSize(sizeName)}
                                                >
                                                    <Text style={[
                                                        styles.chipText,
                                                        selectedSize === sizeName && styles.chipTextSelected,
                                                        isSold && { color: COLORS.error }
                                                    ]}>{sizeName}</Text>
                                                </TouchableOpacity>
                                            )
                                        })}
                                </ScrollView>
                            </View>
                        )}
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.actionRow}>
                        <View style={styles.qtyContainer}>
                            <Text style={styles.smallTitle}>Quantity</Text>
                            <View style={styles.qtyPicker}>
                                <TouchableOpacity style={styles.qtyBtn} onPress={() => qty > 1 && setQty(qty - 1)}>
                                    <Minus size={18} color={COLORS.primary} />
                                </TouchableOpacity>
                                <Text style={styles.qtyText}>{qty}</Text>
                                <TouchableOpacity style={styles.qtyBtn} onPress={() => qty < (product.countInStock || 10) && setQty(qty + 1)}>
                                    <Plus size={18} color={COLORS.primary} />
                                </TouchableOpacity>
                            </View>
                        </View>
                        <TouchableOpacity style={styles.wishlistBtn} onPress={toggleFavorite}>
                            <Heart size={20} color={isFavorite ? COLORS.error : COLORS.textLight} fill={isFavorite ? COLORS.error : 'transparent'} />
                            <Text style={[styles.wishlistText, isFavorite && { color: COLORS.error }]}>
                                {isFavorite ? 'In Wishlist' : 'Wishlist'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <View style={styles.totalBox}>
                    <Text style={styles.totalLabel}>Subtotal</Text>
                    <Text style={styles.totalPrice}>Kshs {
                        (isOfferActive(product) ? Math.floor(Number(product.price)) : (product.originalPrice ? Math.floor(Number(product.originalPrice)) : Math.floor(Number(product.price)))) * qty
                    }</Text>
                </View>
                <View style={{ flexDirection: 'row', flex: 2 }}>
                    {(() => {
                        let currentSize = product.sizes?.find(s => (typeof s === 'string' ? s : s.name) === selectedSize && s.color === selectedColor?.name);
                        if (!currentSize) {
                            currentSize = product.sizes?.find(s => (typeof s === 'string' ? s : s.name) === selectedSize && !s.color);
                        }
                        const isSizeSold = typeof currentSize === 'object' && currentSize.status === 'Sold';
                        const isSizeOut = typeof currentSize === 'object' && currentSize.status === 'Out of Stock';

                        const isColorSold = selectedColor?.status === 'Sold';
                        const isColorOut = selectedColor?.status === 'Out of Stock';

                        const isGlobalSold = product.status === 'Sold';
                        const isGlobalOut = product.status === 'Out of Stock';

                        const finalSold = isGlobalSold || isColorSold || isSizeSold;
                        const finalOut = isGlobalOut || isColorOut || isSizeOut;

                        const buttonTitle = isGlobalSold ? "Product Sold" : isColorSold ? "Color Sold" : isSizeSold ? "Size Sold" : isGlobalOut ? "Out of Stock" : isColorOut ? "Color Out" : isSizeOut ? "Size Out" : "Add to Cart";

                        return (
                            <MyButton
                                title={buttonTitle}
                                onPress={handleAddToCart}
                                style={[
                                    styles.addBtn,
                                    { flex: 1.2, marginRight: 5, paddingVertical: 10 },
                                    (finalSold || finalOut) && styles.disabledBtn
                                ]}
                                icon={(!finalSold && !finalOut) ? <ShoppingBag color="#fff" size={20} /> : null}
                                disabled={finalSold || finalOut}
                            />
                        );
                    })()}
                    {(() => {
                        let currentSize = product.sizes?.find(s => (typeof s === 'string' ? s : s.name) === selectedSize && s.color === selectedColor?.name);
                        if (!currentSize) {
                            currentSize = product.sizes?.find(s => (typeof s === 'string' ? s : s.name) === selectedSize && !s.color);
                        }
                        const isSizeSold = typeof currentSize === 'object' && currentSize.status === 'Sold';
                        const isSizeOut = typeof currentSize === 'object' && currentSize.status === 'Out of Stock';

                        const isColorSold = selectedColor?.status === 'Sold';
                        const isColorOut = selectedColor?.status === 'Out of Stock';

                        const isGlobalSold = product.status === 'Sold';
                        const isGlobalOut = product.status === 'Out of Stock';

                        const finalSold = isGlobalSold || isColorSold || isSizeSold;
                        const finalOut = isGlobalOut || isColorOut || isSizeOut;

                        if (!finalSold && !finalOut) return (
                            <MyButton
                                title="Order Now"
                                onPress={handleOrderNow}
                                style={[styles.addBtn, { flex: 1, marginLeft: 5, backgroundColor: COLORS.accent, paddingVertical: 10 }]}
                                variant="secondary"
                            />
                        );
                        return null;
                    })()}
                </View>
            </View>
            <Modal
                visible={orderModalVisible}
                animationType="slide"
                transparent
                onRequestClose={() => setOrderModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={{ width: '100%', justifyContent: 'flex-end' }}
                    >
                        <View style={styles.modalSheet}>
                            <View style={styles.modalHandle} />

                            <View style={styles.modalHeaderCompact}>
                                <Image source={{ uri: selectedColor?.image || product.image }} style={styles.modalImageCompact} />
                                <View style={styles.modalHeaderInfo}>
                                    <Text style={styles.modalNameCompact} numberOfLines={2}>{product.name}</Text>
                                    <Text style={styles.modalPriceCompact}>Kshs {
                                        (isOfferActive(product) ? Math.floor(Number(product.price)) : (product.originalPrice ? Math.floor(Number(product.originalPrice)) : Math.floor(Number(product.price)))) * orderQty
                                    }</Text>
                                </View>
                            </View>

                            <ScrollView
                                style={{ width: '100%', maxHeight: SIZES.height * 0.6 }}
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={{ paddingBottom: 40 + insets.bottom }}
                            >
                                {/* Compact Selections */}
                                <View style={styles.compactSelectionGrid}>
                                    <View style={styles.compactSelectionItem}>
                                        <Text style={styles.modalLabelSmall}>Color</Text>
                                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                            {product.colors && product.colors.length > 0 ? (
                                                product.colors.map((c, i) => (
                                                    <TouchableOpacity
                                                        key={i}
                                                        style={[
                                                            styles.compactChip,
                                                            (selectedColor?.name === c.name || (!selectedColor && i === 0)) && styles.compactChipSelected
                                                        ]}
                                                        onPress={() => setSelectedColor(c)}
                                                    >
                                                        <Text style={[styles.compactChipText, (selectedColor?.name === c.name || (!selectedColor && i === 0)) && styles.compactChipTextSelected]}>{c.name}</Text>
                                                    </TouchableOpacity>
                                                ))
                                            ) : <Text style={styles.modalValueSmall}>{product.color || 'Default'}</Text>}
                                        </ScrollView>
                                    </View>

                                    <View style={styles.compactSelectionItem}>
                                        <Text style={styles.modalLabelSmall}>Size</Text>
                                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                            {product.sizes && product.sizes.length > 0 ? (
                                                product.sizes
                                                    .filter(s => !s.color || s.color === (selectedColor?.name || product.colors?.[0]?.name))
                                                    .map((s, i) => {
                                                        const sizeName = typeof s === 'string' ? s : s.name;
                                                        return (
                                                            <TouchableOpacity
                                                                key={i}
                                                                style={[styles.compactChip, selectedSize === sizeName && styles.compactChipSelected]}
                                                                onPress={() => setSelectedSize(sizeName)}
                                                            >
                                                                <Text style={[styles.compactChipText, selectedSize === sizeName && styles.compactChipTextSelected]}>{sizeName}</Text>
                                                            </TouchableOpacity>
                                                        )
                                                    })
                                            ) : <Text style={styles.modalValueSmall}>{typeof product.size === 'string' ? product.size : (product.size?.name || 'Default')}</Text>}
                                        </ScrollView>
                                    </View>
                                </View>

                                <View style={styles.compactDivider} />

                                <View style={styles.modalRowCompact}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.modalLabelSmall}>Shipping Address</Text>
                                        <TouchableOpacity
                                            onPress={() => {
                                                setOrderModalVisible(false);
                                                const currentTab = navigation.getParent()?.getState()?.routes[navigation.getParent()?.getState()?.index]?.name || 'HomeTab';
                                                navigation.navigate('Profile', {
                                                    screen: 'AddressScreen',
                                                    params: {
                                                        returnScreen: 'ProductDetails',
                                                        returnTab: currentTab,
                                                        isOffer: route.params?.isOffer || false,
                                                        product: product,
                                                        selectedColor: selectedColor,
                                                        selectedSize: selectedSize
                                                    }
                                                });
                                            }}
                                            style={styles.locationBtnCompact}
                                        >
                                            <Text style={styles.locationTextCompact} numberOfLines={1}>
                                                {selectedAddress ? `${selectedAddress.city}, ${selectedAddress.street}` : (user?.addresses?.length > 0 ? "Select Address" : "Add Address")}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <View style={styles.modalRowCompact}>
                                    <View style={{ flex: 1, marginRight: 10 }}>
                                        <Text style={styles.modalLabelSmall}>Phone</Text>
                                        <View style={styles.phoneInputCompact}>
                                            <TextInput
                                                style={styles.phoneInputTextCompact}
                                                value={phoneNumber}
                                                onChangeText={setPhoneNumber}
                                                placeholder="Enter phone"
                                                keyboardType="phone-pad"
                                            />
                                        </View>
                                    </View>
                                    <View style={{ flex: 0.6 }}>
                                        <Text style={styles.modalLabelSmall}>Qty</Text>
                                        <View style={styles.qtyPickerCompact}>
                                            <TouchableOpacity style={styles.qtyBtnSmall} onPress={() => orderQty > 1 && setOrderQty(orderQty - 1)}>
                                                <Minus size={16} color={COLORS.primary} />
                                            </TouchableOpacity>
                                            <Text style={styles.qtyTextSmall}>{orderQty}</Text>
                                            <TouchableOpacity style={styles.qtyBtnSmall} onPress={() => orderQty < (product.countInStock || 10) && setOrderQty(orderQty + 1)}>
                                                <Plus size={16} color={COLORS.primary} />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>

                                <MyButton
                                    title="Confirm Order"
                                    onPress={handleConfirmOrder}
                                    style={styles.modalOkBtnCompact}
                                />
                            </ScrollView>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </Modal>

            <GuestOptionModal
                visible={guestModalVisible}
                onClose={() => setGuestModalVisible(false)}
                onLogin={() => {
                    setGuestModalVisible(false);
                    setAuthModalVisible(true);
                }}
                onGuest={() => {
                    setGuestModalVisible(false);
                    setOrderModalVisible(true);
                }}
            />

            <AuthModal
                visible={authModalVisible}
                onClose={() => setAuthModalVisible(false)}
                onAuthSuccess={handleAuthSuccess}
                navigation={navigation}
                redirectTo={{
                    tab: 'Orders',
                    screen: 'OrdersScreen',
                    params: {
                        product: {
                            ...product,
                            image: selectedColor?.image || (product.colors && product.colors.length > 0 ? product.colors[0].image : product.image),
                            price: route.params?.isOffer ? Math.floor(Number(product.price)) : product.price
                        },
                        qty: qty,
                        color: (selectedColor?.name || (product.colors && product.colors.length > 0 ? product.colors[0].name : product.color) || 'Default').toString(),
                        size: (selectedSize || (product.sizes && product.sizes.length > 0 ? (typeof product.sizes[0] === 'string' ? product.sizes[0] : product.sizes[0].name) : product.size) || 'Default').toString(),
                        price: route.params?.isOffer ? Math.floor(Number(product.price)) : product.price
                    }
                }}
            />
        </SafeAreaView >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    header: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 50 : 20,
        left: 0,
        right: 0,
        zIndex: 100,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
    },
    headerBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    imageContainer: {
        width: SCREEN_WIDTH,
        height: 450,
        backgroundColor: '#f7f7f7',
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        overflow: 'hidden',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    statusBadge: {
        position: 'absolute',
        top: 110,
        left: 20,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    soldBadge: { backgroundColor: COLORS.error },
    outOfStockBadge: { backgroundColor: COLORS.secondary },
    statusBadgeText: {
        color: COLORS.white,
        fontSize: 11,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    content: {
        flex: 1,
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        marginTop: -25,
        padding: 25,
        paddingTop: 30,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 10,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    category: {
        fontSize: 11,
        fontWeight: '800',
        color: COLORS.accent,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    ratingBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    ratingText: {
        fontSize: 11,
        fontWeight: '600',
        color: COLORS.textLight,
        marginLeft: 5,
    },
    name: {
        fontSize: 24,
        fontWeight: '800',
        color: COLORS.primary,
        marginBottom: 8,
        lineHeight: 30,
    },
    brandRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    brandLabel: {
        fontSize: 13,
        color: COLORS.textLight,
        marginRight: 4,
    },
    brandValue: {
        fontSize: 13,
        fontWeight: '700',
        color: COLORS.primary,
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 25,
    },
    price: {
        fontSize: 28,
        fontWeight: '900',
        color: COLORS.primary,
    },
    offerOldPrice: {
        fontSize: 16,
        color: COLORS.error,
        textDecorationLine: 'line-through',
        marginRight: 8,
        fontWeight: '700',
    },
    offTxt: {
        fontSize: 14,
        color: COLORS.success,
        fontWeight: '700',
        marginLeft: 5,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: COLORS.primary,
        marginBottom: 12,
    },
    smallTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: COLORS.primary,
        marginBottom: 6,
    },
    description: {
        fontSize: 14,
        color: '#666',
        lineHeight: 22,
        marginBottom: 25,
    },
    variantsContainer: {
        marginBottom: 25,
    },
    variantSection: {
        marginBottom: 15,
    },
    optionsScroll: {
        flexDirection: 'row',
        marginHorizontal: -25,
        paddingHorizontal: 25,
    },
    colorChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 25,
        borderWidth: 1.5,
        borderColor: COLORS.border,
        marginRight: 10,
        backgroundColor: COLORS.white,
    },
    colorChipSelected: {
        borderColor: COLORS.accent,
        backgroundColor: '#FFF5F7',
    },
    colorChipImg: {
        width: 24,
        height: 24,
        borderRadius: 12,
        marginRight: 8,
    },
    sizeChip: {
        minWidth: 50,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: COLORS.border,
        marginRight: 10,
        backgroundColor: COLORS.white,
    },
    sizeChipSelected: {
        borderColor: COLORS.accent,
        backgroundColor: COLORS.accent,
    },
    chipText: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.text,
    },
    chipTextSelected: {
        color: COLORS.white,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.border,
        marginBottom: 20,
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    qtyContainer: {
        flex: 1,
    },
    qtyPicker: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        borderRadius: 25,
        width: 110,
        justifyContent: 'space-between',
    },
    qtyBtn: {
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
    },
    qtyText: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.primary,
    },
    wishlistBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 10,
    },
    wishlistText: {
        marginLeft: 6,
        fontSize: 13,
        fontWeight: '700',
        color: COLORS.textLight,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        flexDirection: 'row',
        backgroundColor: COLORS.white,
        paddingHorizontal: 20,
        paddingTop: 15,
        paddingBottom: Platform.OS === 'ios' ? 35 : 20,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
    },
    totalBox: {
        marginRight: 15,
    },
    totalLabel: {
        fontSize: 10,
        color: COLORS.textLight,
        textTransform: 'uppercase',
        fontWeight: '700',
    },
    totalPrice: {
        fontSize: 18,
        fontWeight: '900',
        color: COLORS.primary,
    },
    addBtn: {
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    disabledBtn: {
        backgroundColor: '#eee',
    },
    statusDetailBadge: {
        marginLeft: 10,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
    },
    statusDetailBadgeText: {
        color: COLORS.white,
        fontSize: 10,
        fontWeight: '800',
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    modalSheet: {
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 35,
        borderTopRightRadius: 35,
        padding: 20,
    },
    modalHandle: {
        width: 35,
        height: 4,
        backgroundColor: '#E0E0E0',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 15,
    },
    modalHeaderCompact: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        backgroundColor: COLORS.background,
        padding: 12,
        borderRadius: 15,
    },
    modalImageCompact: {
        width: 70,
        height: 70,
        borderRadius: 12,
        marginRight: 15,
    },
    modalHeaderInfo: {
        flex: 1,
    },
    modalNameCompact: {
        fontSize: 15,
        fontWeight: '700',
        color: COLORS.primary,
        marginBottom: 4,
    },
    modalPriceCompact: {
        fontSize: 16,
        fontWeight: '800',
        color: COLORS.accent,
    },
    compactSelectionGrid: {
        marginBottom: 15,
    },
    compactSelectionItem: {
        marginBottom: 12,
    },
    modalLabelSmall: {
        fontSize: 12,
        fontWeight: '700',
        color: COLORS.textLight,
        marginBottom: 6,
        textTransform: 'uppercase',
    },
    compactChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
        backgroundColor: COLORS.background,
        marginRight: 8,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    compactChipSelected: {
        backgroundColor: '#FFF5F7',
        borderColor: COLORS.accent,
    },
    compactChipText: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.text,
    },
    compactChipTextSelected: {
        color: COLORS.accent,
        fontWeight: '700',
    },
    modalValueSmall: {
        fontSize: 13,
        fontWeight: '700',
        color: COLORS.primary,
    },
    compactDivider: {
        height: 1,
        backgroundColor: COLORS.border,
        marginVertical: 15,
    },
    modalRowCompact: {
        flexDirection: 'row',
        marginBottom: 15,
        alignItems: 'flex-end',
    },
    locationBtnCompact: {
        backgroundColor: COLORS.background,
        padding: 10,
        borderRadius: 12,
        marginTop: 4,
    },
    locationTextCompact: {
        fontSize: 13,
        color: COLORS.primary,
        fontWeight: '600',
    },
    phoneInputCompact: {
        backgroundColor: COLORS.background,
        paddingHorizontal: 12,
        borderRadius: 12,
        height: 40,
        justifyContent: 'center',
        marginTop: 4,
    },
    phoneInputTextCompact: {
        fontSize: 13,
        color: COLORS.primary,
        fontWeight: '600',
        padding: 0,
    },
    qtyPickerCompact: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        borderRadius: 12,
        height: 40,
        justifyContent: 'space-between',
        paddingHorizontal: 5,
        marginTop: 4,
    },
    qtyBtnSmall: {
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    qtyTextSmall: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.primary,
    },
    modalOkBtnCompact: {
        marginTop: 10,
        height: 50,
        borderRadius: 25,
    },
    tagsContainer: {
        marginBottom: 25,
    },
    tagsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    tag: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        backgroundColor: COLORS.background,
        borderRadius: 10,
        marginRight: 8,
        marginBottom: 8,
    },
    tagText: {
        fontSize: 11,
        color: COLORS.textLight,
    },
});

export default ProductDetailsScreen;
