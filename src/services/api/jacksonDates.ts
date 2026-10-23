/**
 * Backend (Jackson) đôi khi trả LocalDate/LocalDateTime dạng mảng số, ví dụ
 * expiryDate: [2026, 10, 26] hay createdAt: [2026, 10, 23, 9, 33, 42, 123000000].
 * Hàm này đổi các mảng đó về chuỗi ISO để mọi type `string` trong app đúng thật.
 * Chỉ đụng tới khoá có tên kiểu ngày (…Date, …At, date) để không làm hỏng mảng id.
 */
const DATE_KEY = /(Date|At|^date)$/

const pad = (n: number, len = 2) => String(n).padStart(len, '0')

function isDateArray(v: unknown): v is number[] {
  return (
    Array.isArray(v) &&
    v.length >= 3 &&
    v.length <= 7 &&
    v.every((n) => typeof n === 'number' && Number.isInteger(n)) &&
    v[0] > 1900 &&
    v[1] >= 1 &&
    v[1] <= 12
  )
}

export function dateArrayToIso(v: number[]): string {
  const [y, mo, d, h, mi, s, nano] = v
  const day = `${y}-${pad(mo)}-${pad(d)}`
  if (h === undefined) return day
  const ms = nano ? `.${pad(Math.floor(nano / 1e6), 3)}` : ''
  return `${day}T${pad(h)}:${pad(mi ?? 0)}:${pad(s ?? 0)}${ms}`
}

export function normalizeJacksonDates<T>(data: T): T {
  if (Array.isArray(data)) {
    for (let i = 0; i < data.length; i++) data[i] = normalizeJacksonDates(data[i])
    return data
  }
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    for (const key of Object.keys(obj)) {
      const v = obj[key]
      if (DATE_KEY.test(key) && isDateArray(v)) obj[key] = dateArrayToIso(v)
      else if (v && typeof v === 'object') normalizeJacksonDates(v)
    }
  }
  return data
}
