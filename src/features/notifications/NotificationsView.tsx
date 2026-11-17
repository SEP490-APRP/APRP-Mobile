import { useState } from 'react'
import {
  FlatList,
  Pressable,
  RefreshControl,
  View,
} from 'react-native'
import {
  Bell,
  CheckCheck,
  MessageSquare,
  Package,
  Sparkles,
  Truck,
} from 'lucide-react-native'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AppText, CapNongLoading, EmptyState } from '@/components/ui'
import { notificationService, type NotificationItem } from '@/services/notification.service'
import { handleNotificationDeepLink } from '@/services/pushNotification'
import { useAuth } from '@/stores'
import { colors } from '@/theme/colors'
import { cn } from '@/utils/helpers'

type FilterTab = 'ALL' | 'ORDER' | 'SYSTEM'

export function NotificationsView() {
  const [tab, setTab] = useState<FilterTab>('ALL')
  const queryClient = useQueryClient()
  const { user } = useAuth()

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['notifications', 'my'],
    queryFn: async () => {
      const res = await notificationService.getMyNotifications()
      return res.result ?? []
    },
  })

  const markReadMutation = useMutation({
    mutationFn: (id: number) => notificationService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] })
    },
  })

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] })
    },
  })

  const items: NotificationItem[] = data ?? []

  const filteredItems = items.filter((item) => {
    if (tab === 'ALL') return true
    const type = (item.type ?? '').toUpperCase()
    if (tab === 'ORDER') {
      return (
        type.startsWith('ORDER_') ||
        type.startsWith('NEW_ORDER') ||
        type.startsWith('SHIPPER_') ||
        type.startsWith('DISPATCH_')
      )
    }
    if (tab === 'SYSTEM') {
      return !type.startsWith('ORDER_') && !type.startsWith('NEW_ORDER')
    }
    return true
  })

  const handleItemPress = (item: NotificationItem) => {
    if (!item.isRead) {
      markReadMutation.mutate(item.id)
    }
    handleNotificationDeepLink(
      {
        type: item.type,
        orderId: item.referenceId,
        referenceId: item.referenceId,
      },
      user?.role,
    )
  }

  const renderIcon = (type?: string | null) => {
    const upper = (type ?? '').toUpperCase()
    if (upper.startsWith('ORDER_') || upper.startsWith('NEW_ORDER')) {
      return <Package size={20} color={colors.leaf700} />
    }
    if (upper.startsWith('SHIPPER_') || upper.startsWith('DISPATCH_')) {
      return <Truck size={20} color={colors.soil600} />
    }
    if (upper.startsWith('CHAT_')) {
      return <MessageSquare size={20} color={colors.leaf600} />
    }
    return <Sparkles size={20} color={colors.inkMuted} />
  }

  return (
    <View className="flex-1 bg-paper">
      {/* Header Bar */}
      <View className="flex-row items-center justify-between border-b border-line px-5 py-4 bg-white">
        <View className="flex-row items-center gap-2">
          <Bell size={22} color={colors.leaf700} />
          <AppText weight="bold" className="text-xl text-ink">
            Thông báo
          </AppText>
        </View>

        <Pressable
          onPress={() => markAllReadMutation.mutate()}
          disabled={markAllReadMutation.isPending}
          className="flex-row items-center gap-1 active:opacity-60"
        >
          <CheckCheck size={16} color={colors.leaf700} />
          <AppText weight="medium" className="text-xs text-leaf-700">
            Đọc tất cả
          </AppText>
        </Pressable>
      </View>

      {/* Filter Tabs */}
      <View className="flex-row gap-2 px-5 py-3 border-b border-line bg-white">
        {(
          [
            { key: 'ALL', label: 'Tất cả' },
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
                'rounded-full px-4 py-1.5 border active:opacity-80',
                active
                  ? 'bg-leaf-700 border-leaf-700'
                  : 'bg-white border-line',
              )}
            >
              <AppText
                weight={active ? 'bold' : 'medium'}
                className={cn('text-xs', active ? 'text-white' : 'text-ink-muted')}
              >
                {t.label}
              </AppText>
            </Pressable>
          )
        })}
      </View>

      {/* Content List */}
      {isLoading ? (
        <CapNongLoading message="Đang tải danh sách thông báo..." />
      ) : filteredItems.length === 0 ? (
        <View className="flex-1 justify-center px-5">
          <EmptyState
            icon={<Bell size={36} color={colors.leaf600} />}
            title="Bạn chưa có thông báo nào"
            description="Các cập nhật về đơn hàng, ưu đãi và tin nhắn sẽ xuất hiện tại đây."
          />
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => String(item.id)}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => {
                refetch()
              }}
              tintColor={colors.leaf700}
            />
          }
          contentContainerClassName="p-4 gap-3"
          renderItem={({ item }) => {
            const isRead = item.isRead ?? false
            return (
              <Pressable
                onPress={() => handleItemPress(item)}
                className={cn(
                  'flex-row items-start gap-3 rounded-card p-4 border active:opacity-90',
                  isRead
                    ? 'bg-white border-line'
                    : 'bg-leaf-50/60 border-leaf-200',
                )}
              >
                <View
                  className={cn(
                    'h-10 w-10 items-center justify-center rounded-xl',
                    isRead ? 'bg-line/40' : 'bg-white border border-leaf-100',
                  )}
                >
                  {renderIcon(item.type)}
                </View>

                <View className="flex-1">
                  <View className="flex-row items-center justify-between">
                    <AppText
                      weight={isRead ? 'medium' : 'bold'}
                      className={cn('text-sm', isRead ? 'text-ink' : 'text-ink font-bold')}
                    >
                      {item.title}
                    </AppText>
                    {!isRead && (
                      <View className="h-2 w-2 rounded-full bg-leaf-600" />
                    )}
                  </View>

                  <AppText className="mt-1 text-xs text-ink-muted leading-relaxed">
                    {item.message}
                  </AppText>

                  {(item.createAt || item.createdAt) && (
                    <AppText className="mt-2 text-[10px] text-ink-subtle">
                      {new Date(item.createAt ?? item.createdAt!).toLocaleString('vi-VN')}
                    </AppText>
                  )}
                </View>
              </Pressable>
            )
          }}
        />
      )}
    </View>
  )
}
