import { useQuery } from '@tanstack/react-query'
import { categoryService, productService, type ProductResponse } from '@/services'
import type { CategoryResponse } from '@/services/category.types'
import { toStorefrontProduct } from '../utils/storefrontProduct'

/** Query key giữ giống bản web để sau này invalidate chung được. */
export const productKeys = {
  all: ['products'] as const,
  list: () => [...productKeys.all, 'list'] as const,
  detail: (id: number) => [...productKeys.all, 'detail', id] as const,
}

const fetchActiveProducts = async () => (await productService.getAll()).result ?? []

/** Backend gắn shop dạng object `shop: { id }`; giữ hai khoá phẳng cũ để không vỡ dữ liệu mock. */
export const productShopId = (p: ProductResponse) => p.shop?.id ?? p.shopOwnerId ?? p.shopId

const belongsToShop = (p: ProductResponse, shopId: number) => productShopId(p) === shopId

export const categoryKeys = {
  all: ['categories'] as const,
  list: () => [...categoryKeys.all, 'list'] as const,
}

/** Sản phẩm đang bán, đã đổi sang dạng ProductCard hiển thị. */
export function useStorefrontProducts() {
  return useQuery({
    queryKey: productKeys.list(),
    queryFn: fetchActiveProducts,
    select: (products) => products.map(toStorefrontProduct),
  })
}

/** Sản phẩm đang bán của một shop (dùng chung cache với danh sách tất cả sản phẩm). */
export function useShopProducts(shopId: number) {
  return useQuery({
    queryKey: productKeys.list(),
    queryFn: fetchActiveProducts,
    select: (products) => products.filter((p) => belongsToShop(p, shopId)).map(toStorefrontProduct),
  })
}

export type ProductDetailData = { product: ProductResponse | null; related: ProductResponse[] }

/**
 * Chi tiết sản phẩm kèm gallery ảnh và tối đa 4 sản phẩm liên quan (ưu tiên cùng shop),
 * chuyển từ useProductDetail bản web. Bỏ bảng slug catalog cũ vì app chỉ mở theo id số.
 */
export function useProductDetail(id: number) {
  return useQuery({
    queryKey: productKeys.detail(id),
    enabled: id > 0,
    queryFn: async (): Promise<ProductDetailData> => {
      let found: ProductResponse | null = null
      try {
        found = (await productService.getById(id)).result ?? null
      } catch {
        /* thử tìm trong danh sách */
      }
      const products = await fetchActiveProducts()
      found ??= products.find((p) => p.id === id) ?? null
      if (!found) return { product: null, related: [] }

      let product = found
      if (!product.images || product.images.length === 0) {
        try {
          const images = (await productService.getImages(found.id)).result
          if (images && images.length > 0) product = { ...found, images }
        } catch {
          /* không có gallery thì dùng ảnh chính */
        }
      }

      const shopId = productShopId(found)
      const others = products.filter((p) => p.id !== id)
      const sameShop = shopId ? others.filter((p) => belongsToShop(p, shopId)) : []
      return { product, related: (sameShop.length >= 2 ? sameShop : others).slice(0, 4) }
    },
  })
}

export function useCategories() {
  return useQuery<CategoryResponse[]>({
    queryKey: categoryKeys.list(),
    queryFn: async () => (await categoryService.getAll()).result ?? [],
    staleTime: 5 * 60 * 1000, // danh mục ít khi đổi
  })
}
