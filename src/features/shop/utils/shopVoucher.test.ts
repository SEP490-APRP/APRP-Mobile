import type { VoucherResponse } from '@/services/voucher.types'
import { emptyVoucherForm, normalizeVoucherCode, toVoucherRequest, validateVoucher, voucherState } from './shopVoucher'

const NOW = new Date(2026, 9, 23)
const base = { ...emptyVoucherForm(NOW), code: 'GIAM20K' }

describe('shopVoucher', () => {
  it('chuẩn hoá mã', () => {
    expect(normalizeVoucherCode('giảm 20k đà lạt!')).toBe('GIAM20KDALAT')
  })

  it('mặc định như web và hợp lệ', () => {
    expect(base).toMatchObject({
      discountValue: '10000',
      minOrderValue: '50000',
      claimLimit: '100',
      expiryDate: '2026-11-22',
    })
    expect(validateVoucher(base, '2026-10-23')).toEqual({})
  })

  it('bắt lỗi', () => {
    const e = validateVoucher(
      {
        ...base,
        code: 'AB',
        type: 'PERCENTAGE',
        discountValue: '150',
        claimLimit: '5',
        perUserLimit: '6',
        expiryDate: '2026-10-23',
      },
      '2026-10-23',
    )
    expect(Object.keys(e).sort()).toEqual(['code', 'discountValue', 'expiryDate', 'perUserLimit'])
    expect(validateVoucher({ ...base, discountValue: '60000' }, '2026-10-23').discountValue).toMatch(/đơn tối thiểu/)
  })

  it('đổi sang request: freeship nhắm phí ship, chỉ % mới có mức tối đa', () => {
    expect(toVoucherRequest({ ...base, type: 'FREE_SHIPPING', maxDiscount: '9' })).toMatchObject({
      voucherScope: 'SHOP',
      voucherTarget: 'SHIPPING',
      maxDiscount: undefined,
      expiryDate: '2026-11-22T16:59:00.000Z',
    })
    expect(toVoucherRequest({ ...base, type: 'PERCENTAGE', discountValue: '15', maxDiscount: '30000' })).toMatchObject({
      voucherTarget: 'ORDER',
      discountValue: 15,
      maxDiscount: 30000,
    })
  })

  it('trạng thái mã', () => {
    const v = {
      voucherId: 1,
      voucherCode: 'A',
      voucherType: 'FIXED_AMOUNT',
      discountValue: 1,
      expiryDate: '2026-12-01',
    } as VoucherResponse
    expect(voucherState(v, NOW)).toBe('RUNNING')
    expect(voucherState({ ...v, active: false }, NOW)).toBe('PAUSED')
    expect(voucherState({ ...v, expiryDate: '2026-10-01' }, NOW)).toBe('EXPIRED')
    expect(voucherState({ ...v, claimLimit: 5, claimedCount: 5 }, NOW)).toBe('USED_UP')
  })
})
