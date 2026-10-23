import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { orderKeys } from '@/features/order/hooks/useOrderQueries'
import { comboService } from '@/services/combo.service'
import { mysteryBoxService } from '@/services/mysteryBox.service'
import * as orderService from '@/services/order.service'
import { productService } from '@/services/product.service'
import type { AiDescriptionSuggestionRequest, ProductCreationRequest } from '@/services/product.types'
import { uploadService } from '@/services/upload.service'
import type { UploadFile } from '@/types/upload.types'
import { productKeys } from '@/features/product/hooks/useProductQueries'
import { comboKeys } from '@/features/combo/hooks/useComboQueries'
import {
  bundleDetailFromBox,
  bundleDetailFromCombo,
  toBoxRequest,
  toComboRequest,
  type BundleFormValues,
  type BundleItem,
  type BundleKind,
} from '../utils/bundleForm'
import type { ListingKind } from '../utils/shopListings'
import type { FetchOrdersParams } from '@/types/order.types'
import { SHOP_ORDER_TABS, type ShopOrderTab } from '../utils/shopOrders'

export const shopKeys = {
  all: ['shop'] as const,
  orders: (params: FetchOrdersParams) => [...shopKeys.all, 'orders', params] as const,
  orderFeed: (tab: ShopOrderTab) => [...shopKeys.all, 'order-feed', tab] as const,
  products: () => [...shopKeys.all, 'products'] as const,
  combos: () => [...shopKeys.all, 'combos'] as const,
  boxes: () => [...shopKeys.all, 'boxes'] as const,
  images: (productId: number) => [...shopKeys.all, 'images', productId] as const,
  bundle: (kind: BundleKind, id: number) => [...shopKeys.all, 'bundle', kind, id] as const,
}

/** Đơn của gian hàng (GET /orders/shop). */
export function useShopOrders(params: FetchOrdersParams = { page: 0, size: 50 }) {
  return useQuery({
    queryKey: shopKeys.orders(params),
    queryFn: () => orderService.fetchShopOrders(params),
  })
}

/** Nông sản của gian hàng, mọi trạng thái (GET /products/my-shop). */
export function useMyShopProducts() {
  return useQuery({
    queryKey: shopKeys.products(),
    queryFn: async () => (await productService.getMyProducts({ page: 1, size: 100 })).result?.content ?? [],
  })
}

export function useMyShopCombos() {
  return useQuery({
    queryKey: shopKeys.combos(),
    queryFn: async () => (await comboService.getMyShopCombos({ page: 1, size: 100 })).content ?? [],
  })
}

export function useMyShopBoxes() {
  return useQuery({
    queryKey: shopKeys.boxes(),
    queryFn: async () => (await mysteryBoxService.getMyShopBoxes(1, 100)).content ?? [],
  })
}

const FEED_SIZE = 15

/** Đơn theo thẻ trạng thái, tải thêm khi cuộn (trang Đơn hàng). */
export function useShopOrderFeed(tab: ShopOrderTab) {
  const statuses = SHOP_ORDER_TABS.find((t) => t.key === tab)?.statuses
  return useInfiniteQuery({
    queryKey: shopKeys.orderFeed(tab),
    initialPageParam: 0,
    queryFn: ({ pageParam }) => orderService.fetchShopOrders({ page: pageParam, size: FEED_SIZE, statuses }),
    getNextPageParam: (last, _all, page) => (last.last || !last.content?.length ? undefined : page + 1),
  })
}

export type ShopOrderAction = 'confirm' | 'ready' | 'cancel'

const ACTIONS: Record<ShopOrderAction, (id: number) => Promise<unknown>> = {
  confirm: orderService.confirmOrder,
  ready: orderService.readyOrder,
  cancel: orderService.cancelOrder,
}

/** Xác nhận (PENDING/PAID → CONFIRMED), sẵn sàng giao (CONFIRMED → READY) hoặc huỷ; xong thì tải lại mọi danh sách đơn. */
export function useShopOrderAction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, action }: { id: number; action: ShopOrderAction }) => ACTIONS[action](id),
    onSuccess: (_res, { id }) =>
      Promise.all([
        qc.invalidateQueries({ queryKey: shopKeys.all }),
        qc.invalidateQueries({ queryKey: orderKeys.detail(id) }),
      ]),
  })
}

/** Làm mới mọi danh sách tin đăng (gian hàng + chợ của người mua). */
function useInvalidateListings() {
  const qc = useQueryClient()
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: shopKeys.all }),
      qc.invalidateQueries({ queryKey: productKeys.all }),
      qc.invalidateQueries({ queryKey: comboKeys.all }),
    ])
}

/** Tải ảnh lên Cloudinary rồi gắn vào sản phẩm (BE chạy AI kiểm duyệt ảnh ngầm). */
async function attachImage(productId: number, file: UploadFile, isPrimary: boolean, displayOrder: number) {
  const url = (await uploadService.uploadImage(file, 'products')).result?.url
  if (!url) throw new Error('Không nhận được đường dẫn ảnh từ máy chủ')
  return (await productService.addImage(productId, { imageUrl: url, isPrimary, displayOrder })).result
}

