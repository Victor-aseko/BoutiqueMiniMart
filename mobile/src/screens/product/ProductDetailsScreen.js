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
    TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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

const ProductDetailsScreen = ({ route, navigation }) => {
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
    const { addToWishlist, wishlist } = useWishlist();
    const { addRecentlyViewed } = useRecentlyViewed();

    const handleAddToCart = async () => {
        if (!user) {
            navigation.navigate('Auth');
            return;
        }
        const finalColor = selectedColor?.name || (product.colors && product.colors.length > 0 ? product.colors[0].name : product.color) || 'Default';
        const finalSize = selectedSize || (product.sizes && product.sizes.length > 0 ? product.sizes[0] : product.size) || 'Default';

        const success = await addToCart(product, qty, finalColor, finalSize);
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

    // Add to recently viewed on mount/focus
    useEffect(() => {
        if (product && product._id) {
            addRecentlyViewed(product);
        }
    }, [product && product._id]);

    const toggleFavorite = () => {
        if (!user) {
            navigation.navigate('Auth');
            return;
        }
        const alreadyInWishlist = wishlist.find(p => p._id === product._id);
        if (alreadyInWishlist) {
            Alert.alert('Already in Wishlist');
            return;
        }
        addToWishlist(product);
        setIsFavorite(true);
        Alert.alert('Added to Wishlist!');
    };

    const handleOrderNow = () => {
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
        const finalColor = selectedColor?.name || (product.colors && product.colors.length > 0 ? product.colors[0].name : product.color) || 'Default';
        const finalSize = selectedSize || (product.sizes && product.sizes.length > 0 ? product.sizes[0] : product.size) || 'Default';

        setOrderModalVisible(false);
        navigation.navigate('Orders', {
            screen: 'OrdersScreen',
            params: {
                product,
                qty: orderQty,
                shippingAddress: {
                    ...selectedAddress,
                    phone: phoneNumber
                },
                location: selectedAddress.city,
                color: finalColor,
                size: finalSize,
            }
        });

        // Clear local state
        setSelectedAddress(null);
        setSelectedColor('');
        setSelectedSize('');
        setPhoneNumber('');
        setOrderQty(1);
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
        if (route.params?.selectedAddress) {
            setSelectedAddress(route.params.selectedAddress);
            setPhoneNumber(route.params.selectedAddress.phone || '');
            // Re-open modal if we just came back with an address
            setOrderModalVisible(true);
            // Clear param so it doesn't persist weirdly
            navigation.setParams({ selectedAddress: null });
        }
    }, [route.params?.product, route.params?.selectedAddress]);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ChevronLeft color={COLORS.primary} size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Product Details</Text>
                <View style={styles.headerIcons}>
                    <TouchableOpacity onPress={handleShare} style={styles.iconBtn}>
                        <ShareIcon color={COLORS.primary} size={22} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={toggleFavorite} style={styles.iconBtn}>
                        <Heart color={isFavorite ? COLORS.error : COLORS.primary} size={22} fill={isFavorite ? COLORS.error : 'transparent'} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                <Image source={{ uri: selectedColor?.image || product.image }} style={styles.image} />

                <View style={styles.content}>
                    <View style={styles.metaRow}>
                        <Text style={styles.category}>{product.category}</Text>
                        <View style={styles.ratingBox}>
                            <Rating rating={product.rating} size={14} />
                            <Text style={styles.ratingText}>({product.numReviews} reviews)</Text>
                        </View>
                    </View>
                    {!user?.isAdmin && (
                        <TouchableOpacity style={styles.reviewLink} onPress={() => navigation.navigate('AddReview', { product })}>
                            <Text style={styles.reviewLinkText}>Write a review</Text>
                        </TouchableOpacity>
                    )}

                    <Text style={styles.name}>{product.name}</Text>
                    <View style={styles.brandRow}>
                        <Text style={styles.brandLabel}>Brand:</Text>
                        <Text style={styles.brandValue}>{product.brand || 'Boutique'}</Text>
                    </View>

                    <Text style={styles.price}>Kshs {Number(product.price).toFixed(2)}</Text>

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
                    {(product.colors?.length > 0 || product.sizes?.length > 0) && (
                        <View style={styles.variantsRow}>
                            {/* Color Selection */}
                            {product.colors && product.colors.length > 0 && (
                                <View style={styles.variantSection}>
                                    <Text style={styles.sectionTitle}>Color Variant</Text>
                                    <View style={styles.optionsRow}>
                                        {product.colors.map((c, i) => (
                                            <TouchableOpacity
                                                key={i}
                                                style={[
                                                    styles.colorOptionBtn,
                                                    (selectedColor?.name === c.name || (!selectedColor && i === 0)) && styles.colorOptionBtnSelected
                                                ]}
                                                onPress={() => setSelectedColor(c)}
                                            >
                                                <Image source={{ uri: c.image }} style={styles.colorOptionImg} />
                                                <Text style={[
                                                    styles.optionText,
                                                    (selectedColor?.name === c.name || (!selectedColor && i === 0)) && styles.optionTextSelected
                                                ]}>{c.name}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            )}

                            {/* Size Selection */}
                            {product.sizes && product.sizes.length > 0 && (
                                <View style={styles.variantSection}>
                                    <Text style={styles.sectionTitle}>Select Size</Text>
                                    <View style={styles.optionsRow}>
                                        {product.sizes.map((s, i) => (
                                            <TouchableOpacity
                                                key={i}
                                                style={[
                                                    styles.optionBtn,
                                                    selectedSize === s && styles.optionBtnSelected
                                                ]}
                                                onPress={() => setSelectedSize(s)}
                                            >
                                                <Text style={[
                                                    styles.optionText,
                                                    selectedSize === s && styles.optionTextSelected
                                                ]}>{s}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            )}
                        </View>
                    )}

                    <View style={styles.actionRow}>
                        <View style={styles.qtyContainer}>
                            <Text style={styles.sectionTitle}>Quantity</Text>
                            <View style={styles.qtyPicker}>
                                <TouchableOpacity
                                    style={styles.qtyBtn}
                                    onPress={() => qty > 1 && setQty(qty - 1)}
                                >
                                    <Minus size={20} color={COLORS.primary} />
                                </TouchableOpacity>
                                <Text style={styles.qtyText}>{qty}</Text>
                                <TouchableOpacity
                                    style={styles.qtyBtn}
                                    onPress={() => qty < (product.countInStock || 10) && setQty(qty + 1)}
                                >
                                    <Plus size={20} color={COLORS.primary} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <TouchableOpacity style={styles.wishlistBtn} onPress={toggleFavorite}>
                            <Heart size={20} color={COLORS.accent} fill={isFavorite ? COLORS.accent : 'transparent'} />
                            <Text style={styles.wishlistText}>Add to Wishlist</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <View style={styles.totalBox}>
                    <Text style={styles.totalLabel}>Subtotal</Text>
                    <Text style={styles.totalPrice}>Kshs {(Number(product.price) * qty).toFixed(2)}</Text>
                </View>
                <View style={{ flexDirection: 'row', flex: 2 }}>
                    <MyButton
                        title="Add to Cart"
                        onPress={handleAddToCart}
                        style={[styles.addBtn, { flex: 1, marginRight: 8 }]}
                        icon={<ShoppingBag color="#fff" size={20} />}
                    />
                    <MyButton
                        title="Order Now"
                        onPress={handleOrderNow}
                        style={[styles.addBtn, { flex: 1, marginLeft: 8, backgroundColor: COLORS.accent }]}
                        variant="secondary"
                    />
                </View>
            </View>
            <Modal
                visible={orderModalVisible}
                animationType="slide"
                transparent
                onRequestClose={() => setOrderModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalSheet}>
                        <Image source={{ uri: selectedColor?.image || product.image }} style={styles.modalImage} />
                        <Text style={styles.modalName}>{product.name}</Text>
                        <Text style={styles.modalPrice}>Kshs {(Number(product.price) * orderQty).toFixed(2)}</Text>

                        {/* Color Selection */}
                        <Text style={styles.modalLabel}>Color:</Text>
                        <View style={styles.optionsRow}>
                            {product.colors && product.colors.length > 0 ? (
                                product.colors.map((c, i) => (
                                    <TouchableOpacity
                                        key={i}
                                        style={[
                                            styles.colorOptionBtn,
                                            (selectedColor?.name === c.name || (!selectedColor && i === 0)) && styles.colorOptionBtnSelected
                                        ]}
                                        onPress={() => setSelectedColor(c)}
                                    >
                                        <Image source={{ uri: c.image }} style={styles.colorOptionImg} />
                                        <Text style={[
                                            styles.optionText,
                                            (selectedColor?.name === c.name || (!selectedColor && i === 0)) && styles.optionTextSelected
                                        ]}>{c.name}</Text>
                                    </TouchableOpacity>
                                ))
                            ) : (
                                <Text style={styles.modalValue}>{product.color || 'Default'}</Text>
                            )}
                        </View>

                        {/* Size Selection */}
                        <Text style={styles.modalLabel}>Size:</Text>
                        <View style={styles.optionsRow}>
                            {product.sizes && product.sizes.length > 0 ? (
                                product.sizes.map((s, i) => (
                                    <TouchableOpacity
                                        key={i}
                                        style={[
                                            styles.optionBtn,
                                            selectedSize === s && styles.optionBtnSelected
                                        ]}
                                        onPress={() => setSelectedSize(s)}
                                    >
                                        <Text style={[
                                            styles.optionText,
                                            selectedSize === s && styles.optionTextSelected
                                        ]}>{s}</Text>
                                    </TouchableOpacity>
                                ))
                            ) : (
                                <Text style={styles.modalValue}>{product.size || 'Default'}</Text>
                            )}
                        </View>

                        <View style={styles.modalRow}>
                            <Text style={styles.modalLabel}>Shipping to:</Text>
                            <View style={{ flex: 1, alignItems: 'flex-end' }}>
                                <TouchableOpacity
                                    onPress={() => {
                                        setOrderModalVisible(false);
                                        navigation.navigate('Profile', {
                                            screen: 'AddressScreen',
                                            params: { returnScreen: 'ProductDetails' }
                                        });
                                    }}
                                    style={styles.locationBtn}
                                >
                                    <Text style={styles.locationText}>
                                        {selectedAddress
                                            ? `${selectedAddress.city}, ${selectedAddress.street}`
                                            : (user?.addresses?.length > 0 ? "Select Address" : "Add Address")
                                        }
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.modalRow}>
                            <Text style={styles.modalLabel}>Phone Number:</Text>
                            <View style={{ flex: 1, alignItems: 'flex-end' }}>
                                <View style={styles.phoneInputContainer}>
                                    <Phone size={16} color={COLORS.textLight} style={{ marginRight: 5 }} />
                                    <TextInput
                                        style={styles.phoneInput}
                                        value={phoneNumber}
                                        onChangeText={setPhoneNumber}
                                        placeholder="Enter phone"
                                        keyboardType="phone-pad"
                                    />
                                </View>
                            </View>
                        </View>

                        <View style={styles.modalRow}>
                            <Text style={styles.modalLabel}>Quantity:</Text>
                            <View style={styles.qtyPicker}>
                                <TouchableOpacity style={styles.qtyBtn} onPress={() => orderQty > 1 && setOrderQty(orderQty - 1)}>
                                    <Minus size={20} color={COLORS.primary} />
                                </TouchableOpacity>
                                <Text style={styles.qtyText}>{orderQty}</Text>
                                <TouchableOpacity style={styles.qtyBtn} onPress={() => orderQty < (product.countInStock || 10) && setOrderQty(orderQty + 1)}>
                                    <Plus size={20} color={COLORS.primary} />
                                </TouchableOpacity>
                            </View>
                        </View>
                        <MyButton
                            title="Ok"
                            onPress={handleConfirmOrder}
                            style={styles.modalOkBtn}
                        />
                    </View>
                </View>
            </Modal>
        </SafeAreaView >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 15,
    },
    backBtn: {
        padding: 8,
        backgroundColor: COLORS.background,
        borderRadius: 10,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.primary,
    },
    image: {
        width: '100%',
        height: 350,
        resizeMode: 'cover',
    },
    content: {
        padding: 20,
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        marginTop: -30,
    },
    metaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    category: {
        fontSize: 12,
        color: COLORS.accent,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    ratingBox: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    ratingText: {
        fontSize: 12,
        color: COLORS.textLight,
        marginLeft: 5,
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginBottom: 8,
    },
    price: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.accent,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.primary,
        marginBottom: 10,
    },
    description: {
        fontSize: 15,
        color: COLORS.textLight,
        lineHeight: 22,
        marginBottom: 25,
    },
    headerIcons: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconBtn: {
        marginLeft: 15,
        padding: 5,
    },
    brandRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    brandLabel: {
        fontSize: 14,
        color: COLORS.textLight,
        marginRight: 5,
    },
    brandValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    tagsContainer: {
        marginBottom: 25,
    },
    tagsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    tag: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: COLORS.background,
        borderRadius: 15,
        marginRight: 10,
        marginBottom: 10,
    },
    tagText: {
        fontSize: 12,
        color: COLORS.textLight,
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: 100,
    },
    qtyContainer: {
        flex: 1,
    },
    wishlistBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 10,
        marginBottom: 5,
    },
    wishlistText: {
        marginLeft: 8,
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.accent,
    },
    reviewLink: {
        marginTop: 8,
        marginBottom: 10,
    },
    reviewLinkText: {
        color: COLORS.accent,
        fontWeight: '700',
    },
    qtyPicker: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        borderRadius: 20,
        padding: 2,
        width: 120,
    },
    qtyBtn: {
        padding: 8,
    },
    qtyText: {
        fontSize: 18,
        fontWeight: 'bold',
        paddingHorizontal: 10,
        color: COLORS.primary,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        flexDirection: 'row',
        backgroundColor: COLORS.white,
        padding: 20,
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        alignItems: 'center',
    },
    totalBox: {
        flex: 1,
    },
    totalLabel: {
        fontSize: 12,
        color: COLORS.textLight,
    },
    totalPrice: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    addBtn: {
        flex: 2,
        marginVertical: 0,
        marginLeft: 15,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    modalSheet: {
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 25,
        alignItems: 'center',
    },
    modalImage: {
        width: 120,
        height: 120,
        borderRadius: 15,
        marginBottom: 10,
    },
    modalName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginBottom: 5,
    },
    modalPrice: {
        fontSize: 16,
        color: COLORS.accent,
        marginBottom: 10,
    },
    modalLabel: {
        fontSize: 15,
        color: COLORS.textLight,
        marginBottom: 5,
    },
    modalValue: {
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    modalRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        width: '100%',
        justifyContent: 'space-between',
    },
    locationBtn: {
        backgroundColor: COLORS.background,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    locationText: {
        color: COLORS.primary,
        fontWeight: 'bold',
    },
    modalOkBtn: {
        marginTop: 15,
        width: '100%',
    },
    optionsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 10,
    },
    optionBtn: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 8,
        marginRight: 8,
        marginBottom: 5,
    },
    optionBtnSelected: {
        backgroundColor: COLORS.accent,
        borderColor: COLORS.accent,
    },
    optionText: {
        color: COLORS.text,
        fontSize: 14,
    },
    optionTextSelected: {
        color: COLORS.white,
        fontWeight: 'bold',
    },
    phoneInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        paddingHorizontal: 10,
        borderRadius: 8,
        width: 150,
        height: 35,
    },
    phoneInput: {
        fontSize: 14,
        padding: 0,
    },
    colorOptionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 20,
        marginRight: 10,
        marginBottom: 10,
        backgroundColor: COLORS.white,
    },
    colorOptionBtnSelected: {
        borderColor: COLORS.accent,
        backgroundColor: COLORS.accent + '10',
    },
    colorOptionImg: {
        width: 24,
        height: 24,
        borderRadius: 12,
        marginRight: 8,
    },
    variantsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
        gap: 15,
    },
    variantSection: {
        flex: 1,
    },
});

export default ProductDetailsScreen;
