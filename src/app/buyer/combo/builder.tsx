import { router } from 'expo-router'
import { Check, RotateCcw, ShoppingBasket } from 'lucide-react-native'
import { useState } from 'react'
import { FlatList, Pressable, RefreshControl, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppText, Button, EmptyState, ErrorState, Skeleton } from '@/components/ui'
import { BackButton } from '@/features/auth/components'
import { useAddToCart } from '@/features/cart'
import { money, ProduceImage, useStorefrontProducts, type Product } from '@/features/product'
import { useUiStore } from '@/stores'
import { colors } from '@/theme/colors'
import { getErrorMessage } from '@/utils/errors'
import { cn } from '@/utils/helpers'

/**
 * Tự thiết kế combo (khối "Tự chọn nông sản cho tuần mới" của trang Combo bản web).
 * Web dùng danh sách mẫu; mobile lấy nông sản thật đang bán, mỗi món chọn thêm 1 đơn vị vào giỏ.
 */
export default function ComboBuilderScreen() {
  const products = useStorefrontProducts()
  const add = useAddToCart()
  const showToast = useUiStore((s) => s.showToast)
  const [selected, setSelected] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const list = (products.data ?? []).filter((p) => p.stock > 0)
  const chosen = list.filter((p) => selected.includes(p.id))
  // Lưới 2 cột: thêm ô trống khi số món lẻ để ô cuối không giãn hết hàng.
  const grid: (Product | null)[] = list.length % 2 ? [...list, null] : list
  const total = chosen.reduce((s, p) => s + p.price, 0)

  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))

  const submit = async () => {
    setSaving(true)
    let failed = 0
    for (const p of chosen) {
      try {
        await add.mutateAsync({ itemType: 'PRODUCT', itemId: Number(p.id), quantity: 1 })
      } catch (err) {
        failed++
        if (failed === 1) showToast(getErrorMessage(err, `Không thêm được ${p.name}.`))
      }
    }
    setSaving(false)
    if (failed === 0) {
      showToast(`Đã thêm ${chosen.length} món vào giỏ!`)
      setSelected([])
      router.navigate('/buyer/cart')
    } else if (failed < chosen.length) {
      showToast(`Đã thêm ${chosen.length - failed}/${chosen.length} món, còn ${failed} món chưa thêm được.`)
    }
  }

  const refresh = async () => {
    setRefreshing(true)
    await products.refetch()
    setRefreshing(false)
  }

  return (
    <SafeAreaView className="flex-1 bg-paper" edges={['top', 'bottom']}>
      <View className="flex-row items-center gap-2 border-b border-line bg-paper px-3 pb-2">
        <BackButton onPress={() => (router.canGoBack() ? router.back() : router.replace('/buyer/combos'))} />
        <AppText accessibilityRole="header" weight="extrabold" className="flex-1 text-base">
          Tự thiết kế combo
        </AppText>
        {selected.length > 0 && (
          <Pressable
            onPress={() => setSelected([])}
            accessibilityRole="button"
            hitSlop={8}
            className="flex-row items-center gap-1 pr-2"
          >
            <RotateCcw size={13} color={colors.sale} />
            <AppText weight="bold" className="text-xs text-sale">
              Bỏ chọn
            </AppText>
          </Pressable>
        )}
      </View>

      <FlatList
        data={products.isPending || products.isError ? [] : grid}
        keyExtractor={(p) => p?.id ?? 'spacer'}
        numColumns={2}
        columnWrapperClassName="gap-3"
        contentContainerClassName="gap-3 p-4 pb-6"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={colors.leaf700}
            colors={[colors.leaf700]}
          />
        }
        ListHeaderComponent={
          <View className="gap-1 pb-1">
            <AppText weight="extrabold" className="text-xl">
              Tự chọn nông sản cho tuần mới
            </AppText>
            <AppText className="text-sm text-ink-muted">
              Chạm để chọn các loại bạn thích, mỗi loại thêm 1 đơn vị vào giỏ.
            </AppText>
          </View>
        }
        ListEmptyComponent={
          products.isPending ? (
            <View className="flex-row gap-3">
              <Skeleton className="h-56 flex-1 rounded-2xl" />
              <Skeleton className="h-56 flex-1 rounded-2xl" />
            </View>
          ) : products.isError ? (
            <ErrorState onRetry={() => void products.refetch()} />
          ) : (
            <EmptyState title="Chưa có nông sản đang bán" description="Quay lại sau khi nhà vườn mở bán nhé." />
          )
        }
        renderItem={({ item }) =>
          item ? (
            <PickTile product={item} chosen={selected.includes(item.id)} onPress={() => toggle(item.id)} />
          ) : (
            <View className="flex-1" />
          )
        }
      />

      <View className="flex-row items-center gap-3 bg-leaf-800 px-4 py-3">
        <View className="h-11 w-11 items-center justify-center rounded-xl bg-white/15">
          <ShoppingBasket size={22} color={colors.sun300} />
        </View>
        <View className="flex-1">
          <AppText className="text-xs text-white/75">Giỏ tự thiết kế</AppText>
          <AppText weight="extrabold" className="text-base text-white">
            {chosen.length} món ·{' '}
            <AppText weight="extrabold" className="text-base text-sun-300">
              {money(total)}
            </AppText>
          </AppText>
        </View>
        <Button
          title="Thêm vào giỏ"
          variant="outline"
          disabled={!chosen.length}
          loading={saving}
          onPress={() => void submit()}
          className="px-4"
        />
      </View>
    </SafeAreaView>
  )
}

function PickTile({ product: p, chosen, onPress }: { product: Product; chosen: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: chosen }}
      accessibilityLabel={`${p.name}, ${money(p.price)} mỗi ${p.unit}`}
      className={cn(
        'flex-1 overflow-hidden rounded-2xl border-2 bg-white p-2',
        chosen ? 'border-leaf-700 bg-leaf-50' : 'border-line',
      )}
    >
      <View className="aspect-square overflow-hidden rounded-xl bg-paper">
        <ProduceImage src={p.image} alt={p.name} />
        <View
          className={cn(
            'absolute right-2 top-2 h-7 w-7 items-center justify-center rounded-full border-2',
            chosen ? 'border-leaf-700 bg-leaf-700' : 'border-white bg-black/25',
          )}
        >
          {chosen && <Check size={15} strokeWidth={3} color={colors.white} />}
        </View>
      </View>
      <AppText weight="bold" numberOfLines={1} className="mt-2 text-sm">
        {p.name}
      </AppText>
      <View className="flex-row items-center justify-between">
        <AppText weight="bold" className="text-sm text-leaf-800">
          {money(p.price)}/{p.unit}
        </AppText>
      </View>
      <AppText numberOfLines={1} className="text-xs text-ink-muted">
        {p.farm}
      </AppText>
    </Pressable>
  )
}
