import { Image } from 'expo-image'
import { router } from 'expo-router'
import { ArrowRight, CheckCircle2, Gift, RotateCcw, SlidersHorizontal } from 'lucide-react-native'
import { useMemo, useState } from 'react'
import { FlatList, Pressable, RefreshControl, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppText, Button, EmptyState, ErrorState } from '@/components/ui'
import { BackButton } from '@/features/auth/components'
import { useAddProductToCart } from '@/features/cart'
import {
  COMBO_KINDS,
  COMBO_PRICES,
  COMBO_SORTS,
  ComboCardSkeleton,
  ComboCardView,
  filterCombos,
  useComboCards,
  type ComboFilterKind,
  type ComboPrice,
  type ComboSort,
} from '@/features/combo'
import { colors } from '@/theme/colors'
import { cn } from '@/utils/helpers'

const banner = require('../../../assets/images/combo-hero-banner.jpg')

const PERKS = [
  'Tiết kiệm 30% – 60% so với mua lẻ',
  'Thu hoạch tươi trong ngày',
  'Đổi trả 100% nếu nông sản hư hỏng',
] as const

/** Combo & Túi mù, chuyển từ pages/Combos.tsx: lọc theo loại, giá, sắp xếp và thêm vào giỏ. */
export default function CombosScreen() {
  const cards = useComboCards()
  const { addProduct, pendingId } = useAddProductToCart()
  const [kind, setKind] = useState<ComboFilterKind>('ALL')
  const [price, setPrice] = useState<ComboPrice>('all')
  const [sort, setSort] = useState<ComboSort>('featured')
  const [refreshing, setRefreshing] = useState(false)

  const list = useMemo(() => filterCombos(cards.data ?? [], { kind, price, sort }), [cards.data, kind, price, sort])
  const filtered = kind !== 'ALL' || price !== 'all'

  const refresh = async () => {
    setRefreshing(true)
    await cards.refetch()
    setRefreshing(false)
  }

  const reset = () => {
    setKind('ALL')
    setPrice('all')
    setSort('featured')
  }

  const header = (
    <View className="gap-4 pb-4">
      <View className="overflow-hidden rounded-panel">
        <Image
          source={banner}
          contentFit="cover"
          accessibilityLabel="Hộp quà nông sản và các gói combo"
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
        <View className="items-center gap-2 bg-black/60 px-5 py-7">
          <View className="flex-row items-center gap-1.5 rounded-full bg-white/15 px-3 py-1">
            <Gift size={13} color={colors.sun300} />
            <AppText weight="bold" className="text-xs text-sun-300">
              Mua theo gói, tiết kiệm 30% – 60%
            </AppText>
          </View>
          <AppText weight="extrabold" className="text-center text-2xl text-white">
            Combo & Túi mù nông sản
          </AppText>
          <AppText className="text-center text-xs leading-relaxed text-white/85">
            Tiết kiệm chi phí đi chợ, đón giỏ quà bất ngờ từ nông trại và giải cứu nông sản cùng CapNong.
          </AppText>
        </View>
      </View>

      <ChipRow items={COMBO_KINDS} value={kind} onChange={setKind} />
      <ChipRow items={COMBO_PRICES} value={price} onChange={setPrice} small />
      <ChipRow items={COMBO_SORTS} value={sort} onChange={setSort} small />

      <View className="flex-row items-center justify-between">
        <AppText className="text-sm text-ink-muted">
          <AppText weight="bold" className="text-sm text-ink">
            {cards.isPending ? '…' : list.length}
          </AppText>{' '}
          gói đang bán
        </AppText>
        {filtered && (
          <Pressable onPress={reset} accessibilityRole="button" hitSlop={8} className="flex-row items-center gap-1">
            <RotateCcw size={13} color={colors.sale} />
            <AppText weight="bold" className="text-xs text-sale">
              Xoá lọc
            </AppText>
          </Pressable>
        )}
      </View>
    </View>
  )

  const footer = (
    <View className="gap-4 pt-2">
      <Pressable
        onPress={() => router.push('/buyer/combo/builder')}
        accessibilityRole="button"
        className="flex-row items-center gap-3 rounded-panel bg-leaf-800 p-5 active:opacity-90"
      >
        <View className="h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
          <SlidersHorizontal size={22} color={colors.sun300} />
        </View>
        <View className="flex-1 gap-0.5">
          <AppText weight="extrabold" className="text-base text-white">
            Tự thiết kế combo
          </AppText>
          <AppText className="text-xs text-white/80">Chọn từng loại nông sản bạn thích cho tuần mới</AppText>
        </View>
        <ArrowRight size={20} color={colors.white} />
      </Pressable>
      <View className="gap-2.5 rounded-panel border-2 border-dashed border-leaf-200 bg-white p-4">
        <AppText weight="bold" className="text-sm">
          Đặc quyền khi mua combo
        </AppText>
        {PERKS.map((p) => (
          <View key={p} className="flex-row items-center gap-2">
            <CheckCircle2 size={16} color={colors.leaf600} />
            <AppText className="flex-1 text-sm text-ink-muted">{p}</AppText>
          </View>
        ))}
      </View>
    </View>
  )

  return (
    <SafeAreaView className="flex-1 bg-paper" edges={['top']}>
      <View className="flex-row items-center gap-2 border-b border-line bg-paper px-3 pb-2">
        <BackButton onPress={() => (router.canGoBack() ? router.back() : router.replace('/buyer'))} />
        <AppText accessibilityRole="header" weight="extrabold" className="flex-1 text-base">
          Combo & Túi mù
        </AppText>
      </View>
      <FlatList
        data={cards.isPending || cards.isError ? [] : list}
        keyExtractor={(c) => c.key}
        ListHeaderComponent={header}
        ListFooterComponent={footer}
        contentContainerClassName="gap-4 p-4 pb-10"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={colors.leaf700}
            colors={[colors.leaf700]}
          />
        }
        ListEmptyComponent={
          cards.isPending ? (
            <View className="gap-4">
              <ComboCardSkeleton />
              <ComboCardSkeleton />
            </View>
          ) : cards.isError ? (
            <ErrorState onRetry={() => void cards.refetch()} />
          ) : (
            <EmptyState
              icon={<Gift size={30} color={colors.leaf600} />}
              title={filtered ? 'Không có gói phù hợp' : 'Chưa có combo nào đang bán'}
              description={
                filtered
                  ? 'Thử bỏ bớt bộ lọc để xem thêm.'
                  : 'Các nhà vườn sẽ sớm mở bán combo và túi mù. Bạn có thể tự thiết kế combo ở bên dưới.'
              }
              action={filtered ? <Button title="Xoá lọc" icon={RotateCcw} onPress={reset} /> : undefined}
            />
          )
        }
        renderItem={({ item }) => (
          <ComboCardView
            card={item}
            adding={pendingId === item.id}
            onAdd={() =>
              addProduct(item.id, {
                itemType: item.kind,
                successMessage: item.kind === 'MYSTERY_BOX' ? 'Đã thêm túi mù vào giỏ!' : 'Đã thêm combo vào giỏ!',
              })
            }
          />
        )}
      />
    </SafeAreaView>
  )
}

function ChipRow<T extends string>({
  items,
  value,
  onChange,
  small,
}: {
  items: { id: T; label: string }[]
  value: T
  onChange: (v: T) => void
  small?: boolean
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
      {items.map((it) => {
        const active = it.id === value
        return (
          <Pressable
            key={it.id}
            onPress={() => onChange(it.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            className={cn(
              'items-center justify-center rounded-full border px-4',
              small ? 'h-8' : 'h-10',
              active ? 'border-leaf-700 bg-leaf-700' : 'border-line bg-white',
            )}
          >
            <AppText
              weight="semibold"
              className={cn(small ? 'text-xs' : 'text-sm', active ? 'text-white' : 'text-ink-muted')}
            >
              {it.label}
            </AppText>
          </Pressable>
        )
      })}
    </ScrollView>
  )
}
