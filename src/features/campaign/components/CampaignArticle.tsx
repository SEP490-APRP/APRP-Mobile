import { Image } from 'expo-image'
import { router } from 'expo-router'
import { CalendarClock, Info, LogIn, MapPin, ShieldCheck, ShoppingBasket, Sprout, Tag, Truck, Users, Wallet } from 'lucide-react-native'
import { useMemo, useState } from 'react'
import { ScrollView, View } from 'react-native'
import { AppText, Button } from '@/components/ui'
import { parseStoryContent, StoryBody } from '@/features/blog'
import type { CampaignResponse } from '@/services'
import { useAuth } from '@/stores'
import { colors } from '@/theme/colors'
import {
  acceptsFarms,
  CAMPAIGN_STATUS_LABEL,
  fmtDate,
  formatKg,
  formatVnd,
  progressOf,
  remainingKgOf,
  timeLeftLabel,
} from '../utils/campaignFormat'
import { Bullet, Card, Notice, ProgressBar, SectionTitle, SiteLocation, Stat } from './CampaignBits'
import { PreOrderSheet } from './PreOrderSheet'
import { RegisterLotSheet } from './RegisterLotSheet'

const fallbackCover = require('../../../../assets/images/hero-farmer.jpg')

/** Chi tiết chiến dịch, chuyển từ pages/CampaignDetailPage.tsx: bài viết, con số, phí giao, điểm tập kết và phần tham gia */
export function CampaignArticle({ c, bottomInset = 0 }: { c: CampaignResponse; bottomInset?: number }) {
  const { user } = useAuth()
  const [ordering, setOrdering] = useState(false)
  const [registering, setRegistering] = useState(false)
  const blocks = useMemo(() => parseStoryContent(c.description), [c.description])
  const depositPct = Math.round(Number(c.depositPercent ?? 0) * 100)
  const tag = [c.categoryName, c.season].filter(Boolean).join(' · ') || 'Nông sản'
  const farmOpen = acceptsFarms(c)
  const canOrder = c.status === 'ACTIVE' && user?.role === 'buyer'
  const isShop = user?.role === 'shop'
  const remaining = remainingKgOf(c)

  return (
    <View className="flex-1">
      <ScrollView contentContainerClassName="gap-5 pb-8">
        <View className="h-64">
          <Image source={c.coverImageUrl ? { uri: c.coverImageUrl } : fallbackCover} contentFit="cover" style={{ width: '100%', height: '100%' }} />
          <View className="absolute inset-0 justify-end gap-2 bg-black/50 p-5">
            <AppText weight="bold" className="text-xs uppercase text-sun-300">
              {tag}
            </AppText>
            <AppText weight="extrabold" className="text-2xl leading-tight text-white">
              {c.title}
            </AppText>
            <View className="flex-row flex-wrap items-center gap-2">
              <View className="rounded-full bg-sun-300 px-3 py-1">
                <AppText weight="extrabold" className="text-xs text-soil-600">
                  {CAMPAIGN_STATUS_LABEL[c.status]}
                </AppText>
              </View>
              <AppText className="text-xs text-white/85">Chốt đơn {fmtDate(c.cutoffAt)}</AppText>
            </View>
          </View>
        </View>

        <View className="gap-5 px-4">
          <CampaignNumbers c={c} depositPct={depositPct} />

          {blocks.length > 0 ? (
            <StoryBody blocks={blocks} />
          ) : (
            <AppText className="text-base leading-relaxed text-ink-muted">
              {c.approvedFarmCount || 'Nhiều'} nhà vườn đang có {formatKg(c.targetVolumeKg)} {(c.categoryName || 'nông sản').toLowerCase()} cần tìm người mua
              trước khi hỏng ngoài ruộng. CapNong gom đơn đặt trước với giá giải cứu {formatVnd(c.rescuePricePerKg)}/kg.
            </AppText>
          )}

          <Card>
            <SectionTitle icon={Truck} title="Từ vườn tới bạn" />
            <Bullet n={1}>Nhà vườn mang hàng tới {c.collectionSiteName || 'điểm tập kết'}.</Bullet>
            <Bullet n={2}>CapNong cân, đóng thùng 5 / 10 / 15 kg, dán QR truy xuất vườn.</Bullet>
            <Bullet n={3}>
              Giao tận nơi sau ngày chốt {fmtDate(c.cutoffAt)}
              {c.deliveryDate ? `, dự kiến từ ${fmtDate(c.deliveryDate)}` : ''}.
            </Bullet>
          </Card>

          <Card>
            <SectionTitle icon={ShieldCheck} title="Tiền cọc an toàn" />
            <Bullet n={1}>Cọc trước {depositPct}% tổng đơn (tiền hàng + phí giao) qua PayOS, CapNong giữ hộ.</Bullet>
            <Bullet n={2}>Phần còn lại trả khi nhận hàng.</Bullet>
            <Bullet n={3}>Chưa đủ {formatKg(c.minThresholdKg)} tới ngày chốt: tự huỷ, hoàn 100% cọc về ví.</Bullet>
            <Bullet n={4}>Không nhận hàng (vắng nhà, từ chối nhận, không tới điểm lấy) thì không được hoàn cọc.</Bullet>
          </Card>

          <ShippingRules c={c} />

          {(!!c.collectionSiteAddress || c.collectionSiteLatitude != null) && (
            <SiteLocation
              name={c.collectionSiteName}
              address={c.collectionSiteAddress}
              lat={c.collectionSiteLatitude}
              lng={c.collectionSiteLongitude}
            />
          )}

          {/* Phần tham gia: người mua đặt thùng, nhà vườn góp lô */}
          <Card>
            <SectionTitle icon={ShoppingBasket} title="Đặt trước một thùng" hint={`${formatVnd(c.rescuePricePerKg)}/kg · còn ${formatKg(remaining)}`} />
            {c.status !== 'ACTIVE' ? (
              <Notice tone="gray">{closedText(c)}</Notice>
            ) : !user ? (
              <Button title="Đăng nhập khách hàng" icon={LogIn} onPress={() => router.push('/login')} />
            ) : canOrder ? (
              <Button title={`Đặt trước ngay · còn ${formatKg(remaining)}`} icon={ShoppingBasket} onPress={() => setOrdering(true)} />
            ) : (
              <Notice tone="gray">Chỉ tài khoản người mua mới đặt trước được.</Notice>
            )}
          </Card>

          <Card>
            <SectionTitle icon={Sprout} title="Góp lô hàng đang dư" hint={`Nhà vườn bán với giá tới ${formatVnd(c.rescuePricePerKg)}/kg`} />
            {!farmOpen ? (
              <Notice tone="gray">Chiến dịch hiện không nhận thêm lô hàng từ nhà vườn.</Notice>
            ) : isShop ? (
              <Button title="Đăng ký góp lô hàng" icon={Sprout} onPress={() => setRegistering(true)} />
            ) : !user ? (
              <Button title="Đăng nhập nhà vườn" variant="outline" icon={LogIn} onPress={() => router.push('/login')} />
            ) : (
              <Notice tone="gray">Chỉ tài khoản nhà vườn mới đăng ký góp hàng được.</Notice>
            )}
          </Card>
        </View>
      </ScrollView>

      {canOrder && (
        <View className="flex-row items-center gap-3 border-t border-line bg-white px-4 pt-3" style={{ paddingBottom: bottomInset + 12 }}>
          <View className="flex-1">
            <AppText className="text-xs text-ink-muted">Giá giải cứu</AppText>
            <AppText weight="extrabold" className="text-lg text-leaf-700">
              {formatVnd(c.rescuePricePerKg)}/kg
            </AppText>
          </View>
          <Button title="Đặt trước thùng" icon={ShoppingBasket} onPress={() => setOrdering(true)} />
        </View>
      )}

      <PreOrderSheet c={c} visible={ordering} onClose={() => setOrdering(false)} />
      <RegisterLotSheet c={c} visible={registering} onClose={() => setRegistering(false)} onDone={() => setRegistering(false)} />
    </View>
  )
}

