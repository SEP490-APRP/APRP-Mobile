import { parsePayosReturn } from './payosReturn'

describe('parsePayosReturn', () => {
  it('đọc mã đơn và trạng thái đã thanh toán', () => {
    expect(
      parsePayosReturn('capnong://buyer/payment/result?code=00&id=abc&cancel=false&status=PAID&orderCode=123456'),
    ).toEqual({ orderCode: '123456', status: 'PAID', cancelled: false })
  })

  it('nhận ra người dùng huỷ trên cổng PayOS', () => {
    expect(parsePayosReturn('https://x.vn/buyer/payment/result?cancel=true&status=CANCELLED&orderCode=9')).toEqual({
      orderCode: '9',
      status: 'CANCELLED',
      cancelled: true,
    })
  })

  it('không có query thì trả rỗng', () => {
    expect(parsePayosReturn('capnong://buyer/payment/result')).toEqual({ orderCode: undefined, status: undefined, cancelled: false })
  })
})
