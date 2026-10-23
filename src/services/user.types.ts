export interface RoleResponse {
  id?: number
  name: string
  description?: string
}

export interface UserResponse {
  id: number
  username?: string
  fullName: string
  email: string
  phone?: string
  phoneNumber?: string
  avatar?: string
  logoUrl?: string
  status: 'ACTIVE' | 'PENDING' | 'INACTIVE' | 'REJECTED'
  kycStatus?: 'APPROVED' | 'PENDING' | 'REJECTED' | 'ACTIVE'
  roleName?: string
  role: RoleResponse
  shopName?: string
  address?: string
  createdAt?: string
  createAt?: string
  lockedAt?: string
  identityCardNumber?: string
  identityCardFrontUrl?: string
  identityCardBackUrl?: string
  businessLicenseUrl?: string
  bankName?: string
  bankAccountNumber?: string
  bankAccountName?: string
  bankAccountHolder?: string
  bankAccount?: string
  vehicleType?: string
  licensePlate?: string
  license?: string
  vehicleNumber?: string
  licenseImageUrl?: string
  vehicleDocImageUrl?: string
  rating?: number
  ratingAverage?: number
  totalOrders?: number
  completedOrders?: number
  reportCount?: number
  description?: string
  achievement?: string
  dietPreference?: 'VEGETARIAN' | 'NON_VEGETARIAN' | 'VEGAN'
  loyaltyPoints?: number
  totalRescuedWeight?: number
}

export type AdminUserReportType = 'week' | 'month' | 'year' | 'all'

export interface AdminUserReportItem {
  period?: string
  date?: string
  buyers?: number
  shops?: number
  shippers?: number
  total?: number
  activeUsers?: number
  newUsers?: number
  locked?: number
  [key: string]: unknown
}

export interface AdminUserReport {
  totalUsers: number
  totalBuyers: number
  totalShops: number
  totalShipper: number
  totalActiveUsers: number
  totalInactiveUsers: number
  totalShopPending: number
  totalShopSelling: number
  totalShopNotSelling: number
  totalUserLock: number
  userReports: AdminUserReportItem[]
  summary?: {
    totalUsers: number
    activeUsers: number
    pendingKyc: number
    blockedUsers: number
    totalBuyers: number
    totalShops: number
    totalShippers: number
  }
  chartData?: AdminUserReportItem[]
}
