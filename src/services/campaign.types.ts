/** Kiểu dữ liệu chiến dịch giải cứu (khớp DTO BE_CapNong: CampaignResponse, PreOrderResponse) */

export type CampaignStatus = 'DRAFT' | 'ACTIVE' | 'THRESHOLD_MET' | 'FULFILLING' | 'COMPLETED' | 'CANCELLED'

/** Giai đoạn hiển thị công khai (tham số ?phase= của GET /campaigns) */
export type CampaignPhase = 'UPCOMING' | 'ONGOING' | 'DELIVERING' | 'DONE'

/** Người mua chỉ đặt được KG_5 / KG_10 / KG_15; KG_3 / KG_20 / KG_50 còn ở đơn cũ */
export type CrateSize = 'KG_3' | 'KG_5' | 'KG_10' | 'KG_15' | 'KG_20' | 'KG_50'
export type FulfillmentMethod = 'DELIVERY' | 'PICKUP'

export interface CampaignResponse {
  /** Nông sản cần giải cứu: lô nhà vườn góp mang tên này */
  productName?: string | null
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
  /** Ngày bắt đầu mở điểm tập kết tại điểm tập kết (yyyy-MM-dd), sau hạn chốt đơn đặt trước */
  startDate?: string | null
  /** Ngày kết thúc mở điểm tập kết (yyyy-MM-dd), cũng là ngày cần xe chở hàng ra hub */
  endDate?: string | null
  /** Ngày kết thúc chiến dịch (yyyy-MM-dd): ngày tài xế giao hàng xong */
  finishDate?: string | null
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
  /** Phí giao cố định theo kg: từ shipFreeKg miễn phí, từ shipHalfKg thu shipMidFee, nhẹ hơn thu shipSmallFee */
  shipHalfKg?: number | null
  shipFreeKg?: number | null
  shipMidFee?: number | null
  shipSmallFee?: number | null
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
  /** Hàng tại điểm tập kết (hư, bổ sung, bớt đơn); null khi chưa cân lô nào */
  supply?: SupplySummary | null
  evaluatedAt?: string | null
  completedAt?: string | null
  cancelledAt?: string | null
  cancelReason?: string | null
  publishedAt?: string | null
  callPostedAt?: string | null
  /** Lần cuối admin gửi thông báo kêu gọi shipper, và số chuyến đã kêu gọi */
  shipperCalledAt?: string | null
  shipperCallTrips?: number | null
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
  /** Số kg muốn mua (bội số của 5), máy chủ tự chia thùng */
  totalKg: number
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
  /** Loại xe (VehicleType) và sức chở (kg): lọc tài xế đủ tải cho chuyến chở hàng ra hub */
  vehicleType?: VehicleType | null
  vehicleCapacityKg?: number
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
  midShipFee: number
  smallShipFee: number
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
  /** Số shipper dự kiến nhận khi giao đơn (sau phí dịch vụ); đơn đã gán hub thì tính theo hub -> người mua */
  shipperEarnEstimate?: number | null
  collectionSiteName?: string | null
  collectionSiteAddress?: string | null
  /** Hub (điểm trung chuyển gần người mua) shipper tới lấy hàng */
  hubId?: number | null
  hubName?: string | null
  hubAddress?: string | null
  hubLatitude?: number | null
  hubLongitude?: number | null
  hubPhone?: string | null
  hubOpenHours?: string | null
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
  /** READY: hàng còn ở điểm tập kết, đang trên xe ra hub, hay đã tới hub */
  hubStage?: 'AT_SITE' | 'ON_THE_WAY' | 'AT_HUB' | null
  /** Hub xác nhận đã nhận đơn từ xe tải, hoặc ghi chú thiếu / hư */
  hubReceivedAt?: string | null
  hubReceivedBy?: string | null
  hubIssueNote?: string | null
  /** READY: đã chia về hub. SHIPPING: shipper đã lấy hàng, đang giao */
  status: 'PENDING' | 'DEPOSIT_PAID' | 'PROCESSING' | 'READY' | 'SHIPPING' | 'DELIVERED' | 'CANCELLED' | 'FAILED'
  depositStatus?: 'PENDING' | 'HELD_IN_ESCROW' | 'RELEASED_TO_FARMER' | 'REFUNDED' | 'CANCELLED' | null
  checkoutUrl?: string | null
  qrCodeUrl?: string | null
  createdAt?: string | null
}

