import { useQuery } from '@tanstack/react-query'
import { comboService } from '@/services/combo.service'
import { mysteryBoxService } from '@/services/mysteryBox.service'
import { buildComboCards, comboToCard, mysteryToCard, type ComboCard, type ComboKind } from '../utils/comboCards'

export const comboKeys = {
  all: ['combos'] as const,
  combos: () => [...comboKeys.all, 'build'] as const,
  mystery: () => [...comboKeys.all, 'mystery'] as const,
  detail: (kind: ComboKind, id: number) => [...comboKeys.all, 'detail', kind, id] as const,
}

const useMysteryBoxes = () =>
  useQuery({
    queryKey: comboKeys.mystery(),
    queryFn: async () => (await mysteryBoxService.getForBuyer()).content ?? [],
  })

const useBuildCombos = () =>
  useQuery({
    queryKey: comboKeys.combos(),
    queryFn: async () => (await comboService.getCombos()).content ?? [],
  })

/** Túi mù và combo đang bán, gộp thành một danh sách thẻ (trang "Combo & Túi mù" bản web). */
export function useComboCards() {
  const mystery = useMysteryBoxes()
  const combos = useBuildCombos()
  return {
    data: mystery.data || combos.data ? buildComboCards(mystery.data, combos.data) : undefined,
    isPending: mystery.isPending || combos.isPending,
    // Chỉ coi là lỗi khi cả hai nguồn đều hỏng; còn một nguồn thì vẫn hiện được.
    isError: mystery.isError && combos.isError,
    refetch: () => Promise.all([mystery.refetch(), combos.refetch()]),
  }
}

/** Túi mù của một shop, cho trang cửa hàng. */
export function useShopMysteryBoxes(shopId: number) {
  return useQuery({
    queryKey: comboKeys.mystery(),
    queryFn: async () => (await mysteryBoxService.getForBuyer()).content ?? [],
    select: (boxes) =>
      boxes
        .filter((b) => (b.shopId ?? b.shopOwnerId) === shopId)
        .map(mysteryToCard)
        .filter((c) => c.id > 0),
  })
}

export interface ComboDetail {
  card: ComboCard
  /** Món trong combo; túi mù giữ bí mật nên luôn rỗng */
  items: { productId: number; name: string; quantity: number; unit?: string; price?: number }[]
}

export function useComboDetail(kind: ComboKind, id: number) {
  return useQuery({
    queryKey: comboKeys.detail(kind, id),
    enabled: id > 0,
    queryFn: async (): Promise<ComboDetail> => {
      if (kind === 'MYSTERY_BOX') {
        return { card: mysteryToCard(await mysteryBoxService.getById(id)), items: [] }
      }
      const combo = await comboService.getById(id)
      return {
        card: comboToCard(combo),
        items: (combo.items ?? []).map((it) => ({
          productId: it.productId,
          name: it.productName || `Nông sản #${it.productId}`,
          quantity: Number(it.productQuantity ?? it.quantity ?? 1),
          unit: it.unit,
          price: it.price,
        })),
      }
    },
  })
}
