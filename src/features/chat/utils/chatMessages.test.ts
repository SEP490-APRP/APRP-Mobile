import type { ChatMessage } from '@/types/chat'
import { canSendChat, chatTimeLabel, conversationPreview, isMineMessage, sortMessages } from './chatMessages'

const message = (id: number, sentAt: string, senderId = 1): ChatMessage => ({ id, sentAt, senderId, receiverId: 2, content: 'x' })

describe('sortMessages', () => {
  it('xếp từ cũ đến mới và không đổi mảng gốc', () => {
    const list = [message(2, '2026-11-05T10:00:00'), message(1, '2026-11-05T09:00:00')]
    expect(sortMessages(list).map((m) => m.id)).toEqual([1, 2])
    expect(list[0].id).toBe(2)
  })
})

describe('isMineMessage', () => {
  it('so sánh được id dạng chuỗi của phiên đăng nhập', () => {
    expect(isMineMessage(message(1, '', 7), '7')).toBe(true)
    expect(isMineMessage(message(1, '', 7), '8')).toBe(false)
    expect(isMineMessage(message(1, '', 7), undefined)).toBe(false)
  })
})

describe('canSendChat', () => {
  it('chặn tin rỗng và khi đang gửi', () => {
    expect(canSendChat('   ', false)).toBe(false)
    expect(canSendChat('Chào', true)).toBe(false)
    expect(canSendChat('Chào', false)).toBe(true)
  })
})

describe('conversationPreview', () => {
  it('có câu thay thế khi chưa có tin nhắn', () => {
    expect(conversationPreview({ id: 1, otherUserId: 2, otherUserName: 'A' })).toBe('Chưa có tin nhắn')
    expect(conversationPreview({ id: 1, otherUserId: 2, otherUserName: 'A', lastMessage: 'Chào' })).toBe('Chào')
  })
})

describe('chatTimeLabel', () => {
  it('không vỡ khi thiếu hoặc sai thời gian', () => {
    expect(chatTimeLabel(undefined)).toBe('')
    expect(chatTimeLabel('không phải ngày')).toBe('')
  })

  it('ngày khác thì hiện ngày', () => {
    expect(chatTimeLabel('2026-11-01T10:00:00', new Date('2026-11-05T10:00:00'))).toContain('2026')
  })
})
