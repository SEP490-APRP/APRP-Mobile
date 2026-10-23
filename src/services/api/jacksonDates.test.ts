import { dateArrayToIso, normalizeJacksonDates } from './jacksonDates'

describe('normalizeJacksonDates', () => {
  it('đổi LocalDate và LocalDateTime dạng mảng thành chuỗi ISO', () => {
    expect(dateArrayToIso([2026, 10, 26])).toBe('2026-10-26')
    expect(dateArrayToIso([2026, 1, 5, 9, 3])).toBe('2026-01-05T09:03:00')
    expect(dateArrayToIso([2026, 1, 5, 9, 3, 7, 123000000])).toBe('2026-01-05T09:03:07.123')
  })

  it('chỉ đổi khoá ngày, kể cả lồng trong trang kết quả', () => {
    const data = {
      code: 1000,
      result: {
        content: [{ productId: 1, expiryDate: [2026, 10, 26], images: [{ createdAt: [2026, 10, 1, 8, 0, 0] }] }],
        cartItemIds: [2024, 5, 6],
      },
    }
    const out = normalizeJacksonDates(data)
    expect(out.result.content[0].expiryDate).toBe('2026-10-26')
    expect(out.result.content[0].images[0].createdAt).toBe('2026-10-01T08:00:00')
    expect(out.result.cartItemIds).toEqual([2024, 5, 6])
  })

  it('giữ nguyên chuỗi ngày sẵn có và giá trị null', () => {
    const data = { createdAt: '2026-10-23T09:33:42', updatedAt: null }
    expect(normalizeJacksonDates(data)).toEqual({ createdAt: '2026-10-23T09:33:42', updatedAt: null })
  })
})
