import axiosInstance from '@/services/api/axiosInstance'
import type { ApiResponse, PageResponse } from '@/types'
import type {
  BuildPlanResponse,
  PlanMealResponse,
  ShoppingListResponse,
  PlanGenerateRequest,
  ManualPlanCreateRequest,
  PlanHeaderUpdateRequest,
  AddMealItemRequest,
  ReplaceMealItemRequest,
  PlanPreCheckRequest,
  PlanPreCheckResponse,
  PlanCopilotChatRequest,
  PlanCopilotChatResponse,
  PlanCopilotApplyRequest,
  PlanStatus,
} from './mealPlan.types'

export type * from './mealPlan.types'

function unwrap<T>(res: unknown): T {
  if (res && typeof res === 'object') {
    if (
      'data' in res &&
      (res as { data: unknown }).data &&
      typeof (res as { data: unknown }).data === 'object' &&
      'result' in (res as { data: { result: unknown } }).data
    ) {
      return (res as { data: ApiResponse<T> }).data.result as T
    }
    if ('result' in res) {
      return (res as ApiResponse<T>).result as T
    }
  }
  return res as T
}

export const mealPlanService = {
  // Tiền kiểm tra tính khả thi ngân sách & khẩu phần AI (Pre-check)
  async preCheckPlan(request: PlanPreCheckRequest): Promise<ApiResponse<PlanPreCheckResponse>> {
    const res = await axiosInstance.post('/build-plans/pre-check', request)
    return { code: 200, result: unwrap<PlanPreCheckResponse>(res) }
  },

  // Sinh kế hoạch thực đơn AI từ kho combo nông sản
  async generateAiPlan(request: PlanGenerateRequest): Promise<ApiResponse<BuildPlanResponse>> {
    const res = await axiosInstance.post('/build-plans/generate', request, { timeout: 60_000 })
    return { code: 200, result: unwrap<BuildPlanResponse>(res) }
  },

  // Tạo kế hoạch thủ công
  async createManualPlan(request: ManualPlanCreateRequest): Promise<ApiResponse<BuildPlanResponse>> {
    const res = await axiosInstance.post('/build-plans', request)
    return { code: 200, result: unwrap<BuildPlanResponse>(res) }
  },

  // Lấy danh sách kế hoạch của Buyer (có phân trang & lọc trạng thái)
  async getMyPlans(params?: {
    status?: PlanStatus
    page?: number
    size?: number
  }): Promise<ApiResponse<PageResponse<BuildPlanResponse>>> {
    const res = await axiosInstance.get('/build-plans', {
      params: {
        page: params?.page ?? 0,
        size: params?.size ?? 10,
        status: params?.status,
      },
    })
    return { code: 200, result: unwrap<PageResponse<BuildPlanResponse>>(res) }
  },

  // Chi tiết kế hoạch
  async getPlanById(id: number): Promise<ApiResponse<BuildPlanResponse>> {
    const res = await axiosInstance.get(`/build-plans/${id}`)
    return { code: 200, result: unwrap<BuildPlanResponse>(res) }
  },

  // Cập nhật tiêu đề & ngân sách
  async updatePlanHeader(id: number, request: PlanHeaderUpdateRequest): Promise<ApiResponse<BuildPlanResponse>> {
    const res = await axiosInstance.patch(`/build-plans/${id}`, request)
    return { code: 200, result: unwrap<BuildPlanResponse>(res) }
  },

  // Xóa kế hoạch nháp
  async deletePlan(id: number): Promise<ApiResponse<void>> {
    const res = await axiosInstance.delete(`/build-plans/${id}`)
    return { code: 200, result: unwrap<void>(res) }
  },

  // Xác nhận kế hoạch (DRAFT / AI_DRAFT -> CONFIRMED)
  async confirmPlan(id: number): Promise<ApiResponse<BuildPlanResponse>> {
    const res = await axiosInstance.post(`/build-plans/${id}/confirm`)
    return { code: 200, result: unwrap<BuildPlanResponse>(res) }
  },

  // Lưu trữ kế hoạch (CONFIRMED -> ARCHIVED)
  async archivePlan(id: number): Promise<ApiResponse<BuildPlanResponse>> {
    const res = await axiosInstance.post(`/build-plans/${id}/archive`)
    return { code: 200, result: unwrap<BuildPlanResponse>(res) }
  },

  // Tick hoàn thành bữa ăn
  async toggleMealCompleted(mealId: number, completed: boolean): Promise<ApiResponse<PlanMealResponse>> {
    const res = await axiosInstance.patch(`/plan-meals/${mealId}/completed`, { completed })
    return { code: 200, result: unwrap<PlanMealResponse>(res) }
  },

  // Thêm combo vào bữa ăn
  async addMealItem(planId: number, mealId: number, request: AddMealItemRequest): Promise<ApiResponse<PlanMealResponse>> {
    const res = await axiosInstance.post(`/build-plans/${planId}/meals/${mealId}/items`, request)
    return { code: 200, result: unwrap<PlanMealResponse>(res) }
  },

  // Đổi combo trong bữa ăn
  async replaceMealItem(
    planId: number,
    mealId: number,
    itemId: number,
    request: ReplaceMealItemRequest,
  ): Promise<ApiResponse<PlanMealResponse>> {
    const res = await axiosInstance.put(`/build-plans/${planId}/meals/${mealId}/items/${itemId}`, request)
    return { code: 200, result: unwrap<PlanMealResponse>(res) }
  },

  // Cập nhật số lượng combo
  async updateMealItemQuantity(
    planId: number,
    mealId: number,
    itemId: number,
    quantity: number,
  ): Promise<ApiResponse<PlanMealResponse>> {
    const res = await axiosInstance.patch(`/build-plans/${planId}/meals/${mealId}/items/${itemId}/quantity`, {
      quantity,
    })
    return { code: 200, result: unwrap<PlanMealResponse>(res) }
  },

  // Xóa combo khỏi bữa ăn
  async removeMealItem(planId: number, mealId: number, itemId: number): Promise<ApiResponse<PlanMealResponse>> {
    const res = await axiosInstance.delete(`/build-plans/${planId}/meals/${mealId}/items/${itemId}`)
    return { code: 200, result: unwrap<PlanMealResponse>(res) }
  },

  // Sinh lại riêng bữa ăn bằng AI
  async regenerateMeal(planId: number, mealId: number): Promise<ApiResponse<PlanMealResponse>> {
    const res = await axiosInstance.post(`/build-plans/${planId}/meals/${mealId}/regenerate`)
    return { code: 200, result: unwrap<PlanMealResponse>(res) }
  },

  // Lấy danh sách mua sắm (Shopping List)
  async getShoppingList(planId: number): Promise<ApiResponse<ShoppingListResponse>> {
    const res = await axiosInstance.get(`/build-plans/${planId}/shopping-list`)
    return { code: 200, result: unwrap<ShoppingListResponse>(res) }
  },

  // Thêm toàn bộ combo còn hàng vào giỏ hàng
  async addPlanToCart(planId: number): Promise<ApiResponse<ShoppingListResponse>> {
    const res = await axiosInstance.post(`/build-plans/${planId}/add-to-cart`)
    return { code: 200, result: unwrap<ShoppingListResponse>(res) }
  },

  // Trò chuyện tương tác với AI Co-pilot
  async copilotChat(planId: number, request: PlanCopilotChatRequest): Promise<ApiResponse<PlanCopilotChatResponse>> {
    const res = await axiosInstance.post(`/build-plans/${planId}/copilot-chat`, request)
    return { code: 200, result: unwrap<PlanCopilotChatResponse>(res) }
  },

  // Áp dụng đề xuất từ AI Co-pilot vào thực đơn
  async copilotApply(planId: number, request: PlanCopilotApplyRequest): Promise<ApiResponse<BuildPlanResponse>> {
    const res = await axiosInstance.post(`/build-plans/${planId}/copilot-apply`, request)
    return { code: 200, result: unwrap<BuildPlanResponse>(res) }
  },
}

