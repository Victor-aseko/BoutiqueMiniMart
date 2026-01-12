import React from 'react';
import { View, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { Facebook, Instagram, MessageCircle, Send } from 'lucide-react-native';
import { COLORS } from '../theme/theme';

const SOCIAL_LINKS = {
    whatsapp: 'https://chat.whatsapp.com/IVGjYlhsLZb4h0oeXbJ98P',
    facebook: 'https://www.facebook.com/yourpage',
    instagram: 'https://www.instagram.com/yourpage',
    tiktok: 'https://www.tiktok.com/@yourpage',
};

const SocialFooter = () => (
    <View style={styles.footer}>
        <TouchableOpacity onPress={() => Linking.openURL(SOCIAL_LINKS.whatsapp)} style={styles.iconBtn}>
            <MessageCircle size={28} color={COLORS.success} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => Linking.openURL(SOCIAL_LINKS.facebook)} style={styles.iconBtn}>
            <Facebook size={28} color={COLORS.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => Linking.openURL(SOCIAL_LINKS.instagram)} style={styles.iconBtn}>
            <Instagram size={28} color={COLORS.accent} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => Linking.openURL(SOCIAL_LINKS.tiktok)} style={styles.iconBtn}>
            <Send size={28} color={'#000'} />
        </TouchableOpacity>
    </View>
);

const styles = StyleSheet.create({
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        alignItems: 'center',
        paddingVertical: 18,
        backgroundColor: COLORS.background,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    iconBtn: {
        marginHorizontal: 12,
    },
});

export default SocialFooter;
