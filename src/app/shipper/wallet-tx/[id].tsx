import { router, useLocalSearchParams } from 'expo-router'
import { ArrowDownLeft, ArrowLeft, ArrowUpRight, Clock, ExternalLink, ShieldCheck } from 'lucide-react-native'
import { Pressable, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppText, Button, ErrorState, Skeleton } from '@/components/ui'
import { money } from '@/features/product'
import { OrderSettlementCard } from '@/features/wallet/components/OrderSettlementCard'
import { useMyWalletTransactions, WALLET_TX_LABEL } from '@/features/wallet'
import { colors } from '@/theme/colors'
import { cn } from '@/utils/helpers'

function formatTxTime(raw?: unknown): string {
  if (!raw) return '—'
  let d: Date | null = null
  if (Array.isArray(raw) && raw.length >= 3) {
    const [y, m, day, hh = 0, mm = 0, ss = 0] = raw as number[]
    d = new Date(y, m - 1, day, hh, mm, ss)
  } else if (typeof raw === 'string') {
    d = new Date(raw)
  }
  if (!d || Number.isNaN(d.getTime())) return '—'
  return `${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} · ${d.toLocaleDateString('vi-VN')}`
}

function walletBucket(tx: { hold?: boolean; reserve?: boolean; type?: string }) {
  if (tx.reserve || tx.type === 'COD_RESERVED' || tx.type === 'COD_RESERVE_RELEASED') {
    return {
      label: 'Đang ký quỹ COD',
      hint: 'Khoản tiền tạm khoá để đảm bảo thu hộ tiền mặt COD, không trừ mất số dư gốc.',
      badgeBg: 'bg-amber-100',
      badgeText: 'text-amber-900',
    }
  }
  if (tx.hold || String(tx.type ?? '').includes('HOLD')) {
    return {
      label: 'Cước tạm giữ',
      hint: 'Khoản cước dự kiến, tự động chuyển sang Số dư khả dụng khi đơn hoàn tất.',
      badgeBg: 'bg-sky-100',
      badgeText: 'text-sky-900',
    }
  }
  return {
    label: 'Số dư khả dụng',
    hint: 'Biến động trực tiếp vào số dư rút được của ví tài xế.',
    badgeBg: 'bg-leaf-100',
    badgeText: 'text-leaf-800',
  }
}