/* ─────────────── Điểm trung chuyển (hub) ─────────────── */

/** Xe CapNong chở thùng đã đóng gói từ điểm tập kết tới hub gần khu dân cư, shipper lấy hàng tại hub */
export interface DeliveryHub {
  hubId: number
  name: string
  address: string
  latitude: number
  longitude: number
  phone?: string | null
  openHours?: string | null
  note?: string | null
  active: boolean
  /** Số đơn đang nằm ở hub chờ shipper */
  waitingOrders: number
  createdAt?: string | null
}

export interface DeliveryHubRequest {
  name: string
  address: string
  latitude: number
  longitude: number
  phone?: string
  openHours?: string
  note?: string
  active?: boolean
}

/* ─────────────── Xe chở hàng từ điểm tập kết ra hub ─────────────── */

/** Loại xe tài xế đăng ký; sức chở dùng để lọc chuyến chở hàng ra hub (khớp VehicleType ở BE) */
export type VehicleType = 'MOTORBIKE' | 'VAN' | 'TRUCK_1T' | 'TRUCK_2T' | 'TRUCK_5T'


/** Thông số tính cước xe chở hàng ra hub và cước giao chặng cuối (BE trả để FE ước tính chi phí) */
export interface HubFeeConfig {
  /** Số km đã gồm trong giá mở cửa */
  openKm: number
  minVehicleKg: number
  roadFactor: number
  /** Bảng giá xe tải theo trọng tải, nhỏ tới lớn */
  tiers: { label: string; maxKg: number; openFee: number; perKm: number; perKmOver20: number }[]
  lastMile: { under5: number; from5to10: number; from10to20: number; perKmOver20: number }
  serviceFeeRate: number
  /** Phí dịch vụ trên cước xe ra hub (mặc định 0) */
  hubServiceFeeRate: number
  /** Hoa hồng sàn giữ trên tiền hàng chiến dịch */
  farmerFeeRate: number
}

/** Kết quả gửi kêu gọi xe: số tài xế đã báo và số bị bỏ qua vì xe nhỏ */
export interface ShipperCallResult {
  sent: number
  skippedSmallVehicle: number
  minVehicleKg: number
}

export type HubTripStatus = 'OPEN' | 'ACCEPTED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED'

/** Một điểm dừng trên lộ trình xe: hub, số kg, số đơn */
export interface HubTripStop {
  hubId?: number | null
  hubName?: string | null
  hubAddress?: string | null
  hubLatitude?: number | null
  hubLongitude?: number | null
  kg?: number | null
  orderCount?: number | null
  /** Mã các đơn tới hub này: BE dùng để tính cước shipper giao chặng cuối */
  orderIds?: number[]
  /** Lúc tài xế giao xong hàng của hub này; chưa giao thì trống */
  arrivedAt?: string | null
  /** Ảnh tài xế chụp hàng giao tại hub này */
  photoUrl?: string | null
}

/** Câu chuyện hàng tại điểm tập kết (kg) */
export interface SupplySummary {
  /** Người mua đã đặt cọc, kể cả phần sau đó bị bớt */
  orderedKg: number
  deliveredByFarmsKg: number
  rejectedKg: number
  firstAcceptedKg: number
  shortAfterWeighingKg: number
  supplementKg: number
  supplements: { shopName: string; kg: number }[]
  cutKg: number
  reducedOrderCount: number
  cancelledOrderCount: number
  refundAmount: number
  remainingShortKg: number
}

