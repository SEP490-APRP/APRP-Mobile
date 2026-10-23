import type { UserResponse } from '@/services/user.types'

/** Hồ sơ gian hàng, chuyển từ EditShopProfileModal bản web. */
export interface ShopProfileValues {
  shopName: string
  fullName: string
  phoneNumber: string
  address: string
  description: string
  achievement: string
  license: string
  licenseImageUrl: string
  logoUrl: string
  bankName: string
  bankAccount: string
  bankAccountHolder: string
}

export type ShopProfileErrors = Partial<Record<keyof ShopProfileValues, string>>

export const SHOP_DESCRIPTION_MAX = 500

const VN_PHONE = /^0[35789]\d{8}$/

export const cleanPhone = (s: string) => s.replace(/[\s.-]/g, '').replace(/^\+84/, '0')

export function profileToShopForm(p?: UserResponse | null): ShopProfileValues {
  return {
    shopName: p?.shopName ?? '',
    fullName: p?.fullName ?? '',
    phoneNumber: p?.phoneNumber || p?.phone || '',
    address: p?.address ?? '',
    description: p?.description ?? '',
    achievement: p?.achievement ?? '',
    license: p?.license ?? '',
    licenseImageUrl: p?.licenseImageUrl ?? '',
    logoUrl: p?.logoUrl || p?.avatar || '',
    bankName: p?.bankName ?? '',
    bankAccount: p?.bankAccount || p?.bankAccountNumber || '',
    bankAccountHolder: p?.bankAccountHolder || p?.bankAccountName || p?.fullName || '',
  }
}

export function validateShopProfile(v: ShopProfileValues): ShopProfileErrors {
  const e: ShopProfileErrors = {}
  if (!v.shopName.trim()) e.shopName = 'Nhập tên gian hàng'
  if (!v.fullName.trim()) e.fullName = 'Nhập họ tên chủ vườn'
  if (!VN_PHONE.test(cleanPhone(v.phoneNumber))) e.phoneNumber = 'Số điện thoại gồm 10 số, đầu 03, 05, 07, 08, 09'
  if (v.description.length > SHOP_DESCRIPTION_MAX) e.description = `Tối đa ${SHOP_DESCRIPTION_MAX} ký tự`
  if (v.bankAccount && !/^\d{6,20}$/.test(v.bankAccount.replace(/\s/g, '')))
    e.bankAccount = 'Số tài khoản gồm 6–20 chữ số'
  return e
}

export function toShopProfileRequest(v: ShopProfileValues): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [k, val] of Object.entries(v)) out[k] = val.trim()
  out.phoneNumber = cleanPhone(v.phoneNumber)
  out.bankAccount = v.bankAccount.replace(/\s/g, '')
  return out
}
