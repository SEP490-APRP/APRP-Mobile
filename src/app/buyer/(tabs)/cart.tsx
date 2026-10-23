import { router } from 'expo-router'
import { Image } from 'expo-image'
import { ArrowRight, ShieldCheck, Store } from 'lucide-react-native'
import { useState } from 'react'
import { Pressable, RefreshControl, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppText, Button, Checkbox, ConfirmDialog, EmptyState, ErrorState, Skeleton } from '@/components/ui'
import { CartItemRow, cartItemName, isCartEmpty, isGroupSelected, shopSubtotal, useCartSelection } from '@/features/cart'
import { money } from '@/features/product'
import { colors } from '@/theme/colors'

const basket = require('../../../../assets/images/logo-icon.png')

/** Giỏ hàng, chuyển từ features/cart/components/CartView.tsx bản web. */
export default function CartTab() {
  const {
    cartQuery,
    cart,
    selected,
    summary,
    allSelected,
    toggleItem,
    toggleShop,
    toggleAll,
    changeQuantity,
    busyId,
    isMutating,
    deleting,
    requestDelete,
    cancelDelete,
    confirmDelete,
    isDeleting,
  } = useCartSelection()
  const [refreshing, setRefreshing] = useState(false)

  const refresh = async () => {
    setRefreshing(true)
    await cartQuery.refetch()
    setRefreshing(false)
  }

  const checkout = () => {
    if (selected.size === 0 || isMutating) return
    router.push({ pathname: '/buyer/checkout', params: { items: [...selected].join(',') } })
  }

  const header = (
    <View className="flex-row items-end justify-between px-4 pb-3 pt-2">
      <View>
        <AppText accessibilityRole="header" weight="extrabold" className="text-2xl">
          Giỏ hàng
        </AppText>
        {summary.totalQuantity > 0 && (
          <AppText className="text-sm text-ink-muted">{summary.totalQuantity} sản phẩm trong giỏ</AppText>
        )}
      </View>
    </View>
  )

  let body: React.ReactNode
  if (cartQuery.isPending) {
    body = (
      <View className="gap-4 px-4">
        <Skeleton className="h-44 w-full rounded-panel" />
        <Skeleton className="h-44 w-full rounded-panel" />
      </View>
    )
  } else if (cartQuery.isError) {
    body = (
      <View className="flex-1 justify-center px-4">
        <ErrorState description="Không thể tải giỏ hàng. Vui lòng thử lại." onRetry={() => void cartQuery.refetch()} />
      </View>
    )
  } else if (isCartEmpty(cart)) {
    body = (
      <View className="flex-1 justify-center px-4">
        <EmptyState
          icon={<Image source={basket} style={{ width: 48, height: 48 }} contentFit="contain" accessibilityIgnoresInvertColors />}
          title="Giỏ hàng của bạn đang trống"
          description="Hãy khám phá nông sản tươi ngon từ các nhà vườn và thêm vào giỏ nhé."
          action={<Button title="Khám phá nông sản" onPress={() => router.navigate('/buyer/fresh')} />}
        />
      </View>
    )
  }

  if (body) {
    return (
      <SafeAreaView className="flex-1 bg-paper" edges={['top']}>
        {header}
        {body}
      </SafeAreaView>
    )
  }

  const shops = cart!.shopCarts.filter((s) => s.items.length > 0)

  return (
    <SafeAreaView className="flex-1 bg-paper" edges={['top']}>
      {header}
      <ScrollView
        contentContainerClassName="gap-4 px-4 pb-6"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.leaf700} colors={[colors.leaf700]} />
        }
      >
        {shops.length > 1 && (
          <View className="flex-row gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
            <Store size={18} color="#047857" />
            <View className="flex-1">
              <AppText weight="bold" className="text-sm text-emerald-900">
                Nông sản từ {shops.length} nhà vườn
              </AppText>
              <AppText className="text-xs leading-relaxed text-emerald-800">
                Mỗi nhà vườn đóng gói và giao riêng để nông sản luôn tươi khi đến tay bạn.
              </AppText>
            </View>
          </View>
        )}

        {shops.map((shop) => {
          const subtotal = shopSubtotal(shop.items, selected)
          return (
            <View key={shop.shopId} className="rounded-panel border border-line bg-white px-3 pb-2">
              <View className="flex-row items-center border-b border-line py-1">
                <Checkbox
                  checked={isGroupSelected(selected, shop.items)}
                  onChange={() => toggleShop(shop.items)}
                  label={`Chọn tất cả món của ${shop.shopName}`}
                />
                <Pressable
                  onPress={() => router.push({ pathname: '/buyer/shop/[id]', params: { id: String(shop.shopId) } })}
                  accessibilityRole="link"
                  className="flex-1 flex-row items-center gap-2"
                >
                  <Store size={17} color={colors.leaf700} />
                  <AppText weight="bold" numberOfLines={1} className="flex-1 text-sm">
                    {shop.shopName}
                  </AppText>
                </Pressable>
                <AppText className="pr-2 text-xs text-ink-muted">{shop.items.length} món</AppText>
              </View>
              {shop.items.map((item, idx) => (
                <View key={item.cartItemId} className={idx > 0 ? 'border-t border-line' : undefined}>
                  <CartItemRow
                    item={item}
                    selected={selected.has(item.cartItemId)}
                    busy={busyId === item.cartItemId}
                    onToggle={() => toggleItem(item.cartItemId)}
                    onChangeQuantity={(delta) => changeQuantity(item, delta)}
                    onRemove={() => requestDelete(item)}
                  />
                </View>
              ))}
              {subtotal > 0 && (
                <View className="flex-row items-center justify-between border-t border-line px-1 pt-2">
                  <AppText className="text-xs text-ink-muted">Tạm tính nhà vườn</AppText>
                  <AppText weight="bold" className="text-sm text-leaf-700">
                    {money(subtotal)}
                  </AppText>
                </View>
              )}
            </View>
          )
        })}

        <View className="flex-row items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3">
          <ShieldCheck size={16} color={colors.leaf700} />
          <AppText className="flex-1 text-xs text-ink-muted">
            Nông sản tươi từ vườn, cam kết chất lượng và hoàn tiền nếu hư hỏng. Phí vận chuyển tính ở bước thanh toán.
          </AppText>
        </View>
      </ScrollView>

      {/* Thanh thanh toán cố định phía trên thanh tab */}
      <View className="flex-row items-center gap-1 border-t border-line bg-white py-2 pl-1 pr-4">
        <Checkbox checked={allSelected} onChange={toggleAll} label="Chọn tất cả" />
        <View className="min-w-0 flex-1">
          <AppText className="text-xs text-ink-muted">Tất cả · {summary.selectedQuantity} món</AppText>
          <AppText weight="extrabold" className="text-lg text-leaf-700">
            {money(summary.amount)}
          </AppText>
        </View>
        <Button
          title="Mua hàng"
          icon={ArrowRight}
          disabled={selected.size === 0 || isMutating}
          onPress={checkout}
        />
      </View>

      <ConfirmDialog
        visible={!!deleting}
        title="Xoá khỏi giỏ hàng?"
        message={deleting ? `"${cartItemName(deleting)}" sẽ được xoá khỏi giỏ của bạn.` : undefined}
        confirmLabel="Xoá"
        destructive
        loading={isDeleting}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </SafeAreaView>
  )
}
