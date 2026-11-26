import type { Product } from './storefrontProduct'

export const CATEGORIES = [
  { id: 'Tất cả', label: 'Tất cả nông sản' },
  { id: 'Rau ăn lá', label: 'Rau ăn lá' },
  { id: 'Củ quả', label: 'Củ quả vườn' },
  { id: 'Trái cây', label: 'Trái cây' },
  { id: 'Hữu cơ', label: 'Hữu cơ' },
  { id: 'Đà Lạt', label: 'Đặc sản Đà Lạt' },
] as const

export const PRICE_RANGES = [
  { id: 'all', label: 'Tất cả mức giá' },
  { id: 'under20', label: 'Dưới 20.000đ', max: 19_999 },
  { id: '20to30', label: '20.000đ – 30.000đ', min: 20_000, max: 30_000 },
  { id: 'over30', label: 'Trên 30.000đ', min: 30_001 },
] as const satisfies readonly { id: string; label: string; min?: number; max?: number }[]
export type PriceRangeId = (typeof PRICE_RANGES)[number]['id']

export const SORT_OPTIONS = [
  { id: 'featured', label: 'Nổi bật' },
  { id: 'price-asc', label: 'Giá tăng dần' },
  { id: 'price-desc', label: 'Giá giảm dần' },
  { id: 'name-asc', label: 'Tên A-Z' },
] as const
export type SortId = (typeof SORT_OPTIONS)[number]['id']

/**
 * Bộ lọc của trang Nông sản tươi. Bản web có thêm Vùng trồng và Điểm AI nhưng chỉ áp dụng
 * cho dữ liệu mẫu (API chưa trả hai trường này), nên mobile chưa đưa vào.
 * Danh mục là chuỗi vì danh sách thật lấy từ API /categories.
 */
export type Filters = { category: string; price: PriceRangeId }

export const ALL_CATEGORIES = 'Tất cả'
export const DEFAULT_FILTERS: Filters = { category: ALL_CATEGORIES, price: 'all' }

export function countActiveFilters(f: Filters): number {
  return (Object.keys(DEFAULT_FILTERS) as (keyof Filters)[]).filter(
    (k) => f[k] !== DEFAULT_FILTERS[k],
  ).length
}

function removeDiacritics(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim()
}

function stripProducePrefix(raw: string): string {
  let s = raw.trim().toLowerCase()
  if (s.includes('/')) {
    s = s.split('/')[0].trim()
  }
  for (const prefix of ['quả ', 'trái ', 'cây ', 'củ ', 'rau ', 'lá ', 'hạt ']) {
    if (s.startsWith(prefix) && s.length > prefix.length) {
      return s.slice(prefix.length).trim()
    }
  }
  return s
}

const PRODUCE_SYNONYM_GROUPS: string[][] = [
  ['nhàu', 'nhau', 'quả nhàu', 'trái nhàu', 'noni'],
  ['dứa', 'thơm', 'khóm'],
  ['bắp', 'ngô', 'bắp mỹ', 'bắp nếp'],
  ['khổ qua', 'mướp đắng'],
  ['dưa leo', 'dưa chuột'],
  ['dưa lưới', 'dưa gang', 'dưa vàng', 'dưa hoàng kim', 'dưa hami'],
  ['dưa lê', 'dưa bở'],
  ['bí đao', 'bí xanh'],
  ['cải bó xôi', 'rau chân vịt'],
  ['bông cải', 'súp lơ'],
  ['chanh dây', 'chanh leo'],
  ['mãng cầu', 'mãng cầu ta', 'mãng cầu xiêm', 'trái na', 'quả na'],
  ['hồng xiêm', 'sa pô chê', 'sapoche'],
  ['đậu phộng', 'lạc', 'củ lạc'],
  ['đậu que', 'đậu cô ve'],
  ['khoai mì', 'củ sắn', 'sắn'],
  ['khoai mỡ', 'khoai từ', 'củ từ'],
  ['củ đậu', 'củ sắn nước'],
  ['củ sen', 'ngó sen', 'hạt sen'],
  ['ngò rí', 'ngò', 'rau mùi'],
  ['ngò gai', 'mùi tàu'],
  ['bạc hà', 'húng lủi'],
  ['xà lách xoong', 'cải xoong'],
  ['cải thìa', 'cải chíp'],
  ['cải xanh', 'cải bẹ xanh'],
  ['mồng tơi', 'mùng tơi', 'rau mồng tơi'],
  ['tắc', 'quất', 'trái tắc', 'quả quất'],
  ['mận', 'quả roi', 'trái roi', 'mận an phước', 'mận hậu'],
  ['hành boa rô', 'boa rô', 'tỏi tây'],
  ['hành tím', 'hành hương'],
  ['cherry', 'anh đào'],
]

