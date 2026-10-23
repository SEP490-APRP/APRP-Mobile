import { Image } from 'expo-image'
import { router } from 'expo-router'
import { ArrowRight, CheckCircle2, Gift, ShieldCheck, Zap } from 'lucide-react-native'
import { Pressable, View } from 'react-native'
import { AppText } from '@/components/ui'
import { colors } from '@/theme/colors'

const teaserImage = require('../../../../assets/images/combo-mystery.jpg')

const BENEFITS = [
  { icon: CheckCircle2, text: '5–6 loại nông sản tươi ngon ngẫu nhiên' },
  { icon: Zap, text: 'Tiết kiệm đến 60% so với mua lẻ' },
  { icon: ShieldCheck, text: 'Đổi mới nếu có quả bị dập hỏng' },
] as const

/** Giới thiệu Combo & Túi mù trên Trang chủ, bấm để mở danh sách. */
export function CombosTeaser() {
  return (
    <Pressable
      onPress={() => router.push('/buyer/combos')}
      accessibilityRole="link"
      accessibilityLabel="Xem Combo và Túi mù"
      className="overflow-hidden rounded-panel border border-line bg-white active:opacity-90"
    >
      <View className="h-36 bg-leaf-50">
        <Image source={teaserImage} contentFit="cover" style={{ width: '100%', height: '100%' }} accessibilityIgnoresInvertColors />
        <View className="absolute left-3 top-3 flex-row items-center gap-1.5 rounded-full bg-black/60 px-3 py-1">
          <Gift size={13} color={colors.sun300} />
          <AppText weight="bold" className="text-xs text-sun-300">
            Túi mù chỉ từ 79k
          </AppText>
        </View>
      </View>
      <View className="gap-2.5 p-5">
        <AppText weight="extrabold" className="text-lg">
          Combo & Túi mù
        </AppText>
        {BENEFITS.map(({ icon: Icon, text }) => (
          <View key={text} className="flex-row items-center gap-2">
            <Icon size={16} color={colors.leaf600} />
            <AppText className="flex-1 text-sm text-ink-muted">{text}</AppText>
          </View>
        ))}
        <View className="mt-1 flex-row items-center gap-1">
          <AppText weight="bold" className="text-sm text-leaf-700">
            Xem tất cả gói
          </AppText>
          <ArrowRight size={16} color={colors.leaf700} />
        </View>
      </View>
    </Pressable>
  )
}
