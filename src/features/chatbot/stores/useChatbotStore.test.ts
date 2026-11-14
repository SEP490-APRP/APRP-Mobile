jest.mock('@/services/chatbot.service', () => ({
  chatbotService: {
    sendMessage: jest.fn(),
    getChatHistory: jest.fn(),
    clearChatHistory: jest.fn(),
  },
}))
jest.mock('@/lib/queryClient', () => ({
  queryClient: { invalidateQueries: jest.fn() },
}))
jest.mock('@/features/cart/hooks/useCartQueries', () => ({
  cartKeys: { all: ['cart'] },
}))

import { queryClient } from '@/lib/queryClient'
import { chatbotService, type AiItemOption, type ChatbotMessageResponse } from '@/services/chatbot.service'
import { useChatbotStore } from './useChatbotStore'

const service = chatbotService as jest.Mocked<typeof chatbotService>
const invalidate = queryClient.invalidateQueries as jest.Mock

const item = (itemId: number, name: string, extra: Partial<AiItemOption> = {}): AiItemOption => ({
  itemType: 'PRODUCT',
  itemId,
  name,
  ...extra,
})
const res = (type: ChatbotMessageResponse['type'], extra: Partial<ChatbotMessageResponse> = {}) =>
  ({ type, message: '', ...extra }) as ChatbotMessageResponse

const state = () => useChatbotStore.getState()
const lastMessage = () => state().messages[state().messages.length - 1]

beforeEach(() => {
  jest.clearAllMocks()
  state().reset()
  state().setScreenOpen(true)
})

describe('sendMessage', () => {
  it('thêm tin người dùng và phản hồi của bot, tải lại giỏ khi giỏ thay đổi', async () => {
    service.sendMessage.mockResolvedValue(res('CART_UPDATED', { message: 'Đã thêm' }))

    await state().sendMessage('  Mua 2kg cà chua  ')

    expect(service.sendMessage).toHaveBeenCalledWith({ message: 'Mua 2kg cà chua' })
    expect(lastMessage().content).toBe('Đã thêm')
    expect(invalidate).toHaveBeenCalledTimes(1)
    expect(state().isLoading).toBe(false)
  })

  it('bỏ qua khi bot đang trả lời hoặc tin nhắn rỗng', async () => {
    await state().sendMessage('   ')
    useChatbotStore.setState({ isLoading: true })
    await state().sendMessage('Xin chào')

    expect(service.sendMessage).not.toHaveBeenCalled()
  })

  it('hiện lỗi trong khung chat khi API thất bại', async () => {
    service.sendMessage.mockRejectedValue({ data: { message: 'Máy chủ bận' } })

    await state().sendMessage('Xin chào')

    expect(lastMessage().status).toBe('error')
    expect(lastMessage().content).toBe('Máy chủ bận')
    expect(state().isLoading).toBe(false)
  })

  it('đếm tin chưa đọc khi người dùng đã rời màn chat', async () => {
    service.sendMessage.mockResolvedValue(res('TEXT', { message: 'Chào' }))
    state().setScreenOpen(false)

    await state().sendMessage('Xin chào')
    expect(state().unreadCount).toBe(1)

    state().setScreenOpen(true)
    expect(state().unreadCount).toBe(0)
  })
})

describe('selectOption', () => {
  it('gửi id và loại sản phẩm, không gửi số thứ tự như app cũ', async () => {
    service.sendMessage.mockResolvedValue(res('CART_UPDATED'))

    await state().selectOption(item(5, 'Cà chua', { unit: 'kg' }), 2)

    expect(service.sendMessage).toHaveBeenCalledWith({
      selectedOptionId: 5,
      selectedOptionType: 'PRODUCT',
      selectedQuantity: 2,
    })
  })
})

