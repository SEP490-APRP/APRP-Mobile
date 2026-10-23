import { ENV } from './env'

/** Ghép className có điều kiện, bỏ qua giá trị falsy. Không cần thêm thư viện. */
export type ClassValue = string | false | null | undefined

export function cn(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(' ')
}

/**
 * URL tuyệt đối tới một route của app (dùng để chia sẻ/sao chép link).
 * Link trỏ về bản web: /cua-hang/101 -> https://capnong.vn/cua-hang/101
 */
export function absoluteUrl(route: string): string {
  const cleanRoute = route.startsWith('/') ? route : `/${route}`
  return `${ENV.WEB_URL}${cleanRoute}`
}
