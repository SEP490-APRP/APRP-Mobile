import { Image } from 'expo-image'
import { router } from 'expo-router'
import {
  BadgeCheck,
  ChevronRight,
  Clock,
  Gift,
  Package,
  PackageCheck,
  ShoppingBag,
  Store,
  Wallet,
} from 'lucide-react-native'
import { useState } from 'react'
import { Pressable, RefreshControl, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppText, ErrorState, Skeleton } from '@/components/ui'
import { comboToCard, mysteryToCard } from '@/features/combo'
import { money } from '@/features/product'
import { useMyProfile } from '@/features/profile'
import {
  greeting,
  isSelling,
  ListingRow,
  listingStatus,
  ShopOrderRow,
  shopOrderStats,
  StatTile,
  useMyShopBoxes,
  useMyShopCombos,
  useMyShopProducts,
  useShopOrders,
  visibleShopOrders,
  type ShopOrderTab,
} from '@/features/shop'
import { useAuth } from '@/stores'
import { colors } from '@/theme/colors'
import { cn } from '@/utils/helpers'

const openOrders = (tab: ShopOrderTab) => router.navigate({ pathname: '/shop/orders', params: { tab } })

type ListingTab = 'PRODUCT' | 'COMBO' | 'BOX'

const LISTING_TABS: { id: ListingTab; label: string }[] = [
  { id: 'PRODUCT', label: 'Nông sản' },
  { id: 'COMBO', label: 'Combo' },
  { id: 'BOX', label: 'Túi mù' },
]

const PREVIEW = 5

