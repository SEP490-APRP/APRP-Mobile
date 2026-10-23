import { create } from 'zustand'
import { persist, type PersistStorage } from 'zustand/middleware'
import { allProducts, changeQuantity, type Cart } from '@/mocks/catalog'
import { STORAGE_KEYS } from '@/utils'
import { asyncStorage, readJson } from './storage'

type CartState = {
  /** id sản phẩm catalog -> số lượng */
  items: Cart
  changeQuantity: (id: string, delta: number) => void
  remove: (id: string) => void
  clear: () => void
}

type PersistedCart = Pick<CartState, 'items'>

/**
 * Chỉ giữ sản phẩm có trong catalog, số lượng nguyên dương và không vượt tồn kho
 * (giống restoreCart cũ trong App.tsx).
 */
export function sanitizeCart(saved: unknown): Cart {
  if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return {}
  return Object.fromEntries(
    allProducts.flatMap((p) => {
      const n = (saved as Record<string, unknown>)[p.id]
      return typeof n === 'number' && Number.isInteger(n) && n > 0
        ? [[p.id, Math.min(n, p.stock)]]
        : []
    }),
  )
}

/** Giữ định dạng của bản web cho key capnong-cart ({ carrot: 2 }) để không mất giỏ của người dùng. */
const legacyCartStorage: PersistStorage<PersistedCart> = {
  getItem: async () => ({
    state: { items: sanitizeCart(await readJson(asyncStorage, STORAGE_KEYS.CART)) },
    version: 0,
  }),
  setItem: (_name, { state }) => asyncStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(state.items)),
  removeItem: () => asyncStorage.removeItem(STORAGE_KEYS.CART),
}

export const useCartStore = create<CartState>()(
  persist(
      (set) => ({
        items: {},
        changeQuantity: (id, delta) =>
          set((s) => ({ items: changeQuantity(s.items, id, delta) })),
        remove: (id) =>
          set(
            (s) => ({ items: changeQuantity(s.items, id, -(s.items[id] ?? 0)) }),
          ),
        clear: () => set({ items: {} }),
      }),
      {
        name: 'capnong-cart',
        storage: legacyCartStorage,
        partialize: ({ items }) => ({ items }),
      },
  ),
)

export const cartCount = (items: Cart) => Object.values(items).reduce((a, b) => a + b, 0)

export const cartTotal = (items: Cart) =>
  allProducts.reduce((sum, p) => sum + p.price * (items[p.id] ?? 0), 0)
