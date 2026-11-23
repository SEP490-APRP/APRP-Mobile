import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  mealPlanService,
  type PlanGenerateRequest,
  type PlanStatus,
  type PlanCopilotChatRequest,
  type PlanCopilotApplyRequest,
} from '@/services/mealPlan.service'

const MEAL_PLAN_KEYS = {
  all: ['meal-plans'] as const,
  lists: () => [...MEAL_PLAN_KEYS.all, 'list'] as const,
  list: (status?: PlanStatus) => [...MEAL_PLAN_KEYS.lists(), { status }] as const,
  details: () => [...MEAL_PLAN_KEYS.all, 'detail'] as const,
  detail: (id: number) => [...MEAL_PLAN_KEYS.details(), id] as const,
  shoppingList: (id: number) => [...MEAL_PLAN_KEYS.detail(id), 'shopping-list'] as const,
}

export function useMyPlans(status?: PlanStatus) {
  return useQuery({
    queryKey: MEAL_PLAN_KEYS.list(status),
    queryFn: async () => {
      const res = await mealPlanService.getMyPlans({ status, page: 0, size: 20 })
      return res.result?.content ?? []
    },
  })
}

export function usePlanDetail(id: number | null) {
  return useQuery({
    queryKey: MEAL_PLAN_KEYS.detail(id ?? 0),
    queryFn: async () => {
      if (!id) return null
      const res = await mealPlanService.getPlanById(id)
      return res.result ?? null
    },
    enabled: !!id,
  })
}

export function useGenerateAiPlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (req: PlanGenerateRequest) => mealPlanService.generateAiPlan(req),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: MEAL_PLAN_KEYS.all })
    },
  })
}

export function useConfirmPlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => mealPlanService.confirmPlan(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: MEAL_PLAN_KEYS.detail(id) })
      qc.invalidateQueries({ queryKey: MEAL_PLAN_KEYS.lists() })
    },
  })
}

export function useToggleMealCompleted() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ mealId, completed }: { planId: number; mealId: number; completed: boolean }) =>
      mealPlanService.toggleMealCompleted(mealId, completed),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: MEAL_PLAN_KEYS.detail(vars.planId) })
    },
  })
}

export function useAddPlanToCart() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (planId: number) => mealPlanService.addPlanToCart(planId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cart'] })
    },
  })
}

export function useDeletePlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => mealPlanService.deletePlan(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: MEAL_PLAN_KEYS.all })
    },
  })
}

export function useCopilotChat(planId: number) {
  return useMutation({
    mutationFn: (req: PlanCopilotChatRequest) => mealPlanService.copilotChat(planId, req),
  })
}

export function useCopilotApply(planId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (req: PlanCopilotApplyRequest) => mealPlanService.copilotApply(planId, req),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: MEAL_PLAN_KEYS.detail(planId) })
    },
  })
}

