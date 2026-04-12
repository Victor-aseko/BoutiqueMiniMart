import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Dimensions, TouchableWithoutFeedback } from 'react-native';
import { COLORS, SIZES } from '../theme/theme';
import { User, X, LogIn, ShoppingBag } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const GuestOptionModal = ({ visible, onClose, onLogin, onGuest, title = "Account Required", message = "Login to sync your cart items and addresses, or proceed as a guest for instant checkout." }) => {
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
                        <View style={styles.modalContent}>
                            <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.7}>
                                <X size={22} color={COLORS.textLight} />
                            </TouchableOpacity>

                            <View style={styles.contentBody}>
                                <View style={styles.iconContainer}>
                                    <View style={styles.iconBackground}>
                                        <User size={38} color={COLORS.primary} strokeWidth={2.5} />
                                    </View>
                                </View>

                                <Text style={styles.modalTitle}>{title} 👤</Text>
                                <Text style={styles.modalMessage}>{message}</Text>

                                <View style={styles.buttonGroup}>
                                    <TouchableOpacity 
                                        style={styles.loginBtn} 
                                        onPress={onLogin} 
                                        activeOpacity={0.8}
                                    >
                                        <LogIn size={20} color={COLORS.white} style={styles.btnIcon} />
                                        <Text style={styles.loginBtnText}>Login / Register</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity 
                                        style={styles.guestBtn} 
                                        onPress={onGuest} 
                                        activeOpacity={0.8}
                                    >
                                        <ShoppingBag size={20} color={COLORS.white} style={styles.btnIcon} />
                                        <Text style={styles.guestBtnText}>Proceed as Guest</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity 
                                        style={styles.cancelBtn} 
                                        onPress={onClose}
                                        activeOpacity={0.6}
                                        hitSlop={{ top: 10, bottom: 10, left: 20, right: 20 }}
                                    >
                                        <Text style={styles.cancelBtnText}>Cancel</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
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
        backgroundColor: 'rgba(0, 0, 0, 0.55)', // Adjusted opacity
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: width * 0.88,
        backgroundColor: 'rgba(255, 255, 255, 0.98)', // Subtle opacity to modal background
        borderRadius: 25,
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: '#E3F2FD',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
    },
    closeButton: {
        position: 'absolute',
        right: 18,
        top: 18,
        zIndex: 10,
        padding: 5,
    },
    contentBody: {
        padding: 25,
        alignItems: 'center',
    },
    iconContainer: {
        marginBottom: 15,
        marginTop: 10,
    },
    iconBackground: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#2196F3', // The Blue color
        marginBottom: 10,
        textAlign: 'center',
    },
    modalMessage: {
        fontSize: 16,
        color: COLORS.textLight,
        textAlign: 'center',
        marginBottom: 25,
        lineHeight: 22,
        paddingHorizontal: 10,
    },
    buttonGroup: {
        width: '100%',
        gap: 12,
    },
    loginBtn: {
        width: '100%',
        backgroundColor: COLORS.primary,
        flexDirection: 'row',
        paddingVertical: 15,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loginBtnText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: 'bold',
    },
    guestBtn: {
        width: '100%',
        backgroundColor: '#2196F3', // Specific Blue background
        flexDirection: 'row',
        paddingVertical: 15,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    guestBtnText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: 'bold',
    },
    btnIcon: {
        marginRight: 10,
    },
    cancelBtn: {
        marginTop: 5,
        paddingVertical: 14,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#D1D5DB', // Subtle border
        borderRadius: 15,
        backgroundColor: 'rgba(0, 0, 0, 0.03)', // Slight opacity on the background
    },
    cancelBtnText: {
        color: COLORS.textLight,
        fontSize: 15,
        fontWeight: 'bold', // Made slightly bolder to match new border style
    }
});

export default GuestOptionModal;
