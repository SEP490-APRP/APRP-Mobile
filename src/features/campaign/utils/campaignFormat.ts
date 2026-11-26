import type { VehicleType, CampaignResponse, FarmRegistrationStatus, PreOrderResponse, ShelfLifeTier } from '@/services'
import { storyExcerpt } from '@/features/blog/utils/storyContent'

export const formatKg = (kg: number | null | undefined) =>
  `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(Number(kg ?? 0))} kg`

export const formatVnd = (v: number | null | undefined) =>
  `${new Intl.NumberFormat('vi-VN').format(Math.round(Number(v ?? 0)))}đ`

/** Chuỗi ngày 'yyyy-MM-dd' đọc theo giờ máy (không lệch múi giờ như new Date('yyyy-MM-dd')) */
const toDate = (v: string) => new Date(v.length === 10 ? `${v}T00:00:00` : v)

export const fmtDate = (v?: string | null) =>
  v ? toDate(v).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'

export const fmtDateTime = (v?: string | null) =>
  v
    ? toDate(v).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })
    : '—'

/** "Còn 3 ngày", "Còn 5 giờ", "Đã chốt" */
export function timeLeftLabel(cutoffAt: string | null | undefined, now = Date.now()) {
  const ms = cutoffAt ? toDate(cutoffAt).getTime() - now : NaN
  if (!Number.isFinite(ms) || ms <= 0) return 'Đã chốt'
  const hours = Math.floor(ms / 3_600_000)
  if (hours >= 48) return `Còn ${Math.floor(hours / 24)} ngày`
  if (hours >= 1) return `Còn ${hours} giờ`
  return `Còn ${Math.max(1, Math.floor(ms / 60_000))} phút`
}

export const progressOf = (c: Pick<CampaignResponse, 'progressPercent'>) =>
  Math.max(0, Math.min(100, Number(c.progressPercent ?? 0)))

/**
 * Chia số kg người mua nhập thành thùng (khớp CrateSplitter ở máy chủ): thùng lớn nhất 15 / 10 / 5 kg mà số kg chia hết.
 * Không phải bội số của 5 thì trả null.
 */
export function splitCrates(kg: number): { crateKg: number; quantity: number } | null {
  if (!Number.isInteger(kg) || kg < 5 || kg % 5 !== 0) return null
  const crateKg = [15, 10, 5].find((s) => kg % s === 0)!
  return { crateKg, quantity: kg / crateKg }
}

export const CAMPAIGN_STATUS_LABEL: Record<CampaignResponse['status'], string> = {
  DRAFT: 'Sắp mở',
  ACTIVE: 'Đang mở đặt trước',
  THRESHOLD_MET: 'Đã đủ ngưỡng',
  FULFILLING: 'Đang thu hoạch & giao',
  COMPLETED: 'Đã hoàn thành',
  CANCELLED: 'Đã huỷ',
}

/** Nhà vườn còn đăng ký góp hàng được: lời kêu gọi đã đăng (DRAFT) hoặc đang mở bán, và chưa qua hạn chốt */
export const acceptsFarms = (c: CampaignResponse) =>
  ((c.status === 'DRAFT' && !!c.callPostedAt) || c.status === 'ACTIVE') &&
  toDate(c.farmCutoffAt ?? c.cutoffAt).getTime() > Date.now()

export const remainingKgOf = (c: CampaignResponse) =>
  Math.max(0, Number(c.remainingVolumeKg ?? c.targetVolumeKg - c.bookedVolumeKg))

/** Đoạn mở đầu ngắn cho thẻ chiến dịch */
export function campaignExcerpt(c: CampaignResponse) {
  return (
    storyExcerpt(c.description, 160) ||
    `${c.approvedFarmCount || 'Nhiều'} nhà vườn cần tìm người mua cho ${formatKg(c.targetVolumeKg)} ${(
      c.categoryName || 'nông sản'
    ).toLowerCase()} với giá giải cứu ${formatVnd(c.rescuePricePerKg)}/kg.`
  )
}

