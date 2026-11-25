import { create } from 'zustand'
import { persist, type PersistStorage } from 'zustand/middleware'
import { STORAGE_KEYS } from '@/utils'
import { asyncStorage, readJson } from './storage'

export type Cart = Record<string, number>

export function changeQuantity(cart: Cart, id: string, delta: number): Cart {
  const current = cart[id] ?? 0
  const next = Math.max(0, current + delta)
  if (next === 0) {
    const { [id]: _, ...rest } = cart
    return rest
  }
  return { ...cart, [id]: next }
}

type CartState = {
  items: Cart
  changeQuantity: (id: string, delta: number) => void
  remove: (id: string) => void
  clear: () => void
}

type PersistedCart = Pick<CartState, 'items'>

export function sanitizeCart(saved: unknown): Cart {
  if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return {}
  return Object.fromEntries(
    Object.entries(saved as Record<string, unknown>).filter(
      ([, n]) => typeof n === 'number' && Number.isInteger(n) && n > 0,
    ) as [string, number][],
  )
}

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

export const cartTotal = (
  items: Cart,
  products: ReadonlyArray<{ id: string | number; price: number }> = [],
) => products.reduce((sum, p) => sum + p.price * (items[String(p.id)] ?? 0), 0)
