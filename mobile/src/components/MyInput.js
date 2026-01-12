import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { COLORS, SIZES } from '../theme/theme';

const MyInput = ({
    label,
    value,
    onChangeText,
    placeholder,
    secureTextEntry,
    error,
    icon: Icon,
    ...props
}) => {
    const [hidePassword, setHidePassword] = useState(secureTextEntry);

    return (
        <View style={styles.container}>
            {label && <Text style={styles.label}>{label}</Text>}
            <View style={[
                styles.inputContainer,
                error && styles.errorInput,
                styles.row
            ]}>
                {Icon && (
                    <View style={styles.iconContainer}>
                        <Icon size={20} color={COLORS.textLight} />
                    </View>
                )}

                <TextInput
                    style={styles.input}
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    secureTextEntry={hidePassword}
                    placeholderTextColor={COLORS.textLight}
                    {...props}
                />

                {secureTextEntry && (
                    <TouchableOpacity
                        onPress={() => setHidePassword(!hidePassword)}
                        style={styles.eyeIcon}
                    >
                        {hidePassword ? (
                            <EyeOff size={20} color={COLORS.textLight} />
                        ) : (
                            <Eye size={20} color={COLORS.textLight} />
                        )}
                    </TouchableOpacity>
                )}
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        marginVertical: 10,
    },
    label: {
        fontSize: 14,
        color: COLORS.text,
        marginBottom: 8,
        fontWeight: '500',
    },
    inputContainer: {
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: SIZES.radius,
        paddingHorizontal: 15,
        minHeight: 55, // Changed from height: 55 to support multiline
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: COLORS.text,
        height: '100%',
        textAlignVertical: 'top', // Added for multiline support
    },
    eyeIcon: {
        padding: 5,
    },
    errorInput: {
        borderColor: COLORS.error,
    },
    errorText: {
        color: COLORS.error,
        fontSize: 12,
        marginTop: 5,
    },
});

export default MyInput;
