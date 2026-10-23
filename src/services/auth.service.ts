import { axiosInstance } from './api'
import type { ApiResponse } from '@/types/api.types'
import type { SessionUser, UserRole } from '@/types/auth.types'
import type { UploadFile } from '@/types/upload.types'
import type {
  LoginRequest,
  LoginResponse,
  BuyerRegisterRequest,
  ShopRegisterRequest,
  ShipperRegisterRequest,
  VerifyOtpRequest,
  ResendOtpRequest,
  IntrospectRequest,
  IntrospectResponse,
  RefreshTokenRequest,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  JwtTokenPayload,
} from './auth.types'
import type { UserResponse } from './user.types'
import { parseJwt as parseJwtPayload } from '@/utils/jwt'
import { readStoredUser, useAuthStore } from '@/stores/useAuthStore'

/** Giải mã JWT Payload; dùng chung hàm của utils/jwt (atob có sẵn trong Hermes). */
export function parseJwt(token: string): JwtTokenPayload | null {
  return parseJwtPayload(token) as JwtTokenPayload | null
}

/**
 * Chuyển đổi tên Role từ Backend theo DB thật: `BUYER`, `SHOP`, `SHIPPER`, `ADMIN`.
 * Chúng ta vẫn hỗ trợ dạng `ROLE_ADMIN`/`ROLE_SHOP` nếu backend gửi theo chuẩn Spring Security.
 */
function normalizeRoleCandidates(input: unknown): string[] {
  if (input == null) return []

  if (Array.isArray(input)) {
    return input.flatMap((item) => normalizeRoleCandidates(item))
  }

  if (typeof input === 'string') {
    return [input]
  }

  if (typeof input === 'object') {
    const record = input as Record<string, unknown>
    const values = [
      record.name,
      record.role,
      record.roleName,
      record.authority,
      record.authorities,
      record.value,
      record.roles,
    ]
    return values.flatMap((value) => normalizeRoleCandidates(value))
  }

  return [String(input)]
}

export function mapBackendRoleToFrontend(roleInput?: unknown): UserRole {
  const normalizedRoles = normalizeRoleCandidates(roleInput)
    .map((role) => String(role).trim().toUpperCase())
    .map((role) => role.replace(/^ROLE_/, ''))

  if (normalizedRoles.some((role) => ['ADMIN'].includes(role))) {
    return 'admin'
  }
  if (normalizedRoles.some((role) => ['SHOP'].includes(role))) {
    return 'shop'
  }
  if (normalizedRoles.some((role) => ['SHIPPER'].includes(role))) {
    return 'shipper'
  }

  return 'buyer'
}

/**
 * Tạo `SessionUser` chuẩn của Frontend từ DTO `UserResponse` trả về bởi Backend.
 */
export function buildSessionUser(userData: UserResponse, fallbackRole?: UserRole): SessionUser {
  const resolvedRole = mapBackendRoleToFrontend([
    userData.role?.name,
    userData.roleName,
    fallbackRole,
  ])

  let kycStatus: 'APPROVED' | 'PENDING' | 'REJECTED' | undefined
  if (userData.kycStatus === 'APPROVED' || userData.kycStatus === 'ACTIVE') {
    kycStatus = 'APPROVED'
  } else if (userData.kycStatus === 'PENDING') {
    kycStatus = 'PENDING'
  } else if (userData.kycStatus === 'REJECTED') {
    kycStatus = 'REJECTED'
  } else if (userData.status === 'PENDING') {
    kycStatus = 'PENDING'
  } else if (userData.status === 'ACTIVE') {
    kycStatus = 'APPROVED'
  } else if (userData.status === 'REJECTED') {
    kycStatus = 'REJECTED'
  }

  return {
    id: String(userData.id),
    name: userData.fullName || userData.username || userData.email.split('@')[0],
    email: userData.email,
    phone: userData.phoneNumber || userData.phone,
    role: resolvedRole,
    avatar: userData.logoUrl || userData.avatar,
    shopName: userData.shopName,
    kycStatus,
    detail:
      resolvedRole === 'shop'
        ? userData.shopName || 'Chủ gian hàng nông sản'
        : resolvedRole === 'admin'
          ? 'Quản trị viên hệ thống'
          : resolvedRole === 'shipper'
            ? 'Đối tác giao vận'
            : 'Thành viên CapNong',
  }
}

/**
 * Authentication Service kết nối trực tiếp với Spring Boot backend (APRP-BE)
 */
