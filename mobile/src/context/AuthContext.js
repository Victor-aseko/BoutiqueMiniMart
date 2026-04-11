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
    const [isLoggingOut, setIsLoggingOut] = useState(false);

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
        // Only auto-sync if:
        // 1. Clerk is loaded and has a user 
        // 2. We don't have an app user yet
        // 3. We are NOT currently logging out 
        // 4. We are NOT currently processing an auth action
        const checkAutoSync = async () => {
            const manuallyLoggedOut = await AsyncStorage.getItem('manuallyLoggedOut');

            if (clerkLoaded && clerkUser && !user && !authLoading && !isLoggingOut && manuallyLoggedOut !== 'true') {
                const email = clerkUser.primaryEmailAddress?.emailAddress || clerkUser.emailAddresses[0]?.emailAddress;
                if (!email) return;

                console.log('Clerk session found. Syncing with backend...');
                try {
                    await loginWithGoogle({
                        email: email,
                        name: clerkUser.fullName || clerkUser.firstName || 'User',
                        picture: clerkUser.imageUrl,
                        clerkId: clerkUser.id
                    });
                } catch (e) {
                    console.log('Auto-sync failed', e);
                }
            }
        };

        checkAutoSync();
    }, [clerkUser, clerkLoaded, !!user, isLoggingOut, authLoading]);

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
            await AsyncStorage.setItem('manuallyLoggedOut', 'false');
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

    const loginQuietly = async (userData) => {
        try {
            if (!userData.addresses) userData.addresses = [];
            api.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;
            setUser(userData);
            await AsyncStorage.setItem('user', JSON.stringify(userData));
            await AsyncStorage.setItem('manuallyLoggedOut', 'false');
            return true;
        } catch (e) {
            console.error('Quiet login failed', e);
            return false;
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
            await AsyncStorage.setItem('manuallyLoggedOut', 'false');
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
        if (user && user.email === userDataFromGoogle.email) return true;
        if (authLoading) return false;

        setAuthLoading(true);
        setError(null);
        try {
            const response = await api.post('/auth/google', userDataFromGoogle);
            const userData = response.data;
            if (!userData.addresses) userData.addresses = [];
            api.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;
            setUser(userData);
            await AsyncStorage.setItem('user', JSON.stringify(userData));
            await AsyncStorage.setItem('manuallyLoggedOut', 'false');
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
        if (isLoggingOut) return;
        setIsLoggingOut(true);
        setError(null);

        try {
            console.log('Starting logout sequence...');

            // 1. Mark as manually logged out immediately to block auto-sync effects
            await AsyncStorage.setItem('manuallyLoggedOut', 'true');

            // 2. Sign out of Clerk FIRST
            // This is the most critical part for stability in production APKs
            if (clerkSignOut) {
                try {
                    await clerkSignOut();
                } catch (ce) {
                    console.log('Clerk signout detail (non-fatal):', ce);
                }
            }

            // 3. Clear local storage and tokens
            await AsyncStorage.removeItem('user');
            delete api.defaults.headers.common['Authorization'];

            // 4. Finally, clear local app user state
            // This triggers re-renders across the app
            setUser(null);
            console.log('Logout sequence completed successfully');

        } catch (e) {
            console.error('Error during logout sequence:', e);
            // Fallback: Ensure user state is cleared even if something fails
            setUser(null);
        } finally {
            // Wait before allowing another auth action to let the system settle
            setTimeout(() => {
                setIsLoggingOut(false);
            }, 800);
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
            loginQuietly,
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
