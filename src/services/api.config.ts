import { ENV, STORAGE_KEYS } from '@/utils'

export const API_BASE_URL = ENV.API_URL
export const TOKEN_KEY = STORAGE_KEYS.TOKEN

export function getWebSocketUrl(): string {
  const clean = (API_BASE_URL || 'http://localhost:8080/api').replace(/\/api\/v1\/?$/, '/api').replace(/\/+$/, '')
  return clean.endsWith('/api') ? `${clean}/ws` : `${clean}/api/ws`
}
