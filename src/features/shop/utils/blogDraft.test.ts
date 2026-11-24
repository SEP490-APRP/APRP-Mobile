import { draftBodyToHtml, htmlToDraftBody, toBlogRequest, validateBlogDraft } from './blogDraft'

describe('blogDraft', () => {
  const body = `Mùa này vườn được **mùa cà rốt**.

## Cách bảo quản
- Để ngăn mát
- Không rửa trước khi cất

> Củ cong nhưng ngọt lắm!

![](https://cdn/x.jpg)`

  it('chữ soạn trên app thành HTML', () => {
    expect(draftBodyToHtml(body)).toBe(
      '<p>Mùa này vườn được <strong>mùa cà rốt</strong>.</p><h2>Cách bảo quản</h2><ul><li>Để ngăn mát</li><li>Không rửa trước khi cất</li></ul><blockquote><p>Củ cong nhưng ngọt lắm!</p></blockquote><p><img src="https://cdn/x.jpg" alt=""></p>',
    )
    expect(draftBodyToHtml('a < b\ndòng 2')).toBe('<p>a &lt; b<br>dòng 2</p>')
  })

  it('HTML cũ (kể cả CKEditor in nghiêng / list lồng <p>) đổi lại thành chữ để sửa, rồi lưu ra đúng HTML đó', () => {
    const html = draftBodyToHtml(body)
    expect(draftBodyToHtml(htmlToDraftBody(html))).toBe(html)
    expect(htmlToDraftBody(html)).toContain('## Cách bảo quản\n\n- Để ngăn mát\n- Không rửa')

    const ckHtml = '<p>Trái <em>chín cây</em> &amp; <strong>ngọt</strong></p><ul><li><p>Bước 1</p></li></ul>'
    const draftBody = htmlToDraftBody(ckHtml)
    expect(draftBody).toBe('Trái *chín cây* & **ngọt**\n\n- Bước 1')
    expect(draftBodyToHtml(draftBody)).toBe('<p>Trái <em>chín cây</em> &amp; <strong>ngọt</strong></p><ul><li>Bước 1</li></ul>')
  })

  it('kiểm tra và tạo request', () => {
    expect(Object.keys(validateBlogDraft({ title: 'abc', category: 'STORY', body: 'ngắn' }))).toEqual(['title', 'body'])
    expect(toBlogRequest({ title: ' Mùa cà rốt ', category: 'GUIDE', body: 'Xin chào' }, 'DRAFT', 'u')).toEqual({
      title: 'Mùa cà rốt',
      category: 'GUIDE',
      content: '<p>Xin chào</p>',
      status: 'DRAFT',
      pictureUrl: 'u',
    })
  })
})
