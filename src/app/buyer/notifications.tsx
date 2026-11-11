import { router } from 'expo-router'
import {
  Bell,
  CheckCheck,
  Package,
  Tag,
  Trash2,
  Truck,
} from 'lucide-react-native'
import { useMemo, useState } from 'react'
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppText, EmptyState, ErrorState } from '@/components/ui'
import { BackButton } from '@/features/auth/components/BackButton'
import {
  useDeleteNotification,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useMyNotifications,
} from '@/features/notification'
import type { NotificationItem } from '@/services/notification.types'
import { colors } from '@/theme/colors'
import { cn } from '@/utils/helpers'

const fmtTime = (iso?: string) => {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    const diff = Math.floor((Date.now() - d.getTime()) / 60000)
    if (diff < 1) return 'Vừa xong'
    if (diff < 60) return `${diff} phút trước`
    if (diff < 1440) return `${Math.floor(diff / 60)} giờ trước`
    const yesterday = new Date(Date.now() - 86400000)
    if (d.toDateString() === yesterday.toDateString()) {
      return `Hôm qua ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    }
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
  } catch {
    return ''
  }
}

const getNotifIcon = (item: NotificationItem) => {
  const text = `${item.title} ${item.message}`.toLowerCase()
  if (text.includes('đơn hàng') || text.includes('giao hàng') || text.includes('vận chuyển')) {
    return { icon: Truck, bg: 'bg-leaf-100', color: colors.leaf700 }
  }
  if (text.includes('sản phẩm') || text.includes('kho') || text.includes('đóng gói')) {
    return { icon: Package, bg: 'bg-leaf-100', color: colors.leaf700 }
  }
  if (text.includes('voucher') || text.includes('khuyến mãi') || text.includes('giảm giá')) {
    return { icon: Tag, bg: 'bg-amber-100', color: colors.soil600 }
  }
  return { icon: Bell, bg: 'bg-leaf-50', color: colors.leaf700 }
}

export default function BuyerNotificationsScreen() {
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [pullRefreshing, setPullRefreshing] = useState(false)
  const { data: pageData, isLoading, isError, refetch } = useMyNotifications(0, 30)
  const markRead = useMarkNotificationRead()
  const markAllRead = useMarkAllNotificationsRead()
  const deleteNotif = useDeleteNotification()

  const handlePullRefresh = async () => {
    setPullRefreshing(true)
    try {
      await refetch()
    } finally {
      setPullRefreshing(false)
    }
  }

  const notifications: NotificationItem[] = useMemo(() => {
    return pageData?.content ?? (pageData as any)?.data ?? []
  }, [pageData])

  const filteredList = useMemo(() => {
    if (filter === 'unread') {
      return notifications.filter((n: NotificationItem) => !n.isRead)
    }
    return notifications
  }, [notifications, filter])

  const handlePressItem = (item: NotificationItem) => {
    if (!item.isRead) {
      markRead.mutate(item.id)
    }

    // Tự động phân tích và điều hướng đến màn hình đích tương ứng
    const text = `${item.title} ${item.message} ${item.evidence || ''}`.toLowerCase()

    // 1. Kiểm tra mã đơn hàng (VD: đơn hàng #123 hoặc id trong evidence)
    const orderMatch = text.match(/đơn hàng.*?#?(\d+)/i) || (item.evidence && item.evidence.match(/order.*?(\d+)/i))
    if (orderMatch && orderMatch[1]) {
      router.push({ pathname: '/buyer/order/[id]', params: { id: orderMatch[1] } })
      return
    }

    // 2. Kiểm tra voucher
    if (text.includes('voucher') || text.includes('khuyến mãi')) {
      router.push('/buyer/vouchers')
      return
    }
  }

  const handleMarkAllRead = () => {
    if (notifications.every((n: NotificationItem) => n.isRead)) return
    markAllRead.mutate()
  }

  const handleDeleteItem = (id: number) => {
    Alert.alert('Xóa thông báo', 'Bạn có chắc chắn muốn xóa thông báo này không?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xóa', style: 'destructive', onPress: () => deleteNotif.mutate(id) },
    ])
  }

  return (
    <SafeAreaView className="flex-1 bg-paper" edges={['top']}>
      {/* Top Header */}
      <View className="flex-row items-center justify-between border-b border-line bg-paper px-4 pb-3 pt-2">
        <View className="flex-row items-center gap-2">
          <BackButton />
          <AppText weight="extrabold" className="text-lg">
            Thông báo
          </AppText>
        </View>

        <Pressable
          onPress={handleMarkAllRead}
          disabled={markAllRead.isPending}
          accessibilityRole="button"
          accessibilityLabel="Đánh dấu tất cả đã đọc"
          hitSlop={8}
          className="flex-row items-center gap-1.5 rounded-xl border border-line bg-white px-3 py-1.5 active:bg-leaf-50"
        >
          <CheckCheck size={16} color={colors.leaf700} />
          <AppText weight="bold" className="text-xs text-leaf-800">
            Đọc tất cả
          </AppText>
        </Pressable>
      </View>

      {/* Bộ lọc nhanh: Tất cả / Chưa đọc */}
      <View className="flex-row items-center gap-2 border-b border-line bg-paper px-4 py-2.5">
        <Pressable
          onPress={() => setFilter('all')}
          className={cn(
            'rounded-full px-3.5 py-1.5 border',
            filter === 'all'
              ? 'border-leaf-700 bg-leaf-700'
              : 'border-line bg-white active:bg-paper',
          )}
        >
          <AppText
            weight="bold"
            className={cn('text-xs', filter === 'all' ? 'text-white' : 'text-ink-muted')}
          >
            Tất cả ({notifications.length})
          </AppText>
        </Pressable>

        <Pressable
          onPress={() => setFilter('unread')}
          className={cn(
            'rounded-full px-3.5 py-1.5 border',
            filter === 'unread'
              ? 'border-leaf-700 bg-leaf-700'
              : 'border-line bg-white active:bg-paper',
          )}
        >
          <AppText
            weight="bold"
            className={cn('text-xs', filter === 'unread' ? 'text-white' : 'text-ink-muted')}
          >
            Chưa đọc ({notifications.filter((n: NotificationItem) => !n.isRead).length})
          </AppText>
        </Pressable>
      </View>

      {/* Danh sách thông báo */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <AppText className="text-sm text-ink-muted">Đang tải thông báo...</AppText>
        </View>
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : filteredList.length === 0 ? (
        <EmptyState
          title={filter === 'unread' ? 'Không có thông báo chưa đọc' : 'Chưa có thông báo nào'}
          description={
            filter === 'unread'
              ? 'Bạn đã đọc tất cả thông báo.'
              : 'Các cập nhật về đơn hàng, khuyến mãi và hoạt động giải cứu sẽ xuất hiện tại đây.'
          }
        />
      ) : (
        <FlatList<NotificationItem>
          data={filteredList}
          keyExtractor={(item) => String(item.id)}
          contentContainerClassName="p-4 gap-3 pb-12"
          refreshControl={
            <RefreshControl
              refreshing={pullRefreshing}
              onRefresh={handlePullRefresh}
              tintColor={colors.leaf700}
              colors={[colors.leaf700]}
            />
          }
          renderItem={({ item }) => {
            const { icon: Icon, bg, color } = getNotifIcon(item)
            const isRead = Boolean(item.isRead)

            return (
              <Pressable
                onPress={() => handlePressItem(item)}
                accessibilityRole="button"
                className={cn(
                  'flex-row items-start gap-3.5 rounded-2xl border p-4 shadow-xs active:opacity-85',
                  isRead
                    ? 'border-line bg-white'
                    : 'border-leaf-300 bg-leaf-50/70',
                )}
              >
                {/* Icon loại thông báo */}
                <View className={cn('h-11 w-11 items-center justify-center rounded-2xl', bg)}>
                  <Icon size={20} color={color} />
                </View>

                {/* Nội dung thông báo */}
                <View className="flex-1">
                  <View className="flex-row items-center justify-between gap-2">
                    <AppText
                      weight={isRead ? 'bold' : 'extrabold'}
                      numberOfLines={2}
                      className={cn('text-sm flex-1', isRead ? 'text-ink' : 'text-leaf-950')}
                    >
                      {item.title}
                    </AppText>

                    {/* Dấu chấm chưa đọc */}
                    {!isRead && (
                      <View className="h-2 w-2 rounded-full bg-leaf-600" />
                    )}
                  </View>

                  <AppText
                    numberOfLines={3}
                    className="mt-1 text-xs leading-relaxed text-ink-muted"
                  >
                    {item.message}
                  </AppText>

                  <View className="mt-2.5 flex-row items-center justify-between">
                    <AppText className="text-[11px] text-ink-subtle">
                      {fmtTime(item.createAt || item.createdAt)}
                    </AppText>

                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation()
                        handleDeleteItem(item.id)
                      }}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel="Xóa thông báo"
                      className="h-7 w-7 items-center justify-center rounded-lg active:bg-red-50"
                    >
                      <Trash2 size={13} color={colors.inkSubtle} />
                    </Pressable>
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
