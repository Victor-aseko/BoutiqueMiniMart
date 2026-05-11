import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';

const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
    const [wishlist, setWishlist] = useState([]);
    const { user } = useAuth();
    const userId = user?._id || 'guest';

    // Load wishlist when user changes
    useEffect(() => {
        const loadWishlist = async () => {
            try {
                const storageKey = `wishlist_${userId}`;
                const data = await AsyncStorage.getItem(storageKey);
                if (data) {
                    setWishlist(JSON.parse(data));
                } else {
                    setWishlist([]); // Clear if no data for this user
                }
            } catch (e) {
                console.error('Error loading wishlist:', e);
                setWishlist([]);
            }
        };

        loadWishlist();
    }, [userId]);

    // Save wishlist whenever it changes
    useEffect(() => {
        const saveWishlist = async () => {
            try {
                const storageKey = `wishlist_${userId}`;
                await AsyncStorage.setItem(storageKey, JSON.stringify(wishlist));
            } catch (e) {
                console.error('Error saving wishlist:', e);
            }
        };

        // Don't save empty wishlist if user just logged out (wait for useEffect above to load new data)
        if (userId) {
            saveWishlist();
        }
    }, [wishlist, userId]);

    const addToWishlist = (product) => {
        setWishlist(prev => {
            if (prev.find(p => p._id === product._id)) return prev;
            return [product, ...prev];
        });
    };

    const removeFromWishlist = (productId) => {
        setWishlist(prev => prev.filter(p => p._id !== productId));
    };

    return (
        <WishlistContext.Provider value={{ wishlist, addToWishlist, removeFromWishlist }}>
            {children}
        </WishlistContext.Provider>
    );
};

export const useWishlist = () => useContext(WishlistContext);
