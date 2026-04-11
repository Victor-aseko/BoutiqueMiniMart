import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Dimensions, TouchableWithoutFeedback } from 'react-native';
import { COLORS, SIZES } from '../theme/theme';
import { User, X } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const GuestOptionModal = ({ visible, onClose, onLogin, onGuest, title = "Account Required", message = "Login to sync your cart items, and Addresses, or Proceed as a Guest for Instant Checkout" }) => {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback onPress={() => {}}> 
                        <View style={styles.modalContainer}>
                            <TouchableOpacity style={styles.closeIcon} onPress={onClose} activeOpacity={0.6}>
                                <X size={22} color={COLORS.textLight} />
                            </TouchableOpacity>

                            <View style={styles.iconCircle}>
                                <User size={30} color={COLORS.primary} />
                            </View>

                            <Text style={styles.title}>{title}</Text>
                            <Text style={styles.message}>{message}</Text>

                            <TouchableOpacity style={styles.loginBtn} onPress={onLogin} activeOpacity={0.8}>
                                <Text style={styles.loginText}>Login / Register</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.guestBtn} onPress={onGuest} activeOpacity={0.8}>
                                <Text style={styles.guestText}>Proceed as Guest</Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={styles.cancelBtn} 
                                onPress={onClose}
                                activeOpacity={0.6}
                                hitSlop={{ top: 10, bottom: 10, left: 20, right: 20 }}
                            >
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: width * 0.85,
        backgroundColor: COLORS.white,
        borderRadius: 25,
        padding: 25,
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    closeIcon: {
        position: 'absolute',
        right: 15,
        top: 15,
        padding: 5,
    },
    iconCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: COLORS.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2196F3',
        marginBottom: 10,
        textAlign: 'center',
    },
    message: {
        fontSize: 15,
        color: COLORS.textLight,
        textAlign: 'center',
        marginBottom: 25,
        lineHeight: 22,
    },
    loginBtn: {
        width: '100%',
        backgroundColor: COLORS.primary,
        paddingVertical: 14,
        borderRadius: 15,
        alignItems: 'center',
        marginBottom: 12,
    },
    loginText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: 'bold',
    },
    guestBtn: {
        width: '100%',
        backgroundColor: COLORS.accent,
        paddingVertical: 14,
        borderRadius: 15,
        alignItems: 'center',
        marginBottom: 15,
    },
    guestText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: 'bold',
    },
    cancelBtn: {
        paddingVertical: 10,
    },
    cancelText: {
        color: COLORS.textLight,
        fontSize: 14,
        fontWeight: '500',
    }
});

export default GuestOptionModal;
