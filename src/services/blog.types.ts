import type { BlogCategory } from '@/types'

export type BlogStatus = 'PUBLISHED' | 'DRAFT' | 'HIDDEN' | 'ARCHIVED'

export interface BlogResponse {
  blogId: number
  id?: number // Alias cho blogId
  title: string
  content: string
  pictureUrl?: string
  imageUrl?: string // Alias cho pictureUrl
  status: BlogStatus
  category: BlogCategory
  createAt?: string
  createdAt?: string // Alias cho createAt
  updatedAt?: string
  views?: number
  viewCount?: number // Alias cho views

  // Thông tin shop
  shopId?: number
  shopName?: string
  shopAvatar?: string
  authorName?: string // Alias cho shopName
  adminName?: string

  // Thống kê tương tác
  likeCount?: number
  commentCount?: number

  // Trạng thái tương tác của user hiện tại
  isLikedByCurrentUser?: boolean
}

export interface BlogCommentResponse {
  commentId: number
  content: string
  createAt: string
  userId: number
  userName: string
  userAvatar?: string
}

export interface BlogCreateRequest {
  title: string
  content: string
  pictureUrl?: string
  status: BlogStatus
  category?: BlogCategory
}

export interface BlogUpdateRequest {
  title?: string
  content?: string
  pictureUrl?: string
  status?: BlogStatus
  category?: BlogCategory
}

export interface BlogCommentRequest {
  content: string
}

// Giữ lại alias cho Admin NewsManagement
export interface BlogCreationRequest {
  title: string
  content: string
  category: BlogCategory
  status: string
  image?: File | null
  pictureUrl?: string
}
