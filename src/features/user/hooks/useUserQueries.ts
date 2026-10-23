import { useQuery } from '@tanstack/react-query'
import { userService } from '@/services'

export const userKeys = {
  all: ['users'] as const,
  detail: (id: number) => [...userKeys.all, 'detail', id] as const,
}

/** Hồ sơ công khai của một user (VD chủ shop: tên shop, logo, địa chỉ). */
export function useUser(id: number | undefined) {
  return useQuery({
    queryKey: userKeys.detail(id ?? 0),
    queryFn: async () => (await userService.getUserById(id!)).result ?? null,
    enabled: id != null && id > 0,
  })
}