/**
 * Đăng bán nông sản: tạo sản phẩm (trạng thái Chờ duyệt) rồi gắn ảnh chính.
 * Ảnh lỗi không làm mất sản phẩm vừa tạo: trả về imageError để màn hình báo và cho thêm ảnh sau.
 */
export function useCreateShopProduct() {
  const invalidate = useInvalidateListings()
  return useMutation({
    mutationFn: async ({ request, image }: { request: ProductCreationRequest; image?: UploadFile }) => {
      const product = (await productService.createProduct(request)).result
      const productId = Number(product?.productId ?? product?.id)
      let imageError: unknown
      if (image && productId > 0) {
        try {
          await attachImage(productId, image, true, 0)
        } catch (err) {
          imageError = err
        }
      }
      return { productId, imageError }
    },
    onSettled: () => void invalidate(),
  })
}

export function useUpdateShopProduct() {
  const invalidate = useInvalidateListings()
  return useMutation({
    mutationFn: ({ id, request, status }: { id: number; request: ProductCreationRequest; status?: string }) =>
      productService.updateProduct(id, { ...request, status }),
    onSuccess: () => void invalidate(),
  })
}

/** Xoá một tin đăng: nông sản, combo hoặc túi mù. */
export function useDeleteListing() {
  const invalidate = useInvalidateListings()
  return useMutation({
    mutationFn: async ({ kind, id }: { kind: ListingKind; id: number }) => {
      if (kind === 'COMBO') await comboService.deleteCombo(id)
      else if (kind === 'MYSTERY_BOX') await mysteryBoxService.deleteMysteryBox(id)
      else await productService.deleteProduct(id)
    },
    onSuccess: () => void invalidate(),
  })
}

/** Ảnh của một nông sản, ảnh chính lên đầu. */
export function useShopProductImages(productId: number) {
  return useQuery({
    queryKey: shopKeys.images(productId),
    queryFn: async () => (await productService.getImages(productId)).result ?? [],
    enabled: productId > 0,
    select: (images) =>
      images
        .slice()
        .sort((a, b) => Number(!!b.isPrimary) - Number(!!a.isPrimary) || (a.displayOrder ?? 0) - (b.displayOrder ?? 0)),
  })
}

export type ProductImageAction =
  | { kind: 'add'; file: UploadFile; isPrimary: boolean; displayOrder: number }
  | { kind: 'primary'; imageId: number }
  | { kind: 'delete'; imageId: number }

/** Thêm ảnh, đặt ảnh chính, xoá ảnh (ProductImageGalleryModal bản web). */
export function useProductImageAction(productId: number) {
  const invalidate = useInvalidateListings()
  return useMutation({
    mutationFn: async (a: ProductImageAction) => {
      if (a.kind === 'add') await attachImage(productId, a.file, a.isPrimary, a.displayOrder)
      else if (a.kind === 'primary') await productService.setPrimaryImage(productId, a.imageId)
      else await productService.deleteImage(productId, a.imageId)
    },
    onSettled: () => void invalidate(),
  })
}

/** Trợ lý AI gợi ý mô tả nông sản. */
export function useSuggestDescription() {
  return useMutation({
    mutationFn: async (req: AiDescriptionSuggestionRequest) => (await productService.suggestDescription(req)).result,
  })
}

/** Chi tiết combo / túi mù kèm danh sách nông sản bên trong (danh sách my-shop có thể thiếu items). */
export function useBundleDetail(kind: BundleKind, id: number) {
  return useQuery({
    queryKey: shopKeys.bundle(kind, id),
    queryFn: async () =>
      kind === 'COMBO'
        ? bundleDetailFromCombo(await comboService.getById(id))
        : bundleDetailFromBox(await mysteryBoxService.getById(id)),
    enabled: id > 0,
  })
}

/** Tạo hoặc sửa combo / túi mù. Ảnh mới chọn từ máy được tải lên trước rồi gửi đường dẫn. */
export function useSaveBundle(kind: BundleKind) {
  const invalidate = useInvalidateListings()
  return useMutation({
    mutationFn: async ({
      id,
      values,
      items,
      image,
      imageUrl,
    }: {
      id?: number
      values: BundleFormValues
      items: readonly BundleItem[]
      image?: UploadFile
      imageUrl?: string
    }) => {
      const url = image
        ? (await uploadService.uploadImage(image, kind === 'COMBO' ? 'combos' : 'mystery-boxes')).result?.url
        : imageUrl
      if (image && !url) throw new Error('Không nhận được đường dẫn ảnh từ máy chủ')
      if (kind === 'COMBO') {
        const req = toComboRequest(values, items, url)
        return id ? comboService.updateCombo(id, req) : comboService.createCombo(req)
      }
      const req = toBoxRequest(values, items, url)
      return id ? mysteryBoxService.updateMysteryBox(id, req) : mysteryBoxService.createMysteryBox(req)
    },
    onSuccess: () => void invalidate(),
  })
}
