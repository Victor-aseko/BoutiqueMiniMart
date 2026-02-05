import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, TouchableOpacity, Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { WifiOff, RefreshCcw } from 'lucide-react-native';
import { COLORS } from '../theme/theme';

const { width } = Dimensions.get('window');

const OfflineNotice = () => {
    const [isConnected, setIsConnected] = useState(true);
    const [animation] = useState(new Animated.Value(-100));

    useEffect(() => {
        // Check initial state
        NetInfo.fetch().then(state => {
            setIsConnected(state.isConnected);
            if (!state.isConnected) showNotice();
        });

        const unsubscribe = NetInfo.addEventListener(state => {
            setIsConnected(state.isConnected);
            if (!state.isConnected) {
                showNotice();
            } else {
                hideNotice();
            }
        });

        return () => unsubscribe();
    }, []);

    const showNotice = () => {
        Animated.timing(animation, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
        }).start();
    };

    const hideNotice = () => {
        Animated.timing(animation, {
            toValue: -100,
            duration: 400,
            useNativeDriver: true,
        }).start();
    };

    const handleRetry = () => {
        NetInfo.refresh().then(state => {
            setIsConnected(state.isConnected);
            if (state.isConnected) hideNotice();
        });
    };

    if (isConnected) return null;

    return (
        <Animated.View style={[styles.container, { transform: [{ translateY: animation }] }]}>
            <View style={styles.content}>
                <WifiOff color={COLORS.white} size={20} />
                <View style={styles.textContainer}>
                    <Text style={styles.title}>Connection Error!</Text>
                    <Text style={styles.subtitle}>Connect to Internet to continue browsing</Text>
                </View>
                <TouchableOpacity onPress={handleRetry} style={styles.retryBtn}>
                    <RefreshCcw color={COLORS.white} size={18} />
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        width: width,
        zIndex: 9999,
        backgroundColor: '#D63031', // A premium red for errors
        paddingTop: Platform.OS === 'ios' ? 45 : 30, // Account for status bar
        paddingBottom: 15,
        paddingHorizontal: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    textContainer: {
        flex: 1,
        marginLeft: 15,
    },
    title: {
        color: COLORS.white,
        fontSize: 14,
        fontWeight: 'bold',
    },
    subtitle: {
        color: 'rgba(255, 255, 255, 0.9)',
        fontSize: 12,
        marginTop: 2,
    },
    retryBtn: {
        padding: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 20,
    }
});

export default OfflineNotice;
