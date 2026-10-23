/** Kết quả PayOS gắn vào returnUrl/cancelUrl: ?code=00&id=...&cancel=false&status=PAID&orderCode=123 */
export type PayosReturn = {
  orderCode?: string
  status?: string
  cancelled: boolean
}

export function parsePayosReturn(url: string): PayosReturn {
  const query = url.includes('?') ? url.slice(url.indexOf('?') + 1).split('#')[0] : ''
  const params = new Map<string, string>()
  for (const pair of query.split('&')) {
    if (!pair) continue
    const [k, v = ''] = pair.split('=')
    params.set(decodeURIComponent(k), decodeURIComponent(v.replace(/\+/g, ' ')))
  }
  const status = params.get('status')?.toUpperCase()
  return {
    orderCode: params.get('orderCode') || undefined,
    status,
    cancelled: params.get('cancel') === 'true' || status === 'CANCELLED',
  }
}
