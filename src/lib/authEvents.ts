/**
 * Thay cho window.dispatchEvent / addEventListener của bản web:
 * axiosInstance phát 'unauthorized' khi API trả 401 hoặc token hết hạn,
 * useAuthStore nghe để đăng xuất.
 */
type AuthEvent = 'unauthorized'
type Listener = () => void

const listeners = new Map<AuthEvent, Set<Listener>>()

export const authEvents = {
  on(event: AuthEvent, listener: Listener): () => void {
    const set = listeners.get(event) ?? new Set<Listener>()
    set.add(listener)
    listeners.set(event, set)
    return () => set.delete(listener)
  },
  emit(event: AuthEvent): void {
    listeners.get(event)?.forEach((listener) => listener())
  },
}
