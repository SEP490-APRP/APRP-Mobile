import * as Clipboard from 'expo-clipboard'
import { router } from 'expo-router'
import {
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  Clock,
  Copy,
  MousePointer,
  PackageCheck,
  Share2,
  ShoppingBag,
  Sparkles,
  Store,
  Tag,
  TrendingUp,
  Wallet as WalletIcon,
} from 'lucide-react-native'
import { useState } from 'react'
import { Image, Pressable, RefreshControl, ScrollView, Share, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppText, EmptyState, Skeleton } from '@/components/ui'
import { BackButton } from '@/features/auth/components'
import {
  useMyReferralCommissions,
  useMyReferralLinks,
  useReferralDashboard,
} from '@/features/referral'
import { useMyWallet, useMyWalletTransactions, WALLET_TX_LABEL } from '@/features/wallet'
import { colors } from '@/theme/colors'
import { cn } from '@/utils/helpers'

const money = (n: number) => `${Number(n || 0).toLocaleString('vi-VN')}đ`

const formatRate = (rate?: number) => {
  if (rate == null) return '2.0%'
  const pct = rate > 1 ? rate : rate * 100
  return `${pct.toFixed(1)}%`
}

const formatDateText = (dateVal?: unknown) => {
  if (!dateVal) return 'Gần đây'
  if (Array.isArray(dateVal)) {
    const [y, mo, d, h = 0, mi = 0] = dateVal
    const date = new Date(y, mo - 1, d, h, mi)
    return Number.isNaN(date.getTime()) ? 'Gần đây' : date.toLocaleDateString('vi-VN')
  }
  const date = new Date(dateVal as string | number)
  return Number.isNaN(date.getTime()) ? 'Gần đây' : date.toLocaleDateString('vi-VN')
}

