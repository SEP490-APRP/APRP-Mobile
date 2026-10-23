import type { UserRole } from '@/types/auth.types'

/** Dữ liệu gửi lên khi đăng nhập qua POST /auth/login */
export interface LoginRequest {
  email: string
  password: string
}

/** Kết quả từ backend trả về khi đăng nhập thành công */
export interface LoginResponse {
  authenticated: boolean
  token: string
}

/** Đăng ký người mua (Buyer) qua POST /users */
export interface BuyerRegisterRequest {
  email: string
  password: string
  fullName: string
  phoneNumber: string
  address: string
  dietPreference?: string
  bankAccount?: string
  bankAccountHolder?: string
  bankName?: string
}

/** Đăng ký chủ gian hàng (Shop Owner) qua POST /users/shops */
export interface ShopRegisterRequest {
  email: string
  password: string
  fullName: string
  phoneNumber: string
  address: string
  cccd: string
  shopName: string
  bankAccount?: string
  bankAccountHolder?: string
  bankName?: string
  description?: string
}

/** Đăng ký tài xế (Shipper) qua POST /users/shippers */
export interface ShipperRegisterRequest {
  email: string
  password: string
  fullName: string
  phoneNumber: string
  address: string
  cccd: string
  vehicleNumber: string
  bankAccount?: string
  bankAccountHolder?: string
  bankName?: string
  license?: string
}

/** Xác thực mã OTP qua POST /users/verify-otp */
export interface VerifyOtpRequest {
  email: string
  otp: number
}

/** Yêu cầu gửi lại OTP qua POST /users/resend-otp */
export interface ResendOtpRequest {
  email: string
}

/** Introspect token qua POST /auth/introspect */
export interface IntrospectRequest {
  token: string
}

export interface IntrospectResponse {
  valid: boolean
}

/** Đăng xuất qua POST /auth/logout */
export interface LogoutRequest {
  token: string
}

/** Refresh token qua POST /auth/refresh */
export interface RefreshTokenRequest {
  token: string
}

/** Đổi mật khẩu qua POST /users/change-password */
export interface ChangePasswordRequest {
  oldPassword: string
  newPassword: string
  confirmPassword?: string
}

/** Yêu cầu quên mật khẩu (gửi OTP) qua POST /auth/forgot-password */
export interface ForgotPasswordRequest {
  email: string
}

/** Đặt lại mật khẩu mới với OTP qua POST /auth/reset-password */
export interface ResetPasswordRequest {
  email: string
  otp: number
  newPassword: string
  confirmPassword?: string
}

/** Payload giải mã từ JWT token do Backend Nimbus JOSE phát hành */
export interface JwtTokenPayload {
  sub?: string
  email?: string
  roles?: string[]
  exp?: number
  iat?: number
  jti?: string
  [key: string]: unknown
}

export type { UserRole }
