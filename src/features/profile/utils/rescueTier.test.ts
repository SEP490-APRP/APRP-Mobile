import { rescueTier } from './rescueTier'

describe('rescueTier', () => {
  it('chia hạng theo mốc 5 / 20 / 50 kg', () => {
    expect(rescueTier(0)).toMatchObject({ title: 'Người Gieo Mầm', progress: 0 })
    expect(rescueTier(2.5)).toMatchObject({ title: 'Người Gieo Mầm', progress: 50 })
    expect(rescueTier(12.5)).toMatchObject({ title: 'Cứu Tinh Nông Sản', progress: 50 })
    expect(rescueTier(35)).toMatchObject({ title: 'Hiệp Sĩ Nông Nghiệp', progress: 50 })
    expect(rescueTier(80)).toMatchObject({ title: 'Đại Sứ Xanh CapNong', progress: 100 })
  })
})
