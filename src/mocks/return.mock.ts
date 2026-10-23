import type { ReturnRequestResponse } from '@/services/return.types'

export const mockDisputes: ReturnRequestResponse[] = [
  {
    id: 501,
    orderId: 10244,
    productName: 'Cam Sành Mọng Nước Hàm Yên (10kg)',
    refundAmount: 220000,
    reason: 'Trái cây bị dập nát quá nhiều khi vận chuyển xa, không sử dụng được phần lớn',
    status: 'DISPUTED',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    buyerName: 'Hoàng Anh Dũng',
    buyerPhone: '0912888999',
    shopName: 'Nhà Vườn Cam Sành',
    shopPhone: '0977665544',
    shopResponse: 'Vườn đã đóng gói xốp cẩn thận, nghi do bên đơn vị vận chuyển làm rơi.',
    evidence:
      'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?auto=format&fit=crop&w=600&q=80;https://images.unsplash.com/photo-1557800636-894a64c1696f?auto=format&fit=crop&w=600&q=80',
    adminRemark: 'Chờ đối chiếu bằng chứng ảnh chụp của bên mua và bên bán',
  },
  {
    id: 502,
    orderId: 10289,
    productName: 'Túi Mù Rau Củ Hữu Cơ Đà Lạt 5kg',
    refundAmount: 79000,
    reason: 'Giao thiếu 1 loại nấm đùi gà so với mô tả gói combo',
    status: 'PENDING',
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    buyerName: 'Nguyễn Bích Thảo',
    buyerPhone: '0988112233',
    shopName: 'Nông Trại Xanh Đà Lạt',
    shopPhone: '0909000111',
    shopResponse: 'Vườn đồng ý gửi bù sản phẩm vào đơn kế tiếp hoặc hoàn tiền phần thiếu.',
    evidence:
      'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80',
  },
]
