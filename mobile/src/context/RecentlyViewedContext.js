import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RecentlyViewedContext = createContext();

export const RecentlyViewedProvider = ({ children }) => {
    const [recentlyViewed, setRecentlyViewed] = useState([]);

    useEffect(() => {
        AsyncStorage.getItem('recentlyViewed').then(data => {
            if (data) setRecentlyViewed(JSON.parse(data));
        });
    }, []);

    useEffect(() => {
        AsyncStorage.setItem('recentlyViewed', JSON.stringify(recentlyViewed));
    }, [recentlyViewed]);

    const addRecentlyViewed = (product) => {
        setRecentlyViewed(prev => {
            const exists = prev.find(p => p._id === product._id);
            if (exists) {
                // move to front
                return [product, ...prev.filter(p => p._id !== product._id)].slice(0, 20);
            }
            return [product, ...prev].slice(0, 20);
        });
    };

    const clearRecentlyViewed = () => setRecentlyViewed([]);

    return (
        <RecentlyViewedContext.Provider value={{ recentlyViewed, addRecentlyViewed, clearRecentlyViewed }}>
            {children}
        </RecentlyViewedContext.Provider>
    );
};

export const useRecentlyViewed = () => useContext(RecentlyViewedContext);
