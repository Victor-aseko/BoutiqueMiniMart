import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS, SIZES } from '../theme/theme';

const MyButton = ({ title, onPress, loading, variant = 'primary', style, textStyle }) => {
    const isSecondary = variant === 'secondary';
    const isOutline = variant === 'outline';

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={loading}
            activeOpacity={0.7}
            style={[
                styles.button,
                isSecondary && styles.secondary,
                isOutline && styles.outline,
                style
            ]}
        >
            {loading ? (
                <ActivityIndicator color={isOutline ? COLORS.primary : COLORS.white} />
            ) : (
                <Text style={[
                    styles.text,
                    isOutline && styles.outlineText,
                    textStyle
                ]}>
                    {title}
                </Text>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        backgroundColor: COLORS.primary,
        paddingVertical: 15,
        borderRadius: SIZES.radius,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        marginVertical: 10,
    },
    secondary: {
        backgroundColor: COLORS.secondary,
    },
    outline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    text: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '600',
    },
    outlineText: {
        color: COLORS.primary,
    }
});

export default MyButton;
