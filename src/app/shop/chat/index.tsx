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
import { AppText, EmptyState, ErrorState, Skeleton } from '@/components/ui'
import { BackButton } from '@/features/auth/components'
import { useConversations } from '@/features/chat'
import { chatService } from '@/services/chat.service'
import { soundService } from '@/services/sound.service'
import { useAuthStore } from '@/stores'
import { colors } from '@/theme/colors'
import { fontFamily } from '@/theme/fonts'
import type { Conversation } from '@/types/chat'
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
    case 'BUYER':
    case 'CUSTOMER':
      return { label: 'Khách mua', bg: 'bg-leaf-100 text-leaf-800' }
    case 'SHIPPER':
      return { label: 'Tài xế', bg: 'bg-amber-100 text-amber-800' }
    case 'ADMIN':
      return { label: 'Admin Hỗ trợ', bg: 'bg-emerald-100 text-emerald-800' }
    default:
      return { label: 'Khách hàng', bg: 'bg-leaf-50 text-leaf-800' }
  }
}

export default function ShopChatInboxScreen() {
  const [search, setSearch] = useState('')
  const [pullRefreshing, setPullRefreshing] = useState(false)
  const { data: rawConvs, isLoading, isError, refetch } = useConversations()

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

  const conversations = useMemo(() => {
    if (!rawConvs) return []
    const q = search.trim().toLowerCase()
    return rawConvs.filter((c) => {
      if (!q) return true
      const name = (c.otherUserName ?? '').toLowerCase()
      const lastMsg = (c.lastMessage ?? '').toLowerCase()
      return name.includes(q) || lastMsg.includes(q)
    })
  }, [rawConvs, search])

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/shop/(tabs)/account'))

  const handleOpenSupport = () => {
    router.push({
      pathname: '/shop/chat/[id]' as any,
      params: {
        id: String(ADMIN_USER_ID),
        partnerName: SUPPORT_NAME,
        partnerRole: 'ADMIN',
      },
    })
  }

  const handleOpenConversation = (item: Conversation) => {
    router.push({
      pathname: '/shop/chat/[id]' as any,
      params: {
        id: String(item.otherUserId),
        conversationId: String(item.id),
        partnerName: item.otherUserName ?? 'Khách mua',
        partnerAvatar: item.otherUserAvatar ?? '',
        partnerRole: item.otherUserRole ?? 'BUYER',
      },
    })
  }

  return (
    <SafeAreaView className="flex-1 bg-paper" edges={['top', 'bottom']}>
      {/* Header */}
      <View className="border-b border-line bg-paper px-3 pb-3 pt-2">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <BackButton onPress={goBack} />
            <AppText weight="extrabold" className="text-lg">
              Tin Nhắn Khách Hàng
            </AppText>
          </View>
          <Pressable
            onPress={handleOpenSupport}
            className="flex-row items-center gap-1 rounded-full bg-emerald-50 px-3 py-1.5 active:bg-emerald-100"
          >
            <Headphones size={15} color="#059669" />
            <AppText weight="bold" className="text-xs text-emerald-800">
              Admin
            </AppText>
          </Pressable>
        </View>

        {/* Ô Tìm Kiếm */}
        <View className="mt-3 h-10 flex-row items-center rounded-xl border border-line bg-white px-3">
          <Search size={16} color={colors.inkSubtle} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Tìm theo tên khách hoặc nội dung tin nhắn..."
            placeholderTextColor={colors.inkSubtle}
            className="h-full flex-1 px-2 text-xs text-ink"
            style={{ fontFamily: fontFamily.regular }}
          />
          {!!search && (
            <Pressable onPress={() => setSearch('')} className="p-1">
              <X size={14} color={colors.inkSubtle} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Danh sách tin nhắn */}
      {isLoading ? (
        <View className="gap-3 p-4">
          <Skeleton className="h-20 rounded-panel" />
          <Skeleton className="h-20 rounded-panel" />
          <Skeleton className="h-20 rounded-panel" />
        </View>
      ) : isError ? (
        <ErrorState title="Không thể tải danh sách tin nhắn" onRetry={refetch} />
      ) : conversations.length === 0 ? (
        <EmptyState
          title="Chưa có tin nhắn nào"
          description="Khi có khách hàng hỏi về nông sản hoặc hỗ trợ đơn hàng, cuộc trò chuyện sẽ hiển thị ở đây."
        />
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(c) => String(c.id)}
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
            const hasUnread = (item.unreadCount ?? 0) > 0
            const badge = getRoleBadge(item.otherUserRole)
            const initials = (item.otherUserName ?? 'K').charAt(0).toUpperCase()

            return (
              <Pressable
                onPress={() => handleOpenConversation(item)}
                className={cn(
                  'flex-row items-center gap-3 rounded-panel border border-line p-3 active:bg-leaf-50',
                  hasUnread ? 'bg-white shadow-sm' : 'bg-white/80',
                )}
              >
                {/* Avatar */}
                <View className="relative">
                  {item.otherUserAvatar ? (
                    <Image
                      source={{ uri: item.otherUserAvatar }}
                      style={{ width: 48, height: 48, borderRadius: 24 }}
                    />
                  ) : (
                    <View className="h-12 w-12 items-center justify-center rounded-full bg-sun-200">
                      <AppText weight="extrabold" className="text-base text-sun-900">
                        {initials}
                      </AppText>
                    </View>
                  )}
                  {hasUnread && (
                    <View className="absolute -top-1 -right-1 h-5 min-w-[20px] items-center justify-center rounded-full bg-sale px-1.5">
                      <AppText weight="bold" className="text-[10px] text-white">
                        {item.unreadCount}
                      </AppText>
                    </View>
                  )}
                </View>

                {/* Info */}
                <View className="min-w-0 flex-1 justify-center gap-1">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-1.5 flex-1 min-w-0 pr-2">
                      <AppText
                        weight={hasUnread ? 'extrabold' : 'bold'}
                        numberOfLines={1}
                        className="text-sm text-ink"
                      >
                        {item.otherUserName ?? 'Khách mua'}
                      </AppText>
                      {badge && (
                        <View className={cn('rounded px-1.5 py-0.5', badge.bg)}>
                          <AppText weight="semibold" className="text-[9px]">
                            {badge.label}
                          </AppText>
                        </View>
                      )}
                    </View>
                    <AppText className="text-[10px] text-ink-subtle">
                      {fmtTime(item.lastMessageTime)}
                    </AppText>
                  </View>

                  <AppText
                    weight={hasUnread ? 'semibold' : 'regular'}
                    numberOfLines={1}
                    className={cn('text-xs', hasUnread ? 'text-ink' : 'text-ink-muted')}
                  >
                    {item.lastMessage || 'Bắt đầu cuộc trò chuyện'}
                  </AppText>
                </View>
              </Pressable>
            )
          }}
        />
      )}
    </SafeAreaView>
  )
}
