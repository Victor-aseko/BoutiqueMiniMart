import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    Modal,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Plus, MapPin, Trash2, Home, Briefcase } from 'lucide-react-native';
import { COLORS, SIZES } from '../../theme/theme';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import MyInput from '../../components/MyInput';
import MyButton from '../../components/MyButton';

const AddressScreen = ({ navigation, route }) => {
    const insets = useSafeAreaInsets();
    const { user, updateProfile } = useAuth();

    useEffect(() => {
        // Guest mode support: Don't redirect if returnScreen is provided (checkout flow)
        if (!user && !route.params?.returnScreen) {
            const timer = setTimeout(() => {
                navigation.navigate('Auth');
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [user, route.params?.returnScreen]);

    const [modalVisible, setModalVisible] = useState(false);
    const [loading, setLoading] = useState(false);

    const [street, setStreet] = useState('');
    const [city, setCity] = useState('');
    const [postalCode, setPostalCode] = useState('');
    const [country, setCountry] = useState('Kenya');
    const [phone, setPhone] = useState('');
    const [guestEmail, setGuestEmail] = useState('');
    const [guestName, setGuestName] = useState('');
    const [guestAddresses, setGuestAddresses] = useState([]);

    const handleAddAddress = async () => {
        if (!street || !city || !phone || (!user && (!guestEmail || !guestName))) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        setLoading(true);
        if (!user) {
            // Guest mode: Local state
            const newAddress = {
                street,
                city,
                postalCode,
                country,
                phone,
                name: guestName,
                email: guestEmail
            };
            setGuestAddresses(prev => [...prev, newAddress]);

            setLoading(false);
            Alert.alert('Success', 'Address added successfully');
            setModalVisible(false);
            setStreet('');
            setCity('');
            setPhone('');
            setGuestName('');
            setGuestEmail('');
            return;
        }

        setLoading(true);
        try {
            const newAddress = { street, city, postalCode, country, phone };
            const updatedAddresses = [...(user.addresses || []), newAddress];

            const response = await api.put('/auth/profile', { addresses: updatedAddresses });

            // Update local user state
            const updatedUser = { ...user, addresses: response.data.addresses };
            await updateProfile(updatedUser);

            setModalVisible(false);
            setStreet('');
            setCity('');
            setPhone('');
            Alert.alert('Success', 'Address added successfully');
        } catch (err) {
            console.error('Add address error:', err);
            Alert.alert('Error', err.response?.data?.message || err.message || 'Failed to add address');
        } finally {
            setLoading(false);
        }
    };

    const handleReturn = (address) => {
        const returnScreen = route.params?.returnScreen;

        if (returnScreen === 'OrdersScreen') {
            navigation.navigate('Orders', {
                screen: 'OrdersScreen',
                params: {
                    selectedAddress: address,
                    guestUser: !user ? { name: address.name, email: address.email, phone: address.phone } : null,
                    // Pass through all received order params
                    product: route.params?.product,
                    qty: route.params?.qty,
                    color: route.params?.color,
                    size: route.params?.size,
                    price: route.params?.price,
                    location: route.params?.location,
                    shippingAddress: route.params?.shippingAddress,
                    cartItems: route.params?.cartItems,
                    isFromCart: route.params?.isFromCart
                }
            });
        } else if (returnScreen === 'CartScreen') {
            navigation.navigate('Cart', {
                screen: 'CartScreen',
                params: {
                    selectedAddress: address,
                    guestUser: !user ? { name: address.name, email: address.email } : null,
                    cartItems: route.params?.cartItems
                }
            });
        } else if (returnScreen === 'ProductDetails') {
            navigation.navigate('MainTabs', {
                screen: route.params?.returnTab || 'HomeTab',
                params: {
                    screen: 'ProductDetails',
                    params: {
                        selectedAddress: address,
                        guestUser: !user ? { name: address.name, email: address.email, phone: address.phone } : null,
                        isOffer: route.params?.isOffer || false,
                        product: route.params?.product,
                        selectedColor: route.params?.selectedColor,
                        selectedSize: route.params?.selectedSize
                    }
                }
            });
        }
    };

    const handleDeleteAddress = async (index) => {
        Alert.alert(
            'Delete Address',
            'Are you sure you want to delete this address?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            if (!user) return;
                            const updatedAddresses = (user.addresses || []).filter((_, i) => i !== index);
                            const response = await api.put('/auth/profile', { addresses: updatedAddresses });
                            await updateProfile({ ...user, addresses: response.data.addresses });
                        } catch (err) {
                            Alert.alert('Error', 'Failed to delete address');
                        }
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => {
                        if (navigation.canGoBack()) {
                            navigation.goBack();
                        } else {
                            navigation.navigate('ProfileScreen');
                        }
                    }}
                    style={styles.backBtn}
                >
                    <ChevronLeft color={COLORS.primary} size={28} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Addresses</Text>
                <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addBtnHeader}>
                    <Plus color={COLORS.accent} size={24} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {((user?.addresses && user.addresses.length > 0) || (guestAddresses.length > 0)) ? (
                    <>
                        {user?.addresses?.map((address, index) => (
                            <TouchableOpacity
                                key={`user-${index}`}
                                style={styles.addressCard}
                                onPress={() => handleReturn(address)}
                            >
                                <View style={styles.addressInfo}>
                                    <View style={styles.iconContainer}>
                                        <MapPin size={24} color={COLORS.accent} />
                                    </View>
                                    <View style={styles.details}>
                                        <Text style={styles.street}>{address.street}</Text>
                                        <Text style={styles.city}>{address.city}, {address.postalCode}</Text>
                                        <Text style={styles.country}>{address.country}</Text>
                                    </View>
                                </View>
                                <TouchableOpacity onPress={() => handleDeleteAddress(index)}>
                                    <Trash2 size={20} color={COLORS.error} />
                                </TouchableOpacity>
                            </TouchableOpacity>
                        ))}
                        {/* Only show guest addresses if NOT logged in to avoid duplicates */}
                        {!user && guestAddresses.map((address, index) => (
                            <TouchableOpacity
                                key={`guest-${index}`}
                                style={styles.addressCard}
                                onPress={() => handleReturn(address)}
                            >
                                <View style={styles.addressInfo}>
                                    <View style={styles.iconContainer}>
                                        <MapPin size={24} color={COLORS.accent} />
                                    </View>
                                    <View style={styles.details}>
                                        <Text style={styles.street}>{address.street}</Text>
                                        <Text style={styles.city}>{address.city}</Text>
                                        <Text style={styles.phone}>{address.phone}</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </>
                ) : (
                    <View style={styles.empty}>
                        <MapPin size={60} color={COLORS.border} />
                        <Text style={styles.emptyText}>No addresses found</Text>
                        <MyButton
                            title="Add New Address"
                            onPress={() => setModalVisible(true)}
                            style={styles.emptyBtn}
                        />
                    </View>
                )}
            </ScrollView>

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                >
                    <View style={styles.modalContent}>
                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: 40 + insets.bottom }}
                        >
                            <Text style={styles.modalTitle}>Add New Address</Text>

                            {!user && (
                                <>
                                    <MyInput
                                        label="Full Name"
                                        placeholder="Enter your name"
                                        value={guestName}
                                        onChangeText={setGuestName}
                                    />
                                    <MyInput
                                        label="Email Address"
                                        placeholder="email@example.com"
                                        value={guestEmail}
                                        onChangeText={setGuestEmail}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                    />
                                </>
                            )}

                            <MyInput
                                label="Street / Apartment"
                                placeholder="123 Mt. View, Apt 4B"
                                value={street}
                                onChangeText={setStreet}
                            />
                            <MyInput
                                label="City / Town"
                                placeholder="e.g. Nairobi, Nakuru"
                                value={city}
                                onChangeText={setCity}
                            />
                            <MyInput
                                label="Phone Number"
                                placeholder="e.g. 0712345678"
                                value={phone}
                                onChangeText={setPhone}
                                keyboardType="phone-pad"
                            />

                            <View style={[styles.row, { display: 'none' }]}>
                                <MyInput
                                    label="Postal Code"
                                    placeholder="10001"
                                    value={postalCode}
                                    onChangeText={setPostalCode}
                                    keyboardType="numeric"
                                />
                                <MyInput
                                    label="Country"
                                    placeholder="Kenya"
                                    value={country}
                                    onChangeText={setCountry}
                                />
                            </View>

                            <View style={styles.modalActions}>
                                <TouchableOpacity
                                    style={[styles.modalBtn, styles.cancelBtn]}
                                    onPress={() => setModalVisible(false)}
                                >
                                    <Text style={styles.cancelBtnText}>Cancel</Text>
                                </TouchableOpacity>
                                <MyButton
                                    title="Save Address"
                                    onPress={handleAddAddress}
                                    loading={loading}
                                    style={[styles.modalBtn, styles.saveBtn]}
                                />
                            </View>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 15,
        backgroundColor: COLORS.white,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 110,
    },
    addressCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        padding: 15,
        borderRadius: 12,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    addressInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        backgroundColor: COLORS.background,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    street: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    city: {
        fontSize: 14,
        color: COLORS.textLight,
    },
    phone: {
        fontSize: 14,
        color: COLORS.textLight,
        marginTop: 2,
    },
    country: {
        fontSize: 14,
        color: COLORS.textLight,
    },
    empty: {
        alignItems: 'center',
        marginTop: 100,
    },
    emptyText: {
        marginTop: 10,
        color: COLORS.textLight,
    },
    emptyBtn: {
        marginTop: 20,
        width: 200,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        padding: 25,
        maxHeight: '80%',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginBottom: 20,
        textAlign: 'center',
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    modalBtn: {
        flex: 1,
    },
    cancelBtn: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelBtnText: {
        color: COLORS.textLight,
        fontWeight: 'bold',
    },
    saveBtn: {
        marginLeft: 15,
        marginVertical: 0,
    }
});

export default AddressScreen;
