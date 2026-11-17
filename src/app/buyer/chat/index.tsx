import { router, useFocusEffect } from 'expo-router'
import {
  Headphones,
  Search,
  X,
} from 'lucide-react-native'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppText, EmptyState, ErrorState } from '@/components/ui'
import { BackButton } from '@/features/auth/components/BackButton'
import { useConversations } from '@/features/chat'
import { chatService } from '@/services/chat.service'
import { soundService } from '@/services/sound.service'
import { useAuthStore } from '@/stores'
import type { Conversation } from '@/types/chat'
import { colors } from '@/theme/colors'
import { cn } from '@/utils/helpers'

const ADMIN_USER_ID = 1
const SUPPORT_NAME = 'Trung tâm hỗ trợ CapNong'

const fmtTime = (iso?: string) => {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    const diff = Math.floor((Date.now() - d.getTime()) / 60000)
    if (diff < 1) return 'Vừa xong'
    if (diff < 60) return `${diff}ph`
    if (diff < 1440) return `${Math.floor(diff / 60)}g`
    const yesterday = new Date(Date.now() - 86400000)
    if (d.toDateString() === yesterday.toDateString()) {
      return 'Hôm qua'
    }
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
  } catch {
    return ''
  }
}

const getRoleBadge = (role?: string) => {
  switch ((role ?? '').toUpperCase()) {
    case 'SHOP':
    case 'SHOP_OWNER':
      return { label: 'Chủ shop', bg: 'bg-leaf-100 text-leaf-800' }
    case 'SHIPPER':
      return { label: 'Tài xế', bg: 'bg-amber-100 text-amber-800' }
    case 'ADMIN':
      return { label: 'Hỗ trợ', bg: 'bg-emerald-100 text-emerald-800' }
    default:
      return null
  }
}

