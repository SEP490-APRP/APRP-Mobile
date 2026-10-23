import { router, useLocalSearchParams } from 'expo-router'
import {
  ChevronDown,
  Leaf,
  MapPin,
  Package,
  Share2,
  ShieldCheck,
  ShoppingCart,
  Store,
  Truck,
  type LucideIcon,
} from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { Pressable, RefreshControl, ScrollView, Share, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppText, Button, CapNongLoading, EmptyState, ErrorState } from '@/components/ui'
import { BackButton } from '@/features/auth/components'
import { useAddProductToCart, useCartQuantities } from '@/features/cart'
import {
  ImageGallery,
  ProductGrid,
  productShopId,
  QuantityStepper,
  toStorefrontProduct,
  useProductDetail,
} from '@/features/product'
import {
  averageRating,
  ReviewCard,
  StarRow,
  useProductReviews,
  useReactToReview,
  useShopReviews,
} from '@/features/review'
import { useUser } from '@/features/user'
import { colors } from '@/theme/colors'
import { absoluteUrl, cn } from '@/utils/helpers'

const TABS = ['Mô tả', 'Chứng nhận', 'Đánh giá'] as const
type Tab = (typeof TABS)[number]

const CERTIFICATES: { icon: LucideIcon; title: string; desc: string }[] = [
  { icon: ShieldCheck, title: 'Shop trên nền tảng', desc: 'Cửa hàng đã đăng ký và hoạt động trên CapNong.' },
  {
    icon: Leaf,
    title: 'Nguồn gốc minh bạch',
    desc: 'Thông tin shop và sản phẩm được hiển thị công khai cho người mua.',
  },
  { icon: Truck, title: 'Giao hàng tận nơi', desc: 'Đơn hàng được xử lý và giao qua hệ thống vận chuyển đối tác.' },
  {
    icon: Package,
    title: 'Đóng gói chuẩn',
    desc: 'Nông sản được bảo quản và đóng gói cẩn thận trong quá trình vận chuyển.',
  },
]

const vnd = (n: number) => `${n.toLocaleString('vi-VN')}đ`
const vnDate = (iso: string) => new Date(iso).toLocaleDateString('vi-VN')

