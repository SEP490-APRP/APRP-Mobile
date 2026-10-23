import type { VoucherResponse } from '@/services/voucher.types'

/** Voucher trong danh sách chọn ở bước thanh toán: `isCollected` = đã nằm trong ví. */
export type CheckoutVoucher = VoucherResponse & { isCollected?: boolean }

/** Tiền hàng theo từng shop của đơn đang đặt, để xét điều kiện voucher shop. */
export type ShopGoods = { shopId: number; goods: number }

export const normalizeCode = (code?: string | null) => code?.trim().toUpperCase() ?? ''

export const isPlatformVoucher = (v: VoucherResponse) =>
  v.voucherScope === 'PLATFORM' || v.voucherScope === 'SYSTEM' || v.voucherScope === 'WELCOME' || v.creatorRole === 'ADMIN'

export const isShippingVoucher = (v: VoucherResponse) =>
  v.voucherTarget === 'SHIPPING' || v.voucherType === 'FREE_SHIPPING' || normalizeCode(v.voucherCode).includes('FREESHIP')

/** BE có lúc trả ngày dạng mảng [yyyy, MM, dd, HH, mm]. */
function parseExpiry(raw: unknown): Date | null {
  if (Array.isArray(raw)) {
    const [y, m = 1, d = 1, h = 0, min = 0] = raw as number[]
    return new Date(y, m - 1, d, h, min)
  }
  if (typeof raw === 'string' && raw) {
    const date = new Date(raw)
    return Number.isNaN(date.getTime()) ? null : date
  }
  return null
}

/**
 * Voucher có dùng được cho đơn hiện tại không (chuyển từ getVoucherEligibility bản web):
 * còn hiệu lực, chưa hết hạn; voucher shop thì shop phải có trong đơn và đủ tiền hàng của shop đó;
 * voucher sàn so với tổng tiền hàng.
 */
export function isVoucherEligible(v: VoucherResponse, shops: readonly ShopGoods[], now = new Date()): boolean {
  if (v.active === false || !v.voucherCode) return false
  const expiry = parseExpiry(v.expiryDate)
  if (expiry && expiry < now) return false

  const minOrder = Number(v.minOrderValue ?? 0)
  if (!isPlatformVoucher(v)) {
    const shop = shops.find((s) => Number(s.shopId) === Number(v.shopId))
    return !!shop && shop.goods >= minOrder
  }
  return shops.reduce((sum, s) => sum + s.goods, 0) >= minOrder
}

/**
 * Danh sách mã sau khi bật/tắt một voucher. Quy tắc cộng dồn như bản web (kiểu Shopee):
 * tối đa 1 mã freeship, 1 mã sàn và 1 mã cho mỗi shop; chọn mã mới cùng loại sẽ thay mã cũ.
 */
export function toggleVoucherCode(
  selected: readonly string[],
  voucher: VoucherResponse,
  all: readonly VoucherResponse[],
): string[] {
  const code = normalizeCode(voucher.voucherCode)
  if (selected.includes(code)) return selected.filter((c) => c !== code)

  const shipping = isShippingVoucher(voucher)
  const platform = isPlatformVoucher(voucher)
  const kept = selected.filter((c) => {
    const other = all.find((v) => normalizeCode(v.voucherCode) === c)
    if (!other) return true
    const otherShipping = isShippingVoucher(other)
    if (shipping || otherShipping) return !(shipping && otherShipping)
    const otherPlatform = isPlatformVoucher(other)
    if (platform && otherPlatform) return false
    if (!platform && !otherPlatform && Number(other.shopId) === Number(voucher.shopId)) return false
    return true
  })
  return [...kept, code]
}

/** Gộp voucher công khai và voucher trong ví; bỏ mã đã dùng hết lượt. Mã trong ví đè mã công khai. */
export function mergeCheckoutVouchers(
  mine: readonly VoucherResponse[],
  publics: readonly VoucherResponse[],
): CheckoutVoucher[] {
  const map = new Map<string, CheckoutVoucher>()
  publics.forEach((v) => {
    if (v?.voucherCode && !v.isUsed) map.set(normalizeCode(v.voucherCode), { ...v, isCollected: !!v.isCollected })
  })
  mine.forEach((v) => {
    if (v?.voucherCode && !v.isUsed) map.set(normalizeCode(v.voucherCode), { ...v, isCollected: true })
  })
  return [...map.values()]
}
