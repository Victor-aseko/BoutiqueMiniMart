import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Dimensions, TouchableWithoutFeedback } from 'react-native';
import { COLORS, SIZES } from '../theme/theme';
import { User, X, LogIn, ExternalLink } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const GuestOptionModal = ({ visible, onClose, onLogin, onGuest, title = "Account Required", message = "Login to sync your cart items and addresses, or proceed as a guest for instant checkout." }) => {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback onPress={() => {}}> 
                        <View style={styles.modalContent}>
                            {/* Decorative Header */}
                            <View style={styles.headerDecoration} />
                            
                            <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.7}>
                                <X size={22} color={COLORS.textLight} />
                            </TouchableOpacity>

                            <View style={styles.contentBody}>
                                <View style={styles.iconContainer}>
                                    <View style={styles.iconBackground}>
                                        <User size={34} color={COLORS.primary} strokeWidth={2.5} />
                                    </View>
                                </View>

                                <Text style={styles.modalTitle}>{title} 👤</Text>
                                <Text style={styles.modalMessage}>{message}</Text>

                                <View style={styles.buttonGroup}>
                                    <TouchableOpacity 
                                        style={styles.primaryBtn} 
                                        onPress={onLogin} 
                                        activeOpacity={0.8}
                                    >
                                        <LogIn size={20} color={COLORS.white} style={styles.btnIcon} />
                                        <Text style={styles.primaryBtnText}>Login / Register</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity 
                                        style={styles.secondaryBtn} 
                                        onPress={onGuest} 
                                        activeOpacity={0.8}
                                    >
                                        <ExternalLink size={20} color={COLORS.primary} style={styles.btnIcon} />
                                        <Text style={styles.secondaryBtnText}>Proceed as Guest</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity 
                                        style={styles.textBtn} 
                                        onPress={onClose}
                                        activeOpacity={0.6}
                                        hitSlop={{ top: 10, bottom: 10, left: 20, right: 20 }}
                                    >
                                        <Text style={styles.textBtnTitle}>Maybe Later</Text>
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
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: width * 0.88,
        backgroundColor: COLORS.white,
        borderRadius: 30,
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: '#E3F2FD', // Very light blue border
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 15,
    },
    headerDecoration: {
        height: 8,
        backgroundColor: '#2196F3', // The Blue color
        width: '100%',
    },
    closeButton: {
        position: 'absolute',
        right: 18,
        top: 20,
        zIndex: 10,
        backgroundColor: '#f5f5f5',
        borderRadius: 20,
        padding: 5,
    },
    contentBody: {
        padding: 30,
        alignItems: 'center',
    },
    iconContainer: {
        marginBottom: 20,
    },
    iconBackground: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.primary + '10',
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#1565C0', // Rich dark blue
        marginBottom: 12,
        textAlign: 'center',
        letterSpacing: 0.5,
    },
    modalMessage: {
        fontSize: 16,
        color: COLORS.textLight,
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 24,
        paddingHorizontal: 10,
    },
    buttonGroup: {
        width: '100%',
        gap: 12,
    },
    primaryBtn: {
        width: '100%',
        backgroundColor: COLORS.primary,
        flexDirection: 'row',
        paddingVertical: 15,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryBtnText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: 'bold',
    },
    secondaryBtn: {
        width: '100%',
        backgroundColor: COLORS.white,
        borderWidth: 1.5,
        borderColor: COLORS.primary,
        flexDirection: 'row',
        paddingVertical: 15,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    secondaryBtnText: {
        color: COLORS.primary,
        fontSize: 16,
        fontWeight: 'bold',
    },
    btnIcon: {
        marginRight: 10,
    },
    textBtn: {
        marginTop: 10,
        paddingVertical: 10,
    },
    textBtnTitle: {
        color: COLORS.textLight,
        fontSize: 14,
        fontWeight: '600',
        textDecorationLine: 'underline',
    }
});

export default GuestOptionModal;
