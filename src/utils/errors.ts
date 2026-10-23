/**
 * Thay cho mẫu `catch (err: any) { err?.data?.message }` lặp lại ở các trang admin.
 * Nhận `unknown` và tự thu hẹp kiểu, nên không cần `any`.
 * Chỉ lấy message từ body API (err.data.message), giống hành vi cũ; lỗi kỹ thuật
 * như "Failed to fetch" không hiện cho người dùng mà dùng câu fallback tiếng Việt.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function getErrorMessage(
  error: unknown,
  fallback = 'Đã có lỗi xảy ra. Vui lòng thử lại.',
): string {
  if (isRecord(error)) {
    if (isRecord(error.data) && typeof error.data.message === 'string' && error.data.message.trim()) {
      return error.data.message
    }
    if (
      isRecord(error.response) &&
      isRecord(error.response.data) &&
      typeof error.response.data.message === 'string' &&
      error.response.data.message.trim()
    ) {
      return error.response.data.message
    }
    if (typeof error.message === 'string' && error.message.trim()) {
      return error.message
    }
  }
  return fallback
}
