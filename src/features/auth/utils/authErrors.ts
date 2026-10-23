import { getErrorMessage } from '@/utils/errors'

/** Mã lỗi nghiệp vụ backend (APRP-BE) mà màn Auth xử lý riêng. */
export const AUTH_ERROR_CODE = {
  EMAIL_EXISTED: 1001,
  UNAUTHENTICATED: 1003,
  PHONE_EXISTED: 1017,
  NOT_VERIFIED: 1022,
  PENDING_APPROVAL: 1025,
  LOCKED: 1026,
  CCCD_EXISTED: 1032,
} as const

export function getErrorCode(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null) return undefined
  const e = error as { data?: { code?: unknown }; response?: { data?: { code?: unknown } } }
  const code = e.data?.code ?? e.response?.data?.code
  return typeof code === 'number' ? code : undefined
}

/** Tài khoản chưa xác thực OTP: chuyển sang màn OTP (giống bản web). */
export function isNotVerifiedError(error: unknown): boolean {
  if (getErrorCode(error) === AUTH_ERROR_CODE.NOT_VERIFIED) return true
  const msg = getErrorMessage(error, '').toLowerCase()
  return msg.includes('otp') || msg.includes('not active') || msg.includes('verify')
}

export function loginErrorMessage(error: unknown): string {
  switch (getErrorCode(error)) {
    case AUTH_ERROR_CODE.NOT_VERIFIED:
      return 'Tài khoản chưa được kích hoạt OTP. Đang chuyển đến trang xác thực OTP...'
    case AUTH_ERROR_CODE.PENDING_APPROVAL:
      return 'Tài khoản đang chờ Ban Quản Trị phê duyệt trước khi có thể đăng nhập.'
    case AUTH_ERROR_CODE.LOCKED:
      return 'Tài khoản đã bị khóa. Vui lòng liên hệ hỗ trợ.'
    case AUTH_ERROR_CODE.UNAUTHENTICATED:
      return 'Email hoặc mật khẩu không chính xác.'
  }
  if (isNotVerifiedError(error)) {
    return 'Tài khoản chưa được kích hoạt OTP. Đang chuyển đến trang xác thực OTP...'
  }
  return getErrorMessage(error, 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.')
}

export function registerErrorMessage(error: unknown, fallback: string): string {
  switch (getErrorCode(error)) {
    case AUTH_ERROR_CODE.EMAIL_EXISTED:
      return 'Email này đã được sử dụng. Vui lòng đăng nhập bằng email này.'
    case AUTH_ERROR_CODE.PHONE_EXISTED:
      return 'Số điện thoại này đã được đăng ký trong hệ thống.'
    case AUTH_ERROR_CODE.CCCD_EXISTED:
      return 'Số Căn cước công dân (CCCD) này đã được đăng ký trong hệ thống.'
  }
  return getErrorMessage(error, fallback)
}
