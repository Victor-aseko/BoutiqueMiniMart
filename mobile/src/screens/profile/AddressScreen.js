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
        if (!user) {
            navigation.navigate('Auth');
        }
    }, [user]);

    const [modalVisible, setModalVisible] = useState(false);
    const [loading, setLoading] = useState(false);

    const [street, setStreet] = useState('');
    const [city, setCity] = useState('');
    const [postalCode, setPostalCode] = useState('');
    const [country, setCountry] = useState('');
    const [phone, setPhone] = useState('');

    const handleAddAddress = async () => {
        if (!street || !city || !postalCode || !country || !phone) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            if (!user) {
                Alert.alert('Error', 'User not logged in');
                return;
            }
            const newAddress = { street, city, postalCode, country, phone };
            const updatedAddresses = [...(user.addresses || []), newAddress];

            const response = await api.put('/auth/profile', { addresses: updatedAddresses });

            // Update local user state
            const updatedUser = { ...user, addresses: response.data.addresses };
            await updateProfile(updatedUser);

            setModalVisible(false);
            setStreet('');
            setCity('');
            setPostalCode('');
            setCountry('');
            setPhone('');
            Alert.alert('Success', 'Address added successfully');
        } catch (err) {
            console.error('Add address error:', err);
            Alert.alert('Error', err.response?.data?.message || err.message || 'Failed to add address');
        } finally {
            setLoading(false);
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
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ChevronLeft color={COLORS.primary} size={28} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Addresses</Text>
                <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addBtnHeader}>
                    <Plus color={COLORS.accent} size={24} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {user?.addresses && user.addresses.length > 0 ? (
                    user.addresses.map((address, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.addressCard}
                            onPress={() => {
                                const returnScreen = route.params?.returnScreen;

                                if (returnScreen === 'OrdersScreen') {
                                    navigation.navigate('Orders', {
                                        screen: 'OrdersScreen',
                                        params: { selectedAddress: address }
                                    });
                                } else if (returnScreen === 'ProductDetails') {
                                    navigation.navigate('MainTabs', {
                                        screen: 'HomeTab',
                                        params: {
                                            screen: 'ProductDetails',
                                            params: {
                                                selectedAddress: address,
                                                isOffer: route.params?.isOffer || false
                                            }
                                        }
                                    });
                                } else {
                                    // Default behavior if not in a specific checkout flow
                                    // Maybe just show details or do nothing
                                }
                            }}
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
                    ))
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

                            <MyInput
                                label="Street"
                                placeholder="123 Boutique St"
                                value={street}
                                onChangeText={setStreet}
                            />
                            <MyInput
                                label="City"
                                placeholder="New York"
                                value={city}
                                onChangeText={setCity}
                            />
                            <MyInput
                                label="Postal Code"
                                placeholder="10001"
                                value={postalCode}
                                onChangeText={setPostalCode}
                                keyboardType="numeric"
                            />
                            <MyInput
                                label="Country"
                                placeholder="USA"
                                value={country}
                                onChangeText={setCountry}
                            />
                            <MyInput
                                label="Phone Number"
                                placeholder="e.g. 0712345678"
                                value={phone}
                                onChangeText={setPhone}
                                keyboardType="phone-pad"
                            />

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
