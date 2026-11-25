import type { LatLng } from './trackingRules'

const EARTH_RADIUS_M = 6_371_000

/** Khoảng cách đường chim bay giữa hai toạ độ (mét) dùng công thức Haversine (chỉ dùng nội bộ để chia bước). */
export function haversineMeters(a: LatLng, b: LatLng): number {
  const rad = (d: number) => (d * Math.PI) / 180
  const dLat = rad(b.lat - a.lat)
  const dLng = rad(b.lng - a.lng)
  const sinLat = Math.sin(dLat / 2)
  const sinLng = Math.sin(dLng / 2)
  const h = sinLat * sinLat + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * sinLng * sinLng
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)))
}

/**
 * Chia lại mảng điểm OSRM thành các bước có khoảng cách đều nhau (`stepMeters`),
 * giúp xe chạy đều tốc độ trên cả khúc cua lẫn đường thẳng, không bị giật hay nhảy cóc.
 */
export function resampleRoute(points: LatLng[], stepMeters = 30): LatLng[] {
  if (points.length <= 1 || stepMeters <= 0) return points
  const out: LatLng[] = [points[0]]
  let carry = 0

  for (let i = 1; i < points.length; i++) {
    let prev = points[i - 1]
    const curr = points[i]
    let segLen = haversineMeters(prev, curr)
    if (segLen < 0.5) continue

    while (carry + segLen >= stepMeters) {
      const need = stepMeters - carry
      const t = need / segLen
      const next: LatLng = {
        lat: prev.lat + (curr.lat - prev.lat) * t,
        lng: prev.lng + (curr.lng - prev.lng) * t,
      }
      out.push(next)
      prev = next
      segLen -= need
      carry = 0
    }
    carry += segLen
  }

  const last = points[points.length - 1]
  const tail = out[out.length - 1]
  if (haversineMeters(tail, last) > 2) {
    out.push(last)
  } else {
    out[out.length - 1] = last
  }
  return out
}

/** Gọi OSRM lấy tuyến đường thực tế (có timeout 8s và thử lại 1 lần); trả về mảng rỗng nếu thất bại. */
export async function fetchOsrmRoute(from: LatLng, to: LatLng, stepMeters = 30): Promise<LatLng[]> {
  const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`
  for (let attempt = 0; attempt < 2; attempt++) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000)
    try {
      const res = await fetch(url, { signal: controller.signal })
      clearTimeout(timeoutId)
      if (!res.ok) continue
      const data = (await res.json()) as {
        routes?: { geometry?: { coordinates?: [number, number][] } }[]
      }
      const coords = data.routes?.[0]?.geometry?.coordinates
      if (coords && coords.length > 0) {
        const raw = coords.map(([lng, lat]) => ({ lat, lng }))
        return resampleRoute(raw, stepMeters)
      }
    } catch {
      clearTimeout(timeoutId)
    }
  }
  return []
}

