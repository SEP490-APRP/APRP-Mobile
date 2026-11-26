import { toQR } from 'toqr'
import type { HubTrip, HubTripBox } from '@/services'

/** Kiểm thùng cho tài xế: lọc, tìm, đếm thùng và vẽ mã QR (CrateScanDialog bản web) */

export type CrateFilter = 'all' | 'left' | 'full'

export const crateNumbers = (n: number) => Array.from({ length: n }, (_, i) => i + 1)

export const isBoxFull = (b: HubTripBox) => b.loaded.length >= b.crates

export const crateTotals = (boxes: HubTripBox[]) =>
  boxes.reduce((t, b) => ({ done: t.done + b.loaded.length, total: t.total + b.crates }), { done: 0, total: 0 })

/** Số thùng tài xế xe còn phải nhận trước khi chạy */
export const boxesLeft = (t: HubTrip) => Math.max(0, (t.boxTotal ?? 0) - (t.boxLoaded ?? 0))

/** Chuyến sau khi đổi các thùng đã nhận của một đơn (hiện ngay trong lúc chờ máy chủ lưu) */
export function withLoaded(t: HubTrip, orderId: number, loaded: number[]): HubTrip {
  const boxes = (t.boxes ?? []).map((b) => (b.orderId === orderId ? { ...b, loaded } : b))
  return { ...t, boxes, boxLoaded: crateTotals(boxes).done }
}

/** Bỏ dấu tiếng Việt để gõ "nguyen" vẫn tìm ra "Nguyễn" */
const plain = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .trim()

export function filterBoxes(boxes: HubTripBox[], filter: CrateFilter, query: string) {
  const q = plain(query)
  return boxes.filter(
    (b) =>
      (filter === 'all' || isBoxFull(b) === (filter === 'full')) &&
      (!q || [b.code, b.recipientName, b.hubName].some((v) => !!v && plain(v).includes(q))),
  )
}

/** Mã tem an toàn do máy chủ cấp (đơn đóng gói trước đây có thể mang mã kiểu cũ) */
export const isPackageToken = (t?: string | null): t is string => !!t && /^CN[0-9a-f]{32}$/.test(t)

/** Ma trận QR thành một đường SVG: mỗi dải ô tối liền nhau là một hình chữ nhật cao 1 ô */
export function qrPath(text: string) {
  const cells = toQR(text, 0) // 0 = mức sửa lỗi M, giống bản web
  const size = Math.sqrt(cells.length)
  let d = ''
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (!cells[y * size + x]) continue
      let w = 1
      while (x + w < size && cells[y * size + x + w]) w++
      d += `M${x} ${y}h${w}v1h-${w}z`
      x += w - 1
    }
  }
  return { size, d }
}
