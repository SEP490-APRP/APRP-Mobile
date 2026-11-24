import { Image } from 'expo-image'
import { CalendarClock, Camera, Clock, HandCoins, Package, ShieldCheck } from 'lucide-react-native'
import { useEffect, useMemo, useState } from 'react'
import { Pressable, ScrollView, View } from 'react-native'
import { AppText, BottomSheet, Button, TextField } from '@/components/ui'
import { useMyShopProducts } from '@/features/shop'
import type { CampaignResponse, ShelfLifeTier } from '@/services'
import { useUiStore } from '@/stores'
import { getErrorMessage } from '@/utils/errors'
import { cn } from '@/utils/helpers'
import { useRegisterFarm } from '../hooks/useCampaignQueries'
import { addDays, FARMER_KEEP_RATE, fmtDate, formatKg, formatVnd, localIsoDate, SHELF_LIFE, shelfLabel } from '../utils/campaignFormat'
import { CheckRow, DateField, Notice, NumberField, PhotoPicker, SectionTitle, SiteLocation } from './CampaignBits'

const SHELF_MAX_DAYS: Record<ShelfLifeTier, number> = { DAYS_2_3: 3, DAYS_3_4: 4, DAYS_5_6: 6 }

type MyProduct = { productId?: number; id?: number; productName?: string; name?: string; imageUrl?: string; images?: { imageUrl?: string; isPrimary?: boolean }[] }

