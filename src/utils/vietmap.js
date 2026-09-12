// vietmap.js — skeleton
// TODO: implement VietMap SDK helpers (map init, marker, polyline, etc.)

export const VIETMAP_API_KEY = process.env.EXPO_PUBLIC_VIETMAP_KEY ?? '';

export function buildVietMapUrl(apiKey) {
  return `https://maps.vietmap.vn/gl/styles/light/style.json?apikey=${apiKey}`;
}

export async function searchPlace(keyword) {
  // TODO: call VietMap place search API
  throw new Error('searchPlace — TODO');
}
