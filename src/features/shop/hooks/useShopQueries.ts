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
import { getErrorMessage } from '@/utils/errors'
import {
  imageUploadMessage,
  orderImagesWithPrimary,
} from '../utils/productForm'
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

export interface FailedImageUpload {
  name: string
  reason: string
}

export interface CreateProductWithImagesParams {
  request: ProductCreationRequest
  images: readonly UploadFile[]
  primaryIndex?: number
  onProgress?: (current: number, total: number) => void
}

export interface CreateProductWithImagesResult {
  productId: number
  uploadedCount: number
  failedImages: FailedImageUpload[]
}

export interface ProductImageAttachDeps {
  createProduct: typeof productService.createProduct
  deleteProduct: typeof productService.deleteProduct
  uploadAndAttach: (productId: number, file: UploadFile, isPrimary: boolean, displayOrder: number) => Promise<unknown>
}

const DEFAULT_CREATE_DEPS: ProductImageAttachDeps = {
  createProduct: (req) => productService.createProduct(req),
  deleteProduct: (id) => productService.deleteProduct(id),
  uploadAndAttach: attachImage,
}

/**
 * Tạo sản phẩm (PENDING) rồi tuần tự tải + thẩm định AI từng ảnh (ảnh chính đầu tiên).
 * Nếu ảnh đầu tiên không qua kiểm duyệt bước đầu (hoặc lỗi ngay ảnh đầu), tự động rollback xoá
 * bản ghi sản phẩm vừa tạo để không để sót sản phẩm ở trạng thái "Chờ duyệt".
 */
export async function createProductWithImages(
  { request, images, primaryIndex = 0, onProgress }: CreateProductWithImagesParams,
  deps: ProductImageAttachDeps = DEFAULT_CREATE_DEPS,
): Promise<CreateProductWithImagesResult> {
  const ordered = orderImagesWithPrimary(images, primaryIndex)
  if (ordered.length === 0) {
    throw new Error('Vui lòng thêm ít nhất 1 ảnh nông sản trước khi đăng bán.')
  }

  const product = (await deps.createProduct(request)).result
  const productId = Number(product?.productId ?? product?.id)
  if (!(productId > 0)) {
    throw new Error('Không tạo được sản phẩm mới, thử lại nhé.')
  }

  let uploadedCount = 0
  const failedImages: FailedImageUpload[] = []

  for (let i = 0; i < ordered.length; i += 1) {
    const file = ordered[i]
    onProgress?.(i + 1, ordered.length)
    try {
      await deps.uploadAndAttach(productId, file, i === 0, i)
      uploadedCount += 1
    } catch (err) {
      const reason = imageUploadMessage(err, getErrorMessage(err, 'Chưa tải được ảnh lên.'))
      if (i === 0) {
        let rolledBack = false
        try {
          await deps.deleteProduct(productId)
          rolledBack = true
        } catch {
          rolledBack = false
        }
        const suffix = rolledBack
          ? ' Sản phẩm chưa được gửi duyệt, bạn vui lòng chọn ảnh nông sản khác nhé.'
          : ' Hệ thống chưa huỷ được bản nháp tự động, bạn vui lòng kiểm tra lại mục Chờ duyệt.'
        throw new Error(`Ảnh đại diện chưa đạt kiểm duyệt: ${reason}${suffix}`)
      }
      failedImages.push({ name: file.name, reason })
    }
  }

  return { productId, uploadedCount, failedImages }
}

/**
 * Đăng bán nông sản nhiều ảnh với rollback tự động nếu ảnh đại diện không qua kiểm duyệt bước đầu.
 */
export function useCreateShopProduct() {
  const invalidate = useInvalidateListings()
  return useMutation({
    mutationFn: (params: CreateProductWithImagesParams) => createProductWithImages(params),
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
  | {
      kind: 'addMany'
      files: readonly UploadFile[]
      startOrder: number
      needPrimary: boolean
      onProgress?: (current: number, total: number) => void
    }
  | { kind: 'primary'; imageId: number }
  | { kind: 'delete'; imageId: number }

export interface BatchImageAddResult {
  addedCount: number
  failedImages: FailedImageUpload[]
}

/** Thêm 1 hoặc nhiều ảnh, đặt ảnh chính, xoá ảnh (ProductImageGalleryModal bản web). */
export function useProductImageAction(productId: number) {
  const invalidate = useInvalidateListings()
  return useMutation({
    mutationFn: async (a: ProductImageAction): Promise<BatchImageAddResult | void> => {
      if (a.kind === 'add') {
        await attachImage(productId, a.file, a.isPrimary, a.displayOrder)
        return
      }
      if (a.kind === 'addMany') {
        let addedCount = 0
        const failedImages: FailedImageUpload[] = []
        for (let i = 0; i < a.files.length; i += 1) {
          const file = a.files[i]
          a.onProgress?.(i + 1, a.files.length)
          try {
            await attachImage(productId, file, a.needPrimary && i === 0, a.startOrder + addedCount)
            addedCount += 1
          } catch (err) {
            failedImages.push({
              name: file.name,
              reason: imageUploadMessage(err, getErrorMessage(err, 'Chưa tải được ảnh lên.')),
            })
          }
        }
        return { addedCount, failedImages }
      }
      if (a.kind === 'primary') await productService.setPrimaryImage(productId, a.imageId)
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