export const authService = {
  /**
   * Đăng nhập người dùng qua POST /auth/login
   */
  async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    const response = await axiosInstance.post<ApiResponse<LoginResponse>>(
      '/auth/login',
      credentials,
    )
    return response.data
  },

  /**
   * Đăng nhập người dùng bằng Google token qua POST /auth/google
   */
  async loginGoogle(token: string): Promise<ApiResponse<LoginResponse>> {
    const response = await axiosInstance.post<ApiResponse<LoginResponse>>(
      '/auth/google',
      { token },
    )
    return response.data
  },

  /**
   * Đăng ký tài khoản Khách mua (Buyer) qua POST /users
   * BE tự động gửi OTP đến email đã đăng ký.
   */
  async registerBuyer(data: BuyerRegisterRequest): Promise<ApiResponse<UserResponse>> {
    const response = await axiosInstance.post<ApiResponse<UserResponse>>('/users', data)
    return response.data
  },

  /**
   * Đăng ký tài khoản Chủ shop (Shop Owner) qua POST /users/shops
   * BE tự động gửi OTP đến email đã đăng ký.
   */
  async registerShop(data: ShopRegisterRequest): Promise<ApiResponse<UserResponse>> {
    const response = await axiosInstance.post<ApiResponse<UserResponse>>('/users/shops', data)
    return response.data
  },

  /**
   * Đăng ký tài khoản Tài xế (Shipper) qua POST /users/shippers
   * BE tự động gửi OTP đến email đã đăng ký.
   */
  async registerShipper(data: ShipperRegisterRequest): Promise<ApiResponse<UserResponse>> {
    const response = await axiosInstance.post<ApiResponse<UserResponse>>('/users/shippers', data)
    return response.data
  },

  /**
   * Xác thực tài khoản bằng OTP qua POST /users/verify-otp
   */
  async verifyOtp(data: VerifyOtpRequest): Promise<ApiResponse<UserResponse>> {
    const response = await axiosInstance.post<ApiResponse<UserResponse>>(
      '/users/verify-otp',
      data,
    )
    return response.data
  },

  /**
   * Gửi lại mã OTP qua POST /users/resend-otp
   */
  async resendOtp(data: ResendOtpRequest): Promise<ApiResponse<void>> {
    const response = await axiosInstance.post<ApiResponse<void>>('/users/resend-otp', data)
    return response.data
  },

  /**
   * Lấy thông tin tài khoản hiện tại qua GET /users/me
   */
  async getMyInfo(): Promise<ApiResponse<UserResponse>> {
    const response = await axiosInstance.get<ApiResponse<UserResponse>>('/users/me')
    return response.data
  },

  /**
   * Cập nhật thông tin tài khoản hiện tại qua PUT /users/me
   */
  async updateMyInfo(data: Record<string, unknown>): Promise<ApiResponse<UserResponse>> {
    const response = await axiosInstance.put<ApiResponse<UserResponse>>('/users/me', data)
    return response.data
  },

  /**
   * Cập nhật ảnh đại diện người dùng qua PATCH /users/me/images (Multipart/form-data)
   */
  async updateAvatar(file: UploadFile): Promise<ApiResponse<UserResponse>> {
    const formData = new FormData()
    // React Native FormData nhận { uri, name, type } thay cho đối tượng File của trình duyệt.
    formData.append('file', file as unknown as Blob)
    const response = await axiosInstance.patch<ApiResponse<UserResponse>>('/users/me/images', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  /**
   * Đổi mật khẩu cho người dùng hiện tại qua POST /users/change-password
   */
  async changePassword(data: ChangePasswordRequest): Promise<ApiResponse<void>> {
    const response = await axiosInstance.post<ApiResponse<void>>('/users/change-password', data)
    return response.data
  },

  /**
   * Yêu cầu gửi OTP quên mật khẩu qua POST /auth/forgot-password
   */
  async forgotPassword(data: ForgotPasswordRequest): Promise<ApiResponse<void>> {
    const response = await axiosInstance.post<ApiResponse<void>>('/auth/forgot-password', data)
    return response.data
  },

  /**
   * Đặt lại mật khẩu mới với OTP qua POST /auth/reset-password
   */
  async resetPassword(data: ResetPasswordRequest): Promise<ApiResponse<void>> {
    const response = await axiosInstance.post<ApiResponse<void>>('/auth/reset-password', data)
    return response.data
  },

  /**
   * Thu hồi token đăng xuất qua POST /auth/logout
   */
  async logout(token?: string): Promise<ApiResponse<void>> {
    const currentToken = token || useAuthStore.getState().token
    if (currentToken) {
      try {
        const response = await axiosInstance.post<ApiResponse<void>>('/auth/logout', {
          token: currentToken,
        })
        return response.data
      } catch (err) {
        console.warn('Lỗi khi gọi logout API:', err)
      }
    }
    return { code: 200, message: 'Logged out locally' }
  },

  /**
   * Kiểm tra tính hợp lệ của token qua POST /auth/introspect
   */
  async introspect(token: string): Promise<ApiResponse<IntrospectResponse>> {
    const response = await axiosInstance.post<ApiResponse<IntrospectResponse>>(
      '/auth/introspect',
      { token } as IntrospectRequest,
    )
    return response.data
  },

  /**
   * Làm mới token qua POST /auth/refresh
   */
  async refreshToken(token: string): Promise<ApiResponse<LoginResponse>> {
    const response = await axiosInstance.post<ApiResponse<LoginResponse>>(
      '/auth/refresh',
      { token } as RefreshTokenRequest,
    )
    return response.data
  },

  getUserInfo(): UserResponse | null {
    const user = readStoredUser()
    if (!user) return null
    return {
      id: Number(user.id) || 1,
      fullName: user.name,
      email: user.email,
      phoneNumber: user.phone,
      status: 'ACTIVE',
      role: { name: user.role.toUpperCase() },
      kycStatus: user.kycStatus ?? 'APPROVED',
      vehicleNumber: '59A-888.88',
      ratingAverage: 4.9,
      address: 'TP. Hồ Chí Minh',
    }
  },

  getToken(): string | null {
    return useAuthStore.getState().token
  },

  /**
   * Tiện ích giải mã JWT
   */
  parseJwt,
  mapBackendRoleToFrontend,
  buildSessionUser,
}

export default authService

