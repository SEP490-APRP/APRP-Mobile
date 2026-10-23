import { Banknote, CircleCheck, CircleX, Info, ReceiptText, Wallet } from 'lucide-react-native'
import { useMemo, useState } from 'react'
import { Pressable, RefreshControl, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppText, Button, EmptyState, ErrorState, Skeleton } from '@/components/ui'
import { orderIdOf } from '@/features/order/utils/orderStatus'
import { money } from '@/features/product'
import {
  dailyFees,
  EARNINGS_PERIODS,
  earningsSummary,
  groupByDay,
  inPeriod,
  isCod,
  isDelivered,
  itemsSummary,
  useShipperHistory,
  type DayBar,
  type EarningsPeriod,
} from '@/features/shipper'
import { colors } from '@/theme/colors'
import type { OrderResponse } from '@/types/order.types'
import { cn } from '@/utils/helpers'

const PAGE = 30

/** Gọn số tiền cho cột biểu đồ: 45.000 → 45k, 1.250.000 → 1,3tr. */
const shortMoney = (v: number) =>
  v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1).replace('.', ',')}tr` : v >= 1000 ? `${Math.round(v / 1000)}k` : `${v}`

function WeekChart({ bars }: { bars: DayBar[] }) {
  const max = Math.max(...bars.map((b) => b.fees), 1)
  const total = bars.reduce((s, b) => s + b.fees, 0)
  return (
    <View className="gap-3 rounded-panel border border-line bg-white p-4">
      <View className="flex-row items-baseline justify-between">
        <AppText weight="bold" className="text-base">
          7 ngày gần đây
        </AppText>
        <AppText weight="semibold" className="text-sm text-leaf-700">
          {money(total)}
        </AppText>
      </View>
      <View className="h-36 flex-row items-end gap-2">
        {bars.map((b, i) => {
          const today = i === bars.length - 1
          return (
            <View key={b.key} className="flex-1 items-center gap-1">
              <AppText className="text-xs text-ink-muted">{b.fees > 0 ? shortMoney(b.fees) : ''}</AppText>
              <View
                className={cn('w-full rounded-t-lg', b.fees > 0 ? (today ? 'bg-leaf-700' : 'bg-leaf-500') : 'bg-line')}
                style={{ height: b.fees > 0 ? Math.max(8, (b.fees / max) * 96) : 4 }}
              />
              <AppText
                weight={today ? 'bold' : 'regular'}
                className={cn('text-xs', today ? 'text-leaf-800' : 'text-ink-muted')}
              >
                {b.label}
              </AppText>
            </View>
          )
        })}
      </View>
    </View>
  )
}

function HistoryRow({ order, first }: { order: OrderResponse; first: boolean }) {
  const ok = isDelivered(order)
  return (
    <View className={cn('flex-row gap-3 px-4 py-3', !first && 'border-t border-line')}>
      <View className={cn('mt-0.5 h-9 w-9 items-center justify-center rounded-full', ok ? 'bg-leaf-50' : 'bg-rose-50')}>
        {ok ? <CircleCheck size={18} color={colors.leaf700} /> : <CircleX size={18} color={colors.sale} />}
      </View>
      <View className="min-w-0 flex-1 gap-0.5">
        <View className="flex-row items-center justify-between gap-2">
          <AppText weight="bold" numberOfLines={1} className="flex-1 text-sm">
            #{orderIdOf(order)} · {order.recipientName || order.buyerName || 'Khách hàng'}
          </AppText>
          <AppText weight="bold" className={cn('text-sm', ok ? 'text-leaf-700' : 'text-ink-subtle line-through')}>
            {ok ? '+' : ''}
            {money(Number(order.shippingFee ?? 0))}
          </AppText>
        </View>
        <AppText numberOfLines={1} className="text-xs text-ink-muted">
          Từ {order.shopName || 'nhà vườn'} · {itemsSummary(order)}
        </AppText>
        <View className="flex-row flex-wrap items-center gap-1.5 pt-0.5">
          <View className={cn('rounded-full px-2 py-0.5', ok ? 'bg-leaf-50' : 'bg-rose-50')}>
            <AppText weight="semibold" className={cn('text-xs', ok ? 'text-leaf-800' : 'text-rose-700')}>
              {ok ? 'Giao thành công' : 'Giao thất bại'}
            </AppText>
          </View>
          {isCod(order) && ok && (
            <View className="rounded-full bg-amber-100 px-2 py-0.5">
              <AppText weight="semibold" className="text-xs text-amber-800">
                Thu COD {money(Number(order.codAmount ?? order.totalAmount ?? 0))}
              </AppText>
            </View>
          )}
        </View>
      </View>
    </View>
  )
}

/**
 * Thu nhập và lịch sử chuyến giao. Bản web chưa có màn này; số liệu tính từ
 * các đơn đã kết thúc của tài xế (GET /orders/shipper/my), vì backend chưa có ví shipper.
 */
export default function ShipperEarnings() {
  const history = useShipperHistory()
  const [period, setPeriod] = useState<EarningsPeriod>('7d')
  const [shown, setShown] = useState(PAGE)

  const all = useMemo(() => history.data ?? [], [history.data])
  const inRange = useMemo(() => all.filter((o) => inPeriod(o, period)), [all, period])
  const summary = useMemo(() => earningsSummary(inRange), [inRange])
  const bars = useMemo(() => dailyFees(all), [all])
  const days = useMemo(() => groupByDay(inRange), [inRange])

  // Cắt theo số đơn, giữ nguyên nhóm ngày.
  let left = shown
  const visibleDays = days
    .map((d) => {
      const orders = d.orders.slice(0, Math.max(0, left))
      left -= orders.length
      return { ...d, orders }
    })
    .filter((d) => d.orders.length > 0)

  const pickPeriod = (p: EarningsPeriod) => {
    setPeriod(p)
    setShown(PAGE)
  }

  return (
    <SafeAreaView className="flex-1 bg-paper" edges={['top']}>
      <ScrollView
        contentContainerClassName="gap-4 p-4 pb-10"
        refreshControl={
          <RefreshControl
            refreshing={history.isRefetching}
            onRefresh={() => void history.refetch()}
            tintColor={colors.leaf700}
            colors={[colors.leaf700]}
          />
        }
      >
        <View className="gap-0.5">
          <AppText weight="extrabold" className="text-2xl">
            Thu nhập
          </AppText>
          <AppText className="text-sm text-ink-muted">Phí giao hàng từ các chuyến bạn đã chạy</AppText>
        </View>

        <View className="flex-row rounded-full border border-line bg-white p-1" accessibilityRole="radiogroup">
          {EARNINGS_PERIODS.map((p) => {
            const selected = p.value === period
            return (
              <Pressable
                key={p.value}
                onPress={() => pickPeriod(p.value)}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                className={cn(
                  'min-h-[40px] flex-1 items-center justify-center rounded-full',
                  selected && 'bg-leaf-700',
                )}
              >
                <AppText
                  weight={selected ? 'bold' : 'semibold'}
                  className={cn('text-sm', selected ? 'text-white' : 'text-ink-muted')}
                >
                  {p.label}
                </AppText>
              </Pressable>
            )
          })}
        </View>

        {history.isPending ? (
          <>
            <Skeleton className="h-44 rounded-panel" />
            <Skeleton className="h-48 rounded-panel" />
          </>
        ) : history.isError ? (
          <ErrorState title="Chưa tải được thu nhập" onRetry={() => void history.refetch()} />
        ) : (
          <>
            <View className="gap-4 rounded-panel bg-leaf-700 p-5">
              <View className="gap-1">
                <View className="flex-row items-center gap-1.5">
                  <Wallet size={16} color={colors.sun300} />
                  <AppText weight="semibold" className="text-sm text-leaf-100">
                    Phí giao nhận được
                  </AppText>
                </View>
                <AppText weight="extrabold" className="text-3xl text-white">
                  {money(summary.fees)}
                </AppText>
              </View>
              <View className="flex-row rounded-2xl bg-white/10 py-3">
                {[
                  { label: 'Giao xong', value: String(summary.delivered) },
                  { label: 'Thất bại', value: String(summary.failed) },
                  { label: 'Thành công', value: summary.successRate != null ? `${summary.successRate}%` : '—' },
                ].map((s, i) => (
                  <View
                    key={s.label}
                    className={cn('flex-1 items-center gap-0.5', i > 0 && 'border-l border-white/20')}
                  >
                    <AppText weight="extrabold" className="text-lg text-sun-300">
                      {s.value}
                    </AppText>
                    <AppText className="text-xs text-leaf-100">{s.label}</AppText>
                  </View>
                ))}
              </View>
            </View>

            {summary.cod > 0 && (
              <View className="flex-row items-center gap-3 rounded-panel border border-amber-200 bg-amber-50 p-4">
                <View className="h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                  <Banknote size={20} color={colors.soil600} />
                </View>
                <View className="min-w-0 flex-1">
                  <AppText className="text-xs text-amber-800">Tiền hàng đã thu hộ (đơn COD)</AppText>
                  <AppText weight="extrabold" className="text-lg text-amber-900">
                    {money(summary.cod)}
                  </AppText>
                </View>
              </View>
            )}

            <WeekChart bars={bars} />

            <View className="flex-row gap-2 px-1">
              <Info size={14} color={colors.inkSubtle} style={{ marginTop: 2 }} />
              <AppText className="flex-1 text-xs leading-relaxed text-ink-subtle">
                Thu nhập tạm tính theo phí giao của đơn giao thành công, tính theo ngày lấy hàng. Ứng dụng chưa có ví và
                rút tiền.
              </AppText>
            </View>

            <AppText weight="bold" className="pt-1 text-lg">
              Lịch sử chuyến giao
            </AppText>

            {visibleDays.length === 0 ? (
              <EmptyState
                icon={<ReceiptText size={32} color={colors.leaf600} />}
                title="Chưa có chuyến nào"
                description={
                  period === 'all'
                    ? 'Nhận đơn ở tab Đơn mới, giao xong sẽ hiện ở đây.'
                    : 'Không có chuyến nào trong khoảng này. Thử chọn "Tất cả".'
                }
              />
            ) : (
              visibleDays.map((d) => (
                <View key={d.key} className="gap-2">
                  <View className="flex-row items-baseline justify-between px-1">
                    <AppText weight="bold" className="text-sm text-ink-muted">
                      {d.title}
                    </AppText>
                    <AppText weight="semibold" className="text-sm text-ink-muted">
                      {money(d.fees)}
                    </AppText>
                  </View>
                  <View className="rounded-panel border border-line bg-white">
                    {d.orders.map((o, i) => (
                      <HistoryRow key={orderIdOf(o)} order={o} first={i === 0} />
                    ))}
                  </View>
                </View>
              ))
            )}

            {inRange.length > shown && (
              <Button
                title={`Xem thêm ${Math.min(PAGE, inRange.length - shown)} chuyến`}
                variant="outline"
                onPress={() => setShown((n) => n + PAGE)}
              />
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
