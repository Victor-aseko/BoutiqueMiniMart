import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
    const [wishlist, setWishlist] = useState([]);

    useEffect(() => {
        AsyncStorage.getItem('wishlist').then(data => {
            if (data) setWishlist(JSON.parse(data));
        });
    }, []);

    useEffect(() => {
        AsyncStorage.setItem('wishlist', JSON.stringify(wishlist));
    }, [wishlist]);

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
