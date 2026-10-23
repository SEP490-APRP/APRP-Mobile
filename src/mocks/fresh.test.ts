import { freshResponses } from './fresh'

describe('freshResponses', () => {
  const data = [{ id: 1, status: 'PENDING' }]
  const service = freshResponses({
    async list() {
      return { result: data }
    },
    async approve(id: number) {
      const target = data.find((d) => d.id === id)!
      target.status = 'ACTIVE'
      return { result: true }
    },
    async listViaThis(this: { list: () => Promise<{ result: typeof data }> }) {
      return this.list()
    },
  })

  it('mỗi lần gọi trả bản sao, sửa mock không làm đổi kết quả đã trả', async () => {
    const before = (await service.list()).result
    await service.approve(1)
    expect(before[0].status).toBe('PENDING')
    expect((await service.list()).result[0].status).toBe('ACTIVE')
  })

  it('giữ `this` của service gốc', async () => {
    expect((await service.listViaThis()).result).toHaveLength(1)
  })
})
