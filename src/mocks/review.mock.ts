import type { ReviewResponse } from '@/services/review.types'

export const mockReviews: ReviewResponse[] = [
  {
    id: 801,
    productId: 701,
    shopId: 101,
    buyerId: 301,
    fullName: 'Trần Thị Mai',
    ratingStar: 5,
    comment:
      'Bơ vỏ ngoài hơi sần sùi nhưng bóc ra cơm vàng óng, dẻo quánh béo ngậy. Ăn rất ngon và an tâm vì không thuốc bảo quản!',
    evidence:
      'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=300&q=80',
    replyFromShop: 'Cảm ơn chị Mai đã ủng hộ nông sản thật chất của nhà vườn Đà Lạt ạ!',
    createAt: '2026-04-02T14:30:00Z',
    likeCount: 12,
    dislikeCount: 0,
    currentUserReaction: null,
  },
  {
    id: 802,
    productId: 701,
    shopId: 101,
    buyerId: 302,
    fullName: 'Nguyễn Văn Hoàng',
    ratingStar: 5,
    comment:
      'Giao nhanh, bơ già đều 2 ngày là chín tới. Giá 45k/kg quá rẻ so với chất lượng bơ 034!',
    createAt: '2026-04-03T09:15:00Z',
    likeCount: 6,
    dislikeCount: 0,
    currentUserReaction: null,
  },
  {
    id: 803,
    productId: 702,
    shopId: 102,
    buyerId: 301,
    fullName: 'Lê Minh Quân',
    ratingStar: 5,
    comment: 'Cà rốt dáng cong cong nhưng tươi rói, giòn ngọt, ép nước màu cam đậm rất thơm!',
    replyFromShop:
      'HTX Bảo Lộc cảm ơn quý khách. Chúng tôi cam kết rau củ thu hoạch tươi mới mỗi ngày!',
    createAt: '2026-04-03T11:00:00Z',
    likeCount: 8,
    dislikeCount: 0,
    currentUserReaction: null,
  },
]