/** Đăng ký góp lô hàng vào chiến dịch (RegisterDialog bản web): sản phẩm, kg, ngày thu hoạch, ảnh, bảo quản, giá, cam kết */
export function RegisterLotSheet({ c, visible, onClose, onDone }: { c: CampaignResponse; visible: boolean; onClose: () => void; onDone: () => void }) {
  const showToast = useUiStore((s) => s.showToast)
  const myProducts = useMyShopProducts()
  const products = useMemo(
    () =>
      ((myProducts.data ?? []) as MyProduct[]).map((p) => ({
        id: Number(p.productId ?? p.id),
        name: String(p.productName ?? p.name ?? ''),
        image: (p.images?.find((i) => i.isPrimary) ?? p.images?.[0])?.imageUrl ?? p.imageUrl ?? '',
      })),
    [myProducts.data],
  )
  const submit = useRegisterFarm(c.campaignId)

  const [productId, setProductId] = useState<number | null>(null)
  const [productName, setProductName] = useState('')
  const [kg, setKg] = useState('')
  const [harvestDate, setHarvestDate] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [shelf, setShelf] = useState<ShelfLifeTier | null>(null)
  const [price, setPrice] = useState(String(Math.round(Number(c.rescuePricePerKg ?? 0))))
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
  const priceNum = Number(price)
  const payPrice = c.rescuePricePerKg > 0 ? Math.min(priceNum, c.rescuePricePerKg) : priceNum
  const estimate = kgNum > 0 && priceNum > 0 ? kgNum * payPrice * FARMER_KEEP_RATE : 0
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
    product: !productName.trim() ? 'Nhập tên sản phẩm' : null,
    kg: !(kgNum > 0) ? 'Nhập số kg lớn hơn 0' : topUp && kgNum > topUpMax ? `Chiến dịch chỉ còn cần bổ sung ${formatKg(topUpMax)}` : null,
    harvest: !harvestDate
      ? 'Chọn ngày thu hoạch'
      : harvestDate > harvestMax
        ? topUp
          ? `Lô bổ sung thu hoạch chậm nhất ${fmtDate(harvestMax)}`
          : startDate
            ? `Ngày thu hoạch phải trước ngày bắt đầu chiến dịch ${fmtDate(startDate)}`
            : `Ngày thu hoạch không được sau ngày chốt ${fmtDate(harvestMax)}`
        : null,
    images: images.length === 0 ? 'Thêm ít nhất 1 ảnh lô hàng' : null,
    shelf: !shelf
      ? 'Chọn thời gian bảo quản'
      : deliveryDate && deliveryDate > freshUntil(shelf)
        ? `${shelfLabel(shelf)} chỉ giữ tươi tới ${fmtDate(freshUntil(shelf))}, nhưng ngày giao là ${fmtDate(deliveryDate)}. Chọn độ bền dài hơn.`
        : null,
    price: !(priceNum > 0) ? 'Nhập giá đề xuất' : null,
    commit: !committed ? 'Bạn cần tick cam kết' : null,
  }
  const valid = Object.values(errors).every((e) => !e)
  const err = (k: keyof typeof errors) => (touched ? errors[k] : null)

  const pickProduct = (p: (typeof products)[number] | null) => {
    if (!p) return setProductId(null)
    setProductId(p.id)
    setProductName(p.name)
    if (p.image && !images.includes(p.image)) setImages((prev) => [p.image, ...prev].slice(0, 5))
  }

  const send = async () => {
    setTouched(true)
    if (!valid) return
    try {
      await submit.mutateAsync({
        productId: productId ?? undefined,
        productName: productName.trim(),
        surplusVolumeKg: kgNum,
        harvestDate,
        productImageUrls: images,
        shelfLifeTier: shelf as ShelfLifeTier,
        proposedPricePerKg: priceNum,
        priceCommitted: committed,
        note: note.trim() || undefined,
      })
      showToast('Đã gửi đăng ký. CapNong sẽ liên hệ thương lượng giá và duyệt lô hàng của bạn.')
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
          <SectionTitle icon={Package} title="1. Sản phẩm góp vào chiến dịch" />
          {products.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
              <Chip active={productId == null} label="Sản phẩm mới" onPress={() => pickProduct(null)} />
              {products.map((p) => (
                <Chip key={p.id} active={productId === p.id} label={p.name} image={p.image} onPress={() => pickProduct(p)} />
              ))}
            </ScrollView>
          )}
          <TextField label="Tên sản phẩm" value={productName} onChangeText={setProductName} maxLength={200} placeholder="Vd: Dưa hấu Long An loại 2" error={err('product') ?? undefined} />
        </View>

        <View className="gap-3">
          <SectionTitle icon={CalendarClock} title="2. Số lượng & ngày thu hoạch" />
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
                Chiến dịch diễn ra {startDate ? `từ ${fmtDate(startDate)} ` : ''}
                {endDate ? `đến ${fmtDate(endDate)}` : ''}
              </AppText>
            )}
            <AppText className="text-xs text-ink-muted">
              Mang hàng tới điểm tập kết {deliveryDate ? `chậm nhất trước ngày ${fmtDate(deliveryDate)}` : 'theo lịch CapNong hẹn'}
            </AppText>
          </View>
        </View>

        <View className="gap-3">
          <SectionTitle icon={Camera} title="3. Ảnh lô hàng" hint="1 – 5 ảnh chụp thật tại vườn giúp CapNong duyệt nhanh hơn." />
          <PhotoPicker urls={images} onChange={setImages} folder="campaigns" error={err('images')} />
        </View>

        <View className="gap-3">
          <SectionTitle icon={Clock} title="4. Độ bền sau khi kết thúc chiến dịch" hint={`Tính từ ${fmtDate(baseAnchor)}, hàng còn tươi thêm bao nhiêu ngày`} />
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
          <SectionTitle icon={HandCoins} title="5. Giá đề xuất & cam kết" />
          <NumberField label="Giá bạn đề xuất" suffix="đ/kg" value={price} onChange={setPrice} error={err('price')} />
          <AppText className="text-xs text-ink-subtle">
            Giá giải cứu chiến dịch: {formatVnd(c.rescuePricePerKg)}/kg. Giá chốt tối đa bằng giá giải cứu.
          </AppText>
          <View className="rounded-2xl bg-leaf-50 p-3">
            <AppText className="text-xs text-ink-muted">Tạm tính bạn nhận (sau phí 10%)</AppText>
            <AppText weight="extrabold" className="text-xl text-leaf-700">
              {formatVnd(estimate)}
            </AppText>
            <AppText className="text-[11px] text-ink-subtle">Tính theo số kg cân đạt chuẩn tại điểm gom × giá chốt sau thương lượng.</AppText>
          </View>
          <CheckRow checked={committed} onChange={setCommitted}>
            Tôi cam kết giữ đúng mức giá được CapNong chốt (không vượt giá đề xuất), giao đủ số kg đã khai và đúng chất lượng như ảnh, mang hàng tới
            điểm gom đúng hẹn. Hàng không đạt chuẩn khi cân kiểm sẽ không được tính tiền.
          </CheckRow>
          {err('commit') && <AppText className="text-xs text-sale">{err('commit')}</AppText>}
          <TextField label="Ghi chú cho CapNong (tuỳ chọn)" value={note} onChangeText={setNote} multiline placeholder="Vd: có thể tự chở hàng tới điểm gom" />
        </View>
      </View>
    </BottomSheet>
  )
}

function Chip({ active, label, image, onPress }: { active: boolean; label: string; image?: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className={cn('flex-row items-center gap-1.5 rounded-full border px-3 py-1.5', active ? 'border-leaf-700 bg-leaf-50' : 'border-line bg-white')}
    >
      {!!image && <Image source={{ uri: image }} style={{ width: 20, height: 20, borderRadius: 10 }} />}
      <AppText weight="bold" numberOfLines={1} className={cn('max-w-[160px] text-xs', active ? 'text-leaf-700' : 'text-ink')}>
        {label}
      </AppText>
    </Pressable>
  )
}
