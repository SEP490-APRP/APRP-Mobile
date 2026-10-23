import { axiosInstance } from './api/axiosInstance'
import type { ApiResponse, PageResponse } from '@/types'
import type {
  BlogCommentRequest,
  BlogCommentResponse,
  BlogCreateRequest,
  BlogCreationRequest,
  BlogResponse,
  BlogUpdateRequest,
} from './blog.types'

export type * from './blog.types'

const emptyPage = <T>(size = 10): PageResponse<T> => ({
  content: [],
  page: 0,
  size,
  totalElements: 0,
  totalPages: 0,
  first: true,
  last: true,
})

export const blogService = {
  // ==========================================
  // 1. PUBLIC BLOG APIs (/v1/public/blogs)
  // ==========================================

  /** Lấy danh sách bài viết công khai (hỗ trợ phân trang, lọc theo category, tìm kiếm) */
  async getPublicBlogs(params?: {
    page?: number
    size?: number
    category?: string
    search?: string
  }): Promise<PageResponse<BlogResponse>> {
    // Để lỗi mạng/API nổi lên cho màn hình hiện "Thử lại", thay vì giả làm danh sách rỗng.
    const res = await axiosInstance.get<ApiResponse<PageResponse<BlogResponse>>>('/v1/public/blogs', {
      params: {
        page: params?.page ?? 0,
        size: params?.size ?? 10,
        ...(params?.category && params.category !== 'all' ? { category: params.category } : {}),
        ...(params?.search && params.search.trim() ? { search: params.search.trim() } : {}),
      },
    })
    return res.data?.result ?? emptyPage(params?.size)
  },

  /** Xem chi tiết bài viết (tự động tăng views) */
  async getBlogDetail(blogId: number): Promise<BlogResponse> {
    const res = await axiosInstance.get<ApiResponse<BlogResponse>>(`/v1/public/blogs/${blogId}`)
    if (res.data?.result) return res.data.result
    throw new Error('Bài viết không tồn tại')
  },

  /** Toggle Like / Unlike bài viết (yêu cầu đăng nhập) */
  async toggleLike(blogId: number): Promise<{ message: string; isLiked: boolean }> {
    const res = await axiosInstance.post<ApiResponse<string>>(`/v1/public/blogs/${blogId}/like`)
    const msg = res.data?.result || ''
    const isLiked = msg.toUpperCase() === 'LIKED' || msg.includes('đã thích')
    return { message: msg, isLiked }
  },

  /** Lấy danh sách bình luận của bài viết */
  async getBlogComments(
    blogId: number,
    params?: { page?: number; size?: number },
  ): Promise<PageResponse<BlogCommentResponse>> {
    const res = await axiosInstance.get<ApiResponse<PageResponse<BlogCommentResponse>>>(
      `/v1/public/blogs/${blogId}/comments`,
      { params: { page: params?.page ?? 0, size: params?.size ?? 10 } },
    )
    return res.data?.result ?? emptyPage(params?.size)
  },

  /** Gửi bình luận cho bài viết (yêu cầu đăng nhập) */
  async addComment(blogId: number, content: string): Promise<BlogCommentResponse> {
    const req: BlogCommentRequest = { content }
    const res = await axiosInstance.post<ApiResponse<BlogCommentResponse>>(`/v1/public/blogs/${blogId}/comments`, req)
    if (res.data?.result) return res.data.result
    throw new Error('Không thể thêm bình luận')
  },

  /** Xóa bình luận */
  async deleteComment(commentId: number): Promise<boolean> {
    await axiosInstance.delete(`/v1/public/blogs/comments/${commentId}`)
    return true
  },

  // ==========================================
  // 2. SHOP BLOG APIs (/v1/shop/blogs)
  // ==========================================

  /** Lấy danh sách bài viết của shop mình */
  async getMyBlogs(params?: { page?: number; size?: number }): Promise<PageResponse<BlogResponse>> {
    // Ném lỗi thay vì trả trang rỗng, để màn hình phân biệt "chưa có bài" với "không tải được".
    const res = await axiosInstance.get<ApiResponse<PageResponse<BlogResponse>>>('/v1/shop/blogs', {
      params: { page: params?.page ?? 0, size: params?.size ?? 10 },
    })
    return res.data?.result ?? emptyPage<BlogResponse>()
  },

  /** Shop tạo bài viết mới */
  async createShopBlog(data: BlogCreateRequest): Promise<BlogResponse> {
    const res = await axiosInstance.post<ApiResponse<BlogResponse>>('/v1/shop/blogs', data)
    if (res.data?.result) return res.data.result
    throw new Error('Không thể tạo bài viết')
  },

  /** Shop cập nhật bài viết */
  async updateShopBlog(blogId: number, data: BlogUpdateRequest): Promise<BlogResponse> {
    const res = await axiosInstance.put<ApiResponse<BlogResponse>>(`/v1/shop/blogs/${blogId}`, data)
    if (res.data?.result) return res.data.result
    throw new Error('Không thể cập nhật bài viết')
  },

  /** Shop xóa bài viết */
  async deleteShopBlog(blogId: number): Promise<boolean> {
    await axiosInstance.delete(`/v1/shop/blogs/${blogId}`)
    return true
  },

  // ==========================================
  // 3. ADMIN & BACKWARD COMPATIBLE METHODS
  // ==========================================

  /** Admin lấy tất cả bài viết toàn sàn (mọi trạng thái, lọc, tìm kiếm) */
  async getAllBlogsForAdmin(params?: {
    page?: number
    size?: number
    status?: string
    category?: string
    search?: string
  }): Promise<PageResponse<BlogResponse>> {
    try {
      const res = await axiosInstance.get<ApiResponse<PageResponse<BlogResponse>>>('/v1/admin/blogs', {
        params: {
          page: params?.page ?? 0,
          size: params?.size ?? 10,
          ...(params?.status && params.status !== 'all' ? { status: params.status } : {}),
          ...(params?.category && params.category !== 'all' ? { category: params.category } : {}),
          ...(params?.search && params.search.trim() ? { search: params.search.trim() } : {}),
        },
      })
      if (res.data?.result) return res.data.result
      return {
        content: [],
        page: 0,
        size: 10,
        totalElements: 0,
        totalPages: 0,
        first: true,
        last: true,
      }
    } catch (error) {
      console.error('Lỗi khi lấy danh sách bài viết quản trị:', error)
      return {
        content: [],
        page: 0,
        size: 10,
        totalElements: 0,
        totalPages: 0,
        first: true,
        last: true,
      }
    }
  },

  /** Admin đổi trạng thái bài viết (PUBLISHED, HIDDEN, DRAFT) */
  async updateBlogStatus(blogId: number, status: 'PUBLISHED' | 'HIDDEN' | 'DRAFT'): Promise<BlogResponse> {
    const res = await axiosInstance.patch<ApiResponse<BlogResponse>>(`/v1/admin/blogs/${blogId}/status`, null, {
      params: { status },
    })
    if (res.data?.result) return res.data.result
    throw new Error('Không thể cập nhật trạng thái bài viết')
  },

  async getAllBlogs(
    page: number = 0,
    size: number = 10,
    query?: string,
    category?: string,
    status?: string,
  ): Promise<ApiResponse<PageResponse<BlogResponse>>> {
    const paged = await this.getAllBlogsForAdmin({
      page,
      size,
      search: query,
      category,
      status,
    })
    return {
      code: 200,
      result: paged,
    }
  },

  async getAllBlogsPaged(
    page: number = 0,
    size: number = 10,
    query?: string,
    category?: string,
    status?: string,
  ): Promise<ApiResponse<PageResponse<BlogResponse>>> {
    return this.getAllBlogs(page, size, query, category, status)
  },

  async createBlog(data: BlogCreationRequest): Promise<ApiResponse<BlogResponse>> {
    const shopReq: BlogCreateRequest = {
      title: data.title,
      content: data.content,
      pictureUrl: data.pictureUrl || '',
      status: (data.status as 'PUBLISHED' | 'DRAFT') || 'PUBLISHED',
      category: data.category,
    }
    const created = await this.createShopBlog(shopReq)
    return { code: 200, result: created }
  },

  async updateBlog(id: number, data: Partial<BlogResponse>): Promise<ApiResponse<BlogResponse>> {
    const updated = await this.updateShopBlog(id, data as BlogUpdateRequest)
    return { code: 200, result: updated }
  },

  async deleteBlog(id: number): Promise<ApiResponse<boolean>> {
    await this.deleteShopBlog(id)
    return { code: 200, result: true }
  },
}
