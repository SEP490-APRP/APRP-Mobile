import type { ProductCreationRequest, ProductResponse } from '@/services/product.types'

/** Form đăng bán nông sản, chuyển từ productForm.schema.ts (zod) bản web. */
export const PRODUCT_UNITS = ['kg', 'hộp', 'bó', 'túi', 'trái', 'thùng'] as const

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export interface ProductFormValues {
  name: string
  categoryId?: number
  unit: string
  price: string
  stock: string
  expiryDate: string
  discountPercent: string
  description: string
}

export type ProductFormErrors = Partial<Record<keyof ProductFormValues | 'image', string>>

/** YYYY-MM-DD theo giờ máy. */
export function isoDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export function addDays(days: number, from = new Date()): string {
  const d = new Date(from)
  d.setDate(d.getDate() + days)
  return isoDate(d)
}

/** Các mốc hạn dùng chọn nhanh thay cho ô chọn ngày của web. */
export const EXPIRY_PRESETS = [3, 7, 10, 14, 30] as const

export function emptyProductForm(now = new Date()): ProductFormValues {
  return {
    name: '',
    categoryId: undefined,
    unit: 'kg',
    price: '',
    stock: '',
    expiryDate: addDays(10, now),
    discountPercent: '0',
    description: '',
  }
}

export function productToForm(p: ProductResponse): ProductFormValues {
  const categoryId = typeof p.category === 'object' && p.category ? p.category.categoryId : p.categoryId
  return {
    name: p.productName || p.name || '',
    categoryId,
    unit: p.unit || 'kg',
    price: String(p.sellingPrice ?? p.price ?? ''),
    stock: String(p.stockQuantity ?? p.stock ?? ''),
    expiryDate: p.expiryDate?.slice(0, 10) || addDays(7),
    discountPercent: String(p.discountPercent ?? 0),
    description: p.description ?? '',
  }
}

/** Chỉ giữ chữ số (bàn phím số vẫn cho dán chữ). */
export const digitsOnly = (s: string) => s.replace(/\D/g, '')

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export function validateProductForm(v: ProductFormValues, today = isoDate(new Date())): ProductFormErrors {
  const e: ProductFormErrors = {}
  if (v.name.trim().length < 3) e.name = 'Tên nông sản cần ít nhất 3 ký tự'
  else if (v.name.trim().length > 100) e.name = 'Tên nông sản tối đa 100 ký tự'
  if (!v.categoryId) e.categoryId = 'Chọn danh mục cho nông sản'
  if (!v.unit) e.unit = 'Chọn đơn vị bán'
  const price = Number(v.price)
  if (!v.price || !Number.isInteger(price) || price <= 0) e.price = 'Giá bán phải là số nguyên lớn hơn 0'
  const stock = Number(v.stock)
  if (!v.stock || !Number.isInteger(stock) || stock <= 0) e.stock = 'Số lượng phải là số nguyên lớn hơn 0'
  if (!DATE_RE.test(v.expiryDate) || Number.isNaN(new Date(v.expiryDate).getTime()))
    e.expiryDate = 'Ngày hết hạn có dạng NNNN-TT-NN'
  else if (v.expiryDate < today) e.expiryDate = 'Ngày hết hạn không được ở quá khứ'
  const discount = Number(v.discountPercent || 0)
  if (!Number.isFinite(discount) || discount < 0 || discount > 100) e.discountPercent = 'Giảm giá từ 0 đến 100%'
  if (v.description.length > 2000) e.description = 'Mô tả tối đa 2000 ký tự'
  return e
}

export function toProductRequest(v: ProductFormValues): ProductCreationRequest {
  return {
    productName: v.name.trim(),
    categoryId: Number(v.categoryId),
    unit: v.unit,
    sellingPrice: Number(v.price),
    stockQuantity: Number(v.stock),
    expiryDate: v.expiryDate,
    discountPercent: Number(v.discountPercent || 0),
    description: v.description.trim() || undefined,
  }
}

/** Giá sau giảm để xem trước. */
export const discountedPrice = (price: number, percent: number) => Math.round(price * (1 - (percent || 0) / 100))

export const MAX_PRODUCT_IMAGES = 8

const codeOf = (err: unknown): number | undefined => {
  const e = err as { data?: { code?: unknown }; response?: { data?: { code?: unknown } } } | null
  const code = e?.data?.code ?? e?.response?.data?.code
  return typeof code === 'number' ? code : undefined
}

/**
 * Câu báo lỗi khi tải ảnh nông sản, như ProductImageGalleryModal bản web:
 * 3022 là AI kiểm duyệt từ chối ảnh, 3024 là đã đủ 8 ảnh.
 */
export function imageUploadMessage(err: unknown, message: string): string {
  const code = codeOf(err)
  const m = message.toLowerCase()
  if (code === 3024 || m.includes('3024') || m.includes('tối đa 8') || m.includes('maximum of 8'))
    return `Mỗi sản phẩm chỉ có tối đa ${MAX_PRODUCT_IMAGES} ảnh. Xoá bớt ảnh cũ rồi thêm ảnh mới nhé.`
  if (code === 3022 || /3022|nông sản|agricultural|cồn|alcohol/.test(m))
    return 'AI thấy ảnh chưa phù hợp: cần ảnh chụp nông sản tươi thật, không phải đồ uống có cồn, đồ ăn chế biến sẵn hay đồ vật.'
  return message || 'Chưa tải được ảnh lên. Thử lại nhé.'
}

/** Kiểm tra ảnh chọn từ máy trước khi tải lên. */
export function imageProblem(asset: { mimeType?: string | null; fileSize?: number | null }): string | undefined {
  if (asset.mimeType && !IMAGE_TYPES.includes(asset.mimeType)) return 'Chỉ nhận ảnh JPEG, PNG hoặc WebP'
  if (asset.fileSize && asset.fileSize > MAX_IMAGE_BYTES) return 'Ảnh vượt quá 5MB, chọn ảnh nhỏ hơn nhé'
  return undefined
}
