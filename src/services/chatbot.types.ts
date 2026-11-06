export type AiItemType = 'PRODUCT' | 'MYSTERY_BOX' | 'BUILD_COMBO' | 'COMBO'

export type AiResponseType =
  | 'TEXT'
  | 'ITEM_OPTIONS'
  | 'PRODUCT_DETAIL'
  | 'NAVIGATION'
  | 'CART_UPDATED'
  | 'CHECKOUT_DRAFT'
  | 'ERROR'
  | 'ORDER_TRACKING'
  | 'RETURN_GUIDANCE'
  | 'ORDER_CANCEL'
  | 'BUDGET_COMBO'
  | 'RECIPE_SUGGESTION'
  | 'MYSTERY_BOX_QA'
  | 'VOUCHER_LIST'
  | 'SHIPPING_TIPS'
  | 'SAFETY_STANDARDS'
  | 'PRESERVATION_TIPS'
  | 'HUMAN_HANDOVER'
  | 'ROLE_GUIDANCE'
  | 'REORDER_RECENT'
  | 'FLASH_RESCUE'
  | 'MEAL_PLAN_BRIDGE'
  | 'SEASONAL_CALENDAR'
  | 'GREEN_IMPACT'
  | 'PAYMENT_ASSISTANCE'
  | 'WALLET_INFO'
  | 'UPDATE_SHIPPING_INFO'

export interface AiItemOption {
  itemType: AiItemType
  itemId: number
  name: string
  imageUrl?: string
  price?: number
  salePrice?: number
  discountPercent?: number
  unit?: string
  availableQuantity?: number
  description?: string
  isOutOfStock?: boolean
  orderQuantity?: number
}

export interface AiCartItem {
  itemType: AiItemType
  itemId: number
  name: string
  imageUrl?: string
  quantity: number
  unit?: string
  unitPrice?: number
  totalPrice?: number
}

export interface AiCartPreview {
  items: AiCartItem[]
  totalAmount?: number
}

export interface AiCheckoutDraft {
  checkoutUrl: string
  totalAmount?: number
}

export interface AiNavigationAction {
  url: string
  label: string
}

export interface OrderTrackingDto {
  orderId: number
  orderStatus: string
  statusDescription: string
  shopName: string
  totalAmount: number
  recipientName?: string
  recipientPhone?: string
  shippingAddress?: string
  shipperName?: string
  shipperPhone?: string
  trackingUrl?: string
  createdAt?: string
}

export interface ReturnGuidanceDto {
  orderId?: number
  policyTitle: string
  policyContent: string
  actionUrl: string
  actionLabel: string
}

export interface OrderCancelDto {
  orderId: number
  orderStatus: string
  canCancel: boolean
  message: string
  refundAmount?: number
}

export interface BudgetComboDto {
  targetBudget: number
  actualTotal: number
  title: string
  description: string
  items: AiItemOption[]
}

export interface RecipeSuggestionDto {
  dishName: string
  cookTime?: string
  description: string
  userIngredients?: string[]
  missingIngredients?: AiItemOption[]
}

export interface MysteryBoxQaDto {
  seasonalDescription: string
  userAllergies?: string[]
  boxItem?: AiItemOption
  note?: string
  isAllergyRisk?: boolean
  riskAllergen?: string
  safetyRecommendation?: string
}

export interface VoucherItemDto {
  voucherId?: number
  code: string
  title: string
  discountValue?: number
  minOrderValue?: number
  maxDiscount?: number
  expiryDate?: string
  voucherType?: string
  voucherScope?: string
  shopId?: number
  shopName?: string
  isCollected?: boolean
  isOutOfStock?: boolean
}

export interface ShippingTipDto {
  hasMultiShops: boolean
  shopCount: number
  shopNames: string[]
  tipMessage: string
}

export interface PreservationTipDto {
  category: string
  tips: string
  storageType?: string
}

export interface HumanHandoverDto {
  /** Chưa cấu hình trên BE thì không có, thẻ phải ẩn kênh đó. */
  hotline?: string
  zaloUrl?: string
  email?: string
  triggerP2pChat: boolean
  note?: string
}

export interface RoleGuidanceDto {
  role: string
  title: string
  guidance: string
  quickLinks: AiNavigationAction[]
}