/** Trạng thái hiển thị chung cho thẻ chiến dịch */
export function campaignView(c: CampaignResponse) {
  const isOpen = c.status === 'ACTIVE'
  const isUpcoming = c.status === 'DRAFT'
  const chip = isOpen
    ? timeLeftLabel(c.cutoffAt)
    : isUpcoming
      ? 'Đang gom nhà vườn'
      : c.status === 'COMPLETED'
        ? 'Hoàn thành'
        : c.status === 'CANCELLED'
          ? 'Đã huỷ'
          : 'Đang giao'
  const pct = isUpcoming
    ? c.targetVolumeKg > 0
      ? Math.min(100, (Number(c.approvedSurplusKg ?? 0) / c.targetVolumeKg) * 100)
      : 0
    : progressOf(c)
  const progressText = isUpcoming
    ? `${formatKg(c.approvedSurplusKg)} nhà vườn đã góp / ${formatKg(c.targetVolumeKg)}`
    : `${formatKg(c.bookedVolumeKg)} / ${formatKg(c.targetVolumeKg)} đã đặt`
  const place = c.collectionSiteAddress || c.collectionSiteName || 'Toàn quốc'
  return { isOpen, isUpcoming, chip, pct, progressText, place }
}

/** Link chỉ đường Google Maps tới điểm tập kết / người nhận */
export function directionsUrl(lat?: number | null, lng?: number | null, address?: string | null) {
  const q = lat != null && lng != null ? `${lat},${lng}` : (address ?? '')
  return q ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(q)}` : null
}

/** Lấy tên phường/xã trong địa chỉ giao */
export function wardOf(address: string) {
  return /(Phường|Xã|Thị trấn|P\.)\s*[^,]+/i.exec(address)?.[0]?.trim()
}

/* ───── Đơn đặt trước ───── */

type PreStatus = PreOrderResponse['status']

export const PRE_ORDER_STATUS: Record<PreStatus, { label: string; tone: 'amber' | 'leaf' | 'sky' | 'blue' | 'gray' | 'rose' }> = {
  PENDING: { label: 'Chờ thanh toán cọc', tone: 'amber' },
  DEPOSIT_PAID: { label: 'Đã cọc · chờ thu hoạch', tone: 'leaf' },
  PROCESSING: { label: 'Đã đóng thùng', tone: 'sky' },
  READY: { label: 'Tại hub · sắp giao', tone: 'sky' },
  SHIPPING: { label: 'Đang giao', tone: 'blue' },
  DELIVERED: { label: 'Đã giao', tone: 'leaf' },
  CANCELLED: { label: 'Đã huỷ', tone: 'gray' },
  FAILED: { label: 'Giao không thành công', tone: 'rose' },
}

export const TONE_CLASS: Record<'amber' | 'leaf' | 'sky' | 'blue' | 'gray' | 'rose', { bg: string; text: string }> = {
  amber: { bg: 'bg-amber-50', text: 'text-amber-700' },
  leaf: { bg: 'bg-leaf-50', text: 'text-leaf-700' },
  sky: { bg: 'bg-sky-50', text: 'text-sky-700' },
  blue: { bg: 'bg-blue-50', text: 'text-blue-700' },
  gray: { bg: 'bg-neutral-100', text: 'text-neutral-600' },
  rose: { bg: 'bg-rose-50', text: 'text-rose-700' },
}

/** Tiến trình ngắn để người mua biết đơn đặt trước đang ở bước nào */
export const PRE_ORDER_STEPS: { key: PreStatus[]; label: string }[] = [
  { key: ['DEPOSIT_PAID'], label: 'Đã cọc' },
  { key: ['PROCESSING', 'READY'], label: 'Đóng thùng' },
  { key: ['SHIPPING'], label: 'Đang giao' },
  { key: ['DELIVERED'], label: 'Đã giao' },
]

/** Bộ lọc đơn đặt trước trên màn "Đơn đặt trước" */
export const PRE_ORDER_FILTERS: { id: string; label: string; statuses?: PreStatus[] }[] = [
  { id: 'ALL', label: 'Tất cả' },
  { id: 'UNPAID', label: 'Chờ cọc', statuses: ['PENDING'] },
  { id: 'PAID', label: 'Đã cọc', statuses: ['DEPOSIT_PAID'] },
  { id: 'SHIPPING', label: 'Đang giao', statuses: ['PROCESSING', 'READY', 'SHIPPING'] },
  { id: 'DONE', label: 'Đã giao', statuses: ['DELIVERED'] },
  { id: 'CANCELLED', label: 'Đã huỷ', statuses: ['CANCELLED', 'FAILED'] },
]

/* ───── Nhà vườn ───── */

/** Nhà vườn nhận 70% sau phí dịch vụ 30% (khớp capnong.campaign.farmer-fee-rate) */
export const FARMER_KEEP_RATE = 0.7

/** 3 mức bảo quản, số ngày tính từ ngày kết thúc mở điểm tập kết */
export const SHELF_LIFE: { id: ShelfLifeTier; min: number; max: number; label: string; hint: string; tone: string }[] = [
  { id: 'DAYS_2_3', min: 2, max: 3, label: '2 – 3 ngày', hint: 'Rau ăn lá, quả chín mềm: dễ dập héo, giao gấp', tone: 'bg-rose-50 text-rose-700' },
  { id: 'DAYS_3_4', min: 3, max: 4, label: '3 – 4 ngày', hint: 'Cà chua, dưa leo, bắp: giữ được vài ngày ở nơi mát', tone: 'bg-amber-50 text-amber-700' },
  { id: 'DAYS_5_6', min: 5, max: 6, label: '5 – 6 ngày', hint: 'Củ, quả vỏ dày (bí, khoai, dưa hấu): bảo quản lâu', tone: 'bg-leaf-50 text-leaf-700' },
]
export const shelfLabel = (t?: ShelfLifeTier | null) => SHELF_LIFE.find((s) => s.id === t)?.label ?? '—'

export const REGISTRATION_STATUS: Record<FarmRegistrationStatus, { label: string; tone: 'amber' | 'leaf' | 'rose' | 'gray' }> = {
  PENDING: { label: 'Chờ duyệt', tone: 'amber' },
  APPROVED: { label: 'Đã duyệt', tone: 'leaf' },
  REJECTED: { label: 'Bị từ chối', tone: 'rose' },
  CANCELLED: { label: 'Chiến dịch đã huỷ', tone: 'gray' },
}

/* ───── Ngày dạng 'yyyy-MM-dd' theo giờ máy ───── */

export const localIsoDate = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
export const addDays = (iso: string, n: number) => {
  const d = new Date(`${iso}T00:00:00`)
  d.setDate(d.getDate() + n)
  return localIsoDate(d)
}
export const isoIn = (days: number) => localIsoDate(new Date(Date.now() + days * 86_400_000))

/** Loại xe tài xế và sức chở (kg), khớp VehicleType ở BE; dùng lọc chuyến chở hàng ra hub */
export const VEHICLE_TYPES: { id: VehicleType; label: string; capacityKg: number }[] = [
  { id: 'MOTORBIKE', label: 'Xe máy', capacityKg: 60 },
  { id: 'VAN', label: 'Xe ba gác / bán tải', capacityKg: 500 },
  { id: 'TRUCK_1T', label: 'Xe tải 1 tấn', capacityKg: 1000 },
  { id: 'TRUCK_2T', label: 'Xe tải 2 tấn', capacityKg: 2000 },
  { id: 'TRUCK_5T', label: 'Xe tải 5 tấn', capacityKg: 5000 },
]

export const vehicleLabel = (t?: string | null) => VEHICLE_TYPES.find((v) => v.id === t)?.label ?? 'Xe máy'
export const vehicleCapacity = (t?: string | null) => VEHICLE_TYPES.find((v) => v.id === t)?.capacityKg ?? 60

/** Nhãn cho đơn READY theo vị trí thật của hàng (đã chốt xe chưa có nghĩa hàng đã tới hub) */
export const readyLabel = (hubStage?: string | null, atHub = 'Tại hub') =>
  hubStage === 'AT_SITE' ? 'Chờ xe tại điểm tập kết' : hubStage === 'ON_THE_WAY' ? 'Đang chở ra hub' : atHub

/** Dòng ghi hub đã xác nhận đơn lúc nào, ai xác nhận (tài xế chỉ thấy đơn đã xác nhận) */
export const hubConfirmText = (o: { hubReceivedAt?: string | null; hubReceivedBy?: string | null }) =>
  o.hubReceivedAt ? `Hub đã xác nhận ${fmtDateTime(o.hubReceivedAt)}${o.hubReceivedBy ? ` · ${o.hubReceivedBy}` : ''}` : null
