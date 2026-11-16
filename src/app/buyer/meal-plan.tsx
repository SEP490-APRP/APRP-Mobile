import { router } from 'expo-router'
import {
  CheckCircle2,
  ChevronLeft,
  Circle,
  Flame,
  ShoppingBag,
  Sparkles,
  Trash2,
  Utensils,
} from 'lucide-react-native'
import { useState } from 'react'
import { ActivityIndicator, Modal, Pressable, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Image } from 'expo-image'
import { AppText, Button, ChoiceChips, TextField } from '@/components/ui'
import { money } from '@/features/product'
import {
  useAddPlanToCart,
  useConfirmPlan,
  useDeletePlan,
  useGenerateAiPlan,
  useMyPlans,
  usePlanDetail,
  useToggleMealCompleted,
} from '@/features/meal-plan/hooks/useMealPlanQueries'
import type { BuildPlanResponse, PlanMealResponse } from '@/services/mealPlan.service'
import { useUiStore } from '@/stores'
import { colors } from '@/theme/colors'
import { cn } from '@/utils/helpers'

const GOAL_OPTIONS = [
  { value: 'Ăn lành mạnh, cân bằng dinh dưỡng', label: 'Cân bằng' },
  { value: 'Tiết kiệm chi phí với nông sản giải cứu', label: 'Tiết kiệm' },
  { value: 'Ăn chay thanh đạm, thuần nông sản', label: 'Ăn chay' },
  { value: 'Tăng cơ, giàu đạm thực vật', label: 'Tăng đạm' },
  { value: 'Giảm cân, thanh lọc cơ thể', label: 'Giảm cân' },
]

const MEAL_TYPE_LABELS: Record<string, string> = {
  BREAKFAST: 'Bữa sáng',
  LUNCH: 'Bữa trưa',
  DINNER: 'Bữa tối',
  SNACK: 'Bữa phụ',
}

