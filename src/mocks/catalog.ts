import images from './catalog-images.json'
export type Product = {
  id: string
  name: string
  price: number
  original: number
  image: string
  category: string
  farm: string
  region: string
  flaw: string
  score: number
  stock: number
  rescued: number
  unit: string
}
const photo = (term: string) =>
  images.find((i) =>
    `${i['data-alt'] || ''} ${i.alt || ''}`.toLowerCase().includes(term.toLowerCase()),
  )?.src || ''
export const products: Product[] = [
  {
    id: 'carrot',
    name: 'Cà rốt Đà Lạt hai nhánh giòn ngọt',
    price: 19000,
    original: 35000,
    image: photo('intertwined'),
    category: 'Củ quả',
    farm: 'Nông trại Chú Bảy',
    region: 'Đà Lạt',
    flaw: 'Chẻ nhánh',
    score: 96,
    stock: 85,
    rescued: 72,
    unit: 'kg',
  },
  {
    id: 'tomato',
    name: 'Cà chua bi hữu cơ méo mó ngọt đậm',
    price: 26000,
    original: 45000,
    image: photo('tomatoes'),
    category: 'Củ quả',
    farm: 'Hợp tác xã Đơn Dương',
    region: 'Lâm Đồng',
    flaw: 'Méo lệch cỡ',
    score: 98,
    stock: 42,
    rescued: 88,
    unit: 'kg',
  },
  {
    id: 'potato',
    name: 'Khoai lang mật củ cong siêu ngọt',
    price: 15000,
    original: 30000,
    image: photo('sweet potatoes'),
    category: 'Củ quả',
    farm: 'Vườn anh Hoàng',
    region: 'Gia Lai',
    flaw: 'Dáng cong queo',
    score: 94,
    stock: 120,
    rescued: 60,
    unit: 'kg',
  },
  {
    id: 'pomelo',
    name: 'Bưởi da xanh vỏ rám ruột hồng mọng',
    price: 38000,
    original: 60000,
    image: photo('pomelo'),
    category: 'Trái cây',
    farm: 'Miệt vườn Bến Tre',
    region: 'Bến Tre',
    flaw: 'Da rám nắng',
    score: 97,
    stock: 50,
    rescued: 75,
    unit: 'kg',
  },
  {
    id: 'beetroot',
    name: 'Củ dền đỏ Đơn Dương đậm vị giàu sắt',
    price: 22000,
    original: 38000,
    image: photo('intertwined'),
    category: 'Củ quả',
    farm: 'Nông trại Đơn Dương',
    region: 'Lâm Đồng',
    flaw: 'Củ nhỏ lệch size',
    score: 95,
    stock: 60,
    rescued: 80,
    unit: 'kg',
  },
  {
    id: 'cabbage',
    name: 'Bắp cải xanh cuốn chặt lá xoăn tươi',
    price: 18000,
    original: 32000,
    image: photo('Nông dân'),
    category: 'Rau ăn lá',
    farm: 'Vườn cô Lan',
    region: 'Đà Lạt',
    flaw: 'Bẹ ngoài hơi sém',
    score: 96,
    stock: 90,
    rescued: 68,
    unit: 'kg',
  },
  {
    id: 'spinach',
    name: 'Cải bó xôi hữu cơ giòn ngọt mọng nước',
    price: 24000,
    original: 42000,
    image: photo('tomatoes'),
    category: 'Rau ăn lá',
    farm: 'HTX Xanh Đà Lạt',
    region: 'Đà Lạt',
    flaw: 'Lá không đều cỡ',
    score: 97,
    stock: 45,
    rescued: 85,
    unit: 'kg',
  },
  {
    id: 'pumpkin',
    name: 'Bí đỏ hồ lô da rám ruột vàng dẻo quánh',
    price: 16000,
    original: 28000,
    image: photo('sweet potatoes'),
    category: 'Củ quả',
    farm: 'Vườn Bác Sáu',
    region: 'Đắk Lắk',
    flaw: 'Vỏ nám sần sùi',
    score: 95,
    stock: 75,
    rescued: 62,
    unit: 'kg',
  },
]
export const combos: Product[] = [
  {
    id: 'mystery',
    name: 'Túi mù nông sản 5kg',
    price: 79000,
    original: 199000,
    image: photo('Nông dân Việt Nam'),
    category: 'Combo',
    farm: 'Các nhà vườn liên kết',
    region: 'Theo mùa',
    flaw: '5kg rau củ ngẫu nhiên',
    score: 95,
    stock: 30,
    rescued: 65,
    unit: 'túi',
  },
  {
    id: 'green',
    name: 'Combo Rau Xanh 5 bữa',
    price: 189000,
    original: 245000,
    image: photo('tomatoes'),
    category: 'Combo',
    farm: 'Các nhà vườn liên kết',
    region: 'Đà Lạt',
    flaw: 'Cho 2–3 người',
    score: 97,
    stock: 25,
    rescued: 50,
    unit: 'combo',
  },
  {
    id: 'kitchen',
    name: 'Combo Bếp Xanh 10kg',
    price: 399000,
    original: 520000,
    image: photo('intertwined'),
    category: 'Combo',
    farm: 'Các nhà vườn liên kết',
    region: 'Theo mùa',
    flaw: 'Cho quán ăn & bếp',
    score: 96,
    stock: 15,
    rescued: 40,
    unit: 'combo',
  },
]
export const allProducts = [...products, ...combos]
export const money = (value: number) => new Intl.NumberFormat('vi-VN').format(value) + 'đ'
export type Cart = Record<string, number>
export function changeQuantity(cart: Cart, id: string, delta: number): Cart {
  const item = allProducts.find((p) => p.id === id)
  if (!item) return cart
  const next = { ...cart }
  const count = Math.max(0, Math.min(item.stock, (next[id] || 0) + delta))
  if (count) next[id] = count
  else delete next[id]
  return next
}
export function filterProducts(query: string, category: string, sort: string): Product[] {
  const normalize = (s: string) =>
    s
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .toLowerCase()
  const term = normalize(query.trim())
  const result = products.filter(
    (p) =>
      (category === 'Tất cả' ||
        p.category === category ||
        p.region === category ||
        (category === 'Hữu cơ' && p.name.includes('hữu cơ'))) &&
      normalize(`${p.name} ${p.category} ${p.farm} ${p.region}`).includes(term),
  )
  if (sort === 'price-asc') result.sort((a, b) => a.price - b.price)
  if (sort === 'price-desc') result.sort((a, b) => b.price - a.price)
  if (sort === 'stock') result.sort((a, b) => a.stock - b.stock)
  if (sort === 'name-asc') result.sort((a, b) => a.name.localeCompare(b.name, 'vi'))
  if (sort === 'name-desc') result.sort((a, b) => b.name.localeCompare(a.name, 'vi'))
  if (sort === 'best-selling') result.sort((a, b) => b.rescued - a.rescued)
  if (sort === 'ai-score') result.sort((a, b) => b.score - a.score)
  return result
}
