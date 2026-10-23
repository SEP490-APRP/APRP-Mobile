import { useLocalSearchParams } from 'expo-router'
import { ArrowUpDown, Leaf, MapPin, RotateCcw, Search, SlidersHorizontal, Truck, X } from 'lucide-react-native'
import { useEffect, useMemo, useState } from 'react'
import { FlatList, ImageBackground, Pressable, RefreshControl, ScrollView, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppText, Button, EmptyState, ErrorState } from '@/components/ui'
import { useAddProductToCart, useCartQuantities } from '@/features/cart'
import {
  applyFilters,
  CATEGORIES,
  countActiveFilters,
  DEFAULT_FILTERS,
  FilterSheet,
  PRICE_RANGES,
  ProductCard,
  ProductCardSkeleton,
  SORT_OPTIONS,
  useStorefrontProducts,
  type Filters,
  type Product,
  type SortId,
} from '@/features/product'
import { colors } from '@/theme/colors'
import { cn } from '@/utils/helpers'

const bannerImage = require('../../../../assets/images/fresh-banner.jpg')

const HIGHLIGHTS = [
  { icon: Leaf, title: 'AI thẩm định độ tươi', text: 'Minh bạch điểm độ tươi trên từng lô hàng.' },
  { icon: MapPin, title: 'Trực tiếp từ nhà vườn', text: 'Biết rõ người trồng và nhật ký canh tác.' },
  { icon: Truck, title: 'Giao nhanh 2–4 giờ', text: 'Đóng thùng tái chế, giữ trọn độ giòn ngọt.' },
] as const

const SKELETONS = Array.from({ length: 6 }, (_, i) => `skeleton-${i}`)