/** Chi tiết sản phẩm, chuyển từ pages/product/ProductDetail.tsx. */
export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const productId = Number(id)
  const detail = useProductDetail(productId)
  const product = detail.data?.product ?? null
  const related = (detail.data?.related ?? []).map(toStorefrontProduct)

  const reviewsQuery = useProductReviews(product?.id)
  const reviews = reviewsQuery.data ?? []
  const shopId = product ? productShopId(product) : undefined
  const shopReviews = useShopReviews(shopId).data ?? []
  const shopOwner = useUser(shopId).data ?? null
  const react = useReactToReview()
  const reactingId = react.isPending ? react.variables.reviewId : null

  const cart = useCartQuantities()
  const { addProduct, pendingId } = useAddProductToCart()
  const [quantity, setQuantity] = useState(1)
  const [tab, setTab] = useState<Tab>('Mô tả')
  const [expanded, setExpanded] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const minOrder = product?.minOrderKg ?? 1
  // Khi đổi sang sản phẩm khác (bấm "liên quan"), đặt lại số lượng tối thiểu.
  useEffect(() => setQuantity(minOrder), [productId, minOrder])

  if (detail.isPending) return <CapNongLoading message="Đang tải sản phẩm" />

  const header = (
    <View className="flex-row items-center gap-2 border-b border-line bg-paper px-3 pb-2">
      <BackButton onPress={() => (router.canGoBack() ? router.back() : router.replace('/buyer'))} />
      <AppText weight="extrabold" numberOfLines={1} className="flex-1 text-base">
        {product?.productName ?? 'Chi tiết sản phẩm'}
      </AppText>
      {product && (
        <Pressable
          onPress={() => void shareProduct()}
          accessibilityRole="button"
          accessibilityLabel="Chia sẻ sản phẩm"
          hitSlop={8}
          className="h-10 w-10 items-center justify-center rounded-full active:bg-leaf-50"
        >
          <Share2 size={20} color={colors.ink} />
        </Pressable>
      )}
    </View>
  )

  if (detail.isError || !product) {
    return (
      <SafeAreaView className="flex-1 bg-paper" edges={['top']}>
        {header}
        <View className="flex-1 justify-center p-5">
          {detail.isError ? (
            <ErrorState
              description="Không thể tải thông tin sản phẩm. Vui lòng thử lại sau."
              onRetry={() => void detail.refetch()}
            />
          ) : (
            <EmptyState
              title="Sản phẩm không khả dụng"
              description="Sản phẩm đã ngừng bán hoặc cửa hàng đang tạm đóng."
            />
          )}
        </View>
      </SafeAreaView>
    )
  }

  const farmName = product.shopName || product.shop?.shopName || (shopId ? `Nông trại #${shopId}` : 'Nông trại đối tác')
  const stock = product.stockKg ?? product.stockQuantity ?? 0
  const outOfStock = stock <= 0
  const basePrice = product.pricePerKg ?? product.sellingPrice ?? 0
  const hasDiscount = product.salePrice != null && product.salePrice > 0
  const price = hasDiscount ? product.salePrice! : basePrice
  const unit = product.unit || 'kg'
  const rating = averageRating(reviews)
  const shopRating = averageRating(shopReviews)
  const inCart = cart?.[String(product.id)] ?? 0
  const adding = pendingId === product.id

  const highlights: { icon: LucideIcon; label: string; sub: string }[] = [
    { icon: Leaf, label: 'Thu hoạch tươi', sub: 'Giao trong ngày' },
    { icon: MapPin, label: 'Nguồn gốc rõ', sub: farmName },
    { icon: Package, label: 'Đóng gói cẩn thận', sub: 'Giữ độ tươi' },
    {
      icon: ShieldCheck,
      label: 'Shop uy tín',
      sub: shopReviews.length > 0 ? `${shopRating.toFixed(1)}★ cửa hàng` : 'Đã xác minh',
    },
  ]

  async function shareProduct() {
    const url = absoluteUrl(`/san-pham/${product!.id}`)
    try {
      await Share.share({
        title: product!.productName,
        message: `${product!.productName} chỉ ${vnd(price)}/${unit} tại ${farmName} trên CapNong! ${url}`,
        url,
      })
    } catch {
      /* người dùng đóng bảng chia sẻ */
    }
  }

  const openShop = () => {
    if (shopId) router.push({ pathname: '/buyer/shop/[id]', params: { id: String(shopId) } })
  }

  const refresh = async () => {
    setRefreshing(true)
    await Promise.all([detail.refetch(), reviewsQuery.refetch()])
    setRefreshing(false)
  }

  const description =
    product.description || 'Nông sản sạch tận vườn, được thu hoạch và đóng gói cẩn thận trước khi giao đến bạn.'

  return (
    <SafeAreaView className="flex-1 bg-paper" edges={['top', 'bottom']}>
      {header}
      <ScrollView
        contentContainerClassName="gap-5 px-4 pb-8 pt-4"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={colors.leaf700}
            colors={[colors.leaf700]}
          />
        }
      >
        <ImageGallery images={product.images} fallbackUrl={product.imageUrl} productName={product.productName} />

        {/* Nhãn tình trạng */}
        <View className="flex-row flex-wrap gap-2">
          {outOfStock ? (
            <Badge tone="danger" label="Hết hàng" />
          ) : (
            <>
              <Badge tone="leaf" label="Tươi mới" />
              <Badge
                tone="emerald"
                label={`Còn ${stock.toLocaleString('vi-VN', { maximumFractionDigits: 2 })} ${unit}`}
              />
            </>
          )}
          {!!product.expiryDate && <Badge tone="amber" label={`HSD: ${vnDate(product.expiryDate)}`} />}
        </View>

        {/* Shop, tên, đánh giá */}
        <View className="gap-2">
          <Pressable
            onPress={openShop}
            accessibilityRole="link"
            accessibilityLabel={`Xem cửa hàng ${farmName}`}
            className="flex-row items-center gap-1.5 self-start rounded-full border border-leaf-200 bg-leaf-50 px-3 py-1.5"
          >
            <Store size={14} color={colors.leaf700} />
            <AppText weight="semibold" className="text-xs text-leaf-700">
              {farmName}
            </AppText>
          </Pressable>
          <AppText accessibilityRole="header" weight="extrabold" className="text-2xl leading-tight">
            {product.productName}
          </AppText>
          <View className="flex-row items-center gap-2">
            <StarRow rating={rating} size={16} />
            <AppText weight="medium" className="text-sm text-ink-muted">
              {reviews.length > 0 ? `${rating.toFixed(1)} · ${reviews.length} đánh giá` : 'Chưa có đánh giá'}
            </AppText>
          </View>
        </View>

        {/* Giá */}
        <View className="rounded-2xl border border-leaf-200 bg-leaf-50 p-4">
          {hasDiscount && (
            <View className="flex-row items-center gap-2">
              <AppText weight="medium" className="text-base text-ink-subtle line-through">
                {vnd(basePrice)}/{unit}
              </AppText>
              {!!product.discountPercent && (
                <View className="rounded-full bg-red-500 px-2 py-0.5">
                  <AppText weight="bold" className="text-xs text-white">
                    -{product.discountPercent}%
                  </AppText>
                </View>
              )}
            </View>
          )}
          <View className="flex-row items-baseline gap-1.5">
            <AppText weight="extrabold" className="text-3xl text-leaf-700">
              {vnd(price)}
            </AppText>
            <AppText weight="semibold" className="text-sm text-ink-muted">
              / {unit}
            </AppText>
          </View>
          {hasDiscount && (
            <AppText weight="semibold" className="text-xs text-leaf-700">
              Tiết kiệm {vnd(basePrice - price)}/{unit}
              {product.discountEndDate ? ` · đến ${vnDate(product.discountEndDate)}` : ''}
            </AppText>
          )}
          <View className="mt-3 flex-row border-t border-leaf-200 pt-3">
            <Stat value={stock.toLocaleString('vi-VN', { maximumFractionDigits: 1 })} label={`${unit} tồn kho`} />
            <View className="w-px bg-leaf-200" />
            <Stat value={String(minOrder)} label={`${unit} tối thiểu`} />
          </View>
        </View>

        {/* Mô tả ngắn */}
        <View className="gap-1">
          <AppText numberOfLines={expanded ? undefined : 3} className="text-sm leading-relaxed text-ink-muted">
            {description}
          </AppText>
          <Pressable
            onPress={() => setExpanded((v) => !v)}
            accessibilityRole="button"
            className="min-h-[36px] flex-row items-center gap-1 self-start"
          >
            <AppText weight="semibold" className="text-sm text-leaf-700">
              {expanded ? 'Thu gọn' : 'Xem mô tả đầy đủ'}
            </AppText>
            <ChevronDown
              size={16}
              color={colors.leaf700}
              style={expanded ? { transform: [{ rotate: '180deg' }] } : undefined}
            />
          </Pressable>
        </View>

        {/* Điểm tin cậy */}
        <View className="flex-row flex-wrap gap-3">
          {highlights.map(({ icon: Icon, label, sub }) => (
            <View
              key={label}
              className="min-w-[45%] flex-1 flex-row items-start gap-3 rounded-2xl border border-line bg-white p-3"
            >
              <View className="h-9 w-9 items-center justify-center rounded-xl bg-leaf-50">
                <Icon size={18} color={colors.leaf700} />
              </View>
              <View className="min-w-0 flex-1">
                <AppText weight="bold" className="text-sm">
                  {label}
                </AppText>
                <AppText numberOfLines={1} className="text-xs text-ink-muted">
                  {sub}
                </AppText>
              </View>
            </View>
          ))}
        </View>

        {/* Cửa hàng */}
        <View className="flex-row items-center gap-3 rounded-panel border border-line bg-white p-4">
          <View className="h-14 w-14 items-center justify-center rounded-2xl bg-leaf-50">
            <Store size={26} color={colors.leaf700} />
          </View>
          <View className="flex-1">
            <AppText weight="extrabold" numberOfLines={1} className="text-base">
              {shopOwner?.shopName || farmName}
            </AppText>
            <AppText numberOfLines={1} className="text-xs text-ink-muted">
              {shopReviews.length > 0
                ? `${shopRating.toFixed(1)}★ · ${shopReviews.length} đánh giá`
                : shopOwner?.address || 'Nhà vườn trên CapNong'}
            </AppText>
          </View>
          <Button title="Xem shop" variant="outline" onPress={openShop} className="min-h-[40px] px-3" />
        </View>

        {/* Thẻ nội dung */}
        <View className="gap-4">
          <View accessibilityRole="tablist" className="flex-row gap-2">
            {TABS.map((t) => {
              const active = t === tab
              return (
                <Pressable
                  key={t}
                  onPress={() => setTab(t)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                  className={cn(
                    'h-10 flex-1 items-center justify-center rounded-xl border',
                    active ? 'border-leaf-700 bg-leaf-50' : 'border-line bg-white',
                  )}
                >
                  <AppText weight="bold" className={cn('text-sm', active ? 'text-leaf-700' : 'text-ink-muted')}>
                    {t === 'Đánh giá' ? `Đánh giá (${reviews.length})` : t}
                  </AppText>
                </Pressable>
              )
            })}
          </View>

          {tab === 'Mô tả' && (
            <View className="gap-3">
              <AppText className="rounded-2xl border border-line bg-white p-4 text-sm leading-loose text-ink-muted">
                {description}
              </AppText>
              <View className="flex-row gap-3">
                <InfoBox label="Đơn vị" value={unit} />
                <InfoBox label="Cửa hàng" value={farmName} />
              </View>
            </View>
          )}

          {tab === 'Chứng nhận' &&
            CERTIFICATES.map(({ icon: Icon, title, desc }) => (
              <View key={title} className="flex-row gap-3 rounded-2xl border border-line bg-white p-4">
                <View className="h-10 w-10 items-center justify-center rounded-xl bg-leaf-50">
                  <Icon size={20} color={colors.leaf700} />
                </View>
                <View className="flex-1">
                  <AppText weight="bold" className="text-sm">
                    {title}
                  </AppText>
                  <AppText className="mt-0.5 text-xs leading-relaxed text-ink-muted">{desc}</AppText>
                </View>
              </View>
            ))}

          {tab === 'Đánh giá' &&
            (reviewsQuery.isPending ? (
              <CapNongLoading size="sm" message="Đang tải đánh giá" subMessage="" className="py-6" />
            ) : reviews.length === 0 ? (
              <EmptyState title="Chưa có đánh giá" description="Hãy là người đầu tiên đánh giá sau khi nhận hàng." />
            ) : (
              reviews.map((r) => (
                <ReviewCard
                  key={r.id}
                  review={r}
                  reacting={reactingId === r.id}
                  onReact={(reaction) => react.mutate({ reviewId: r.id, reaction })}
                />
              ))
            ))}
        </View>

        {related.length > 0 && (
          <View className="gap-3">
            <AppText accessibilityRole="header" weight="extrabold" className="text-xl">
              Sản phẩm liên quan
            </AppText>
            <ProductGrid
              products={related}
              cart={cart}
              addingId={pendingId != null ? String(pendingId) : undefined}
              onAdd={addProduct}
            />
          </View>
        )}
      </ScrollView>

      {/* Thanh mua hàng cố định dưới cùng */}
      <View className="flex-row items-center gap-3 border-t border-line bg-white px-4 pt-3">
        <QuantityStepper
          value={quantity}
          min={minOrder}
          max={Math.max(minOrder, Math.floor(stock) - inCart)}
          unit={unit}
          disabled={outOfStock}
          onChange={setQuantity}
        />
        <Button
          title={adding ? 'Đang thêm...' : outOfStock ? 'Hết hàng' : 'Thêm vào giỏ'}
          icon={ShoppingCart}
          loading={adding}
          disabled={outOfStock}
          onPress={() =>
            addProduct(product.id, {
              quantity,
              successMessage: `Đã thêm ${quantity} ${unit} ${product.productName} vào giỏ hàng`,
            })
          }
          className="flex-1"
        />
      </View>
    </SafeAreaView>
  )
}

const BADGE_TONES = {
  danger: 'border-red-100 bg-red-50 text-red-600',
  leaf: 'border-leaf-100 bg-leaf-100 text-leaf-700',
  emerald: 'border-emerald-100 bg-emerald-50 text-emerald-700',
  amber: 'border-amber-100 bg-amber-50 text-amber-800',
} as const

function Badge({ tone, label }: { tone: keyof typeof BADGE_TONES; label: string }) {
  const [border, bg, text] = BADGE_TONES[tone].split(' ')
  return (
    <View className={cn('rounded-full border px-3 py-1.5', border, bg)}>
      <AppText weight="bold" className={cn('text-xs', text)}>
        {label}
      </AppText>
    </View>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View className="flex-1 items-center">
      <AppText weight="extrabold" className="text-lg">
        {value}
      </AppText>
      <AppText weight="semibold" className="text-xs uppercase text-ink-muted">
        {label}
      </AppText>
    </View>
  )
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 rounded-xl border border-line bg-white p-3">
      <AppText weight="semibold" className="text-xs uppercase text-ink-muted">
        {label}
      </AppText>
      <AppText weight="bold" numberOfLines={1} className="text-sm">
        {value}
      </AppText>
    </View>
  )
}
