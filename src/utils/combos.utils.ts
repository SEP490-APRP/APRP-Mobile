export interface ComboCardItem {
  id: string
  realId?: number
  itemType?: string
  name: string
  image: string
  badgeDiscount: string
  badgeWeight: string
  badgeHighlight: string
  category: string
  portion: string
  feature: string
  price: number
  original: number
  unit: string
  rating: number
  reviews: number
  sold: number
  stock: number
}

export function normalizeComboCategory(kind?: string | null): string {
  const normalized = (kind ?? '').toLowerCase()
  if (normalized.includes('mystery') || normalized.includes('box')) return 'Túi mù'
  return 'Combo'
}

export function isMeaningfulComboName(name?: string | null): boolean {
  const value = (name ?? '').trim()
  if (!value) return false

  const generic = ['combo', 'túi mù', 'tui mu', 'combo nông sản', 'túi mù nông sản', 'mystery box']
  return !generic.includes(value.toLowerCase())
}

export function mapMysteryBoxToCard(
  mystery: {
    mysteryId?: number
    id?: number
    boxType?: string
    imageUrl?: string
    price?: number | string
    description?: string
    note?: string
    totalQuantity?: number | string
    soldQuantity?: number | string
  },
  fallbackImage = '',
): ComboCardItem {
  const price = Number(mystery.price) || 79000
  const totalQuantity = Number(mystery.totalQuantity) || 0
  const soldQuantity = Number(mystery.soldQuantity) || 0

  return {
    id: `mystery-${mystery.mysteryId ?? mystery.id ?? 'new'}`,
    realId: mystery.mysteryId ?? mystery.id,
    itemType: 'MYSTERY_BOX',
    name: mystery.boxType || 'Túi mù nông sản',
    image: mystery.imageUrl || fallbackImage,
    badgeDiscount: '-50%',
    badgeWeight: 'Túi ngẫu nhiên',
    badgeHighlight: 'Túi mù',
    category: 'Túi mù',
    portion: mystery.note || 'Gia đình 2–3 người',
    feature: mystery.description || 'Nông sản tươi ngon ngẫu nhiên thu hoạch trong ngày',
    price,
    original: price * 1.5,
    unit: 'túi',
    rating: 4.9,
    reviews: 120,
    sold: soldQuantity,
    stock: Math.max(0, totalQuantity - soldQuantity) || 20,
  }
}

export function mapComboToCard(
  combo: {
    comboId?: number
    id?: number
    comboName?: string
    imageUrl?: string
    price?: number | string
    description?: string
    type?: string
    mealType?: string
    region?: string
    totalQuantity?: number | string
    soldQuantity?: number | string
  },
  fallbackImage = '',
): ComboCardItem {
  const price = Number(combo.price) || 129000
  const totalQuantity = Number(combo.totalQuantity) || 0
  const soldQuantity = Number(combo.soldQuantity) || 0

  return {
    id: `combo-${combo.comboId ?? combo.id ?? 'new'}`,
    realId: combo.comboId ?? combo.id,
    itemType: 'BUILD_COMBO',
    name: combo.comboName || 'Combo nông sản',
    image: combo.imageUrl || fallbackImage,
    badgeDiscount: '-35%',
    badgeWeight: combo.region || 'Combo mùa vụ',
    badgeHighlight: normalizeComboCategory(combo.type || combo.mealType || 'combo'),
    category: 'Combo',
    portion: combo.mealType || 'Gia đình 3–4 người',
    feature: combo.description || 'Gói nông sản dinh dưỡng tươi ngon từ vườn liên kết',
    price,
    original: price * 1.4,
    unit: 'combo',
    rating: 4.9,
    reviews: 85,
    sold: soldQuantity,
    stock: Math.max(0, totalQuantity - soldQuantity) || 15,
  }
}
