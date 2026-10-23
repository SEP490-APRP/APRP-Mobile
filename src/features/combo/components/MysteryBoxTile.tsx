import { Gift, ShoppingCart } from 'lucide-react-native'
import { ActivityIndicator, Pressable, View } from 'react-native'
import { AppText } from '@/components/ui'
import { money } from '@/features/product'
import { colors } from '@/theme/colors'
import type { ComboCard } from '../utils/comboCards'
import { openComboDetail } from './ComboCardView'
import { ComboImage } from './ComboImage'

/** Ô túi mù nhỏ cho trang cửa hàng (mục "Túi mù của shop" bản web). */
export function MysteryBoxTile({ card: c, adding, onAdd }: { card: ComboCard; adding: boolean; onAdd: () => void }) {
  return (
    <View className="w-44 overflow-hidden rounded-2xl border border-purple-100 bg-white">
      <Pressable onPress={() => openComboDetail(c)} accessibilityRole="link" accessibilityLabel={`Xem ${c.name}`}>
        <View className="aspect-square bg-purple-50">
          <ComboImage uri={c.imageUrl} kind={c.kind} alt={c.name} />
          <View className="absolute left-2 top-2 flex-row items-center gap-1 rounded-full bg-black/60 px-2 py-0.5">
            <Gift size={11} color="#facc15" />
            <AppText weight="bold" className="text-xs uppercase text-white">
              Bí ẩn
            </AppText>
          </View>
        </View>
        <View className="gap-0.5 px-3 pt-2">
          <AppText weight="bold" numberOfLines={1} className="text-sm">
            {c.name}
          </AppText>
          <AppText numberOfLines={1} className="text-xs text-ink-muted">
            {c.description}
          </AppText>
        </View>
      </Pressable>
      <View className="flex-row items-center justify-between px-3 pb-3 pt-1.5">
        <AppText weight="extrabold" className="text-base text-leaf-800">
          {money(c.price)}
        </AppText>
        <Pressable
          onPress={onAdd}
          disabled={adding || c.stock <= 0}
          accessibilityRole="button"
          accessibilityLabel={`Thêm ${c.name} vào giỏ`}
          className="h-9 w-9 items-center justify-center rounded-full bg-leaf-700 active:opacity-80 disabled:opacity-40"
        >
          {adding ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <ShoppingCart size={16} color={colors.white} />
          )}
        </Pressable>
      </View>
    </View>
  )
}
