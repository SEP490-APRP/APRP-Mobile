// errorTranslate.js — skeleton
// TODO: map API error codes/messages to Vietnamese user-facing strings

export function translateError(error) {
  const msg = error?.response?.data?.message ?? error?.message ?? 'Đã xảy ra lỗi';
  // TODO: add mapping table
  return msg;
}
