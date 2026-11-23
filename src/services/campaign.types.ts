/** Kiểu dữ liệu chiến dịch giải cứu (khớp DTO BE_CapNong: CampaignResponse, PreOrderResponse) */

export type CampaignStatus = 'DRAFT' | 'ACTIVE' | 'THRESHOLD_MET' | 'FULFILLING' | 'COMPLETED' | 'CANCELLED'

/** Giai đoạn hiển thị công khai (tham số ?phase= của GET /campaigns) */
export type CampaignPhase = 'UPCOMING' | 'ONGOING' | 'DELIVERING' | 'DONE'

/** Người mua chỉ đặt được KG_5 / KG_10 / KG_15; KG_3 / KG_20 / KG_50 còn ở đơn cũ */
export type CrateSize = 'KG_3' | 'KG_5' | 'KG_10' | 'KG_15' | 'KG_20' | 'KG_50'
export type FulfillmentMethod = 'DELIVERY' | 'PICKUP'

export interface CampaignResponse {
  campaignId: number
  code: string
  title: string
  description?: string | null
  categoryId?: number | null
  categoryName?: string | null
  season?: string | null
  coverImageUrl?: string | null
  /** Banner trang chủ do Admin tuỳ chỉnh; bannerMode null = AUTO (dựng từ thông tin chiến dịch) */
  bannerMode?: 'AUTO' | 'IMAGE' | null
  bannerTheme?: 'ORANGE' | 'GREEN' | 'RED' | null
  bannerHeadline?: string | null
  bannerSubline?: string | null
  bannerBadge?: string | null
  bannerCtaText?: string | null
  bannerImageUrl?: string | null
  bannerOnHome?: boolean | null
  bannerUpdatedAt?: string | null
  /** Thứ tự trong banner đầu trang chủ (null = không gắn) */
  homeSlideOrder?: number | null
  targetVolumeKg: number
  minThresholdKg: number
  rescuePricePerKg: number
  /** 0-1, vd 0.3 = 30% */
  depositPercent: number
  cutoffAt: string
  /** Ngày bắt đầu chiến dịch (yyyy-MM-dd), sau hạn chốt đơn đặt trước */
  startDate?: string | null
  /** Ngày kết thúc chiến dịch (yyyy-MM-dd) */
  endDate?: string | null
  /** Ngày giờ đăng bài kêu gọi nhà vườn góp hàng */
  publishAt?: string | null
  /** Hạn chốt góp hàng của nhà vườn (trước hạn chốt đơn đặt trước) */
  farmCutoffAt?: string | null
  deliveryDate?: string | null
  collectionSiteName?: string | null
  collectionSiteAddress?: string | null
  collectionSiteLatitude?: number | null
  collectionSiteLongitude?: number | null
  /** Quy tắc phí giao của chiến dịch */
  shipHalfKg?: number | null
  shipFreeKg?: number | null
  shipFreeRadiusKm?: number | null
  groupDiscountMinOrders?: number | null
  pickupEnabled?: boolean | null
  status: CampaignStatus
  bookedVolumeKg: number
  remainingVolumeKg: number
  /** 0-100 */
  progressPercent: number
  approvedSurplusKg: number
  approvedFarmCount: number
  /** Số lô đã duyệt (một nhà vườn có thể góp nhiều lô) */
  approvedLotCount?: number
  pendingFarmCount: number
  /** Cung - cầu khi gom hàng (có từ THRESHOLD_MET) */
  soldVolumeKg?: number | null
  acceptedVolumeKg?: number | null
  packedVolumeKg?: number | null
  shortfallVolumeKg?: number | null
  intakePendingCount?: number
  /** Kêu gọi nhà vườn bổ sung hàng khi mọi lô đã giao mà vẫn thiếu */
  topUpOpen?: boolean
  topUpCallAt?: string | null
  topUpClosedAt?: string | null
  topUpKg?: number | null
  topUpRemainingKg?: number | null
  evaluatedAt?: string | null
  completedAt?: string | null
  cancelledAt?: string | null
  cancelReason?: string | null
  publishedAt?: string | null
  callPostedAt?: string | null
  createdAt?: string | null
}

