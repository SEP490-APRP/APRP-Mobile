import { isStockShortageError, parseStockShortages } from './stockRules'

describe('stockRules', () => {
  it('phát hiện mã lỗi 5015 hoặc 8002 là lỗi thiếu hàng', () => {
    expect(isStockShortageError({ data: { code: 5015 } })).toBe(true)
    expect(isStockShortageError({ response: { data: { code: 8002 } } })).toBe(true)
    expect(isStockShortageError({ message: 'Sản phẩm trong kho không đủ số lượng' })).toBe(true)
    expect(isStockShortageError({ message: 'Lỗi mạng không xác định' })).toBe(false)
  })

  it('parse danh sách thiếu tồn kho từ mảng result', () => {
    const err = {
      response: {
        data: {
          result: [
            {
              itemType: 'PRODUCT',
              id: 10,
              itemName: 'Bắp cải Đà Lạt',
              requestedQuantity: 5,
              availableQuantity: 2,
            },
          ],
        },
      },
    }
    const parsed = parseStockShortages(err)
    expect(parsed).toHaveLength(1)
    expect(parsed[0].itemName).toBe('Bắp cải Đà Lạt')
    expect(parsed[0].requestedQuantity).toBe(5)
    expect(parsed[0].availableQuantity).toBe(2)
  })

  it('parse từ chuỗi message bullet của backend', () => {
    const err = {
      message: '• [Sản phẩm] "Cà chua bi": Kho còn 2, bạn đặt 5',
    }
    const parsed = parseStockShortages(err)
    expect(parsed).toHaveLength(1)
    expect(parsed[0].itemName).toBe('Cà chua bi')
    expect(parsed[0].availableQuantity).toBe(2)
    expect(parsed[0].requestedQuantity).toBe(5)
  })
})

