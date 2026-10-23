import type { BuildCombo, BuildComboCreationRequest } from '@/services/combo.types'
import type { MysteryBox, MysteryBoxCreationRequest } from '@/services/mysteryBox.types'
import type { ProductResponse } from '@/services/product.types'

/**
 * Form Combo và Túi mù, chuyển từ pages/farmer/ComboBuilder.tsx và BlindBoxTool.tsx:
 * cả hai đều là "gói" nhiều nông sản trong kho, chỉ khác vài ô riêng.
 */
export type BundleKind = 'COMBO' | 'MYSTERY_BOX'

export const isBundleKind = (v: unknown): v is BundleKind => v === 'COMBO' || v === 'MYSTERY_BOX'

export interface BundleItem {
  productId: number
  productName: string
  unit: string
  /** Tồn kho hiện có của nông sản (chưa tính phần đã giữ cho gói cũ) */
  stockAvailable: number
  price: number
  /** Số lượng nông sản trong mỗi gói */
  quantity: number
}

export interface BundleFormValues {
  name: string
  price: string
  totalQuantity: string
  mealType: string
  type: string
  region: string
  note: string
  description: string
}

export type BundleFormErrors = Partial<Record<keyof BundleFormValues | 'items', string>>

export const MEAL_TYPE_OPTIONS = [
  { value: 'DINNER', label: 'Bữa cơm gia đình' },
  { value: 'LUNCH', label: 'Bữa trưa nhanh' },
  { value: 'BREAKFAST', label: 'Bữa sáng' },
  { value: 'SNACK', label: 'Ăn nhẹ, tráng miệng' },
] as const

export const BUNDLE_NAME_MAX: Record<BundleKind, number> = { COMBO: 100, MYSTERY_BOX: 50 }

export const BUNDLE_LABEL: Record<BundleKind, string> = { COMBO: 'combo', MYSTERY_BOX: 'túi mù' }

export function emptyBundleForm(kind: BundleKind): BundleFormValues {
  return kind === 'COMBO'
    ? {
        name: '',
        price: '149000',
        totalQuantity: '20',
        mealType: 'DINNER',
        type: '',
        region: 'Đà Lạt & Lâm Đồng',
        note: '',
        description: '',
      }
    : {
        name: '',
        price: '79000',
        totalQuantity: '10',
        mealType: '',
        type: '',
        region: '',
        note: 'Khoảng 5kg, rau củ quả tươi thu hoạch trong ngày',
        description: '',
      }
}

export function comboToBundleForm(c: BuildCombo): BundleFormValues {
  return {
    name: c.comboName || c.name || '',
    price: String(c.price ?? ''),
    totalQuantity: String(c.totalQuantity ?? ''),
    mealType: c.mealType || 'DINNER',
    type: c.type ?? '',
    region: c.region ?? '',
    note: '',
    description: c.description ?? '',
  }
}

export function boxToBundleForm(m: MysteryBox): BundleFormValues {
  return {
    name: m.boxType || '',
    price: String(m.price ?? ''),
    totalQuantity: String(m.totalQuantity ?? ''),
    mealType: '',
    type: '',
    region: '',
    note: m.note ?? '',
    description: m.description ?? '',
  }
}

export const productIdOf = (p: ProductResponse) => Number(p.productId ?? p.id)
export const productPrice = (p: ProductResponse) => Number(p.sellingPrice ?? p.price ?? 0)
export const productStock = (p: ProductResponse) => Number(p.stockQuantity ?? p.stock ?? 0)

export function productToBundleItem(p: ProductResponse, quantity = 1): BundleItem {
  return {
    productId: productIdOf(p),
    productName: p.productName || p.name || `Nông sản #${productIdOf(p)}`,
    unit: p.unit || 'kg',
    stockAvailable: productStock(p),
    price: productPrice(p),
    quantity,
  }
}

type RawItem = {
  productId: number
  productName?: string
  unit?: string
  price?: number
  sellingPrice?: number
  quantity?: number
  productQuantity?: number
}

/** Ghép món trong gói (BE trả) với kho hiện tại để biết tồn kho và giá. */
export function bundleItemsFrom(raw: readonly RawItem[] = [], products: readonly ProductResponse[] = []): BundleItem[] {
  return raw.map((it) => {
    const id = Number(it.productId)
    const p = products.find((x) => productIdOf(x) === id)
    return {
      productId: id,
      productName: it.productName || p?.productName || p?.name || `Nông sản #${id}`,
      unit: it.unit || p?.unit || 'kg',
      stockAvailable: p ? productStock(p) : 0,
      price: Number(it.sellingPrice ?? it.price ?? (p ? productPrice(p) : 0)) || 0,
      quantity: Number(it.productQuantity ?? it.quantity ?? 1) || 1,
    }
  })
}

/** Tổng giá mua lẻ các món trong một gói. */
export const marketValue = (items: readonly BundleItem[]) => items.reduce((s, it) => s + it.price * it.quantity, 0)

