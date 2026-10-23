import { comboToCard, mysteryToCard } from '@/features/combo/utils/comboCards'
import type { BuildCombo } from '@/services/combo.types'
import type { MysteryBox } from '@/services/mysteryBox.types'
import type { ProductResponse } from '@/services/product.types'
import { listingStatus, type ListingTone } from './shopStats'

/**
 * Danh sách tin đăng của Nhà vườn, chuyển từ pages/farmer/Products.tsx:
 * gộp nông sản lẻ, combo và túi mù vào một danh sách để lọc, tìm và sửa/xoá.
 */
export type ListingKind = 'SINGLE' | 'COMBO' | 'MYSTERY_BOX'
export type ListingStatusKey = 'ACTIVE' | 'PENDING' | 'REJECTED' | 'INACTIVE'

export interface ShopListing {
  key: string
  kind: ListingKind
  id: number
  name: string
  image?: string
  category: string
  price: number
  unit: string
  stock: number
  sold?: number
  expiryDate?: string
  statusKey: ListingStatusKey
  status: { label: string; tone: ListingTone }
  rejectReason?: string
}

export const LISTING_KIND_LABEL: Record<ListingKind, string> = {
  SINGLE: 'Nông sản',
  COMBO: 'Combo',
  MYSTERY_BOX: 'Túi mù',
}

export const LISTING_STATUS_FILTERS: readonly { key: 'ALL' | ListingStatusKey; label: string }[] = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'ACTIVE', label: 'Đang bán' },
  { key: 'PENDING', label: 'Chờ duyệt' },
  { key: 'REJECTED', label: 'Bị từ chối' },
  { key: 'INACTIVE', label: 'Tạm dừng' },
]

export const LISTING_KIND_FILTERS: readonly { key: 'ALL' | ListingKind; label: string }[] = [
  { key: 'ALL', label: 'Mọi loại' },
  { key: 'SINGLE', label: 'Nông sản' },
  { key: 'COMBO', label: 'Combo' },
  { key: 'MYSTERY_BOX', label: 'Túi mù' },
]

/** Quy trạng thái BE về 4 nhóm lọc. Combo/túi mù không có status thì dựa vào isActive. */
export function statusKeyOf(status?: string | null, isActive?: boolean): ListingStatusKey {
  switch (status?.toUpperCase()) {
    case 'ACTIVE':
    case 'APPROVED':
      return 'ACTIVE'
    case 'PENDING':
      return 'PENDING'
    case 'REJECTED':
      return 'REJECTED'
    case undefined:
    case '':
      return isActive === false ? 'INACTIVE' : 'ACTIVE'
    default:
      return 'INACTIVE'
  }
}

export const productImageOf = (p: ProductResponse) =>
  p.primaryImageUrl || p.imageUrl || p.image || p.images?.find((i) => i.isPrimary)?.imageUrl || p.images?.[0]?.imageUrl

export const productCategoryName = (p: ProductResponse) =>
  typeof p.category === 'object' && p.category ? p.category.name : p.category || 'Nông sản'

export function productToListing(p: ProductResponse): ShopListing {
  const id = Number(p.productId ?? p.id)
  return {
    key: `p${id}`,
    kind: 'SINGLE',
    id,
    name: p.productName || p.name || 'Nông sản',
    image: productImageOf(p),
    category: productCategoryName(p),
    price: Number(p.sellingPrice ?? p.price ?? 0),
    unit: p.unit || 'kg',
    stock: Number(p.stockQuantity ?? p.stock ?? 0),
    expiryDate: p.expiryDate,
    statusKey: statusKeyOf(p.status),
    status: listingStatus(p.status),
    rejectReason: p.rejectReason || undefined,
  }
}

export function comboToListing(x: BuildCombo): ShopListing {
  const c = comboToCard(x)
  return {
    key: c.key,
    kind: 'COMBO',
    id: c.id,
    name: c.name,
    image: c.imageUrl,
    category: c.portion,
    price: c.price,
    unit: 'combo',
    stock: c.stock,
    sold: c.sold,
    statusKey: statusKeyOf(x.status),
    status: listingStatus(x.status),
  }
}

export function boxToListing(x: MysteryBox): ShopListing {
  const c = mysteryToCard(x)
  return {
    key: c.key,
    kind: 'MYSTERY_BOX',
    id: c.id,
    name: c.name,
    image: c.imageUrl,
    category: 'Túi ngẫu nhiên',
    price: c.price,
    unit: 'túi',
    stock: c.stock,
    sold: c.sold,
    statusKey: statusKeyOf(x.status, x.isActive),
    status: listingStatus(x.status, x.isActive),
  }
}

export function buildShopListings(
  products: readonly ProductResponse[] = [],
  combos: readonly BuildCombo[] = [],
  boxes: readonly MysteryBox[] = [],
): ShopListing[] {
  return [...products.map(productToListing), ...combos.map(comboToListing), ...boxes.map(boxToListing)].filter(
    (l) => l.id > 0,
  )
}

const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase()

export function filterListings(
  list: readonly ShopListing[],
  { status = 'ALL', kind = 'ALL', query = '' }: { status?: string; kind?: string; query?: string },
): ShopListing[] {
  const q = fold(query.trim())
  return list.filter(
    (l) =>
      (status === 'ALL' || l.statusKey === status) &&
      (kind === 'ALL' || l.kind === kind) &&
      (!q || fold(l.name).includes(q) || fold(l.category).includes(q) || String(l.id) === q.replace(/^#/, '')),
  )
}

/** Đếm theo nhóm trạng thái để hiện trên chip lọc. */
export function countByStatus(list: readonly ShopListing[]): Record<'ALL' | ListingStatusKey, number> {
  const counts = { ALL: list.length, ACTIVE: 0, PENDING: 0, REJECTED: 0, INACTIVE: 0 }
  for (const l of list) counts[l.statusKey] += 1
  return counts
}

/** Hạn dùng còn bao nhiêu ngày (âm là đã quá hạn). */
export function daysUntil(date?: string, now = new Date()): number | undefined {
  if (!date) return undefined
  const d = new Date(`${date.slice(0, 10)}T00:00:00`)
  if (Number.isNaN(d.getTime())) return undefined
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((d.getTime() - today.getTime()) / 86_400_000)
}