export default function MealPlanScreen() {
  const showToast = useUiStore((s) => s.showToast)
  const myPlansQuery = useMyPlans()
  const plans = myPlansQuery.data ?? []
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null)
  const activePlanId = selectedPlanId || (plans.length > 0 ? plans[0].planId : null)

  const detailQuery = usePlanDetail(activePlanId)
  const plan: BuildPlanResponse | null = detailQuery.data ?? null

  const [selectedDayIdx, setSelectedDayIdx] = useState(0)
  const [createModalVisible, setCreateModalVisible] = useState(false)

  // Form tạo thực đơn AI
  const [goal, setGoal] = useState(GOAL_OPTIONS[0].value)
  const [days, setDays] = useState('7')
  const [people, setPeople] = useState('2')
  const [budget, setBudget] = useState('300000')

  const generateMutation = useGenerateAiPlan()
  const confirmMutation = useConfirmPlan()
  const toggleMealMutation = useToggleMealCompleted()
  const addToCartMutation = useAddPlanToCart()
  const deleteMutation = useDeletePlan()

  const handleGenerate = async () => {
    try {
      const res = await generateMutation.mutateAsync({
        goal,
        numberOfDays: Number(days) || 7,
        numberOfPeople: Number(people) || 2,
        targetBudget: Number(budget) || undefined,
        preferredMealTypes: ['BREAKFAST', 'LUNCH', 'DINNER'],
      })
      showToast('AI đã lên thực đơn thành công!')
      setCreateModalVisible(false)
      if (res.result?.planId) {
        setSelectedPlanId(res.result.planId)
      }
    } catch {
      showToast('Chưa thể sinh thực đơn lúc này. Vui lòng thử lại.')
    }
  }

  const handleAddToCart = async () => {
    if (!plan) return
    try {
      await addToCartMutation.mutateAsync(plan.planId)
      showToast('Đã thêm các món trong thực đơn vào giỏ hàng!')
      router.push('/buyer/(tabs)/cart')
    } catch {
      showToast('Không thể thêm vào giỏ hàng lúc này.')
    }
  }

  const handleConfirmPlan = async () => {
    if (!plan) return
    try {
      await confirmMutation.mutateAsync(plan.planId)
      showToast('Đã chốt kế hoạch thực đơn!')
    } catch {
      showToast('Không thể xác nhận lúc này.')
    }
  }

  const handleDeletePlan = async () => {
    if (!plan) return
    try {
      await deleteMutation.mutateAsync(plan.planId)
      showToast('Đã xoá thực đơn.')
      setSelectedPlanId(null)
    } catch {
      showToast('Không thể xoá thực đơn.')
    }
  }

  const currentDay = plan?.planDays?.[selectedDayIdx] ?? plan?.planDays?.[0]

  return (
    <SafeAreaView className="flex-1 bg-surface-base" edges={['top', 'bottom']}>
      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-line bg-white px-4 py-3">
        <Pressable onPress={() => router.back()} className="size-10 items-center justify-center rounded-full bg-slate-100">
          <ChevronLeft size={22} color={colors.ink} />
        </Pressable>
        <AppText weight="bold" className="text-base text-ink">
          Thực Đơn Dinh Dưỡng AI
        </AppText>
        <Pressable
          onPress={() => setCreateModalVisible(true)}
          className="size-10 items-center justify-center rounded-full bg-leaf-50 active:bg-leaf-100"
        >
          <Sparkles size={20} color={colors.leaf700} />
        </Pressable>
      </View>

      {myPlansQuery.isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.leaf700} />
          <AppText className="mt-3 text-xs text-ink-muted">Đang tải thực đơn...</AppText>
        </View>
      ) : plans.length === 0 ? (
        <View className="flex-1 items-center justify-center p-6 text-center">
          <View className="size-20 items-center justify-center rounded-full bg-leaf-50">
            <Utensils size={40} color={colors.leaf700} />
          </View>
          <AppText weight="bold" className="mt-4 text-center text-lg text-ink">
            Chưa có kế hoạch thực đơn
          </AppText>
          <AppText className="mt-2 text-center text-xs text-ink-muted leading-relaxed">
            Hãy để AI thông minh giúp bạn tự động phối các combo nông sản giải cứu thành bữa ăn dinh dưỡng đủ 7 ngày.
          </AppText>
          <Button
            title="Tạo thực đơn AI ngay"
            icon={Sparkles}
            className="mt-6 w-full max-w-xs"
            onPress={() => setCreateModalVisible(true)}
          />
        </View>
      ) : (
        <ScrollView className="flex-1" contentContainerClassName="p-4 pb-24 gap-4">
          {/* Header chọn kế hoạch nếu có nhiều */}
          {plans.length > 1 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
              <View className="flex-row gap-2">
                {plans.map((p) => {
                  const isSel = p.planId === activePlanId
                  return (
                    <Pressable
                      key={p.planId}
                      onPress={() => {
                        setSelectedPlanId(p.planId)
                        setSelectedDayIdx(0)
                      }}
                      className={cn(
                        'rounded-xl border px-3.5 py-2',
                        isSel ? 'border-leaf-700 bg-leaf-700' : 'border-line bg-white',
                      )}
                    >
                      <AppText weight={isSel ? 'bold' : 'regular'} className={cn('text-xs', isSel ? 'text-white' : 'text-ink')}>
                        {p.planName || `Kế hoạch #${p.planId}`}
                      </AppText>
                    </Pressable>
                  )
                })}
              </View>
            </ScrollView>
          )}

          {/* Card tổng quan kế hoạch */}
          {plan && (
            <View className="gap-3 rounded-2xl border border-leaf-100 bg-white p-4">
              <View className="flex-row items-start justify-between">
                <View className="flex-1 pr-2">
                  <View className="flex-row items-center gap-1.5">
                    <Sparkles size={16} color={colors.leaf700} />
                    <AppText weight="bold" className="text-base text-ink">
                      {plan.planName}
                    </AppText>
                  </View>
                  <AppText className="mt-1 text-xs text-ink-muted">
                    {plan.numberOfDays} ngày • {plan.numberOfPeople} người ăn • Trạng thái:{' '}
                    <AppText weight="semibold" className="text-leaf-700">
                      {plan.status === 'CONFIRMED' ? 'Đã chốt' : 'Bản nháp AI'}
                    </AppText>
                  </AppText>
                </View>
                <Pressable onPress={handleDeletePlan} className="p-1.5 opacity-60 active:opacity-100">
                  <Trash2 size={18} color="#ef4444" />
                </Pressable>
              </View>

              {/* Dinh dưỡng & Giá */}
              <View className="flex-row items-center justify-between rounded-xl bg-leaf-50/60 p-3">
                <View className="items-center">
                  <AppText className="text-[11px] text-ink-muted">Ước tính</AppText>
                  <AppText weight="bold" className="text-sm text-leaf-800">
                    {money(plan.totalEstimatedPrice ?? 0)}
                  </AppText>
                </View>
                <View className="h-6 w-px bg-leaf-200" />
                <View className="items-center">
                  <View className="flex-row items-center gap-1">
                    <Flame size={12} color="#f97316" />
                    <AppText className="text-[11px] text-ink-muted">Calo</AppText>
                  </View>
                  <AppText weight="bold" className="text-sm text-ink">
                    {Math.round(plan.totalCalories ?? 0)} kcal
                  </AppText>
                </View>
                <View className="h-6 w-px bg-leaf-200" />
                <View className="items-center">
                  <AppText className="text-[11px] text-ink-muted">Đạm/Carb/Béo</AppText>
                  <AppText weight="semibold" className="text-xs text-ink">
                    {Math.round(plan.totalProtein ?? 0)}g / {Math.round(plan.totalCarbs ?? 0)}g
                  </AppText>
                </View>
              </View>

              {/* Nút hành động */}
              <View className="flex-row gap-2 pt-1">
                {plan.status !== 'CONFIRMED' && (
                  <Button
                    title="Chốt thực đơn"
                    variant="outline"
                    loading={confirmMutation.isPending}
                    onPress={handleConfirmPlan}
                    className="flex-1"
                  />
                )}
                <Button
                  title="Thêm vào giỏ hàng"
                  icon={ShoppingBag}
                  loading={addToCartMutation.isPending}
                  onPress={handleAddToCart}
                  className="flex-1"
                />
              </View>
            </View>
          )}

          {/* Chọn ngày (Ngày 1 -> Ngày N) */}
          {plan && plan.planDays && plan.planDays.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
              <View className="flex-row gap-2">
                {plan.planDays.map((d, idx) => {
                  const isSel = idx === selectedDayIdx
                  return (
                    <Pressable
                      key={d.id || idx}
                      onPress={() => setSelectedDayIdx(idx)}
                      className={cn(
                        'items-center rounded-xl border px-4 py-2',
                        isSel ? 'border-leaf-700 bg-leaf-700' : 'border-line bg-white',
                      )}
                    >
                      <AppText weight={isSel ? 'bold' : 'regular'} className={cn('text-xs', isSel ? 'text-white' : 'text-ink-muted')}>
                        Ngày {d.dayIndex || idx + 1}
                      </AppText>
                    </Pressable>
                  )
                })}
              </View>
            </ScrollView>
          )}

          {/* Danh sách bữa ăn trong ngày */}
          {currentDay ? (
            <View className="gap-3">
              {currentDay.planMeals.map((meal: PlanMealResponse) => {
                const label = MEAL_TYPE_LABELS[meal.mealType] || meal.mealType
                return (
                  <View key={meal.id} className="gap-2.5 rounded-2xl border border-line bg-white p-3.5">
                    <View className="flex-row items-center justify-between border-b border-slate-100 pb-2">
                      <View className="flex-row items-center gap-2">
                        <Utensils size={15} color={colors.leaf700} />
                        <AppText weight="bold" className="text-sm text-ink">
                          {label}
                        </AppText>
                      </View>
                      <Pressable
                        onPress={() =>
                          plan &&
                          toggleMealMutation.mutate({
                            planId: plan.planId,
                            mealId: meal.id,
                            completed: !meal.completed,
                          })
                        }
                        className="flex-row items-center gap-1.5"
                      >
                        {meal.completed ? (
                          <CheckCircle2 size={16} color={colors.leaf700} />
                        ) : (
                          <Circle size={16} color="#94a3b8" />
                        )}
                        <AppText className={cn('text-xs', meal.completed ? 'text-leaf-700' : 'text-slate-400')}>
                          {meal.completed ? 'Đã ăn' : 'Chưa ăn'}
                        </AppText>
                      </Pressable>
                    </View>

                    {meal.planMealItems && meal.planMealItems.length > 0 ? (
                      meal.planMealItems.map((item) => (
                        <View key={item.id} className="flex-row items-center gap-3 pt-1">
                          {item.imageUrl ? (
                            <Image source={{ uri: item.imageUrl }} className="size-14 rounded-xl bg-slate-100" />
                          ) : (
                            <View className="size-14 items-center justify-center rounded-xl bg-leaf-50">
                              <Utensils size={20} color={colors.leaf700} />
                            </View>
                          )}
                          <View className="flex-1">
                            <AppText weight="bold" numberOfLines={1} className="text-xs text-ink">
                              {item.comboName}
                            </AppText>
                            {!!item.aiReasonTag && (
                              <View className="mt-0.5 self-start rounded bg-amber-50 px-1.5 py-0.5">
                                <AppText className="text-[10px] text-amber-800">{item.aiReasonTag}</AppText>
                              </View>
                            )}
                            <View className="mt-1 flex-row items-center justify-between">
                              <AppText className="text-xs text-ink-muted">
                                SL: {item.quantity} • {item.calories ? `${Math.round(item.calories)} kcal` : ''}
                              </AppText>
                              <AppText weight="bold" className="text-xs text-leaf-800">
                                {money(item.unitPriceSnapshot)}
                              </AppText>
                            </View>
                          </View>
                        </View>
                      ))
                    ) : (
                      <AppText className="py-2 text-center text-xs text-ink-muted">Chưa có món trong bữa này</AppText>
                    )}
                  </View>
                )
              })}
            </View>
          ) : (
            <View className="items-center rounded-2xl border border-line p-6 bg-white">
              <AppText className="text-xs text-ink-muted">Chọn ngày để xem chi tiết bữa ăn</AppText>
            </View>
          )}
        </ScrollView>
      )}

      {/* Modal Tạo Thực Đơn AI Mới */}
      <Modal visible={createModalVisible} animationType="slide" transparent onRequestClose={() => setCreateModalVisible(false)}>
        <View className="flex-1 justify-end bg-black/50">
          <View className="max-h-[85%] rounded-t-3xl bg-white p-5">
            <View className="flex-row items-center justify-between border-b border-line pb-3">
              <View className="flex-row items-center gap-2">
                <Sparkles size={18} color={colors.leaf700} />
                <AppText weight="bold" className="text-base text-ink">
                  Tạo Thực Đơn Bằng AI
                </AppText>
              </View>
              <Pressable onPress={() => setCreateModalVisible(false)} className="p-1">
                <AppText className="text-xs text-ink-muted">Đóng</AppText>
              </Pressable>
            </View>

            <ScrollView className="py-4" contentContainerClassName="gap-4">
              <View className="gap-1.5">
                <AppText weight="semibold" className="text-xs text-ink">
                  Mục tiêu dinh dưỡng
                </AppText>
                <ChoiceChips label="Mục tiêu dinh dưỡng" options={GOAL_OPTIONS} value={goal} onChange={setGoal} />
              </View>

              <View className="flex-row gap-3">
                <View className="flex-1">
                  <TextField label="Số ngày ăn (3 - 7)" value={days} onChangeText={setDays} keyboardType="number-pad" />
                </View>
                <View className="flex-1">
                  <TextField label="Số người ăn" value={people} onChangeText={setPeople} keyboardType="number-pad" />
                </View>
              </View>

              <TextField
                label="Ngân sách dự kiến (VNĐ)"
                value={budget}
                onChangeText={setBudget}
                keyboardType="number-pad"
                placeholder="Ví dụ: 300000"
              />

              <View className="rounded-xl bg-leaf-50 p-3">
                <AppText className="text-xs text-leaf-800 leading-relaxed">
                  💡 AI sẽ quét toàn bộ kho nông sản giải cứu đang có trên sàn CapNong để thiết kế thực đơn phù hợp nhất với khẩu phần và ngân sách của bạn.
                </AppText>
              </View>

              <Button
                title="Bắt đầu tạo thực đơn với AI"
                icon={Sparkles}
                loading={generateMutation.isPending}
                onPress={handleGenerate}
                className="mt-2"
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}
