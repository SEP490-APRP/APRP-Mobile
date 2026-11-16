import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { chatService } from '@/services/chat.service'
import type { ChatMessage } from '@/types/chat'

export const chatKeys = {
  all: ['chat'] as const,
  conversations: () => [...chatKeys.all, 'conversations'] as const,
  messages: (conversationId: number) => [...chatKeys.all, 'messages', conversationId] as const,
  unreadCount: () => [...chatKeys.all, 'unreadCount'] as const,
}

export function useConversations() {
  return useQuery({
    queryKey: chatKeys.conversations(),
    queryFn: async () => {
      const res = await chatService.getConversations()
      return res.result ?? []
    },
    refetchInterval: 5000,
  })
}

export function useChatUnreadCount() {
  return useQuery({
    queryKey: chatKeys.unreadCount(),
    queryFn: async () => {
      const res = await chatService.getUnreadCount()
      return res.result?.unreadCount ?? 0
    },
    refetchInterval: 10_000,
  })
}

export function useChatMessages(conversationId: number) {
  return useQuery({
    queryKey: chatKeys.messages(conversationId),
    queryFn: async () => {
      if (!conversationId || conversationId <= 0) return []
      const res = await chatService.getMessages(conversationId, 0, 50)
      const data = res.result?.content ?? (res.result as any)?.data ?? []
      return data as ChatMessage[]
    },
    enabled: Boolean(conversationId && conversationId > 0),
    refetchInterval: 3000, // Polling dự phòng 3s đảm bảo không bao giờ trễ tin nhắn
  })
}

export function useSendMessage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      receiverId,
      content,
      type = 'TEXT',
      attachmentUrl,
    }: {
      receiverId: number
      content: string
      type?: string
      attachmentUrl?: string
    }) => {
      const res = await chatService.sendMessage(receiverId, content, type, attachmentUrl)
      return res.result
    },
    onSuccess: (newMsg) => {
      if (newMsg?.conversationId) {
        queryClient.invalidateQueries({
          queryKey: chatKeys.messages(newMsg.conversationId),
        })
      }
      queryClient.invalidateQueries({ queryKey: chatKeys.conversations() })
    },
  })
}

export function useInitConversation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (receiverId: number) => {
      const res = await chatService.initConversation(receiverId)
      return res.result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.conversations() })
    },
  })
}

export function useMarkConversationRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (conversationId: number) => {
      await chatService.markAsRead(conversationId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.conversations() })
      queryClient.invalidateQueries({ queryKey: chatKeys.unreadCount() })
    },
  })
}

export function useDeleteMessage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      messageId,
      conversationId: _conversationId,
    }: {
      messageId: number
      conversationId?: number
    }) => {
      await chatService.deleteMessage(messageId)
    },
    onSuccess: (_, variables) => {
      if (variables.conversationId) {
        queryClient.invalidateQueries({
          queryKey: chatKeys.messages(variables.conversationId),
        })
      }
      queryClient.invalidateQueries({ queryKey: chatKeys.conversations() })
    },
  })
}
