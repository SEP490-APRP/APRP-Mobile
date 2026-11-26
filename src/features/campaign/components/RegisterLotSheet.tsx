import { CalendarClock, Camera, Clock, HandCoins, ShieldCheck } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { Pressable, View } from 'react-native'
import { AppText, BottomSheet, Button, TextField } from '@/components/ui'
import type { CampaignResponse, ShelfLifeTier } from '@/services'
import { useUiStore } from '@/stores'
import { getErrorMessage } from '@/utils/errors'
import { cn } from '@/utils/helpers'
import { useRegisterFarm } from '../hooks/useCampaignQueries'
import { addDays, FARMER_KEEP_RATE, fmtDate, formatKg, formatVnd, localIsoDate, SHELF_LIFE, shelfLabel } from '../utils/campaignFormat'
import { CheckRow, DateField, Notice, NumberField, PhotoPicker, SectionTitle, SiteLocation } from './CampaignBits'

const SHELF_MAX_DAYS: Record<ShelfLifeTier, number> = { DAYS_2_3: 3, DAYS_3_4: 4, DAYS_5_6: 6 }

/** Đăng ký góp lô hàng vào chiến dịch (RegisterDialog bản web): kg, ngày thu hoạch, ảnh, bảo quản, giá, cam kết */
export function RegisterLotSheet({ c, visible, onClose, onDone }: { c: CampaignResponse; visible: boolean; onClose: () => void; onDone: () => void }) {
  const showToast = useUiStore((s) => s.showToast)
  const submit = useRegisterFarm(c.campaignId)

  const [kg, setKg] = useState('')
  const [harvestDate, setHarvestDate] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [shelf, setShelf] = useState<ShelfLifeTier | null>(null)
  const [committed, setCommitted] = useState(false)
  const [note, setNote] = useState('')
  const [touched, setTouched] = useState(false)

  useEffect(() => {
    if (!visible) return
    setTouched(false)
    submit.reset()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible])

  const kgNum = Number(kg)
  // Giá thu mua cố định theo bài chiến dịch của CapNong
  const price = Number(c.rescuePricePerKg ?? 0)
  const estimate = kgNum > 0 ? kgNum * price * FARMER_KEEP_RATE : 0
  const today = localIsoDate(new Date())
  const topUp = !!c.topUpOpen
  const topUpMax = Number(c.topUpRemainingKg ?? 0)
  const tomorrow = addDays(today, 1)
  const baseDelivery = c.deliveryDate ? c.deliveryDate.slice(0, 10) : null
  const deliveryDate = topUp && (!baseDelivery || baseDelivery < tomorrow) ? tomorrow : baseDelivery
  const cutoffDate = localIsoDate(new Date(c.cutoffAt))
  const startDate = c.startDate ? c.startDate.slice(0, 10) : null
  const endDate = c.endDate ? c.endDate.slice(0, 10) : null
  const harvestMax = topUp ? addDays(today, 2) : startDate ? addDays(startDate, -1) : cutoffDate
  const baseAnchor = endDate ?? cutoffDate
  const anchor = harvestDate && harvestDate > baseAnchor ? harvestDate : baseAnchor
  const freshUntil = (t: ShelfLifeTier) => addDays(anchor, SHELF_MAX_DAYS[t])

  const errors = {
    kg: !(kgNum > 0) ? 'Nhập số kg lớn hơn 0' : topUp && kgNum > topUpMax ? `Chiến dịch chỉ còn cần bổ sung ${formatKg(topUpMax)}` : null,
    harvest: !harvestDate
      ? 'Chọn ngày thu hoạch'
      : harvestDate > harvestMax
        ? topUp
          ? `Lô bổ sung thu hoạch chậm nhất ${fmtDate(harvestMax)}`
          : startDate
            ? `Ngày thu hoạch phải trước ngày bắt đầu mở điểm tập kết ${fmtDate(startDate)}`
            : `Ngày thu hoạch không được sau ngày chốt ${fmtDate(harvestMax)}`
        : null,
    images: images.length === 0 ? 'Thêm ít nhất 1 ảnh lô hàng' : null,
    shelf: !shelf
      ? 'Chọn thời gian bảo quản'
      : deliveryDate && deliveryDate > freshUntil(shelf)
        ? `${shelfLabel(shelf)} chỉ giữ tươi tới ${fmtDate(freshUntil(shelf))}, nhưng ngày giao là ${fmtDate(deliveryDate)}. Chọn độ bền dài hơn.`
        : null,
    commit: !committed ? 'Bạn cần tick cam kết' : null,
  }
  const valid = Object.values(errors).every((e) => !e)
  const err = (k: keyof typeof errors) => (touched ? errors[k] : null)

  const send = async () => {
    setTouched(true)
    if (!valid) return
    try {
      await submit.mutateAsync({
        surplusVolumeKg: kgNum,
        harvestDate,
        productImageUrls: images,
        shelfLifeTier: shelf as ShelfLifeTier,
        priceCommitted: committed,
        note: note.trim() || undefined,
      })
      showToast('Đã gửi đăng ký. CapNong sẽ duyệt lô hàng của bạn.')
      onDone()
    } catch (e) {
      showToast(getErrorMessage(e, 'Chưa gửi được đăng ký, bạn thử lại nhé.'))
    }
  }

  return (
    <BottomSheet
      visible={visible}
      title="Đăng ký góp hàng"
      subtitle={c.title}
      onClose={() => !submit.isPending && onClose()}
      footer={<Button className="flex-1" title="Gửi đăng ký" icon={ShieldCheck} loading={submit.isPending} onPress={() => void send()} />}
    >
      <View className="gap-5">
        <SiteLocation label="Mang hàng tới" name={c.collectionSiteName} address={c.collectionSiteAddress} lat={c.collectionSiteLatitude} lng={c.collectionSiteLongitude} />
        {topUp && (
          <Notice tone="rose">
            Các nhà vườn đã giao hết phần được chia nhưng vẫn thiếu {formatKg(topUpMax)}. Bạn có thể đăng ký lô bổ sung, tối đa {formatKg(topUpMax)}.
          </Notice>
        )}

        <View className="gap-3">
          <SectionTitle icon={CalendarClock} title="1. Số lượng & ngày thu hoạch" />
          <NumberField label="Số kg dư có thể góp" suffix="kg" value={kg} onChange={setKg} error={err('kg')} />
          <DateField
            label="Ngày thu hoạch dự kiến"
            value={harvestDate}
            onChange={setHarvestDate}
            max={harvestMax}
            error={err('harvest')}
            hint={`Chậm nhất ${fmtDate(harvestMax)}${topUp ? '' : startDate ? ` (trước ngày bắt đầu ${fmtDate(startDate)})` : ' (ngày chốt)'}`}
          />
          <View className="gap-1 rounded-2xl bg-leaf-50 p-3">
            <AppText className="text-xs text-ink-muted">Hạn góp hàng: {fmtDate(c.farmCutoffAt ?? c.cutoffAt)}</AppText>
            {(startDate || endDate) && (
              <AppText className="text-xs text-ink-muted">
                Mở điểm tập kết {startDate ? `từ ${fmtDate(startDate)} ` : ''}
                {endDate ? `đến ${fmtDate(endDate)}` : ''}
              </AppText>
            )}
            <AppText className="text-xs text-ink-muted">
              Mang hàng tới điểm tập kết {deliveryDate ? `chậm nhất trước ngày ${fmtDate(deliveryDate)}` : 'theo lịch CapNong hẹn'}
            </AppText>
          </View>
        </View>

        <View className="gap-3">
          <SectionTitle icon={Camera} title="2. Ảnh lô hàng" hint="1 – 5 ảnh chụp thật tại vườn giúp CapNong duyệt nhanh hơn." />
          <PhotoPicker urls={images} onChange={setImages} folder="campaigns" error={err('images')} />
        </View>

        <View className="gap-3">
          <SectionTitle icon={Clock} title="3. Độ bền sau ngày kết thúc mở điểm tập kết" hint={`Tính từ ${fmtDate(baseAnchor)}, hàng còn tươi thêm bao nhiêu ngày`} />
          {SHELF_LIFE.map((s) => (
            <Pressable
              key={s.id}
              onPress={() => setShelf(s.id)}
              accessibilityRole="radio"
              accessibilityState={{ checked: shelf === s.id }}
              className={cn('gap-1 rounded-2xl border p-3', shelf === s.id ? 'border-leaf-700 bg-leaf-50' : 'border-line')}
            >
              <View className={cn('self-start rounded-full px-2 py-0.5', s.tone.split(' ')[0])}>
                <AppText weight="extrabold" className={cn('text-xs', s.tone.split(' ')[1])}>
                  {s.label}
                </AppText>
              </View>
              <AppText weight="bold" className="text-sm">
                Tươi tới {fmtDate(addDays(anchor, s.max))}
              </AppText>
              {deliveryDate && deliveryDate > addDays(anchor, s.max) && (
                <AppText weight="bold" className="text-[11px] text-sale">
                  Không kịp ngày giao {fmtDate(deliveryDate)}
                </AppText>
              )}
              <AppText className="text-xs text-ink-muted">{s.hint}</AppText>
            </Pressable>
          ))}
          {err('shelf') && <AppText className="text-xs text-sale">{err('shelf')}</AppText>}
        </View>

        <View className="gap-3">
          <SectionTitle icon={HandCoins} title="4. Giá thu mua & cam kết" />
          <View className="gap-1 rounded-2xl border border-line p-3">
            <AppText className="text-xs text-ink-muted">Giá thu mua cố định theo bài chiến dịch</AppText>
            <AppText weight="extrabold" className="text-xl">
              {formatVnd(price)}/kg
            </AppText>
          </View>
          <View className="rounded-2xl bg-leaf-50 p-3">
            <AppText className="text-xs text-ink-muted">Tạm tính bạn nhận (sau phí 30%)</AppText>
            <AppText weight="extrabold" className="text-xl text-leaf-700">
              {formatVnd(estimate)}
            </AppText>
            <AppText className="text-[11px] text-ink-subtle">Tính theo số kg cân đạt chuẩn tại điểm gom × giá thu mua.</AppText>
          </View>
          <CheckRow checked={committed} onChange={setCommitted}>
            Tôi cam kết bán đúng giá thu mua của chiến dịch, giao đủ số kg đã khai và đúng chất lượng như ảnh, mang hàng tới
            điểm gom đúng hẹn. Hàng không đạt chuẩn khi cân kiểm sẽ không được tính tiền.
          </CheckRow>
          {err('commit') && <AppText className="text-xs text-sale">{err('commit')}</AppText>}
          <TextField label="Ghi chú cho CapNong (tuỳ chọn)" value={note} onChangeText={setNote} multiline placeholder="Vd: có thể tự chở hàng tới điểm gom" />
        </View>
      </View>
    </BottomSheet>
  )
}
