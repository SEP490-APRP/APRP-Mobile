/* eslint-disable @typescript-eslint/no-require-imports */
import { STORAGE_KEYS } from '@/utils/constants'

type StoreModule = typeof import('./useAuthStore')

// resetModules tạo lại cả mock SecureStore, nên lấy Map mới sau mỗi lần reset.
let secure: Map<string, string>

/** JWT giả có claim exp (giây); chữ ký không được kiểm tra phía client. */
function fakeJwt(expSecondsFromNow: number): string {
  const payload = btoa(
    JSON.stringify({ sub: '7', exp: Math.floor(Date.now() / 1000) + expSecondsFromNow }),
  )
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
  return `x.${payload}.y`
}

const user = { id: '7', name: 'Lan', email: 'lan@capnong.vn', role: 'buyer' as const }

async function loadStore() {
  const mod: StoreModule = require('./useAuthStore')
  await mod.useAuthStore.persist.rehydrate()
  return mod.useAuthStore
}

beforeEach(() => {
  jest.resetModules()
  secure = require('expo-secure-store').__store
})

describe('useAuthStore', () => {
  it('khôi phục phiên từ SecureStore khi token còn hạn', async () => {
    const token = fakeJwt(3600)
    secure.set(STORAGE_KEYS.TOKEN, token)
    secure.set(STORAGE_KEYS.USER, JSON.stringify(user))
    const store = await loadStore()
    expect(store.getState().hasHydrated).toBe(true)
    expect(store.getState().user?.email).toBe('lan@capnong.vn')
    expect(store.getState().token).toBe(token)
  })

  it('bỏ phiên và xoá storage khi token hết hạn', async () => {
    secure.set(STORAGE_KEYS.TOKEN, fakeJwt(-10))
    secure.set(STORAGE_KEYS.USER, JSON.stringify(user))
    const store = await loadStore()
    expect(store.getState().user).toBeNull()
    expect(secure.has(STORAGE_KEYS.TOKEN)).toBe(false)
  })

  it('login ghi user và token vào SecureStore; logout xoá', async () => {
    const store = await loadStore()
    const token = fakeJwt(3600)
    store.getState().login(user, token)
    await new Promise((r) => setTimeout(r, 0))
    expect(secure.get(STORAGE_KEYS.TOKEN)).toBe(token)
    expect(JSON.parse(secure.get(STORAGE_KEYS.USER) ?? '{}').email).toBe('lan@capnong.vn')

    store.getState().logout()
    await new Promise((r) => setTimeout(r, 0))
    expect(secure.has(STORAGE_KEYS.TOKEN)).toBe(false)
  })

  it('đăng xuất khi API báo 401', async () => {
    const store = await loadStore()
    store.getState().login(user, fakeJwt(3600))
    const { authEvents } = require('@/lib/authEvents')
    authEvents.emit('unauthorized')
    expect(store.getState().user).toBeNull()
  })
})
