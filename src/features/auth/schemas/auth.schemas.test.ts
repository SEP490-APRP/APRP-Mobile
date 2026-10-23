import { validate } from '@/utils'
import {
  loginSchema,
  memberRegisterSchema,
  buyerRegisterSchema,
  shipperRegisterSchema,
  REGISTER_DEFAULTS,
  shopAccountSchema,
  shopKycSchema,
} from './auth.schemas'

const error = (r: ReturnType<typeof validate>) => (r.ok ? null : r.error)

describe('loginSchema', () => {
  it('bắt buộc email/số điện thoại (bỏ khoảng trắng)', () =>
    expect(error(validate(loginSchema, { identifier: '  ', password: 'password123' }))).toBe(
      'Vui lòng nhập Email hoặc Số điện thoại của bạn',
    ))
  it('mật khẩu tối thiểu 6 ký tự', () =>
    expect(error(validate(loginSchema, { identifier: 'a@b.vn', password: '123' }))).toBe(
      'Mật khẩu cần tối thiểu 6 ký tự',
    ))
  it('hợp lệ thì trả dữ liệu đã trim', () => {
    const r = validate(loginSchema, { identifier: ' a@b.vn ', password: 'password123' })
    expect(r).toEqual({ ok: true, data: { identifier: 'a@b.vn', password: 'password123' } })
  })
})

describe('shopAccountSchema', () => {
  const base = {
    ...REGISTER_DEFAULTS,
    fullName: 'Chú Bảy',
    phone: '0912345678',
    email: 'chubay@nongsan.vn',
    cccd: '079201001234',
    password: 'password123',
  }
  it('bắt buộc số điện thoại hợp lệ', () =>
    expect(error(validate(shopAccountSchema, { ...base, phone: '' }))).toBe(
      'Số điện thoại không hợp lệ (10 số, đầu 03, 05, 07, 08, 09)',
    ))
  it('bắt buộc CCCD hợp lệ 12 chữ số', () =>
    expect(error(validate(shopAccountSchema, { ...base, cccd: '1234' }))).toBe(
      'Số CCCD chủ nông hộ không hợp lệ (yêu cầu đúng 12 chữ số)',
    ))
  it('mật khẩu xác nhận phải trùng', () =>
    expect(error(validate(shopAccountSchema, { ...base, confirmPassword: 'khac' }))).toBe(
      'Mật khẩu xác nhận không trùng khớp',
    ))
  it('hợp lệ', () =>
    expect(validate(shopAccountSchema, { ...base, confirmPassword: 'password123' }).ok).toBe(true))
})

describe('shopKycSchema', () => {
  it('lỗi theo thứ tự: tên -> địa chỉ', () => {
    expect(error(validate(shopKycSchema, REGISTER_DEFAULTS))).toBe(
      'Vui lòng nhập tên nhà vườn hoặc tên gian hàng của bạn',
    )
    expect(error(validate(shopKycSchema, { ...REGISTER_DEFAULTS, shopName: 'HTX' }))).toBe(
      'Vui lòng cung cấp địa chỉ nông trại / kho xuất hàng',
    )
    expect(
      validate(shopKycSchema, { ...REGISTER_DEFAULTS, shopName: 'HTX', shopAddress: 'Đà Lạt' }).ok,
    ).toBe(true)
  })
})

describe('buyerRegisterSchema', () => {
  const base = {
    ...REGISTER_DEFAULTS,
    fullName: 'Nguyễn Văn Mua',
    phone: '0987654321',
    email: 'mua@capnong.vn',
    buyerAddress: '123 Nguyễn Huệ, Q1, TP.HCM',
    password: 'password123',
    confirmPassword: 'password123',
  }
  it('hợp lệ khi có đầy đủ họ tên, SĐT, email, địa chỉ và mật khẩu', () =>
    expect(validate(buyerRegisterSchema, base).ok).toBe(true))
  it('bắt buộc địa chỉ nhận hàng', () =>
    expect(error(validate(buyerRegisterSchema, { ...base, buyerAddress: '' }))).toBe(
      'Vui lòng nhập địa chỉ giao nhận hàng của bạn',
    ))
})

describe('shipperRegisterSchema', () => {
  const base = {
    ...REGISTER_DEFAULTS,
    fullName: 'Trần Văn Giao',
    phone: '0987654321',
    email: 'giao@capnong.vn',
    cccd: '079201004321',
    vehicleNumber: '59-A1 123.45',
    shipperArea: 'Quận 7, TP.HCM',
    password: 'password123',
    confirmPassword: 'password123',
  }
  it('hợp lệ khi có CCCD 12 số, biển số xe và khu vực hoạt động', () =>
    expect(validate(shipperRegisterSchema, base).ok).toBe(true))
  it('bắt buộc CCCD đúng 12 chữ số', () =>
    expect(error(validate(shipperRegisterSchema, { ...base, cccd: '123' }))).toBe(
      'Số CCCD tài xế không hợp lệ (yêu cầu đúng 12 chữ số)',
    ))
  it('bắt buộc biển số xe', () =>
    expect(error(validate(shipperRegisterSchema, { ...base, vehicleNumber: '' }))).toBe(
      'Vui lòng nhập biển số xe vận chuyển (VD: 59-A1 123.45)',
    ))
})

describe('memberRegisterSchema', () => {
  const base = {
    ...REGISTER_DEFAULTS,
    fullName: 'Mai',
    password: 'password123',
    confirmPassword: 'password123',
  }
  it('cần số điện thoại hoặc email', () =>
    expect(error(validate(memberRegisterSchema, base))).toBe(
      'Vui lòng cung cấp số điện thoại hoặc email liên hệ',
    ))
  it('chỉ có email cũng được', () =>
    expect(validate(memberRegisterSchema, { ...base, email: 'mai@capnong.vn' }).ok).toBe(true))
})
