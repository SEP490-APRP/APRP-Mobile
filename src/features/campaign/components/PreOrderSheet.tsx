import { useMutation, useQuery } from '@tanstack/react-query'
import { router } from 'expo-router'
import { CalendarClock, ChevronRight, MapPin, PackageCheck, ShieldCheck, Truck, Wallet } from 'lucide-react-native'
import { useEffect, useMemo, useState } from 'react'
import { Pressable, View } from 'react-native'
import { AppText, BottomSheet, Button, TextField } from '@/components/ui'
import { useSavedAddresses } from '@/features/address'
import { AddressSheet } from '@/features/checkout'
import { useMyWallet } from '@/features/wallet'
import { campaignService, type CampaignResponse, type FulfillmentMethod } from '@/services'
import { useAuth, useUiStore } from '@/stores'
import { colors } from '@/theme/colors'
import type { SavedAddress } from '@/types/address.types'
import { getErrorMessage } from '@/utils/errors'
import { cn } from '@/utils/helpers'
import { campaignKeys } from '../hooks/useCampaignQueries'
import { useDepositCheckout } from '../hooks/useDepositCheckout'
import {
  fmtDate,
  formatKg,
  formatVnd,
  remainingKgOf,
  splitCrates,
  timeLeftLabel,
  wardOf,
} from '../utils/campaignFormat'
import { CheckRow, Notice, Row, SiteLocation } from './CampaignBits'

/**
 * Đặt trước thùng (PreOrderBox + ConfirmPreOrder bản web): chọn thùng, cách nhận, địa chỉ, xem phí giao,
 * rồi sang bước xác nhận để cọc bằng ví / PayOS.
 */
