import type { HubTrip, HubTripBox } from '@/services'
import { boxesLeft, crateTotals, filterBoxes, isPackageToken, qrPath, withLoaded } from './crates'

const box = (orderId: number, loaded: number[], extra: Partial<HubTripBox> = {}): HubTripBox => ({
  orderId,
  code: `TEST-PO-${orderId}`,
  recipientName: 'Nguyễn Đức',
  hubName: 'Hub Gò Vấp',
  crateKg: 15,
  crates: 2,
  loaded,
  ...extra,
})
const boxes = [box(1, [1, 2]), box(2, [1], { recipientName: 'Trần Lan', hubName: 'Hub Quận 7' })]

describe('kiểm thùng', () => {
  it('đếm thùng và lọc theo tình trạng', () => {
    expect(crateTotals(boxes)).toEqual({ done: 3, total: 4 })
    expect(filterBoxes(boxes, 'full', '').map((b) => b.orderId)).toEqual([1])
    expect(filterBoxes(boxes, 'left', '').map((b) => b.orderId)).toEqual([2])
  })

  it('tìm không cần gõ dấu, theo tên, mã đơn hoặc hub', () => {
    expect(filterBoxes(boxes, 'all', 'nguyen duc').map((b) => b.orderId)).toEqual([1])
    expect(filterBoxes(boxes, 'all', 'po-2').map((b) => b.orderId)).toEqual([2])
    expect(filterBoxes(boxes, 'all', 'go vap').map((b) => b.orderId)).toEqual([1])
  })

  it('đổi thùng của một đơn thì tổng đã nhận đổi theo', () => {
    const trip = { boxes, boxTotal: 4, boxLoaded: 3 } as HubTrip
    const next = withLoaded(trip, 2, [1, 2])
    expect(next.boxLoaded).toBe(4)
    expect(boxesLeft(next)).toBe(0)
    expect(boxesLeft(trip)).toBe(1)
  })

  it('vẽ QR cho mã tem, có ô định vị ở góc trên trái', () => {
    const token = `CN${'0123456789abcdef'.repeat(2)}`
    expect(isPackageToken(token)).toBe(true)
    expect(isPackageToken('QR-123')).toBe(false)
    const qr = qrPath(`https://capnong.vn/truy-xuat/${token}`)
    expect(Number.isInteger(qr.size)).toBe(true)
    expect(qr.d.startsWith('M0 0h7v1h-7z')).toBe(true)
  })
})
