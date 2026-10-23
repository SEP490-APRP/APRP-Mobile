import { useEffect, useMemo, useState } from 'react'
import { useUiStore } from '@/stores'
import type { CartItemResponse } from '@/types/cart.types'
import { getErrorMessage } from '@/utils/errors'
import {
  availableItemIds,
  reconcileSelection,
  summarizeCart,
  toggleGroup,
} from '../utils/cartSelection'
import { useMyCart, useRemoveCartItems, useUpdateCartItem } from './useCartQueries'

/**
 * Chọn món, đổi số lượng và xoá trong giỏ, chuyển từ useCartOperations bản web.
 * Bỏ ô gõ số lượng trực tiếp: trên điện thoại dùng nút − / + là đủ.
 */
export function useCartSelection() {
  const cartQuery = useMyCart()
  const cart = cartQuery.data
  const update = useUpdateCartItem()
  const remove = useRemoveCartItems()
  const showToast = useUiStore((s) => s.showToast)

  // null = chưa khởi tạo, để lần đầu có giỏ thì chọn sẵn mọi món còn bán.
  const [selected, setSelected] = useState<Set<number> | null>(null)
  const [deleting, setDeleting] = useState<CartItemResponse | null>(null)

  useEffect(() => {
    if (cart) setSelected((prev) => reconcileSelection(prev, cart))
  }, [cart])

  const selection = useMemo(() => selected ?? new Set<number>(), [selected])
  const summary = useMemo(() => summarizeCart(cart, selection), [cart, selection])
  const allIds = useMemo(() => availableItemIds(cart), [cart])
  const allSelected = allIds.length > 0 && allIds.every((id) => selection.has(id))

  const toggleItem = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const toggleShop = (items: readonly CartItemResponse[]) => setSelected((prev) => toggleGroup(prev ?? new Set(), items))

  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(allIds))

  const changeQuantity = (item: CartItemResponse, delta: number) => {
    const quantity = item.quantity + delta
    if (quantity <= 0) {
      setDeleting(item)
      return
    }
    const max = item.stockQuantity ?? item.stockAvailable
    if (max != null && quantity > max) {
      showToast(`Kho chỉ còn ${max} cho món này.`)
      return
    }
    update.mutate(
      { cartItemId: item.cartItemId, quantity },
      { onError: (err) => showToast(getErrorMessage(err, 'Không thể cập nhật số lượng.')) },
    )
  }

  const confirmDelete = () => {
    if (!deleting) return
    const id = deleting.cartItemId
    remove.mutate(
      { cartItemIds: [id] },
      {
        onSuccess: () => {
          setSelected((prev) => {
            const next = new Set(prev)
            next.delete(id)
            return next
          })
          setDeleting(null)
          showToast('Đã xoá khỏi giỏ hàng.')
        },
        onError: (err) => showToast(getErrorMessage(err, 'Không thể xoá món này.')),
      },
    )
  }

  const busyId =
    update.isPending ? update.variables?.cartItemId : remove.isPending ? remove.variables?.cartItemIds[0] : undefined

  return {
    cartQuery,
    cart,
    selected: selection,
    summary,
    allSelected,
    toggleItem,
    toggleShop,
    toggleAll,
    changeQuantity,
    busyId,
    isMutating: update.isPending || remove.isPending,
    deleting,
    requestDelete: setDeleting,
    cancelDelete: () => setDeleting(null),
    confirmDelete,
    isDeleting: remove.isPending,
  }
}
