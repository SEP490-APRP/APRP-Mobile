import type { z } from 'zod'

export type ValidationResult<T> = { ok: true; data: T } | { ok: false; error: string }

/**
 * Kiểm tra `values` theo schema Zod; lỗi chỉ lấy thông báo ĐẦU TIÊN
 * (các form hiện hiển thị một banner lỗi duy nhất).
 */
export function validate<S extends z.ZodType>(
  schema: S,
  values: unknown,
): ValidationResult<z.output<S>> {
  const result = schema.safeParse(values)
  if (result.success) return { ok: true, data: result.data }
  return { ok: false, error: result.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ' }
}
