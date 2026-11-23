import { router } from 'expo-router'
import { ArrowDownLeft, ArrowUpRight, Clock, Gift, Link2, ShoppingBag, Users, Wallet } from 'lucide-react-native'
import { useState } from 'react'
import { RefreshControl, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppText, Button, EmptyState, ErrorState, Skeleton } from '@/components/ui'
import { BackButton } from '@/features/auth/components'
import { useMyWallet, useMyWalletTransactions } from '@/features/wallet'
import type { WalletTransactionResponse } from '@/services/wallet.types'
import { colors } from '@/theme/colors'

const vnd = (n: number | null | undefined, withSign = false) => {
  const v = Number(n ?? 0)
  const sign = withSign && v > 0 ? '+' : ''
  return `${sign}${v.toLocaleString('vi-VN')}đ`
}

const formatDateTime = (value?: string) => {
  if (!value) return ''
  const d = new Date(value)
  return Number.isNaN(d.getTime())
    ? value
    : `${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} ${d.toLocaleDateString('vi-VN')}`
}

/** Các bước nhận hoa hồng, theo đặc tả "Social Commerce & Referral Wallet" */
const STEPS = [
  { icon: ShoppingBag, title: 'Mua và nhận hàng', text: 'Sau khi đơn hoàn tất, bạn có thể tạo link giới thiệu cho sản phẩm đã mua.' },
  { icon: Link2, title: 'Chia sẻ link', text: 'Gửi link sản phẩm cho bạn bè, người thân qua Zalo, Facebook...' },
  { icon: Users, title: 'Bạn bè mua qua link', text: 'Hoa hồng giới thiệu được cộng ngay vào ví này.' },
] as const

function TxRow({ tx }: { tx: WalletTransactionResponse }) {
  const isIn = tx.amount >= 0
  const Icon = tx.hold ? Clock : isIn ? ArrowDownLeft : ArrowUpRight
  const tone = tx.hold ? 'text-amber-600' : isIn ? 'text-leaf-700' : 'text-sale'
  return (
    <View className="flex-row items-center gap-3 py-3">
      <View className={`h-10 w-10 items-center justify-center rounded-2xl ${isIn ? 'bg-leaf-50' : 'bg-red-50'}`}>
        <Icon size={18} color={isIn ? colors.leaf700 : colors.sale} />
      </View>
      <View className="min-w-0 flex-1">
        <AppText weight="bold" numberOfLines={1} className="text-sm">
          {tx.description || 'Biến động ví'}
        </AppText>
        <AppText className="text-xs text-ink-subtle">{formatDateTime(tx.createdAt)}</AppText>
      </View>
      <View className="items-end">
        <AppText weight="extrabold" className={`text-sm ${tone}`}>
          {vnd(tx.amount, true)}
        </AppText>
        <AppText className="text-[11px] text-ink-subtle">Số dư {vnd(tx.balanceAfter)}</AppText>
      </View>
    </View>
  )
}

/** Ví giới thiệu của Khách Mua: số dư hoa hồng, cách nhận tiền và lịch sử biến động. */
export default function BuyerWalletScreen() {
  const wallet = useMyWallet()
  const txs = useMyWalletTransactions(0, 20)
  const [refreshing, setRefreshing] = useState(false)
  const w = wallet.data
  const items = txs.data?.content ?? []

  const refresh = async () => {
    setRefreshing(true)
    await Promise.all([wallet.refetch(), txs.refetch()])
    setRefreshing(false)
  }

  return (
    <SafeAreaView className="flex-1 bg-paper" edges={['top']}>
      <View className="flex-row items-center gap-2 border-b border-line bg-paper px-3 pb-2">
        <BackButton onPress={() => (router.canGoBack() ? router.back() : router.replace('/buyer/account'))} />
        <AppText weight="extrabold" className="text-lg">
          Ví của tôi
        </AppText>
      </View>

      <ScrollView
        contentContainerClassName="gap-5 p-4 pb-10"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.leaf700} colors={[colors.leaf700]} />
        }
      >
        {wallet.isError ? (
          <ErrorState onRetry={() => void wallet.refetch()} />
        ) : (
          <View className="gap-4 rounded-panel bg-leaf-700 p-5">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <Wallet size={18} color={colors.sun300} />
                <AppText weight="bold" className="text-sm text-leaf-100">
                  Ví giới thiệu
                </AppText>
              </View>
              <View className="rounded-full bg-white/15 px-2.5 py-0.5">
                <AppText weight="bold" className="text-xs text-sun-300">
                  {w?.status === 'ACTIVE' || !w ? 'Đang hoạt động' : w.status}
                </AppText>
              </View>
            </View>
            <View>
              <AppText className="text-xs text-leaf-100">Số dư khả dụng</AppText>
              {wallet.isLoading ? (
                <Skeleton className="mt-1 h-9 w-40 rounded-xl bg-white/20" />
              ) : (
                <AppText weight="extrabold" className="text-3xl text-white">
                  {vnd(w?.balance)}
                </AppText>
              )}
            </View>
            <View className="flex-row gap-3">
              <View className="flex-1 rounded-2xl bg-white/10 p-3">
                <AppText className="text-xs text-leaf-100">Tổng hoa hồng đã nhận</AppText>
                <AppText weight="bold" className="text-base text-white">
                  {vnd(w?.totalRevenueAllTime)}
                </AppText>
              </View>
              <View className="flex-1 rounded-2xl bg-white/10 p-3">
                <AppText className="text-xs text-leaf-100">Đang chờ xác nhận</AppText>
                <AppText weight="bold" className="text-base text-white">
                  {vnd(w?.frozenBalance)}
                </AppText>
              </View>
            </View>
          </View>
        )}

        {/* Cách nhận tiền */}
        <View className="gap-4 rounded-panel border border-line bg-white p-4">
          <View className="flex-row items-center gap-2">
            <Gift size={18} color={colors.soil600} />
            <AppText weight="bold" className="text-base">
              Cách nhận tiền vào ví
            </AppText>
          </View>
          {STEPS.map(({ icon: Icon, title, text }, i) => (
            <View key={title} className="flex-row gap-3">
              <View className="h-9 w-9 items-center justify-center rounded-full bg-leaf-50">
                <Icon size={18} color={colors.leaf700} />
              </View>
              <View className="flex-1">
                <AppText weight="bold" className="text-sm">
                  {i + 1}. {title}
                </AppText>
                <AppText className="text-xs text-ink-muted">{text}</AppText>
              </View>
            </View>
          ))}
          <Button title="Xem đơn đã hoàn tất" variant="outline" icon={ShoppingBag} onPress={() => router.navigate({ pathname: '/buyer/orders', params: { tab: 'COMPLETED' } })} />
        </View>

        {/* Lịch sử */}
        <View className="rounded-panel border border-line bg-white px-4 pt-4">
          <AppText weight="bold" className="text-base">
            Lịch sử biến động
          </AppText>
          {txs.isLoading ? (
            <View className="gap-3 py-4">
              <Skeleton className="h-12 rounded-2xl" />
              <Skeleton className="h-12 rounded-2xl" />
            </View>
          ) : txs.isError ? (
            <ErrorState onRetry={() => void txs.refetch()} />
          ) : items.length === 0 ? (
            <EmptyState
              title="Chưa có giao dịch"
              description="Hoa hồng giới thiệu sẽ hiện ở đây khi bạn bè mua hàng qua link của bạn."
            />
          ) : (
            <View className="divide-y divide-line pb-2">
              {items.map((tx) => (
                <TxRow key={tx.id} tx={tx} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
