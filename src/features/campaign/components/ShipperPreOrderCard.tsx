import { Camera, CheckCircle2, Clock, MapPin, Navigation, Phone, XCircle } from 'lucide-react-native'
import { useState, type ReactNode } from 'react'
import { ActivityIndicator, Linking, Pressable, View } from 'react-native'
import { AppText, Button } from '@/components/ui'
import { ImageSourceSheet, uploadImageUrl, usePickProductImage, type ImageSource } from '@/features/shop'
import type { PreOrderResponse, PriorityLevel } from '@/services'
import { useUiStore } from '@/stores'
import { colors } from '@/theme/colors'
import { getErrorMessage } from '@/utils/errors'
import { cn } from '@/utils/helpers'
import { directionsUrl, fmtDateTime, formatVnd } from '../utils/campaignFormat'
import { Notice, Pill } from './CampaignBits'

const PRIORITY: Record<PriorityLevel, { label: string; tone: 'rose' | 'amber' | 'leaf' }> = {
  URGENT: { label: 'Gấp', tone: 'rose' },
  HIGH: { label: 'Ưu tiên', tone: 'amber' },
  NORMAL: { label: 'Thường', tone: 'leaf' },
}

export const FAIL_REASONS = ['Không liên lạc được người nhận', 'Người nhận hẹn giao lại', 'Sai địa chỉ', 'Người nhận từ chối nhận hàng']

/** Phí dịch vụ shipper (khớp capnong.wallet.shipper-fee-rate) */
const SHIPPER_FEE_RATE = 0.03
const shipperEarn = (o: PreOrderResponse) => Math.round(Number(o.shippingBaseFee ?? o.shippingFee ?? 0) * (1 - SHIPPER_FEE_RATE))

/** Thẻ đơn chiến dịch cho tài xế (OrderCard trong ShipperCampaignOrders bản web) */
export function ShipperPreOrderCard({ o, action }: { o: PreOrderResponse; action: ReactNode }) {
  const p = PRIORITY[(o.priorityLevel ?? 'NORMAL') as PriorityLevel]
  const dir = directionsUrl(o.shippingLatitude, o.shippingLongitude, o.shippingAddress)
  return (
    <View className={cn('gap-3 rounded-panel border bg-white p-4', o.priorityLevel === 'URGENT' ? 'border-rose-200' : 'border-line')}>
      <View className="flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1 gap-1">
          <View className="flex-row flex-wrap items-center gap-2">
            <Pill tone={p.tone} text={p.label} />
            <AppText weight="bold" className="text-xs text-ink-subtle">
              {o.code}
              {o.deliveryZone ? ` · ${o.deliveryZone}` : ''}
            </AppText>
          </View>
          <AppText weight="extrabold" className="text-lg">
            {o.recipientName}
          </AppText>
          <View className="flex-row gap-1">
            <MapPin size={14} color={colors.inkSubtle} />
            <AppText className="flex-1 text-sm text-ink-muted">{o.shippingAddress}</AppText>
          </View>
        </View>
        <View className="items-end">
          <AppText weight="bold" className="text-[11px] uppercase text-ink-subtle">
            Thu khi giao
          </AppText>
          <AppText weight="extrabold" className="text-xl text-leaf-700">
            {formatVnd(o.remainingAmount)}
          </AppText>
          {shipperEarn(o) > 0 && (
            <AppText weight="bold" className="text-xs text-leaf-600">
              Cước {formatVnd(shipperEarn(o))}
            </AppText>
          )}
        </View>
      </View>
      {o.status === 'READY' && Number(o.remainingAmount ?? 0) > 0 && (
        <Notice>
          Nhận đơn cần ký quỹ {formatVnd(o.remainingAmount)} trong ví (bằng số tiền sẽ thu). Giao xong ví trừ đúng số tiền mặt bạn cầm và cộng cước; giao
          thất bại thì trả lại ký quỹ.
        </Notice>
      )}
      {Number(o.codReservedAmount ?? 0) > 0 && (
        <AppText weight="semibold" className="text-xs text-sky-700">
          Đang ký quỹ {formatVnd(o.codReservedAmount)} trong ví cho đơn này
        </AppText>
      )}
      <View className="gap-1 rounded-2xl bg-paper px-3 py-2">
        <AppText weight="semibold" className="text-xs">
          {o.crateQuantity} thùng × {o.crateKg} kg
        </AppText>
        <View className="flex-row items-center gap-1">
          <Clock size={12} color={colors.inkSubtle} />
          <AppText className="text-xs text-ink-muted">
            Giao trước{' '}
            <AppText weight="bold" className={cn('text-xs', o.priorityLevel === 'URGENT' && 'text-sale')}>
              {fmtDateTime(o.deliverBy)}
            </AppText>
          </AppText>
        </View>
        {!!o.priorityReason && <AppText className="text-xs text-ink-muted">{o.priorityReason}</AppText>}
        {!!o.sourceShopName && (
          <AppText className="text-xs text-ink-muted">
            Lô: {o.sourceShopName} · {o.sourceProductName}
          </AppText>
        )}
      </View>
      <View className="flex-row flex-wrap gap-2">
        {!!o.recipientPhone && <SmallLink icon={Phone} label="Gọi" url={`tel:${o.recipientPhone}`} />}
        {dir && <SmallLink icon={Navigation} label="Chỉ đường" url={dir} />}
      </View>
      {action}
    </View>
  )
}