/** Banner đầu trang chủ: các chiến dịch gắn theo thứ tự + số giây tự chuyển */
export interface HomeBannerConfig {
  intervalSeconds: number
  campaigns: CampaignResponse[]
}

export interface CampaignBannerRequest {
  mode: 'AUTO' | 'IMAGE'
  theme: 'ORANGE' | 'GREEN' | 'RED'
  headline?: string
  subline?: string
  badge?: string
  ctaText?: string
  imageUrl?: string
  showOnHome: boolean
}

export interface CampaignPage<T> {
  page: number
  size: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
  content: T[]
}

export interface PreOrderCreateRequest {
  crateSize: CrateSize
  crateQuantity: number
  recipientName: string
  recipientPhone: string
  shippingAddress: string
  shippingLatitude?: number
  shippingLongitude?: number
  note?: string
  /** Trừ ví người mua trước cho tiền cọc, phần còn lại qua PayOS */
  useWallet?: boolean
  /** DELIVERY (giao tận nơi) | PICKUP (tự đến điểm tập kết, 0đ) */
  fulfillmentMethod?: FulfillmentMethod
  deliveryWard?: string
}

export type PriorityLevel = 'URGENT' | 'HIGH' | 'NORMAL'

export interface DispatchZone {
  zone: string
  orderCount: number
  totalKg: number
  codTotal: number
  topPriority: PriorityLevel
  orders: PreOrderResponse[]
}

export interface DispatchShipper {
  id: number
  name: string
  phone?: string | null
  vehicleNumber?: string | null
  online: boolean
  activePreOrders: number
  latitude?: number | null
  longitude?: number | null
  locationUpdatedAt?: string | null
}

export interface DispatchBoard {
  campaignId: number
  campaignStatus: CampaignStatus
  shelfLifeTier?: ShelfLifeTier | null
  urgentCount: number
  highCount: number
  normalCount: number
  waitingCount: number
  dispatchedCount: number
  zones: DispatchZone[]
  shippers: DispatchShipper[]
}

export interface ShippingQuote {
  fulfillmentMethod: FulfillmentMethod
  totalKg: number
  distanceKm?: number | null
  baseFee?: number | null
  shippingFee?: number | null
  discountPercent: number
  nextTierKg?: number | null
  nextTierLabel?: string | null
  note?: string | null
  halfShipKg: number
  freeShipKg: number
  freeShipRadiusKm: number
  groupDiscountMinOrders: number
  pickupEnabled: boolean
  collectionSiteName?: string | null
  collectionSiteAddress?: string | null
}

export type DamageClaimStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

/** Báo hàng hư đơn chiến dịch: người mua cân + chụp ảnh, admin duyệt và hoàn tiền từ ví sàn */
export interface DamageClaim {
  claimId: number
  preOrderId: number
  preOrderCode: string
  campaignId: number
  campaignTitle?: string | null
  buyerName?: string | null
  buyerPhone?: string | null
  orderKg: number
  pricePerKg?: number | null
  status: DamageClaimStatus
  claimedKg: number
  photoUrls: string[]
  reason?: string | null
  approvedKg?: number | null
  refundAmount?: number | null
  adminNote?: string | null
  sourceShopName?: string | null
  deliveredAt?: string | null
  createdAt: string
  reviewedAt?: string | null
}

