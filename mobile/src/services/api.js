import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Dynamically get the host IP from Expo (works for both physical devices and emulators)
// fallback to 10.0.2.2 for Android Emulator and localhost for others
const expoHost = Constants.expoConfig?.hostUri?.split(':').shift();
const host = expoHost || (Platform.OS === 'android' ? '10.0.2.2' : 'localhost');

// Use Render for Hosted Backend
export const BASE_URL = 'https://boutiqueminimart.onrender.com';
export const API_URL = `${BASE_URL}/api`;

// Use this for local testing if needed
// const expoHost = Constants.expoConfig?.hostUri?.split(':').shift();
// const host = expoHost || (Platform.OS === 'android' ? '10.0.2.2' : 'localhost');
// export const BASE_URL = host !== 'localhost' && !host.includes('10.0.2.2') ? `http://${host}:5000` : (Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000');

const instance = axios.create({
    baseURL: API_URL,
    timeout: 45000, // Increased to 45s for Render's cold starts
});

export default instance;
