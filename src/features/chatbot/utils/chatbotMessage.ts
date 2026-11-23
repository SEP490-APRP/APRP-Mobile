import type { ChatbotMessageResponse, ChatHistoryItem } from '@/services/chatbot.types'

/** Giới hạn của BE (@Size(max = 2000) trong ChatbotMessageRequest). */
export const MAX_MESSAGE_LENGTH = 2000
/** Chỉ hiện bộ đếm khi gần chạm giới hạn, giống app cũ. */
const COUNTER_THRESHOLD = 100

const BUYER_SUGGESTIONS = [
  'Đơn hàng của tôi tới đâu rồi?',
  'Mua lại đơn hàng cũ gần nhất',
  'Flash rescue nông sản giảm giá hôm nay',
  'Dấu chân xanh của tôi',
  'Lịch nông sản mùa vụ tháng này',
  'Gợi ý thực đơn cho người tiểu đường',
  'Rau củ bị dập úng đổi trả sao?',
  'Gợi ý combo 100k cho gia đình',
  'Có bắp cải nấu món gì ngon?',
  'Hộp bí ẩn có rau gì hôm nay?',
  'Hôm nay có voucher freeship nào không?',
  'Nông sản xấu mã có an toàn không?',
  'Mẹo bảo quản rau củ tươi lâu',
  'Gặp nhân viên tư vấn',
]

export const CHATBOT_SUGGESTIONS: Record<'buyer' | 'shop' | 'shipper', string[]> = {
  buyer: BUYER_SUGGESTIONS,
  shop: [
    'Cách đăng bán nông sản mới',
    'Tạo voucher cho shop',
    'Tạo túi mù giải cứu',
    'Ghép combo bữa ăn',
    'Xử lý đơn hàng nhà vườn',
    'Viết bài góc nhà vườn',
    'Mẹo bảo quản rau củ tươi lâu',
    'Gặp nhân viên tư vấn',
  ],
  shipper: [
    'Bật nhận đơn thế nào?',
    'Xác nhận lấy hàng ra sao?',
    'Xem đơn đang giao',
    'Tiền COD xử lý thế nào?',
    'Cập nhật hồ sơ tài xế',
    'Gặp nhân viên tư vấn',
  ],
}

export type ChatbotMessage = Omit<ChatbotMessageResponse, 'type' | 'message' | 'timestamp'> & {
  id: string
  sender: 'user' | 'assistant'
  content: string
  timestamp: Date
  status: 'sent' | 'error'
  responseType?: ChatbotMessageResponse['type']
}

export const WELCOME_MESSAGE: ChatbotMessage = {
  id: 'welcome-msg',
  sender: 'assistant',
  content:
    'Chào bạn! Mình là **CapNong Copilot** 🌱\n\nMình có thể hỗ trợ bạn về **nông sản, đơn hàng, ưu đãi** và **cách dùng ứng dụng**. Bạn có thể gõ câu hỏi hoặc chọn một gợi ý bên dưới nhé!',
  timestamp: new Date(),
  status: 'sent',
  responseType: 'TEXT',
}

let sequence = 0
const nextId = (prefix: string) => `${prefix}-${Date.now()}-${++sequence}`

function toDate(value?: string): Date {
  const date = value ? new Date(value) : new Date()
  return Number.isNaN(date.getTime()) ? new Date() : date
}

export function createUserMessage(content: string): ChatbotMessage {
  return { id: nextId('usr'), sender: 'user', content, timestamp: new Date(), status: 'sent' }
}

export function createErrorMessage(content: string): ChatbotMessage {
  return { id: nextId('err'), sender: 'assistant', content, timestamp: new Date(), status: 'error', responseType: 'ERROR' }
}

export function toBotMessage(res: ChatbotMessageResponse): ChatbotMessage {
  const { type, message, timestamp, ...cards } = res
  return {
    ...cards,
    id: nextId('bot'),
    sender: 'assistant',
    content: message || '',
    timestamp: toDate(timestamp),
    status: type === 'ERROR' ? 'error' : 'sent',
    responseType: type,
  }
}

/** Lịch sử trên server chỉ lưu nội dung chữ, nên tin nhắn cũ không có thẻ tương tác. */
export function toHistoryMessage(item: ChatHistoryItem): ChatbotMessage {
  return {
    id: `hist-${item.id}`,
    sender: item.role === 'user' ? 'user' : 'assistant',
    content: item.content,
    timestamp: toDate(item.createdAt),
    status: 'sent',
    responseType: 'TEXT',
  }
}

/**
 * Tóm tắt kết quả thêm nhiều món vào giỏ.
 * BE báo thất bại bằng type ERROR/NAVIGATION với HTTP 200, nên `rejection` giữ phản hồi đó để hiện đúng lý do.
 */
export function summarizeBulkAdd(
  total: number,
  failedNames: string[],
  rejection?: ChatbotMessageResponse,
): ChatbotMessage {
  const added = total - failedNames.length
  if (added === 0) {
    const content = rejection?.message || 'Chưa thêm được món nào vào giỏ hàng. Vui lòng thử lại!'
    return rejection?.navigation
      ? { ...createErrorMessage(content), status: 'sent', responseType: rejection.type, navigation: rejection.navigation }
      : createErrorMessage(content)
  }
  return {
    id: nextId('bot-bulk'),
    sender: 'assistant',
    content:
      failedNames.length === 0
        ? `🎉 Đã thêm ${added} món nông sản vào giỏ hàng của bạn thành công!`
        : `Đã thêm ${added}/${total} món vào giỏ hàng. Chưa thêm được: ${failedNames.join(', ')}.`,
    timestamp: new Date(),
    status: 'sent',
    responseType: 'NAVIGATION',
    navigation: { url: '/cart', label: 'Mở giỏ hàng ngay' },
  }
}

/** Tách **chữ đậm**. Bot chỉ dùng in đậm và xuống dòng nên không cần thư viện markdown. */
export function splitBold(content: string): { text: string; bold: boolean }[] {
  return content
    .split(/(\*\*.*?\*\*)/g)
    .filter(Boolean)
    .map((part) =>
      part.length > 4 && part.startsWith('**') && part.endsWith('**')
        ? { text: part.slice(2, -2), bold: true }
        : { text: part, bold: false },
    )
}

/** Số ký tự còn lại để hiện bộ đếm; null khi còn xa giới hạn. */
export function charactersLeft(text: string): number | null {
  const left = MAX_MESSAGE_LENGTH - text.length
  return left < COUNTER_THRESHOLD ? left : null
}

export function canSendMessage(text: string, isLoading: boolean): boolean {
  const length = text.trim().length
  return length > 0 && length <= MAX_MESSAGE_LENGTH && !isLoading
}
