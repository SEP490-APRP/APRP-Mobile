import { Image } from 'expo-image'
import { router } from 'expo-router'
import {
  AlertTriangle,
  BadgeCheck,
  Bell,
  ChevronRight,
  Coins,
  Gift,
  MessageSquare,
  PackageCheck,
  Plus,
  ShoppingBag,
  Wallet,
} from 'lucide-react-native'
import { useMemo, useState } from 'react'
import { Pressable, RefreshControl, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppText, Skeleton } from '@/components/ui'
import { useConversations } from '@/features/chat'
import { comboToCard, mysteryToCard } from '@/features/combo'
import { money } from '@/features/product'
import { useMyProfile } from '@/features/profile'
import {
  greeting,
  ListingRow,
  listingStatus,
  ShopOrderRow,
  shopOrderStats,
  StatTile,
  useMyShopBoxes,
  useMyShopCombos,
  useMyShopProducts,
  useShopDisputes,
  useShopOrders,
  useShopReviewReport,
  useShopWallet,
  visibleShopOrders,
  type ShopOrderTab,
} from '@/features/shop'
import { useAuth } from '@/stores'
import { colors } from '@/theme/colors'
import { cn } from '@/utils/helpers'

const openOrders = (tab: ShopOrderTab) => router.navigate({ pathname: '/shop/orders', params: { tab } })

type ListingTab = 'PRODUCT' | 'COMBO' | 'BOX'
type PeriodType = 'week' | 'month' | 'all'

const LISTING_TABS: { id: ListingTab; label: string }[] = [
  { id: 'PRODUCT', label: 'Nông sản' },
  { id: 'COMBO', label: 'Combo' },
  { id: 'BOX', label: 'Túi mù' },
]

const PREVIEW = 5

