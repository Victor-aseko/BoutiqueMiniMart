import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

import { useClerk, useUser } from '@clerk/clerk-expo';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const { signOut: clerkSignOut } = useClerk();
    const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [authLoading, setAuthLoading] = useState(false);
    const [error, setError] = useState(null);
    const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);

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

    // Automatic sync with backend if Clerk session exists but local state doesn't
    useEffect(() => {
        if (clerkLoaded && clerkUser && !user && !authLoading) {
            console.log('Clerk session found after refresh. Syncing with backend...');
            const syncSession = async () => {
                await loginWithGoogle({
                    email: clerkUser.primaryEmailAddress.emailAddress,
                    name: clerkUser.fullName,
                    picture: clerkUser.imageUrl,
                    clerkId: clerkUser.id
                });
            };
            syncSession();
        }
    }, [clerkUser, clerkLoaded, user]);

    const checkLoginStatus = async () => {
        try {
            const onboardingSeen = await AsyncStorage.getItem('hasSeenOnboarding');
            if (onboardingSeen === 'true') {
                setHasSeenOnboarding(true);
            }

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
        setAuthLoading(true);
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
            const errorMsg = err.response?.data?.message || err.message || 'Login failed';
            setError(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
            return false;
        } finally {
            setAuthLoading(false);
        }
    };

    const register = async (name, email, password) => {
        setAuthLoading(true);
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
            setAuthLoading(false);
        }
    };

    const loginWithGoogle = async (userDataFromGoogle) => {
        setAuthLoading(true);
        setError(null);
        try {
            const response = await api.post('/auth/google', userDataFromGoogle);
            const userData = response.data;
            if (!userData.addresses) userData.addresses = [];
            api.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;
            setUser(userData);
            await AsyncStorage.setItem('user', JSON.stringify(userData));
            return true;
        } catch (err) {
            console.error('Google login error detail:', err.response?.data || err.message);
            setError(err.response?.data?.message || 'Google login failed');
            return false;
        } finally {
            setAuthLoading(false);
        }
    };

    const logout = async () => {
        try {
            // Also sign out of Clerk to prevent "hanging" on next login
            if (clerkSignOut) {
                await clerkSignOut();
            }
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

    const completeOnboarding = async () => {
        try {
            await AsyncStorage.setItem('hasSeenOnboarding', 'true');
            setHasSeenOnboarding(true);
        } catch (e) {
            console.log('Error saving onboarding status', e);
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            isLoading,
            authLoading,
            error,
            hasSeenOnboarding,
            login,
            register,
            loginWithGoogle,
            logout,
            setError,
            clearError,
            updateProfile,
            completeOnboarding
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
