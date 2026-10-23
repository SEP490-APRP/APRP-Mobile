/* ===== Common Shared Types ===== */

/** Base entity with common fields */
export interface BaseEntity {
  id: string
  createdAt: string
  updatedAt: string
}

/** User entity */
export interface User extends BaseEntity {
  email: string
  fullName: string
  avatar?: string
  role: UserRole
}

/** User roles */
export type UserRole = 'admin' | 'user' | 'moderator'

/** Select option (for dropdowns, etc.) */
export interface SelectOption {
  label: string
  value: string | number
}

/** Sort direction */
export type SortDirection = 'asc' | 'desc'

/** Query params for paginated requests */
export interface PaginationParams {
  page: number
  limit: number
  search?: string
  sortBy?: string
  sortDirection?: SortDirection
}
