import type { VoucherCreateRequest, VoucherResponse, VoucherType } from '@/services/voucher.types'
import { addDays } from './productForm'

/** Mã giảm giá của gian hàng, chuyển từ pages/farmer/Vouchers.tsx. */
export const VOUCHER_TYPE_OPTIONS: readonly { value: VoucherType; label: string }[] = [
  { value: 'FIXED_AMOUNT', label: 'Giảm số tiền' },
  { value: 'PERCENTAGE', label: 'Giảm theo %' },
  { value: 'FREE_SHIPPING', label: 'Miễn phí ship' },
]

export interface VoucherFormValues {
  code: string
  type: VoucherType
  discountValue: string
  maxDiscount: string
  minOrderValue: string
  claimLimit: string
  perUserLimit: string
  expiryDate: string
  isPublic: boolean
}

export type VoucherFormErrors = Partial<Record<keyof VoucherFormValues, string>>

export function emptyVoucherForm(now = new Date()): VoucherFormValues {
  return {
    code: '',
    type: 'FIXED_AMOUNT',
    discountValue: '10000',
    maxDiscount: '',
    minOrderValue: '50000',
    claimLimit: '100',
    perUserLimit: '1',
    expiryDate: addDays(30, now),
    isPublic: true,
  }
}

/** Mã chỉ gồm chữ in hoa và số, như GIAM20K. */
export const normalizeVoucherCode = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'D')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 20)

const int = (s: string) => (/^\d+$/.test(s) ? Number(s) : NaN)

export function validateVoucher(v: VoucherFormValues, today = addDays(0)): VoucherFormErrors {
  const e: VoucherFormErrors = {}
  if (v.code.length < 4) e.code = 'Mã cần 4–20 ký tự chữ hoặc số'
  const value = int(v.discountValue)
  if (v.type === 'PERCENTAGE') {
    if (!(value >= 1 && value <= 100)) e.discountValue = 'Phần trăm giảm từ 1 đến 100'
  } else if (!(value > 0)) e.discountValue = 'Số tiền giảm phải lớn hơn 0'
  if (v.maxDiscount && !(int(v.maxDiscount) > 0)) e.maxDiscount = 'Mức giảm tối đa phải lớn hơn 0'
  if (v.minOrderValue === '' || Number.isNaN(int(v.minOrderValue)))
    e.minOrderValue = 'Nhập giá trị đơn tối thiểu (có thể là 0)'
  else if (v.type === 'FIXED_AMOUNT' && value > 0 && int(v.minOrderValue) > 0 && value > int(v.minOrderValue))
    e.discountValue = 'Số tiền giảm không nên lớn hơn đơn tối thiểu'
  if (!(int(v.claimLimit) >= 1)) e.claimLimit = 'Số lượt phát hành từ 1 trở lên'
  if (!(int(v.perUserLimit) >= 1)) e.perUserLimit = 'Mỗi khách dùng ít nhất 1 lần'
  else if (int(v.claimLimit) >= 1 && int(v.perUserLimit) > int(v.claimLimit))
    e.perUserLimit = 'Không được lớn hơn tổng lượt phát hành'
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v.expiryDate)) e.expiryDate = 'Ngày hết hạn có dạng NNNN-TT-NN'
  else if (v.expiryDate <= today) e.expiryDate = 'Ngày hết hạn phải sau hôm nay'
  return e
}

export function toVoucherRequest(v: VoucherFormValues): VoucherCreateRequest {
  const freeShip = v.type === 'FREE_SHIPPING'
  return {
    voucherCode: v.code,
    voucherType: v.type,
    voucherScope: 'SHOP',
    voucherTarget: freeShip ? 'SHIPPING' : 'ORDER',
    discountValue: Number(v.discountValue),
    maxDiscount: v.type === 'PERCENTAGE' && v.maxDiscount ? Number(v.maxDiscount) : undefined,
    minOrderValue: Number(v.minOrderValue || 0),
    claimLimit: Number(v.claimLimit),
    perUserLimit: Number(v.perUserLimit),
    // Hết hạn cuối ngày đã chọn, giờ Việt Nam.
    expiryDate: new Date(`${v.expiryDate}T23:59:00+07:00`).toISOString(),
    isPublic: v.isPublic,
  }
}

export type VoucherState = 'RUNNING' | 'PAUSED' | 'EXPIRED' | 'USED_UP'

export function voucherState(v: VoucherResponse, now = new Date()): VoucherState {
  if (v.expiryDate && new Date(v.expiryDate) < now) return 'EXPIRED'
  if (v.active === false) return 'PAUSED'
  if (v.claimLimit && (v.claimedCount ?? 0) >= v.claimLimit) return 'USED_UP'
  return 'RUNNING'
}

export const VOUCHER_STATE_LABEL: Record<VoucherState, string> = {
  RUNNING: 'Đang chạy',
  PAUSED: 'Tạm dừng',
  EXPIRED: 'Hết hạn',
  USED_UP: 'Hết lượt',
}

/** Bản web chỉ cho xoá mã đã tạm dừng. */
export const canDeleteVoucher = (v: VoucherResponse) => v.active === false
