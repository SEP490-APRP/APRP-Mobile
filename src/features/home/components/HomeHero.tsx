import { ImageBackground, View } from 'react-native'
import { ShoppingBasket } from 'lucide-react-native'
import { AppText, Button } from '@/components/ui'

const heroImage = require('../../../../assets/images/hero-farmer.jpg')

const STATS = [
  { value: '12.000+', label: 'Đơn giải cứu', color: 'text-sun-300' },
  { value: '500+', label: 'Nông dân liên kết', color: 'text-leaf-300' },
  { value: '30 Tấn', label: 'Tránh lãng phí', color: 'text-white' },
] as const

/** Bản gọn của Hero trang chủ web: ảnh nông dân, khẩu hiệu, nút mua và số liệu. */
export function HomeHero({ onShop }: { onShop: () => void }) {
  return (
    <ImageBackground
      source={heroImage}
      resizeMode="cover"
      accessibilityLabel="Hai cô chú nông dân tươi cười với nông sản vừa thu hoạch"
      imageStyle={{ borderRadius: 24 }}
      className="overflow-hidden rounded-panel"
    >
      <View className="gap-3 rounded-panel bg-black/60 p-5">
        <AppText weight="extrabold" className="text-3xl leading-tight text-white">
          Nông sản xấu mã –{'\n'}
          <AppText weight="extrabold" className="text-3xl text-sun-300">
            Ngon thật, rẻ thật.
          </AppText>
        </AppText>
        <AppText className="text-sm leading-relaxed text-white/90">
          Cứu rau củ lỡ “mất dáng” khỏi bãi rác, bảo vệ túi tiền của bạn và giúp nông dân bán trọn mùa
          vụ.
        </AppText>
        <Button title="Mua ngay hôm nay" icon={ShoppingBasket} onPress={onShop} className="mt-1 rounded-full" />
        <View className="mt-2 flex-row border-t border-white/20 pt-4">
          {STATS.map((s) => (
            <View key={s.label} className="min-w-0 flex-1 pr-2">
              <AppText weight="extrabold" className={`text-xl ${s.color}`}>
                {s.value}
              </AppText>
              <AppText className="text-xs text-white/80">{s.label}</AppText>
            </View>
          ))}
        </View>
      </View>
    </ImageBackground>
  )
}
