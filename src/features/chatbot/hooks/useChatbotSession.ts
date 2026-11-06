import { useEffect } from 'react'
import { useAuth } from '@/stores'
import { useChatbotStore } from '../stores/useChatbotStore'

/** Mỗi tài khoản một hội thoại riêng; đăng xuất thì xoá khỏi bộ nhớ để người dùng sau không thấy. */
export function useChatbotSession() {
  const { user } = useAuth()
  const userId = user?.id
  const loadHistory = useChatbotStore((s) => s.loadHistory)
  const reset = useChatbotStore((s) => s.reset)

  useEffect(() => {
    reset()
    if (userId) void loadHistory()
    return reset
  }, [userId, loadHistory, reset])
}
