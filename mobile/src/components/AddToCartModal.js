import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    Modal,
    ScrollView,
    Platform
} from 'react-native';
import { Minus, Plus, X } from 'lucide-react-native';
import { COLORS, SIZES } from '../theme/theme';
import MyButton from './MyButton';

const AddToCartModal = ({ visible, onClose, product, onAddToCart }) => {
    const [qty, setQty] = useState(1);
    const [selectedColor, setSelectedColor] = useState(null);
    const [selectedSize, setSelectedSize] = useState('');

    // Reset state when product or visibility changes
    useEffect(() => {
        if (visible && product) {
            setQty(1);
            // Default select first options if available to save user clicks
            if (product.colors && product.colors.length > 0) {
                setSelectedColor(product.colors[0]);
            } else {
                setSelectedColor(null);
            }
            if (product.sizes && product.sizes.length > 0) {
                setSelectedSize(product.sizes[0]);
            } else {
                setSelectedSize('');
            }
        }
    }, [visible, product]);

    if (!product) return null;

    const handleConfirm = () => {
        const finalColor = selectedColor?.name || (product.colors && product.colors.length > 0 ? product.colors[0].name : product.color) || 'Default';
        const finalSize = selectedSize || (product.sizes && product.sizes.length > 0 ? product.sizes[0] : product.size) || 'Default';

        // Apply discount if it's an offer to ensure cart gets correct price
        const finalPrice = product.isOffer
            ? Math.floor(Number(product.price) * 0.95)
            : Number(product.price);

        const productToAdd = {
            ...product,
            price: finalPrice
        };

        onAddToCart(productToAdd, qty, finalColor, finalSize);
        onClose();
    };

    // Calculate price for display
    const displayPrice = product.isOffer
        ? Math.floor(Number(product.price) * 0.95)
        : Math.floor(Number(product.price));

    const total = displayPrice * qty;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Handle bar for visual cue */}
                    <View style={styles.handle} />

                    <View style={styles.content}>
                        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                            <X size={24} color={COLORS.textLight} />
                        </TouchableOpacity>

                        <View style={styles.headerRow}>
                            <Image
                                source={{ uri: selectedColor?.image || product.image }}
                                style={styles.image}
                                resizeMode="cover"
                            />
                            <View style={styles.productInfo}>
                                <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
                                <Text style={styles.price}>Kshs {displayPrice.toLocaleString()}</Text>
                                {product.isOffer && (
                                    <Text style={styles.offerBadge}>5% OFF Applied</Text>
                                )}
                            </View>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                            {/* Color Selection */}
                            {(product.colors && product.colors.length > 0) && (
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>Select Color: <Text style={styles.selectedVal}>{selectedColor?.name}</Text></Text>
                                    <View style={styles.optionsRow}>
                                        {product.colors.map((c, i) => (
                                            <TouchableOpacity
                                                key={i}
                                                style={[
                                                    styles.colorOption,
                                                    selectedColor?.name === c.name && styles.selectedOption
                                                ]}
                                                onPress={() => setSelectedColor(c)}
                                            >
                                                <Image source={{ uri: c.image }} style={styles.colorImg} />
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            )}

                            {/* Size Selection */}
                            {(product.sizes && product.sizes.length > 0) && (
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>Select Size: <Text style={styles.selectedVal}>{selectedSize}</Text></Text>
                                    <View style={styles.optionsRow}>
                                        {product.sizes.map((s, i) => (
                                            <TouchableOpacity
                                                key={i}
                                                style={[
                                                    styles.sizeOption,
                                                    selectedSize === s && styles.selectedOption
                                                ]}
                                                onPress={() => setSelectedSize(s)}
                                            >
                                                <Text style={[
                                                    styles.sizeText,
                                                    selectedSize === s && styles.selectedSizeText
                                                ]}>{s}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            )}

                            {/* Quantity */}
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Quantity</Text>
                                <View style={styles.qtyRow}>
                                    <View style={styles.qtyContainer}>
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
                                    <Text style={styles.subtotal}>Total: Kshs {total.toLocaleString()}</Text>
                                </View>
                            </View>

                        </ScrollView>

                        <MyButton
                            title="Add to Cart"
                            onPress={handleConfirm}
                            style={styles.addBtn}
                        />

                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    container: {
        backgroundColor: COLORS.white,
        //backgroundColor:'rgba(234, 231, 231, 0.94)',
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        paddingBottom: Platform.OS === 'ios' ? 30 : 15,
        maxHeight: '80%',

    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: '#E5E7EB',
        borderRadius: 2,
        alignSelf: 'center',
        marginTop: 8,
    },
    content: {
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 10,
    },
    closeBtn: {
        position: 'absolute',
        right: 15,
        top: 10,
        zIndex: 10,
        padding: 5,
    },
    headerRow: {
        alignItems: 'center',
        marginBottom: 10,
    },
    image: {
        width: 100,
        height: 100,
        borderRadius: 15,
        backgroundColor: '#F3F4F6',
        marginBottom: 8,
    },
    productInfo: {
        alignItems: 'center',
    },
    name: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginBottom: 4,
        textAlign: 'center',
    },
    price: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.accent,
        marginBottom: 2,
    },
    offerBadge: {
        fontSize: 12,
        color: COLORS.success,
        fontWeight: '600',
        marginTop: 0,
    },
    scrollContent: {
        paddingBottom: 10,
        flexGrow: 0,
    },
    section: {
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textLight,
        marginBottom: 8,
    },
    selectedVal: {
        color: COLORS.primary,
        fontWeight: 'bold',
    },
    optionsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
    },
    colorOption: {
        padding: 2,
        borderWidth: 2,
        borderColor: 'transparent',
        borderRadius: 20,
        margin: 5,
    },
    selectedOption: {
        borderColor: COLORS.accent,
    },
    colorImg: {
        width: 36,
        height: 36,
        borderRadius: 18,
    },
    sizeOption: {
        minWidth: 50,
        height: 36,
        paddingHorizontal: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 8,
        margin: 4,
        backgroundColor: COLORS.white,
    },
    sizeText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.textLight,
    },
    selectedSizeText: {
        color: COLORS.accent,
    },
    qtyRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
    },
    qtyContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        borderRadius: 20,
        paddingHorizontal: 5,
        paddingVertical: 4,
    },
    qtyBtn: {
        padding: 8,
        borderRadius: 16,
        backgroundColor: COLORS.white,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
    },
    qtyText: {
        fontSize: 16,
        fontWeight: 'bold',
        marginHorizontal: 12,
        color: COLORS.primary,
    },
    subtotal: {
        fontSize: 15,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    addBtn: {
        marginTop: 5,
        paddingVertical: 12,
        borderRadius: 12,
    }
});

export default AddToCartModal;