export default function ShipperWalletTxDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const txId = Number(id)
  const list = useMyWalletTransactions(0, 100)
  const tx = (list.data?.content ?? []).find((t) => t.id === txId)

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/shipper/wallet' as any))

  if (list.isPending) {
    return (
      <SafeAreaView className="flex-1 bg-paper" edges={['top']}>
        <View className="flex-row items-center gap-2 px-4 py-3">
          <Pressable onPress={goBack} hitSlop={8} className="h-10 w-10 items-center justify-center rounded-full">
            <ArrowLeft size={20} color={colors.ink} />
          </Pressable>
          <AppText weight="extrabold" className="text-base">
            Chi tiết giao dịch
          </AppText>
        </View>
        <View className="gap-3 p-4">
          <Skeleton className="h-32 rounded-panel" />
          <Skeleton className="h-44 rounded-panel" />
        </View>
      </SafeAreaView>
    )
  }

  if (list.isError || !tx) {
    return (
      <SafeAreaView className="flex-1 bg-paper" edges={['top']}>
        <View className="flex-row items-center gap-2 px-4 py-3">
          <Pressable onPress={goBack} hitSlop={8} className="h-10 w-10 items-center justify-center rounded-full">
            <ArrowLeft size={20} color={colors.ink} />
          </Pressable>
          <AppText weight="extrabold" className="text-base">
            Chi tiết giao dịch
          </AppText>
        </View>
        <ErrorState title="Không tìm thấy giao dịch này" onRetry={() => void list.refetch()} />
      </SafeAreaView>
    )
  }

  const bucket = walletBucket(tx)
  const isIn = Number(tx.amount) >= 0
  const soft = Boolean(tx.hold || tx.reserve)

  return (
    <SafeAreaView className="flex-1 bg-paper" edges={['top', 'bottom']}>
      <View className="flex-row items-center gap-2 border-b border-line bg-paper px-3 py-2.5">
        <Pressable
          onPress={goBack}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Quay lại"
          className="h-10 w-10 items-center justify-center rounded-full active:bg-black/5"
        >
          <ArrowLeft size={20} color={colors.ink} />
        </Pressable>
        <View className="flex-1">
          <AppText accessibilityRole="header" weight="extrabold" className="text-base">
            Chi tiết giao dịch #{tx.id}
          </AppText>
          <AppText className="text-xs text-ink-muted">{formatTxTime(tx.createdAt)}</AppText>
        </View>
      </View>

      <ScrollView contentContainerClassName="gap-4 p-4 pb-10">
        {/* Tóm tắt biến động */}
        <View className="items-center gap-2 rounded-panel border border-line bg-white p-5">
          <View
            className={cn(
              'h-12 w-12 items-center justify-center rounded-2xl',
              soft ? 'bg-amber-100' : isIn ? 'bg-leaf-100' : 'bg-rose-100',
            )}
          >
            {tx.reserve ? (
              <ShieldCheck size={22} color="#92400e" />
            ) : soft ? (
              <Clock size={22} color="#92400e" />
            ) : isIn ? (
              <ArrowDownLeft size={22} color={colors.leaf700} />
            ) : (
              <ArrowUpRight size={22} color={colors.sale} />
            )}
          </View>

          <AppText weight="bold" className="text-center text-sm text-ink">
            {WALLET_TX_LABEL[tx.type] ?? tx.type}
          </AppText>

          <AppText
            weight="extrabold"
            className={cn('text-3xl', soft ? 'text-amber-800' : isIn ? 'text-leaf-700' : 'text-sale')}
          >
            {isIn ? '+' : '-'}
            {money(Math.abs(Number(tx.amount)))}
          </AppText>

          <View className={cn('rounded-full px-3 py-1', bucket.badgeBg)}>
            <AppText weight="bold" className={cn('text-xs', bucket.badgeText)}>
              Tác động vào: {bucket.label}
            </AppText>
          </View>
          <AppText className="text-center text-xs leading-relaxed text-ink-muted">{bucket.hint}</AppText>
        </View>

        {/* Chi tiết sổ cái */}
        <View className="gap-2.5 rounded-panel border border-line bg-white p-4">
          <AppText weight="bold" className="text-xs uppercase tracking-wide text-ink-muted">
            Thông tin bút toán
          </AppText>
          <InfoLine label="Mã giao dịch" value={`#${tx.id}`} />
          <InfoLine label="Thời gian" value={formatTxTime(tx.createdAt)} />
          <InfoLine label="Mã loại bút toán" value={tx.type} />
          <InfoLine label="Tổng số dư sau GD" value={money(Number(tx.balanceAfter ?? 0))} />
          {tx.frozenAfter != null && <InfoLine label="Cước tạm giữ sau GD" value={money(Number(tx.frozenAfter))} />}
          {Boolean(tx.description) && (
            <View className="mt-1 rounded-xl bg-paper p-3">
              <AppText className="text-xs leading-relaxed text-ink">{tx.description}</AppText>
            </View>
          )}
        </View>

        {/* Bảng chia tiền đơn hàng nếu có orderId */}
        {tx.orderId ? (
          <View className="gap-3">
            <OrderSettlementCard orderId={tx.orderId} viewer="SHIPPER" />
            <Button
              title={`Xem chi tiết đơn hàng #${tx.orderId}`}
              icon={ExternalLink}
              variant="outline"
              onPress={() => router.push({ pathname: '/shipper/order/[id]', params: { id: String(tx.orderId) } })}
              className="min-h-[46px]"
            />
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  )
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between gap-3 py-0.5">
      <AppText className="text-xs text-ink-muted">{label}</AppText>
      <AppText weight="semibold" className="text-xs text-ink">
        {value}
      </AppText>
    </View>
  )
}

