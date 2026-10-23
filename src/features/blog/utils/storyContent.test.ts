import {
  compactCount,
  formatStoryDate,
  parseStoryContent,
  readingMinutes,
  storyExcerpt,
  storyPlainText,
  timeAgo,
} from './storyContent'

describe('parseStoryContent', () => {
  it('tách chữ thường thành đoạn theo dòng trống', () => {
    expect(parseStoryContent('Đoạn một.\n\nĐoạn hai\ncòn tiếp.')).toEqual([
      { type: 'paragraph', runs: [{ text: 'Đoạn một.' }] },
      { type: 'paragraph', runs: [{ text: 'Đoạn hai\ncòn tiếp.' }] },
    ])
  })

  it('hiểu tiêu đề, đậm nghiêng, xuống dòng và thực thể HTML', () => {
    const blocks = parseStoryContent(
      '<h2>Mùa  xoài</h2><p>Xoài <strong>cát Hòa Lộc</strong> &amp; <em>bơ</em><br>ngon&nbsp;lắm</p>',
    )
    expect(blocks).toEqual([
      { type: 'heading', level: 2, runs: [{ text: 'Mùa xoài', bold: false, italic: false }] },
      {
        type: 'paragraph',
        runs: [
          { text: 'Xoài ', bold: false, italic: false },
          { text: 'cát Hòa Lộc', bold: true, italic: false },
          { text: ' & ', bold: false, italic: false },
          { text: 'bơ', bold: false, italic: true },
          { text: '\nngon lắm', bold: false, italic: false },
        ],
      },
    ])
  })

  it('gom danh sách, trích dẫn và ảnh; bỏ ảnh không phải http', () => {
    const blocks = parseStoryContent(
      '<ul><li>Một</li><li>Hai</li></ul><blockquote><p>Đất lành</p></blockquote>' +
        '<img src="https://x.vn/a.jpg" alt="Vườn"><img src="data:image/png;base64,AAA"><script>alert(1)</script>',
    )
    expect(blocks.map((b) => b.type)).toEqual(['list', 'quote', 'image'])
    expect(blocks[0]).toMatchObject({ ordered: false, items: [[{ text: 'Một' }], [{ text: 'Hai' }]] })
    expect(blocks[2]).toEqual({ type: 'image', src: 'https://x.vn/a.jpg', alt: 'Vườn' })
  })

  it('trả rỗng cho nội dung trống', () => {
    expect(parseStoryContent('')).toEqual([])
    expect(parseStoryContent(undefined)).toEqual([])
  })
})

describe('chữ thuần, trích đoạn, thời gian đọc', () => {
  it('bỏ thẻ và gộp khoảng trắng', () => {
    expect(storyPlainText('<p>A&nbsp;<b>B</b></p>\n<p>C</p>')).toBe('A B C')
    expect(storyPlainText('<p>luống <strong>cà rốt</strong>. Xong</p>')).toBe('luống cà rốt. Xong')
  })

  it('cắt đoạn trích ở ranh giới từ', () => {
    const text = 'từ '.repeat(80)
    const ex = storyExcerpt(text, 20)
    expect(ex.endsWith('…')).toBe(true)
    expect(ex.length).toBeLessThanOrEqual(21)
    expect(storyExcerpt('ngắn')).toBe('ngắn')
  })

  it('tính phút đọc, tối thiểu 1', () => {
    expect(readingMinutes('vài chữ')).toBe(1)
    expect(readingMinutes('chữ '.repeat(1000))).toBe(5)
  })
})

describe('định dạng', () => {
  it('ngày dd/mm/yyyy', () => {
    expect(formatStoryDate('2026-03-05T10:00:00')).toBe('05/03/2026')
    expect(formatStoryDate('không phải ngày')).toBe('')
  })

  it('thời gian tương đối', () => {
    const now = new Date('2026-03-10T12:00:00').getTime()
    expect(timeAgo('2026-03-10T11:59:40', now)).toBe('vừa xong')
    expect(timeAgo('2026-03-10T11:15:00', now)).toBe('45 phút trước')
    expect(timeAgo('2026-03-10T07:00:00', now)).toBe('5 giờ trước')
    expect(timeAgo('2026-03-08T12:00:00', now)).toBe('2 ngày trước')
    expect(timeAgo('2026-02-01T12:00:00', now)).toBe('01/02/2026')
  })

  it('số gọn', () => {
    expect(compactCount(999)).toBe('999')
    expect(compactCount(1200)).toBe('1,2k')
    expect(compactCount(1000)).toBe('1k')
    expect(compactCount(25400)).toBe('25k')
  })
})
