/**
 * Decode JWT payload mà không cần thư viện ngoài.
 * Chỉ dùng để đọc claims (id, role, sub...), KHÔNG verify signature.
 */
export function decodeJwt(token) {
  try {
    const base64Payload = token.split('.')[1];
    const decoded = atob(base64Payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}
