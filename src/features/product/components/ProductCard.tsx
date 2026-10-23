import { router } from 'expo-router'
import { Eye, MapPin, ShoppingCart } from 'lucide-react-native'
import { memo } from 'react'
import { ActivityIndicator, Pressable, View } from 'react-native'
import { AppText, Skeleton } from '@/components/ui'
import { colors } from '@/theme/colors'
import { cn } from '@/utils/helpers'
import { discountPercent, money, type Product } from '../utils/storefrontProduct'
import { ProduceImage } from './ProduceImage'

export type ProductCardProps = {
  product: Product
  onAdd: (id: string) => void
  inCartQuantity?: number
  /** Đang gửi yêu cầu thêm chính sản phẩm này vào giỏ */
  adding?: boolean
}

/** Mở trang chi tiết sản phẩm (nội dung đầy đủ làm ở bước 2b). */
export const openProductDetail = (id: string) =>
  router.push({ pathname: '/buyer/product/[id]', params: { id } })

function ProductCardBase({ product: p, onAdd, inCartQuantity = 0, adding = false }: ProductCardProps) {
  const discount = discountPercent(p)
  const rescued = Math.min(100, Math.max(0, p.rescued))
  const soldOut = p.stock <= 0
  const reachedStock = inCartQuantity >= p.stock
  const addDisabled = soldOut || reachedStock || adding
  const open = () => openProductDetail(p.id)

  return (
    <View className="flex-1 overflow-hidden rounded-2xl border border-[#e8ece3] bg-white">
      {/* Ảnh + nhãn */}
      <Pressable
        onPress={open}
        accessibilityRole="link"
        accessibilityLabel={`Xem ${p.name}`}
        className="aspect-square bg-[#faf7ef]"
      >
        <ProduceImage src={p.image} alt={p.name} />
        {discount > 0 && (
          <View className="absolute left-2 top-2 rounded-md bg-[#e53935] px-2 py-0.5">
            <AppText weight="extrabold" className="text-xs text-white">
              -{discount}%
            </AppText>
          </View>
        )}
        <View className="absolute right-2 top-2 rounded-md bg-black/65 px-2 py-0.5">
          <AppText weight="bold" className="text-xs text-[#ffd54f]">
            AI {p.score}%
          </AppText>
        </View>
        <View className="absolute bottom-2 left-2 max-w-[90%] rounded-md bg-white/95 px-2 py-0.5">
          <AppText weight="semibold" numberOfLines={1} className="text-xs text-ink-muted">
            {p.flaw}
          </AppText>
        </View>
      </Pressable>

      <View className="flex-1 gap-2 p-3">
        {/* Nhà vườn & vùng */}
        <View className="flex-row items-center justify-between gap-2">
          <View className="min-w-0 flex-1 flex-row items-center gap-1">
            <MapPin size={13} color={colors.leaf700} />
            <AppText weight="medium" numberOfLines={1} className="flex-1 text-xs text-ink-muted">
              {p.farm}
            </AppText>
          </View>
          <AppText weight="medium" className="text-xs text-ink-muted">
            {p.region}
          </AppText>
        </View>

        <Pressable onPress={open}>
          <AppText weight="bold" numberOfLines={2} className="min-h-[40px] text-sm leading-5 text-[#1f241a]">
            {p.name}
          </AppText>
        </Pressable>

        {/* Giá */}
        <View className="mt-auto flex-row flex-wrap items-baseline gap-x-1.5">
          <AppText weight="extrabold" className="text-base text-leaf-700">
            {money(p.price)}
          </AppText>
          <AppText className="text-xs text-[#838d7b]">/{p.unit}</AppText>
          {discount > 0 && (
            <AppText
              accessibilityLabel={`Giá gốc ${money(p.original)}`}
              className="text-xs text-[#838d7b] line-through"
            >
              {money(p.original)}
            </AppText>
          )}
        </View>

        {/* Tiến độ giải cứu & tồn kho */}
        <View className="gap-1">
          <View
            accessibilityRole="progressbar"
            accessibilityValue={{ min: 0, max: 100, now: rescued }}
            className="h-1.5 w-full overflow-hidden rounded-full bg-[#e8ece3]"
          >
            <View className="h-full rounded-full bg-leaf-700" style={{ width: `${rescued}%` }} />
          </View>
          <View className="flex-row justify-between gap-1">
            <AppText weight="medium" className="text-xs text-ink-muted">
              Đã cứu {rescued}%
            </AppText>
            <AppText
              weight={p.stock < 20 ? 'bold' : 'medium'}
              className={cn('text-xs', p.stock < 20 ? 'text-[#b71c1c]' : 'text-ink-muted')}
            >
              {soldOut ? 'Hết hàng' : `Còn ${p.stock} ${p.unit}`}
            </AppText>
          </View>
        </View>

        {/* Hành động */}
        <View className="mt-1 flex-row gap-2 border-t border-[#f0eee6] pt-2.5">
          {/* Chỉ icon để nút Thêm giỏ đủ chỗ cho chữ trên máy 360px */}
          <Pressable
            onPress={open}
            accessibilityRole="button"
            accessibilityLabel={`Chi tiết ${p.name}`}
            className="h-10 w-10 items-center justify-center rounded-xl border border-leaf-700/40 bg-paper active:bg-leaf-50"
          >
            <Eye size={16} color={colors.leaf700} />
          </Pressable>
          <Pressable
            onPress={() => onAdd(p.id)}
            disabled={addDisabled}
            accessibilityRole="button"
            accessibilityLabel={`Thêm ${p.name} vào giỏ`}
            accessibilityState={{ disabled: addDisabled, busy: adding }}
            className={cn(
              'h-10 flex-1 flex-row items-center justify-center gap-1 rounded-xl',
              soldOut || reachedStock ? 'bg-[#d6dccf]' : 'bg-leaf-700 active:bg-leaf-800',
            )}
          >
            {adding ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <ShoppingCart size={14} color={soldOut || reachedStock ? '#838d7b' : colors.white} />
            )}
            <AppText
              weight="bold"
              numberOfLines={1}
              className={cn('text-xs', soldOut || reachedStock ? 'text-[#838d7b]' : 'text-white')}
            >
              {soldOut ? 'Hết hàng' : reachedStock ? 'Đã đủ' : inCartQuantity > 0 ? `Giỏ (${inCartQuantity})` : 'Thêm giỏ'}
            </AppText>
          </Pressable>
        </View>
      </View>
    </View>
  )
}

export const ProductCard = memo(ProductCardBase)

/** Skeleton đúng bố cục ProductCard để dữ liệu về không bị nhảy layout. */
export function ProductCardSkeleton() {
  return (
    <View className="flex-1 overflow-hidden rounded-2xl border border-line bg-white">
      <Skeleton className="aspect-square rounded-none" />
      <View className="gap-3 p-3">
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-1.5 w-full rounded-full" />
        <Skeleton className="h-10 w-full rounded-xl" />
      </View>
    </View>
  )
}