function SmallLink({ icon: Icon, label, url }: { icon: typeof Phone; label: string; url: string }) {
  return (
    <Pressable onPress={() => void Linking.openURL(url)} className="flex-row items-center gap-1 rounded-xl border border-line px-3 py-2 active:bg-paper">
      <Icon size={13} color={colors.ink} />
      <AppText weight="bold" className="text-xs">
        {label}
      </AppText>
    </Pressable>
  )
}

/** Đang giao: chụp ảnh giao hàng rồi bấm Giao xong, hoặc báo thất bại */
export function DeliveringActions({
  o,
  onDeliver,
  onFail,
  busy,
}: {
  o: PreOrderResponse
  onDeliver: (pod: string) => void
  onFail: (reason: string) => void
  busy: boolean
}) {
  const pick = usePickProductImage()
  const showToast = useUiStore((s) => s.showToast)
  const [photo, setPhoto] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [sourceOpen, setSourceOpen] = useState(false)
  const [failing, setFailing] = useState(false)
  const [reason, setReason] = useState(FAIL_REASONS[0])

  const onPick = async (source: ImageSource) => {
    setSourceOpen(false)
    const file = await pick(source, [3, 4])
    if (!file) return
    setUploading(true)
    try {
      setPhoto(await uploadImageUrl(file, 'pod'))
    } catch (e) {
      showToast(getErrorMessage(e, 'Không tải được ảnh giao hàng.'))
    } finally {
      setUploading(false)
    }
  }

  if (failing) {
    return (
      <View className="gap-2">
        {FAIL_REASONS.map((r) => (
          <Pressable key={r} onPress={() => setReason(r)} className={cn('rounded-xl border px-3 py-2', reason === r ? 'border-sale bg-rose-50' : 'border-line')}>
            <AppText className={cn('text-xs', reason === r ? 'text-rose-700' : 'text-ink')}>{r}</AppText>
          </Pressable>
        ))}
        <View className="flex-row gap-2">
          <Button title="Xác nhận thất bại" variant="danger" loading={busy} onPress={() => onFail(reason)} />
          <Button title="Huỷ" variant="ghost" onPress={() => setFailing(false)} />
        </View>
      </View>
    )
  }

  return (
    <View className="gap-2">
      <View className="flex-row flex-wrap gap-2">
        <Pressable onPress={() => setSourceOpen(true)} className="flex-row items-center gap-1 rounded-xl border border-line px-3 py-2">
          {uploading ? <ActivityIndicator size="small" color={colors.leaf700} /> : <Camera size={13} color={colors.ink} />}
          <AppText weight="bold" className="text-xs">
            {photo ? 'Đã chụp ảnh' : 'Ảnh giao hàng'}
          </AppText>
        </Pressable>
        <Pressable onPress={() => setFailing(true)} className="flex-row items-center gap-1 rounded-xl border border-rose-200 px-3 py-2">
          <XCircle size={13} color={colors.sale} />
          <AppText weight="bold" className="text-xs text-rose-700">
            Thất bại
          </AppText>
        </Pressable>
      </View>
      {!photo && <AppText className="text-[11px] text-amber-700">Chụp ảnh giao hàng trước khi bấm Giao xong.</AppText>}
      <Button
        title={`Giao xong · đã thu ${formatVnd(o.remainingAmount)}`}
        icon={CheckCircle2}
        disabled={!photo || uploading}
        loading={busy}
        onPress={() => photo && onDeliver(photo)}
      />
      <ImageSourceSheet
        visible={sourceOpen}
        title="Ảnh giao hàng"
        subtitle="Chụp thùng hàng tại nơi giao"
        onClose={() => setSourceOpen(false)}
        onPick={(s) => void onPick(s)}
      />
    </View>
  )
}
