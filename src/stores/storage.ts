import AsyncStorage from '@react-native-async-storage/async-storage'
import * as SecureStore from 'expo-secure-store'
import type { StateStorage } from 'zustand/middleware'

/**
 * Thay cho localStorage của bản web. Cả hai đều bất đồng bộ; lỗi đọc/ghi
 * được nuốt để phiên vẫn chạy trong bộ nhớ (giống storage.ts bản web).
 */

/** Token và thông tin đăng nhập: mã hoá bằng Keychain (iOS) / Keystore (Android). */
export const secureStorage: StateStorage = {
  getItem: async (key) => {
    try {
      return await SecureStore.getItemAsync(key)
    } catch {
      return null
    }
  },
  setItem: async (key, value) => {
    try {
      await SecureStore.setItemAsync(key, value)
    } catch {
      /* bỏ qua */
    }
  },
  removeItem: async (key) => {
    try {
      await SecureStore.deleteItemAsync(key)
    } catch {
      /* bỏ qua */
    }
  },
}

/** Dữ liệu không nhạy cảm (giỏ hàng, tuỳ chọn giao diện). */
export const asyncStorage: StateStorage = {
  getItem: async (key) => {
    try {
      return await AsyncStorage.getItem(key)
    } catch {
      return null
    }
  },
  setItem: async (key, value) => {
    try {
      await AsyncStorage.setItem(key, value)
    } catch {
      /* bỏ qua */
    }
  },
  removeItem: async (key) => {
    try {
      await AsyncStorage.removeItem(key)
    } catch {
      /* bỏ qua */
    }
  },
}

export async function readJson(storage: StateStorage, key: string): Promise<unknown> {
  const raw = await storage.getItem(key)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}
