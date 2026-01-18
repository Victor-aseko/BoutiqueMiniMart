import 'react-native-gesture-handler';
import React from 'react';
import { AuthProvider } from './src/context/AuthContext';
import { CartProvider } from './src/context/CartContext';
import { RecentlyViewedProvider } from './src/context/RecentlyViewedContext';
import { WishlistProvider } from './src/context/WishlistContext';
import { NotificationProvider } from './src/context/NotificationContext';
import AppNavigator from './src/navigation/AppNavigator';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

const linking = {
  prefixes: ['boutiqueminimart://', 'https://boutiqueminimart.onrender.com', 'http://172.21.64.1:5000', 'http://192.168.100.30:5000'],
  config: {
    screens: {
      Auth: {
        screens: {
          ResetPassword: 'reset-password/:token',
        },
      },
    },
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <CartProvider>
          <RecentlyViewedProvider>
            <WishlistProvider>
              <NotificationProvider>
                <StatusBar style="auto" />
                <AppNavigator linking={linking} />
              </NotificationProvider>
            </WishlistProvider>
          </RecentlyViewedProvider>
        </CartProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
