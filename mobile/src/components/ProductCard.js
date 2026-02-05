import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, SIZES } from '../theme/theme';
import { ShoppingCart, Trash2 } from 'lucide-react-native';
import Rating from './Rating';

const ProductCard = ({ product, onPress, onAddToCart, onRemove, style, isOffer = false }) => {
    const originalPrice = Math.floor(Number(product.price));
    const discountedPrice = Math.floor(originalPrice * 0.95); // 5% off

    return (
        <TouchableOpacity style={[styles.container, style]} onPress={onPress} activeOpacity={0.8}>
            <Image source={{ uri: product.image }} style={styles.image} resizeMode="cover" />

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

            <View style={styles.info}>
                <Text style={styles.category}>{product.category}</Text>
                <Text style={styles.name} numberOfLines={1}>{product.name}</Text>

                <View style={styles.row}>
                    {isOffer ? (
                        <View style={styles.priceColumn}>
                            <Text style={styles.offerOldPrice}>Kshs {originalPrice}</Text>
                            <Text style={styles.price}>Kshs {discountedPrice}</Text>
                        </View>
                    ) : (
                        <Text style={styles.price}>Kshs {originalPrice}</Text>
                    )}
                    <Rating rating={product.rating} size={10} />
                </View>

                <TouchableOpacity
                    style={styles.addToCartBtn}
                    onPress={(e) => {
                        e.stopPropagation();
                        if (onAddToCart) {
                            onAddToCart(product);
                        }
                    }}
                >
                    <ShoppingCart color={COLORS.white} size={14} />
                    <Text style={styles.addToCartText}>Add to Cart</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: COLORS.white,
        borderRadius: SIZES.radius,
        width: '100%',
        marginBottom: 10,
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
        height: 240, // More height for premium vertical look
        backgroundColor: '#f9f9f9',
    },
    info: {
        padding: 10,
    },
    category: {
        fontSize: 10,
        color: COLORS.accent,
        textTransform: 'uppercase',
        fontWeight: 'bold',
    },
    name: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
        marginVertical: 4,
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
    }
});

export default React.memo(ProductCard);