export default function BuyerChatInboxScreen() {
  const [search, setSearch] = useState('')
  const [pullRefreshing, setPullRefreshing] = useState(false)
  const { data: rawConvs, isLoading, isError, refetch } = useConversations()

  // Tự động làm mới danh sách khi quay lại màn hình
  useFocusEffect(
    useCallback(() => {
      refetch()
    }, [refetch]),
  )

  const handlePullRefresh = async () => {
    setPullRefreshing(true)
    try {
      await refetch()
    } finally {
      setPullRefreshing(false)
    }
  }

  // Kết nối WebSocket khi vào trang tin nhắn để nhận cập nhật tức thì
  useEffect(() => {
    chatService.connect()
    const unsubscribeMsg = chatService.onMessage((msg) => {
      if (Number(msg?.senderId) !== Number(useAuthStore.getState().user?.id)) {
        soundService.playMessageChime()
      }
      refetch()
    })
    const unsubscribeNotif = chatService.onNotification(() => {
      refetch()
    })
    return () => {
      unsubscribeMsg()
      unsubscribeNotif()
    }
  }, [refetch])

  // Chuẩn hóa danh sách: Ghim trung tâm hỗ trợ lên đầu nếu chưa có
  const conversations = useMemo(() => {
    const list = [...(rawConvs ?? [])]
    const adminConv = list.find((c) => c.otherUserId === ADMIN_USER_ID)

    let result: Conversation[] = []
    if (!adminConv) {
      const supportPlaceholder: Conversation = {
        id: -1,
        roomKey: '',
        otherUserId: ADMIN_USER_ID,
        otherUserName: SUPPORT_NAME,
        otherUserRole: 'ADMIN',
        lastMessage: 'Liên hệ đội ngũ chăm sóc khách hàng CapNong',
        lastMessageTime: new Date().toISOString(),
        unreadCount: 0,
      }
      result = [supportPlaceholder, ...list]
    } else {
      const updated = { ...adminConv, otherUserName: SUPPORT_NAME, otherUserRole: 'ADMIN' }
      result = [updated, ...list.filter((c) => c.otherUserId !== ADMIN_USER_ID)]
    }

    if (!search.trim()) return result

    const q = search.toLowerCase().trim()
    return result.filter(
      (c) =>
        c.otherUserName.toLowerCase().includes(q) ||
        (c.lastMessage && c.lastMessage.toLowerCase().includes(q)),
    )
  }, [rawConvs, search])

  const handleOpenConversation = (conv: Conversation) => {
    router.push({
      pathname: '/buyer/chat/[id]',
      params: {
        id: String(conv.id),
        receiverId: String(conv.otherUserId),
        name: conv.otherUserName,
        role: conv.otherUserRole || '',
        avatar: conv.otherUserAvatar || '',
      },
    } as any)
  }

  return (
    <SafeAreaView className="flex-1 bg-paper" edges={['top']}>
      {/* Top Header */}
      <View className="flex-row items-center gap-2 border-b border-line bg-paper px-4 pb-3 pt-2">
        <BackButton />
        <AppText weight="extrabold" className="text-lg flex-1">
          Tin nhắn & Hỗ trợ
        </AppText>
      </View>

      {/* Search Input */}
      <View className="border-b border-line bg-paper px-4 py-2.5">
        <View className="h-10 flex-row items-center rounded-xl border border-line bg-white px-3">
          <Search size={16} color={colors.inkSubtle} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Tìm kiếm cuộc trò chuyện, nhà vườn..."
            placeholderTextColor={colors.inkSubtle}
            className="h-full flex-1 px-2.5 text-xs text-ink"
            style={{ fontFamily: 'BeVietnamPro_400Regular' }}
          />
          {!!search && (
            <Pressable onPress={() => setSearch('')} hitSlop={8}>
              <X size={15} color={colors.inkSubtle} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Conversation List */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <AppText className="text-sm text-ink-muted">Đang tải cuộc trò chuyện...</AppText>
        </View>
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : conversations.length === 0 ? (
        <EmptyState
          title="Chưa có tin nhắn nào"
          description="Hãy trò chuyện với các nhà vườn hoặc hỗ trợ viên để được tư vấn nông sản tươi ngon."
        />
      ) : (
        <FlatList<Conversation>
          data={conversations}
          keyExtractor={(c) => `${c.otherUserId}_${c.id}`}
          contentContainerClassName="p-3 gap-2 pb-12"
          refreshControl={
            <RefreshControl
              refreshing={pullRefreshing}
              onRefresh={handlePullRefresh}
              tintColor={colors.leaf700}
              colors={[colors.leaf700]}
            />
          }
          renderItem={({ item }) => {
            const isSupport = item.otherUserId === ADMIN_USER_ID
            const badge = getRoleBadge(item.otherUserRole)
            const hasUnread = Boolean(item.unreadCount && item.unreadCount > 0)

            return (
              <Pressable
                onPress={() => handleOpenConversation(item)}
                accessibilityRole="button"
                className={cn(
                  'flex-row items-center gap-3.5 rounded-2xl border p-3.5 active:bg-leaf-50/70',
                  isSupport
                    ? 'border-emerald-200 bg-emerald-50/40'
                    : hasUnread
                      ? 'border-leaf-300 bg-white'
                      : 'border-line bg-white',
                )}
              >
                {/* Avatar */}
                <View className="relative">
                  <View className="h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-line bg-leaf-100">
                    {isSupport ? (
                      <Headphones size={22} color={colors.leaf700} />
                    ) : item.otherUserAvatar ? (
                      <Image
                        source={{ uri: item.otherUserAvatar }}
                        style={{ width: 48, height: 48 }}
                        resizeMode="cover"
                      />
                    ) : (
                      <AppText weight="extrabold" className="text-base text-leaf-800">
                        {item.otherUserName.charAt(0).toUpperCase()}
                      </AppText>
                    )}
                  </View>

                  {/* Online Dot */}
                  <View className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-leaf-500" />
                </View>

                {/* Info & Snippet */}
                <View className="flex-1 min-w-0">
                  <View className="flex-row items-center justify-between gap-2">
                    <View className="flex-row items-center gap-1.5 flex-1 min-w-0 overflow-hidden">
                      <AppText
                        weight="extrabold"
                        numberOfLines={1}
                        className={cn('text-sm shrink', isSupport ? 'text-leaf-950' : 'text-ink')}
                      >
                        {item.otherUserName}
                      </AppText>

                      {badge && (
                        <View className={cn('rounded-full px-2 py-0.5 shrink-0', badge.bg)}>
                          <AppText weight="bold" className="text-[10px]">
                            {badge.label}
                          </AppText>
                        </View>
                      )}
                    </View>

                    <AppText className="text-[11px] text-ink-subtle shrink-0">
                      {fmtTime(item.lastMessageTime || item.lastMessageAt)}
                    </AppText>
                  </View>

                  <View className="mt-1 flex-row items-center justify-between gap-2">
                    <AppText
                      numberOfLines={1}
                      weight={hasUnread ? 'bold' : 'regular'}
                      className={cn(
                        'text-xs flex-1 truncate',
                        hasUnread ? 'text-ink' : 'text-ink-muted',
                      )}
                    >
                      {item.lastMessage || 'Bắt đầu cuộc trò chuyện'}
                    </AppText>

                    {hasUnread && (
                      <View className="h-5 min-w-[20px] items-center justify-center rounded-full bg-sale px-1.5">
                        <AppText weight="bold" className="text-[10px] text-white">
                          {item.unreadCount! > 99 ? '99+' : item.unreadCount}
                        </AppText>
                      </View>
                    )}
                  </View>
                </View>
              </Pressable>
            )
          }}
        />
      )}
    </SafeAreaView>
  )
}
