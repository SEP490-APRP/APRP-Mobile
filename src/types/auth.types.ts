export type UserRole = 'buyer' | 'shop' | 'shipper' | 'admin'

export interface AuthUser {
  name: string
  fullName?: string
  email: string
  phone?: string
  phoneNumber?: string
  address?: string
  role: UserRole
  avatar?: string
  detail?: string
  shopName?: string
  kycStatus?: 'APPROVED' | 'PENDING' | 'REJECTED'
}

/** User đang đăng nhập: luôn có id (bản cũ lưu user không có id). */
export type SessionUser = AuthUser & { id: string }
