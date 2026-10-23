import type { VoucherResponse } from '@/services/voucher.types'
import { isVoucherEligible, mergeCheckoutVouchers, toggleVoucherCode } from './voucherRules'

const v = (code: string, extra: Partial<VoucherResponse> = {}): VoucherResponse => ({
  voucherId: 1,
  voucherCode: code,
  voucherType: 'FIXED_AMOUNT',
  discountValue: 10000,
  expiryDate: '2099-01-01',
  ...extra,
})

const shops = [
  { shopId: 5, goods: 120000 },
  { shopId: 6, goods: 40000 },
]

describe('isVoucherEligible', () => {
  it('voucher shop chỉ xét tiền hàng của đúng shop đó', () => {
    expect(isVoucherEligible(v('A', { shopId: 5, voucherScope: 'SHOP', minOrderValue: 100000 }), shops)).toBe(true)
    expect(isVoucherEligible(v('B', { shopId: 6, voucherScope: 'SHOP', minOrderValue: 100000 }), shops)).toBe(false)
    expect(isVoucherEligible(v('C', { shopId: 9, voucherScope: 'SHOP' }), shops)).toBe(false)
  })

  it('voucher sàn xét tổng tiền hàng', () => {
    expect(isVoucherEligible(v('P', { voucherScope: 'PLATFORM', minOrderValue: 150000 }), shops)).toBe(true)
    expect(isVoucherEligible(v('Q', { voucherScope: 'PLATFORM', minOrderValue: 200000 }), shops)).toBe(false)
  })

  it('loại voucher hết hạn, kể cả ngày dạng mảng', () => {
    const past = [2020, 1, 1] as unknown as string
    expect(isVoucherEligible(v('X', { voucherScope: 'PLATFORM', expiryDate: past }), shops)).toBe(false)
    expect(isVoucherEligible(v('Y', { voucherScope: 'PLATFORM', active: false }), shops)).toBe(false)
  })
})

describe('toggleVoucherCode', () => {
  const ship1 = v('FREESHIP1', { voucherType: 'FREE_SHIPPING', voucherScope: 'PLATFORM' })
  const ship2 = v('SHIP2', { voucherTarget: 'SHIPPING', voucherScope: 'PLATFORM' })
  const plat1 = v('SAN1', { voucherScope: 'PLATFORM' })
  const plat2 = v('SAN2', { voucherScope: 'PLATFORM' })
  const shopA = v('SHOPA', { voucherScope: 'SHOP', shopId: 5 })
  const shopA2 = v('SHOPA2', { voucherScope: 'SHOP', shopId: 5 })
  const shopB = v('SHOPB', { voucherScope: 'SHOP', shopId: 6 })
  const all = [ship1, ship2, plat1, plat2, shopA, shopA2, shopB]

  it('cộng dồn freeship + sàn + mỗi shop một mã', () => {
    let codes: string[] = []
    for (const x of [ship1, plat1, shopA, shopB]) codes = toggleVoucherCode(codes, x, all)
    expect(codes).toEqual(['FREESHIP1', 'SAN1', 'SHOPA', 'SHOPB'])
  })

  it('mã mới cùng loại thay mã cũ', () => {
    const start = ['FREESHIP1', 'SAN1', 'SHOPA']
    expect(toggleVoucherCode(start, ship2, all)).toEqual(['SAN1', 'SHOPA', 'SHIP2'])
    expect(toggleVoucherCode(start, plat2, all)).toEqual(['FREESHIP1', 'SHOPA', 'SAN2'])
    expect(toggleVoucherCode(start, shopA2, all)).toEqual(['FREESHIP1', 'SAN1', 'SHOPA2'])
  })

  it('bấm lại mã đang chọn thì bỏ chọn', () => {
    expect(toggleVoucherCode(['SAN1', 'SHOPA'], plat1, all)).toEqual(['SHOPA'])
  })
})

describe('mergeCheckoutVouchers', () => {
  it('mã trong ví đè mã công khai và bỏ mã đã dùng', () => {
    const merged = mergeCheckoutVouchers(
      [v('a1'), v('USED', { isUsed: true })],
      [v('A1', { isCollected: false }), v('PUB')],
    )
    expect(merged.map((x) => [x.voucherCode, x.isCollected])).toEqual([
      ['a1', true],
      ['PUB', false],
    ])
  })
})
