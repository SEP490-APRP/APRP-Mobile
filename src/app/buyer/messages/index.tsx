import { Image } from 'expo-image'
import { router } from 'expo-router'
import { MessageCircle, UserRound } from 'lucide-react-native'
import { useState } from 'react'
import { FlatList, Pressable, RefreshControl, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppText, EmptyState, ErrorState, Skeleton } from '@/components/ui'
import { BackButton } from '@/features/auth/components'
import { chatTimeLabel, conversationPreview, openConversation, useChatSocket, useConversations } from '@/features/chat'
import { currentChatbotRole, homeRoute } from '@/features/chatbot'
import { colors } from '@/theme/colors'
import type { Conversation } from '@/types/chat'

function ConversationRow({ conversation }: { conversation: Conversation }) {
  const unread = conversation.unreadCount ?? 0
  return (
    <Pressable
      onPress={() => openConversation(conversation)}
      accessibilityRole="button"
      accessibilityLabel={`Mở hội thoại với ${conversation.otherUserName}${unread > 0 ? `, ${unread} tin chưa đọc` : ''}`}
      className="flex-row items-center gap-3 rounded-card border border-line bg-white p-3 active:bg-leaf-50"
    >
      {conversation.otherUserAvatar ? (
        <Image source={{ uri: conversation.otherUserAvatar }} contentFit="cover" style={{ width: 44, height: 44, borderRadius: 22 }} />
      ) : (
        <View className="h-11 w-11 items-center justify-center rounded-full bg-leaf-100">
          <UserRound size={20} color={colors.leaf700} />
        </View>
      )}
      <View className="flex-1 gap-0.5">
        <AppText weight="bold" numberOfLines={1} className="text-sm">
          {conversation.otherUserName}
        </AppText>
        <AppText weight={unread > 0 ? 'semibold' : 'regular'} numberOfLines={1} className="text-caption text-ink-muted">
          {conversationPreview(conversation)}
        </AppText>
      </View>
      <View className="items-end gap-1">
        <AppText className="text-caption text-ink-subtle">{chatTimeLabel(conversation.lastMessageTime)}</AppText>
        {unread > 0 && (
          <View className="h-5 min-w-5 items-center justify-center rounded-full bg-sale px-1">
            <AppText weight="bold" className="text-caption text-white">
              {unread > 99 ? '99+' : unread}
            </AppText>
          </View>
        )}
      </View>
    </Pressable>
  )
}

/** Danh sách hội thoại. Chuyển từ ChatInboxScreen của app cũ, API theo bản web. Shop và Shipper dùng lại màn này. */
export default function MessagesScreen() {
  const conversations = useConversations()
  const [refreshing, setRefreshing] = useState(false)
  useChatSocket()

  const refresh = async () => {
    setRefreshing(true)
    await conversations.refetch()
    setRefreshing(false)
  }

  return (
    <SafeAreaView className="flex-1 bg-paper" edges={['top']}>
      <View className="flex-row items-center gap-2 px-4 py-3">
        <BackButton onPress={() => (router.canGoBack() ? router.back() : router.replace(homeRoute[currentChatbotRole()]))} />
        <AppText accessibilityRole="header" weight="extrabold" className="flex-1 text-base">
          Tin nhắn
        </AppText>
      </View>
      {conversations.isPending ? (
        <View className="gap-3 p-4">
          <Skeleton className="h-20 w-full rounded-panel" />
          <Skeleton className="h-20 w-full rounded-panel" />
          <Skeleton className="h-20 w-full rounded-panel" />
        </View>
      ) : conversations.isError ? (
        <ErrorState onRetry={() => void conversations.refetch()} />
      ) : (
        <FlatList
          data={conversations.data}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <ConversationRow conversation={item} />}
          contentContainerClassName="gap-3 p-4 pb-10"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} tintColor={colors.leaf700} colors={[colors.leaf700]} />
          }
          ListEmptyComponent={
            <EmptyState
              icon={<MessageCircle size={28} color={colors.leaf700} />}
              title="Chưa có tin nhắn"
              description="Các cuộc trò chuyện của bạn sẽ hiện ở đây."
            />
          }
        />
      )}
    </SafeAreaView>
  )
}
