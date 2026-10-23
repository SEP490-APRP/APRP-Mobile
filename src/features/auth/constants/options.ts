import type { Choice } from '@/components/ui'

/** Các lựa chọn giống thẻ <select> trong AuthPage.tsx bản web. */
export const DIET_OPTIONS: readonly Choice[] = [
  { value: 'NON_VEGETARIAN', label: 'Ăn uống thông thường' },
  { value: 'VEGETARIAN', label: 'Ăn chay' },
  { value: 'VEGAN', label: 'Thuần chay' },
]

export const VEHICLE_OPTIONS: readonly Choice[] = [
  { value: 'Xe máy kèm thùng bảo ôn', label: 'Xe máy (thùng bảo ôn)' },
  { value: 'Xe ba gác nông sản', label: 'Xe ba gác' },
  { value: 'Xe tải 500kg - 1.5 tấn', label: 'Xe tải 500kg – 1.5 tấn' },
]

export const REGION_OPTIONS: readonly Choice[] = [
  { value: 'Đà Lạt & Lâm Đồng', label: 'Đà Lạt & Lâm Đồng' },
  { value: 'Miền Tây Nam Bộ', label: 'Miền Tây Nam Bộ' },
  { value: 'Tây Nguyên', label: 'Tây Nguyên' },
  { value: 'TP. Hồ Chí Minh', label: 'TP. Hồ Chí Minh' },
]

export const FARMING_OPTIONS: readonly Choice[] = [
  { value: 'Hữu cơ Organic', label: 'Hữu cơ Organic' },
  { value: 'VietGAP', label: 'VietGAP / GlobalGAP' },
  { value: 'Vườn tự nhiên', label: 'Thu hoạch tự nhiên' },
  { value: 'Thủy canh', label: 'Thủy canh' },
]

export type RegisterRole = 'buyer' | 'shop' | 'shipper'

export const ROLE_LABEL: Record<RegisterRole, string> = {
  buyer: 'Khách Mua',
  shop: 'Nhà Vườn',
  shipper: 'Tài Xế',
}
