import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { authService } from '@/services'
import type { UserResponse } from '@/services/user.types'
import { useAuthStore } from '@/stores'
import type { UploadFile } from '@/types/upload.types'

export const profileKeys = { me: ['profile', 'me'] as const }

export type ProfileUpdate = {
  fullName: string
  phoneNumber: string
  address: string
  dietPreference?: UserResponse['dietPreference']
}

/** Đồng bộ tên, số điện thoại, ảnh vào phiên đăng nhập để các màn khác thấy ngay. */
function syncSession(u: UserResponse) {
  const { user, setUser } = useAuthStore.getState()
  if (!user) return
  setUser({
    ...user,
    name: u.fullName || user.name,
    fullName: u.fullName || user.fullName,
    phone: u.phoneNumber || u.phone || user.phone,
    phoneNumber: u.phoneNumber || u.phone || user.phoneNumber,
    address: u.address ?? user.address,
    avatar: u.logoUrl || u.avatar || user.avatar,
  })
}

export function useMyProfile() {
  return useQuery({
    queryKey: profileKeys.me,
    queryFn: async () => (await authService.getMyInfo()).result ?? null,
  })
}

function useProfileMutation<T>(fn: (input: T) => Promise<{ result?: UserResponse }>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: (res) => {
      if (!res.result) return
      queryClient.setQueryData(profileKeys.me, res.result)
      syncSession(res.result)
    },
  })
}

export const useUpdateProfile = () => useProfileMutation((data: ProfileUpdate) => authService.updateMyInfo(data))

/** Hồ sơ gian hàng của Nhà vườn: tên vườn, logo, giới thiệu, chứng nhận, tài khoản ngân hàng. */
export const useUpdateShopProfile = () =>
  useProfileMutation((data: Record<string, string>) => authService.updateMyInfo(data))

export const useUpdateAvatar = () => useProfileMutation((file: UploadFile) => authService.updateAvatar(file))

/** Bản web đổi mật khẩu qua PUT /users/me với oldPassword + password; giữ nguyên cách đó. */
export function useChangePassword() {
  return useMutation({
    mutationFn: ({ oldPassword, password }: { oldPassword: string; password: string }) =>
      authService.updateMyInfo({ oldPassword, password }),
  })
}
