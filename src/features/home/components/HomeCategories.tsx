import { Pressable, ScrollView, View } from 'react-native'
import Svg, { Path } from 'react-native-svg'
import { AppText, Skeleton } from '@/components/ui'
import { SectionHeader } from '@/features/buyer'
import { useCategories } from '@/features/product'
import { colors } from '@/theme/colors'

function getCategoryPath(name: string): string {
  const n = (name || '').toLowerCase()
  if (n.includes('lá') || n.includes('rau')) {
    return 'M44 72V32M44 32Q32 16 18 22Q20 40 44 42M44 32Q56 16 70 22Q68 40 44 42M44 48Q30 38 22 46Q28 58 44 56M44 48Q58 38 66 46Q60 58 44 56'
  }
  if (n.includes('củ')) {
    return 'M44 28L33 72Q44 77 55 72L44 28ZM44 28C44 18 34 12 27 15M44 28C44 18 54 12 61 15M44 28V10M37 42H50M35 54H53M39 65H49'
  }
  if (n.includes('trái') || n.includes('quả')) {
    return 'M44 26C30 26 22 38 22 54C22 70 32 76 44 76C56 76 66 70 66 54C66 38 58 26 44 26ZM44 26C44 18 48 14 54 14M44 20C40 16 34 18 32 22M34 50Q44 60 54 50'
  }
  if (n.includes('hữu cơ') || n.includes('vietgap')) {
    return 'M44 16C28 16 20 30 20 46C20 62 34 74 44 74C54 74 68 62 68 46C68 30 60 16 44 16ZM44 30V62M44 40Q34 34 28 40Q32 50 44 46M44 46Q54 38 60 44Q56 54 44 52'
  }
  return 'M16 68L36 34L48 52L60 30L72 68ZM16 68H72M32 44L44 62M54 42L64 60M26 24Q30 18 36 20Q34 28 26 24'
}

export function HomeCategories({
  onPick,
  onSeeAll,
}: {
  onPick: (category: string) => void
  onSeeAll: () => void
}) {
  const { data: categories = [], isPending } = useCategories()

  if (!isPending && categories.length === 0) return null

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
        {isPending
          ? [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-36 rounded-card" />)
          : categories.map((cat) => (
              <Pressable
                key={cat.categoryId}
                onPress={() => onPick(cat.name)}
                accessibilityRole="button"
                accessibilityLabel={`${cat.name}${cat.description ? `, ${cat.description}` : ''}`}
                className="w-36 items-center gap-1 rounded-card border border-line bg-white p-3 active:border-leaf-600"
              >
                <Svg width={64} height={64} viewBox="0 0 88 88">
                  <Path
                    d={getCategoryPath(cat.name)}
                    fill="none"
                    stroke={colors.leaf700}
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
                <AppText weight="bold" numberOfLines={1} className="text-center text-sm">
                  {cat.name}
                </AppText>
                {cat.description ? (
                  <AppText numberOfLines={1} className="text-center text-xs text-ink-muted">
                    {cat.description}
                  </AppText>
                ) : (
                  <View className="h-4" />
                )}
              </Pressable>
            ))}
      </ScrollView>
    </>
  )
}
