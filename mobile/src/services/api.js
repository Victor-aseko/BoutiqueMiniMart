import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Dynamically get the host IP from Expo (works for both physical devices and emulators)
// fallback to 10.0.2.2 for Android Emulator and localhost for others
const expoHost = Constants.expoConfig?.hostUri?.split(':').shift();
const host = expoHost || (Platform.OS === 'android' ? '10.0.2.2' : 'localhost');

export const BASE_URL = `http://${host}:5000`;
export const API_URL = `${BASE_URL}/api`;

console.log('--- API CONFIGURATION ---');
console.log('Host:', host);
console.log('Base URL:', BASE_URL);
console.log('Platform:', Platform.OS);
console.log('-------------------------');

const instance = axios.create({
    baseURL: API_URL,
    timeout: 10000,
});

export default instance;
