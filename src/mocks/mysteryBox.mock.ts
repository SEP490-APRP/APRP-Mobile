import type { MysteryBox } from '@/services/mysteryBox.types'

export const mockMysteryBoxes: MysteryBox[] = [
  {
    mysteryId: 601,
    id: 601,
    boxType: 'Túi Mù Nông Sản Giải Cứu Đà Lạt (3kg)',
    price: 59000,
    description:
      'Hộp bất ngờ chứa từ 3-4 loại củ quả hữu cơ Đà Lạt: cà rốt, bơ, cà chua, khoai lang ngọt lành.',
    imageUrl:
      'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=400&q=80',
    shopId: 101,
    status: 'ACTIVE',
  },
  {
    mysteryId: 602,
    id: 602,
    boxType: 'Túi Mù Trái Cây Miền Tây Tươi Mát (5kg)',
    price: 89000,
    description: 'Gồm cam sành nám, bưởi da xanh vỏ rám, thanh long ruột đỏ thu hái tươi.',
    imageUrl:
      'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=400&q=80',
    shopId: 102,
    status: 'ACTIVE',
  },
]
