import { toAddressRequest, validateAddressDraft } from './addressDraft'

const draft = { label: 'Nhà', recipientName: 'Như', phone: '090 123 4567', address: '12 Nguyễn Văn Bảo, Gò Vấp', isDefault: false }

describe('addressDraft', () => {
  it('chấp nhận số có khoảng trắng và chuẩn hoá khi gửi', () => {
    expect(validateAddressDraft(draft)).toEqual({})
    expect(toAddressRequest(draft).phone).toBe('0901234567')
  })

  it('báo lỗi từng ô', () => {
    expect(validateAddressDraft({ ...draft, recipientName: ' ', phone: '123', address: 'ngắn' })).toEqual({
      recipientName: 'Vui lòng nhập tên người nhận',
      phone: 'Số điện thoại không hợp lệ',
      address: 'Vui lòng nhập địa chỉ đầy đủ',
    })
  })
})
