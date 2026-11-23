import type { DeliveryFailReason } from '@/services/shipper.service'

/** Lý do giao thất bại hiển thị cho tài xế (khớp enum DeliveryFailReason ở BE) */
export const FAIL_REASONS: { value: DeliveryFailReason; label: string }[] = [
  { value: 'KHONG_LIEN_LAC_DUOC', label: 'Không liên lạc được' },
  { value: 'SAI_DIA_CHI', label: 'Sai địa chỉ' },
  { value: 'KHACH_TU_CHOI', label: 'Khách từ chối nhận' },
  { value: 'KHAC', label: 'Lý do khác' },
]

export const MIN_CALLS_WHEN_UNREACHABLE = 3

export interface DeliveryProofForm {
  photoCount: number
  reason?: DeliveryFailReason | null
  callAttempts: number
  note: string
}

/**
 * Kiểm tra form xác nhận giao (khớp luật BE):
 * - luôn cần ít nhất 1 ảnh;
 * - thất bại: bắt buộc lý do; "không liên lạc được" cần >= 3 cuộc gọi; "lý do khác" cần ghi chú.
 */
export function validateDeliveryProof(
  form: DeliveryProofForm,
  failed: boolean,
): Partial<Record<'photos' | 'reason' | 'callAttempts' | 'note', string>> {
  const errors: Partial<Record<'photos' | 'reason' | 'callAttempts' | 'note', string>> = {}
  if (form.photoCount < 1) errors.photos = 'Chụp ít nhất 1 ảnh bằng chứng.'
  if (!failed) return errors
  if (!form.reason) errors.reason = 'Chọn lý do giao thất bại.'
  if (form.reason === 'KHONG_LIEN_LAC_DUOC' && form.callAttempts < MIN_CALLS_WHEN_UNREACHABLE)
    errors.callAttempts = `Cần gọi khách tối thiểu ${MIN_CALLS_WHEN_UNREACHABLE} cuộc.`
  if (form.reason === 'KHAC' && !form.note.trim()) errors.note = 'Ghi rõ lý do.'
  return errors
}
