import {
  canSendMessage,
  charactersLeft,
  MAX_MESSAGE_LENGTH,
  splitBold,
  summarizeBulkAdd,
  toBotMessage,
  toHistoryMessage,
} from './chatbotMessage'

describe('splitBold', () => {
  it('tách chữ đậm và chữ thường', () => {
    expect(splitBold('Đã thêm **2 kg Cà chua** vào giỏ')).toEqual([
      { text: 'Đã thêm ', bold: false },
      { text: '2 kg Cà chua', bold: true },
      { text: ' vào giỏ', bold: false },
    ])
  })

  it('giữ nguyên dấu ** chưa đóng', () => {
    expect(splitBold('Giá **rẻ')).toEqual([{ text: 'Giá **rẻ', bold: false }])
  })
})

describe('charactersLeft', () => {
  it('chỉ trả số khi gần chạm giới hạn', () => {
    expect(charactersLeft('a')).toBeNull()
    expect(charactersLeft('a'.repeat(MAX_MESSAGE_LENGTH - 50))).toBe(50)
  })
})

describe('canSendMessage', () => {
  it('chặn tin rỗng, quá dài hoặc khi bot đang trả lời', () => {
    expect(canSendMessage('   ', false)).toBe(false)
    expect(canSendMessage('a'.repeat(MAX_MESSAGE_LENGTH + 1), false)).toBe(false)
    expect(canSendMessage('Xin chào', true)).toBe(false)
    expect(canSendMessage('Xin chào', false)).toBe(true)
  })
})

describe('toBotMessage', () => {
  it('giữ dữ liệu thẻ và đánh dấu lỗi khi type là ERROR', () => {
    const navigation = { url: '/cart', label: 'Giỏ hàng' }
    expect(toBotMessage({ type: 'NAVIGATION', message: 'Xem', navigation }).navigation).toEqual(navigation)
    expect(toBotMessage({ type: 'ERROR', message: 'Lỗi' }).status).toBe('error')
  })

  it('không vỡ khi thời gian không hợp lệ', () => {
    const { timestamp } = toBotMessage({ type: 'TEXT', message: '', timestamp: 'không phải ngày' })
    expect(Number.isNaN(timestamp.getTime())).toBe(false)
  })
})

describe('toHistoryMessage', () => {
  it('đổi role của BE sang người gửi', () => {
    const base = { id: 1, content: 'x', createdAt: '2026-01-01T00:00:00' }
    expect(toHistoryMessage({ ...base, role: 'user' }).sender).toBe('user')
    expect(toHistoryMessage({ ...base, role: 'assistant' }).sender).toBe('assistant')
  })
})

describe('summarizeBulkAdd', () => {
  it('giữ nút đăng nhập hoặc điều hướng khi BE từ chối mà không phải lỗi', () => {
    const navigation = { url: '/login', label: 'Đăng nhập' }
    const msg = summarizeBulkAdd(1, ['Cà chua'], { type: 'NAVIGATION', message: 'Vui lòng đăng nhập', navigation })
    expect(msg.status).toBe('sent')
    expect(msg.navigation).toEqual(navigation)
  })

  it('dùng câu mặc định khi không có phản hồi nào từ BE', () => {
    const msg = summarizeBulkAdd(2, ['A', 'B'])
    expect(msg.status).toBe('error')
    expect(msg.content).toContain('Chưa thêm được')
  })
})
