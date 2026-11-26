import { router } from 'expo-router'
import { ArrowDownLeft, ArrowUpRight, ChevronRight, Clock, Plus, ShieldCheck } from 'lucide-react-native'
import { useMemo, useState } from 'react'
import { Pressable, RefreshControl, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppText, Button, EmptyState, ErrorState, Skeleton } from '@/components/ui'
import { BackButton } from '@/features/auth/components'
import { money } from '@/features/product'
import {
  TopupSheet,
  WithdrawHistoryList,
  WithdrawSheet,
  useMyWallet,
  useMyWalletTransactions,
  useMyWithdrawals,
  WALLET_TX_LABEL,
} from '@/features/wallet'
import { colors } from '@/theme/colors'
import type { WalletTransactionResponse } from '@/services/wallet.types'
import { cn } from '@/utils/helpers'

/** Ví shipper: số dư khả dụng, ký quỹ COD, cước tạm giữ, nạp ví PayOS, rút tiền về ngân hàng, lịch sử. */
export default function ShipperWallet() {
  const wallet = useMyWallet()
  const tx = useMyWalletTransactions(0, 30)
  const withdrawals = useMyWithdrawals()
  const [topupOpen, setTopupOpen] = useState(false)
  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const [historyTab, setHistoryTab] = useState<'tx' | 'withdraw'>('tx')
  const [txMode, setTxMode] = useState<'compact' | 'ledger'>('compact')
  const w = wallet.data
  const negative = (w?.balance ?? 0) < 0
  const refreshing = wallet.isRefetching || tx.isRefetching || withdrawals.isRefetching
  const availableAmount = Number(w?.availableBalance ?? w?.balance ?? 0)

  const allTxs = tx.data?.content ?? []
  const compactTxs = useMemo(() => {
    const releasedOrderIds = new Set(
      allTxs.filter((t) => t.type === 'COD_RESERVE_RELEASED' && t.orderId != null).map((t) => t.orderId!),
    )
    return allTxs.filter((t) => {
      if (t.hold) return false
      if (t.type === 'COD_RESERVE_RELEASED') return false
      if (t.type === 'COD_RESERVED' && t.orderId != null && releasedOrderIds.has(t.orderId)) return false
      return true
    })
  }, [allTxs])
  const displayedTxs = txMode === 'compact' ? compactTxs : allTxs

  return (
    <SafeAreaView className="flex-1 bg-paper" edges={['top']}>
      <View className="flex-row items-center gap-2 px-4 py-3">
        <BackButton onPress={() => (router.canGoBack() ? router.back() : router.replace('/shipper/account'))} />
        <AppText accessibilityRole="header" weight="extrabold" className="flex-1 text-base">
          Ví tài xế
        </AppText>
      </View>
      <ScrollView
        contentContainerClassName="gap-4 p-4 pb-10"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              void wallet.refetch()
              void tx.refetch()
              void withdrawals.refetch()
            }}
            tintColor={colors.leaf700}
            colors={[colors.leaf700]}
          />
        }
      >
        {wallet.isPending ? (
          <Skeleton className="h-40 w-full rounded-panel" />
        ) : wallet.isError ? (
          <ErrorState onRetry={() => void wallet.refetch()} />
        ) : (
          <>
            <View className={cn('gap-1 rounded-panel p-5', negative ? 'bg-sale' : 'bg-leaf-700')}>
              <AppText weight="bold" className="text-xs uppercase text-white/80">
                Số dư khả dụng
              </AppText>
              <AppText weight="extrabold" className="text-3xl text-white">
                {money(availableAmount)}
              </AppText>
              <AppText className="text-xs text-white/80">
                {negative ? 'Âm vì còn tiền COD chưa nộp về sàn' : `Tổng số dư ${money(Number(w?.balance ?? 0))}`}
              </AppText>
              <View className="mt-3 flex-row gap-2">
                <Button
                  title="Nạp ví"
                  icon={Plus}
                  variant="outline"
                  onPress={() => setTopupOpen(true)}
                  className="min-h-[44px] flex-1 bg-white"
                />
                <Button
                  title="Rút tiền"
                  icon={ArrowUpRight}
                  variant="outline"
                  onPress={() => setWithdrawOpen(true)}
                  className="min-h-[44px] flex-1 bg-white"
                  disabled={availableAmount < 50000}
                />
              </View>
            </View>
            <View className="flex-row gap-3">
              <Stat
                icon={<ShieldCheck size={16} color={colors.leaf800} />}
                label="Đang ký quỹ COD"
                value={money(Number(w?.codReserved ?? 0))}
                hint="Trả lại khi giao xong / thất bại"
              />
              <Stat
                icon={<Clock size={16} color={colors.leaf800} />}
                label="Cước tạm giữ"
                value={money(Number(w?.frozenBalance ?? 0))}
                hint="Vào số dư khi đơn hoàn tất"
              />
            </View>
            <View className="rounded-card bg-leaf-50 p-3">
              <AppText className="text-xs leading-relaxed text-leaf-800">
                Đơn COD: số dư khả dụng phải đủ tiền thu của khách mới nhận được. Giao xong, tiền mặt bạn thu chính là tiền
                ký quỹ nên ví bị trừ đúng số này. Bạn có thể yêu cầu rút tiền về tài khoản ngân hàng bất cứ lúc nào (tối thiểu 50.000đ).
              </AppText>
            </View>
          </>
        )}

        {/* Tab chuyển đổi Lịch sử */}
        <View className="mt-2 flex-row rounded-xl border border-line bg-slate-100 p-1">
          <Pressable
            onPress={() => setHistoryTab('tx')}
            className={cn(
              'flex-1 items-center justify-center rounded-lg py-2',
              historyTab === 'tx' ? 'bg-white shadow-xs' : '',
            )}
          >
            <AppText
              weight="bold"
              className={cn('text-xs', historyTab === 'tx' ? 'text-leaf-800' : 'text-ink-muted')}
            >
              Biến động số dư
            </AppText>
          </Pressable>
          <Pressable
            onPress={() => setHistoryTab('withdraw')}
            className={cn(
              'flex-1 items-center justify-center rounded-lg py-2',
              historyTab === 'withdraw' ? 'bg-white shadow-xs' : '',
            )}
          >
            <AppText
              weight="bold"
              className={cn('text-xs', historyTab === 'withdraw' ? 'text-leaf-800' : 'text-ink-muted')}
            >
              Lịch sử rút tiền
            </AppText>
          </Pressable>
        </View>

        {historyTab === 'tx' ? (
          <>
            <View className="flex-row items-center justify-between px-1">
              <AppText className="text-xs text-ink-muted">
                {txMode === 'compact' ? 'Chỉ hiện biến động chính' : 'Hiện toàn bộ bút toán sổ cái'}
              </AppText>
              <Pressable
                onPress={() => setTxMode((m) => (m === 'compact' ? 'ledger' : 'compact'))}
                className="rounded-full border border-leaf-200 bg-leaf-50 px-3 py-1 active:opacity-80"
              >
                <AppText weight="bold" className="text-[11px] text-leaf-800">
                  {txMode === 'compact' ? 'Xem sổ cái đầy đủ' : 'Thu gọn'}
                </AppText>
              </Pressable>
            </View>
            {tx.isPending ? (
              <View className="gap-2">
                <Skeleton className="h-16 w-full rounded-card" />
                <Skeleton className="h-16 w-full rounded-card" />
              </View>
            ) : tx.isError ? (
              <ErrorState onRetry={() => void tx.refetch()} />
            ) : displayedTxs.length === 0 ? (
              <EmptyState title="Chưa có giao dịch" description="Nạp ví hoặc nhận đơn để bắt đầu." />
            ) : (
              <View className="overflow-hidden rounded-card border border-line bg-white">
                {displayedTxs.map((t, i) => (
                  <TxRow key={t.id} tx={t} first={i === 0} />
                ))}
              </View>
            )}
          </>
        ) : (
          <WithdrawHistoryList />
        )}
      </ScrollView>

      <TopupSheet visible={topupOpen} onClose={() => setTopupOpen(false)} />
      <WithdrawSheet
        visible={withdrawOpen}
        onClose={() => setWithdrawOpen(false)}
        availableBalance={availableAmount}
      />
    </SafeAreaView>
  )
}

