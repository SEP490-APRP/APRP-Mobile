import * as Crypto from 'expo-crypto'
import { create } from 'zustand'
import { persist, type PersistStorage } from 'zustand/middleware'
import { authEvents } from '@/lib/authEvents'
import { setTokenGetter } from '@/services/api/axiosInstance'
import type { AuthUser, SessionUser, UserRole } from '@/types'
import { STORAGE_KEYS } from '@/utils/constants'
import { isTokenValid } from '@/utils/jwt'
import { readJson, secureStorage } from './storage'

const ROLES: readonly UserRole[] = ['buyer', 'shop', 'shipper', 'admin']

type LoginUser = AuthUser & { id?: string | number }

type AuthState = {
  user: SessionUser | null
  token: string | null
  /** false cho tới khi đọc xong phiên từ SecureStore; màn hình chờ cờ này để không nháy trang đăng nhập. */
  hasHydrated: boolean
  login: (user: LoginUser, token?: string) => void
  setUser: (user: SessionUser | null) => void
  logout: () => void
}

type PersistedAuth = Pick<AuthState, 'user' | 'token'>

function isLoginUser(value: unknown): value is LoginUser {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return (
    (v.id === undefined || typeof v.id === 'string' || typeof v.id === 'number') &&
    typeof v.name === 'string' &&
    typeof v.email === 'string' &&
    typeof v.role === 'string' &&
    (ROLES as readonly string[]).includes(v.role)
  )
}

/** Xóa sạch toàn bộ storage auth khi hết phiên hoặc đăng xuất */
export async function clearAuthStorage(): Promise<void> {
  await Promise.all([
    secureStorage.removeItem(STORAGE_KEYS.USER),
    secureStorage.removeItem(STORAGE_KEYS.TOKEN),
    secureStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN),
    secureStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
  ])
}

/**
 * Giữ cách lưu của bản web (user và token ở hai key riêng) và chỉ khôi phục phiên
 * khi CẢ token còn hạn lẫn user hợp lệ.
 */
const authStorage: PersistStorage<PersistedAuth> = {
  getItem: async () => {
    const empty = { state: { user: null, token: null }, version: 0 }
    const token =
      (await secureStorage.getItem(STORAGE_KEYS.TOKEN)) ||
      (await secureStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN))
    if (!isTokenValid(token)) {
      await clearAuthStorage()
      return empty
    }
    const saved = await readJson(secureStorage, STORAGE_KEYS.USER)
    if (!isLoginUser(saved)) {
      await clearAuthStorage()
      return empty
    }
    return { state: { user: { ...saved, id: String(saved.id ?? 'local') }, token }, version: 0 }
  },
  setItem: async (_name, { state }) => {
    if (!state.user || !state.token || !isTokenValid(state.token)) {
      await clearAuthStorage()
      return
    }
    await Promise.all([
      secureStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(state.user)),
      secureStorage.setItem(STORAGE_KEYS.TOKEN, state.token),
    ])
  },
  removeItem: () => clearAuthStorage(),
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      hasHydrated: false,
      login: (next, nextToken) => {
        const token = nextToken ?? null
        const user = { ...next, id: next.id != null ? String(next.id) : Crypto.randomUUID() }
        set({ user, token })
      },
      logout: () => set({ user: null, token: null }),
      setUser: (user) => set({ user }),
    }),
    {
      name: 'capnong-auth',
      storage: authStorage,
      partialize: ({ user, token }) => ({ user, token }),
      onRehydrateStorage: () => () => {
        useAuthStore.setState({ hasHydrated: true })
      },
    },
  ),
)

setTokenGetter(() => useAuthStore.getState().token)

// axiosInstance phát event này khi API trả 401: hết phiên thì đăng xuất;
// route guard ở app/_layout.tsx tự đưa người dùng về màn đăng nhập.
authEvents.on('unauthorized', () => {
  if (useAuthStore.getState().user) useAuthStore.getState().logout()
})

/** Đọc user hiện tại ngoài React (service, interceptor). */
export function readStoredUser(): SessionUser | null {
  const { user, token } = useAuthStore.getState()
  return user && isTokenValid(token) ? user : null
}

/** API giống useAuth() của bản web, để các component không phải sửa logic. */
export function useAuth() {
  const user = useAuthStore((s) => s.user)
  const token = useAuthStore((s) => s.token)
  const hasHydrated = useAuthStore((s) => s.hasHydrated)
  const login = useAuthStore((s) => s.login)
  const logout = useAuthStore((s) => s.logout)
  const setUser = useAuthStore((s) => s.setUser)
  const isAuthenticated = user !== null && isTokenValid(token)
  return {
    user,
    token,
    hasHydrated,
    isAuthenticated,
    hasRole: (...roles: UserRole[]) => user !== null && isAuthenticated && roles.includes(user.role),
    login,
    logout,
    setUser,
  }
}