/** Khách được lợi bao nhiêu % so với mua lẻ (BlindBoxTool bản web). */
export function bundleSaving(price: number, market: number): { percent: number; overpriced: boolean } {
  if (market <= 0 || price <= 0) return { percent: 0, overpriced: false }
  if (price > market) return { percent: 0, overpriced: true }
  return { percent: Math.round(((market - price) / market) * 100), overpriced: false }
}

export interface PreviousBundle {
  totalQuantity?: number
  soldQuantity?: number
  items?: readonly RawItem[]
}

/**
 * Lượng nông sản gói cũ đang giữ (phần chưa bán), cộng lại khi kiểm tra tồn kho lúc sửa,
 * giống ComboBuilder bản web.
 */
export function heldByPrevious(prev: PreviousBundle | undefined, productId: number): number {
  if (!prev) return 0
  const unsold = Math.max(0, (Number(prev.totalQuantity) || 0) - (Number(prev.soldQuantity) || 0))
  const old = prev.items?.find((it) => Number(it.productId) === productId)
  return old ? (Number(old.productQuantity ?? old.quantity) || 0) * unsold : 0
}

export interface StockCheck {
  productId: number
  needed: number
  available: number
  short: boolean
}

export function checkStock(items: readonly BundleItem[], totalQuantity: number, prev?: PreviousBundle): StockCheck[] {
  return items.map((it) => {
    const needed = it.quantity * Math.max(0, totalQuantity || 0)
    const available = it.stockAvailable + heldByPrevious(prev, it.productId)
    return { productId: it.productId, needed, available, short: needed > available }
  })
}

const positiveInt = (s: string) => /^\d+$/.test(s) && Number(s) > 0

export function validateBundle(
  kind: BundleKind,
  v: BundleFormValues,
  items: readonly BundleItem[],
  prev?: PreviousBundle,
): BundleFormErrors {
  const e: BundleFormErrors = {}
  const label = BUNDLE_LABEL[kind]
  const name = v.name.trim()
  if (name.length < 3) e.name = `Tên ${label} cần ít nhất 3 ký tự`
  else if (name.length > BUNDLE_NAME_MAX[kind]) e.name = `Tên ${label} tối đa ${BUNDLE_NAME_MAX[kind]} ký tự`
  if (!positiveInt(v.price)) e.price = 'Giá bán phải là số nguyên lớn hơn 0'
  if (!positiveInt(v.totalQuantity)) e.totalQuantity = 'Số gói phát hành từ 1 trở lên'
  if (v.description.length > 2000) e.description = 'Mô tả tối đa 2000 ký tự'
  if (items.length === 0) e.items = `Chọn ít nhất 1 nông sản trong kho để đóng vào ${label}`
  else if (!e.totalQuantity) {
    const short = checkStock(items, Number(v.totalQuantity), prev).find((c) => c.short)
    if (short) {
      const it = items.find((i) => i.productId === short.productId)!
      e.items = `"${it.productName}" không đủ hàng: cần ${short.needed} ${it.unit}, kho còn ${short.available} ${it.unit}`
    }
  }
  return e
}

const opt = (s: string) => s.trim() || undefined
const itemsPayload = (items: readonly BundleItem[]) =>
  items.map((it) => ({ productId: it.productId, productQuantity: it.quantity }))

export function toComboRequest(
  v: BundleFormValues,
  items: readonly BundleItem[],
  imageUrl?: string,
): BuildComboCreationRequest {
  return {
    comboName: v.name.trim(),
    price: Number(v.price),
    totalQuantity: Number(v.totalQuantity),
    mealType: v.mealType || undefined,
    type: opt(v.type),
    region: opt(v.region),
    description: opt(v.description),
    imageUrl,
    items: itemsPayload(items),
  }
}

export function toBoxRequest(
  v: BundleFormValues,
  items: readonly BundleItem[],
  imageUrl?: string,
): MysteryBoxCreationRequest {
  return {
    boxType: v.name.trim(),
    price: Number(v.price),
    totalQuantity: Number(v.totalQuantity),
    note: opt(v.note),
    description: opt(v.description),
    imageUrl,
    items: itemsPayload(items),
  }
}

/** Combo / túi mù đã có, đổi về một dạng chung cho màn sửa. */
export interface BundleDetail {
  values: BundleFormValues
  rawItems: RawItem[]
  imageUrl?: string
  previous: PreviousBundle
}

export function bundleDetailFromCombo(c: BuildCombo): BundleDetail {
  const rawItems = (c.items ?? []).map((it) => ({ ...it, productId: Number(it.productId) }))
  return {
    values: comboToBundleForm(c),
    rawItems,
    imageUrl: c.imageUrl,
    previous: { totalQuantity: c.totalQuantity, soldQuantity: c.soldQuantity, items: rawItems },
  }
}

export function bundleDetailFromBox(m: MysteryBox): BundleDetail {
  const rawItems = (m.items ?? []).map((it) => ({ ...it, productId: Number(it.productId) }))
  return {
    values: boxToBundleForm(m),
    rawItems,
    imageUrl: m.imageUrl,
    previous: { totalQuantity: m.totalQuantity, soldQuantity: m.soldQuantity, items: rawItems },
  }
}