function Stat({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: string; hint: string }) {
  return (
    <View className="flex-1 gap-1 rounded-card border border-line bg-white p-3">
      <View className="flex-row items-center gap-1.5">
        {icon}
        <AppText weight="bold" className="text-xs text-ink-muted">
          {label}
        </AppText>
      </View>
      <AppText weight="extrabold" className="text-lg">
        {value}
      </AppText>
      <AppText className="text-xs text-ink-muted">{hint}</AppText>
    </View>
  )
}

function formatTxShortTime(raw?: unknown): string {
  if (!raw) return ''
  let d: Date | null = null
  if (Array.isArray(raw) && raw.length >= 3) {
    const [y, m, day, hh = 0, mm = 0] = raw as number[]
    d = new Date(y, m - 1, day, hh, mm)
  } else if (typeof raw === 'string') {
    d = new Date(raw)
  }
  if (!d || Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())} · ${pad(d.getDate())}/${pad(d.getMonth() + 1)}`
}

function TxRow({ tx, first }: { tx: WalletTransactionResponse; first: boolean }) {
  const soft = Boolean(tx.hold || tx.reserve)
  const isIn = Number(tx.amount) >= 0
  const bucketLabel = tx.reserve || tx.type === 'COD_RESERVED' || tx.type === 'COD_RESERVE_RELEASED'
    ? 'Ký quỹ COD'
    : tx.hold || String(tx.type ?? '').includes('HOLD')
      ? 'Cước tạm giữ'
      : 'Số dư khả dụng'
  const bucketBg = tx.reserve || tx.hold || String(tx.type ?? '').includes('HOLD') ? 'bg-amber-100' : 'bg-leaf-50'
  const bucketText = tx.reserve || tx.hold || String(tx.type ?? '').includes('HOLD') ? 'text-amber-900' : 'text-leaf-800'
  const timeText = formatTxShortTime(tx.createdAt)

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/shipper/wallet-tx/[id]' as any, params: { id: String(tx.id) } })}
      className={cn('flex-row items-center gap-3 p-3.5 active:bg-slate-50', !first && 'border-t border-line')}
    >
      <View className={cn('h-9 w-9 items-center justify-center rounded-xl', soft ? 'bg-sun-300/40' : isIn ? 'bg-leaf-50' : 'bg-sale-soft')}>
        {soft ? (
          <Clock size={16} color={colors.leaf800} />
        ) : isIn ? (
          <ArrowDownLeft size={16} color={colors.leaf700} />
        ) : (
          <ArrowUpRight size={16} color={colors.sale} />
        )}
      </View>
      <View className="min-w-0 flex-1 gap-1">
        <AppText weight="bold" numberOfLines={1} className="text-sm">
          {WALLET_TX_LABEL[tx.type] ?? tx.type}
          {tx.orderId ? ` · #${tx.orderId}` : ''}
        </AppText>
        <View className="flex-row flex-wrap items-center gap-1.5">
          <View className={cn('rounded-full px-2 py-0.5', bucketBg)}>
            <AppText weight="semibold" className={cn('text-[10px]', bucketText)}>
              {bucketLabel}
            </AppText>
          </View>
          {!!timeText && <AppText className="text-[11px] text-ink-subtle">{timeText}</AppText>}
        </View>
        {!!tx.description && (
          <AppText numberOfLines={1} className="text-xs text-ink-muted">
            {tx.description}
          </AppText>
        )}
      </View>
      <View className="items-end gap-0.5">
        <AppText weight="extrabold" className={cn('text-sm', soft ? 'text-leaf-900' : isIn ? 'text-leaf-700' : 'text-sale')}>
          {isIn ? '+' : '-'}
          {money(Math.abs(Number(tx.amount)))}
        </AppText>
        {!soft && tx.balanceAfter != null && (
          <AppText className="text-[10px] text-ink-subtle">Sau GD: {money(Number(tx.balanceAfter))}</AppText>
        )}
      </View>
      <ChevronRight size={15} color={colors.inkSubtle} />
    </Pressable>
  )
}
