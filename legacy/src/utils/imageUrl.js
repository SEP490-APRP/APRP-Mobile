// imageUrl.js — skeleton
// TODO: implement image URL building/transformation helpers

const BASE_IMAGE_URL = process.env.EXPO_PUBLIC_IMAGE_BASE_URL ?? '';

export function buildImageUrl(path) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${BASE_IMAGE_URL}/${path}`;
}

export function getAvatarUrl(user) {
  return buildImageUrl(user?.avatarUrl);
}
