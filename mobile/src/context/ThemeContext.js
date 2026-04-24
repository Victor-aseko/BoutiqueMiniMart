import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'react-native';

export const ThemeContext = createContext();

export const LightTheme = {
    dark: false,
    colors: {
        primary: '#2D3436',
        secondary: '#636E72',
        accent: '#0984E3',
        background: '#F9FAFB',
        surface: '#FFFFFF',
        white: '#FFFFFF',
        black: '#000000',
        error: '#D63031',
        success: '#00B894',
        text: '#2D3436',
        textLight: '#636E72',
        border: '#DFE6E9',
        star: '#F1C40F',
        card: '#FFFFFF',
    }
};

export const DarkTheme = {
    dark: true,
    colors: {
        primary: '#0984E3', // Swap primary to accent color for vibrance in dark mode
        secondary: '#B2BEC3',
        accent: '#0984E3',
        background: '#121212', // Deep near-black
        surface: '#1E1E1E', // Elevated surface
        white: '#FFFFFF',
        black: '#000000',
        error: '#FF7675',
        success: '#55EFC4',
        text: '#F9FAFB',
        textLight: '#B2BEC3',
        border: '#2D3436',
        star: '#FAB1A0',
        card: '#1E1E1E',
    }
};

export const ThemeProvider = ({ children }) => {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadTheme();
    }, []);

    const loadTheme = async () => {
        try {
            const savedTheme = await AsyncStorage.getItem('user-theme');
            if (savedTheme !== null) {
                setIsDarkMode(savedTheme === 'dark');
            }
        } catch (e) {
            console.log('Failed to load theme', e);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleTheme = async () => {
        try {
            const newMode = !isDarkMode;
            setIsDarkMode(newMode);
            await AsyncStorage.setItem('user-theme', newMode ? 'dark' : 'light');
        } catch (e) {
            console.log('Failed to save theme', e);
        }
    };

    const theme = isDarkMode ? DarkTheme : LightTheme;

    return (
        <ThemeContext.Provider value={{ theme, isDarkMode, toggleTheme, isLoading }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
