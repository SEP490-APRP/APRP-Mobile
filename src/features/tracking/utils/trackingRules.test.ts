import {
  bearing,
  canTrackOrder,
  DEFAULT_DEST,
  effectivePhase,
  formatUpdatedAt,
  isShipperVisible,
  resolveEndpoints,
  routesForRole,
  shipperPosition,
  stompBrokerUrl,
} from './trackingRules'

const shop = { lat: 10.85, lng: 106.77 }
const dest = { lat: 10.77, lng: 106.65 }

describe('trackingRules', () => {
  it('chỉ cho theo dõi ở các trạng thái giao hàng', () => {
    expect(canTrackOrder('SHIPPING', 'BUYER')).toBe(true)
    expect(canTrackOrder('READY', 'BUYER')).toBe(true)
    expect(canTrackOrder('READY', 'SHOP')).toBe(false)
    expect(canTrackOrder('PICKED_UP', 'SHOP')).toBe(true)
    expect(canTrackOrder('COMPLETED', 'BUYER')).toBe(false)
    expect(canTrackOrder(undefined, 'BUYER')).toBe(false)
  })

  it('ưu tiên toạ độ realtime, rồi toạ độ trên đơn, rồi mặc định', () => {
    expect(resolveEndpoints({ shopLatitude: 1, shopLongitude: 2 }, { shop: { lat: 3, lng: 4 } }).shop).toEqual({
      lat: 1,
      lng: 2,
    })
    expect(resolveEndpoints(null, { shop: { lat: 3, lng: 4 } }).shop).toEqual({ lat: 3, lng: 4 })
    expect(resolveEndpoints(null).dest).toEqual(DEFAULT_DEST)
    expect(resolveEndpoints({ destinationLatitude: 0, destinationLongitude: 0 }).dest).toEqual(DEFAULT_DEST)
  })

  it('đọc vị trí xe khi có đủ toạ độ', () => {
    expect(shipperPosition({ latitude: 10, longitude: 106 })).toEqual({ lat: 10, lng: 106 })
    expect(shipperPosition({ latitude: 10 })).toBeNull()
    expect(shipperPosition(null)).toBeNull()
  })

  it('trạng thái đơn thắng deliveryPhase, rồi mới đoán theo khoảng cách', () => {
    expect(effectivePhase({ orderStatus: 'PICKED_UP', deliveryPhase: 'TO_SHOP' }, null, shop, dest)).toBe('TO_BUYER')
    expect(effectivePhase({ orderStatus: 'DELIVERED' }, null, shop, dest)).toBe('DELIVERED')
    expect(effectivePhase({ deliveryPhase: 'AT_SHOP' }, null, shop, dest)).toBe('AT_SHOP')
    expect(effectivePhase({}, null, shop, dest)).toBe('TO_SHOP')
    expect(effectivePhase({}, { lat: 10.8505, lng: 106.7705 }, shop, dest)).toBe('AT_SHOP')
    expect(effectivePhase({}, { lat: 10.79, lng: 106.67 }, shop, dest)).toBe('TO_BUYER')
    expect(effectivePhase({}, { lat: 10.9, lng: 106.8 }, shop, dest)).toBe('TO_SHOP')
  })

  it('buyer chỉ thấy xe sau khi lấy hàng, shop chỉ thấy xe khi tới lấy', () => {
    expect(isShipperVisible('BUYER', 'TO_SHOP')).toBe(false)
    expect(isShipperVisible('BUYER', 'AT_SHOP')).toBe(false)
    expect(isShipperVisible('BUYER', 'TO_BUYER')).toBe(true)
    expect(isShipperVisible('SHOP', 'TO_SHOP')).toBe(true)
    expect(isShipperVisible('SHOP', 'TO_BUYER')).toBe(false)
    expect(isShipperVisible('SHIPPER', 'TO_BUYER')).toBe(true)
    expect(routesForRole('BUYER')).toEqual({ toShop: false, toBuyer: true })
    expect(routesForRole('SHOP')).toEqual({ toShop: true, toBuyer: false })
  })

  it('tính hướng xe', () => {
    expect(Math.round(bearing({ lat: 10, lng: 106 }, { lat: 11, lng: 106 }))).toBe(0)
    expect(Math.round(bearing({ lat: 10, lng: 106 }, { lat: 10, lng: 107 }))).toBe(90)
  })

  it('định dạng giờ cập nhật dạng mảng hoặc chuỗi', () => {
    expect(formatUpdatedAt([2026, 10, 22, 9, 5, 7])).toMatch(/09:05:07/)
    expect(formatUpdatedAt('không phải ngày')).toBe('vừa xong')
    expect(formatUpdatedAt(undefined)).toBe('vừa xong')
  })

  it('tạo URL STOMP từ API base', () => {
    expect(stompBrokerUrl('http://10.0.2.2:8080/api')).toBe('ws://10.0.2.2:8080/api/ws/websocket')
    expect(stompBrokerUrl('https://capnong.vn/api/v1/')).toBe('wss://capnong.vn/api/ws/websocket')
    expect(stompBrokerUrl('https://capnong.vn')).toBe('wss://capnong.vn/api/ws/websocket')
  })

  it('bỏ qua deliveryPhase cũ khi đơn mới còn đang đi lấy hàng', () => {
    const shop = { lat: 10.85, lng: 106.772 }
    const dest = { lat: 10.7725, lng: 106.6578 }
    const data = { orderStatus: 'SHIPPING', deliveryPhase: 'TO_BUYER' }
    expect(effectivePhase(data, { lat: 10.842, lng: 106.766 }, shop, dest)).toBe('TO_SHOP')
  })
})