export interface PreOrderResponse {
  preOrderId: number
  code: string
  campaignId: number
  campaignTitle: string
  campaignStatus: CampaignStatus
  crateSize: CrateSize
  crateKg: number
  crateQuantity: number
  totalKg: number
  unitPrice: number
  totalAmount: number
  depositAmount: number
  remainingAmount: number
  buyerName?: string | null
  recipientName?: string | null
  recipientPhone?: string | null
  shippingAddress?: string | null
  deliveryZone?: string | null
  fulfillmentMethod?: FulfillmentMethod | null
  deliveryWard?: string | null
  shippingDistanceKm?: number | null
  shippingBaseFee?: number | null
  shippingFee?: number | null
  shippingDiscountAmount?: number | null
  /** Shipper: tiền thu hộ đang ký quỹ trong ví cho lượt giao hiện tại */
  codReservedAmount?: number | null
  /** Shipper: tổng cước đã nhận cho đơn (sau phí dịch vụ 3%) */
  shipperIncomeAmount?: number | null
  collectionSiteName?: string | null
  collectionSiteAddress?: string | null
  /** Độ gấp khi giao */
  priorityLevel?: PriorityLevel | null
  priorityReason?: string | null
  deliverBy?: string | null
  shelfLifeTier?: ShelfLifeTier | null
  retryCount?: number | null
  /** Báo hàng hư: hạn báo (24h sau khi nhận), yêu cầu mới nhất, tổng tiền đã hoàn */
  damageClaimDeadline?: string | null
  damageClaimStatus?: DamageClaimStatus | null
  damageClaimKg?: number | null
  damageRefundTotal?: number | null
  /** Lô nhà vườn dùng đóng thùng cho đơn */
  sourceRegistrationId?: number | null
  sourceShopName?: string | null
  sourceProductName?: string | null
  sourceHarvestDate?: string | null
  packedAt?: string | null
  readyAt?: string | null
  pickedUpAt?: string | null
  pickupRemindedAt?: string | null
  pickupRemindCount?: number | null
  deliveredAt?: string | null
  podImageUrl?: string | null
  shippingLatitude?: number | null
  shippingLongitude?: number | null
  qrCode?: string | null
  shipperId?: number | null
  shipperName?: string | null
  cancelReason?: string | null
  failReason?: string | null
  /** Số thùng ban đầu, chỉ có khi đơn bị giảm thùng do thiếu hàng */
  originalCrateQuantity?: number | null
  /** Tiền cọc đã hoàn do thiếu hàng */
  shortfallRefundAmount?: number | null
  depositPaidAt?: string | null
  /** READY: đã tới hub, chờ shipper lấy. SHIPPING: shipper đã lấy hàng, đang giao */
  status: 'PENDING' | 'DEPOSIT_PAID' | 'PROCESSING' | 'READY' | 'SHIPPING' | 'DELIVERED' | 'CANCELLED' | 'FAILED'
  depositStatus?: 'PENDING' | 'HELD_IN_ESCROW' | 'RELEASED_TO_FARMER' | 'REFUNDED' | 'CANCELLED' | null
  checkoutUrl?: string | null
  qrCodeUrl?: string | null
  createdAt?: string | null
}

/* ─────────────── Nhà vườn (shop) đăng ký lô hàng vào chiến dịch ─────────────── */

/** Thời gian bảo quản lô hàng sau thu hoạch */
/** Mức bảo quản: số ngày hàng còn tươi tính từ NGÀY CHỐT chiến dịch */
export type ShelfLifeTier = 'DAYS_2_3' | 'DAYS_3_4' | 'DAYS_5_6'

/** CANCELLED: chiến dịch bị huỷ nên lô đăng ký huỷ theo */
export type FarmRegistrationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'

export interface FarmRegistrationRequest {
  surplusVolumeKg: number
  /** yyyy-MM-dd */
  harvestDate: string
  note?: string
  productId?: number
  productName: string
  productImageUrls: string[]
  proposedPricePerKg: number
  priceCommitted: boolean
  shelfLifeTier: ShelfLifeTier
}

