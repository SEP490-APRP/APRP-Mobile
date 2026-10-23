import { Image } from 'expo-image'
import { router, useLocalSearchParams } from 'expo-router'
import {
  AlertCircle,
  Banknote,
  ChevronRight,
  MapPin,
  QrCode,
  ShieldCheck,
  ShoppingBasket,
  Store,
  Ticket,
  type LucideIcon,
} from 'lucide-react-native'
import { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppText, Button, CapNongLoading, EmptyState } from '@/components/ui'
import { BackButton } from '@/features/auth/components'
import { useSavedAddresses } from '@/features/address'
import { cartItemName, isItemAvailable, useMyCart } from '@/features/cart'
import {
  AddressSheet,
  isVoucherEligible,
  normalizeCode,
  toggleVoucherCode,
  useCheckoutPreview,
  useCheckoutVouchers,
  useCollectVoucher,
  useCreateOrder,
  usePayosCheckout,
  VoucherSheet,
  type CheckoutVoucher,
} from '@/features/checkout'
import { money } from '@/features/product'
import { useAuth, useUiStore } from '@/stores'
import { colors } from '@/theme/colors'
import { fontFamily } from '@/theme/fonts'
import type { SavedAddress } from '@/types/address.types'
import { getErrorMessage } from '@/utils/errors'
import { cn } from '@/utils/helpers'

type PaymentMethod = 'PAYOS' | 'COD'
type Delivery = { addressId: number | null; recipientName: string; recipientPhone: string; shippingAddress: string }

const METHODS: { id: PaymentMethod; icon: LucideIcon; title: string; desc: string }[] = [
  { id: 'PAYOS', icon: QrCode, title: 'Chuyển khoản qua PayOS', desc: 'Quét VietQR hoặc mở app ngân hàng, xác nhận tức thì.' },
  { id: 'COD', icon: Banknote, title: 'Thanh toán khi nhận hàng', desc: 'Trả tiền mặt cho shipper khi nhận nông sản.' },
]