function closedText(c: CampaignResponse) {
  if (c.status === 'DRAFT') return 'Đang gom hàng từ nhà vườn. Phần đặt trước sẽ mở ngay khi CapNong duyệt đủ hàng.'
  if (c.status === 'COMPLETED') return `Chiến dịch đã giải cứu ${formatKg(c.bookedVolumeKg)}. Cảm ơn bạn đã đồng hành!`
  if (c.status === 'CANCELLED') return 'Chiến dịch đã huỷ, tiền cọc đã được hoàn về ví CapNong của người đặt.'
  return 'Đã đủ ngưỡng và đóng đặt trước, nông sản đang được thu hoạch và giao.'
}

/** Con số của chiến dịch: đã đặt / ngưỡng / mục tiêu */
function CampaignNumbers({ c, depositPct }: { c: CampaignResponse; depositPct: number }) {
  const booked = Number(c.bookedVolumeKg ?? 0)
  const target = Number(c.targetVolumeKg ?? 0)
  const threshold = Number(c.minThresholdKg ?? 0)
  const thresholdPct = target > 0 ? Math.min(100, (threshold / target) * 100) : 0
  const needForThreshold = Math.max(0, threshold - booked)
  const needForTarget = Math.max(0, target - booked)
  const lots = Number(c.approvedLotCount ?? 0)
  const farms = Number(c.approvedFarmCount ?? 0)
  const badge =
    needForThreshold > 0
      ? { text: `Cần thêm ${formatKg(needForThreshold)} để đủ ngưỡng`, tone: 'amber' as const }
      : needForTarget > 0
        ? { text: `Đã đủ ngưỡng · còn ${formatKg(needForTarget)} tới mục tiêu`, tone: 'leaf' as const }
        : { text: 'Đã đạt mục tiêu', tone: 'leaf' as const }
  return (
    <Card>
      <AppText weight="extrabold" className="text-xs uppercase text-leaf-600">
        Con số của chiến dịch
      </AppText>
      <View className="flex-row items-end gap-2">
        <AppText weight="extrabold" className="text-3xl">
          {formatKg(booked)}
        </AppText>
        <AppText className="pb-1 text-sm text-ink-muted">đã được đặt trước</AppText>
      </View>
      <Notice tone={badge.tone}>{badge.text}</Notice>
      <ProgressBar pct={progressOf(c)} marker={thresholdPct} />
      <View className="flex-row justify-between">
        <AppText className="text-xs text-ink-subtle">0 kg</AppText>
        <AppText weight="bold" className="text-xs text-amber-700">
          Ngưỡng {formatKg(threshold)}
        </AppText>
        <AppText className="text-xs text-ink-subtle">Mục tiêu {formatKg(target)}</AppText>
      </View>
      <View className="flex-row gap-2 rounded-2xl bg-amber-50 p-3">
        <Info size={16} color="#b45309" />
        <AppText className="flex-1 text-xs leading-relaxed text-amber-800">
          Đủ {formatKg(threshold)} trước ngày chốt {fmtDate(c.cutoffAt)} thì nhà vườn thu hoạch và giao hàng; chưa đủ thì chiến dịch tự huỷ và
          hoàn 100% tiền cọc về ví.
        </AppText>
      </View>
      <View className="flex-row gap-2 rounded-2xl bg-paper p-3">
        <Stat label="Giá giải cứu" value={`${formatVnd(c.rescuePricePerKg)}/kg`} />
        <Stat label="Nhà vườn" value={lots > farms ? `${farms} · ${lots} lô` : String(farms)} />
        <Stat label="Cọc" value={`${depositPct}%`} />
      </View>
      <View className="flex-row flex-wrap gap-x-4 gap-y-1">
        <Meta icon={CalendarClock} text={c.status === 'ACTIVE' ? `Chốt ${fmtDate(c.cutoffAt)} · ${timeLeftLabel(c.cutoffAt).toLowerCase()}` : `Chốt ${fmtDate(c.cutoffAt)}`} />
        {c.deliveryDate && <Meta icon={Truck} text={`Giao từ ${fmtDate(c.deliveryDate)}`} />}
        <Meta icon={Users} text={`${farms} nhà vườn tham gia`} />
      </View>
    </Card>
  )
}

