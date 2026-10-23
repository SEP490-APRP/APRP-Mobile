import { useMutation } from '@tanstack/react-query'
import { authService, buildSessionUser, mapBackendRoleToFrontend } from '@/services/auth.service'
import type { UserResponse } from '@/services/user.types'
import { useAuthStore } from '@/stores/useAuthStore'
import type { SessionUser } from '@/types'
import type { RegisterValues } from '../schemas/auth.schemas'
import type { RegisterRole } from '../constants/options'

export class AdminOnWebError extends Error {
  constructor() {
    super('Tài khoản Quản trị viên vui lòng đăng nhập trên bản web CapNong.')
  }
}

/**
 * Port của processAuthToken (AuthPage.tsx bản web): lưu token, đọc role từ JWT,
 * lấy hồ sơ /users/me rồi dựng SessionUser và lưu vào store.
 */
async function processAuthToken(token: string, fallbackEmail: string): Promise<SessionUser> {
  // /users/me cần token; đặt tạm vào store trước khi có user (route guard chưa đổi vì user vẫn null).
  useAuthStore.setState({ token })
  try {
    const payload = authService.parseJwt(token)

    let profileUser: UserResponse | null = null
    try {
      const meRes = await authService.getMyInfo()
      profileUser = meRes.result ?? null
    } catch {
      // Không lấy được hồ sơ thì dựng user tối thiểu từ JWT, giống bản web.
    }

    const role = mapBackendRoleToFrontend([
      payload?.roles,
      profileUser?.role?.name,
      profileUser?.roleName,
    ])
    if (role === 'admin') throw new AdminOnWebError()

    const sessionUser: SessionUser = profileUser
      ? buildSessionUser(profileUser, role)
      : {
          id: String(payload?.sub ?? fallbackEmail),
          name: payload?.email?.split('@')[0] || 'Thành viên CapNong',
          email: payload?.email || fallbackEmail,
          role,
          detail:
            role === 'shop'
              ? 'Chủ gian hàng nông sản'
              : role === 'shipper'
                ? 'Đối tác giao vận'
                : 'Thành viên CapNong',
        }

    useAuthStore.getState().login(sessionUser, token)
    return sessionUser
  } catch (error) {
    useAuthStore.setState({ token: null })
    throw error
  }
}

export function useLogin() {
  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const response = await authService.login({ email: email.trim(), password })
      const token = response.result?.token
      if (!token) throw new Error('Không nhận được token xác thực từ máy chủ.')
      return processAuthToken(token, email.trim())
    },
  })
}

/** Ghép dữ liệu form thành request đúng endpoint theo vai trò (giống handleRegisterSubmit bản web). */
async function registerByRole(role: RegisterRole, values: RegisterValues) {
  const base = {
    email: values.email.trim(),
    password: values.password,
    fullName: values.fullName.trim(),
    phoneNumber: values.phone.trim(),
  }
  if (role === 'shop') {
    return authService.registerShop({
      ...base,
      address: values.shopAddress.trim() || 'Lâm Đồng, Việt Nam',
      cccd: values.cccd.trim(),
      shopName: values.shopName.trim(),
      description:
        values.shopDescription.trim() ||
        `Khu vực: ${values.shopRegion}. Canh tác: ${values.shopFarmingType}`,
    })
  }
  if (role === 'shipper') {
    return authService.registerShipper({
      ...base,
      address: values.shipperArea.trim(),
      cccd: values.cccd.trim(),
      vehicleNumber: values.vehicleNumber.trim(),
    })
  }
  return authService.registerBuyer({
    ...base,
    address: values.buyerAddress.trim(),
    dietPreference: values.dietPreference || 'NON_VEGETARIAN',
  })
}

export function useRegister(role: RegisterRole) {
  return useMutation({ mutationFn: (values: RegisterValues) => registerByRole(role, values) })
}

export function useVerifyOtp() {
  return useMutation({
    mutationFn: ({ email, otp }: { email: string; otp: string }) =>
      authService.verifyOtp({ email: email.trim(), otp: parseInt(otp, 10) }),
  })
}

export function useResendOtp() {
  return useMutation({
    mutationFn: (email: string) => authService.resendOtp({ email: email.trim() }),
  })
}

export function useLogout() {
  return useMutation({
    mutationFn: async () => {
      // Gọi API thu hồi token nhưng luôn đăng xuất cục bộ, kể cả khi mất mạng.
      await authService.logout()
      useAuthStore.getState().logout()
    },
  })
}
