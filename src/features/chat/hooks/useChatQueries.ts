import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
import { chatService } from '@/services/chat.service'
import type { ChatMessageRequest, Conversation } from '@/types/chat'
import { useAuthStore } from '@/stores'
import { sortMessages } from '../utils/chatMessages'

export const chatKeys = {
  all: ['chat'] as const,
  conversations: () => [...chatKeys.all, 'conversations'] as const,
  messages: (conversationId: number) => [...chatKeys.all, 'messages', conversationId] as const,
}

/** Tải lại định kỳ để vẫn nhận được tin khi WebSocket mất kết nối. */
const POLL_MS = 10_000

export function useConversations() {
  return useQuery({
    queryKey: chatKeys.conversations(),
    queryFn: () => chatService.getConversations(),
    refetchInterval: POLL_MS,
  })
}

export function useChatMessages(conversationId: number) {
  return useQuery({
    queryKey: chatKeys.messages(conversationId),
    queryFn: async () => sortMessages((await chatService.getMessages(conversationId)).content ?? []),
    enabled: conversationId > 0,
    refetchInterval: POLL_MS,
  })
}

export function useSendChatMessage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: ChatMessageRequest) => chatService.sendMessage(request),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: chatKeys.all }),
  })
}

export function useMarkConversationRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (conversationId: number) => chatService.markAsRead(conversationId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: chatKeys.conversations() }),
  })
}

export function openConversation(conversation: Conversation) {
  const role = useAuthStore.getState().user?.role
  const params = {
    id: String(conversation.id),
    name: conversation.otherUserName ?? '',
    otherUserId: String(conversation.otherUserId),
  }
  if (role === 'shop') router.push({ pathname: '/shop/messages/[id]', params })
  else if (role === 'shipper') router.push({ pathname: '/shipper/messages/[id]', params })
  else router.push({ pathname: '/buyer/messages/[id]', params })
}

/** Mở hội thoại với một người (tạo mới nếu chưa có). */
export function useStartConversation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (receiverId: number) => chatService.initConversation(receiverId),
    onSuccess: (conversation) => {
      void queryClient.invalidateQueries({ queryKey: chatKeys.conversations() })
      openConversation(conversation)
    },
  })
}