function Meta({ icon: Icon, text }: { icon: typeof Wallet; text: string }) {
  return (
    <View className="flex-row items-center gap-1.5">
      <Icon size={13} color={colors.leaf600} />
      <AppText className="text-xs text-ink-muted">{text}</AppText>
    </View>
  )
}

/** Cách tính phí giao: mua càng nhiều ship càng rẻ */
function ShippingRules({ c }: { c: CampaignResponse }) {
  const half = Number(c.shipHalfKg ?? 10)
  const free = Number(c.shipFreeKg ?? 20)
  const radius = Number(c.shipFreeRadiusKm ?? 10)
  const group = Number(c.groupDiscountMinOrders ?? 5)
  const steps = [
    { kg: `Dưới ${formatKg(half)}`, fee: 'Phí gốc', sub: 'theo km', h: 64, cls: 'bg-white/15', text: 'text-white' },
    { kg: `Từ ${formatKg(half)}`, fee: '-50%', sub: 'phí giao', h: 92, cls: 'bg-leaf-200', text: 'text-leaf-800' },
    { kg: `Từ ${formatKg(free)}`, fee: '0đ', sub: `trong ${radius} km`, h: 120, cls: 'bg-sun-300', text: 'text-soil-600' },
  ]
  const tiers = [
    ['< 5 km', '15k'],
    ['5–10 km', '20k'],
    ['10–20 km', '30k'],
    ['> 20 km', '30k + 3k/km'],
  ]
  return (
    <View className="overflow-hidden rounded-panel border border-line">
      <View className="gap-4 bg-leaf-700 p-5">
        <View className="gap-1">
          <View className="flex-row items-center gap-1.5">
            <Truck size={13} color={colors.sun300} />
            <AppText weight="extrabold" className="text-[11px] uppercase text-sun-300">
              Phí giao hàng
            </AppText>
          </View>
          <AppText weight="extrabold" className="text-2xl text-white">
            Mua càng nhiều, ship càng rẻ
          </AppText>
          <AppText className="text-xs text-white/80">Cộng dồn mọi thùng trong đơn (2 thùng 5 kg = 10 kg). Phí biết trước khi đặt.</AppText>
        </View>
        <View className="flex-row items-end gap-2">
          {steps.map((s) => (
            <View key={s.kg} className="flex-1 items-center gap-1.5">
              <AppText weight="bold" className="text-center text-[11px] text-white/90">
                {s.kg}
              </AppText>
              <View className={`w-full items-center justify-center rounded-2xl ${s.cls}`} style={{ height: s.h }}>
                <AppText weight="extrabold" className={`text-xl ${s.text}`}>
                  {s.fee}
                </AppText>
                <AppText className={`text-[11px] ${s.text}`}>{s.sub}</AppText>
              </View>
            </View>
          ))}
        </View>
      </View>
      <View className="gap-3 bg-white p-4">
        <AppText weight="extrabold" className="text-[11px] uppercase text-ink-subtle">
          Phí gốc theo khoảng cách từ {c.collectionSiteName || 'điểm tập kết'}
        </AppText>
        <View className="flex-row flex-wrap gap-2">
          {tiers.map(([km, fee]) => (
            <View key={km} className="min-w-[46%] flex-1 items-center rounded-xl border border-line bg-paper py-2">
              <AppText className="text-xs text-ink-subtle">{km}</AppText>
              <AppText weight="extrabold">{fee}</AppText>
            </View>
          ))}
        </View>
        <AppText className="text-xs text-ink-subtle">Từ {formatKg(free)} mà ở xa hơn {radius} km: vẫn được giảm 50%.</AppText>
        <View className="flex-row gap-2.5 rounded-2xl bg-leaf-50 p-3">
          <MapPin size={16} color={colors.leaf700} />
          <AppText className="flex-1 text-xs leading-relaxed text-ink">
            <AppText weight="bold" className="text-xs">
              Tự đến điểm tập kết: 0đ.{' '}
            </AppText>
            CapNong báo khi bắt đầu nhận hàng và khi đơn đóng gói xong.
          </AppText>
        </View>
        <View className="flex-row gap-2.5 rounded-2xl bg-amber-50 p-3">
          <Tag size={16} color="#b45309" />
          <AppText className="flex-1 text-xs leading-relaxed text-ink">
            <AppText weight="bold" className="text-xs">
              Rủ hàng xóm cùng đặt.{' '}
            </AppText>
            Phường có từ {group} đơn trở lên được giảm thêm 50% phí giao khi chốt.
          </AppText>
        </View>
      </View>
    </View>
  )
}
