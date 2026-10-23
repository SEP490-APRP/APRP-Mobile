import { router, useLocalSearchParams } from 'expo-router'
import { ClipboardList, Search, X } from 'lucide-react-native'
import { useEffect, useMemo, useState } from 'react'
import { FlatList, Pressable, RefreshControl, ScrollView, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppText, Button, ConfirmDialog, EmptyState, ErrorState, Skeleton } from '@/components/ui'
import {
  matchOrder,
  ORDER_TABS,
  OrderCard,
  orderIdOf,
  ResumePaymentSheet,
  useCancelOrder,
  useMyOrders,
  usePayOrder,
  type OrderTab,
} from '@/features/order'
import { useUiStore } from '@/stores'
import { colors } from '@/theme/colors'
import { fontFamily } from '@/theme/fonts'
import { getErrorMessage } from '@/utils/errors'
import { cn } from '@/utils/helpers'

/** Đơn hàng của tôi, chuyển từ BuyerOrdersView bản web. Bản đồ theo dõi shipper làm ở phần Shipper. */
export default function OrdersTab() {
  const params = useLocalSearchParams<{ tab?: OrderTab }>()
  const [tab, setTab] = useState<OrderTab>('ALL')
  const [keyword, setKeyword] = useState('')
  const [cancelId, setCancelId] = useState<number | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const showToast = useUiStore((s) => s.showToast)

  useEffect(() => {
    if (params.tab && ORDER_TABS.some((t) => t.key === params.tab)) setTab(params.tab)
  }, [params.tab])

  const ordersQuery = useMyOrders(tab)
  const cancel = useCancelOrder()
  const payment = usePayOrder()
  const orders = useMemo(() => (ordersQuery.data ?? []).filter((o) => matchOrder(o, keyword)), [ordersQuery.data, keyword])

  const refresh = async () => {
    setRefreshing(true)
    await ordersQuery.refetch()
    setRefreshing(false)
  }

  const confirmCancel = () => {
    if (cancelId == null) return
    cancel.mutate(cancelId, {
      onSuccess: () => {
        showToast(`Đã huỷ đơn #${cancelId}.`)
        setCancelId(null)
      },
      onError: (err) => {
        showToast(getErrorMessage(err, 'Không thể huỷ đơn này.'))
        setCancelId(null)
      },
    })
  }

  const header = (
    <View className="gap-3 border-b border-line bg-paper pb-3 pt-2">
      <AppText accessibilityRole="header" weight="extrabold" className="px-4 text-2xl">
        Đơn hàng của tôi
      </AppText>
      <View className="mx-4 h-12 flex-row items-center gap-2 rounded-card border border-line bg-white px-3.5">
        <Search size={18} color={colors.inkSubtle} />
        <TextInput
          value={keyword}
          onChangeText={setKeyword}
          placeholder="Tìm mã đơn, nhà vườn, sản phẩm..."
          placeholderTextColor={colors.inkSubtle}
          accessibilityLabel="Tìm đơn hàng"
          returnKeyType="search"
          className="flex-1 text-base text-ink"
          style={{ fontFamily: fontFamily.regular }}
        />
        {!!keyword && (
          <Pressable onPress={() => setKeyword('')} accessibilityRole="button" accessibilityLabel="Xoá tìm kiếm" hitSlop={8}>
            <X size={18} color={colors.inkSubtle} />
          </Pressable>
        )}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 px-4">
        {ORDER_TABS.map((t) => {
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
  )

  return (
    <SafeAreaView className="flex-1 bg-paper" edges={['top']}>
      {header}
      {ordersQuery.isPending ? (
        <View className="gap-4 p-4">
          <Skeleton className="h-48 w-full rounded-panel" />
          <Skeleton className="h-48 w-full rounded-panel" />
        </View>
      ) : ordersQuery.isError ? (
        <View className="flex-1 justify-center p-4">
          <ErrorState description="Không tải được đơn hàng. Vui lòng thử lại." onRetry={() => void ordersQuery.refetch()} />
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(o) => String(orderIdOf(o))}
          contentContainerClassName="gap-4 p-4 pb-8"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.leaf700} colors={[colors.leaf700]} />
          }
          ListEmptyComponent={
            <EmptyState
              icon={<ClipboardList size={30} color={colors.leaf600} />}
              title="Chưa có đơn hàng nào"
              description={keyword ? 'Không có đơn nào khớp với từ khoá.' : 'Bạn chưa có đơn nào trong mục này.'}
              action={<Button title="Khám phá nông sản" onPress={() => router.navigate('/buyer/fresh')} />}
            />
          }
          renderItem={({ item }) => {
            const id = orderIdOf(item)
            return (
              <OrderCard
                order={item}
                paying={payment.payingId === id}
                onOpen={() => router.push({ pathname: '/buyer/order/[id]', params: { id: String(id) } })}
                onPay={() => void payment.pay(item)}
                onCancel={() => setCancelId(id)}
                onTrack={() => router.push({ pathname: '/buyer/tracking/[id]', params: { id: String(id) } })}
              />
            )
          }}
        />
      )}

      <ConfirmDialog
        visible={cancelId != null}
        title={`Huỷ đơn #${cancelId ?? ''}?`}
        message="Nông sản sẽ được trả lại kho của nhà vườn. Bạn không thể hoàn tác."
        confirmLabel="Huỷ đơn"
        cancelLabel="Giữ đơn"
        destructive
        loading={cancel.isPending}
        onConfirm={confirmCancel}
        onCancel={() => setCancelId(null)}
      />
      <ResumePaymentSheet
        options={payment.options}
        onPayAll={() => void payment.payAll()}
        onPaySingle={(id) => void payment.paySingle(id)}
        onClose={payment.closeOptions}
      />
    </SafeAreaView>
  )
}
