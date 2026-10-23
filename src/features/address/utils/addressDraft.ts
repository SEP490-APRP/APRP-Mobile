import type { SavedAddress, SavedAddressRequest } from '@/types/address.types'

export const ADDRESS_LABELS = ['Nhà', 'Công ty', 'Nhà bố mẹ', 'Trường học'] as const

export type AddressDraft = { label: string; recipientName: string; phone: string; address: string; isDefault: boolean }
export type AddressErrors = Partial<Record<keyof AddressDraft, string>>

const PHONE_RE = /^(0|\+84)\d{9,10}$/
export const cleanPhone = (phone: string) => phone.replace(/[\s.-]/g, '')

export const draftFromAddress = (a: SavedAddress): AddressDraft => ({
  label: a.label || 'Nhà',
  recipientName: a.recipientName,
  phone: a.phone,
  address: a.address,
  isDefault: a.isDefault,
})

export function validateAddressDraft(d: AddressDraft): AddressErrors {
  const errors: AddressErrors = {}
  if (!d.recipientName.trim()) errors.recipientName = 'Vui lòng nhập tên người nhận'
  if (!PHONE_RE.test(cleanPhone(d.phone))) errors.phone = 'Số điện thoại không hợp lệ'
  if (d.address.trim().length < 8) errors.address = 'Vui lòng nhập địa chỉ đầy đủ'
  return errors
}

export const toAddressRequest = (d: AddressDraft): SavedAddressRequest => ({
  label: d.label.trim() || 'Nhà',
  recipientName: d.recipientName.trim(),
  phone: cleanPhone(d.phone),
  address: d.address.trim(),
  isDefault: d.isDefault,
})
