import { Image } from 'expo-image'
import { router } from 'expo-router'
import {
  AlertTriangle,
  ChevronRight,
  RefreshCw,
  Search,
} from 'lucide-react-native'
import { useMemo, useState } from 'react'
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppText, EmptyState, ErrorState, Skeleton } from '@/components/ui'
import { BackButton } from '@/features/auth/components'
import { money } from '@/features/product'
import { useShopDisputes, type ReturnStatus } from '@/features/shop'
import { colors } from '@/theme/colors'
import { fontFamily } from '@/theme/fonts'
import { cn } from '@/utils/helpers'

const STATUS_FILTERS: { key: string; label: string; status?: ReturnStatus }[] = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'PENDING', label: 'Chờ duyệt', status: 'PENDING' },
  { key: 'SHOP_APPROVED', label: 'Đã duyệt', status: 'SHOP_APPROVED' },
  { key: 'DISPUTED', label: 'Admin phân xử', status: 'DISPUTED' },
  { key: 'COMPLETED', label: 'Hoàn tất', status: 'COMPLETED' },
  { key: 'REJECTED', label: 'Từ chối', status: 'REJECTED' },
]

export const DISPUTE_STATUS_CONFIG: Record<
  string,
  { label: string; text: string; bg: string; dot: string }
> = {
  PENDING: { label: 'Chờ phản hồi', text: '#b45309', bg: '#fef3c7', dot: '#f59e0b' },
  SHOP_APPROVED: { label: 'Shop đã duyệt', text: '#1d4ed8', bg: '#dbeafe', dot: '#3b82f6' },
  DISPUTED: { label: 'Khiếu nại Admin', text: '#be123c', bg: '#ffe4e6', dot: '#f43f5e' },
  ADMIN_APPROVED: { label: 'Admin duyệt', text: '#4338ca', bg: '#e0e7ff', dot: '#6366f1' },
  RETURN_SHIPPING: { label: 'Chờ shipper lấy', text: '#0369a1', bg: '#e0f2fe', dot: '#0ea5e9' },
  RETURN_PICKED_UP: { label: 'Đang trả về shop', text: '#6d28d9', bg: '#ede9fe', dot: '#8b5cf6' },
  RETURN_DELIVERED: { label: 'Đã nhận hàng trả', text: '#0f766e', bg: '#ccfbf1', dot: '#14b8a6' },
  COMPLETED: { label: 'Đã hoàn tất', text: '#15803d', bg: '#dcfce7', dot: '#22c55e' },
  REJECTED: { label: 'Đã từ chối', text: '#4b5563', bg: '#f3f4f6', dot: '#9ca3af' },
  CANCELLED: { label: 'Khách đã huỷ', text: '#6b7280', bg: '#f3f4f6', dot: '#9ca3af' },
}