describe('addMultipleToCart', () => {
  it('báo thành công khi tất cả các món vào giỏ', async () => {
    service.sendMessage.mockResolvedValue(res('CART_UPDATED'))

    const added = await state().addMultipleToCart([item(1, 'Cà chua'), item(2, 'Rau muống')])

    expect(added).toBe(2)
    expect(lastMessage().content).toContain('Đã thêm 2 món')
    expect(invalidate).toHaveBeenCalledTimes(1)
  })

  it('liệt kê món lỗi, kể cả lỗi trả về với HTTP 200', async () => {
    service.sendMessage
      .mockResolvedValueOnce(res('CART_UPDATED'))
      .mockResolvedValueOnce(res('ERROR', { message: 'Hết hàng' }))
      .mockRejectedValueOnce(new Error('mạng lỗi'))

    const added = await state().addMultipleToCart([item(1, 'Cà chua'), item(2, 'Rau muống'), item(3, 'Gừng')])

    expect(added).toBe(1)
    expect(lastMessage().content).toContain('1/3')
    expect(lastMessage().content).toContain('Rau muống, Gừng')
  })

  it('không báo thành công và không tải lại giỏ khi không món nào vào giỏ', async () => {
    service.sendMessage.mockResolvedValue(res('ERROR', { message: 'Không thể thêm vào giỏ hàng' }))

    const added = await state().addMultipleToCart([item(1, 'Cà chua')])

    expect(added).toBe(0)
    expect(lastMessage().status).toBe('error')
    expect(invalidate).not.toHaveBeenCalled()
  })

  it('bỏ qua món hết hàng', async () => {
    service.sendMessage.mockResolvedValue(res('CART_UPDATED'))

    await state().addMultipleToCart([item(1, 'Cà chua'), item(2, 'Gừng', { isOutOfStock: true })])

    expect(service.sendMessage).toHaveBeenCalledTimes(1)
    expect(state().isLoading).toBe(false)
  })
})

describe('clearHistory', () => {
  it('giữ nguyên hội thoại và ném lỗi khi API thất bại', async () => {
    service.sendMessage.mockResolvedValue(res('TEXT', { message: 'Chào' }))
    await state().sendMessage('Xin chào')
    const before = state().messages
    service.clearChatHistory.mockRejectedValue(new Error('lỗi'))

    await expect(state().clearHistory()).rejects.toThrow('lỗi')

    expect(state().messages).toEqual(before)
  })

  it('xóa hội thoại khi API thành công', async () => {
    service.sendMessage.mockResolvedValue(res('TEXT', { message: 'Chào' }))
    await state().sendMessage('Xin chào')
    service.clearChatHistory.mockResolvedValue()

    await state().clearHistory()

    expect(state().messages).toHaveLength(1)
    expect(lastMessage().id).toBe('welcome-msg')
  })
})

describe('reset khi đổi tài khoản', () => {
  it('xóa tin nhắn của tài khoản trước', async () => {
    service.sendMessage.mockResolvedValue(res('TEXT', { message: 'Đơn #1 của bạn' }))
    await state().sendMessage('Đơn của tôi')

    state().reset()

    expect(state().messages).toHaveLength(1)
    expect(lastMessage().id).toBe('welcome-msg')
  })

  it('bỏ phản hồi về muộn của tài khoản trước', async () => {
    let resolve!: (value: ChatbotMessageResponse) => void
    service.sendMessage.mockReturnValue(new Promise((r) => (resolve = r)))
    const pending = state().sendMessage('Đơn của tôi')

    state().reset()
    resolve(res('TEXT', { message: 'Đơn #1 của bạn' }))
    await pending

    expect(state().messages).toHaveLength(1)
    expect(state().isLoading).toBe(false)
  })

  it('bỏ lịch sử về muộn của tài khoản trước', async () => {
    let resolve!: (value: Awaited<ReturnType<typeof chatbotService.getChatHistory>>) => void
    service.getChatHistory.mockReturnValue(new Promise((r) => (resolve = r)))
    const pending = state().loadHistory()

    state().reset()
    resolve([{ id: 1, role: 'user', content: 'cũ', createdAt: '2026-01-01T00:00:00' }])
    await pending

    expect(lastMessage().id).toBe('welcome-msg')
  })
})
