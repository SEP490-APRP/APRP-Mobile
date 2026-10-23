import { router, useLocalSearchParams } from 'expo-router'
import { ClipboardList, Search, X } from 'lucide-react-native'
import { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, FlatList, Pressable, RefreshControl, ScrollView, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppText, ConfirmDialog, EmptyState, ErrorState, Skeleton } from '@/components/ui'
import { orderIdOf } from '@/features/order'
import {
  isShopOrderTab,
  matchShopOrder,
  SHOP_ORDER_TABS,
  ShopOrderCard,
  useShopOrderAction,
  useShopOrderFeed,
  visibleShopOrders,
  type ShopOrderTab,
} from '@/features/shop'
import { useUiStore } from '@/stores'
import { colors } from '@/theme/colors'
import { fontFamily } from '@/theme/fonts'
import { getErrorMessage } from '@/utils/errors'
import { cn } from '@/utils/helpers'

const openOrder = (id: number) => router.push({ pathname: '/shop/order/[id]', params: { id: String(id) } })

/** Đơn hàng của Nhà vườn, chuyển từ pages/farmer/Orders.tsx: lọc theo bước, tìm kiếm, xác nhận, đóng gói, huỷ. */
export default function ShopOrdersTab() {
  const params = useLocalSearchParams<{ tab?: string }>()
  const [tab, setTab] = useState<ShopOrderTab>(isShopOrderTab(params.tab) ? params.tab : 'ALL')
  const [query, setQuery] = useState('')
  const [cancelId, setCancelId] = useState<number | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const showToast = useUiStore((s) => s.showToast)
  const feed = useShopOrderFeed(tab)
  const action = useShopOrderAction()

  // Lối tắt từ Tổng quan mở đúng thẻ.
  useEffect(() => {
    if (isShopOrderTab(params.tab)) setTab(params.tab)
  }, [params.tab])

  const orders = useMemo(
    () =>
      visibleShopOrders(feed.data?.pages.flatMap((p) => p.content ?? []) ?? []).filter((o) => matchShopOrder(o, query)),
    [feed.data, query],
  )
  const total = feed.data?.pages[0]?.totalElements

  const refresh = async () => {
    setRefreshing(true)
    await feed.refetch()
    setRefreshing(false)
  }

  const confirm = (id: number) =>
    action.mutate(
      { id, action: 'confirm' },
      {
        onSuccess: () => showToast(`Đã xác nhận đơn #${id}. Khách đã được thông báo.`),
        onError: (err) => showToast(getErrorMessage(err, 'Chưa xác nhận được đơn.')),
      },
    )

  const cancel = () => {
    if (cancelId == null) return
    action.mutate(
      { id: cancelId, action: 'cancel' },
      {
        onSuccess: () => showToast(`Đã huỷ đơn #${cancelId}, nông sản đã hoàn lại kho.`),
        onError: (err) => showToast(getErrorMessage(err, 'Chưa huỷ được đơn.')),
        onSettled: () => setCancelId(null),
      },
    )
  }

  const busyId = action.isPending ? action.variables?.id : undefined

  return (
    <SafeAreaView className="flex-1 bg-paper" edges={['top']}>
      <View className="gap-3 border-b border-line bg-paper pb-3 pt-2">
        <View className="flex-row items-baseline justify-between px-4">
          <AppText accessibilityRole="header" weight="extrabold" className="text-xl">
            Đơn hàng
          </AppText>
          {total != null && <AppText className="text-xs text-ink-muted">{total} đơn</AppText>}
        </View>
        <View className="mx-4 h-11 flex-row items-center rounded-xl border border-line bg-white pl-3">
          <Search size={16} color={colors.inkSubtle} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Tìm mã đơn, tên khách, số điện thoại…"
            placeholderTextColor={colors.inkSubtle}
            accessibilityLabel="Tìm đơn hàng"
            returnKeyType="search"
            className="h-full flex-1 px-2 text-sm text-ink"
            style={{ fontFamily: fontFamily.regular }}
          />
          {!!query && (
            <Pressable
              onPress={() => setQuery('')}
              accessibilityRole="button"
              accessibilityLabel="Xoá từ khoá"
              hitSlop={8}
              className="h-full justify-center px-3"
            >
              <X size={16} color={colors.inkSubtle} />
            </Pressable>
          )}
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-2"
          contentContainerStyle={{ paddingHorizontal: 16 }}
        >
          {SHOP_ORDER_TABS.map((t) => {
            const active = t.key === tab
            return (
              <Pressable
                key={t.key}
                onPress={() => setTab(t.key)}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                className={cn(
                  'h-9 items-center justify-center rounded-full border px-4',
                  active ? 'border-leaf-700 bg-leaf-700' : 'border-line bg-white',
                )}
              >
                <AppText weight="semibold" className={cn('text-sm', active ? 'text-white' : 'text-ink-muted')}>
                  {t.label}
                </AppText>
              </Pressable>
            )
          })}
        </ScrollView>
      </View>

      <FlatList
        data={feed.isPending || feed.isError ? [] : orders}
        keyExtractor={(o) => String(orderIdOf(o))}
        contentContainerClassName="gap-4 p-4 pb-10"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={colors.leaf700}
            colors={[colors.leaf700]}
          />
        }
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (feed.hasNextPage && !feed.isFetchingNextPage) void feed.fetchNextPage()
        }}
        ListEmptyComponent={
          feed.isPending ? (
            <View className="gap-4">
              <Skeleton className="h-56 rounded-panel" />
              <Skeleton className="h-56 rounded-panel" />
            </View>
          ) : feed.isError ? (
            <ErrorState onRetry={() => void feed.refetch()} />
          ) : (
            <EmptyState
              icon={<ClipboardList size={30} color={colors.leaf600} />}
              title={query ? 'Không tìm thấy đơn phù hợp' : 'Chưa có đơn nào'}
              description={
                query
                  ? `Không có đơn nào khớp với "${query}".`
                  : `Hiện chưa có đơn ở mục "${SHOP_ORDER_TABS.find((t) => t.key === tab)?.label}".`
              }
            />
          )
        }
        ListFooterComponent={
          feed.isFetchingNextPage ? <ActivityIndicator color={colors.leaf700} className="py-4" /> : undefined
        }
        renderItem={({ item }) => {
          const id = orderIdOf(item)
          return (
            <ShopOrderCard
              order={item}
              busy={busyId === id}
              onOpen={() => openOrder(id)}
              onConfirm={() => confirm(id)}
              onCancel={() => setCancelId(id)}
              onPack={() => openOrder(id)}
              onTrack={() => router.push({ pathname: '/shop/tracking/[id]', params: { id: String(id) } })}
            />
          )
        }}
      />

      <ConfirmDialog
        visible={cancelId != null}
        title={`Huỷ đơn #${cancelId ?? ''}?`}
        message="Số lượng nông sản trong đơn sẽ được hoàn lại kho. Khách sẽ nhận thông báo đơn bị huỷ."
        confirmLabel="Huỷ đơn"
        cancelLabel="Quay lại"
        destructive
        loading={action.isPending && action.variables?.action === 'cancel'}
        onConfirm={cancel}
        onCancel={() => setCancelId(null)}
      />
    </SafeAreaView>
  )
}
