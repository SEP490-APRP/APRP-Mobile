import { haversineMeters, resampleRoute } from './routeResample'

describe('resampleRoute', () => {
  it('returns input unchanged when <= 1 point', () => {
    expect(resampleRoute([])).toEqual([])
    expect(resampleRoute([{ lat: 10.8, lng: 106.7 }])).toEqual([{ lat: 10.8, lng: 106.7 }])
  })

  it('splits a long segment into even ~30m steps and preserves start/end', () => {
    const start = { lat: 10.8, lng: 106.7 }
    const end = { lat: 10.803, lng: 106.7 } // ~333m north
    const res = resampleRoute([start, end], 30)

    expect(res[0]).toEqual(start)
    expect(res[res.length - 1]).toEqual(end)
    expect(res.length).toBeGreaterThanOrEqual(10)

    // Each intermediate step should be ~30m
    for (let i = 1; i < res.length - 1; i++) {
      const d = haversineMeters(res[i - 1], res[i])
      expect(d).toBeGreaterThan(28)
      expect(d).toBeLessThan(32)
    }
  })

  it('smooths uneven OSRM vertices (dense curve + long straight)', () => {
    const pts = [
      { lat: 10.8, lng: 106.7 },
      { lat: 10.80005, lng: 106.7 }, // ~5.5m
      { lat: 10.8001, lng: 106.7 }, // ~5.5m
      { lat: 10.802, lng: 106.7 }, // ~211m
    ]
    const res = resampleRoute(pts, 30)
    for (let i = 1; i < res.length - 1; i++) {
      const d = haversineMeters(res[i - 1], res[i])
      expect(d).toBeGreaterThan(27)
      expect(d).toBeLessThan(33)
    }
  })
})

