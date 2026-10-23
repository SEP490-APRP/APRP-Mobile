import { Image } from 'expo-image'
import { ArrowRight, CheckCircle2, Flame, ShieldCheck, Sparkles, Zap } from 'lucide-react-native'
import { View } from 'react-native'
import { AppText, Button } from '@/components/ui'
import { SectionHeader } from '@/features/buyer'
import { money, ProductGrid, type GridStatus, type Product } from '@/features/product'
import { colors } from '@/theme/colors'

const promoImage = require('../../../../assets/images/fresh-veg-promo.png')

const BENEFITS = [
  { icon: CheckCircle2, text: 'Không chất bảo quản' },
  { icon: Zap, text: 'Giao nhanh 2–4 giờ' },
  { icon: ShieldCheck, text: 'Đổi trả 1-1 nhanh chóng' },
] as const

/** Khối "Giải cứu hôm nay": thẻ ưu đãi và 4 sản phẩm đầu, giống trang chủ web trên điện thoại. */
export function TodayRescue({
  products,
  status,
  onRetry,
  onAdd,
  cart,
  addingId,
  onSeeAll,
}: {
  products: readonly Product[]
  status: GridStatus
  onRetry: () => void
  onAdd: (id: string) => void
  cart?: Readonly<Record<string, number>>
  addingId?: string
  onSeeAll: () => void
}) {
  const lowestPrice = products.length > 0 ? Math.min(...products.map((p) => p.price)) : 10_000

  return (
    <View className="gap-4">
      <SectionHeader
        eyebrow="Tươi ngon mỗi ngày"
        eyebrowIcon={Flame}
        title="Giải cứu hôm nay"
        actionLabel="Xem tất cả"
        onAction={onSeeAll}
      />

      <View className="flex-row overflow-hidden rounded-panel bg-leaf-700 p-5">
        <View className="flex-1 gap-3">
          <View className="flex-row items-center gap-1.5 self-start rounded-full border border-white/20 bg-white/15 px-3 py-1">
            <Sparkles size={13} color={colors.sun300} />
            <AppText weight="bold" className="text-xs uppercase text-white">
              Tiết kiệm đến 50%
            </AppText>
          </View>
          <AppText weight="extrabold" className="text-xl leading-snug text-white">
            Rau củ tươi sạch cho gian bếp gia đình
          </AppText>
          <View className="self-start rounded-card border border-white/15 bg-black/15 px-3.5 py-2.5">
            <AppText className="text-xs uppercase text-white/80">Ưu đãi hôm nay</AppText>
            <AppText weight="extrabold" className="text-2xl text-sun-300">
              Chỉ từ {money(lowestPrice)}
              <AppText className="text-xs text-white/80">/kg</AppText>
            </AppText>
          </View>
          <View className="gap-1.5">
            {BENEFITS.map(({ icon: Icon, text }) => (
              <View key={text} className="flex-row items-center gap-2">
                <Icon size={15} color="#a4e876" />
                <AppText className="text-sm text-white/90">{text}</AppText>
              </View>
            ))}
          </View>
          <Button
            title="Khám phá ngay"
            variant="outline"
            icon={ArrowRight}
            onPress={onSeeAll}
            className="mt-1 self-start border-0"
          />
        </View>
        <Image
          source={promoImage}
          contentFit="contain"
          accessibilityElementsHidden
          style={{ width: 96, alignSelf: 'flex-end', aspectRatio: 0.7 }}
        />
      </View>

      <ProductGrid
        products={products.slice(0, 4)}
        status={status}
        onRetry={onRetry}
        onAdd={onAdd}
        cart={cart}
        addingId={addingId}
      />
    </View>
  )
}
