import { Pressable, ScrollView } from 'react-native'
import Svg, { Ellipse, Path } from 'react-native-svg'
import { AppText } from '@/components/ui'
import { SectionHeader } from '@/features/buyer'
import { colors } from '@/theme/colors'

/** Hình vẽ nét lấy nguyên từ Categories.tsx bản web. */
const ITEMS = [
  {
    category: 'Rau ăn lá',
    title: 'Rau ăn lá tươi',
    note: '45+ món sẵn có',
    path: 'M44 72V32M44 32Q32 16 18 22Q20 40 44 42M44 32Q56 16 70 22Q68 40 44 42M44 48Q30 38 22 46Q28 58 44 56M44 48Q58 38 66 46Q60 58 44 56',
    base: true,
  },
  {
    category: 'Củ quả',
    title: 'Củ quả mộc mạc',
    note: '60+ loại củ ngon',
    path: 'M44 28L33 72Q44 77 55 72L44 28ZM44 28C44 18 34 12 27 15M44 28C44 18 54 12 61 15M44 28V10M37 42H50M35 54H53M39 65H49',
  },
  {
    category: 'Trái cây',
    title: 'Trái cây nhiệt đới',
    note: '32+ thức quả ngọt',
    path: 'M44 26C30 26 22 38 22 54C22 70 32 76 44 76C56 76 66 70 66 54C66 38 58 26 44 26ZM44 26C44 18 48 14 54 14M44 20C40 16 34 18 32 22M34 50Q44 60 54 50',
  },
  {
    category: 'Hữu cơ',
    title: 'Chuẩn hữu cơ',
    note: 'Không hóa chất',
    path: 'M44 16C28 16 20 30 20 46C20 62 34 74 44 74C54 74 68 62 68 46C68 30 60 16 44 16ZM44 30V62M44 40Q34 34 28 40Q32 50 44 46M44 46Q54 38 60 44Q56 54 44 52',
  },
  {
    category: 'Đà Lạt',
    title: 'Đặc sản bản địa',
    note: 'Đà Lạt, Gia Lai...',
    path: 'M16 68L36 34L48 52L60 30L72 68ZM16 68H72M32 44L44 62M54 42L64 60M26 24Q30 18 36 20Q34 28 26 24',
  },
] as const

export function HomeCategories({
  onPick,
  onSeeAll,
}: {
  onPick: (category: string) => void
  onSeeAll: () => void
}) {
  return (
    <>
      <SectionHeader
        eyebrow="Phân loại phong phú"
        title="Khám phá theo danh mục"
        actionLabel="Tất cả"
        onAction={onSeeAll}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="-mx-5"
        contentContainerClassName="gap-3 px-5"
      >
        {ITEMS.map((item) => (
          <Pressable
            key={item.category}
            onPress={() => onPick(item.category)}
            accessibilityRole="button"
            accessibilityLabel={`${item.title}, ${item.note}`}
            className="w-36 items-center gap-1 rounded-card border border-line bg-white p-3 active:border-leaf-600"
          >
            <Svg width={64} height={64} viewBox="0 0 88 88">
              <Path
                d={item.path}
                fill="none"
                stroke={colors.leaf700}
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {'base' in item && <Ellipse cx={44} cy={74} rx={6} ry={3} fill={colors.leaf200} />}
            </Svg>
            <AppText weight="bold" numberOfLines={1} className="text-center text-sm">
              {item.title}
            </AppText>
            <AppText className="text-center text-xs text-ink-muted">{item.note}</AppText>
          </Pressable>
        ))}
      </ScrollView>
    </>
  )
}
