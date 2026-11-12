import { MAX_TOPUP_AMOUNT, MIN_TOPUP_AMOUNT } from '@/services/wallet.service'

export const QUICK_TOPUP_AMOUNTS = [100_000, 200_000, 500_000, 1_000_000] as const

/** Chuỗi người dùng gõ → số tiền (bỏ dấu chấm, chữ). */
export const parseAmount = (text: string) => Number(text.replace(/\D/g, '')) || 0

/** Lỗi số tiền nạp, undefined nếu hợp lệ */
export function topupAmountError(amount: number): string | undefined {
  const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + 'đ'
  if (amount < MIN_TOPUP_AMOUNT) return `Tối thiểu ${fmt(MIN_TOPUP_AMOUNT)}`
  if (amount > MAX_TOPUP_AMOUNT) return `Tối đa ${fmt(MAX_TOPUP_AMOUNT)}`
  return undefined
}

/** Gợi ý số tiền nạp: làm tròn lên nghìn, không dưới mức tối thiểu */
export function suggestTopup(missing?: number | null): number {
  if (!missing || missing <= 0) return 0
  return Math.max(MIN_TOPUP_AMOUNT, Math.ceil(missing / 1000) * 1000)
}

/** Nhãn bút toán ví cho tài xế */
export const WALLET_TX_LABEL: Record<string, string> = {
  SHIPPER_INCOME: 'Cước giao về ví',
  SHIPPER_INCOME_HOLD: 'Tạm giữ cước giao',
  HOLD_RELEASED: 'Mở tạm giữ (đơn hoàn tất)',
  HOLD_CANCELLED: 'Huỷ tạm giữ (đơn huỷ / thất bại)',
  COD_RESERVED: 'Ký quỹ đơn COD',
  COD_RESERVE_RELEASED: 'Gỡ ký quỹ đơn COD',
  COD_CASH_COLLECTED: 'Thu tiền mặt COD',
  COD_CASH_REMITTED: 'Đã nộp tiền COD',
  TOP_UP: 'Nạp ví qua PayOS',
  WITHDRAW_REQUESTED: 'Rút tiền về ngân hàng',
  WITHDRAW_REFUNDED: 'Hoàn lệnh rút bị từ chối',
}
