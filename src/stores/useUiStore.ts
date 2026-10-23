import { create } from 'zustand'

const TOAST_MS = 3500
let toastTimer: ReturnType<typeof setTimeout> | undefined

type UiState = {
  toast: string
  /** Tiêu đề modal "tính năng chưa kết nối"; rỗng là đóng. */
  info: string
  cartOpen: boolean
  showToast: (message: string) => void
  hideToast: () => void
  /** Mở modal thông tin và đóng giỏ (giống showInfo cũ trong App). */
  showInfo: (title: string) => void
  hideInfo: () => void
  openCart: () => void
  closeCart: () => void
}

/** State giao diện dùng chung giữa storefront và portal (portal gọi được, storefront hiển thị). */
export const useUiStore = create<UiState>()((set) => ({
  toast: '',
  info: '',
  cartOpen: false,
  showToast: (message) => {
    clearTimeout(toastTimer)
    set({ toast: message })
    toastTimer = setTimeout(() => set({ toast: '' }), TOAST_MS)
  },
  hideToast: () => {
    clearTimeout(toastTimer)
    set({ toast: '' })
  },
  showInfo: (title) => set({ info: title, cartOpen: false }),
  hideInfo: () => set({ info: '' }),
  openCart: () => set({ cartOpen: true }),
  closeCart: () => set({ cartOpen: false }),
}))
