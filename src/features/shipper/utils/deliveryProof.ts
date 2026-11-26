import type { DeliveryFailReason } from '@/services/shipper.service'

/** Lý do giao thất bại tại khách (khớp enum DeliveryFailReason ở BE) */
export const FAIL_REASONS: { value: DeliveryFailReason; label: string }[] = [
  { value: 'KHONG_LIEN_LAC_DUOC', label: 'Không liên lạc được' },
  { value: 'SAI_DIA_CHI', label: 'Sai địa chỉ' },
  { value: 'KHACH_TU_CHOI', label: 'Khách từ chối nhận' },
  { value: 'KHAC', label: 'Lý do khác' },
]

/** Lý do không lấy được hàng tại Nhà vườn / Shop */
export const PICKUP_FAIL_REASONS: { value: DeliveryFailReason; label: string }[] = [
  { value: 'KHONG_LIEN_LAC_DUOC', label: 'Không liên lạc được vườn' },
  { value: 'SHOP_DONG_CUA', label: 'Vườn đóng cửa' },
  { value: 'SHOP_CHUA_SAN_SANG', label: 'Hàng chưa sẵn sàng' },
  { value: 'KHAC', label: 'Lý do khác' },
]

export const FAIL_REASON_LABEL: Record<DeliveryFailReason, string> = {
  KHONG_LIEN_LAC_DUOC: 'Không liên lạc được',
  SAI_DIA_CHI: 'Sai địa chỉ',
  KHACH_TU_CHOI: 'Khách từ chối nhận',
  SHOP_DONG_CUA: 'Vườn đóng cửa',
  SHOP_CHUA_SAN_SANG: 'Hàng chưa sẵn sàng',
  KHAC: 'Lý do khác',
}

export function failReasonLabel(reason?: string | null): string {
  if (!reason) return 'Không rõ lý do'
  return FAIL_REASON_LABEL[reason as DeliveryFailReason] ?? reason
}

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
  stage: 'pickup' | 'delivery' | 'return_shop' = 'delivery',
): Partial<Record<'photos' | 'reason' | 'callAttempts' | 'note', string>> {
  const errors: Partial<Record<'photos' | 'reason' | 'callAttempts' | 'note', string>> = {}
  if (form.photoCount < 1) errors.photos = 'Chụp ít nhất 1 ảnh bằng chứng.'
  if (!failed) return errors
  if (!form.reason) errors.reason = stage === 'pickup' ? 'Chọn lý do không lấy được hàng.' : 'Chọn lý do giao thất bại.'
  if (form.reason === 'KHONG_LIEN_LAC_DUOC' && form.callAttempts < MIN_CALLS_WHEN_UNREACHABLE) {
    errors.callAttempts =
      stage === 'pickup'
        ? `Cần gọi nhà vườn tối thiểu ${MIN_CALLS_WHEN_UNREACHABLE} cuộc.`
        : `Cần gọi khách tối thiểu ${MIN_CALLS_WHEN_UNREACHABLE} cuộc.`
  }
  if (form.reason === 'KHAC' && !form.note.trim()) errors.note = 'Ghi rõ lý do.'
  return errors
}
