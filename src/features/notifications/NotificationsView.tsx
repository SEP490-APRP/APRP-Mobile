import { useMemo, useState } from 'react'
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
} from 'react-native'
import {
  Bell,
  CheckCheck,
  Package,
  Tag,
  Trash2,
  Truck,
  Wallet,
} from 'lucide-react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppText, CapNongLoading, EmptyState, ErrorState } from '@/components/ui'
import { BackButton } from '@/features/auth/components/BackButton'
import {
  useDeleteNotification,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useMyNotifications,
} from '@/features/notification/hooks/useNotifications'
import { NotificationDetailBottomSheet } from '@/features/notification/components/NotificationDetailBottomSheet'
import type { NotificationItem } from '@/services/notification.types'
import { colors } from '@/theme/colors'
import { cn } from '@/utils/helpers'

type FilterTab = 'ALL' | 'UNREAD' | 'ORDER' | 'SYSTEM'

const fmtRelativeTime = (iso?: string | null) => {
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

const getNotifVisual = (item: NotificationItem) => {
  const type = (item.type ?? '').toUpperCase()
  const text = `${item.title ?? ''} ${item.message ?? ''}`.toLowerCase()

  if (
    type.includes('ORDER') ||
    type.includes('SHIPPER') ||
    type.includes('DISPATCH') ||
    text.includes('đơn hàng') ||
    text.includes('vận chuyển') ||
    text.includes('giao hàng')
  ) {
    return { icon: Truck, bg: 'bg-leaf-100', color: colors.leaf700 }
  }

  if (
    text.includes('sản phẩm') ||
    text.includes('kho') ||
    text.includes('đóng gói')
  ) {
    return { icon: Package, bg: 'bg-amber-100', color: colors.soil600 }
  }

  if (
    text.includes('ví tiền') ||
    text.includes('ký quỹ') ||
    text.includes('rút tiền') ||
    text.includes('nạp tiền') ||
    text.includes('quyết toán')
  ) {
    return { icon: Wallet, bg: 'bg-sky-100', color: '#0284c7' }
  }

  if (
    text.includes('voucher') ||
    text.includes('khuyến mãi') ||
    text.includes('giảm giá')
  ) {
    return { icon: Tag, bg: 'bg-amber-100', color: colors.soil600 }
  }

  return { icon: Bell, bg: 'bg-leaf-100', color: colors.leaf700 }
}

export interface NotificationsViewProps {
  title?: string
  showBackButton?: boolean
}

export function NotificationsView({
  title = 'Thông báo',
  showBackButton = true,
}: NotificationsViewProps) {
  const [tab, setTab] = useState<FilterTab>('ALL')
  const [pullRefreshing, setPullRefreshing] = useState(false)
  const [selectedNotif, setSelectedNotif] = useState<NotificationItem | null>(null)

  const { data: pageData, isLoading, isError, refetch } = useMyNotifications(0, 50)
  const markRead = useMarkNotificationRead()
  const markAllRead = useMarkAllNotificationsRead()
  const deleteNotif = useDeleteNotification()

  const notifications: NotificationItem[] = useMemo(() => {
    return pageData?.content ?? (pageData as any)?.data ?? []
  }, [pageData])

  const filteredItems = useMemo(() => {
    return notifications.filter((item) => {
      if (tab === 'ALL') return true
      if (tab === 'UNREAD') return !item.isRead

      const type = (item.type ?? '').toUpperCase()
      const text = `${item.title ?? ''} ${item.message ?? ''}`.toLowerCase()

      if (tab === 'ORDER') {
        return (
          type.includes('ORDER') ||
          type.includes('SHIPPER') ||
          type.includes('DISPATCH') ||
          text.includes('đơn hàng') ||
          text.includes('vận chuyển') ||
          text.includes('giao hàng')
        )
      }

      if (tab === 'SYSTEM') {
        return (
          !type.includes('ORDER') &&
          !type.includes('SHIPPER') &&
          !type.includes('DISPATCH') &&
          !text.includes('đơn hàng') &&
          !text.includes('vận chuyển') &&
          !text.includes('giao hàng')
        )
      }

      return true
    })
  }, [notifications, tab])

  const handlePullRefresh = async () => {
    setPullRefreshing(true)
    try {
      await refetch()
    } finally {
      setPullRefreshing(false)
    }
  }

  const handleItemPress = (item: NotificationItem) => {
    if (!item.isRead) {
      markRead.mutate(item.id)
    }
    setSelectedNotif(item)
  }

  const handleDeleteItem = (id: number) => {
    Alert.alert('Xóa thông báo', 'Bạn có chắc chắn muốn xóa thông báo này không?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xóa', style: 'destructive', onPress: () => deleteNotif.mutate(id) },
    ])
  }

  const handleMarkAllRead = () => {
    if (notifications.every((n) => n.isRead)) return
    markAllRead.mutate()
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length

  return (
    <SafeAreaView className="flex-1 bg-paper" edges={['top']}>
      {/* Top Header */}
      <View className="flex-row items-center justify-between border-b border-line bg-paper px-4 pb-3 pt-2">
        <View className="flex-1 flex-row items-center gap-2 pr-2">
          {showBackButton && <BackButton />}
          <AppText weight="extrabold" numberOfLines={1} className="text-lg text-ink flex-1">
            {title}
          </AppText>
        </View>

        <Pressable
          onPress={handleMarkAllRead}
          disabled={markAllRead.isPending || unreadCount === 0}
          accessibilityRole="button"
          accessibilityLabel="Đánh dấu tất cả đã đọc"
          hitSlop={8}
          className={cn(
            'shrink-0 flex-row items-center gap-1.5 rounded-xl border border-line bg-white px-3 py-1.5 active:bg-leaf-50',
            unreadCount === 0 && 'opacity-50',
          )}
        >
          <CheckCheck size={16} color={colors.leaf700} />
          <AppText weight="bold" className="text-xs text-leaf-800">
            Đọc tất cả
          </AppText>
        </Pressable>
      </View>

      {/* Filter Tabs Chips (Lướt ngang linh hoạt trên mọi kích thước màn hình) */}
      <View className="border-b border-line bg-paper">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="flex-row items-center gap-2 px-4 py-2.5"
        >
          {(
            [
              { key: 'ALL', label: `Tất cả (${notifications.length})` },
              { key: 'UNREAD', label: `Chưa đọc (${unreadCount})` },
              { key: 'ORDER', label: 'Đơn hàng' },
              { key: 'SYSTEM', label: 'Hệ thống' },
            ] as const
          ).map((t) => {
            const active = tab === t.key
            return (
              <Pressable
                key={t.key}
                onPress={() => setTab(t.key)}
                className={cn(
                  'rounded-full px-3.5 py-1.5 border',
                  active
                    ? 'border-leaf-700 bg-leaf-700'
                    : 'border-line bg-white active:bg-paper',
                )}
              >
                <AppText
                  weight={active ? 'bold' : 'medium'}
                  className={cn('text-xs whitespace-nowrap', active ? 'text-white' : 'text-ink-muted')}
                >
                  {t.label}
                </AppText>
              </Pressable>
            )
          })}
        </ScrollView>
      </View>

      {/* Danh sách thông báo */}
      {isLoading ? (
        <CapNongLoading message="Đang tải thông báo..." />
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : filteredItems.length === 0 ? (
        <View className="flex-1 justify-center px-5">
          <EmptyState
            icon={<Bell size={36} color={colors.leaf600} />}
            title={tab === 'UNREAD' ? 'Không có thông báo chưa đọc' : 'Chưa có thông báo nào'}
            description={
              tab === 'UNREAD'
                ? 'Bạn đã đọc tất cả thông báo.'
                : 'Các cập nhật về đơn hàng, vận chuyển và thông tin từ Cáp Nông sẽ xuất hiện tại đây.'
            }
          />
        </View>
      ) : (
        <FlatList<NotificationItem>
          data={filteredItems}
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
            const { icon: Icon, bg, color } = getNotifVisual(item)
            const isRead = Boolean(item.isRead)

            return (
              <Pressable
                onPress={() => handleItemPress(item)}
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

                    {/* Dấu chấm xanh chưa đọc */}
                    {!isRead && (
                      <View className="h-2 w-2 rounded-full bg-leaf-600" />
                    )}
                  </View>

                  <AppText
                    numberOfLines={2}
                    className="mt-1 text-xs leading-relaxed text-ink-muted"
                  >
                    {item.message}
                  </AppText>

                  <View className="mt-2.5 flex-row items-center justify-between">
                    <AppText className="text-[11px] text-ink-subtle">
                      {fmtRelativeTime(item.createAt || item.createdAt)}
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

      {/* Bottom Sheet xem chi tiết thông báo */}
      <NotificationDetailBottomSheet
        notification={selectedNotif}
        visible={Boolean(selectedNotif)}
        onClose={() => setSelectedNotif(null)}
        onDelete={(id) => deleteNotif.mutate(id)}
      />
    </SafeAreaView>
  )
}