/** Xác nhận đặt hàng và thanh toán, chuyển từ features/order/components/CheckoutView.tsx. */
export default function CheckoutScreen() {
  const params = useLocalSearchParams<{ items?: string }>()
  const pickedIds = useMemo(
    () => (params.items ? new Set(params.items.split(',').map(Number).filter((n) => n > 0)) : null),
    [params.items],
  )
  const { user } = useAuth()
  const showToast = useUiStore((s) => s.showToast)

  const cartQuery = useMyCart()
  const addressesQuery = useSavedAddresses()
  const addresses = addressesQuery.data ?? []
  const vouchersQuery = useCheckoutVouchers()
  const vouchers = vouchersQuery.data ?? []
  const collect = useCollectVoucher()
  const createOrder = useCreateOrder()
  const payos = usePayosCheckout()

  const [delivery, setDelivery] = useState<Delivery | null>(null)
  const [addressOpen, setAddressOpen] = useState(false)
  const [voucherOpen, setVoucherOpen] = useState(false)
  const [codes, setCodes] = useState<string[]>([])
  const [voucherError, setVoucherError] = useState<string | null>(null)
  const [method, setMethod] = useState<PaymentMethod>('PAYOS')
  const [note, setNote] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Món được chọn ở giỏ, nhóm theo shop; bỏ món hết hàng.
  const shops = useMemo(
    () =>
      (cartQuery.data?.shopCarts ?? [])
        .map((shop) => ({
          ...shop,
          items: shop.items.filter((i) => isItemAvailable(i) && (!pickedIds || pickedIds.has(i.cartItemId))),
        }))
        .filter((shop) => shop.items.length > 0),
    [cartQuery.data, pickedIds],
  )
  const items = shops.flatMap((s) => s.items)
  const shopGoods = shops.map((s) => ({ shopId: s.shopId, goods: s.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0) }))
  const goodsTotal = shopGoods.reduce((sum, s) => sum + s.goods, 0)

  const itemRequests = useMemo(
    () =>
      items.map((i) => ({
        productId: i.productId || (i.itemType === 'PRODUCT' ? i.itemId : undefined),
        mysteryBoxId: i.mysteryBoxId || (i.itemType === 'MYSTERY_BOX' ? i.itemId : undefined),
        buildComboId: i.buildComboId || (i.itemType === 'BUILD_COMBO' ? i.itemId : undefined),
        quantity: i.quantity,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [shops],
  )
  const cartItemIds = items.map((i) => i.cartItemId)

  // Lần đầu: lấy địa chỉ mặc định trong sổ, chưa có sổ thì lấy từ hồ sơ.
  useEffect(() => {
    if (delivery || addressesQuery.isPending) return
    const preferred = addresses.find((a) => a.isDefault) ?? addresses[0]
    if (preferred) setDelivery(fromSaved(preferred))
    else if (user?.address)
      setDelivery({
        addressId: null,
        recipientName: user.fullName || user.name,
        recipientPhone: user.phoneNumber || user.phone || '',
        shippingAddress: user.address,
      })
  }, [addressesQuery.isPending, addresses, delivery, user])

  const preview = useCheckoutPreview(
    { shippingAddress: delivery?.shippingAddress, voucherCodes: codes, items: itemRequests, cartItemIds },
    items.length > 0 && !!delivery?.shippingAddress,
  )
  const p = preview.data
  const goods = p?.totalGoodsAmount ?? p?.subtotal ?? goodsTotal
  const shipping = p?.totalShippingFee ?? p?.shippingFee
  const discount = p?.totalVoucherDiscount ?? p?.discount ?? 0
  const total = p?.finalTotalAmount ?? p?.totalAmount ?? goods + (shipping ?? 0) - discount

  const voucherRows = vouchers.map((voucher) => ({ voucher, eligible: isVoucherEligible(voucher, shopGoods) }))

  const toggleVoucher = (voucher: CheckoutVoucher, list: readonly CheckoutVoucher[] = vouchers) => {
    const code = normalizeCode(voucher.voucherCode)
    if (!codes.includes(code) && !isVoucherEligible(voucher, shopGoods)) {
      setVoucherError('Đơn hàng chưa đủ điều kiện dùng mã này (xem đơn tối thiểu).')
      return
    }
    setVoucherError(null)
    setCodes(toggleVoucherCode(codes, voucher, list))
  }

  const saveVoucher = (voucher: CheckoutVoucher) =>
    collect.mutate(normalizeCode(voucher.voucherCode), {
      onSuccess: () => showToast(`Đã lưu mã ${voucher.voucherCode} vào ví.`),
      onError: (err) => setVoucherError(getErrorMessage(err, 'Mã này đã hết lượt lưu hoặc không còn khả dụng.')),
    })

  const applyCode = async (raw: string) => {
    const code = normalizeCode(raw)
    if (!code) return
    if (codes.includes(code)) return setVoucherError('Mã này đã được chọn.')
    let found = vouchers.find((v) => normalizeCode(v.voucherCode) === code)
    let list = vouchers
    if (!found?.isCollected) {
      try {
        await collect.mutateAsync(code)
        list = (await vouchersQuery.refetch()).data ?? []
        found = list.find((v) => normalizeCode(v.voucherCode) === code)
      } catch (err) {
        return setVoucherError(getErrorMessage(err, 'Mã không tồn tại, đã hết lượt hoặc hết hạn.'))
      }
    }
    if (!found) return setVoucherError('Không tìm thấy voucher này.')
    toggleVoucher(found, list)
  }

  const placeOrder = async () => {
    if (!delivery) {
      setAddressOpen(true)
      return
    }
    setSubmitError(null)
    let orders
    try {
      orders = await createOrder.mutateAsync({
        recipientName: delivery.recipientName,
        recipientPhone: delivery.recipientPhone,
        shippingAddress: delivery.shippingAddress,
        // Địa chỉ đã nằm trong sổ (thêm qua tấm Địa chỉ) nên không lưu lại lần nữa.
        saveAddressToBook: delivery.addressId == null,
        note: note.trim() || undefined,
        paymentMethod: method,
        voucherCodes: codes,
        items: itemRequests,
        cartItemIds,
      })
    } catch (err) {
      const msg = getErrorMessage(err, 'Có lỗi khi tạo đơn hàng. Vui lòng kiểm tra lại.')
      setSubmitError(msg)
      showToast(msg)
      return
    }
    const first = orders?.[0]
    if (!first) return
    const orderId = first.orderId ?? first.id
    if (method === 'COD') {
      router.replace({ pathname: '/buyer/payment/result', params: { orderId: String(orderId), method: 'COD' } })
      return
    }
    try {
      await payos.start({ orderId, batchId: first.batchId })
    } catch (err) {
      // Đơn đã tạo nhưng chưa lấy được link: màn kết quả có nút "Thanh toán lại".
      showToast(getErrorMessage(err, 'Chưa mở được cổng PayOS. Bạn có thể thanh toán lại.'))
      router.replace({
        pathname: '/buyer/payment/result',
        params: { orderId: String(orderId), method: 'PAYOS', status: 'AWAITING_PAYMENT' },
      })
    }
  }

  const header = (
    <View className="flex-row items-center gap-2 border-b border-line bg-paper px-3 pb-2">
      <BackButton onPress={() => (router.canGoBack() ? router.back() : router.replace('/buyer/cart'))} />
      <AppText accessibilityRole="header" weight="extrabold" className="flex-1 text-base">
        Thanh toán
      </AppText>
    </View>
  )

  if (cartQuery.isPending) return <CapNongLoading message="Đang chuẩn bị đơn hàng" />

  if (items.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-paper" edges={['top']}>
        {header}
        <View className="flex-1 justify-center p-5">
          <EmptyState
            icon={<ShoppingBasket size={32} color={colors.leaf600} />}
            title="Không có sản phẩm để thanh toán"
            description="Hãy quay lại giỏ hàng và chọn món bạn muốn mua."
            action={<Button title="Về giỏ hàng" onPress={() => router.replace('/buyer/cart')} />}
          />
        </View>
      </SafeAreaView>
    )
  }

  const placing = createOrder.isPending || payos.isPending
  const submitLabel = method === 'PAYOS' ? 'Thanh toán PayOS' : 'Đặt hàng'

  return (
    <SafeAreaView className="flex-1 bg-paper" edges={['top', 'bottom']}>
      {header}
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="gap-4 px-4 pb-8 pt-4">
        {/* Địa chỉ nhận hàng */}
        <Pressable
          onPress={() => setAddressOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Đổi địa chỉ nhận hàng"
          className="flex-row items-center gap-3 rounded-panel border border-line bg-white p-4 active:bg-leaf-50"
        >
          <View className="h-10 w-10 items-center justify-center rounded-xl bg-leaf-50">
            <MapPin size={20} color={colors.leaf700} />
          </View>
          {delivery ? (
            <View className="flex-1 gap-0.5">
              <AppText weight="bold" className="text-sm">
                {delivery.recipientName} · {delivery.recipientPhone}
              </AppText>
              <AppText numberOfLines={2} className="text-sm leading-relaxed text-ink-muted">
                {delivery.shippingAddress}
              </AppText>
            </View>
          ) : (
            <View className="flex-1">
              <AppText weight="bold" className="text-sm text-leaf-700">
                Thêm địa chỉ nhận hàng
              </AppText>
              <AppText className="text-xs text-ink-muted">Cần có địa chỉ để tính phí giao hàng</AppText>
            </View>
          )}
          <ChevronRight size={18} color={colors.inkSubtle} />
        </Pressable>

        {/* Món theo từng nhà vườn */}
        {shops.map((shop) => {
          const shopPreview = p?.shopOrders?.find((o) => Number(o.shopId) === Number(shop.shopId))
          return (
            <View key={shop.shopId} className="rounded-panel border border-line bg-white p-4">
              <View className="mb-1 flex-row items-center gap-2">
                <Store size={16} color={colors.leaf700} />
                <AppText weight="bold" numberOfLines={1} className="flex-1 text-sm">
                  {shop.shopName}
                </AppText>
              </View>
              {shop.items.map((item) => (
                <View key={item.cartItemId} className="flex-row items-center gap-3 py-2">
                  <View className="h-14 w-14 overflow-hidden rounded-xl border border-line bg-paper">
                    {item.imageUrl ? (
                      <Image source={{ uri: item.imageUrl }} style={{ width: 56, height: 56 }} contentFit="cover" />
                    ) : (
                      <View className="flex-1 items-center justify-center">
                        <ShoppingBasket size={20} color={colors.inkSubtle} />
                      </View>
                    )}
                  </View>
                  <View className="min-w-0 flex-1">
                    <AppText weight="semibold" numberOfLines={2} className="text-sm">
                      {cartItemName(item)}
                    </AppText>
                    <AppText className="text-xs text-ink-muted">
                      {money(item.unitPrice)} × {item.quantity}
                    </AppText>
                  </View>
                  <AppText weight="bold" className="text-sm">
                    {money(item.unitPrice * item.quantity)}
                  </AppText>
                </View>
              ))}
              {shopPreview && (
                <View className="mt-1 gap-1 border-t border-line pt-2">
                  <Line label="Phí giao từ nhà vườn" value={money(shopPreview.shippingFee)} />
                  {shopPreview.voucherDiscount > 0 && (
                    <Line label="Voucher shop" value={`-${money(shopPreview.voucherDiscount)}`} tone="leaf" />
                  )}
                </View>
              )}
            </View>
          )
        })}

        {/* Voucher */}
        <Pressable
          onPress={() => setVoucherOpen(true)}
          accessibilityRole="button"
          className="flex-row items-center gap-3 rounded-panel border border-line bg-white p-4 active:bg-leaf-50"
        >
          <Ticket size={20} color={colors.soil600} />
          <View className="flex-1">
            <AppText weight="bold" className="text-sm">
              CapNong Voucher
            </AppText>
            <AppText numberOfLines={1} className="text-xs text-ink-muted">
              {codes.length > 0 ? codes.join(' · ') : 'Chọn hoặc nhập mã giảm giá'}
            </AppText>
          </View>
          {discount > 0 && (
            <AppText weight="bold" className="text-sm text-leaf-700">
              -{money(discount)}
            </AppText>
          )}
          <ChevronRight size={18} color={colors.inkSubtle} />
        </Pressable>

        {/* Phương thức thanh toán */}
        <View accessibilityRole="radiogroup" className="gap-2 rounded-panel border border-line bg-white p-4">
          <AppText weight="bold" className="mb-1 text-sm">
            Phương thức thanh toán
          </AppText>
          {METHODS.map(({ id, icon: Icon, title, desc }) => {
            const active = method === id
            return (
              <Pressable
                key={id}
                onPress={() => setMethod(id)}
                accessibilityRole="radio"
                accessibilityState={{ checked: active }}
                className={cn('flex-row items-center gap-3 rounded-2xl border-2 p-3', active ? 'border-leaf-700 bg-leaf-50' : 'border-line')}
              >
                <Icon size={22} color={active ? colors.leaf700 : colors.inkSubtle} />
                <View className="flex-1">
                  <AppText weight="bold" className="text-sm">
                    {title}
                  </AppText>
                  <AppText className="text-xs text-ink-muted">{desc}</AppText>
                </View>
                <View
                  className={cn('h-5 w-5 items-center justify-center rounded-full border-2', active ? 'border-leaf-700' : 'border-line-strong')}
                >
                  {active && <View className="h-2.5 w-2.5 rounded-full bg-leaf-700" />}
                </View>
              </Pressable>
            )
          })}
        </View>

        {/* Ghi chú */}
        <View className="gap-1.5 rounded-panel border border-line bg-white p-4">
          <AppText weight="bold" className="text-sm">
            Ghi chú cho nhà vườn
          </AppText>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="VD: Giao giờ hành chính, gọi trước khi tới"
            placeholderTextColor={colors.inkSubtle}
            multiline
            maxLength={300}
            accessibilityLabel="Ghi chú cho nhà vườn"
            className="min-h-[72px] rounded-xl border border-line bg-paper p-3 text-sm text-ink"
            style={{ fontFamily: fontFamily.regular, textAlignVertical: 'top' }}
          />
        </View>

        {/* Chi tiết thanh toán */}
        <View className="gap-2 rounded-panel border border-line bg-white p-4">
          <AppText weight="bold" className="mb-1 text-sm">
            Chi tiết thanh toán
          </AppText>
          <Line label="Tiền hàng" value={money(goods)} />
          <Line
            label="Phí vận chuyển"
            value={preview.isFetching && shipping == null ? '…' : shipping == null ? 'Chọn địa chỉ để tính' : money(shipping)}
          />
          {discount > 0 && <Line label="Giảm giá voucher" value={`-${money(discount)}`} tone="leaf" />}
          <View className="mt-1 flex-row items-baseline justify-between border-t border-line pt-3">
            <AppText weight="bold" className="text-base">
              Tổng thanh toán
            </AppText>
            <AppText weight="extrabold" className="text-xl text-leaf-700">
              {money(total)}
            </AppText>
          </View>
        </View>

        {(submitError || preview.isError) && (
          <View className="flex-row gap-2.5 rounded-2xl border border-red-200 bg-sale-soft p-3.5">
            <AlertCircle size={18} color={colors.sale} />
            <View className="flex-1">
              <AppText weight="bold" className="text-sm text-red-900">
                {submitError ? 'Không thể đặt hàng' : 'Chưa tính được đơn hàng'}
              </AppText>
              <AppText className="text-xs leading-relaxed text-red-800">
                {submitError ?? getErrorMessage(preview.error, 'Vui lòng kiểm tra lại địa chỉ hoặc số lượng trong giỏ.')}
              </AppText>
            </View>
          </View>
        )}

        <View className="flex-row items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3">
          <ShieldCheck size={16} color={colors.leaf700} />
          <AppText className="flex-1 text-xs text-ink-muted">
            Cam kết hoàn tiền 100% nếu nông sản dập nát, hư hỏng khi nhận.
          </AppText>
        </View>
      </ScrollView>

      {/* Thanh đặt hàng */}
      <View className="flex-row items-center gap-3 border-t border-line bg-white px-4 pt-3">
        <View className="min-w-0 flex-1">
          <AppText className="text-xs text-ink-muted">Tổng thanh toán</AppText>
          <View className="flex-row items-center gap-2">
            <AppText weight="extrabold" className="text-xl text-leaf-700">
              {money(total)}
            </AppText>
            {preview.isFetching && <ActivityIndicator size="small" color={colors.leaf700} />}
          </View>
        </View>
        <Button
          title={submitLabel}
          icon={method === 'PAYOS' ? QrCode : undefined}
          loading={placing}
          disabled={preview.isFetching || (preview.isError && !!delivery)}
          onPress={() => void placeOrder()}
        />
      </View>

      {placing && (
        <CapNongLoading
          fullScreen
          message={payos.isPending ? 'Đang mở cổng PayOS' : 'Đang tạo đơn hàng'}
          subMessage="Vui lòng không tắt ứng dụng"
        />
      )}

      <AddressSheet
        visible={addressOpen}
        addresses={addresses}
        selectedId={delivery?.addressId ?? null}
        defaults={{ recipientName: user?.fullName || user?.name || '', phone: user?.phoneNumber || user?.phone || '' }}
        startInForm={addresses.length === 0}
        onSelect={(a) => setDelivery(fromSaved(a))}
        onClose={() => setAddressOpen(false)}
      />
      <VoucherSheet
        visible={voucherOpen}
        rows={voucherRows}
        selectedCodes={codes}
        savingCode={collect.isPending ? normalizeCode(collect.variables) : null}
        applyingCode={collect.isPending}
        error={voucherError}
        onToggle={(v) => toggleVoucher(v)}
        onSave={saveVoucher}
        onApplyCode={(c) => void applyCode(c)}
        onClose={() => setVoucherOpen(false)}
      />
    </SafeAreaView>
  )
}

const fromSaved = (a: SavedAddress): Delivery => ({
  addressId: a.id,
  recipientName: a.recipientName,
  recipientPhone: a.phone,
  shippingAddress: a.address,
})

function Line({ label, value, tone }: { label: string; value: string; tone?: 'leaf' }) {
  return (
    <View className="flex-row justify-between">
      <AppText className={cn('text-sm', tone ? 'text-leaf-700' : 'text-ink-muted')}>{label}</AppText>
      <AppText weight="semibold" className={cn('text-sm', tone ? 'text-leaf-700' : 'text-ink')}>
        {value}
      </AppText>
    </View>
  )
}
