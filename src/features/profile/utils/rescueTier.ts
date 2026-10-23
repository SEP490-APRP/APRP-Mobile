export type RescueTier = {
  title: string
  emoji: string
  /** Hạng kế tiếp, hoặc thông báo đã đạt tối đa */
  next: string
  /** % tiến tới hạng kế tiếp */
  progress: number
}

/** Danh hiệu theo số kg nông sản đã giải cứu (totalRescuedWeight), giống getBadgeInfo bản web. */
export function rescueTier(kg: number): RescueTier {
  const pct = (v: number) => Math.max(0, Math.min(100, Math.round(v)))
  if (kg >= 50) return { title: 'Đại Sứ Xanh CapNong', emoji: '🌟', next: 'Đã đạt cấp tối đa', progress: 100 }
  if (kg >= 20)
    return { title: 'Hiệp Sĩ Nông Nghiệp', emoji: '🎖️', next: 'Đại Sứ Xanh (50kg)', progress: pct(((kg - 20) / 30) * 100) }
  if (kg >= 5)
    return { title: 'Cứu Tinh Nông Sản', emoji: '🌾', next: 'Hiệp Sĩ Nông Nghiệp (20kg)', progress: pct(((kg - 5) / 15) * 100) }
  return { title: 'Người Gieo Mầm', emoji: '🌱', next: 'Cứu Tinh Nông Sản (5kg)', progress: pct((kg / 5) * 100) }
}
