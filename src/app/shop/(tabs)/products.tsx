import { router } from 'expo-router'
import { Gift, Layers, type LucideIcon, Package, Plus, Search, Sprout, X } from 'lucide-react-native'
import { useMemo, useState } from 'react'
import { FlatList, Pressable, RefreshControl, ScrollView, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppText, BottomSheet, Button, ConfirmDialog, EmptyState, ErrorState, Skeleton } from '@/components/ui'
import {
  buildShopListings,
  countByStatus,
  filterListings,
  LISTING_KIND_FILTERS,
  LISTING_STATUS_FILTERS,
  ShopListingCard,
  useDeleteListing,
  useMyShopBoxes,
  useMyShopCombos,
  useMyShopProducts,
  type ShopListing,
} from '@/features/shop'
import { useUiStore } from '@/stores'
import { colors } from '@/theme/colors'
import { fontFamily } from '@/theme/fonts'
import { getErrorMessage } from '@/utils/errors'
import { cn } from '@/utils/helpers'

const NEW_OPTIONS: { icon: LucideIcon; title: string; hint: string; go: () => void }[] = [
  {
    icon: Sprout,
    title: 'Nông sản',
    hint: 'Bán lẻ theo kg, bó, hộp…',
    go: () => router.push('/shop/product/new'),
  },
  {
    icon: Layers,
    title: 'Combo món ăn',
    hint: 'Ghép nhiều nông sản trong kho thành một set',
    go: () => router.push({ pathname: '/shop/bundle', params: { kind: 'COMBO' } }),
  },
  {
    icon: Gift,
    title: 'Túi mù',
    hint: 'Túi bất ngờ giá tốt, bán nhanh cuối ngày',
    go: () => router.push({ pathname: '/shop/bundle', params: { kind: 'MYSTERY_BOX' } }),
  },
]

