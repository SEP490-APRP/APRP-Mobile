import type { ProductResponse } from '@/services/product.types'

export const mockBuyerProducts: ProductResponse[] = [
  {
    id: 701,
    productName: 'Bơ 034 Xấu Mã Ruột Vàng Dẻo',
    price: 45000,
    sellingPrice: 45000,
    salePrice: 45000,
    originalPrice: 65000,
    pricePerKg: 45000,
    discountPercent: 30,
    stock: 250,
    stockKg: 250,
    stockQuantity: 250,
    minOrderKg: 1,
    unit: 'kg',
    category: 'Trái cây giải cứu',
    status: 'ACTIVE',
    shopName: 'Nông Trại Hữu Cơ Đà Lạt',
    shopId: 101,
    shopOwnerId: 101,
    createdAt: '2026-04-01T10:00:00Z',
    primaryImageUrl:
      'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=400&q=80',
    imageUrl:
      'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=400&q=80',
    region: 'Lâm Đồng',
    defectReason: 'Vỏ sần sùi do ong châm tự nhiên, thịt bơ béo dẻo không xơ',
    description:
      'Bơ quả dài 034 thu hoạch chuẩn độ già, vỏ xấu do canh tác thuận tự nhiên không dùng thuốc xịt bóng da. Bơ dẻo vàng ươm, thơm ngậy.',
    images: [
      {
        id: 1,
        imageUrl:
          'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=800&q=80',
        isPrimary: true,
        displayOrder: 1,
      },
      {
        id: 2,
        imageUrl:
          'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
        isPrimary: false,
        displayOrder: 2,
      },
      {
        id: 3,
        imageUrl:
          'https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?auto=format&fit=crop&w=800&q=80',
        isPrimary: false,
        displayOrder: 3,
      },
    ],
  },
  {
    id: 702,
    productName: 'Cà Rốt Đà Lạt Cong Queo Tươi Giòn',
    price: 18000,
    sellingPrice: 18000,
    salePrice: 18000,
    originalPrice: 28000,
    pricePerKg: 18000,
    discountPercent: 35,
    stock: 400,
    stockKg: 400,
    stockQuantity: 400,
    minOrderKg: 1,
    unit: 'kg',
    category: 'Rau củ hữu cơ',
    status: 'ACTIVE',
    shopName: 'HTX Nông Sản Bảo Lộc',
    shopId: 102,
    shopOwnerId: 102,
    createdAt: '2026-04-02T08:30:00Z',
    primaryImageUrl:
      'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=400&q=80',
    imageUrl:
      'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=400&q=80',
    region: 'Lâm Đồng',
    defectReason: 'Dáng củ phân nhánh, cong queo do đất sét tự nhiên, chất lượng ngọt giòn 100%',
    description:
      'Cà rốt trồng tại Đơn Dương, ngọt nước đậm đà, cực kỳ thích hợp ép nước hoặc nấu canh dinh dưỡng.',
    images: [
      {
        id: 4,
        imageUrl:
          'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=800&q=80',
        isPrimary: true,
        displayOrder: 1,
      },
      {
        id: 5,
        imageUrl:
          'https://images.unsplash.com/photo-1582515073490-39981397c445?auto=format&fit=crop&w=800&q=80',
        isPrimary: false,
        displayOrder: 2,
      },
    ],
  },
  {
    id: 703,
    productName: 'Cam Sành Hàm Yên Da Nám Mọng Nước',
    price: 22000,
    sellingPrice: 22000,
    salePrice: 22000,
    originalPrice: 35000,
    pricePerKg: 22000,
    discountPercent: 37,
    stock: 600,
    stockKg: 600,
    stockQuantity: 600,
    minOrderKg: 2,
    unit: 'kg',
    category: 'Trái cây giải cứu',
    status: 'ACTIVE',
    shopName: 'Nông Trại Hữu Cơ Đà Lạt',
    shopId: 101,
    shopOwnerId: 101,
    createdAt: '2026-04-02T11:00:00Z',
    primaryImageUrl:
      'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?auto=format&fit=crop&w=400&q=80',
    imageUrl:
      'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?auto=format&fit=crop&w=400&q=80',
    region: 'Tuyên Quang',
    defectReason: 'Da vỏ bị nám sạm do sương muối tự nhiên, tép cam vàng óng, mọng nước ngọt thanh',
    description:
      'Cam trồng sườn đồi Hàm Yên chuẩn vị, nhiều nước, cực hợp vắt nước uống giải nhiệt hoặc bồi bổ sức khỏe.',
    images: [
      {
        id: 6,
        imageUrl:
          'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?auto=format&fit=crop&w=800&q=80',
        isPrimary: true,
        displayOrder: 1,
      },
    ],
  },
  {
    id: 704,
    productName: 'Cà Chua Beef Đà Lạt Nứt Vỏ Thơm Ngọt',
    price: 19000,
    sellingPrice: 19000,
    salePrice: 19000,
    originalPrice: 30000,
    pricePerKg: 19000,
    discountPercent: 36,
    stock: 350,
    stockKg: 350,
    stockQuantity: 350,
    minOrderKg: 1,
    unit: 'kg',
    category: 'Rau củ hữu cơ',
    status: 'ACTIVE',
    shopName: 'Nông Trại Hữu Cơ Đà Lạt',
    shopId: 101,
    shopOwnerId: 101,
    createdAt: '2026-04-03T09:00:00Z',
    primaryImageUrl:
      'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=400&q=80',
    imageUrl:
      'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=400&q=80',
    region: 'Lâm Đồng',
    defectReason:
      'Vỏ hơi rạn nứt cuống do trời mưa to đột ngột khi quả đang chín, cơm dày ngọt lịm',
    description:
      'Cà chua giống Beef size to, bột nhiều thơm nức, xào nấu canh hoặc làm sốt cực ngon.',
    images: [
      {
        id: 7,
        imageUrl:
          'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=800&q=80',
        isPrimary: true,
        displayOrder: 1,
      },
    ],
  },
  {
    id: 705,
    productName: 'Chuối Laba Đà Lạt Đốm Đồi Mồi Vị Mật',
    price: 25000,
    sellingPrice: 25000,
    salePrice: 25000,
    originalPrice: 38000,
    pricePerKg: 25000,
    discountPercent: 34,
    stock: 500,
    stockKg: 500,
    stockQuantity: 500,
    minOrderKg: 1,
    unit: 'kg',
    category: 'Trái cây giải cứu',
    status: 'ACTIVE',
    shopName: 'HTX Nông Sản Bảo Lộc',
    shopId: 102,
    shopOwnerId: 102,
    createdAt: '2026-04-03T10:30:00Z',
    primaryImageUrl:
      'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=400&q=80',
    imageUrl:
      'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=400&q=80',
    region: 'Lâm Đồng',
    defectReason: 'Vỏ xuất hiện chấm đồi mồi tự nhiên khi tiết mật ngọt nhất',
    description: 'Chuối Laba tiến vua trồng tại vùng đất đỏ bazan, vị dẻo thơm ngát mùi mật ong.',
    images: [
      {
        id: 8,
        imageUrl:
          'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=800&q=80',
        isPrimary: true,
        displayOrder: 1,
      },
    ],
  },
  {
    id: 706,
    productName: 'Củ dền đỏ Đơn Dương đậm vị giàu sắt',
    name: 'Củ dền đỏ Đơn Dương đậm vị giàu sắt',
    price: 22000,
    sellingPrice: 22000,
    salePrice: 22000,
    originalPrice: 38000,
    pricePerKg: 22000,
    discountPercent: 42,
    stock: 60,
    stockKg: 60,
    stockQuantity: 60,
    minOrderKg: 1,
    unit: 'kg',
    category: 'Củ quả',
    status: 'ACTIVE',
    shopName: 'HTX Nông Sản Bảo Lộc',
    shopId: 102,
    shopOwnerId: 102,
    createdAt: '2026-04-03T11:00:00Z',
    primaryImageUrl:
      'https://images.unsplash.com/photo-1528751014936-863e6e7a319c?auto=format&fit=crop&w=400&q=80',
    imageUrl:
      'https://images.unsplash.com/photo-1528751014936-863e6e7a319c?auto=format&fit=crop&w=400&q=80',
    region: 'Lâm Đồng',
    defectReason:
      'Củ nhỏ lệch size tự nhiên, nhiều nước, màu đỏ thắm chứa hàm lượng sắt và vitamin cao',
    description:
      'Củ dền đỏ trồng hữu cơ tại Đơn Dương, vị ngọt thanh mát, màu nước đỏ tím tự nhiên rất thích hợp nấu canh xương, luộc hoặc làm nước ép thanh lọc cơ thể.',
    images: [
      {
        id: 9,
        imageUrl:
          'https://images.unsplash.com/photo-1528751014936-863e6e7a319c?auto=format&fit=crop&w=800&q=80',
        isPrimary: true,
        displayOrder: 1,
      },
    ],
  },
  {
    id: 707,
    productName: 'Bưởi da xanh vỏ rám ruột hồng mọng',
    name: 'Bưởi da xanh vỏ rám ruột hồng mọng',
    price: 38000,
    sellingPrice: 38000,
    salePrice: 38000,
    originalPrice: 60000,
    pricePerKg: 38000,
    discountPercent: 37,
    stock: 50,
    stockKg: 50,
    stockQuantity: 50,
    minOrderKg: 1,
    unit: 'kg',
    category: 'Trái cây',
    status: 'ACTIVE',
    shopName: 'Nông Trại Hữu Cơ Đà Lạt',
    shopId: 101,
    shopOwnerId: 101,
    createdAt: '2026-04-03T12:00:00Z',
    primaryImageUrl:
      'https://images.unsplash.com/photo-1577234286642-fc512a5f8f11?auto=format&fit=crop&w=400&q=80',
    imageUrl:
      'https://images.unsplash.com/photo-1577234286642-fc512a5f8f11?auto=format&fit=crop&w=400&q=80',
    region: 'Bến Tre',
    defectReason:
      'Vỏ rám nắng ngoài da do không dùng túi bọc bóng, tép bưởi hồng tươi, mọng nước ngọt thanh',
    description:
      'Bưởi da xanh chuẩn gốc Bến Tre, vị ngọt đậm đà không đắng chát, tép róc múi căng mọng.',
    images: [
      {
        id: 10,
        imageUrl:
          'https://images.unsplash.com/photo-1577234286642-fc512a5f8f11?auto=format&fit=crop&w=800&q=80',
        isPrimary: true,
        displayOrder: 1,
      },
    ],
  },
  {
    id: 708,
    productName: 'Khoai lang mật củ cong siêu ngọt',
    name: 'Khoai lang mật củ cong siêu ngọt',
    price: 15000,
    sellingPrice: 15000,
    salePrice: 15000,
    originalPrice: 30000,
    pricePerKg: 15000,
    discountPercent: 50,
    stock: 120,
    stockKg: 120,
    stockQuantity: 120,
    minOrderKg: 1,
    unit: 'kg',
    category: 'Củ quả',
    status: 'ACTIVE',
    shopName: 'Nông Trại Hữu Cơ Đà Lạt',
    shopId: 101,
    shopOwnerId: 101,
    createdAt: '2026-04-03T13:00:00Z',
    primaryImageUrl:
      'https://images.unsplash.com/photo-1596097635121-14b63b7a0c19?auto=format&fit=crop&w=400&q=80',
    imageUrl:
      'https://images.unsplash.com/photo-1596097635121-14b63b7a0c19?auto=format&fit=crop&w=400&q=80',
    region: 'Gia Lai',
    defectReason:
      'Dáng củ cong queo do sinh trưởng trong sỏi đá bazan, ruột ứa mật vàng rộm khi nướng hấp',
    description:
      'Khoai lang mật nướng chảy mật thơm nức mũi, nhiều xơ và vitamin, cực kỳ dẻo ngọt.',
    images: [
      {
        id: 11,
        imageUrl:
          'https://images.unsplash.com/photo-1596097635121-14b63b7a0c19?auto=format&fit=crop&w=800&q=80',
        isPrimary: true,
        displayOrder: 1,
      },
    ],
  },
]

export const mockPendingProducts: ProductResponse[] = [
  ...mockBuyerProducts.map((p) => ({ ...p, status: 'PENDING' as const })),
]
