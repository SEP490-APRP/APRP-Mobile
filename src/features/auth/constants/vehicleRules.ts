/** Điều kiện đăng ký xe tài xế (khớp VehicleType / VehicleRules ở BE) */

export type VehicleKind = 'MOTORBIKE' | 'VAN' | 'TRUCK_1T' | 'TRUCK_2T' | 'TRUCK_5T'

// Dạng biển số đã viết hoa, cho phép dấu gạch, chấm, khoảng trắng đúng vị trí. Xe máy: 59-A1 123.45; ô tô: 51C-100.01
const MOTO_PLATE = /^\d{2}[\s-]*(?:[A-Z]\d|[A-Z]{2})[\s.-]*(?:\d{3}[.\s]?\d{2}|\d{4})$/
const CAR_PLATE = /^\d{2}[\s-]*[A-Z]{1,2}[\s.-]*(?:\d{3}[.\s]?\d{2}|\d{4})$/

interface VehicleRule {
  capacityKg: number
  /** Hạng giấy phép đủ điều kiện (Luật TTATGT đường bộ 2024, kèm hạng cũ còn hiệu lực) */
  licenses: string[]
  plates: RegExp[]
  plateExample: string
}

export const VEHICLE_RULES: Record<VehicleKind, VehicleRule> = {
  MOTORBIKE: { capacityKg: 60, licenses: ['A1', 'A', 'A2'], plates: [MOTO_PLATE], plateExample: '59-A1 123.45' },
  VAN: { capacityKg: 500, licenses: ['B1', 'A3', 'B', 'B2', 'C1', 'C'], plates: [MOTO_PLATE, CAR_PLATE], plateExample: '51D-050.05' },
  TRUCK_1T: { capacityKg: 1000, licenses: ['B', 'B2', 'C1', 'C', 'C1E', 'CE'], plates: [CAR_PLATE], plateExample: '51C-100.01' },
  TRUCK_2T: { capacityKg: 2000, licenses: ['C1', 'C', 'C1E', 'CE'], plates: [CAR_PLATE], plateExample: '51C-200.03' },
  TRUCK_5T: { capacityKg: 5000, licenses: ['C', 'CE'], plates: [CAR_PLATE], plateExample: '51C-500.04' },
}

export const ruleOf = (kind?: string | null) => VEHICLE_RULES[(kind as VehicleKind) in VEHICLE_RULES ? (kind as VehicleKind) : 'MOTORBIKE']

export const normalizePlate = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, '')

export interface VehicleInput {
  vehicleType?: string | null
  vehicleNumber: string
  licenseClass: string
  licenseNumber: string
}

/** Lỗi đầu tiên của thông tin xe; null = đủ điều kiện */
export function vehicleError(v: VehicleInput): { field: keyof VehicleInput; message: string } | null {
  const rule = ruleOf(v.vehicleType)
  if (!rule.plates.some((p) => p.test(v.vehicleNumber.trim().toUpperCase()))) {
    return { field: 'vehicleNumber', message: `Biển số không đúng loại xe (VD: ${rule.plateExample})` }
  }
  if (!rule.licenses.includes(v.licenseClass.trim().toUpperCase())) {
    return { field: 'licenseClass', message: `Loại xe này cần giấy phép hạng ${rule.licenses.join(', ')}` }
  }
  if (!/^\d{12}$/.test(v.licenseNumber.trim())) {
    return { field: 'licenseNumber', message: 'Số giấy phép lái xe phải gồm đúng 12 chữ số' }
  }
  return null
}