/** Trang Nông sản tươi, chuyển từ pages/Fresh.tsx: tìm, lọc, sắp xếp và lưới 2 cột. */
export default function FreshScreen() {
  const params = useLocalSearchParams<{ category?: string }>()
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [sort, setSort] = useState<SortId>('featured')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const products = useStorefrontProducts()
  const cart = useCartQuantities()
  const { addProduct, pendingId } = useAddProductToCart()

  // Bấm danh mục ở Trang chủ: mở tab này kèm danh mục, áp vào bộ lọc.
  useEffect(() => {
    if (params.category) setFilters({ ...DEFAULT_FILTERS, category: params.category })
  }, [params.category])

  const items = useMemo(
    () => applyFilters(products.data ?? [], query, filters, sort),
    [products.data, query, filters, sort],
  )

  const activeCount = countActiveFilters(filters) + (query.trim() ? 1 : 0)
  const categoryLabel = CATEGORIES.find((c) => c.id === filters.category)?.label ?? filters.category

  const resetAll = () => {
    setFilters(DEFAULT_FILTERS)
    setSort('featured')
    setQuery('')
  }

  const refresh = async () => {
    setRefreshing(true)
    await products.refetch()
    setRefreshing(false)
  }

  // Chip cho từng bộ lọc đang bật, bấm để gỡ riêng lẻ.
  const chips = [
    filters.category !== DEFAULT_FILTERS.category && { key: 'category' as const, label: categoryLabel },
    filters.price !== DEFAULT_FILTERS.price && {
      key: 'price' as const,
      label: PRICE_RANGES.find((r) => r.id === filters.price)?.label ?? '',
    },
  ].filter((c) => !!c)

  const listHeader = (
    <View className="gap-4 pb-4">
      <ImageBackground
        source={bannerImage}
        resizeMode="cover"
        accessibilityLabel="Bà con nông dân thu hoạch nông sản tươi"
        imageStyle={{ borderRadius: 24 }}
        className="overflow-hidden rounded-panel"
      >
        <View className="items-center gap-2 rounded-panel bg-black/55 px-5 py-8">
          <AppText weight="bold" className="text-xs text-sun-300">
            Trang chủ › {categoryLabel}
          </AppText>
          <AppText weight="extrabold" className="text-center text-2xl text-white">
            {filters.category === DEFAULT_FILTERS.category ? 'Tất cả sản phẩm' : categoryLabel}
          </AppText>
          <AppText className="text-center text-xs leading-relaxed text-white/85">
            Thu hoạch trong ngày từ các nông hộ và hợp tác xã liên kết, giữ trọn độ tươi giòn.
          </AppText>
        </View>
      </ImageBackground>

      <View className="flex-row flex-wrap items-center gap-2">
        <AppText accessibilityLiveRegion="polite" className="mr-auto text-sm text-ink-muted">
          <AppText weight="bold" className="text-sm text-ink">
            {products.isPending ? '…' : items.length}
          </AppText>{' '}
          nông sản phù hợp
        </AppText>
        {chips.map((chip) => (
          <Pressable
            key={chip.key}
            onPress={() => setFilters((f) => ({ ...f, [chip.key]: DEFAULT_FILTERS[chip.key] }))}
            accessibilityRole="button"
            accessibilityLabel={`Bỏ lọc ${chip.label}`}
            className="h-8 flex-row items-center gap-1 rounded-full border border-leaf-200 bg-leaf-50 pl-3 pr-2"
          >
            <AppText weight="bold" className="text-xs text-leaf-800">
              {chip.label}
            </AppText>
            <X size={13} color={colors.leaf800} />
          </Pressable>
        ))}
      </View>
    </View>
  )

  const listEmpty = products.isPending ? (
    <View className="gap-3">
      {[0, 2, 4].map((i) => (
        <View key={SKELETONS[i]} className="flex-row gap-3">
          <ProductCardSkeleton />
          <ProductCardSkeleton />
        </View>
      ))}
    </View>
  ) : products.isError ? (
    <ErrorState onRetry={() => void products.refetch()} />
  ) : (
    <EmptyState
      title="Không tìm thấy nông sản phù hợp"
      description={
        query
          ? `Không có kết quả cho “${query}”. Thử từ khóa khác hoặc bỏ bớt bộ lọc.`
          : 'Thử bỏ bớt bộ lọc để xem thêm nông sản.'
      }
      action={<Button title="Xóa tất cả bộ lọc" icon={RotateCcw} onPress={resetAll} />}
    />
  )

  const listFooter =
    items.length > 0 ? (
      <View className="mt-6 gap-3">
        {HIGHLIGHTS.map(({ icon: Icon, title, text }) => (
          <View key={title} className="flex-row items-start gap-3 rounded-card border border-line bg-white p-4">
            <View className="h-10 w-10 items-center justify-center rounded-xl bg-leaf-50">
              <Icon size={20} color={colors.leaf600} />
            </View>
            <View className="flex-1">
              <AppText weight="bold" className="text-sm">
                {title}
              </AppText>
              <AppText className="mt-0.5 text-xs leading-relaxed text-ink-muted">{text}</AppText>
            </View>
          </View>
        ))}
      </View>
    ) : undefined

  return (
    <SafeAreaView className="flex-1 bg-paper" edges={['top']}>
      {/* Thanh công cụ luôn ở trên cùng: tìm kiếm, bộ lọc, sắp xếp */}
      <View className="gap-3 border-b border-line bg-paper px-4 pb-3 pt-2">
        <View className="flex-row gap-2">
          <View className="h-11 flex-1 flex-row items-center rounded-xl border border-line bg-white pl-3">
            <Search size={16} color={colors.inkSubtle} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Tìm theo tên, nhà vườn…"
              placeholderTextColor={colors.inkSubtle}
              accessibilityLabel="Tìm nông sản"
              returnKeyType="search"
              className="h-full flex-1 px-2 text-sm text-ink"
              style={{ fontFamily: 'BeVietnamPro_400Regular' }}
            />
            {!!query && (
              <Pressable
                onPress={() => setQuery('')}
                accessibilityRole="button"
                accessibilityLabel="Xóa từ khóa"
                className="h-11 w-10 items-center justify-center"
              >
                <X size={16} color={colors.inkSubtle} />
              </Pressable>
            )}
          </View>
          <Pressable
            onPress={() => setFiltersOpen(true)}
            accessibilityRole="button"
            accessibilityLabel={`Mở bộ lọc${activeCount ? `, ${activeCount} đang bật` : ''}`}
            className="h-11 flex-row items-center gap-1.5 rounded-xl border border-leaf-700 bg-white px-3 active:bg-leaf-50"
          >
            <SlidersHorizontal size={16} color={colors.leaf700} />
            {countActiveFilters(filters) > 0 && (
              <View className="h-5 min-w-[20px] items-center justify-center rounded-full bg-leaf-700 px-1">
                <AppText weight="bold" className="text-xs text-white">
                  {countActiveFilters(filters)}
                </AppText>
              </View>
            )}
          </Pressable>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          accessibilityLabel="Sắp xếp"
          contentContainerClassName="items-center gap-2"
        >
          <ArrowUpDown size={15} color={colors.leaf600} />
          {SORT_OPTIONS.map((s) => {
            const active = sort === s.id
            return (
              <Pressable
                key={s.id}
                onPress={() => setSort(s.id)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                className={cn(
                  'h-9 justify-center rounded-full border px-3.5',
                  active ? 'border-leaf-700 bg-leaf-700' : 'border-line bg-white',
                )}
              >
                <AppText weight="bold" className={cn('text-xs', active ? 'text-white' : 'text-ink-muted')}>
                  {s.label}
                </AppText>
              </Pressable>
            )
          })}
        </ScrollView>
      </View>

      <FlatList<Product>
        data={products.isPending ? [] : items}
        keyExtractor={(p) => p.id}
        numColumns={2}
        columnWrapperClassName="gap-3"
        contentContainerClassName="gap-3 px-4 pb-10 pt-4"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        ListFooterComponent={listFooter}
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onAdd={addProduct}
            inCartQuantity={cart?.[item.id]}
            adding={pendingId != null && String(pendingId) === item.id}
          />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.leaf700} colors={[colors.leaf700]} />
        }
      />

      <FilterSheet
        visible={filtersOpen}
        filters={filters}
        resultCount={items.length}
        onChange={setFilters}
        onReset={resetAll}
        onClose={() => setFiltersOpen(false)}
      />
    </SafeAreaView>
  )
}
