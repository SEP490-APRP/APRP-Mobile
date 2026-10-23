import type { NotificationItem } from '@/services/notification.types'

export const mockNotifications: NotificationItem[] = [
  {
    id: 1,
    title: 'CapNong mở đợt trợ giá vận chuyển nông sản mùa khô 2026',
    message:
      'Toàn bộ các đơn hàng nông sản xấu mã giao trong tuần này được trợ giá 20.000đ/đơn từ quỹ hỗ trợ nhà vườn.',
    receiverTypes: ['BUYER', 'SHOP', 'SHIPPER'],
    receiverType: 'Tất cả người dùng',
    createdAt: '2026-03-31T08:00:00Z',
    createAt: '2026-03-31T08:00:00Z',
  },
  {
    id: 2,
    title: 'Cập nhật chính sách đối soát tiền mặt COD cho Shipper',
    message:
      'Shipper có thể nộp tiền mặt COD đối soát trực tiếp tại các Hub trung chuyển vào 17h hàng ngày.',
    receiverTypes: ['SHIPPER'],
    receiverType: 'SHIPPER',
    createdAt: '2026-04-01T15:00:00Z',
    createAt: '2026-04-01T15:00:00Z',
  },
]