export interface FarmRegistrationResponse {
  registrationId: number
  campaignId: number
  campaignTitle: string
  campaignStatus: CampaignStatus
  campaignCutoffAt: string
  collectionSiteName?: string | null
  collectionSiteAddress?: string | null
  deliveryDate?: string | null
  shopId: number
  shopName?: string | null
  shopPhone?: string | null
  surplusVolumeKg: number
  harvestDate: string
  note?: string | null
  productId?: number | null
  productName?: string | null
  productImageUrls: string[]
  proposedPricePerKg?: number | null
  agreedPricePerKg?: number | null
  effectivePricePerKg?: number | null
  campaignPricePerKg?: number | null
  priceCommitted?: boolean | null
  shelfLifeTier?: ShelfLifeTier | null
  status: FarmRegistrationStatus
  reviewNote?: string | null
  reviewedAt?: string | null
  allocatedVolumeKg?: number | null
  receivedWeightKg?: number | null
  /** Kg hư hỏng bị loại khi kiểm */
  rejectedWeightKg?: number | null
  /** Kg đạt chuẩn = cân - hư */
  acceptedWeightKg?: number | null
  /** Kg được tính tiền = min(đạt chuẩn, phân bổ) */
  countedWeightKg?: number | null
  /** Kg thiếu so với phân bổ */
  shortfallKg?: number | null
  qualityPassed?: boolean | null
  intakePhotoUrls: string[]
  intakeNote?: string | null
  intakeAt?: string | null
  /** Tiền dự tính sau khi cân; tiền thật chuyển vào ví khi chiến dịch hoàn tất */
  estimatedPayoutAmount?: number | null
  payoutAmount?: number | null
  paidOutAt?: string | null
  createdAt?: string | null
}

/* ─────────────── Admin vận hành chiến dịch ─────────────── */

export interface CampaignUpsertRequest {
  title: string
  description?: string
  season?: string
  categoryId?: number
  coverImageUrl?: string
  targetVolumeKg: number
  minThresholdKg: number
  rescuePricePerKg: number
  depositPercent: number
  /** yyyy-MM-ddTHH:mm:ss */
  cutoffAt: string
  /** yyyy-MM-dd, không trước ngày chốt đơn */
  startDate?: string
  /** yyyy-MM-dd, không trước ngày bắt đầu */
  endDate?: string
  /** yyyy-MM-ddTHH:mm:ss, ngày giờ đăng bài kêu gọi nhà vườn */
  publishAt?: string
  /** yyyy-MM-ddTHH:mm:ss, sau ngày đăng bài, trước hạn chốt đơn đặt trước */
  farmCutoffAt?: string
  deliveryDate?: string
  collectionSiteName?: string
  collectionSiteAddress?: string
  collectionSiteLatitude?: number
  collectionSiteLongitude?: number
  shipHalfKg?: number
  shipFreeKg?: number
  shipFreeRadiusKm?: number
  groupDiscountMinOrders?: number
  pickupEnabled?: boolean
}

export interface CampaignIntakeRequest {
  /** Tổng kg cân thực tế */
  receivedWeightKg: number
  /** Kg hư hỏng bị loại */
  rejectedWeightKg?: number
  qualityPassed?: boolean
  photoUrls?: string[]
  note?: string
}

/** Shop admin có thể mời / nhập hộ trong 1 chiến dịch (khớp NearbyShopResponse ở BE) */
export interface CampaignShopRow {
  shopId: number
  shopName: string
  logoUrl?: string | null
  ratingAverage?: number | null
  /** null khi shop chưa ghim vị trí */
  distanceKm?: number | null
  categories: string[]
  sameCategory: boolean
  /** Trạng thái lô gần nhất của shop trong chiến dịch, null nếu chưa góp */
  registrationStatus?: FarmRegistrationStatus | null
  /** Tổng kg đã góp (chờ duyệt + đã duyệt) */
  registeredKg?: number | null
}

/** Admin nhập hộ lô hàng cho shop đã đồng ý góp */
export interface AdminFarmRegistrationRequest {
  shopId: number
  surplusVolumeKg: number
  /** yyyy-MM-dd */
  harvestDate: string
  productName?: string
  agreedPricePerKg?: number
  shelfLifeTier: ShelfLifeTier
  note?: string
}
