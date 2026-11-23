import type { MealType } from './combo.types'
export type { MealType }
export type PlanStatus = 'DRAFT' | 'AI_DRAFT' | 'CONFIRMED' | 'ARCHIVED'
export type PlanSource = 'MANUAL' | 'AI'

export interface PlanMealItemResponse {
  id: number
  comboId: number
  comboName: string
  imageUrl?: string
  combo?: {
    comboId?: number
    comboName?: string
    price?: number
    type?: string
    region?: string
    regionDisplayName?: string
    cookingSuggestion?: string
    imageUrl?: string
    description?: string
    shopId?: number
    shopName?: string
    remainingStock?: number
  }
  quantity: number
  unitPriceSnapshot: number
  isAiSuggested?: boolean
  userOverride?: boolean
  position?: number
  calories?: number
  protein?: number
  carbs?: number
  fat?: number
  aiReasonTag?: string
  aiDescription?: string
  region?: string
  regionDisplayName?: string
  comboType?: string
  cookingSuggestion?: string
  remainingStock?: number
  inStock?: boolean
}

export interface PlanMealResponse {
  id: number
  mealType: MealType
  sortOrder?: number
  completed: boolean
  planMealItems: PlanMealItemResponse[]
}

export interface PlanDayResponse {
  id: number
  dayIndex: number
  date?: string
  planMeals: PlanMealResponse[]
}

export interface BuildPlanResponse {
  planId: number
  buyerId: number
  planName: string
  numberOfDays: number
  numberOfPeople: number
  targetBudget?: number
  mealType?: string
  status: PlanStatus
  source: PlanSource
  createdAt: string
  updatedAt: string
  totalEstimatedPrice?: number
  totalCalories?: number
  totalProtein?: number
  totalCarbs?: number
  totalFat?: number
  planDays: PlanDayResponse[]
}

export interface ShoppingListItemResponse {
  comboId: number
  comboName: string
  imageUrl?: string
  shopId?: number
  shopName?: string
  region?: string
  regionDisplayName?: string
  comboType?: string
  cookingSuggestion?: string
  totalQuantity: number
  unitPrice: number
  subtotal: number
  stockAvailable: number
  inStock: boolean
}

export interface ShoppingListResponse {
  planId: number
  planName: string
  totalEstimatedPrice: number
  totalCombosCount: number
  allInStock: boolean
  items: ShoppingListItemResponse[]
}

export interface PlanGenerateRequest {
  goal: string
  numberOfDays: number
  numberOfPeople: number
  targetBudget?: number
  preferredMealTypes?: MealType[]
  mealTypes?: MealType[]
  extraNotes?: string
}

export interface ManualPlanCreateRequest {
  planName: string
  numberOfDays: number
  numberOfPeople: number
  targetBudget?: number
  mealType?: string
}

export interface PlanHeaderUpdateRequest {
  planName?: string
  targetBudget?: number
}

export interface AddMealItemRequest {
  comboId: number
  quantity?: number
}

export interface ReplaceMealItemRequest {
  newComboId: number
  quantity?: number
}

export interface PlanScenarioOption {
  scenarioKey?: string
  scenarioId?: string
  title: string
  description: string
  estimatedCost?: number
  suggestedDays?: number
  adjustedDays?: number
  suggestedPeople?: number
  adjustedPeople?: number
  suggestedMealTypes?: (MealType | string)[]
  adjustedMealTypes?: (MealType | string)[]
  suggestedBudget?: number
  adjustedBudget?: number
}

export interface PlanPreCheckRequest {
  numberOfDays?: number
  numberOfPeople?: number
  targetBudget?: number
  preferredMealTypes?: MealType[]
  mealTypes?: MealType[]
  goal?: string
}

export interface PlanPreCheckResponse {
  isFeasible: boolean
  hasStockShortage?: boolean
  stockShortageMessage?: string
  totalMeals: number
  combosPerMeal: number
  totalCombosNeeded: number
  estimatedMinCost: number
  estimatedStandardCost: number
  hasPortionWarning: boolean
  portionAdvice?: string
  hasBudgetWarning: boolean
  budgetAdvice?: string
  scenarios?: PlanScenarioOption[]
  suggestedScenarios?: PlanScenarioOption[]
}

export interface CopilotChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface PlanCopilotChatRequest {
  message: string
  history?: CopilotChatMessage[]
}

export interface PlanCopilotActionDto {
  actionType: 'REPLACE_COMBO' | 'UPDATE_QUANTITY' | string
  dayIndex?: number
  mealType?: string
  targetMealId?: number
  targetItemId?: number
  newComboId?: number
  newComboName?: string
  newComboImageUrl?: string
  newPrice?: number
  quantity?: number
  reason?: string
}

export interface PlanCopilotChatResponse {
  replyMessage: string
  suggestedAction?: PlanCopilotActionDto | null
  canExecute?: boolean
  planStatus?: string
  quickSuggestions?: string[]
}

export interface PlanCopilotApplyRequest {
  actionType: string
  targetMealId: number
  targetItemId: number
  newComboId?: number
  quantity?: number
}

