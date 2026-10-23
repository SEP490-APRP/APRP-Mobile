import { Platform } from 'react-native';

// Use 10.0.2.2 for Android emulator to access localhost, 
// Use localhost for iOS simulator or web
const LOCAL_API_URL = Platform.OS === 'android' ? 'http://10.0.2.2:8080' : 'http://localhost:8080';

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? LOCAL_API_URL;
