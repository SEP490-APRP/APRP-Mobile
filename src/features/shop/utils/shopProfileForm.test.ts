import type { UserResponse } from '@/services/user.types'
import { profileToShopForm, toShopProfileRequest, validateShopProfile } from './shopProfileForm'

describe('shopProfileForm', () => {
  const p = {
    id: 5,
    fullName: 'Nguyễn Thị Ba',
    shopName: 'Vườn cô Ba',
    phone: '0903 456 789',
    bankAccountNumber: '0123456789',
  } as UserResponse
  it('đọc hồ sơ, lấy tên chủ vườn làm chủ tài khoản nếu thiếu', () => {
    expect(profileToShopForm(p)).toMatchObject({
      phoneNumber: '0903 456 789',
      bankAccount: '0123456789',
      bankAccountHolder: 'Nguyễn Thị Ba',
    })
  })
  it('kiểm tra và làm sạch', () => {
    const f = profileToShopForm(p)
    expect(validateShopProfile(f)).toEqual({})
    expect(
      Object.keys(
        validateShopProfile({
          ...f,
          shopName: ' ',
          phoneNumber: '0123',
          description: 'x'.repeat(501),
          bankAccount: '12ab',
        }),
      ).sort(),
    ).toEqual(['bankAccount', 'description', 'phoneNumber', 'shopName'])
    expect(toShopProfileRequest({ ...f, phoneNumber: '+84 903 456 789', bankAccount: '0123 456 789' })).toMatchObject({
      phoneNumber: '0903456789',
      bankAccount: '0123456789',
    })
  })
})
