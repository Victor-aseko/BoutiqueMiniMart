import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import api from '../services/api';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const { user } = useAuth();
    const [cartItems, setCartItems] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // Initial load and sync logic
    useEffect(() => {
        const syncAndFetch = async () => {
            setIsLoading(true);
            try {
                if (user && user.token) {
                    // Ensure axios has the Authorization header set
                    const expected = `Bearer ${user.token}`;
                    if (api.defaults.headers.common['Authorization'] !== expected) {
                        api.defaults.headers.common['Authorization'] = expected;
                    }

                    // 1. Check for local cart to sync
                    const localCart = await AsyncStorage.getItem('cart');
                    if (localCart) {
                        const parsedLocal = JSON.parse(localCart);
                        if (parsedLocal.length > 0) {
                            console.log('Syncing local cart to server...');
                            // Sync items one by one (or bulk if API supported, using loop for now)
                            for (const item of parsedLocal) {
                                try {
                                    await api.post('/cart', {
                                        product: item.product,
                                        name: item.name,
                                        image: item.image,
                                        price: item.price,
                                        qty: item.qty,
                                        color: item.color,
                                        size: item.size
                                    });
                                } catch (e) {
                                    console.log('Error syncing item', e);
                                }
                            }
                            // Clear local cart after sync
                            await AsyncStorage.removeItem('cart');
                        }
                    }
                    // 2. Fetch server cart
                    await fetchCart();
                } else {
                    // Load local cart for guest
                    const localCart = await AsyncStorage.getItem('cart');
                    if (localCart) {
                        setCartItems(JSON.parse(localCart));
                    } else {
                        setCartItems([]);
                    }
                }
            } catch (error) {
                console.log('Error in cart sync/fetch:', error);
            } finally {
                setIsLoading(false);
            }
        };

        syncAndFetch();
    }, [user]);

    const fetchCart = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/cart');
            const data = response.data || {};
            setCartItems(data.cartItems || []);
        } catch (err) {
            console.log('Error fetching cart', err);
        } finally {
            setIsLoading(false);
        }
    };

    const addToCart = async (product, qty = 1, color = '', size = '') => {
        if (user && user.token) {
            // Server side
            try {
                api.defaults.headers.common['Authorization'] = `Bearer ${user.token}`;
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
                setCartItems(data.cartItems || []);
                if (response.status === 201 || response.status === 200) {
                    return true;
                }
                return false;
            } catch (err) {
                console.log('Error adding to server cart', err);
                return false;
            }
        } else {
            // Local side
            try {
                const newItem = {
                    product: product._id,
                    name: product.name,
                    image: product.image, // Ensure we use the variant image if handled upstairs, but here we take product.image or passed one? 
                    // The caller passes 'product' which might have 'price' updated.
                    // Ideally we should store enough info.
                    price: product.price,
                    qty,
                    color,
                    size,
                    _id: Date.now().toString() // Temporary ID
                };

                let currentCart = [...cartItems];
                const existingIndex = currentCart.findIndex(i =>
                    i.product === newItem.product && i.color === newItem.color && i.size === newItem.size
                );

                if (existingIndex > -1) {
                    currentCart[existingIndex].qty += qty;
                } else {
                    currentCart.push(newItem);
                }

                setCartItems(currentCart);
                await AsyncStorage.setItem('cart', JSON.stringify(currentCart));
                return true;
            } catch (e) {
                console.log('Error adding to local cart', e);
                return false;
            }
        }
    };

    const updateCartQty = async (item, qty) => {
        if (user && user.token) {
            try {
                const response = await api.post('/cart', {
                    product: item.product || item._id, // Handle differences in ID location
                    name: item.name,
                    image: item.image,
                    price: item.price,
                    qty,
                    color: item.color,
                    size: item.size
                });
                const data = response.data || {};
                setCartItems(data.cartItems || []);
            } catch (err) {
                console.log('Error updating server cart qty', err);
            }
        } else {
            try {
                let currentCart = [...cartItems];
                const index = currentCart.findIndex(i => i._id === item._id || (i.product === item.product && i.color === item.color && i.size === item.size));
                if (index > -1) {
                    currentCart[index].qty = qty;
                    setCartItems(currentCart);
                    await AsyncStorage.setItem('cart', JSON.stringify(currentCart));
                }
            } catch (e) {
                console.log('Error updating local cart qty', e);
            }
        }
    };

    const removeFromCart = async (id) => {
        if (user && user.token) {
            try {
                const response = await api.delete(`/cart/${id}`);
                const data = response.data || {};
                setCartItems(data.cartItems || []);
            } catch (err) {
                console.log('Error removing from server cart', err);
            }
        } else {
            try {
                // For local cart, 'id' might be the temporary _id or we match by product id? 
                // The caller in CartScreen passes 'item.product || item._id'. 
                // If local, we used Date.now() as _id.
                // Re-check CartScreen: removeFromCart(item.product || item._id)
                // If we used _id, it's fine. 
                const currentCart = cartItems.filter(i => i._id !== id && i.product !== id);
                setCartItems(currentCart);
                await AsyncStorage.setItem('cart', JSON.stringify(currentCart));
            } catch (e) {
                console.log('Error removing from local cart', e);
            }
        }
    };

    const clearCart = async () => {
        setCartItems([]);
        if (user && user.token) {
            try {
                await api.delete('/cart');
            } catch (err) {
                console.log('Error clearing server cart', err);
            }
        } else {
            try {
                await AsyncStorage.removeItem('cart');
            } catch (e) {
                console.log('Error clearing local cart', e);
            }
        }
    };

    const cartTotal = cartItems.reduce((acc, item) => acc + (Number(item.price) * Number(item.qty)), 0);
    const cartCount = cartItems.reduce((acc, item) => acc + Number(item.qty), 0);

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
