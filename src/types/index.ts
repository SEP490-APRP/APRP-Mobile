export type { AuthUser, SessionUser, UserRole } from './auth.types'
export type { ApiError, ApiResponse, PageResponse, PaginatedResponse } from './api.types'
export type { BaseEntity, User, SelectOption, SortDirection, PaginationParams } from './common.types'
export * from './order.types'
export * from './chat'

export enum BlogCategory {
  STORY = 'STORY',
  NEW_PRODUCT = 'NEW_PRODUCT',
  GUIDE = 'GUIDE',
  PROMOTION = 'PROMOTION',
  SUC_KHOE = 'SUC_KHOE',
  NONG_NGHIEP = 'NONG_NGHIEP',
  ME_O_VAT = 'ME_O_VAT',
  TIN_TUC_CAPNONG = 'TIN_TUC_CAPNONG',
  KHUYEN_MAI = 'KHUYEN_MAI',
  CAM_NANG = 'CAM_NANG',
  NHA_NONG = 'NHA_NONG',
  XU_HUONG = 'XU_HUONG',
}

export const BlogCategoryLabel: Record<string, string> = {
  [BlogCategory.STORY]: 'Chuyện nhà nông',
  [BlogCategory.NEW_PRODUCT]: 'Nông sản mới & Mùa vụ',
  [BlogCategory.GUIDE]: 'Cẩm nang & Mẹo vặt',
  [BlogCategory.PROMOTION]: 'Khuyến mãi & Ưu đãi',
  [BlogCategory.SUC_KHOE]: 'Sức khỏe & Dinh dưỡng',
  [BlogCategory.NONG_NGHIEP]: 'Nông nghiệp sạch & Nhà vườn',
  [BlogCategory.ME_O_VAT]: 'Mẹo vặt nội trợ',
  [BlogCategory.TIN_TUC_CAPNONG]: 'Tin tức CapNong',
  [BlogCategory.KHUYEN_MAI]: 'Chương trình khuyến mãi',
  [BlogCategory.CAM_NANG]: 'Cẩm nang nhà nông',
  [BlogCategory.NHA_NONG]: 'Chuyện nhà nông',
  [BlogCategory.XU_HUONG]: 'Xu hướng tiêu dùng xanh',
}
