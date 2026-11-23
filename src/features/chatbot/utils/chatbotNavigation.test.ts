import { isTabRoute, itemDetailRoute, orderTrackingAction, resolveChatbotRoute } from './chatbotNavigation'

describe('resolveChatbotRoute: Khách mua', () => {
  it.each([
    ['/cart', '/buyer/cart'],
    ['/checkout', '/buyer/checkout'],
    ['/orders', '/buyer/orders'],
    ['/orders?tab=PENDING', '/buyer/orders'],
    ['/orders?tab=REFUND', '/buyer/orders'],
    ['/tai-khoan', '/buyer/account'],
    ['/profile', '/buyer/account'],
    ['/profile?tab=wallet', '/buyer/account'],
    ['/tai-khoan?tab=address', '/buyer/addresses'],
    ['/profile?tab=addresses', '/buyer/addresses'],
    ['/san-pham', '/buyer/fresh'],
    ['/nong-san-tuoi', '/buyer/fresh'],
    ['/combo-tui-mu', '/buyer/combos'],
    ['/my-vouchers?tab=SHIPPING', '/buyer/vouchers'],
    ['/cart/', '/buyer/cart'],
    ['/tin-nhan', '/buyer/messages'],
  ])('đổi %s sang %s', (url, route) => {
    expect(resolveChatbotRoute(url, 'buyer')).toBe(route)
  })

  it('mở chi tiết đơn khi URL có orderId', () => {
    const detail = { pathname: '/buyer/order/[id]', params: { id: '5' } }
    expect(resolveChatbotRoute('/orders?orderId=5', 'buyer')).toEqual(detail)
    expect(resolveChatbotRoute('/profile?tab=orders&orderId=5', 'buyer')).toEqual(detail)
  })

  it('mở chi tiết sản phẩm và cửa hàng theo id trong đường dẫn', () => {
    expect(resolveChatbotRoute('/san-pham/12', 'buyer')).toEqual({ pathname: '/buyer/product/[id]', params: { id: '12' } })
    expect(resolveChatbotRoute('/cua-hang/7/voucher', 'buyer')).toEqual({ pathname: '/buyer/shop/[id]', params: { id: '7' } })
  })

  it.each(['/ke-hoach-an-uong', '/shop?tab=products', '/shipper?tab=new', '/login', '/dang-ky?role=shop', '/khong-ton-tai', 'https://zalo.me/capnong', ''])(
    'trả null khi app chưa có màn cho %s',
    (url) => {
      expect(resolveChatbotRoute(url, 'buyer')).toBeNull()
    },
  )

  it('trả null khi không có URL', () => {
    expect(resolveChatbotRoute(undefined, 'buyer')).toBeNull()
  })
})

describe('resolveChatbotRoute: Nhà vườn', () => {
  it.each([
    ['/shop', '/shop'],
    ['/shop?tab=overview', '/shop'],
    ['/shop?tab=products', '/shop/products'],
    ['/shop?tab=products&action=add', '/shop/product/new'],
    ['/shop?tab=orders', '/shop/orders'],
    ['/shop?tab=vouchers', '/shop/vouchers'],
    ['/shop?tab=blogs', '/shop/blogs'],
    ['/shop?tab=profile', '/shop/profile-edit'],
    ['/shop?tab=messages', '/shop/messages'],
  ])('đổi %s sang %s', (url, route) => {
    expect(resolveChatbotRoute(url, 'shop')).toBe(route)
  })

  it('mở đúng loại khi tạo túi mù hoặc combo', () => {
    expect(resolveChatbotRoute('/shop?tab=products&action=blindbox', 'shop')).toEqual({ pathname: '/shop/bundle', params: { kind: 'MYSTERY_BOX' } })
    expect(resolveChatbotRoute('/shop?tab=products&action=combo', 'shop')).toEqual({ pathname: '/shop/bundle', params: { kind: 'COMBO' } })
  })

  it.each(['/shop?tab=wallet', '/shop?tab=wallet&action=withdraw', '/shop?tab=disputes', '/shop?tab=reviews', '/cart'])(
    'trả null khi app chưa có màn cho %s',
    (url) => {
      expect(resolveChatbotRoute(url, 'shop')).toBeNull()
    },
  )
})

describe('resolveChatbotRoute: Ví', () => {
  it.each(['buyer', 'shop', 'shipper'] as const)('app chưa có màn Ví nên trả null cho %s', (role) => {
    expect(resolveChatbotRoute('/my-wallet', role)).toBeNull()
  })
})

describe('resolveChatbotRoute: Tài xế', () => {
  it.each([
    ['/shipper', '/shipper'],
    ['/shipper?tab=new', '/shipper'],
    ['/shipper?tab=delivering', '/shipper/delivering'],
    ['/shipper?tab=profile', '/shipper/account'],
    ['/tin-nhan', '/shipper/messages'],
  ])('đổi %s sang %s', (url, route) => {
    expect(resolveChatbotRoute(url, 'shipper')).toBe(route)
  })

  it('trả null với URL của vai trò khác', () => {
    expect(resolveChatbotRoute('/shop?tab=orders', 'shipper')).toBeNull()
    expect(resolveChatbotRoute('/cart', 'shipper')).toBeNull()
  })
})

describe('isTabRoute', () => {
  it('phân biệt tab với màn mở chồng', () => {
    expect(isTabRoute('/buyer/cart')).toBe(true)
    expect(isTabRoute('/shop/orders')).toBe(true)
    expect(isTabRoute('/buyer/checkout')).toBe(false)
    expect(isTabRoute({ pathname: '/buyer/order/[id]', params: { id: '1' } })).toBe(false)
  })
})

describe('itemDetailRoute', () => {
  it('chọn màn chi tiết theo loại món', () => {
    expect(itemDetailRoute({ itemType: 'PRODUCT', itemId: 1 })).toEqual({
      pathname: '/buyer/product/[id]',
      params: { id: '1' },
    })
    expect(itemDetailRoute({ itemType: 'MYSTERY_BOX', itemId: 2 })).toEqual({
      pathname: '/buyer/combo/[id]',
      params: { id: '2', kind: 'MYSTERY_BOX' },
    })
    expect(itemDetailRoute({ itemType: 'COMBO', itemId: 3 })).toEqual({
      pathname: '/buyer/combo/[id]',
      params: { id: '3', kind: 'BUILD_COMBO' },
    })
  })
})

describe('orderTrackingAction', () => {
  it('đơn đang giao mở bản đồ theo dõi', () => {
    expect(orderTrackingAction(9, 'SHIPPING').href).toEqual({ pathname: '/buyer/tracking/[id]', params: { id: '9' } })
  })

  it('đơn ở trạng thái khác mở chi tiết đơn', () => {
    expect(orderTrackingAction(9, 'COMPLETED').href).toEqual({ pathname: '/buyer/order/[id]', params: { id: '9' } })
    expect(orderTrackingAction(9).label).toBe('Xem chi tiết đơn hàng')
  })
})