export function matchesProduceSearch(
  productName: string,
  categoryName: string,
  farmName: string,
  rawQuery: string,
): boolean {
  const qRaw = rawQuery.trim().toLowerCase()
  if (!qRaw) return true

  const nameLower = productName.toLowerCase()
  const catLower = categoryName.toLowerCase()
  const farmLower = farmName.toLowerCase()
  if (nameLower.includes(qRaw) || catLower.includes(qRaw) || farmLower.includes(qRaw)) return true

  const coreQuery = stripProducePrefix(qRaw)
  const candidates = new Set<string>([qRaw, coreQuery])

  for (const group of PRODUCE_SYNONYM_GROUPS) {
    if (
      group.some(
        (term) =>
          term === coreQuery ||
          term === qRaw ||
          removeDiacritics(term) === removeDiacritics(coreQuery),
      )
    ) {
      for (const term of group) {
        candidates.add(term)
      }
    }
  }

  const nameAsciiTokens = removeDiacritics(nameLower).split(/[^a-z0-9]+/).filter(Boolean)
  const nameAsciiFull = ` ${nameAsciiTokens.join(' ')} `

  for (const cand of candidates) {
    if (!cand) continue
    if (nameLower.includes(cand) || catLower.includes(cand)) {
      if ((cand === 'bắp' || cand === 'bap') && nameLower.includes('bắp cải')) continue
      return true
    }

    const candAscii = removeDiacritics(cand)
    if (!candAscii) continue

    if (candAscii.includes(' ')) {
      if (nameAsciiFull.includes(` ${candAscii} `)) {
        if (candAscii === 'bap' && nameAsciiFull.includes(' bap cai ')) continue
        return true
      }
    } else if (candAscii.length >= 3) {
      if (nameAsciiTokens.includes(candAscii)) {
        if (candAscii === 'bap' && nameAsciiFull.includes(' bap cai ')) continue
        if (candAscii === 'dua' && nameLower.includes('dưa') && (cand === 'dừa' || cand === 'dứa')) continue
        return true
      }
    }
  }

  return false
}

/** Tìm, lọc và sắp xếp phía máy như bản web (hỗ trợ đồng nghĩa vùng miền, không dấu & Vector match IDs). */
export function applyFilters(
  items: readonly Product[],
  query: string,
  filters: Filters,
  sort: SortId,
  visualMatchedIds: readonly string[] = [],
): Product[] {
  const range = PRICE_RANGES.find((r) => r.id === filters.price)
  const min = range && 'min' in range ? range.min : 0
  const max = range && 'max' in range ? range.max : Number.POSITIVE_INFINITY
  const q = query.trim()
  const cat = filters.category.toLowerCase()
  const visualIdSet = new Set(visualMatchedIds)

  const result = items.filter(
    (p) =>
      (!q || visualIdSet.has(p.id) || matchesProduceSearch(p.name, p.category, p.farm, q)) &&
      (filters.category === ALL_CATEGORIES ||
        p.category.toLowerCase().includes(cat) ||
        cat.includes(p.category.toLowerCase())) &&
      p.price >= min &&
      p.price <= max,
  )

  if (sort === 'price-asc') result.sort((a, b) => a.price - b.price)
  else if (sort === 'price-desc') result.sort((a, b) => b.price - a.price)
  else if (sort === 'name-asc') result.sort((a, b) => a.name.localeCompare(b.name, 'vi'))
  else if (sort === 'featured' && visualMatchedIds.length > 0) {
    result.sort((a, b) => {
      const idxA = visualMatchedIds.indexOf(a.id)
      const idxB = visualMatchedIds.indexOf(b.id)
      if (idxA !== -1 && idxB !== -1) return idxA - idxB
      if (idxA !== -1) return -1
      if (idxB !== -1) return 1
      return 0
    })
  }
  return result
}