/** Giới hạn để shipper tạo chuyến giao từ hub */
export interface ShipperCapacity {
  vehicleType: VehicleType
  vehicleLabel: string
  /** Sức chở của xe và số kg đang chở */
  capacityKg: number
  carryingKg: number
  /** Số dư ví còn ký quỹ được cho tiền thu hộ */
  availableBalance: number
}

/** Các thùng của một đơn tài xế xe ra hub phải nhận lên xe; loaded = số thứ tự thùng đã nhận */
export interface HubTripBox {
  orderId: number
  code: string
  recipientName?: string | null
  hubName?: string | null
  crateKg: number
  crates: number
  loaded: number[]
  /** Mã tem của đơn, chỉ có khi chuyến đã có tài xế */
  qrCode?: string | null
}

/** Chuyến xe chở hàng từ điểm tập kết ra các hub; tài xế nhận chuyến, lấy hàng, giao tới hub */
export interface HubTrip {
  /** Ảnh hàng đã bốc lên xe tại điểm tập kết */
  loadPhotoUrl?: string | null
  tripId: number
  campaignId: number
  campaignTitle: string
  tripNo: number
  /** Ngày cần xe = ngày kết thúc mở điểm tập kết (yyyy-MM-dd) */
  pickupDate?: string | null
  totalKg: number
  status: HubTripStatus
  /** true = đã chốt sau khi cân hàng (mới lấy hàng được); false = dự kiến */
  confirmed: boolean
  stops: HubTripStop[]
  boxes?: HubTripBox[]
  boxTotal?: number
  boxLoaded?: number
  /** Tài xế đã bấm không nhận chuyến */
  declinedDriverIds?: number[] | null
  /** Tài xế đang xem đã bấm không nhận (chỉ ở danh sách chuyến đang chờ) */
  declined?: boolean
  /** Quãng đường điểm tập kết -> hub (km), cước gộp, số tài xế nhận sau phí dịch vụ */
  routeKm?: number | null
  feeAmount: number
  netAmount: number
  serviceFeeRate: number
  paidAt?: string | null
  driverId?: number | null
  driverName?: string | null
  driverPhone?: string | null
  vehicleNumber?: string | null
  collectionSiteName?: string | null
  collectionSiteAddress?: string | null
  collectionSiteLatitude?: number | null
  collectionSiteLongitude?: number | null
  acceptedAt?: string | null
  startedAt?: string | null
  deliveredAt?: string | null
}

/** Admin đồng bộ kế hoạch xe của chiến dịch */
export interface HubTripSyncRequest {
  pickupDate?: string
  /** true = chốt kế hoạch sau khi cân hàng */
  confirmed?: boolean
  trips: { tripNo: number; totalKg: number; stops: HubTripStop[]; driverId?: number }[]
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
  productImageUrls: string[]
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
  /** Nông sản cần giải cứu (bắt buộc) */
  productName: string
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
  /** Ngày bắt đầu mở điểm tập kết, yyyy-MM-dd, sau ngày chốt đơn */
  startDate?: string
  /** Ngày kết thúc mở điểm tập kết (cũng là ngày cần xe), yyyy-MM-dd, không trước ngày bắt đầu */
  endDate?: string
  /** Ngày kết thúc chiến dịch (tài xế giao xong), yyyy-MM-dd, không trước ngày kết thúc mở điểm tập kết */
  finishDate?: string
  /** yyyy-MM-ddTHH:mm:ss, ngày giờ đăng bài kêu gọi nhà vườn */
  publishAt?: string
  /** yyyy-MM-ddTHH:mm:ss, sau ngày đăng bài, trước hạn chốt đơn đặt trước */
  farmCutoffAt?: string
  deliveryDate?: string
  collectionSiteName?: string
  collectionSiteAddress?: string
  collectionSiteLatitude?: number
  collectionSiteLongitude?: number
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
