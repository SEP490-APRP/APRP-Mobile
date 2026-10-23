import { Image } from 'expo-image'
import { router, useLocalSearchParams } from 'expo-router'
import { MapPin, Package, Star, Store, Ticket } from 'lucide-react-native'
import { useMemo, useState } from 'react'
import { Pressable, RefreshControl, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppText, CapNongLoading, EmptyState } from '@/components/ui'
import { BackButton } from '@/features/auth/components'
import { useAddProductToCart, useCartQuantities } from '@/features/cart'
import { MysteryBoxTile, useShopMysteryBoxes } from '@/features/combo'
import { applyFilters, DEFAULT_FILTERS, ProductGrid, SORT_OPTIONS, useShopProducts, type SortId } from '@/features/product'
import { averageRating, ReviewCard, StarRow, useReactToReview, useShopReviews } from '@/features/review'
import { useUser } from '@/features/user'
import { useReceiveVoucher, useShopVouchers, VoucherCard } from '@/features/voucher'
import { useUiStore } from '@/stores'
import { colors } from '@/theme/colors'
import { cn } from '@/utils/helpers'
import { getErrorMessage } from '@/utils/errors'

const REVIEW_PREVIEW = 3

/** Trang cửa hàng, chuyển từ pages/shop/ShopPage.tsx và mục túi mù của ShopProducts.tsx. */
export default function ShopScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const shopId = Number(id)
  const showToast = useUiStore((s) => s.showToast)

  const owner = useUser(shopId)
  const products = useShopProducts(shopId)
  const vouchers = useShopVouchers(shopId)
  const receive = useReceiveVoucher()
  const reviewsQuery = useShopReviews(shopId)
  const boxesQuery = useShopMysteryBoxes(shopId)
  const boxes = boxesQuery.data ?? []
  const reviews = reviewsQuery.data ?? []
  const react = useReactToReview()
  const reactingId = react.isPending ? react.variables.reviewId : null

  const cart = useCartQuantities()
  const { addProduct, pendingId } = useAddProductToCart()
  const [sort, setSort] = useState<SortId>('featured')
  const [showAllReviews, setShowAllReviews] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const list = products.data ?? []
  const sorted = useMemo(() => applyFilters(list, '', DEFAULT_FILTERS, sort), [list, sort])

  if (owner.isPending && products.isPending) return <CapNongLoading message="Đang tải cửa hàng" />

  const shop = owner.data
  const shopName = shop?.shopName || list[0]?.farm || `Nông trại #${shopId}`
  const rating = averageRating(reviews)
  const logo = shop?.logoUrl || shop?.avatar
  const savingCode = receive.isPending ? receive.variables : null

  const refresh = async () => {
    setRefreshing(true)
    await Promise.all([owner.refetch(), products.refetch(), vouchers.refetch(), reviewsQuery.refetch(), boxesQuery.refetch()])
    setRefreshing(false)
  }

  const saveVoucher = (code: string) =>
    receive.mutate(code, {
      onSuccess: () => showToast('Đã lưu voucher vào kho của bạn.'),
      onError: (err) => showToast(getErrorMessage(err)),
    })

  const voucherList = vouchers.data?.vouchers ?? []
  const shownReviews = showAllReviews ? reviews : reviews.slice(0, REVIEW_PREVIEW)

  return (
    <SafeAreaView className="flex-1 bg-paper" edges={['top']}>
      <View className="flex-row items-center gap-2 border-b border-line bg-paper px-3 pb-2">
        <BackButton onPress={() => (router.canGoBack() ? router.back() : router.replace('/buyer'))} />
        <AppText weight="extrabold" numberOfLines={1} className="flex-1 text-base">
          {shopName}
        </AppText>
      </View>

      <ScrollView
        contentContainerClassName="gap-6 px-4 pb-10 pt-4"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.leaf700} colors={[colors.leaf700]} />
        }
      >
        {/* Thông tin shop */}
        <View className="gap-4 rounded-panel bg-leaf-700 p-5">
          <View className="flex-row items-center gap-4">
            <View className="h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white">
              {logo ? (
                <Image source={{ uri: logo }} style={{ width: 64, height: 64 }} contentFit="cover" accessibilityIgnoresInvertColors />
              ) : (
                <Store size={30} color={colors.leaf700} />
              )}
            </View>
            <View className="min-w-0 flex-1 gap-1">
              <AppText accessibilityRole="header" weight="extrabold" numberOfLines={2} className="text-xl text-white">
                {shopName}
              </AppText>
              {!!shop?.address && (
                <View className="flex-row items-center gap-1">
                  <MapPin size={13} color={colors.sun300} />
                  <AppText numberOfLines={1} className="flex-1 text-xs text-leaf-100">
                    {shop.address}
                  </AppText>
                </View>
              )}
            </View>
          </View>
          {!!shop?.description && (
            <AppText numberOfLines={3} className="text-sm leading-relaxed text-leaf-100">
              {shop.description}
            </AppText>
          )}
          <View className="flex-row rounded-2xl bg-white/10 py-3">
            <HeroStat icon={Package} value={String(list.length)} label="Sản phẩm" />
            <View className="w-px bg-white/20" />
            <HeroStat icon={Star} value={reviews.length > 0 ? rating.toFixed(1) : '–'} label={`${reviews.length} đánh giá`} />
            <View className="w-px bg-white/20" />
            <HeroStat icon={Ticket} value={String(voucherList.length)} label="Voucher" />
          </View>
        </View>

        {/* Voucher của shop */}
        {voucherList.length > 0 && (
          <View className="gap-3">
            <AppText accessibilityRole="header" weight="extrabold" className="text-lg">
              Voucher của shop
            </AppText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-3 pr-4">
              {voucherList.map((v) => (
                <VoucherCard
                  key={v.voucherCode}
                  voucher={v}
                  canReceive={vouchers.data?.canReceive[v.voucherCode] ?? true}
                  saving={savingCode === v.voucherCode}
                  onSave={() => saveVoucher(v.voucherCode)}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Túi mù của shop */}
        {boxes.length > 0 && (
          <View className="gap-3">
            <View className="flex-row items-baseline justify-between">
              <AppText accessibilityRole="header" weight="extrabold" className="text-lg">
                Túi mù của shop
              </AppText>
              <AppText className="text-xs text-ink-muted">{boxes.length} túi đang bán</AppText>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-3 pr-4">
              {boxes.map((b) => (
                <MysteryBoxTile
                  key={b.key}
                  card={b}
                  adding={pendingId === b.id}
                  onAdd={() => addProduct(b.id, { itemType: 'MYSTERY_BOX', successMessage: 'Đã thêm túi mù vào giỏ!' })}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Sản phẩm */}
        <View className="gap-3">
          <AppText accessibilityRole="header" weight="extrabold" className="text-lg">
            Sản phẩm của shop
          </AppText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
            {SORT_OPTIONS.map((o) => {
              const active = o.id === sort
              return (
                <Pressable
                  key={o.id}
                  onPress={() => setSort(o.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  className={cn(
                    'h-9 items-center justify-center rounded-full border px-4',
                    active ? 'border-leaf-700 bg-leaf-700' : 'border-line bg-white',
                  )}
                >
                  <AppText weight="semibold" className={cn('text-sm', active ? 'text-white' : 'text-ink-muted')}>
                    {o.label}
                  </AppText>
                </Pressable>
              )
            })}
          </ScrollView>
          <ProductGrid
            products={sorted}
            status={products.isPending ? 'loading' : products.isError ? 'error' : 'success'}
            onRetry={() => void products.refetch()}
            cart={cart}
            addingId={pendingId != null ? String(pendingId) : undefined}
            onAdd={addProduct}
            empty={{ title: 'Shop chưa có sản phẩm', description: 'Cửa hàng chưa đăng bán nông sản nào.' }}
          />
        </View>

        {/* Đánh giá */}
        <View className="gap-3">
          <View className="flex-row items-center justify-between">
            <AppText accessibilityRole="header" weight="extrabold" className="text-lg">
              Đánh giá cửa hàng
            </AppText>
            {reviews.length > 0 && (
              <View className="flex-row items-center gap-1.5">
                <StarRow rating={rating} size={14} />
                <AppText weight="semibold" className="text-sm text-ink-muted">
                  {rating.toFixed(1)}
                </AppText>
              </View>
            )}
          </View>
          {reviewsQuery.isPending ? (
            <CapNongLoading size="sm" message="Đang tải đánh giá" subMessage="" className="py-6" />
          ) : reviews.length === 0 ? (
            <EmptyState title="Chưa có đánh giá" description="Shop chưa nhận được đánh giá nào." />
          ) : (
            <>
              {shownReviews.map((r) => (
                <ReviewCard
                  key={r.id}
                  review={r}
                  reacting={reactingId === r.id}
                  onReact={(reaction) => react.mutate({ reviewId: r.id, reaction })}
                />
              ))}
              {reviews.length > REVIEW_PREVIEW && (
                <Pressable
                  onPress={() => setShowAllReviews((v) => !v)}
                  accessibilityRole="button"
                  className="min-h-[44px] items-center justify-center rounded-xl border border-line bg-white"
                >
                  <AppText weight="semibold" className="text-sm text-leaf-700">
                    {showAllReviews ? 'Thu gọn' : `Xem tất cả ${reviews.length} đánh giá`}
                  </AppText>
                </Pressable>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

function HeroStat({ icon: Icon, value, label }: { icon: typeof Star; value: string; label: string }) {
  return (
    <View className="flex-1 items-center gap-0.5">
      <View className="flex-row items-center gap-1">
        <Icon size={14} color={colors.sun300} />
        <AppText weight="extrabold" className="text-base text-white">
          {value}
        </AppText>
      </View>
      <AppText className="text-xs text-leaf-100">{label}</AppText>
    </View>
  )
}
