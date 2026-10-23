import { Platform } from 'react-native'

/**
 * Nơi DUY NHẤT đọc biến môi trường. Code khác import ENV thay vì đọc env trực tiếp.
 * Expo chỉ nhúng biến có tiền tố EXPO_PUBLIC_ vào bundle (xem .env.example).
 */
// Android emulator gọi máy host qua 10.0.2.2; iOS simulator dùng được localhost.
const LOCAL_API_URL =
  Platform.OS === 'android' ? 'http://10.0.2.2:8080/api' : 'http://localhost:8080/api'

const API_URL = (process.env.EXPO_PUBLIC_API_URL || LOCAL_API_URL).replace(/\/+$/, '')

export const ENV = {
  API_URL,
  /** Gốc server (không có /api), dùng cho file tĩnh như ảnh KYC. */
  API_ORIGIN: API_URL.match(/^https?:\/\/[^/]+/)?.[0] ?? API_URL,
  /** Địa chỉ bản web, dùng để tạo link chia sẻ/giới thiệu. */
  WEB_URL: (process.env.EXPO_PUBLIC_WEB_URL || 'https://capnong.vn').replace(/\/+$/, ''),
  /** Mặc định dùng API thật; chỉ bật mock khi đặt rõ EXPO_PUBLIC_USE_MOCK=true. */
  USE_MOCK: process.env.EXPO_PUBLIC_USE_MOCK === 'true',
} as const