/** Sản phẩm của Nhà vườn, chuyển từ pages/farmer/Products.tsx: nông sản, combo, túi mù trong một danh sách. */
export default function ShopProductsTab() {
  const products = useMyShopProducts()
  const combos = useMyShopCombos()
  const boxes = useMyShopBoxes()
  const remove = useDeleteListing()
  const showToast = useUiStore((s) => s.showToast)
  const [status, setStatus] = useState<string>('ALL')
  const [kind, setKind] = useState<string>('ALL')
  const [query, setQuery] = useState('')
  const [pendingDelete, setPendingDelete] = useState<ShopListing | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [creating, setCreating] = useState(false)

  const all = useMemo(
    () => buildShopListings(products.data, combos.data, boxes.data),
    [products.data, combos.data, boxes.data],
  )
  const counts = useMemo(() => countByStatus(all), [all])
  const list = useMemo(() => filterListings(all, { status, kind, query }), [all, status, kind, query])

  // Combo và túi mù vẫn hiện khi API nông sản lỗi; chỉ báo lỗi cả trang khi không tải được gì.
  const loading = products.isPending && combos.isPending && boxes.isPending
  const failed = products.isError && combos.isError && boxes.isError

  const refresh = async () => {
    setRefreshing(true)
    await Promise.all([products.refetch(), combos.refetch(), boxes.refetch()])
    setRefreshing(false)
  }

  const edit = (item: ShopListing) => {
    if (item.kind === 'SINGLE') router.push({ pathname: '/shop/product/[id]', params: { id: String(item.id) } })
    else router.push({ pathname: '/shop/bundle', params: { kind: item.kind, id: String(item.id) } })
  }

  const confirmDelete = () => {
    if (!pendingDelete) return
    const { kind: k, id, name } = pendingDelete
    remove.mutate(
      { kind: k, id },
      {
        onSuccess: () => showToast(`Đã xoá "${name}".`),
        onError: (err) => showToast(getErrorMessage(err, 'Chưa xoá được, thử lại nhé.')),
        onSettled: () => setPendingDelete(null),
      },
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-paper" edges={['top']}>
      <View className="gap-3 border-b border-line bg-paper pb-3 pt-2">
        <View className="flex-row items-center justify-between px-4">
          <View>
            <AppText accessibilityRole="header" weight="extrabold" className="text-xl">
              Sản phẩm
            </AppText>
            {!loading && <AppText className="text-xs text-ink-muted">{all.length} tin đăng</AppText>}
          </View>
          <Pressable
            onPress={() => setCreating(true)}
            accessibilityRole="button"
            className="h-10 flex-row items-center gap-1.5 rounded-full bg-leaf-700 px-4 active:bg-leaf-800"
          >
            <Plus size={17} color={colors.white} />
            <AppText weight="bold" className="text-sm text-white">
              Đăng bán
            </AppText>
          </Pressable>
        </View>

        <View className="mx-4 h-11 flex-row items-center rounded-xl border border-line bg-white pl-3">
          <Search size={16} color={colors.inkSubtle} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Tìm tên, danh mục hoặc mã…"
            placeholderTextColor={colors.inkSubtle}
            accessibilityLabel="Tìm sản phẩm"
            returnKeyType="search"
            className="h-full flex-1 px-2 text-sm text-ink"
            style={{ fontFamily: fontFamily.regular }}
          />
          {!!query && (
            <Pressable
              onPress={() => setQuery('')}
              accessibilityRole="button"
              accessibilityLabel="Xoá từ khoá"
              hitSlop={8}
              className="h-full justify-center px-3"
            >
              <X size={16} color={colors.inkSubtle} />
            </Pressable>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-2"
          contentContainerStyle={{ paddingHorizontal: 16 }}
        >
          {LISTING_STATUS_FILTERS.map((f) => {
            const active = f.key === status
            const n = counts[f.key]
            return (
              <Pressable
                key={f.key}
                onPress={() => setStatus(f.key)}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                className={cn(
                  'h-9 flex-row items-center justify-center gap-1.5 rounded-full border px-3.5',
                  active ? 'border-leaf-700 bg-leaf-700' : 'border-line bg-white',
                )}
              >
                <AppText weight="semibold" className={cn('text-sm', active ? 'text-white' : 'text-ink-muted')}>
                  {f.label}
                </AppText>
                {!loading && n > 0 && (
                  <AppText weight="bold" className={cn('text-xs', active ? 'text-leaf-100' : 'text-ink-subtle')}>
                    {n}
                  </AppText>
                )}
              </Pressable>
            )
          })}
        </ScrollView>

        <View className="mx-4 flex-row gap-1 rounded-xl bg-white p-1">
          {LISTING_KIND_FILTERS.map((f) => {
            const active = f.key === kind
            return (
              <Pressable
                key={f.key}
                onPress={() => setKind(f.key)}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                className={cn('h-9 flex-1 items-center justify-center rounded-lg', active && 'bg-leaf-50')}
              >
                <AppText weight="bold" className={cn('text-sm', active ? 'text-leaf-700' : 'text-ink-muted')}>
                  {f.label}
                </AppText>
              </Pressable>
            )
          })}
        </View>
      </View>

      <FlatList
        data={loading || failed ? [] : list}
        keyExtractor={(l) => l.key}
        contentContainerClassName="gap-3 p-4 pb-10"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={colors.leaf700}
            colors={[colors.leaf700]}
          />
        }
        ListEmptyComponent={
          loading ? (
            <View className="gap-3">
              <Skeleton className="h-40 rounded-panel" />
              <Skeleton className="h-40 rounded-panel" />
            </View>
          ) : failed ? (
            <ErrorState onRetry={() => void refresh()} />
          ) : (
            <EmptyState
              icon={<Package size={30} color={colors.leaf600} />}
              title={all.length === 0 ? 'Chưa có tin đăng nào' : 'Không có tin phù hợp'}
              description={
                all.length === 0
                  ? 'Đăng bán nông sản đầu tiên để khách trên CapNong tìm thấy vườn của bạn.'
                  : 'Thử bỏ bớt bộ lọc hoặc đổi từ khoá.'
              }
              action={
                all.length === 0 ? (
                  <Button title="Đăng bán nông sản" icon={Plus} onPress={() => router.push('/shop/product/new')} />
                ) : undefined
              }
            />
          )
        }
        renderItem={({ item }) => (
          <ShopListingCard item={item} onEdit={() => edit(item)} onDelete={() => setPendingDelete(item)} />
        )}
      />

      <BottomSheet visible={creating} title="Đăng bán gì hôm nay?" onClose={() => setCreating(false)}>
        {NEW_OPTIONS.map(({ icon: Icon, title, hint, go }) => (
          <Pressable
            key={title}
            onPress={() => {
              setCreating(false)
              go()
            }}
            accessibilityRole="button"
            className="flex-row items-center gap-3 rounded-card border border-line bg-white p-4 active:bg-leaf-50"
          >
            <View className="h-11 w-11 items-center justify-center rounded-full bg-leaf-50">
              <Icon size={20} color={colors.leaf700} />
            </View>
            <View className="flex-1">
              <AppText weight="bold" className="text-base">
                {title}
              </AppText>
              <AppText className="text-sm text-ink-muted">{hint}</AppText>
            </View>
          </Pressable>
        ))}
      </BottomSheet>

      <ConfirmDialog
        visible={pendingDelete != null}
        title={`Xoá "${pendingDelete?.name ?? ''}"?`}
        message="Tin đăng sẽ bị gỡ khỏi chợ và không khôi phục được. Đơn đã đặt trước đó vẫn giữ nguyên."
        confirmLabel="Xoá tin"
        cancelLabel="Giữ lại"
        destructive
        loading={remove.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </SafeAreaView>
  )
}
