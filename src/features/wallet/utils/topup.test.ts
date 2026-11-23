import { parseAmount, suggestTopup, topupAmountError } from './topup'

describe('nạp ví', () => {
  it('đọc số tiền từ chuỗi có dấu chấm', () => {
    expect(parseAmount('215.000')).toBe(215000)
    expect(parseAmount('')).toBe(0)
  })

  it('số tiền ngoài giới hạn thì báo lỗi', () => {
    expect(topupAmountError(5000)).toBeDefined()
    expect(topupAmountError(30_000_000)).toBeDefined()
    expect(topupAmountError(100_000)).toBeUndefined()
  })

  it('gợi ý số tiền còn thiếu, làm tròn lên nghìn và không dưới mức tối thiểu', () => {
    expect(suggestTopup(15_500)).toBe(16_000)
    expect(suggestTopup(2_000)).toBe(10_000)
    expect(suggestTopup(0)).toBe(0)
  })
})
