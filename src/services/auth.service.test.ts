import {
  parseJwt,
  mapBackendRoleToFrontend,
  buildSessionUser,
} from './auth.service'
import type { UserResponse } from './user.types'

describe('auth.service - JWT & Role Utilities', () => {
  it('giải mã thành công JWT payload từ chuỗi token hợp lệ', () => {
    // Header: {"alg":"HS512","typ":"JWT"} -> eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9
    // Payload: {"sub":"42","email":"farmer@capnong.vn","roles":["SHOP"]}
    const mockPayloadBase64 = btoa(
      JSON.stringify({
        sub: '42',
        email: 'farmer@capnong.vn',
        roles: ['SHOP'],
      }),
    )
    const mockToken = `eyJhbGciOiJIUzUxMiJ9.${mockPayloadBase64}.signatureDummy`

    const decoded = parseJwt(mockToken)
    expect(decoded).not.toBeNull()
    expect(decoded?.sub).toBe('42')
    expect(decoded?.email).toBe('farmer@capnong.vn')
    expect(decoded?.roles).toEqual(['SHOP'])
  })

  it('trả về null nếu format JWT không hợp lệ', () => {
    expect(parseJwt('invalid_token')).toBeNull()
    expect(parseJwt('')).toBeNull()
  })

  it('chuyển đổi chính xác role Backend theo 4 giá trị DB thật', () => {
    expect(mapBackendRoleToFrontend('ADMIN')).toBe('admin')
    expect(mapBackendRoleToFrontend(['ROLE_ADMIN'])).toBe('admin')
    expect(mapBackendRoleToFrontend([{ name: 'ROLE_ADMIN' }])).toBe('admin')

    expect(mapBackendRoleToFrontend('SHOP')).toBe('shop')
    expect(mapBackendRoleToFrontend(['ROLE_SHOP'])).toBe('shop')

    expect(mapBackendRoleToFrontend('SHIPPER')).toBe('shipper')
    expect(mapBackendRoleToFrontend(['ROLE_SHIPPER'])).toBe('shipper')

    expect(mapBackendRoleToFrontend('BUYER')).toBe('buyer')
    expect(mapBackendRoleToFrontend('STAFF')).toBe('buyer')
    expect(mapBackendRoleToFrontend([])).toBe('buyer')
    expect(mapBackendRoleToFrontend(undefined)).toBe('buyer')
  })

  it('xây dựng SessionUser chuẩn từ UserResponse DTO', () => {
    const mockUser: UserResponse = {
      id: 10,
      fullName: 'Trần Văn Vườn',
      email: 'vuon@capnong.vn',
      phoneNumber: '0987654321',
      status: 'ACTIVE',
      role: {
        id: 2,
        name: 'SHOP',
      },
      shopName: 'Nông Trại Xanh',
      logoUrl: 'https://example.com/logo.jpg',
    }

    const sessionUser = buildSessionUser(mockUser)
    expect(sessionUser.id).toBe('10')
    expect(sessionUser.name).toBe('Trần Văn Vườn')
    expect(sessionUser.email).toBe('vuon@capnong.vn')
    expect(sessionUser.role).toBe('shop')
    expect(sessionUser.shopName).toBe('Nông Trại Xanh')
    expect(sessionUser.avatar).toBe('https://example.com/logo.jpg')
    expect(sessionUser.kycStatus).toBe('APPROVED')
  })

  it('ưu tiên role thật từ profile khi fallback mặc định là buyer', () => {
    const adminUser: UserResponse = {
      id: 99,
      email: 'admin@capnong.vn',
      fullName: 'Quản trị viên',
      status: 'ACTIVE',
      role: { id: 1, name: 'ADMIN' },
    }

    expect(buildSessionUser(adminUser, 'buyer').role).toBe('admin')
  })
})
