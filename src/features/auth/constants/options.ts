import type { Choice } from '@/components/ui'

/** Các lựa chọn giống thẻ <select> trong AuthPage.tsx bản web. */
export const DIET_OPTIONS: readonly Choice[] = [
  { value: 'NON_VEGETARIAN', label: 'Ăn uống thông thường' },
  { value: 'VEGETARIAN', label: 'Ăn chay' },
  { value: 'VEGAN', label: 'Thuần chay' },
]

/** Loại xe tài xế (khớp VehicleType ở BE); chỉ xe từ 300 kg trở lên nhận được chuyến chở hàng ra hub */
export const VEHICLE_OPTIONS: readonly Choice[] = [
  { value: 'MOTORBIKE', label: 'Xe máy (thùng bảo ôn)' },
  { value: 'VAN', label: 'Xe ba gác / bán tải (~500 kg)' },
  { value: 'TRUCK_1T', label: 'Xe tải 1 tấn' },
  { value: 'TRUCK_2T', label: 'Xe tải 2 tấn' },
  { value: 'TRUCK_5T', label: 'Xe tải 5 tấn' },
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
