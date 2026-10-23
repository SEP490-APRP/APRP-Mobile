import type { ChatMessage, Conversation } from '@/types/chat'

export const mockConversationsList: Conversation[] = [
  {
    id: 'conv-1',
    otherUserId: 101,
    otherUserName: 'Nông Trại Hữu Cơ Đà Lạt (Chủ vườn)',
    otherUserRole: 'SHOP',
    otherUserAvatar:
      'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=120&q=80',
    lastMessage: 'Admin duyệt giúp em sản phẩm bơ 034 mới với ạ!',
    lastMessageTime: '10:45',
    unreadCount: 2,
  },
  {
    id: 'conv-2',
    otherUserId: 102,
    otherUserName: 'Trần Văn Mạnh (Shipper Đà Lạt)',
    otherUserRole: 'SHIPPER',
    otherUserAvatar:
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
    lastMessage: 'Đơn #10452 em đã giao xong và thu tiền mặt, nhờ admin đối soát.',
    lastMessageTime: '09:20',
    unreadCount: 1,
  },
  {
    id: 'conv-3',
    otherUserId: 103,
    otherUserName: 'Lê Thu Hương (Khách mua sỉ)',
    otherUserRole: 'BUYER',
    otherUserAvatar:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
    lastMessage: 'Em muốn đặt 200kg bắp cải giải cứu cho bếp ăn từ thiện.',
    lastMessageTime: 'Hôm qua',
    unreadCount: 0,
  },
]

export const mockChatHistories: Record<number, ChatMessage[]> = {
  101: [
    {
      id: 'm1',
      senderId: 101,
      receiverId: 1,
      content: 'Chào admin, vườn mình vừa thu hoạch thêm 500kg cà chua và bơ 034.',
      createdAt: '10:30',
    },
    {
      id: 'm2',
      senderId: 1,
      receiverId: 101,
      content:
        'Chào nhà vườn, bạn đã đăng ảnh thực tế và giấy chứng nhận VietGAP lên hệ thống chưa?',
      createdAt: '10:35',
    },
    {
      id: 'm3',
      senderId: 101,
      receiverId: 1,
      content: 'Admin duyệt giúp em sản phẩm bơ 034 mới với ạ!',
      createdAt: '10:45',
    },
  ],
  102: [
    {
      id: 'm4',
      senderId: 102,
      receiverId: 1,
      content: 'Đơn #10452 em đã giao xong và thu tiền mặt, nhờ admin đối soát.',
      createdAt: '09:20',
    },
  ],
  103: [
    {
      id: 'm5',
      senderId: 103,
      receiverId: 1,
      content: 'Em muốn đặt 200kg bắp cải giải cứu cho bếp ăn từ thiện.',
      createdAt: '14:15',
    },
  ],
}