export default function BuyerWalletScreen() {
  const [tab, setTab] = useState<'affiliate' | 'history'>('affiliate')
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const walletQuery = useMyWallet()
  const txQuery = useMyWalletTransactions(0, 20)
  const dashboardQuery = useReferralDashboard()
  const linksQuery = useMyReferralLinks({ page: 0, size: 10 })
  const commissionsQuery = useMyReferralCommissions({ page: 0, size: 20 })

  const w = walletQuery.data
  const tx = txQuery.data
  const d = dashboardQuery.data
  const links = linksQuery.data?.content ?? []
  const commissions = commissionsQuery.data?.content ?? []

  const refreshing =
    walletQuery.isRefetching ||
    txQuery.isRefetching ||
    dashboardQuery.isRefetching ||
    linksQuery.isRefetching ||
    commissionsQuery.isRefetching

  const handleRefresh = () => {
    void walletQuery.refetch()
    void txQuery.refetch()
    void dashboardQuery.refetch()
    void linksQuery.refetch()
    void commissionsQuery.refetch()
  }

  const handleCopyLink = async (code: string, shareUrl: string) => {
    try {
      await Clipboard.setStringAsync(shareUrl)
      setCopiedCode(code)
      setTimeout(() => setCopiedCode(null), 2000)
    } catch {
      // ignore
    }
  }

  const handleShareLink = async (name: string, shareUrl: string) => {
    try {
      await Share.share({
        message: `Mua ngay ${name} tươi ngon trên CapNong: ${shareUrl}`,
        url: shareUrl,
      })
    } catch {
      // ignore
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-paper" edges={['top']}>
      {/* Top Header */}
      <View className="flex-row items-center gap-2 border-b border-line bg-paper px-4 py-3">
        <BackButton onPress={() => (router.canGoBack() ? router.back() : router.replace('/buyer/(tabs)/account'))} />
        <AppText accessibilityRole="header" weight="extrabold" className="flex-1 text-base text-ink">
          Ví của tôi & Tiếp thị
        </AppText>
      </View>

      <ScrollView
        contentContainerClassName="gap-4 p-4 pb-12"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.leaf700}
            colors={[colors.leaf700]}
          />
        }
      >
        {/* Main Balance Banner */}
        {walletQuery.isPending ? (
          <Skeleton className="h-36 w-full rounded-panel" />
        ) : (
          <View className="gap-2 rounded-panel bg-leaf-700 p-5 shadow-sm">
            <View className="flex-row items-center justify-between">
              <AppText weight="bold" className="text-xs uppercase tracking-wider text-white/80">
                SỐ DƯ KHẢ DỤNG · VÍ NGƯỜI MUA
              </AppText>
              <WalletIcon size={18} color="#ffffff" />
            </View>
            <AppText weight="extrabold" className="text-3xl text-white">
              {money(Number(w?.balance ?? 0))}
            </AppText>
            <View className="mt-1 flex-row items-center justify-between border-t border-white/20 pt-2">
              <AppText className="text-xs text-white/80">
                Đã rút: {money(Number(w?.totalWithdrawn ?? 0))}
              </AppText>
              <AppText className="text-xs font-semibold text-sun-300">
                Chờ duyệt: {money(d?.pendingCommission ?? 0)}
              </AppText>
            </View>
          </View>
        )}

        {/* Tab Toggle */}
        <View className="flex-row rounded-2xl bg-line/40 p-1">
          <Pressable
            onPress={() => setTab('affiliate')}
            className={cn(
              'flex-1 flex-row items-center justify-center gap-1.5 rounded-xl py-2.5',
              tab === 'affiliate' ? 'bg-white shadow-sm' : '',
            )}
          >
            <Sparkles size={14} color={tab === 'affiliate' ? colors.leaf700 : colors.inkMuted} />
            <AppText
              weight="bold"
              className={cn('text-xs', tab === 'affiliate' ? 'text-leaf-700' : 'text-ink-muted')}
            >
              Tiếp thị liên kết
            </AppText>
          </Pressable>
          <Pressable
            onPress={() => setTab('history')}
            className={cn(
              'flex-1 flex-row items-center justify-center gap-1.5 rounded-xl py-2.5',
              tab === 'history' ? 'bg-white shadow-sm' : '',
            )}
          >
            <Clock size={14} color={tab === 'history' ? colors.leaf700 : colors.inkMuted} />
            <AppText
              weight="bold"
              className={cn('text-xs', tab === 'history' ? 'text-leaf-700' : 'text-ink-muted')}
            >
              Biến động số dư
            </AppText>
          </Pressable>
        </View>

        {/* TAB: AFFILIATE */}
        {tab === 'affiliate' && (
          <View className="gap-4">
            {/* 4 Stats Cards */}
            <View className="flex-row gap-3">
              <View className="flex-1 rounded-2xl border border-line bg-white p-3.5 shadow-xs">
                <View className="flex-row items-center gap-1">
                  <MousePointer size={14} color={colors.leaf700} />
                  <AppText weight="bold" className="text-[10px] uppercase text-ink-muted">
                    Lượt Click
                  </AppText>
                </View>
                <AppText weight="extrabold" className="mt-1 text-xl text-ink">
                  {d?.totalClicks ?? 0}
                </AppText>
              </View>

              <View className="flex-1 rounded-2xl border border-line bg-white p-3.5 shadow-xs">
                <View className="flex-row items-center gap-1">
                  <PackageCheck size={14} color={colors.leaf700} />
                  <AppText weight="bold" className="text-[10px] uppercase text-ink-muted">
                    Đơn chốt
                  </AppText>
                </View>
                <AppText weight="extrabold" className="mt-1 text-xl text-ink">
                  {d?.totalOrders ?? 0}
                </AppText>
              </View>
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1 rounded-2xl border border-line bg-white p-3.5 shadow-xs">
                <View className="flex-row items-center gap-1">
                  <TrendingUp size={14} color={colors.leaf700} />
                  <AppText weight="bold" className="text-[10px] uppercase text-ink-muted">
                    Hoa hồng đã nhận
                  </AppText>
                </View>
                <AppText weight="extrabold" className="mt-1 text-lg text-leaf-700">
                  {money(d?.totalEarned ?? 0)}
                </AppText>
              </View>

              <View className="flex-1 rounded-2xl border border-line bg-white p-3.5 shadow-xs">
                <View className="flex-row items-center gap-1">
                  <Tag size={14} color={colors.leaf700} />
                  <AppText weight="bold" className="text-[10px] uppercase text-ink-muted">
                    Tỷ lệ hoa hồng
                  </AppText>
                </View>
                <AppText weight="extrabold" className="mt-1 text-lg text-ink">
                  {formatRate(d?.defaultCommissionRate)}
                </AppText>
              </View>
            </View>

            {/* Links section */}
            <View className="rounded-panel border border-line bg-white p-4 shadow-xs">
              <View className="flex-row items-center justify-between mb-3">
                <AppText weight="extrabold" className="text-sm text-ink">
                  Liên kết tiếp thị của tôi ({links.length})
                </AppText>
              </View>

              {linksQuery.isPending ? (
                <Skeleton className="h-20 w-full rounded-card" />
              ) : links.length === 0 ? (
                <View className="items-center py-6">
                  <Share2 size={32} color={colors.inkMuted} />
                  <AppText weight="bold" className="mt-2 text-xs text-ink">
                    Chưa tạo liên kết nào
                  </AppText>
                  <AppText className="mt-0.5 text-center text-[11px] text-ink-muted">
                    Mở sản phẩm bất kỳ và bấm nút Chia sẻ để tạo link tiếp thị nhận hoa hồng 2%.
                  </AppText>
                </View>
              ) : (
                <View className="gap-3">
                  {links.map((item) => (
                    <View
                      key={item.id}
                      className="rounded-2xl border border-line bg-paper p-3 gap-2"
                    >
                      <View className="flex-row gap-3">
                        {item.targetImageUrl ? (
                          <Image
                            source={{ uri: item.targetImageUrl }}
                            className="h-14 w-14 rounded-xl"
                            resizeMode="cover"
                          />
                        ) : (
                          <View className="h-14 w-14 items-center justify-center rounded-xl bg-leaf-50">
                            {item.targetType === 'PRODUCT' ? (
                              <ShoppingBag size={22} color={colors.leaf700} />
                            ) : (
                              <Store size={22} color={colors.leaf700} />
                            )}
                          </View>
                        )}
                        <View className="flex-1 justify-center">
                          <AppText weight="bold" numberOfLines={1} className="text-xs text-ink">
                            {item.targetName}
                          </AppText>
                          <AppText className="text-[11px] text-ink-muted">
                            Mã: <AppText weight="bold" className="text-leaf-700">{item.referralCode}</AppText>
                          </AppText>
                          <AppText className="text-[10px] text-ink-muted">
                            Lượt xem: <AppText weight="bold">{item.clicksCount}</AppText>
                          </AppText>
                        </View>
                      </View>

                      <View className="flex-row gap-2 border-t border-line/60 pt-2">
                        <Pressable
                          onPress={() => void handleCopyLink(item.referralCode, item.shareUrl)}
                          className="flex-1 flex-row items-center justify-center gap-1 rounded-xl border border-leaf-700 bg-white py-1.5"
                        >
                          {copiedCode === item.referralCode ? (
                            <>
                              <Check size={12} color={colors.leaf700} />
                              <AppText weight="bold" className="text-xs text-leaf-700">
                                Đã chép
                              </AppText>
                            </>
                          ) : (
                            <>
                              <Copy size={12} color={colors.leaf700} />
                              <AppText weight="bold" className="text-xs text-leaf-700">
                                Sao chép
                              </AppText>
                            </>
                          )}
                        </Pressable>

                        <Pressable
                          onPress={() => void handleShareLink(item.targetName, item.shareUrl)}
                          className="flex-1 flex-row items-center justify-center gap-1 rounded-xl bg-leaf-700 py-1.5"
                        >
                          <Share2 size={12} color="#ffffff" />
                          <AppText weight="bold" className="text-xs text-white">
                            Chia sẻ
                          </AppText>
                        </Pressable>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Commissions section */}
            <View className="rounded-panel border border-line bg-white p-4 shadow-xs">
              <AppText weight="extrabold" className="text-sm text-ink mb-3">
                Lịch sử hoa hồng chi tiết ({commissions.length})
              </AppText>

              {commissionsQuery.isPending ? (
                <Skeleton className="h-20 w-full rounded-card" />
              ) : commissions.length === 0 ? (
                <AppText className="py-4 text-center text-xs text-ink-muted">
                  Chưa có hoa hồng phát sinh từ đơn hàng
                </AppText>
              ) : (
                <View className="gap-2.5">
                  {commissions.map((c) => (
                    <View
                      key={c.id}
                      className="flex-row items-center justify-between rounded-xl border border-line bg-paper p-3"
                    >
                      <View className="flex-1 pr-2">
                        <AppText weight="bold" numberOfLines={1} className="text-xs text-ink">
                          {c.productName}
                        </AppText>
                        <AppText className="text-[10px] text-ink-muted">
                          Đơn #{c.orderId} · {formatDateText(c.createdAt)}
                        </AppText>
                        <View className="mt-1 self-start">
                          {c.status === 'COMPLETED' && (
                            <View className="rounded-full bg-emerald-100 px-2 py-0.5">
                              <AppText weight="bold" className="text-[9px] text-emerald-800">
                                Đã vào ví
                              </AppText>
                            </View>
                          )}
                          {c.status === 'PENDING' && (
                            <View className="rounded-full bg-amber-100 px-2 py-0.5">
                              <AppText weight="bold" className="text-[9px] text-amber-800">
                                Chờ quyết toán
                              </AppText>
                            </View>
                          )}
                          {c.status === 'CANCELLED' && (
                            <View className="rounded-full bg-red-100 px-2 py-0.5">
                              <AppText weight="bold" className="text-[9px] text-red-700">
                                Đã hủy
                              </AppText>
                            </View>
                          )}
                        </View>
                      </View>

                      <View className="items-end">
                        <AppText weight="extrabold" className="text-sm text-leaf-700">
                          +{money(c.commissionAmount)}
                        </AppText>
                        <AppText className="text-[10px] text-ink-muted">
                          {formatRate(c.commissionRate)} / {money(c.baseAmount)}
                        </AppText>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}

        {/* TAB: WALLET BALANCE HISTORY */}
        {tab === 'history' && (
          <View className="gap-3">
            <AppText weight="extrabold" className="text-sm text-ink">
              Lịch sử giao dịch ví
            </AppText>

            {txQuery.isPending ? (
              <Skeleton className="h-32 w-full rounded-card" />
            ) : !tx?.content || tx.content.length === 0 ? (
              <EmptyState title="Chưa có giao dịch" description="Hoa hồng tiếp thị sẽ ghi nhận tại đây khi đơn hoàn tất." />
            ) : (
              <View className="gap-2">
                {tx.content.map((item) => {
                  const isPlus = item.type === 'COMMISSION' || item.type === 'REFUND' || item.type === 'TOPUP' || (item as any).type === 'REFERRAL_COMMISSION'
                  return (
                    <View
                      key={item.id}
                      className="flex-row items-center justify-between rounded-xl border border-line bg-white p-3 shadow-xs"
                    >
                      <View className="flex-row items-center gap-3">
                        <View
                          className={cn(
                            'h-10 w-10 items-center justify-center rounded-full',
                            isPlus ? 'bg-leaf-50' : 'bg-red-50',
                          )}
                        >
                          {isPlus ? (
                            <ArrowDownLeft size={18} color={colors.leaf700} />
                          ) : (
                            <ArrowUpRight size={18} color={colors.sale} />
                          )}
                        </View>
                        <View>
                          <AppText weight="bold" className="text-xs text-ink">
                            {WALLET_TX_LABEL[item.type] || item.description || 'Giao dịch ví'}
                          </AppText>
                          <AppText className="text-[10px] text-ink-muted">
                            {item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : 'Gần đây'}
                          </AppText>
                        </View>
                      </View>

                      <AppText
                        weight="extrabold"
                        className={cn('text-sm', isPlus ? 'text-leaf-700' : 'text-danger')}
                      >
                        {isPlus ? '+' : '-'}{money(item.amount)}
                      </AppText>
                    </View>
                  )
                })}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