export function PreOrderSheet({ c, visible, onClose }: { c: CampaignResponse; visible: boolean; onClose: () => void }) {
  const { user } = useAuth()
  const showToast = useUiStore((s) => s.showToast)
  const addressesQuery = useSavedAddresses()
  const addresses = useMemo(() => addressesQuery.data ?? [], [addressesQuery.data])
  const wallet = useMyWallet(user?.role === 'buyer')
  const payDeposit = useDepositCheckout()

  const [step, setStep] = useState<'form' | 'confirm'>('form')
  // Người mua chỉ nhập số kg, hệ thống tự chia thùng
  const [kgText, setKgText] = useState('5')
  const pickupAllowed = c.pickupEnabled !== false
  const [method, setMethod] = useState<FulfillmentMethod>('DELIVERY')
  const [name, setName] = useState(user?.fullName || user?.name || '')
  const [phone, setPhone] = useState(user?.phoneNumber || user?.phone || '')
  const [address, setAddress] = useState<SavedAddress | null>(null)
  const [addressOpen, setAddressOpen] = useState(false)
  const [note, setNote] = useState('')
  const [useWallet, setUseWallet] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Lấy địa chỉ mặc định trong sổ địa chỉ
  useEffect(() => {
    if (address || !addresses.length) return
    const preferred = addresses.find((a) => a.isDefault) ?? addresses[0]
    setAddress(preferred)
    if (!name) setName(preferred.recipientName)
    if (!phone) setPhone(preferred.phone)
  }, [addresses, address, name, phone])

  useEffect(() => {
    if (visible) {
      setStep('form')
      setAgreed(false)
      setFormError(null)
    }
  }, [visible])

  const typedKg = Number(kgText || 0)
  const split = splitCrates(typedKg)
  const totalKg = split ? typedKg : 0
  const crate = split?.crateKg ?? 0
  const qty = split?.quantity ?? 0
  const stepKg = (d: number) => setKgText(String(Math.max(5, (Math.floor(typedKg / 5) + d) * 5)))
  const goods = totalKg * Number(c.rescuePricePerKg ?? 0)
  const remainingKg = remainingKgOf(c)
  const overLimit = totalKg > remainingKg
  const pct = Number(c.depositPercent ?? 0)

  // Báo giá phí giao từ BE (khoảng cách thật tới điểm tập kết + tổng kg)
  const quoteReady = method === 'PICKUP' || !!address
  const quote = useQuery({
    queryKey: campaignKeys.shipQuote(c.campaignId, totalKg, method, address?.id),
    queryFn: () =>
      campaignService.quoteShipping(c.campaignId, {
        totalKg,
        method,
        lat: method === 'DELIVERY' ? address?.latitude : undefined,
        lng: method === 'DELIVERY' ? address?.longitude : undefined,
        address: method === 'DELIVERY' ? address?.address : undefined,
      }),
    enabled: visible && quoteReady && totalKg > 0,
    staleTime: 60_000,
  })
  const shipFee = method === 'PICKUP' ? 0 : (quote.data?.shippingFee ?? null)
  const feeKnown = shipFee != null
  const grandTotal = goods + (shipFee ?? 0)
  const deposit = Math.round(grandTotal * pct)
  const payOnReceive = grandTotal - deposit

  const walletBalance = Math.max(0, Math.floor(Number(wallet.data?.balance ?? 0) - Number(wallet.data?.frozenBalance ?? 0)))
  const walletUse = useWallet ? Math.min(walletBalance, deposit) : 0
  const payosDue = Math.max(0, deposit - walletUse)

  const order = useMutation({
    mutationFn: () =>
      campaignService.createPreOrder(c.campaignId, {
        totalKg,
        recipientName: name.trim(),
        recipientPhone: phone.trim(),
        shippingAddress: method === 'PICKUP' ? '' : (address?.address ?? ''),
        shippingLatitude: method === 'PICKUP' ? undefined : address?.latitude,
        shippingLongitude: method === 'PICKUP' ? undefined : address?.longitude,
        note: note.trim() || undefined,
        useWallet: useWallet && walletBalance > 0,
        fulfillmentMethod: method,
        deliveryWard: method === 'PICKUP' ? undefined : address ? wardOf(address.address) : undefined,
      }),
  })

  const next = () => {
    if (!split) return setFormError('Nhập số kg là bội số của 5 (5, 10, 15…).')
    if (!name.trim() || !phone.trim()) return setFormError('Nhập tên và số điện thoại người nhận.')
    if (method === 'DELIVERY' && !address) return setFormError('Chọn địa chỉ giao hàng.')
    if (overLimit) return setFormError(`Chiến dịch chỉ còn ${formatKg(remainingKg)}, bạn giảm số kg nhé.`)
    if (!feeKnown) return setFormError('Đang tính phí giao, chờ một chút nhé.')
    setFormError(null)
    setStep('confirm')
  }

  const pay = async () => {
    try {
      const created = await order.mutateAsync()
      const checked = await payDeposit(created)
      onClose()
      if (checked && checked.status !== 'PENDING') showToast('Đã cọc thành công. Theo dõi đơn trong mục Đơn đặt trước.')
      else showToast('Chưa nhận được tiền cọc. Bạn có thể thanh toán lại trong mục Đơn đặt trước.')
      router.push('/buyer/pre-orders' as never)
    } catch (err) {
      showToast(getErrorMessage(err, 'Chưa tạo được đơn đặt trước, bạn thử lại nhé.'))
    }
  }

  const recipientAddress =
    method === 'PICKUP'
      ? `${c.collectionSiteName || 'Điểm tập kết'}${c.collectionSiteAddress ? ` · ${c.collectionSiteAddress}` : ''}`
      : (address?.address ?? '')

  if (step === 'confirm') {
    return (
      <BottomSheet
        visible={visible}
        title="Xác nhận đặt trước"
        subtitle={`${qty} thùng × ${crate} kg · ${formatKg(totalKg)}`}
        onClose={() => !order.isPending && onClose()}
        footer={
          <View className="flex-1 flex-row gap-2">
            <Button title="Sửa" variant="outline" disabled={order.isPending} onPress={() => setStep('form')} />
            <Button
              className="flex-1"
              icon={Wallet}
              loading={order.isPending}
              disabled={!agreed}
              title={payosDue <= 0 ? `Cọc ${formatVnd(deposit)} bằng ví` : walletUse > 0 ? `Trừ ví & chuyển ${formatVnd(payosDue)}` : `Cọc ${formatVnd(deposit)} qua PayOS`}
              onPress={() => void pay()}
            />
          </View>
        }
      >
        <View className="gap-4">
          <View className="gap-1 rounded-2xl border border-line p-3.5">
            <AppText weight="extrabold" className="text-[11px] uppercase text-ink-subtle">
              {method === 'PICKUP' ? 'Tự đến lấy tại' : 'Giao tới'}
            </AppText>
            <AppText weight="bold" className="text-sm">
              {name} · {phone}
            </AppText>
            <AppText className="text-sm text-ink-muted">{recipientAddress}</AppText>
            {!!note && <AppText className="text-xs italic text-ink-subtle">Ghi chú: {note}</AppText>}
          </View>

          <View className="gap-1 rounded-2xl border border-line p-3.5">
            <Row label={`Tiền hàng · ${formatVnd(c.rescuePricePerKg)}/kg`} value={formatVnd(goods)} />
            <Row
              label={method === 'PICKUP' ? 'Phí giao (tự đến lấy)' : quote.data?.distanceKm != null ? `Phí giao (${quote.data.distanceKm} km)` : 'Phí giao'}
              value={shipFee === 0 ? (method === 'PICKUP' ? '0đ' : 'Miễn phí') : formatVnd(shipFee)}
            />
            <Row label="Tổng đơn" value={formatVnd(grandTotal)} />
            <View className="my-1 border-t border-dashed border-line" />
            <Row label={`Cọc ngay (${Math.round(pct * 100)}% tổng đơn)`} value={formatVnd(deposit)} strong />
            {walletUse > 0 && <Row label="· Trừ ví CapNong" value={`-${formatVnd(walletUse)}`} />}
            {walletUse > 0 && <Row label="· Chuyển khoản PayOS" value={formatVnd(payosDue)} />}
            <Row label="Trả khi nhận hàng" value={formatVnd(payOnReceive)} />
          </View>

          <CheckRow checked={useWallet} onChange={setUseWallet} disabled={walletBalance <= 0 || order.isPending}>
            <AppText weight="bold" className="text-xs">
              Dùng ví CapNong ·{' '}
            </AppText>
            số dư {formatVnd(walletBalance)}
            {useWallet && walletUse > 0 ? (payosDue > 0 ? `, trừ ${formatVnd(walletUse)}, chuyển khoản thêm ${formatVnd(payosDue)}` : ', ví trả đủ tiền cọc') : ''}
          </CheckRow>

          <View className="gap-3 rounded-2xl border border-line p-3.5">
            <AppText weight="extrabold" className="text-[11px] uppercase text-ink-subtle">
              Sau khi bạn cọc
            </AppText>
            <Timeline icon={Wallet} title={`Hôm nay: cọc ${formatVnd(deposit)}`} text="CapNong giữ khoản cọc, chưa chuyển cho nhà vườn." />
            <Timeline
              icon={CalendarClock}
              title={`Chốt đơn ${fmtDate(c.cutoffAt)}`}
              text={`Đủ ${formatKg(c.minThresholdKg)} thì nhà vườn thu hoạch. Không đủ thì chiến dịch tự huỷ và hoàn cọc vào ví CapNong của bạn.`}
            />
            {method === 'PICKUP' ? (
              <Timeline
                icon={PackageCheck}
                title="Đóng gói xong: CapNong báo bạn tới lấy"
                text={`Tới lấy và trả ${formatVnd(payOnReceive)} còn lại. Không tới lấy sau khi đã được nhắc thì đơn bị huỷ và mất cọc.`}
              />
            ) : (
              <Timeline
                icon={Truck}
                title={c.deliveryDate ? `Giao dự kiến từ ${fmtDate(c.deliveryDate)}` : 'Giao sau khi gom hàng'}
                text={`Shipper giao tận nơi, bạn trả ${formatVnd(payOnReceive)} còn lại khi nhận. Vắng nhà hoặc từ chối nhận thì mất cọc.`}
              />
            )}
          </View>

          <CheckRow checked={agreed} onChange={setAgreed}>
            Tôi hiểu đơn đặt trước không tự huỷ được sau khi đã cọc. Tiền cọc được hoàn khi chiến dịch không đủ ngưỡng hoặc thiếu hàng, và không
            được hoàn nếu tôi không nhận hàng.
          </CheckRow>
          {payosDue > 0 && (
            <View className="flex-row items-center gap-2 rounded-2xl bg-leaf-50 p-3">
              <ShieldCheck size={16} color={colors.leaf700} />
              <AppText className="flex-1 text-xs text-ink">PayOS · chuyển khoản / quét QR ngân hàng {formatVnd(payosDue)}</AppText>
            </View>
          )}
        </View>
      </BottomSheet>
    )
  }

  return (
    <>
      <BottomSheet
        visible={visible && !addressOpen}
        title="Góp một thùng cho chiến dịch"
        subtitle={`Còn ${formatKg(remainingKg)} · ${timeLeftLabel(c.cutoffAt).toLowerCase()} trước khi chốt`}
        onClose={onClose}
        footer={<Button className="flex-1" title="Tiếp tục xác nhận" icon={ChevronRight} disabled={overLimit || !split} onPress={next} />}
      >
        <View className="gap-4">
          <View className="gap-2">
            <TextField label="Bạn muốn mua bao nhiêu kg?" value={kgText} onChangeText={(v) => setKgText(v.replace(/\D/g, '').slice(0, 5))} keyboardType="number-pad" />
            <View className="flex-row flex-wrap gap-2">
              <Pressable onPress={() => stepKg(-1)} disabled={typedKg <= 5} accessibilityLabel="Bớt 5 kg" className={cn('rounded-full border border-line px-3.5 py-2', typedKg <= 5 && 'opacity-40')}>
                <AppText weight="extrabold" className="text-sm text-leaf-700">−5</AppText>
              </Pressable>
              <Pressable onPress={() => stepKg(1)} accessibilityLabel="Thêm 5 kg" className="rounded-full border border-line px-3.5 py-2">
                <AppText weight="extrabold" className="text-sm text-leaf-700">+5</AppText>
              </Pressable>
              {[10, 20, 30, 50].map((k) => (
                <Pressable
                  key={k}
                  onPress={() => setKgText(String(k))}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: typedKg === k }}
                  className={cn('rounded-full border px-3.5 py-2', typedKg === k ? 'border-leaf-700 bg-leaf-50' : 'border-line')}
                >
                  <AppText weight="bold" className="text-sm">{k} kg</AppText>
                </Pressable>
              ))}
            </View>
            {split ? (
              <AppText className="text-xs text-ink-muted">
                Hệ thống chia thành {qty} thùng × {crate} kg
              </AppText>
            ) : (
              <AppText weight="bold" className="text-xs text-rose-700">
                Nhập số kg là bội số của 5 (5, 10, 15…).
              </AppText>
            )}
          </View>

          <TextField label="Người nhận" value={name} onChangeText={setName} autoComplete="name" />
          <TextField label="Số điện thoại" value={phone} onChangeText={setPhone} keyboardType="phone-pad" autoComplete="tel" />

          <View className="gap-2">
            <AppText weight="semibold" className="text-sm">
              Cách nhận hàng
            </AppText>
            <MethodOption
              active={method === 'DELIVERY'}
              icon={Truck}
              title="Giao tận nơi"
              hint="Phí theo khoảng cách, giảm khi mua nhiều kg"
              onPress={() => setMethod('DELIVERY')}
            />
            <MethodOption
              active={method === 'PICKUP'}
              icon={MapPin}
              title="Tự đến điểm tập kết · 0đ"
              hint={pickupAllowed ? 'Nhận thông báo khi đơn đóng gói xong' : 'Chiến dịch này không nhận tự đến lấy'}
              disabled={!pickupAllowed}
              onPress={() => setMethod('PICKUP')}
            />
          </View>

          {method === 'PICKUP' ? (
            <SiteLocation
              label="Bạn sẽ tới lấy tại"
              name={c.collectionSiteName}
              address={c.collectionSiteAddress}
              lat={c.collectionSiteLatitude}
              lng={c.collectionSiteLongitude}
            />
          ) : (
            <Pressable
              onPress={() => setAddressOpen(true)}
              className="flex-row items-center gap-3 rounded-2xl border border-line p-3.5 active:bg-paper"
            >
              <MapPin size={18} color={colors.leaf700} />
              <View className="flex-1">
                <AppText weight="bold" className="text-sm">
                  {address ? 'Giao tới' : 'Chọn địa chỉ giao hàng'}
                </AppText>
                {address && <AppText className="text-xs text-ink-muted">{address.address}</AppText>}
              </View>
              <ChevronRight size={16} color={colors.inkSubtle} />
            </Pressable>
          )}

          <TextField label="Ghi chú (không bắt buộc)" value={note} onChangeText={setNote} />

          <View className="overflow-hidden rounded-2xl border border-line">
            <View className="gap-1 p-3.5">
              <Row label={`Tiền hàng · ${qty} × ${crate} kg`} value={formatVnd(goods)} />
              <Row
                label={method === 'PICKUP' ? 'Phí giao (tự đến lấy)' : 'Phí giao'}
                value={
                  method === 'PICKUP'
                    ? '0đ'
                    : !quoteReady
                      ? 'Chọn địa chỉ'
                      : quote.isFetching && shipFee == null
                        ? 'Đang tính…'
                        : shipFee === 0
                          ? 'Miễn phí'
                          : shipFee != null
                            ? formatVnd(shipFee)
                            : '—'
                }
              />
              <Row label="Tổng đơn" value={feeKnown ? formatVnd(grandTotal) : '—'} />
            </View>
            <View className="flex-row border-t border-line">
              <View className="flex-1 bg-amber-50 p-3">
                <AppText weight="bold" className="text-xs text-amber-800">
                  Cọc ngay hôm nay
                </AppText>
                <AppText weight="extrabold" className="text-lg text-amber-700">
                  {feeKnown ? formatVnd(deposit) : '—'}
                </AppText>
              </View>
              <View className="flex-1 border-l border-line bg-leaf-50 p-3">
                <AppText weight="bold" className="text-xs text-leaf-700">
                  Trả khi nhận hàng
                </AppText>
                <AppText weight="extrabold" className="text-lg text-leaf-700">
                  {feeKnown ? formatVnd(payOnReceive) : '—'}
                </AppText>
              </View>
            </View>
          </View>
          {method === 'DELIVERY' && quote.data?.nextTierKg != null && quote.data.nextTierKg > 0 && (
            <Notice>
              Mua thêm {formatKg(quote.data.nextTierKg)} để được {quote.data.nextTierLabel}.
            </Notice>
          )}
          {quote.isError && method === 'DELIVERY' && <Notice tone="rose">{getErrorMessage(quote.error, 'Chưa tính được phí giao cho địa chỉ này.')}</Notice>}
          {overLimit && <Notice tone="rose">Chiến dịch chỉ còn {formatKg(remainingKg)}, bạn giảm số kg nhé.</Notice>}
          {formError && <Notice tone="rose">{formError}</Notice>}
        </View>
      </BottomSheet>
      <AddressSheet
        visible={visible && addressOpen}
        addresses={addresses}
        selectedId={address?.id ?? null}
        defaults={{ recipientName: name, phone }}
        startInForm={addresses.length === 0}
        onSelect={(a) => {
          setAddress(a)
          if (!name.trim()) setName(a.recipientName)
          if (!phone.trim()) setPhone(a.phone)
        }}
        onClose={() => setAddressOpen(false)}
      />
    </>
  )
}

