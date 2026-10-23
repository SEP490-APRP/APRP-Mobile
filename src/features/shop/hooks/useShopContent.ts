import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { blogKeys } from '@/features/blog/hooks/useStoryQueries'
import { blogService } from '@/services/blog.service'
import type { BlogStatus } from '@/services/blog.types'
import { uploadService } from '@/services/upload.service'
import { voucherService } from '@/services/voucher.service'
import type { UploadFile } from '@/types/upload.types'
import { toBlogRequest, type BlogDraft } from '../utils/blogDraft'
import { toVoucherRequest, type VoucherFormValues } from '../utils/shopVoucher'
import { shopKeys } from './useShopQueries'

/** Voucher và bài viết của gian hàng (bước 3e). */
export const shopContentKeys = {
  vouchers: () => [...shopKeys.all, 'vouchers'] as const,
  blogs: () => [...shopKeys.all, 'blogs'] as const,
}

/** Tải một ảnh lên Cloudinary, trả về đường dẫn. */
export async function uploadImageUrl(file: UploadFile, folder: string): Promise<string> {
  const url = (await uploadService.uploadImage(file, folder)).result?.url
  if (!url) throw new Error('Không nhận được đường dẫn ảnh từ máy chủ')
  return url
}

export function useShopVouchers() {
  return useQuery({ queryKey: shopContentKeys.vouchers(), queryFn: () => voucherService.getShopVouchers(0, 100) })
}

export function useCreateShopVoucher() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: VoucherFormValues) => voucherService.createShopVoucher(toVoucherRequest(v)),
    onSuccess: () => void qc.invalidateQueries({ queryKey: shopContentKeys.vouchers() }),
  })
}

/** Bật/tắt hoặc xoá mã (web chỉ cho xoá mã đã tạm dừng). */
export function useShopVoucherAction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, action }: { id: number; action: 'toggle' | 'delete' }) => {
      if (action === 'toggle') await voucherService.toggleShopVoucher(id)
      else await voucherService.deleteShopVoucher(id)
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: shopContentKeys.vouchers() }),
  })
}

export function useMyShopBlogs() {
  return useQuery({
    queryKey: shopContentKeys.blogs(),
    queryFn: async () => (await blogService.getMyBlogs({ page: 0, size: 50 })).content ?? [],
  })
}

function useInvalidateBlogs() {
  const qc = useQueryClient()
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: shopContentKeys.blogs() }),
      qc.invalidateQueries({ queryKey: blogKeys.all }),
    ])
}

/** Đăng, lưu nháp hoặc sửa bài. Ảnh bìa mới chọn từ máy được tải lên trước. */
export function useSaveShopBlog() {
  const invalidate = useInvalidateBlogs()
  return useMutation({
    mutationFn: async ({
      id,
      draft,
      status,
      cover,
      pictureUrl,
    }: {
      id?: number
      draft: BlogDraft
      status: BlogStatus
      cover?: UploadFile
      pictureUrl?: string
    }) => {
      const url = cover ? await uploadImageUrl(cover, 'blogs') : pictureUrl
      const req = toBlogRequest(draft, status, url)
      return id ? blogService.updateShopBlog(id, req) : blogService.createShopBlog(req)
    },
    onSuccess: () => void invalidate(),
  })
}

export function useDeleteShopBlog() {
  const invalidate = useInvalidateBlogs()
  return useMutation({
    mutationFn: (id: number) => blogService.deleteShopBlog(id),
    onSuccess: () => void invalidate(),
  })
}
