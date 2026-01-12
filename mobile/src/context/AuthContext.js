import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        checkLoginStatus();

        // Setup interceptor for 401 errors
        const interceptor = api.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response && error.response.status === 401) {
                    logout();
                }
                return Promise.reject(error);
            }
        );

        return () => api.interceptors.response.eject(interceptor);
    }, []);

    const checkLoginStatus = async () => {
        try {
            const storedUser = await AsyncStorage.getItem('user');
            if (storedUser) {
                const userData = JSON.parse(storedUser);
                // Set authorization header BEFORE updating user state
                if (userData?.token) {
                    api.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;
                    setUser(userData);
                } else {
                    await logout();
                }
            }
        } catch (e) {
            console.log('Error checking login status', e);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (email, password) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.post('/auth/login', { email, password });
            const userData = response.data;
            if (!userData.addresses) userData.addresses = [];
            api.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;
            setUser(userData);
            await AsyncStorage.setItem('user', JSON.stringify(userData));
            return true;
        } catch (err) {
            console.error('Login error detail:', err.response?.data || err.message);
            setError(err.response?.data?.message || 'Login failed');
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (name, email, password) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.post('/auth', { name, email, password });
            const userData = response.data;
            if (!userData.addresses) userData.addresses = [];
            api.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;
            setUser(userData);
            await AsyncStorage.setItem('user', JSON.stringify(userData));
            return true;
        } catch (err) {
            console.error('Registration error detail:', err.response?.data || err.message);
            setError(err.response?.data?.message || 'Registration failed');
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        try {
            await AsyncStorage.removeItem('user');
            delete api.defaults.headers.common['Authorization'];
            setUser(null);
        } catch (e) {
            console.log('Error logging out', e);
        }
    };

    const updateProfile = async (userData) => {
        setUser(userData);
        await AsyncStorage.setItem('user', JSON.stringify(userData));
    };

    const clearError = () => setError(null);

    return (
        <AuthContext.Provider value={{ user, isLoading, error, login, register, logout, clearError, updateProfile }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
