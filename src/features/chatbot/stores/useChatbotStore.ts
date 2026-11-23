import { create } from 'zustand'
import { cartKeys } from '@/features/cart/hooks/useCartQueries'
import { queryClient } from '@/lib/queryClient'
import { chatbotService, type AiItemOption, type ChatbotMessageResponse } from '@/services/chatbot.service'
import { getErrorMessage } from '@/utils/errors'
import {
  createErrorMessage,
  createUserMessage,
  summarizeBulkAdd,
  toBotMessage,
  toHistoryMessage,
  WELCOME_MESSAGE,
  type ChatbotMessage,
} from '../utils/chatbotMessage'

type ChatbotState = {
  /** Đang ở màn chat; dùng để đếm tin chưa đọc khi người dùng rời màn lúc bot đang trả lời. */
  isScreenOpen: boolean
  isLoading: boolean
  unreadCount: number
  messages: ChatbotMessage[]
  setScreenOpen: (open: boolean) => void
  sendMessage: (text: string) => Promise<void>
  selectOption: (item: AiItemOption, quantity?: number) => Promise<void>
  /** Trả về số món thực sự vào giỏ. */
  addMultipleToCart: (items: AiItemOption[]) => Promise<number>
  loadHistory: () => Promise<void>
  /** Ném lỗi khi API thất bại và giữ nguyên hội thoại để nơi gọi báo cho người dùng. */
  clearHistory: () => Promise<void>
  /** Đưa về hội thoại mới khi đổi tài khoản, không gọi API. */
  reset: () => void
}

/** Tăng mỗi khi hội thoại bị thay thế để bỏ các phản hồi về muộn của hội thoại cũ. */
let conversationVersion = 0

const invalidateCartIfChanged = (res: ChatbotMessageResponse) => {
  if (res.type === 'CART_UPDATED' || res.cart) void queryClient.invalidateQueries({ queryKey: cartKeys.all })
}

/** Chuyển từ features/chatbot/stores/useChatbotStore.ts bản web. */
export const useChatbotStore = create<ChatbotState>((set, get) => {
  /** Thêm tin của người dùng, gọi bot rồi thêm phản hồi. */
  const exchange = async (
    content: string,
    request: Parameters<typeof chatbotService.sendMessage>[0],
    fallback: string,
  ) => {
    const version = conversationVersion
    set((s) => ({ messages: [...s.messages, createUserMessage(content)], isLoading: true }))
    try {
      const res = await chatbotService.sendMessage(request)
      if (version !== conversationVersion) return
      invalidateCartIfChanged(res)
      set((s) => ({
        messages: [...s.messages, toBotMessage(res)],
        isLoading: false,
        unreadCount: s.isScreenOpen ? 0 : s.unreadCount + 1,
      }))
    } catch (err) {
      if (version !== conversationVersion) return
      set((s) => ({
        messages: [...s.messages, createErrorMessage(getErrorMessage(err, fallback))],
        isLoading: false,
        unreadCount: s.isScreenOpen ? 0 : s.unreadCount + 1,
      }))
    }
  }

  return {
    isScreenOpen: false,
    isLoading: false,
    unreadCount: 0,
    messages: [WELCOME_MESSAGE],

    setScreenOpen: (open) => set(open ? { isScreenOpen: true, unreadCount: 0 } : { isScreenOpen: false }),

    reset: () => {
      conversationVersion += 1
      set({ isLoading: false, unreadCount: 0, messages: [WELCOME_MESSAGE] })
    },

    loadHistory: async () => {
      const version = conversationVersion
      const history = await chatbotService.getChatHistory()
      if (version !== conversationVersion || history.length === 0) return
      set({ messages: history.map(toHistoryMessage) })
    },

    sendMessage: async (text) => {
      const trimmed = text.trim()
      if (!trimmed || get().isLoading) return
      await exchange(trimmed, { message: trimmed }, 'Đã có lỗi xảy ra. Vui lòng thử lại!')
    },

    selectOption: async (item, quantity = 1) => {
      if (get().isLoading) return
      await exchange(
        `Chọn mua: ${item.name} (${quantity} ${item.unit || 'phần'})`,
        { selectedOptionId: item.itemId, selectedOptionType: item.itemType, selectedQuantity: quantity },
        'Không thể chọn sản phẩm này.',
      )
    },

    addMultipleToCart: async (items) => {
      const validItems = (items || []).filter((i) => !i.isOutOfStock)
      if (validItems.length === 0 || get().isLoading) return 0

      const version = conversationVersion
      set({ isLoading: true })

      const failedNames: string[] = []
      let rejection: ChatbotMessageResponse | undefined
      for (const item of validItems) {
        try {
          const res = await chatbotService.sendMessage({
            selectedOptionId: item.itemId,
            selectedOptionType: item.itemType,
            selectedQuantity: item.orderQuantity || 1,
          })
          if (res.type !== 'CART_UPDATED') {
            failedNames.push(item.name)
            rejection ??= res
          }
        } catch {
          failedNames.push(item.name)
        }
        if (version !== conversationVersion) return 0
      }

      const addedCount = validItems.length - failedNames.length
      if (addedCount > 0) void queryClient.invalidateQueries({ queryKey: cartKeys.all })
      set((s) => ({
        messages: [...s.messages, summarizeBulkAdd(validItems.length, failedNames, rejection)],
        isLoading: false,
      }))
      return addedCount
    },

    clearHistory: async () => {
      await chatbotService.clearChatHistory()
      conversationVersion += 1
      set({ isLoading: false, messages: [WELCOME_MESSAGE] })
    },
  }
})
