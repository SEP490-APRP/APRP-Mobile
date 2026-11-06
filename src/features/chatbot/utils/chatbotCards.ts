import type {
  AiItemOption,
  GreenImpactDto,
  RoleGuidanceDto,
  SeasonalCalendarDto,
  VoucherItemDto,
} from '@/services/chatbot.types'

/** Giá đang bán; `original` chỉ có khi đang giảm giá. */
export function itemPrice(item: Pick<AiItemOption, 'price' | 'salePrice'>): { current: number; original?: number } {
  const current = item.salePrice || item.price || 0
  return { current, original: item.price && item.price > current ? item.price : undefined }
}

export const isFreeshipVoucher = (v: Pick<VoucherItemDto, 'voucherType' | 'code'>) =>
  v.voucherType === 'FREE_SHIPPING' || v.code.toUpperCase().includes('SHIP')

/** BE có thể trả "Tháng 10" hoặc 10; bỏ chữ thừa để không hiện "Tháng Tháng 10". */
export function seasonalMonth(calendar: Pick<SeasonalCalendarDto, 'currentMonth'>, now = new Date()): string {
  return String(calendar.currentMonth || '').replace(/^Tháng\s*/i, '') || String(now.getMonth() + 1)
}

export function seasonalBadge(calendar: Pick<SeasonalCalendarDto, 'isPastMonth' | 'isFutureMonth'>): string {
  if (calendar.isPastMonth) return 'Đã qua vụ rộ'
  if (calendar.isFutureMonth) return 'Mùa vụ sắp tới'
  return 'Đang chính vụ'
}

/** Tách hướng dẫn thành từng dòng, nhận biết dòng là một bước (1. / 1) / • / -). */
export function guidanceLines(guidance: RoleGuidanceDto['guidance']): { text: string; isStep: boolean }[] {
  return (guidance || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => ({
      text: line.replace(/^(\d+[.)]|•|-)\s*/, ''),
      isStep: /^(\d+[.)]|•|-)/.test(line),
    }))
}

/** BE và web đặt tên trường khác nhau, gom về một dạng và tính giá trị còn thiếu. */
export function greenImpactSummary(impact: GreenImpactDto) {
  const rescuedKg = Number(impact.totalRescuedKg ?? impact.totalRescuedWeight ?? 0)
  const co2Kg = Number(impact.totalCo2SavedKg ?? impact.co2SavedKg ?? rescuedKg * 1.8)
  return {
    rescuedKg,
    co2Kg,
    rank: String(impact.ecoRank ?? impact.badgeLevel ?? 'Chiến Binh Nông Sản Xanh'),
    points: Number(impact.loyaltyPoints ?? 0),
    trees: Number(impact.treesEquivalent ?? Math.max(1, Math.round(rescuedKg / 10))),
    shareMessage: String(
      impact.shareMessage ??
        impact.impactMessage ??
        `Tôi đã đồng hành cùng CapNong giải cứu ${rescuedKg.toFixed(1)}kg nông sản, giảm ${co2Kg.toFixed(1)}kg CO₂!`,
    ),
  }
}

/** Số tiền có dấu cho giao dịch ví: "+50.000đ", "−20.000đ". */
export function signedMoney(amount: number): string {
  const sign = amount > 0 ? '+' : amount < 0 ? '−' : ''
  return sign + new Intl.NumberFormat('vi-VN').format(Math.abs(amount)) + 'đ'
}

/** "14:30 06/11" cho hạn chót; chuỗi rỗng khi BE không gửi hoặc ngày sai. */
export function formatShortDateTime(iso?: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}`
}
