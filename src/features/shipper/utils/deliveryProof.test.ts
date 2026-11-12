import { validateDeliveryProof } from './deliveryProof'
import { codReserveCheck, shipperErrorMessage } from './shipperOrders'
import type { OrderResponse } from '@/types/order.types'

const base = { photoCount: 1, reason: null, callAttempts: 0, note: '' }

describe('validateDeliveryProof', () => {
  it('giao thành công chỉ cần ít nhất 1 ảnh', () => {
    expect(validateDeliveryProof(base, false)).toEqual({})
    expect(validateDeliveryProof({ ...base, photoCount: 0 }, false).photos).toBeDefined()
  })

  it('giao thất bại bắt buộc chọn lý do', () => {
    expect(validateDeliveryProof(base, true).reason).toBeDefined()
  })

  it('không liên lạc được cần gọi tối thiểu 3 cuộc', () => {
    expect(validateDeliveryProof({ ...base, reason: 'KHONG_LIEN_LAC_DUOC', callAttempts: 2 }, true).callAttempts).toBeDefined()
    expect(validateDeliveryProof({ ...base, reason: 'KHONG_LIEN_LAC_DUOC', callAttempts: 3 }, true)).toEqual({})
  })

  it('lý do khác bắt buộc ghi chú', () => {
    expect(validateDeliveryProof({ ...base, reason: 'KHAC', note: '  ' }, true).note).toBeDefined()
    expect(validateDeliveryProof({ ...base, reason: 'KHAC', note: 'Khách hẹn hôm khác' }, true)).toEqual({})
  })
})

describe('codReserveCheck', () => {
  const cod = { paymentMethod: 'COD', totalAmount: 215000 } as OrderResponse

  it('đơn COD cần ký quỹ đủ tiền thu của khách', () => {
    expect(codReserveCheck(cod, 200000)).toEqual({ required: 215000, missing: 15000 })
    expect(codReserveCheck(cod, 500000)).toEqual({ required: 215000, missing: 0 })
  })

  it('đơn đã trả online không cần ký quỹ', () => {
    expect(codReserveCheck({ ...cod, paymentMethod: 'PAYOS' }, 0)).toEqual({ required: 0, missing: 0 })
  })
})

describe('shipperErrorMessage', () => {
  it('thiếu tiền ký quỹ nói rõ số tiền cần nạp', () => {
    const msg = shipperErrorMessage({ data: { code: 16013, result: { required: 215000, available: 200000, missing: 15000 } } }, 'x')
    expect(msg).toContain('15.000đ')
  })

  it('đơn đã có người nhận', () => {
    expect(shipperErrorMessage({ data: { code: 7005 } }, 'x')).toBe('Đơn này đã được tài xế khác nhận.')
  })
})
