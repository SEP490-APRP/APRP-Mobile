import {
  greenImpactSummary,
  guidanceLines,
  formatShortDateTime,
  isFreeshipVoucher,
  itemPrice,
  seasonalBadge,
  seasonalMonth,
  signedMoney,
} from './chatbotCards'

describe('itemPrice', () => {
  it('chỉ có giá gốc khi đang giảm giá', () => {
    expect(itemPrice({ price: 100, salePrice: 80 })).toEqual({ current: 80, original: 100 })
    expect(itemPrice({ price: 100, salePrice: 100 })).toEqual({ current: 100, original: undefined })
    expect(itemPrice({})).toEqual({ current: 0, original: undefined })
  })
})

describe('isFreeshipVoucher', () => {
  it('nhận theo loại voucher hoặc mã', () => {
    expect(isFreeshipVoucher({ voucherType: 'FREE_SHIPPING', code: 'ABC' })).toBe(true)
    expect(isFreeshipVoucher({ code: 'freeship10' })).toBe(true)
    expect(isFreeshipVoucher({ voucherType: 'PERCENT', code: 'GIAM10' })).toBe(false)
  })
})

describe('seasonalMonth', () => {
  it('bỏ chữ Tháng thừa', () => {
    expect(seasonalMonth({ currentMonth: 'Tháng 10' })).toBe('10')
    expect(seasonalMonth({ currentMonth: 7 })).toBe('7')
  })

  it('dùng tháng hiện tại khi BE không trả', () => {
    expect(seasonalMonth({ currentMonth: '' }, new Date(2026, 10, 5))).toBe('11')
  })
})

describe('seasonalBadge', () => {
  it('chọn nhãn theo mốc thời gian', () => {
    expect(seasonalBadge({ isPastMonth: true })).toBe('Đã qua vụ rộ')
    expect(seasonalBadge({ isFutureMonth: true })).toBe('Mùa vụ sắp tới')
    expect(seasonalBadge({})).toBe('Đang chính vụ')
  })
})

describe('guidanceLines', () => {
  it('nhận biết các bước và bỏ dòng trống', () => {
    expect(guidanceLines('Mở shop\n\n1. Vào tab\n2) Viết bài\n• Xuất bản\n- Xong')).toEqual([
      { text: 'Mở shop', isStep: false },
      { text: 'Vào tab', isStep: true },
      { text: 'Viết bài', isStep: true },
      { text: 'Xuất bản', isStep: true },
      { text: 'Xong', isStep: true },
    ])
  })
})

describe('greenImpactSummary', () => {
  it('nhận cả hai cách đặt tên trường', () => {
    expect(greenImpactSummary({ totalRescuedWeight: 20, co2SavedKg: 5 }).rescuedKg).toBe(20)
    expect(greenImpactSummary({ totalRescuedKg: 20, totalCo2SavedKg: 5 }).co2Kg).toBe(5)
  })

  it('tự tính CO₂ và số cây khi BE không trả', () => {
    const summary = greenImpactSummary({ totalRescuedKg: 20 })
    expect(summary.co2Kg).toBeCloseTo(36)
    expect(summary.trees).toBe(2)
  })
})

describe('signedMoney', () => {
  it('thêm dấu theo chiều tiền vào/ra ví', () => {
    expect(signedMoney(50000)).toBe('+50.000đ')
    expect(signedMoney(-20000)).toBe('−20.000đ')
    expect(signedMoney(0)).toBe('0đ')
  })
})

describe('formatShortDateTime', () => {
  it('hiện giờ và ngày của hạn chót', () => {
    expect(formatShortDateTime('2026-11-06T14:05:00')).toBe('14:05 06/11')
  })

  it('trả chuỗi rỗng khi không có hoặc sai ngày', () => {
    expect(formatShortDateTime()).toBe('')
    expect(formatShortDateTime('khong-phai-ngay')).toBe('')
  })
})
