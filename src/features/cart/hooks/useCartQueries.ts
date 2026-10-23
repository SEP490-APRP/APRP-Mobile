import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { cartService } from '@/services'
import { useAuthStore, useUiStore } from '@/stores'
import type { CartAddRequest, CartRemoveRequest, CartResponse, CartUpdateRequest } from '@/types/cart.types'
import { getErrorMessage } from '@/utils/errors'

export const cartKeys = {
  all: ['cart'] as const,
}

export function useMyCart<T = CartResponse>(select?: (cart: CartResponse) => T) {
  const token = useAuthStore((s) => s.token)
  return useQuery({
    queryKey: cartKeys.all,
    queryFn: () => cartService.getMyCart(),
    enabled: !!token,
    select,
  })
}

/** Tổng số lượng trong giỏ, cho badge ở thanh tab. */
export const useCartCount = () =>
  useMyCart(
    (cart) =>
      cart.shopCarts?.reduce(
        (acc, sc) => acc + (sc.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0),
        0,
      ) ?? 0,
  ).data ?? 0

/** Số lượng từng sản phẩm đang trong giỏ, theo id sản phẩm (để card hiện "Trong giỏ (n)"). */
export const useCartQuantities = () =>
  useMyCart((cart) => {
    const map: Record<string, number> = {}
    cart.shopCarts?.forEach((sc) =>
      sc.items?.forEach((item) => {
        if (item.itemType === 'PRODUCT' || !item.itemType) {
          const id = String(item.productId ?? item.itemId)
          map[id] = (map[id] ?? 0) + item.quantity
        }
      }),
    )
    return map
  }).data

export function useAddToCart() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CartAddRequest) => cartService.addToCart(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: cartKeys.all }),
  })
}

export function useUpdateCartItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CartUpdateRequest) => cartService.updateCartItem(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: cartKeys.all }),
  })
}

export function useRemoveCartItems() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CartRemoveRequest) => cartService.removeCartItems(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: cartKeys.all }),
  })
}

/**
 * Thêm vào giỏ (mặc định 1 đơn vị) và báo toast, thay cho onAdd của StorefrontLayout bản web.
 * Khu vực Khách Mua luôn đã đăng nhập nên không cần nhánh giỏ hàng khách vãng lai.
 */
export function useAddProductToCart() {
  const add = useAddToCart()
  const showToast = useUiStore((s) => s.showToast)
  return {
    pendingId: add.isPending ? add.variables?.itemId : undefined,
    addProduct: (
      id: string | number,
      {
        itemType = 'PRODUCT',
        quantity = 1,
        successMessage = 'Đã thêm vào giỏ hàng!',
      }: { itemType?: string; quantity?: number; successMessage?: string } = {},
    ) => {
      const itemId = Number(id)
      if (!(itemId > 0)) {
        showToast('Sản phẩm này chưa mở bán trực tuyến.')
        return
      }
      add.mutate(
        { itemType, itemId, quantity },
        {
          onSuccess: () => showToast(successMessage),
          onError: (err) =>
            showToast(getErrorMessage(err, 'Không thể thêm vào giỏ. Vui lòng thử lại.')),
        },
      )
    },
  }
}