function MethodOption({
  active,
  icon: Icon,
  title,
  hint,
  disabled,
  onPress,
}: {
  active: boolean
  icon: typeof Truck
  title: string
  hint: string
  disabled?: boolean
  onPress: () => void
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="radio"
      accessibilityState={{ checked: active, disabled }}
      className={cn('flex-row items-start gap-2.5 rounded-2xl border p-3', active ? 'border-leaf-700 bg-leaf-50' : 'border-line', disabled && 'opacity-50')}
    >
      <Icon size={18} color={colors.leaf700} />
      <View className="flex-1">
        <AppText weight="extrabold" className="text-sm">
          {title}
        </AppText>
        <AppText className="text-xs text-ink-subtle">{hint}</AppText>
      </View>
    </Pressable>
  )
}

function Timeline({ icon: Icon, title, text }: { icon: typeof Truck; title: string; text: string }) {
  return (
    <View className="flex-row gap-3">
      <View className="h-7 w-7 items-center justify-center rounded-full bg-leaf-50">
        <Icon size={14} color={colors.leaf700} />
      </View>
      <View className="flex-1">
        <AppText weight="bold" className="text-sm">
          {title}
        </AppText>
        <AppText className="text-xs text-ink-muted">{text}</AppText>
      </View>
    </View>
  )
}
