import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import api from '../services/api';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const { user } = useAuth();
    const [cartItems, setCartItems] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const ensureHeaderAndFetch = async () => {
            if (user && user.token) {
                // Ensure axios has the Authorization header set to avoid 401 race
                const expected = `Bearer ${user.token}`;
                if (api.defaults.headers.common['Authorization'] !== expected) {
                    api.defaults.headers.common['Authorization'] = expected;
                }
                await fetchCart();
            } else {
                setCartItems([]);
            }
        };

        ensureHeaderAndFetch();
    }, [user]);

    const fetchCart = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/cart');
            // backend may return the cart object or an object containing cartItems
            const data = response.data || {};
            setCartItems(data.cartItems || data.cartItems || []);
        } catch (err) {
            console.log('Error fetching cart', err);
        } finally {
            setIsLoading(false);
        }
    };

    const addToCart = async (product, qty = 1, color = '', size = '') => {
        try {
            // ensure header present
            if (user && user.token) {
                api.defaults.headers.common['Authorization'] = `Bearer ${user.token}`;
            }

            const response = await api.post('/cart', {
                product: product._id,
                name: product.name,
                image: product.image,
                price: product.price,
                qty: qty,
                color,
                size,
            });

            const data = response.data || {};
            // response may be the cart object; normalize to array
            const items = data.cartItems || data.cartItems || (data.cartItems === undefined && data.cartItems) || [];
            setCartItems(items);

            // If backend returned 201 or cart object, consider it success
            if (response.status === 201 || response.status === 200) {
                // also ensure fetchCart to keep in sync
                await fetchCart();
                return true;
            }
            return false;
        } catch (err) {
            console.log('Error adding to cart', err.response?.data || err.message || err);
            return false;
        }
    };

    const updateCartQty = async (item, qty) => {
        try {
            // backend requires all fields to identify the correct cart item variant
            const response = await api.post('/cart', {
                product: item.product || item._id,
                name: item.name,
                image: item.image,
                price: item.price,
                qty,
                color: item.color,
                size: item.size
            });
            const data = response.data || {};
            setCartItems(data.cartItems || data.cartItems || []);
        } catch (err) {
            console.log('Error updating cart qty', err);
        }
    };

    const removeFromCart = async (id) => {
        try {
            const response = await api.delete(`/cart/${id}`);
            const data = response.data || {};
            setCartItems(data.cartItems || data.cartItems || []);
        } catch (err) {
            console.log('Error removing from cart', err);
        }
    };

    const clearCart = async () => {
        try {
            await api.delete('/cart');
            setCartItems([]);
        } catch (err) {
            console.log('Error clearing cart', err);
        }
    };

    const cartTotal = cartItems.reduce((acc, item) => acc + item.price * item.qty, 0);
    const cartCount = cartItems.reduce((acc, item) => acc + item.qty, 0);

    return (
        <CartContext.Provider value={{
            cartItems,
            isLoading,
            fetchCart,
            addToCart,
            updateCartQty,
            removeFromCart,
            clearCart,
            cartTotal,
            cartCount
        }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);
