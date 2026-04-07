import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { COLORS } from '../theme/theme';

const AnimatedSearchPlaceholder = ({ items = [], onTextChange }) => {
    const [index, setIndex] = useState(0);
    const scrollY = useRef(new Animated.Value(0)).current;
    const HEIGHT = 40;

    // 1. Dedicated effect for notifying parent (Prevents render loops)
    useEffect(() => {
        if (items && items[index] && onTextChange) {
            onTextChange(items[index]);
        }
    }, [index, items, onTextChange]);

    // 2. Isolated animation loop
    useEffect(() => {
        if (!items || items.length === 0) return;

        const animate = () => {
            scrollY.setValue(0);
            Animated.timing(scrollY, {
                toValue: -HEIGHT,
                duration: 1600,
                easing: Easing.bezier(0.25, 1, 0.5, 1),
                useNativeDriver: true,
            }).start(() => {
                setIndex((prev) => (prev + 1) % items.length);
            });
        };

        const timer = setTimeout(animate, 2000);
        return () => clearTimeout(timer);
    }, [index, items?.length]); // Only re-run if index or length changes

    if (!items || items.length === 0) return null;

    const nextIndex = (index + 1) % items.length;

    return (
        <View style={styles.container}>
            <Animated.View style={[
                styles.wrapper,
                { transform: [{ translateY: scrollY }] }
            ]}>
                {/* Current Item */}
                <View style={[styles.item, { height: HEIGHT }]}>
                    <Text style={styles.text} numberOfLines={1}>{items[index]}</Text>
                </View>
                
                {/* Next Item (Ready to slide in) */}
                <View style={[styles.item, { height: HEIGHT }]}>
                    <Text style={styles.text} numberOfLines={1}>{items[nextIndex]}</Text>
                </View>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        height: 40,
        overflow: 'hidden',
        justifyContent: 'flex-start',
        marginLeft: 10,
    },
    wrapper: {
        width: '100%',
    },
    item: {
        width: '100%',
        justifyContent: 'center',
    },
    text: {
        fontSize: 14,
        color: COLORS.textLight,
        fontWeight: '500',
        letterSpacing: 0.1,
    }
});

export default AnimatedSearchPlaceholder;
