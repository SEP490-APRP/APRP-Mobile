import { Image } from 'expo-image'
import { router, useLocalSearchParams } from 'expo-router'
import { Send } from 'lucide-react-native'
import { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Pressable, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppText, ErrorState, Skeleton } from '@/components/ui'
import { BackButton } from '@/features/auth/components'
import {
  canSendChat,
  chatTimeLabel,
  isMineMessage,
  useChatMessages,
  useChatSocket,
  useMarkConversationRead,
  useSendChatMessage,
} from '@/features/chat'
import { currentChatbotRole, messagesRoute } from '@/features/chatbot'
import { useAuth, useUiStore } from '@/stores'
import { colors } from '@/theme/colors'
import { fontFamily } from '@/theme/fonts'
import type { ChatMessage } from '@/types/chat'
import { getErrorMessage } from '@/utils/errors'
import { cn } from '@/utils/helpers'

function MessageBubble({ message, mine }: { message: ChatMessage; mine: boolean }) {
  return (
    <View className={cn('max-w-[82%] gap-1', mine ? 'items-end self-end' : 'items-start self-start')}>
      <View className={cn('gap-1.5 rounded-card px-3.5 py-2.5', mine ? 'rounded-tr-sm bg-leaf-700' : 'rounded-tl-sm border border-line bg-white')}>
        {!!message.attachmentUrl && (
          <Image source={{ uri: message.attachmentUrl }} contentFit="cover" style={{ width: 200, height: 150, borderRadius: 10 }} />
        )}
        {!!message.content && <AppText className={cn('text-sm leading-relaxed', mine ? 'text-white' : 'text-ink')}>{message.content}</AppText>}
      </View>
      <AppText className="px-1 text-caption text-ink-subtle">{chatTimeLabel(message.sentAt || message.createdAt)}</AppText>
    </View>
  )
}

/** Một hội thoại. Chuyển từ ChatDetailScreen của app cũ, API theo bản web. Shop và Shipper dùng lại màn này. */
export default function ConversationScreen() {
  const params = useLocalSearchParams<{ id: string; name?: string; otherUserId?: string }>()
  const conversationId = Number(params.id) || 0
  const otherUserId = Number(params.otherUserId) || 0
  const { user } = useAuth()
  const messages = useChatMessages(conversationId)
  const send = useSendChatMessage()
  const { mutate: markRead } = useMarkConversationRead()
  const showToast = useUiStore((s) => s.showToast)
  const listRef = useRef<FlatList<ChatMessage>>(null)
  const [text, setText] = useState('')
  const count = messages.data?.length ?? 0
  const canSend = canSendChat(text, send.isPending) && otherUserId > 0
  useChatSocket()

  useEffect(() => {
    if (conversationId > 0 && count > 0) markRead(conversationId)
  }, [conversationId, count, markRead])

  const handleSend = () => {
    if (!canSend) return
    const content = text.trim()
    setText('')
    send.mutate(
      { receiverId: otherUserId, content, type: 'TEXT' },
      {
        onError: (err) => {
          // Trả lại nội dung để người dùng không phải gõ lại.
          setText(content)
          showToast(getErrorMessage(err, 'Không thể gửi tin nhắn. Vui lòng thử lại.'))
        },
      },
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-paper" edges={['top', 'bottom']}>
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View className="flex-row items-center gap-2 border-b border-line bg-white px-3 py-2">
          <BackButton onPress={() => (router.canGoBack() ? router.back() : router.replace(messagesRoute[currentChatbotRole()]))} />
          <AppText accessibilityRole="header" weight="extrabold" numberOfLines={1} className="flex-1 text-base">
            {params.name || 'Tin nhắn'}
          </AppText>
        </View>

        {messages.isPending ? (
          <View className="flex-1 gap-3 p-4">
            <Skeleton className="h-12 w-2/3 rounded-panel" />
            <Skeleton className="h-12 w-1/2 self-end rounded-panel" />
          </View>
        ) : messages.isError ? (
          <View className="flex-1">
            <ErrorState onRetry={() => void messages.refetch()} />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages.data}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => <MessageBubble message={item} mine={isMineMessage(item, user?.id)} />}
            contentContainerClassName="gap-3 p-3"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
            ListEmptyComponent={
              <AppText className="py-10 text-center text-sm text-ink-muted">Hãy gửi tin nhắn đầu tiên nhé!</AppText>
            }
          />
        )}

        <View className="flex-row items-end gap-2 border-t border-line bg-white px-3 py-2.5">
          <TextInput
            value={text}
            onChangeText={setText}
            multiline
            placeholder="Nhập tin nhắn..."
            placeholderTextColor={colors.inkSubtle}
            accessibilityLabel="Nhập tin nhắn"
            className="max-h-28 min-h-11 flex-1 rounded-card border border-line-strong bg-paper px-3.5 py-2.5 text-sm text-ink"
            style={{ fontFamily: fontFamily.regular }}
          />
          <Pressable
            onPress={handleSend}
            disabled={!canSend}
            accessibilityRole="button"
            accessibilityLabel="Gửi tin nhắn"
            accessibilityState={{ disabled: !canSend, busy: send.isPending }}
            className={cn('h-11 w-11 items-center justify-center rounded-card bg-leaf-700 active:bg-leaf-800', !canSend && 'opacity-50')}
          >
            {send.isPending ? <ActivityIndicator color={colors.white} /> : <Send size={18} color={colors.white} />}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
