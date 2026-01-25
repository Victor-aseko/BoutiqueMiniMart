import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../theme/theme';

const BRAND_RED = '#D63031';

const BrandLogo = ({ fontSize = 10 }) => {
    return (
        <View style={styles.container}>
            <View style={styles.logoWrapper}>
                <View style={styles.textStack}>
                    <Text style={[styles.miniText, { fontSize: fontSize + 6 }]}>mini</Text>
                    <Text style={[styles.boutiqueText, { fontSize: fontSize - 3 }]}>BOUTIQUE</Text>
                </View>
                {/* Scaled down oval swoosh arc */}
                <View style={styles.arcWrapper}>
                    <View style={styles.ovalArc} />
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 2,
    },
    logoWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
        height: 35, // Restricted height for app bar
    },
    textStack: {
        alignItems: 'center',
        zIndex: 2,
    },
    miniText: {
        fontWeight: '900',
        color: BRAND_RED,
        lineHeight: 18, // Reduced line height
        includeFontPadding: false,
    },
    boutiqueText: {
        fontWeight: 'bold',
        color: COLORS.black,
        letterSpacing: 2,
        marginTop: -3,
    },
    arcWrapper: {
        position: 'absolute',
        width: 70, // Reduced from 80
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
        transform: [{ rotate: '-10deg' }, { translateX: 3 }, { translateY: 3 }],
    },
    ovalArc: {
        width: '100%',
        height: '90%',
        borderWidth: 2.5, // Thinner border for smaller size
        borderColor: COLORS.black,
        borderRadius: 80,
        backgroundColor: 'transparent',
        borderTopWidth: 0,
        borderLeftWidth: 0.8
    }

});

export default BrandLogo;
