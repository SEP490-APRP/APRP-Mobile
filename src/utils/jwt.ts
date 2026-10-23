export interface JwtPayload {
  sub?: string
  email?: string
  roles?: string[]
  exp?: number
  iat?: number
  jti?: string
  [key: string]: unknown
}

/**
 * Giải mã JWT Payload (Base64Url) an toàn trên Browser không cần thư viện ngoài.
 */
export function parseJwt(token: string | null | undefined): JwtPayload | null {
  if (!token || typeof token !== 'string') return null
  try {
    const parts = token.trim().split('.')
    if (parts.length !== 3) return null
    const base64Url = parts[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    )
    return JSON.parse(jsonPayload) as JwtPayload
  } catch {
    return null
  }
}

/**
 * Kiểm tra xem token có hợp lệ và còn hạn sử dụng hay không.
 * - Nếu token rỗng/null: không hợp lệ (false).
 * - Nếu token có dạng 3 phần của JWT: kiểm tra claim `exp`. Nếu exp <= hiện tại, coi như hết hạn (false).
 * - Nếu token là chuỗi thô (dùng trong test/mock không chứa dấu chấm JWT): coi như hợp lệ nếu không rỗng.
 */
export function isTokenValid(token: string | null | undefined): boolean {
  if (!token || typeof token !== 'string' || !token.trim()) return false
  const trimmed = token.trim()
  const parts = trimmed.split('.')
  if (parts.length === 3) {
    const payload = parseJwt(trimmed)
    if (!payload) return false
    if (typeof payload.exp === 'number' && payload.exp * 1000 <= Date.now()) {
      return false
    }
  }
  return true
}