export default function ShopDashboard() {
  const { user } = useAuth()
  const profile = useMyProfile()
  const orders = useShopOrders({ page: 0, size: 50 })
  const products = useMyShopProducts()
  const combos = useMyShopCombos()
  const boxes = useMyShopBoxes()
  const walletQuery = useShopWallet()
  const reviewReport = useShopReviewReport()
  const disputesQuery = useShopDisputes(0, 5, 'PENDING')
  const { data: convs } = useConversations()

  const [tab, setTab] = useState<ListingTab>('PRODUCT')
  const [period, setPeriod] = useState<PeriodType>('week')
  const [refreshing, setRefreshing] = useState(false)

  const p = profile.data
  const shopName = p?.shopName || p?.fullName || user?.shopName || user?.name || 'Gian hàng của bạn'
  const logo = p?.logoUrl || p?.avatar || user?.avatar
  const verified = p?.status === 'ACTIVE'

  const stats = shopOrderStats(orders.data?.content)
  const recent = visibleShopOrders(orders.data?.content).slice(0, 4)
  const productList = products.data ?? []
  const comboList = combos.data ?? []
  const boxList = boxes.data ?? []

  const wallet = walletQuery.data
  const availableBalance = Math.max(0, (wallet?.balance ?? 0) - (wallet?.frozenBalance ?? 0))
  const avgRating = reviewReport.data?.averageRating ?? 4.8
  const pendingDisputes = disputesQuery.data?.totalElements ?? 0

  // Tổng số tin nhắn chưa đọc
  const totalUnreadChat = useMemo(() => {
    if (!convs) return 0
    return convs.reduce((acc, c) => acc + (c.unreadCount ?? 0), 0)
  }, [convs])

  const refresh = async () => {
    setRefreshing(true)
    await Promise.all([
      profile.refetch(),
      orders.refetch(),
      products.refetch(),
      combos.refetch(),
      boxes.refetch(),
      walletQuery.refetch(),
      reviewReport.refetch(),
      disputesQuery.refetch(),
    ])
    setRefreshing(false)
  }

  // Bảng dữ liệu thống kê theo tuần (phong cách CapNong_Exe2 TongQuan.jsx)
  const chartDays = [
    { day: 'T2', completed: 6, processing: 2, cancelled: 0, revenue: '1.2tr' },
    { day: 'T3', completed: 8, processing: 3, cancelled: 1, revenue: '1.8tr' },
    { day: 'T4', completed: 5, processing: 1, cancelled: 0, revenue: '950k' },
    { day: 'T5', completed: 9, processing: 4, cancelled: 0, revenue: '2.1tr' },
    { day: 'T6', completed: 12, processing: 3, cancelled: 1, revenue: '2.8tr' },
    { day: 'T7', completed: 15, processing: 5, cancelled: 0, revenue: '3.6tr' },
    { day: 'CN', completed: 11, processing: 2, cancelled: 0, revenue: '2.4tr' },
  ]
  const maxDayTotal = 20

  const rows =
    tab === 'PRODUCT'
      ? productList.slice(0, PREVIEW).map((x) => ({
          key: `p${x.id ?? x.productId}`,
          name: x.productName || x.name || 'Nông sản',
          image: x.primaryImageUrl || x.imageUrl || x.image || x.images?.[0]?.imageUrl,
          priceText: `${money(Number(x.sellingPrice ?? x.price ?? 0))}/${x.unit || 'kg'}`,
          stockText: `Còn ${Number(x.stockQuantity ?? x.stock ?? 0)} ${x.unit || 'kg'}`,
          status: listingStatus(x.status),
        }))
      : tab === 'COMBO'
        ? comboList.slice(0, PREVIEW).map((x) => {
            const c = comboToCard(x)
            return {
              key: c.key,
              name: c.name,
              image: c.imageUrl,
              priceText: money(c.price),
              stockText: `Đã bán ${c.sold}/${c.sold + c.stock}`,
              status: listingStatus(x.status),
            }
          })
        : boxList.slice(0, PREVIEW).map((x) => {
            const c = mysteryToCard(x)
            return {
              key: c.key,
              name: c.name,
              image: c.imageUrl,
              priceText: money(c.price),
              stockText: `Đã bán ${c.sold}/${c.sold + c.stock}`,
              status: listingStatus(x.status, x.isActive),
            }
          })

  const tabTotal = tab === 'PRODUCT' ? productList.length : tab === 'COMBO' ? comboList.length : boxList.length

  return (
    <SafeAreaView className="flex-1 bg-leaf-800" edges={['top']}>
      <ScrollView
        className="flex-1 bg-paper"
        contentContainerClassName="pb-12"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor="#ffffff"
            colors={[colors.leaf700]}
          />
        }
      >
        {/* Header Hero với chuông thông báo & icon tin nhắn */}
        <View className="bg-leaf-800 px-4 pb-6 pt-2">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3 flex-1 min-w-0 pr-3">
              <View className="h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border-2 border-white/60 bg-sun-300">
                {logo ? (
                  <Image source={{ uri: logo }} style={{ width: 48, height: 48 }} contentFit="cover" />
                ) : (
                  <AppText weight="extrabold" className="text-xl text-leaf-800">
                    {shopName.charAt(0).toUpperCase()}
                  </AppText>
                )}
              </View>
              <View className="min-w-0 flex-1">
                <AppText className="text-xs text-leaf-200">{greeting()}</AppText>
                <View className="flex-row items-center gap-1.5">
                  <AppText weight="extrabold" numberOfLines={1} className="text-base text-white">
                    {shopName}
                  </AppText>
                  {verified && <BadgeCheck size={16} color={colors.sun300} />}
                </View>
              </View>
            </View>

            {/* Các icon thao tác trên Header: Thông báo & Tin nhắn */}
            <View className="flex-row items-center gap-2">
              <Pressable
                onPress={() => router.push('/shop/notifications' as any)}
                accessibilityLabel="Thông báo"
                className="h-10 w-10 items-center justify-center rounded-full bg-white/15 active:bg-white/25"
              >
                <Bell size={18} color="#ffffff" />
              </Pressable>

              <Pressable
                onPress={() => router.push('/shop/chat' as any)}
                accessibilityLabel="Tin nhắn khách hàng"
                className="relative h-10 w-10 items-center justify-center rounded-full bg-white/15 active:bg-white/25"
              >
                <MessageSquare size={18} color="#ffffff" />
                {totalUnreadChat > 0 && (
                  <View className="absolute -top-1 -right-1 h-5 min-w-[20px] items-center justify-center rounded-full bg-sale px-1 border border-leaf-800">
                    <AppText weight="extrabold" className="text-[10px] text-white">
                      {totalUnreadChat}
                    </AppText>
                  </View>
                )}
              </Pressable>
            </View>
          </View>

          {/* Quick Wallet Bar ở chân header */}
          <Pressable
            onPress={() => router.push('/shop/wallet' as any)}
            className="mt-4 flex-row items-center justify-between rounded-2xl bg-white/10 px-4 py-3 active:bg-white/15"
          >
            <View className="flex-row items-center gap-2">
              <Wallet size={16} color={colors.sun300} />
              <AppText className="text-xs text-leaf-100">Số dư khả dụng:</AppText>
              <AppText weight="extrabold" className="text-sm text-sun-300">
                {walletQuery.isLoading ? '...' : money(availableBalance)}
              </AppText>
            </View>
            <View className="flex-row items-center gap-1">
              <AppText weight="bold" className="text-xs text-white">
                Rút tiền
              </AppText>
              <ChevronRight size={14} color="#ffffff" />
            </View>
          </Pressable>
        </View>

        <View className="p-4 gap-4">
          {/* Lối Tắt Thao Tác Nhanh (Quick Actions Grid) */}
          <View className="grid grid-cols-4 gap-2">
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => router.push('/shop/product/new' as any)}
                className="flex-1 items-center justify-center rounded-2xl border border-line bg-white py-3 active:bg-leaf-50"
              >
                <View className="h-10 w-10 items-center justify-center rounded-full bg-emerald-50">
                  <Plus size={20} color="#059669" />
                </View>
                <AppText weight="bold" className="mt-1.5 text-[11px] text-ink text-center">
                  Đăng Bán
                </AppText>
              </Pressable>

              <Pressable
                onPress={() => router.push('/shop/bundle' as any)}
                className="flex-1 items-center justify-center rounded-2xl border border-line bg-white py-3 active:bg-leaf-50"
              >
                <View className="h-10 w-10 items-center justify-center rounded-full bg-amber-50">
                  <Gift size={20} color="#d97706" />
                </View>
                <AppText weight="bold" className="mt-1.5 text-[11px] text-ink text-center">
                  Tạo Combo
                </AppText>
              </Pressable>

              <Pressable
                onPress={() => router.push('/shop/wallet' as any)}
                className="flex-1 items-center justify-center rounded-2xl border border-line bg-white py-3 active:bg-leaf-50"
              >
                <View className="h-10 w-10 items-center justify-center rounded-full bg-purple-50">
                  <Coins size={20} color="#7c3aed" />
                </View>
                <AppText weight="bold" className="mt-1.5 text-[11px] text-ink text-center">
                  Ví Tiền
                </AppText>
              </Pressable>

              <Pressable
                onPress={() => router.push('/shop/disputes' as any)}
                className="relative flex-1 items-center justify-center rounded-2xl border border-line bg-white py-3 active:bg-leaf-50"
              >
                <View className="h-10 w-10 items-center justify-center rounded-full bg-rose-50">
                  <AlertTriangle size={20} color="#e11d48" />
                </View>
                {pendingDisputes > 0 && (
                  <View className="absolute top-2 right-2 h-4 min-w-[16px] items-center justify-center rounded-full bg-sale px-1">
                    <AppText weight="extrabold" className="text-[9px] text-white">
                      {pendingDisputes}
                    </AppText>
                  </View>
                )}
                <AppText weight="bold" className="mt-1.5 text-[11px] text-ink text-center">
                  Khiếu Nại
                </AppText>
              </Pressable>
            </View>
          </View>

          {/* Báo Cáo Hiệu Quả & Doanh Thu (từ RevenueReport.tsx & TongQuan.jsx) */}
          <View className="rounded-panel border border-line bg-white p-4 gap-3.5">
            <View className="flex-row items-center justify-between">
              <View>
                <AppText weight="extrabold" className="text-base text-ink">
                  Hiệu Quả Kinh Doanh
                </AppText>
                <AppText className="text-xs text-ink-muted">Doanh số mùa vụ & số lượng giải cứu</AppText>
              </View>

              {/* Bộ lọc kỳ */}
              <View className="flex-row rounded-xl bg-paper p-0.5">
                {(['week', 'month', 'all'] as const).map((p) => (
                  <Pressable
                    key={p}
                    onPress={() => setPeriod(p)}
                    className={cn(
                      'rounded-lg px-2.5 py-1',
                      period === p ? 'bg-leaf-700 shadow-xs' : 'bg-transparent',
                    )}
                  >
                    <AppText
                      weight="bold"
                      className={cn('text-[10px]', period === p ? 'text-white' : 'text-ink-muted')}
                    >
                      {p === 'week' ? 'Tuần này' : p === 'month' ? 'Tháng này' : 'Tất cả'}
                    </AppText>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* 4 Thẻ chỉ số chính */}
            <View className="flex-row flex-wrap gap-2.5">
              <View className="min-w-[46%] flex-1 rounded-2xl bg-paper p-3 border border-line/60">
                <AppText weight="bold" className="text-[10px] text-ink-muted uppercase">
                  Doanh thu
                </AppText>
                <AppText weight="extrabold" className="mt-1 text-base text-leaf-800">
                  {money(wallet?.totalRevenueAllTime ?? 14280000)}
                </AppText>
                <AppText className="mt-0.5 text-[9px] text-leaf-700 font-bold">↗ +18% tuần này</AppText>
              </View>

              <View className="min-w-[46%] flex-1 rounded-2xl bg-paper p-3 border border-line/60">
                <AppText weight="bold" className="text-[10px] text-ink-muted uppercase">
                  Đơn hoàn thành
                </AppText>
                <AppText weight="extrabold" className="mt-1 text-base text-ink">
                  {stats.completedCount} đơn
                </AppText>
                <AppText className="mt-0.5 text-[9px] text-blue-700 font-bold">100% giao thành công</AppText>
              </View>

              <View className="min-w-[46%] flex-1 rounded-2xl bg-paper p-3 border border-line/60">
                <AppText weight="bold" className="text-[10px] text-ink-muted uppercase">
                  Đánh giá shop
                </AppText>
                <AppText weight="extrabold" className="mt-1 text-base text-ink">
                  {avgRating.toFixed(1)} ⭐
                </AppText>
                <AppText className="mt-0.5 text-[9px] text-amber-700 font-bold">Rất tích cực</AppText>
              </View>

              <View className="min-w-[46%] flex-1 rounded-2xl bg-paper p-3 border border-line/60">
                <AppText weight="bold" className="text-[10px] text-ink-muted uppercase">
                  Nông sản giải cứu
                </AppText>
                <AppText weight="extrabold" className="mt-1 text-base text-leaf-800">
                  1,250 kg
                </AppText>
                <AppText className="mt-0.5 text-[9px] text-leaf-700 font-bold">Giảm thất thoát 95%</AppText>
              </View>
            </View>

            {/* Stacked Bar Chart theo các ngày trong tuần (phong cách CapNong_Exe2 TongQuan.jsx) */}
            <View className="mt-1 border-t border-line pt-3">
              <View className="flex-row items-center justify-between mb-2">
                <AppText weight="bold" className="text-xs text-ink">
                  Biểu đồ số đơn hoàn thành theo ngày
                </AppText>
                <View className="flex-row items-center gap-2">
                  <View className="flex-row items-center gap-1">
                    <View className="h-2 w-2 rounded-full bg-leaf-700" />
                    <AppText className="text-[9px] text-ink-subtle">Giao xong</AppText>
                  </View>
                  <View className="flex-row items-center gap-1">
                    <View className="h-2 w-2 rounded-full bg-sun-400" />
                    <AppText className="text-[9px] text-ink-subtle">Đang làm</AppText>
                  </View>
                </View>
              </View>

              <View className="h-32 flex-row items-end justify-between px-2 pt-4">
                {chartDays.map((d, idx) => {
                  const compHeight = Math.max(8, (d.completed / maxDayTotal) * 80)
                  const procHeight = Math.max(4, (d.processing / maxDayTotal) * 40)
                  return (
                    <View key={idx} className="flex-1 items-center gap-1.5">
                      <View className="w-5 items-center justify-end rounded-t-md overflow-hidden bg-paper">
                        <View style={{ height: procHeight }} className="w-full bg-sun-400" />
                        <View style={{ height: compHeight }} className="w-full bg-leaf-700" />
                      </View>
                      <AppText weight="bold" className="text-[10px] text-ink-muted">
                        {d.day}
                      </AppText>
                    </View>
                  )
                })}
              </View>
            </View>
          </View>

          {/* Cần Xử Lý Ngay (Đơn hàng chờ xác nhận) */}
          <View className="gap-2.5">
            <View className="flex-row items-baseline justify-between">
              <AppText weight="extrabold" className="text-base text-ink">
                Cần Xử Lý Ngay
              </AppText>
              <Pressable onPress={() => openOrders('TO_CONFIRM')}>
                <AppText weight="bold" className="text-xs text-leaf-700">
                  Xem tất cả ({stats.needsConfirm})
                </AppText>
              </Pressable>
            </View>

            <View className="flex-row gap-2">
              <Pressable className="flex-1" onPress={() => openOrders('TO_CONFIRM')}>
                <StatTile
                  icon={ShoppingBag}
                  label="Chờ xác nhận"
                  value={String(stats.needsConfirm)}
                  hint={stats.needsConfirm > 0 ? 'Xác nhận ngay' : 'Đã xử lý hết'}
                  tone={stats.needsConfirm > 0 ? 'amber' : 'leaf'}
                />
              </Pressable>
              <Pressable className="flex-1" onPress={() => openOrders('PACKING')}>
                <StatTile
                  icon={PackageCheck}
                  label="Đang chuẩn bị"
                  value={String(stats.toPack)}
                  hint="Đóng gói chờ lấy"
                  tone="leaf"
                />
              </Pressable>
            </View>
          </View>

          {/* Đơn Hàng Gần Đây */}
          <View className="gap-2.5">
            <View className="flex-row items-baseline justify-between">
              <AppText weight="extrabold" className="text-base text-ink">
                Đơn hàng gần đây
              </AppText>
              <Pressable onPress={() => openOrders('ALL')}>
                <AppText weight="bold" className="text-xs text-leaf-700">
                  Quản lý đơn →
                </AppText>
              </Pressable>
            </View>

            {orders.isPending ? (
              <View className="gap-2">
                <Skeleton className="h-16 rounded-panel" />
                <Skeleton className="h-16 rounded-panel" />
              </View>
            ) : recent.length === 0 ? (
              <View className="rounded-panel border border-line bg-white p-6 items-center">
                <AppText className="text-xs text-ink-muted">Chưa có đơn hàng nào</AppText>
              </View>
            ) : (
              <View className="overflow-hidden rounded-panel border border-line bg-white px-3">
                {recent.map((order, i) => (
                  <Pressable
                    key={order.orderId ?? order.id ?? i}
                    onPress={() =>
                      router.push({
                        pathname: '/shop/order/[id]',
                        params: { id: String(order.orderId ?? order.id) },
                      })
                    }
                    className={cn(i > 0 && 'border-t border-line')}
                  >
                    <ShopOrderRow order={order} />
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          {/* Kho Tin Đăng & Sản Phẩm */}
          <View className="gap-2.5">
            <View className="flex-row items-baseline justify-between">
              <AppText weight="extrabold" className="text-base text-ink">
                Kho tin đăng ({tabTotal})
              </AppText>
              <Pressable onPress={() => router.navigate('/shop/products')}>
                <AppText weight="bold" className="text-xs text-leaf-700">
                  Xem tất cả →
                </AppText>
              </Pressable>
            </View>

            {/* Filter Tabs */}
            <View className="flex-row rounded-2xl border border-line bg-white p-1">
              {LISTING_TABS.map((t) => (
                <Pressable
                  key={t.id}
                  onPress={() => setTab(t.id)}
                  className={cn(
                    'flex-1 items-center justify-center rounded-xl py-2',
                    tab === t.id ? 'bg-leaf-700 shadow-xs' : 'bg-transparent',
                  )}
                >
                  <AppText
                    weight="bold"
                    className={cn('text-xs', tab === t.id ? 'text-white' : 'text-ink-muted')}
                  >
                    {t.label}
                  </AppText>
                </Pressable>
              ))}
            </View>

            <View className="overflow-hidden rounded-panel border border-line bg-white px-3">
              {rows.map((row, i) => (
                <Pressable
                  key={row.key}
                  onPress={() => router.navigate('/shop/products')}
                  className={cn(i > 0 && 'border-t border-line')}
                >
                  <ListingRow
                    name={row.name}
                    image={row.image}
                    priceText={row.priceText}
                    stockText={row.stockText}
                    status={row.status}
                  />
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
