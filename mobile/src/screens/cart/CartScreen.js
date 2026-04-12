import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Image,
    TouchableOpacity,
    Modal,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Alert } from 'react-native';
import { Trash2, Plus, Minus, ShoppingBag, ChevronLeft, Phone, X } from 'lucide-react-native';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { COLORS, SIZES } from '../../theme/theme';
import MyButton from '../../components/MyButton';
import AuthModal from '../../components/AuthModal';
import GuestOptionModal from '../../components/GuestOptionModal';

const CartScreen = ({ navigation, route }) => {
    const { cartItems, updateCartQty, removeFromCart, cartTotal } = useCart();
    const { user } = useAuth();
    const [authModalVisible, setAuthModalVisible] = useState(false);
    const [guestModalVisible, setGuestModalVisible] = useState(false);
    const [checkoutModalVisible, setCheckoutModalVisible] = useState(false);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [phoneNumber, setPhoneNumber] = useState('');

    useEffect(() => {
        if (route.params?.selectedAddress) {
            setSelectedAddress(route.params.selectedAddress);
            setPhoneNumber(route.params.selectedAddress.phone || '');
            setCheckoutModalVisible(true);
            navigation.setParams({ selectedAddress: null, guestUser: route.params.guestUser });
        }
    }, [route.params?.selectedAddress]);

    const getShippingFee = (city, itemsPrice) => {
        if (!city) return 50; // Default for Nairobi/Unknown
        const c = city.trim().toLowerCase();
        let distance = 250;

        const distances = {
            'nairobi': 0, 'thika': 45, 'kiambu': 15, 'machakos': 65,
            'kajiado': 80, 'naivasha': 90, 'nakuru': 160, 'nyeri': 150,
            'eldoret': 310, 'kisumu': 345, 'mombasa': 485,
        };

        if (distances[c] !== undefined) distance = distances[c];

        let baseFee = 0;
        if (distance === 0) baseFee = 50;
        else if (distance < 100) baseFee = 150;
        else if (distance < 300) baseFee = 250;
        else baseFee = 320;

        const handling = itemsPrice * 0.01;
        return Math.ceil(baseFee + handling);
    };

    const userCity = user?.addresses?.find(a => a.isDefault)?.city || user?.addresses?.[0]?.city || 'Nairobi';
    const shippingPrice = getShippingFee(userCity, cartTotal);
    const finalTotal = cartTotal + shippingPrice;

    const handleProceedToConfirm = React.useCallback(() => {
        if (!selectedAddress && user?.addresses?.length > 0) {
            Alert.alert('Please select a shipping address');
            return;
        }
        if (!selectedAddress && (!user?.addresses || user?.addresses.length === 0)) {
            Alert.alert('Please add a shipping address');
            return;
        }

        console.log('Proceeding to Confirm Orders with items:', cartItems.length);

        navigation.navigate('Orders', {
            screen: 'OrdersScreen',
            params: {
                cartItems: cartItems.map(item => ({
                    product: item.product?._id || item.product,
                    name: item.name,
                    image: item.image,
                    price: item.price,
                    qty: item.qty,
                    color: (typeof item.color === 'string' ? item.color : (item.color?.name || 'Default')),
                    size: (typeof item.size === 'string' ? item.size : (item.size?.name || 'Default')),
                    _id: item._id
                })),
                shippingAddress: {
                    ...selectedAddress,
                    phone: phoneNumber
                },
                location: selectedAddress.city,
                guestUser: route.params?.guestUser || null,
                isFromCart: true
            }
        });

        // Delay closing the modal and clearing state until the navigation transition starts
        setTimeout(() => {
            setCheckoutModalVisible(false);
            setSelectedAddress(null);
            setPhoneNumber('');
        }, 500);
    }, [navigation, cartItems, selectedAddress, phoneNumber, user, route.params?.guestUser]);

    const renderItem = ({ item }) => (
        <View style={styles.cartItem}>
            <Image source={{ uri: item.image }} style={styles.itemImage} />
            <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.itemPrice}>Kshs {Number(item.price).toFixed(2)}</Text>

                {(item.color || item.size) && (
                    <Text style={styles.itemVariant}>
                        {item.color ? `Color: ${typeof item.color === 'string' ? item.color : (item.color.name || 'Default')}` : ''}
                        {item.color && item.size ? ' | ' : ''}
                        {item.size ? `Size: ${typeof item.size === 'string' ? item.size : (item.size.name || 'Default')}` : ''}
                    </Text>
                )}

                <View style={styles.qtyRow}>
                    <View style={styles.qtyPicker}>
                        <TouchableOpacity
                            onPress={() => item.qty > 1 && updateCartQty(item, item.qty - 1)}
                            style={styles.qtyBtn}
                        >
                            <Minus size={16} color={COLORS.primary} />
                        </TouchableOpacity>
                        <Text style={styles.qtyText}>{item.qty}</Text>
                        <TouchableOpacity
                            onPress={() => updateCartQty(item, item.qty + 1)}
                            style={styles.qtyBtn}
                        >
                            <Plus size={16} color={COLORS.primary} />
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity onPress={() => removeFromCart(item.product || item._id)}>
                        <Trash2 size={20} color={COLORS.error} />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    if (cartItems.length === 0) {
        return (
            <SafeAreaView style={styles.centered}>
                <ShoppingBag size={80} color={COLORS.border} />
                <Text style={styles.emptyTitle}>Your cart is empty</Text>
                <Text style={styles.emptySubtitle}>Looks like you haven't added anything yet.</Text>
                <MyButton
                    title="Start Shopping"
                    onPress={() => navigation.navigate('MainTabs', { screen: 'HomeTab' })}
                    style={{ width: '60%', marginTop: 20 }}
                />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Redundant header removed - using Stack header instead */}

            <FlatList
                data={cartItems}
                keyExtractor={(item, index) => item._id || item.product || String(index)}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
            />

            <View style={styles.summary}>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Subtotal</Text>
                    <Text style={styles.summaryValue}>Kshs {cartTotal.toFixed(2)}</Text>
                </View>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Shipping ({userCity})</Text>
                    <Text style={styles.summaryValue}>Kshs {shippingPrice.toFixed(2)}</Text>
                </View>
                <View style={[styles.summaryRow, styles.totalRow]}>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={styles.totalValue}>Kshs {finalTotal.toFixed(2)}</Text>
                </View>

                <TouchableOpacity
                    style={[styles.checkoutBtn, { backgroundColor: COLORS.accent, borderRadius: 12, paddingVertical: 15, alignItems: 'center' }]}
                    onPress={() => {
                        if (!user) {
                            setGuestModalVisible(true);
                        } else {
                            setCheckoutModalVisible(true);
                        }
                    }}
                >
                    <Text style={{ color: COLORS.white, fontWeight: 'bold', fontSize: 16 }}>Checkout</Text>
                </TouchableOpacity>
            </View>

            <GuestOptionModal
                visible={guestModalVisible}
                onClose={() => setGuestModalVisible(false)}
                onLogin={() => {
                    setGuestModalVisible(false);
                    setAuthModalVisible(true);
                }}
                onGuest={() => {
                    setGuestModalVisible(false);
                    setCheckoutModalVisible(true);
                }}
            />

            <AuthModal
                visible={authModalVisible}
                onClose={() => setAuthModalVisible(false)}
                onAuthSuccess={() => setCheckoutModalVisible(true)}
                navigation={navigation}
                redirectTo={null}
            />

            {/* Cart Checkout Modal (Address Collection) */}
            <Modal
                visible={checkoutModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setCheckoutModalVisible(false)}
            >
                <View style={checkoutStyles.modalContainer}>
                    <KeyboardAvoidingView 
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={checkoutStyles.modalContentWrapper}
                    >
                        <View style={checkoutStyles.modalContent}>
                            <View style={checkoutStyles.modalHeader}>
                                <Text style={checkoutStyles.modalTitle}>Checkout Details</Text>
                                <TouchableOpacity onPress={() => setCheckoutModalVisible(false)}>
                                    <X size={24} color={COLORS.textLight} />
                                </TouchableOpacity>
                            </View>
                            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                                <View style={{ marginBottom: 15 }}>
                                    {cartItems.map((item, index) => (
                                        <View key={index} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, backgroundColor: COLORS.background, padding: 8, borderRadius: 12 }}>
                                            <Image source={{ uri: item.image }} style={{ width: 50, height: 50, borderRadius: 8, marginRight: 10 }} />
                                            <View style={{ flex: 1 }}>
                                                <Text style={{ fontSize: 13, fontWeight: 'bold', color: COLORS.primary }} numberOfLines={1}>{item.name}</Text>
                                                <Text style={{ fontSize: 12, color: COLORS.accent, fontWeight: 'bold' }}>Kshs {item.price}</Text>
                                                <Text style={{ fontSize: 11, color: COLORS.textLight }}>
                                                    Qty: {item.qty} 
                                                    {item.color ? ` • ${typeof item.color === 'string' ? item.color : (item.color?.name || 'Default')}` : ''}
                                                    {item.size ? ` • ${typeof item.size === 'string' ? item.size : (item.size?.name || 'Default')}` : ''}
                                                </Text>
                                            </View>
                                        </View>
                                    ))}
                                </View>

                                <View style={checkoutStyles.modalRow}>
                                    <Text style={checkoutStyles.modalLabel}>Shipping to:</Text>
                                    <View style={{ flex: 1, alignItems: 'flex-end' }}>
                                        <TouchableOpacity
                                            onPress={() => {
                                                setCheckoutModalVisible(false);
                                                const currentTab = navigation.getParent()?.getState()?.routes[navigation.getParent()?.getState()?.index]?.name || 'HomeTab';
                                                navigation.navigate('Profile', {
                                                    screen: 'AddressScreen',
                                                    params: {
                                                        returnScreen: 'CartScreen',
                                                        returnTab: currentTab,
                                                        cartItems: cartItems
                                                    }
                                                });
                                            }}
                                            style={checkoutStyles.locationBtn}
                                        >
                                            <Text style={checkoutStyles.locationText} numberOfLines={1}>
                                                {selectedAddress
                                                    ? `${selectedAddress.city}, ${selectedAddress.street}`
                                                    : (user?.addresses?.length > 0 ? "Select Address" : "Add Address")
                                                }
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <View style={checkoutStyles.modalRow}>
                                    <Text style={checkoutStyles.modalLabel}>Phone Number:</Text>
                                    <View style={{ flex: 1, alignItems: 'flex-end' }}>
                                        <View style={checkoutStyles.phoneInputContainer}>
                                            <Phone size={16} color={COLORS.textLight} style={{ marginRight: 5 }} />
                                            <TextInput
                                                style={checkoutStyles.phoneInput}
                                                value={phoneNumber}
                                                onChangeText={setPhoneNumber}
                                                placeholder="Enter phone"
                                                keyboardType="phone-pad"
                                            />
                                        </View>
                                    </View>
                                </View>

                                <View style={styles.summaryRow}>
                                    <Text style={styles.summaryLabel}>Cart Total</Text>
                                    <Text style={styles.summaryValue}>Kshs {finalTotal.toFixed(2)}</Text>
                                </View>

                                <MyButton
                                    title="Confirm Order"
                                    onPress={handleProceedToConfirm}
                                    style={checkoutStyles.modalOkBtn}
                                />
                            </ScrollView>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </Modal>
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
        padding: 20,
        backgroundColor: COLORS.background,
    },
    header: {
        padding: 20,
        backgroundColor: COLORS.white,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.primary,
        flex: 1,
        textAlign: 'center',
    },
    backBtn: { padding: 8, marginRight: 8 },
    itemCount: {
        color: COLORS.textLight,
    },
    list: {
        padding: 15,
    },
    cartItem: {
        flexDirection: 'row',
        backgroundColor: COLORS.white,
        borderRadius: SIZES.radius,
        padding: 12,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    itemImage: {
        width: 90,
        height: 90,
        borderRadius: 10,
        backgroundColor: '#eee',
    },
    itemInfo: {
        flex: 1,
        marginLeft: 15,
        justifyContent: 'space-between',
    },
    itemName: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.primary,
    },
    itemPrice: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.accent,
    },
    itemVariant: {
        fontSize: 12,
        color: COLORS.textLight,
        marginTop: 2,
    },
    qtyRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    qtyPicker: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        borderRadius: 8,
    },
    qtyBtn: {
        padding: 5,
        paddingHorizontal: 8,
    },
    qtyText: {
        fontSize: 14,
        fontWeight: 'bold',
        paddingHorizontal: 8,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginTop: 20,
    },
    emptySubtitle: {
        fontSize: 15,
        color: COLORS.textLight,
        textAlign: 'center',
        marginTop: 10,
    },
    summary: {
        backgroundColor: COLORS.white,
        padding: 20,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    summaryLabel: {
        color: COLORS.textLight,
        fontSize: 14,
    },
    summaryValue: {
        color: COLORS.primary,
        fontWeight: '600',
    },
    totalRow: {
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    totalLabel: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    totalValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.accent,
    },
    checkoutBtn: {
        marginTop: 20,
    }
});

const checkoutStyles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContentWrapper: {
        width: '100%',
        maxHeight: '85%',
        flexShrink: 1,
    },
    modalContent: {
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 20,
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
        flexShrink: 1,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    modalRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    modalLabel: {
        fontSize: 15,
        color: COLORS.text,
        fontWeight: '600',
        width: 100,
    },
    locationBtn: {
        backgroundColor: COLORS.background,
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 20,
        maxWidth: 200,
        borderWidth: 1,
        borderColor: COLORS.accent,
    },
    locationText: {
        color: COLORS.accent,
        fontWeight: 'bold',
        fontSize: 13,
    },
    phoneInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
        maxWidth: 200,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    phoneInput: {
        flex: 1,
        height: 24,
        padding: 0,
        color: COLORS.text,
        fontSize: 14,
    },
    modalOkBtn: {
        marginTop: 20,
        borderRadius: 15,
    }
});

export default CartScreen;
