import type { BuildCombo } from '@/services/combo.types'
import type { MysteryBox } from '@/services/mysteryBox.types'

/**
 * Thẻ Combo / Túi mù, chuyển từ utils/combos.utils.ts bản web.
 * Giá gốc là giá ước tính khi mua lẻ (web nhân 1,4 với combo và 1,5 với túi mù), BE chưa trả trường này.
 */
export type ComboKind = 'BUILD_COMBO' | 'MYSTERY_BOX'

export interface ComboCard {
  key: string
  id: number
  kind: ComboKind
  name: string
  imageUrl?: string
  tag: string
  portion: string
  description: string
  price: number
  original: number
  unit: string
  sold: number
  stock: number
  shopId?: number
  shopName?: string
}

const GENERIC_NAMES = ['combo', 'túi mù', 'tui mu', 'combo nông sản', 'túi mù nông sản', 'mystery box']

/** Bỏ các bản ghi tên chung chung (dữ liệu thử của nhà vườn), như bản web */
export function isMeaningfulComboName(name?: string | null): boolean {
  const value = (name ?? '').trim()
  return !!value && !GENERIC_NAMES.includes(value.toLowerCase())
}

const remaining = (total?: number | string, sold?: number | string) =>
  Math.max(0, (Number(total) || 0) - (Number(sold) || 0))

const MEAL_LABELS: Record<string, string> = {
  BREAKFAST: 'Bữa sáng',
  LUNCH: 'Bữa trưa',
  DINNER: 'Bữa tối',
  SNACK: 'Ăn vặt',
}

export const mealLabel = (meal?: string | null) => (meal ? (MEAL_LABELS[meal] ?? meal) : undefined)

export function comboToCard(c: BuildCombo): ComboCard {
  const price = Number(c.price) || 0
  return {
    key: `combo-${c.comboId ?? c.id}`,
    id: Number(c.comboId ?? c.id),
    kind: 'BUILD_COMBO',
    name: c.comboName || c.name || 'Combo nông sản',
    imageUrl: c.imageUrl,
    tag: c.region || 'Combo mùa vụ',
    portion: mealLabel(c.mealType) || 'Gia đình 3–4 người',
    description: c.description || 'Gói nông sản dinh dưỡng tươi ngon từ vườn liên kết',
    price,
    original: Math.round(price * 1.4),
    unit: 'combo',
    sold: Number(c.soldQuantity) || 0,
    stock: remaining(c.totalQuantity, c.soldQuantity),
    shopId: c.shop?.id,
    shopName: c.shop?.shopName,
  }
}

export function mysteryToCard(m: MysteryBox): ComboCard {
  const price = Number(m.price) || 0
  return {
    key: `mystery-${m.mysteryId ?? m.id}`,
    id: Number(m.mysteryId ?? m.id),
    kind: 'MYSTERY_BOX',
    name: m.boxType || 'Túi mù nông sản',
    imageUrl: m.imageUrl,
    tag: 'Túi ngẫu nhiên',
    portion: m.note || 'Gia đình 2–3 người',
    description: m.description || 'Nông sản tươi ngon ngẫu nhiên thu hoạch trong ngày',
    price,
    original: Math.round(price * 1.5),
    unit: 'túi',
    sold: Number(m.soldQuantity) || 0,
    stock: remaining(m.totalQuantity, m.soldQuantity),
    shopId: m.shopId ?? m.shopOwnerId,
    shopName: m.shopName,
  }
}

/** Gộp túi mù và combo, bỏ bản ghi thiếu id hoặc tên chung chung */
export function buildComboCards(mystery: readonly MysteryBox[] = [], combos: readonly BuildCombo[] = []): ComboCard[] {
  return [...mystery.map(mysteryToCard), ...combos.map(comboToCard)].filter(
    (c) => c.id > 0 && isMeaningfulComboName(c.name),
  )
}

export type ComboFilterKind = 'ALL' | ComboKind
export type ComboPrice = 'all' | 'under100' | '100to200' | 'over200'
export type ComboSort = 'featured' | 'price-asc' | 'price-desc' | 'discount' | 'best-selling'

export const COMBO_KINDS: { id: ComboFilterKind; label: string }[] = [
  { id: 'ALL', label: 'Tất cả' },
  { id: 'MYSTERY_BOX', label: 'Túi mù' },
  { id: 'BUILD_COMBO', label: 'Combo' },
]

export const COMBO_PRICES: { id: ComboPrice; label: string }[] = [
  { id: 'all', label: 'Mọi mức giá' },
  { id: 'under100', label: 'Dưới 100k' },
  { id: '100to200', label: '100k – 200k' },
  { id: 'over200', label: 'Trên 200k' },
]

export const COMBO_SORTS: { id: ComboSort; label: string }[] = [
  { id: 'featured', label: 'Nổi bật' },
  { id: 'best-selling', label: 'Bán chạy' },
  { id: 'price-asc', label: 'Giá thấp' },
  { id: 'price-desc', label: 'Giá cao' },
  { id: 'discount', label: 'Tiết kiệm nhất' },
]

const inPrice = (price: number, range: ComboPrice) =>
  range === 'under100'
    ? price < 100_000
    : range === '100to200'
      ? price >= 100_000 && price <= 200_000
      : range === 'over200'
        ? price > 200_000
        : true

export function filterCombos(
  cards: readonly ComboCard[],
  { kind, price, sort }: { kind: ComboFilterKind; price: ComboPrice; sort: ComboSort },
): ComboCard[] {
  const list = cards.filter((c) => (kind === 'ALL' || c.kind === kind) && inPrice(c.price, price))
  if (sort === 'price-asc') list.sort((a, b) => a.price - b.price)
  if (sort === 'price-desc') list.sort((a, b) => b.price - a.price)
  if (sort === 'best-selling') list.sort((a, b) => b.sold - a.sold)
  if (sort === 'discount') list.sort((a, b) => b.original - b.price - (a.original - a.price))
  return list
}

/** Phần trăm đã bán cho thanh tiến độ */
export const soldPercent = (c: Pick<ComboCard, 'sold' | 'stock'>) =>
  c.sold + c.stock > 0 ? Math.min(100, Math.round((c.sold / (c.sold + c.stock)) * 100)) : 0

export const discountLabel = (c: Pick<ComboCard, 'price' | 'original'>) =>
  c.original > c.price ? `-${Math.round(((c.original - c.price) / c.original) * 100)}%` : undefined
