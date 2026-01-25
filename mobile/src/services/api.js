import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Dynamically get the host IP from Expo (works for both physical devices and emulators)
// fallback to 10.0.2.2 for Android Emulator and localhost for others
const expoHost = Constants.expoConfig?.hostUri?.split(':').shift();
const host = expoHost || (Platform.OS === 'android' ? '10.0.2.2' : 'localhost');

export const BASE_URL = 'https://boutiqueminimart.onrender.com';
export const API_URL = `${BASE_URL}/api`;

// console.log('--- API CONFIGURATION ---');
// console.log('Host:', host);
// ... logs disabled for performance

const instance = axios.create({
    baseURL: API_URL,
    timeout: 60000,
});

export default instance;