/** Tổng quan Nhà Vườn, chuyển từ pages/farmer/Dashboard.tsx: số liệu thật từ đơn, sản phẩm, combo và túi mù. */
export default function ShopDashboard() {
  const { user } = useAuth()
  const profile = useMyProfile()
  const orders = useShopOrders()
  const products = useMyShopProducts()
  const combos = useMyShopCombos()
  const boxes = useMyShopBoxes()
  const [tab, setTab] = useState<ListingTab>('PRODUCT')
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
  const selling = productList.filter((x) => isSelling(x.status)).length

  const refresh = async () => {
    setRefreshing(true)
    await Promise.all([profile.refetch(), orders.refetch(), products.refetch(), combos.refetch(), boxes.refetch()])
    setRefreshing(false)
  }

  const listingQuery = tab === 'PRODUCT' ? products : tab === 'COMBO' ? combos : boxes
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

  const loading = (q: { isPending: boolean }, v: string) => (q.isPending ? '…' : v)

  return (
    <SafeAreaView className="flex-1 bg-leaf-800" edges={['top']}>
      <ScrollView
        className="bg-paper"
        contentContainerClassName="pb-10"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={colors.white}
            colors={[colors.leaf700]}
          />
        }
      >
        {/* Đầu trang: tên gian hàng và trạng thái xác thực */}
        <View className="gap-4 bg-leaf-800 px-5 pb-12 pt-3">
          <View className="flex-row items-center gap-3">
            <View className="h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-white/15">
              {logo ? (
                <Image source={{ uri: logo }} style={{ width: 48, height: 48 }} contentFit="cover" />
              ) : (
                <Store size={22} color={colors.sun300} />
              )}
            </View>
            <View className="min-w-0 flex-1">
              <AppText className="text-xs text-white/75">{greeting()},</AppText>
              <AppText weight="extrabold" numberOfLines={1} className="text-lg text-white">
                {shopName}
              </AppText>
            </View>
            <View
              className={cn(
                'flex-row items-center gap-1 rounded-full px-2.5 py-1',
                verified ? 'bg-sun-300' : 'bg-white/15',
              )}
            >
              {verified ? <BadgeCheck size={14} color={colors.leaf800} /> : <Clock size={14} color={colors.white} />}
              <AppText weight="bold" className={cn('text-xs', verified ? 'text-leaf-800' : 'text-white')}>
                {profile.isPending ? '…' : verified ? 'Đã xác thực' : 'Chờ xác thực'}
              </AppText>
            </View>
          </View>
        </View>

        <View className="-mt-8 gap-6 px-4">
          {/* Việc cần làm ngay */}
          <View className="flex-row gap-3 rounded-panel border border-line bg-white p-4">
            <TodoCell
              value={loading(orders, String(stats.needsConfirm))}
              label="đơn chờ xác nhận"
              urgent={stats.needsConfirm > 0}
              onPress={() => openOrders('TO_CONFIRM')}
            />
            <View className="w-px bg-line" />
            <TodoCell
              value={loading(orders, String(stats.toPack))}
              label="đơn cần đóng gói"
              urgent={stats.toPack > 0}
              onPress={() => openOrders('PACKING')}
            />
          </View>

          {orders.isError && products.isError ? (
            <ErrorState onRetry={() => void refresh()} />
          ) : (
            <>
              <View className="gap-3">
                <View className="flex-row gap-3">
                  <StatTile
                    icon={ShoppingBag}
                    label="Tổng đơn"
                    value={loading(orders, String(stats.total))}
                    hint={stats.needsConfirm ? `${stats.needsConfirm} đơn cần xử lý ngay` : 'Đã xử lý hết đơn'}
                  />
                  <StatTile
                    icon={Package}
                    label="Đang bán"
                    value={loading(products, String(selling))}
                    hint={`${productList.length} nông sản trong kho`}
                  />
                </View>
                <View className="flex-row gap-3">
                  <StatTile
                    icon={Gift}
                    tone="amber"
                    label="Combo & túi mù"
                    value={loading(combos, String(comboList.length + boxList.length))}
                    hint={`${boxList.length} túi mù · ${comboList.length} combo`}
                  />
                  <StatTile
                    icon={PackageCheck}
                    label="Đã giao"
                    value={loading(orders, String(stats.completedCount))}
                    hint="đơn giao thành công"
                  />
                </View>
              </View>

              {/* Tài chính: tính từ đơn hàng như bản web */}
              <View className="gap-4 rounded-panel bg-leaf-800 p-5">
                <View className="flex-row items-center gap-2">
                  <Wallet size={18} color={colors.sun300} />
                  <AppText weight="extrabold" className="text-base text-white">
                    Tài chính gian hàng
                  </AppText>
                </View>
                <View>
                  <AppText className="text-xs text-white/75">Doanh thu đã hoàn thành</AppText>
                  <AppText weight="extrabold" className="text-3xl text-sun-300">
                    {loading(orders, money(stats.completedRevenue))}
                  </AppText>
                  <AppText className="text-xs text-white/75">Từ {stats.completedCount} đơn đã giao</AppText>
                </View>
                <View className="flex-row gap-3">
                  <View className="flex-1 gap-0.5 rounded-2xl bg-white/10 p-3">
                    <AppText className="text-xs text-white/75">Chờ quyết toán</AppText>
                    <AppText weight="extrabold" className="text-base text-white">
                      {loading(orders, money(stats.pendingRevenue))}
                    </AppText>
                    <AppText className="text-xs text-white/75">{stats.pendingCount} đơn đang xử lý</AppText>
                  </View>
                  <View className="flex-1 gap-0.5 rounded-2xl bg-white/10 p-3">
                    <AppText className="text-xs text-white/75">Tổng giá trị đơn</AppText>
                    <AppText weight="extrabold" className="text-base text-white">
                      {loading(orders, money(stats.grossRevenue))}
                    </AppText>
                    <AppText className="text-xs text-white/75">Trừ đơn huỷ</AppText>
                  </View>
                </View>
              </View>

              {/* Đơn mới nhất */}
              <View className="rounded-panel border border-line bg-white px-4 pt-4">
                <AppText weight="extrabold" className="text-base">
                  Đơn hàng mới nhất
                </AppText>
                {orders.isPending ? (
                  <View className="gap-3 py-3">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </View>
                ) : recent.length === 0 ? (
                  <View className="items-center gap-1 py-6">
                    <ShoppingBag size={26} color={colors.inkSubtle} />
                    <AppText weight="semibold" className="text-sm text-ink-muted">
                      Chưa có đơn hàng nào
                    </AppText>
                    <AppText className="text-xs text-ink-subtle">Đơn mới sẽ hiện ở đây</AppText>
                  </View>
                ) : (
                  recent.map((o, i) => (
                    <Pressable
                      key={o.orderId ?? o.id ?? i}
                      onPress={() =>
                        router.push({ pathname: '/shop/order/[id]', params: { id: String(o.orderId ?? o.id) } })
                      }
                      accessibilityRole="button"
                      className={cn('active:opacity-70', i > 0 && 'border-t border-line')}
                    >
                      <ShopOrderRow order={o} />
                    </Pressable>
                  ))
                )}
              </View>

              {/* Sản phẩm của gian hàng */}
              <View className="gap-3 rounded-panel border border-line bg-white p-4">
                <View className="flex-row items-center justify-between">
                  <AppText weight="extrabold" className="text-base">
                    Sản phẩm của bạn
                  </AppText>
                  <Pressable
                    onPress={() => router.navigate('/shop/products')}
                    accessibilityRole="link"
                    hitSlop={8}
                  >
                    <AppText weight="bold" className="text-sm text-leaf-700">
                      Quản lý {tabTotal} tin →
                    </AppText>
                  </Pressable>
                </View>
                <View className="flex-row gap-1 rounded-xl bg-paper p-1">
                  {LISTING_TABS.map((t) => {
                    const active = t.id === tab
                    return (
                      <Pressable
                        key={t.id}
                        onPress={() => setTab(t.id)}
                        accessibilityRole="tab"
                        accessibilityState={{ selected: active }}
                        className={cn('h-9 flex-1 items-center justify-center rounded-lg', active && 'bg-white')}
                      >
                        <AppText weight="bold" className={cn('text-sm', active ? 'text-leaf-700' : 'text-ink-muted')}>
                          {t.label}
                        </AppText>
                      </Pressable>
                    )
                  })}
                </View>
                {listingQuery.isPending ? (
                  <View className="gap-3">
                    <Skeleton className="h-14 w-full" />
                    <Skeleton className="h-14 w-full" />
                  </View>
                ) : listingQuery.isError ? (
                  <Pressable onPress={() => void listingQuery.refetch()} accessibilityRole="button" className="py-3">
                    <AppText className="text-sm text-sale">Chưa tải được danh sách. Chạm để thử lại.</AppText>
                  </Pressable>
                ) : rows.length === 0 ? (
                  <AppText className="py-4 text-center text-sm text-ink-muted">
                    {tab === 'PRODUCT'
                      ? 'Chưa có nông sản nào. Chạm "Quản lý" để đăng bán nông sản đầu tiên.'
                      : tab === 'COMBO'
                        ? 'Chưa có combo nào.'
                        : 'Chưa có túi mù nào.'}
                  </AppText>
                ) : (
                  <View>
                    {rows.map(({ key, ...row }, i) => (
                      <View key={key} className={cn(i > 0 && 'border-t border-line')}>
                        <ListingRow {...row} />
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

function TodoCell({
  value,
  label,
  urgent,
  onPress,
}: {
  value: string
  label: string
  urgent: boolean
  onPress: () => void
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      accessibilityLabel={`${value} ${label}`}
      className="flex-1 flex-row items-center gap-3 active:opacity-70"
    >
      <AppText weight="extrabold" className={cn('text-3xl', urgent ? 'text-amber-600' : 'text-leaf-700')}>
        {value}
      </AppText>
      <AppText weight="semibold" className="flex-1 text-sm leading-snug text-ink-muted">
        {label}
      </AppText>
      <ChevronRight size={16} color={colors.inkSubtle} />
    </Pressable>
  )
}