export default function ShopDisputesScreen() {
  const [filterKey, setFilterKey] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  const activeStatus = STATUS_FILTERS.find((f) => f.key === filterKey)?.status
  const { data, isLoading, isError, refetch } = useShopDisputes(0, 50, activeStatus)

  const rawDisputes = data?.content ?? []

  const disputes = useMemo(() => {
    if (!searchQuery.trim()) return rawDisputes
    const q = searchQuery.toLowerCase()
    return rawDisputes.filter(
      (d) =>
        d.orderId?.toString().includes(q) ||
        d.productName?.toLowerCase().includes(q) ||
        d.buyerName?.toLowerCase().includes(q) ||
        d.reason?.toLowerCase().includes(q),
    )
  }, [rawDisputes, searchQuery])

  const onRefresh = async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/shop/(tabs)/account'))

  return (
    <SafeAreaView className="flex-1 bg-paper" edges={['top', 'bottom']}>
      {/* Header */}
      <View className="border-b border-line bg-paper px-3 pb-3 pt-2">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <BackButton onPress={goBack} />
            <AppText weight="extrabold" className="text-lg">
              Khiếu Nại & Đổi Trả
            </AppText>
          </View>
          <Pressable
            onPress={onRefresh}
            accessibilityLabel="Làm mới khiếu nại"
            className="h-9 w-9 items-center justify-center rounded-full bg-leaf-50 active:bg-leaf-100"
          >
            <RefreshCw size={17} color={colors.leaf700} className={refreshing ? 'animate-spin' : ''} />
          </Pressable>
        </View>

        {/* Ô Tìm Kiếm */}
        <View className="mt-3 h-10 flex-row items-center rounded-xl border border-line bg-white px-3">
          <Search size={16} color={colors.inkSubtle} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Tìm theo mã đơn, sản phẩm, tên khách..."
            placeholderTextColor={colors.inkSubtle}
            className="h-full flex-1 px-2 text-xs text-ink"
            style={{ fontFamily: fontFamily.regular }}
          />
        </View>
      </View>

      {/* Thanh Lọc Trạng Thái Ngang */}
      <View className="border-b border-line bg-white py-2">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="px-4 gap-2">
          {STATUS_FILTERS.map((f) => {
            const isSelected = filterKey === f.key
            return (
              <Pressable
                key={f.key}
                onPress={() => setFilterKey(f.key)}
                className={cn(
                  'rounded-full px-3.5 py-1.5 border',
                  isSelected
                    ? 'border-leaf-700 bg-leaf-700'
                    : 'border-line bg-paper active:bg-leaf-50',
                )}
              >
                <AppText
                  weight="bold"
                  className={cn('text-xs', isSelected ? 'text-white' : 'text-ink-muted')}
                >
                  {f.label}
                </AppText>
              </Pressable>
            )
          })}
        </ScrollView>
      </View>

      {/* Danh sách yêu cầu */}
      {isLoading ? (
        <View className="gap-3 p-4">
          <Skeleton className="h-28 rounded-panel" />
          <Skeleton className="h-28 rounded-panel" />
          <Skeleton className="h-28 rounded-panel" />
        </View>
      ) : isError ? (
        <ErrorState title="Không thể tải danh sách khiếu nại" onRetry={refetch} />
      ) : disputes.length === 0 ? (
        <EmptyState
          title="Không có yêu cầu khiếu nại nào"
          description={
            filterKey === 'ALL'
              ? 'Tất cả đơn hàng của gian hàng đang được phục vụ suôn sẻ.'
              : 'Không có yêu cầu nào thuộc trạng thái này.'
          }
        />
      ) : (
        <FlatList
          data={disputes}
          keyExtractor={(item) => String(item.id || item.returnId)}
          contentContainerClassName="p-4 gap-3 pb-12"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.leaf700}
              colors={[colors.leaf700]}
            />
          }
          renderItem={({ item }) => {
            const cfg = DISPUTE_STATUS_CONFIG[item.status] ?? {
              label: item.status,
              text: colors.inkMuted,
              bg: '#f3f4f6',
              dot: '#9ca3af',
            }
            return (
              <Pressable
                onPress={() => router.push({ pathname: '/shop/dispute/[id]' as any, params: { id: String(item.id) } })}
                className="rounded-panel border border-line bg-white p-4 active:bg-leaf-50/40"
              >
                <View className="flex-row items-center justify-between border-b border-line pb-2.5">
                  <AppText weight="extrabold" className="text-sm text-ink">
                    Đơn #{item.orderId}
                  </AppText>
                  <View style={{ backgroundColor: cfg.bg }} className="flex-row items-center gap-1.5 rounded-full px-2.5 py-0.5">
                    <View style={{ backgroundColor: cfg.dot }} className="h-1.5 w-1.5 rounded-full" />
                    <AppText weight="bold" style={{ color: cfg.text }} className="text-[11px]">
                      {cfg.label}
                    </AppText>
                  </View>
                </View>

                <View className="mt-2.5 flex-row gap-3">
                  {item.evidence || item.productImage ? (
                    <Image
                      source={{ uri: item.evidence || item.productImage }}
                      style={{ width: 64, height: 64, borderRadius: 12 }}
                      contentFit="cover"
                    />
                  ) : (
                    <View className="h-16 w-16 items-center justify-center rounded-xl bg-paper">
                      <AlertTriangle size={24} color={colors.inkSubtle} />
                    </View>
                  )}

                  <View className="min-w-0 flex-1 justify-between">
                    <View>
                      <AppText weight="bold" numberOfLines={1} className="text-sm text-ink">
                        {item.productName || 'Nông sản'}
                      </AppText>
                      <AppText numberOfLines={1} className="mt-0.5 text-xs text-ink-muted">
                        Khách: {item.buyerName || 'Người mua'} {item.buyerPhone ? `(${item.buyerPhone})` : ''}
                      </AppText>
                    </View>

                    <View className="flex-row items-baseline justify-between">
                      <AppText className="text-xs text-ink-muted">Yêu cầu hoàn:</AppText>
                      <AppText weight="extrabold" className="text-sm text-sale">
                        {money(item.refundAmount)}
                      </AppText>
                    </View>
                  </View>
                </View>

                {!!item.reason && (
                  <View className="mt-2.5 rounded-xl bg-paper p-2.5">
                    <AppText numberOfLines={2} className="text-xs text-ink-muted leading-relaxed">
                      Lý do: <AppText weight="semibold" className="text-ink">{item.reason}</AppText>
                    </AppText>
                  </View>
                )}

                <View className="mt-3 flex-row items-center justify-end gap-1 pt-1 border-t border-line">
                  <AppText weight="bold" className="text-xs text-leaf-700">
                    Xem chi tiết & Xử lý
                  </AppText>
                  <ChevronRight size={16} color={colors.leaf700} />
                </View>
              </Pressable>
            )
          }}
        />
      )}
    </SafeAreaView>
  )
}
