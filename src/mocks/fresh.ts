/**
 * Mock trả về BẢN SAO dữ liệu ở mỗi lần gọi, giống API thật (mỗi response là JSON mới).
 * Nếu trả thẳng object trong mảng mock, các hàm như approve/deactivate sửa object đó tại chỗ
 * làm dữ liệu đang nằm trong cache TanStack Query đổi ngầm, và giao diện không cập nhật.
 * Bỏ lớp bọc này khi service gọi API thật.
 */
export function freshResponses<T extends object>(service: T): T {
  return Object.fromEntries(
    Object.entries(service).map(([key, value]) => [
      key,
      typeof value === 'function'
        ? async (...args: unknown[]) => structuredClone(await value.apply(service, args))
        : value,
    ]),
  ) as T
}
