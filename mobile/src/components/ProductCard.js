import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { COLORS, SIZES } from '../theme/theme';
import { ShoppingCart, Trash2, ChevronLeft, ChevronRight } from 'lucide-react-native';
import Rating from './Rating';

const ProductCard = ({ product, onPress, onAddToCart, onRemove, style, isOffer = false, hideVariants = false }) => {
    const [selectedVariantIndex, setSelectedVariantIndex] = useState(-1); // -1 means base product
    const pulseAnim = useRef(new Animated.Value(1)).current;



    const colors = product.colors || [];
    // Only show variant navigation if there are multiple colors to cycle between
    const hasVariants = colors.length > 1;

    useEffect(() => {
        if (hasVariants) {
            const startPulse = () => {
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.15,
                        duration: 600,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 600,
                        useNativeDriver: true,
                    }),
                ]).start(() => {
                    // Slight delay before next pulse to keep it elegant
                    setTimeout(() => {
                        if (hasVariants) startPulse();
                    }, 2000);
                });
            };

            // Initial delay before first heartbeat
            const timeoutId = setTimeout(startPulse, 1000);
            return () => clearTimeout(timeoutId);
        }
    }, [hasVariants]);

    // Check if offer is still valid based on date
    const isOfferActive = (p) => {
        if (!p.isOffer) return false;
        if (!p.offerEndDate) return true;
        return new Date(p.offerEndDate) > new Date();
    };

    const onSale = isOfferActive(product) || isOffer;
    const itemPrice = Math.floor(product.price);
    const oldPrice = (onSale && product.originalPrice && product.originalPrice > product.price)
        ? Math.floor(product.originalPrice)
        : itemPrice;
    const discount = product.offerPercentage || (oldPrice > itemPrice ? Math.round(((oldPrice - itemPrice) / oldPrice) * 100) : 0);

    const selectedVariant = selectedVariantIndex >= 0 ? colors[selectedVariantIndex] : null;
    const currentImage = selectedVariant?.image || product.selectedColorForWishlist?.image || product.image;

    const handleNextVariant = (e) => {
        e.stopPropagation();
        if (!hasVariants) return;
        setSelectedVariantIndex(prev => {
            // Index 0 represents the first variant color, which is already the default image.
            // When moving NEXT from default (-1), skip 0 and go to 1.
            const nextIdx = prev === -1 ? 1 : prev + 1;
            // When reaching the end of the colors list, wrap back around to the baseline image (-1) rather than 0.
            return nextIdx >= colors.length ? -1 : nextIdx;
        });
    };

    const handlePrevVariant = (e) => {
        e.stopPropagation();
        if (!hasVariants) return;
        setSelectedVariantIndex(prev => {
            // When moving PREVIOUS from default (-1), jump to the very last color.
            if (prev === -1) return colors.length - 1;

            const prevIdx = prev - 1;
            // If we fall below index 1 (meaning we hit 0), skip it and go back to baseline (-1).
            return prevIdx <= 0 ? -1 : prevIdx;
        });
    };

    return (
        <TouchableOpacity style={[styles.container, style]} onPress={() => onPress && onPress(product, selectedVariant)} activeOpacity={0.8}>
            <View style={styles.imageContainer}>
                <Image source={{ uri: currentImage }} style={styles.image} resizeMode="cover" />

                {/* Hot/Trending Badges */}
                {product.isHotDeal && (
                    <View style={[styles.statusBadge, styles.hotBadge]}>
                        <Text style={styles.statusBadgeText}>HOT DEAL</Text>
                    </View>
                )}
                {product.isTrending && (
                    <View style={[styles.statusBadge, styles.trendingBadge]}>
                        <Text style={styles.statusBadgeText}>TRENDING</Text>
                    </View>
                )}
                {(() => {
                    const baseStatus = (product.colors && product.colors.length > 0) ? product.colors[0].status : null;
                    const variantStatus = selectedVariant?.status || baseStatus;
                    const statusToShow = (variantStatus && variantStatus !== 'In Stock')
                        ? variantStatus
                        : (product.status && product.status !== 'In Stock' ? product.status : null);

                    if (!statusToShow) return null;

                    return (
                        <View style={[
                            styles.statusBadge,
                            statusToShow === 'Sold' ? styles.soldBadge : styles.outOfStockBadge,
                            { top: 40 }
                        ]}>
                            <Text style={styles.statusBadgeText}>{statusToShow.toUpperCase()}</Text>
                        </View>
                    );
                })()}

                {/* Variant Navigation Arrows - Pulse animation to grab attention */}
                {(hasVariants && !hideVariants) && (
                    <Animated.View style={{
                        transform: [{ scale: pulseAnim }],
                        position: 'absolute',
                        bottom: 6,
                        right: selectedVariantIndex < colors.length - 1 ? 10 : undefined,
                        left: selectedVariantIndex < colors.length - 1 ? undefined : 10,
                        zIndex: 10,
                    }}>
                        <TouchableOpacity
                            style={[
                                styles.arrowBtn,
                                selectedVariantIndex < colors.length - 1 ? styles.bottomRightArrow : styles.bottomLeftArrow,
                                { backgroundColor: COLORS.white, borderColor: COLORS.accent, borderWidth: 1.5 }
                            ]}
                            onPress={handleNextVariant}
                            activeOpacity={0.7}
                        >
                            {selectedVariantIndex < colors.length - 1 ? (
                                <ChevronRight size={22} color={COLORS.accent} />
                            ) : (
                                <ChevronLeft size={22} color={COLORS.accent} />
                            )}
                        </TouchableOpacity>

                    </Animated.View>
                )}

                {onRemove && (
                    <TouchableOpacity
                        style={styles.removeBtn}
                        onPress={(e) => {
                            e.stopPropagation();
                            onRemove(product._id);
                        }}
                    >
                        <Trash2 size={16} color={COLORS.error} />
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.info}>
                <Text style={styles.category}>{product.category}</Text>
                <Text style={styles.name} numberOfLines={1}>{product.name}</Text>

                {/* Show saved color and size if they exist */}
                <Text style={[{ fontSize: 11, color: COLORS.textLight, marginBottom: 2 }, !(product.selectedColorForWishlist || product.selectedSizeForWishlist) && { opacity: 0 }]} numberOfLines={1}>
                    {product.selectedColorForWishlist?.name ? `Color: ${product.selectedColorForWishlist.name}` : ''}
                    {product.selectedColorForWishlist?.name && product.selectedSizeForWishlist ? ' | ' : ''}
                    {product.selectedSizeForWishlist ? `Size: ${typeof product.selectedSizeForWishlist === 'string' ? product.selectedSizeForWishlist : (product.selectedSizeForWishlist.name || 'Default')}` : ''}
                    {!(product.selectedColorForWishlist || product.selectedSizeForWishlist) && 'Placeholder'}
                </Text>

                <View style={styles.row}>
                    <View style={styles.priceColumn}>
                        <Text style={[styles.offerOldPrice, !onSale && { opacity: 0 }]}>
                            {onSale ? `Kshs ${oldPrice.toLocaleString()}` : 'Placeholder'}
                        </Text>
                        <Text style={styles.price}>Kshs {itemPrice.toLocaleString()}</Text>
                    </View>
                    <Rating rating={product.rating} size={10} />
                </View>

                {(() => {
                    const isGlobalSold = product.status === 'Sold';
                    const baseStatus = (product.colors && product.colors.length > 0) ? product.colors[0].status : null;
                    const isVariantSold = (selectedVariant?.status || baseStatus) === 'Sold';
                    const isSold = isGlobalSold || isVariantSold;

                    const isGlobalOut = product.status === 'Out of Stock';
                    const isVariantOut = (selectedVariant?.status || baseStatus) === 'Out of Stock';
                    const isOut = isGlobalOut || isVariantOut;

                    const buttonTitle = isGlobalSold ? 'Product Sold' : isVariantSold ? 'Color Sold' : isGlobalOut ? 'Out of Stock' : isVariantOut ? 'Color Out' : 'Add to Cart';

                    return (
                        <TouchableOpacity
                            style={[
                                styles.addToCartBtn,
                                (isSold || isOut) && styles.disabledBtn
                            ]}
                            onPress={(e) => {
                                e.stopPropagation();
                                if (isSold || isOut) return;
                                if (onAddToCart) {
                                    // Pass base variant if none selected explicitly for better defaults
                                    const variantToPass = selectedVariant || (product.colors && product.colors.length > 0 ? product.colors[0] : null);
                                    onAddToCart(product, variantToPass);
                                }
                            }}
                            disabled={isSold || isOut}
                        >
                            <ShoppingCart color={COLORS.white} size={14} />
                            <Text style={styles.addToCartText}>
                                {buttonTitle}
                            </Text>
                        </TouchableOpacity>
                    );
                })()}
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: COLORS.white,
        borderRadius: SIZES.radius,
        width: '100%',
        marginBottom: 1,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: COLORS.border,
        position: 'relative',
    },
    removeBtn: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        padding: 8,
        borderRadius: 20,
        zIndex: 10,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
    },
    image: {
        width: '100%',
        height: 230, // Reduced height
        backgroundColor: '#f9f9f9',
    },
    info: {
        padding: 8, // Reduced from 10
    },
    category: {
        fontSize: 10,
        color: COLORS.accent,
        textTransform: 'uppercase',
        fontWeight: 'bold',
    },
    name: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.text,
        marginVertical: 0, // Reduced from 4
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 5,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: 5,
    },
    price: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.primary,
    },
    priceColumn: {
        flexDirection: 'column',
        justifyContent: 'center',
        minHeight: 22, // Tighter price area
    },
    oldPrice: {
        fontSize: 10,
        color: COLORS.textLight,
        textDecorationLine: 'line-through',
    },
    offerOldPrice: {
        fontSize: 11,
        color: COLORS.error, // Red for offer old price
        textDecorationLine: 'line-through',
        fontWeight: 'bold',
    },
    rating: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    ratingText: {
        fontSize: 12,
        marginLeft: 3,
        color: COLORS.textLight,
    },
    addToCartBtn: {
        backgroundColor: COLORS.accent,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        borderRadius: 8,
        marginTop: 10,
    },
    addToCartText: {
        color: COLORS.white,
        fontSize: 12,
        fontWeight: 'bold',
        marginLeft: 5,
    },
    imageContainer: {
        position: 'relative',
        width: '100%',
        height: 240,
    },
    arrowBtn: {
        position: 'absolute',
        bottom: 5,
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 5,
    },
    bottomLeftArrow: {
        left: 5,
    },
    bottomRightArrow: {
        right: 0,
    },
    statusBadge: {
        position: 'absolute',
        top: 10,
        left: 10,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
        zIndex: 10,
    },
    hotBadge: {
        backgroundColor: '#FF3B30',
    },
    trendingBadge: {
        backgroundColor: '#5856D6',
    },
    soldBadge: {
        backgroundColor: COLORS.error,
    },
    outOfStockBadge: {
        backgroundColor: COLORS.secondary,
    },
    statusBadgeText: {
        color: COLORS.white,
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 1.2,
    },
    disabledBtn: {
        backgroundColor: '#BDC3C7',
    },
});

export default React.memo(ProductCard);
