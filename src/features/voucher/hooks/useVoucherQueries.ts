import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { voucherService } from '@/services'
import type { VoucherResponse } from '@/services/voucher.types'

export type ShopVoucherPage = {
  vouchers: VoucherResponse[]
  /** voucherCode -> người dùng hiện tại còn nhận được không */
  canReceive: Record<string, boolean>
}

export const voucherKeys = {
  all: ['vouchers'] as const,
  mine: () => [...voucherKeys.all, 'mine'] as const,
  shop: (shopId: number, size: number) => [...voucherKeys.all, 'shop', { shopId, size }] as const,
}

const normalizeCode = (code?: string) => code?.trim().toUpperCase() ?? ''

/**
 * Voucher của một shop kèm trạng thái "còn nhận được". Bản web gọi canReceiveVoucher cho
 * từng voucher (mỗi lần lại tải cả ví); ở đây tải ví một lần rồi so mã.
 * Khu vực Khách Mua luôn đã đăng nhập nên không cần nhánh khách vãng lai.
 */
async function fetchShopVouchers(shopId: number, size: number): Promise<ShopVoucherPage> {
  const result = (await voucherService.getBuyerShopVouchers(shopId, 0, size)).result
  const vouchers = result?.content ?? []
  if (vouchers.length === 0) return { vouchers, canReceive: {} }

  let owned = new Set<string>()
  try {
    owned = new Set((await voucherService.getMyVouchers()).map((v) => normalizeCode(v.voucherCode)))
  } catch {
    /* không đọc được ví thì cho phép bấm Lưu, server sẽ báo nếu đã có */
  }
  return {
    vouchers,
    canReceive: Object.fromEntries(vouchers.map((v) => [v.voucherCode, !owned.has(normalizeCode(v.voucherCode))])),
  }
}

export function useShopVouchers(shopId: number, size = 6) {
  return useQuery({
    queryKey: voucherKeys.shop(shopId, size),
    queryFn: () => fetchShopVouchers(shopId, size),
    enabled: Number.isFinite(shopId) && shopId > 0,
  })
}

/** Nhận voucher; cập nhật ngay danh sách đang xem và ví voucher. */
export function useReceiveVoucher() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (voucherCode: string) => voucherService.receiveVoucher(voucherCode),
    onSuccess: (_res, voucherCode) => {
      queryClient.invalidateQueries({ queryKey: voucherKeys.mine() })
      queryClient.setQueriesData<ShopVoucherPage>(
        { queryKey: [...voucherKeys.all, 'shop'] },
        (old) => old && { vouchers: old.vouchers, canReceive: { ...old.canReceive, [voucherCode]: false } },
      )
    },
  })
}