export interface ReorderDto {
  orderId: number
  totalAmount: number
  orderDate?: string
  shopName: string
  orderStatus?: string
  items: AiItemOption[]
  canReorder: boolean
  availableItemsCount?: number
  outOfStockItemsCount?: number
  stockWarning?: string
}

export interface FlashRescueDto {
  title: string
  description: string
  discountRate: number
  items: AiItemOption[]
}

export interface MealPlanBridgeDto {
  topic?: string
  conditionName?: string
  suggestionSummary?: string
  healthAdvice?: string
  sampleDishes?: string[]
  sampleMeals?: string[]
  goodProduce?: string[]
  avoidProduce?: string[]
  recommendedProduce?: AiItemOption[]
  recommendedProducts?: AiItemOption[]
  suggestedConditions?: string[]
  ctaMessage?: string
  ctaUrl?: string
  planUrl?: string
  ctaLabel?: string
  actionLabel?: string
}

export interface SeasonalCalendarDto {
  currentMonth: number | string
  inSeasonFruits: string[]
  inSeasonVegetables?: string[]
  inSeasonVeggies?: string[]
  upcomingProduce?: string[]
  healthBenefitNote?: string
  highlights?: string
  note?: string
  isPastMonth?: boolean
  isFutureMonth?: boolean
}

export interface GreenImpactDto {
  totalRescuedKg?: number
  totalRescuedWeight?: number
  totalCo2SavedKg?: number
  co2SavedKg?: number
  treesEquivalent?: number
  ecoRank?: string
  badgeLevel?: string
  loyaltyPoints?: number
  shareMessage?: string
  impactMessage?: string
}

export interface PaymentAssistanceDto {
  orderId?: number
  paymentMethod?: string
  paymentStatus?: string
  guidance?: string
  hotline?: string
  bankName?: string
  bankAccount?: string
  accountHolder?: string
  amountDue?: number
  payosUrl?: string
  supportHotline?: string
  stepInstructions?: string[]
}

export interface WalletInfoDto {
  walletStatus: string
  loyaltyPoints: number
  linkedBankName?: string
  linkedBankAccount?: string
  message: string
  navigationUrl: string
  navigationLabel: string
}

export interface UpdateShippingInfoDto {
  orderId: number
  orderStatus?: string
  canUpdate?: boolean
  updateType?: 'PHONE' | 'ADDRESS' | string
  currentAddress?: string
  currentPhone?: string
  shipperName?: string
  shipperPhone?: string
  suggestedAction?: string
  supportContact?: string
  guidance?: string
  note?: string
}

export interface ChatbotMessageRequest {
  message?: string
  sessionId?: string
  selectedOptionId?: number
  selectedOptionType?: AiItemType
  selectedQuantity?: number
  /** BE dùng để bỏ nút tới tính năng mà ứng dụng chưa có; web không cần gửi. */
  client?: 'WEB' | 'MOBILE'
}

export interface ChatbotMessageResponse {
  type: AiResponseType
  message: string
  itemOptions?: AiItemOption[]
  selectedProduct?: AiItemOption
  cart?: AiCartPreview
  checkout?: AiCheckoutDraft
  navigation?: AiNavigationAction
  orderTracking?: OrderTrackingDto
  returnGuidance?: ReturnGuidanceDto
  orderCancel?: OrderCancelDto
  budgetCombo?: BudgetComboDto
  recipe?: RecipeSuggestionDto
  mysteryBoxQa?: MysteryBoxQaDto
  vouchers?: VoucherItemDto[]
  shippingTips?: ShippingTipDto
  preservationTips?: PreservationTipDto[]
  humanHandover?: HumanHandoverDto
  roleGuidance?: RoleGuidanceDto
  reorder?: ReorderDto
  flashRescue?: FlashRescueDto
  mealPlanBridge?: MealPlanBridgeDto
  seasonalCalendar?: SeasonalCalendarDto
  greenImpact?: GreenImpactDto
  paymentAssistance?: PaymentAssistanceDto
  walletInfo?: WalletInfoDto
  updateShippingInfo?: UpdateShippingInfoDto
  timestamp?: string
}

export interface ChatHistoryItem {
  id: number
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

