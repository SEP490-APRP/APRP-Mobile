import { decodeEntities, parseStoryContent, type StoryRun } from '@/features/blog/utils/storyContent'
import type { BlogCreateRequest, BlogResponse, BlogStatus } from '@/services/blog.types'
import { BlogCategory } from '@/types'

/**
 * Soạn bài viết của nhà vườn trên điện thoại (BlogEditorModal bản web).
 * Web soạn HTML bằng thanh công cụ; app soạn chữ thường với vài quy ước nhỏ rồi đổi sang HTML khi lưu:
 * dòng trống tách đoạn, "## " là tiêu đề, "- " là gạch đầu dòng, "> " là trích dẫn, **chữ** là in đậm.
 */
export const SHOP_BLOG_CATEGORIES = [
  { value: BlogCategory.STORY, label: 'Chuyện nhà nông' },
  { value: BlogCategory.NEW_PRODUCT, label: 'Mùa vụ & nông sản mới' },
  { value: BlogCategory.GUIDE, label: 'Cẩm nang & mẹo vặt' },
  { value: BlogCategory.PROMOTION, label: 'Khuyến mãi & ưu đãi' },
  { value: BlogCategory.SUC_KHOE, label: 'Sức khoẻ dinh dưỡng' },
  { value: BlogCategory.NONG_NGHIEP, label: 'Nông nghiệp sạch' },
] as const

export const BLOG_STATUS_LABEL: Record<BlogStatus, string> = {
  PUBLISHED: 'Đã đăng',
  DRAFT: 'Bản nháp',
  HIDDEN: 'Bị ẩn',
  ARCHIVED: 'Lưu trữ',
}

export interface BlogDraft {
  title: string
  category: string
  body: string
}

const runsToText = (runs: StoryRun[]) => runs.map((r) => (r.bold ? `**${r.text}**` : r.text)).join('')

/** HTML (hoặc chữ thường) đã lưu → chữ để sửa trên app. Ảnh chèn giữa bài được giữ dạng ![](url). */
export function htmlToDraftBody(content?: string | null): string {
  return parseStoryContent(content)
    .map((b) => {
      switch (b.type) {
        case 'heading':
          return `## ${runsToText(b.runs)}`
        case 'quote':
          return `> ${runsToText(b.runs)}`
        case 'list':
          return b.items.map((it, i) => `${b.ordered ? `${i + 1}.` : '-'} ${runsToText(it)}`).join('\n')
        case 'image':
          return `![](${b.src})`
        default:
          return runsToText(b.runs)
      }
    })
    .join('\n\n')
}

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const inline = (s: string) => escapeHtml(s.trim()).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')

type LineKind = 'h' | 'ul' | 'ol' | 'quote' | 'img' | 'text' | 'blank'

function lineKind(l: string): LineKind {
  if (!l) return 'blank'
  if (/^#{1,3} /.test(l)) return 'h'
  if (/^[-*•] /.test(l)) return 'ul'
  if (/^\d+[.)] /.test(l)) return 'ol'
  if (l.startsWith('> ')) return 'quote'
  if (/^!\[[^\]]*\]\(\S+\)$/.test(l)) return 'img'
  return 'text'
}

/** Chữ soạn trên app → HTML để web và app cùng hiển thị. Các dòng liền nhau cùng loại gộp thành một khối. */
export function draftBodyToHtml(body: string): string {
  const groups: { kind: LineKind; lines: string[] }[] = []
  for (const raw of body.replace(/\r\n/g, '\n').split('\n')) {
    const line = raw.trim()
    const kind = lineKind(line)
    const last = groups[groups.length - 1]
    // Tiêu đề và ảnh luôn đứng riêng; các loại khác gộp khi liền nhau.
    if (last && last.kind === kind && kind !== 'h' && kind !== 'img') last.lines.push(line)
    else groups.push({ kind, lines: [line] })
  }
  return groups
    .map(({ kind, lines }) => {
      switch (kind) {
        case 'h':
          return `<h2>${inline(lines[0].replace(/^#{1,3} /, ''))}</h2>`
        case 'ul':
          return `<ul>${lines.map((l) => `<li>${inline(l.slice(2))}</li>`).join('')}</ul>`
        case 'ol':
          return `<ol>${lines.map((l) => `<li>${inline(l.replace(/^\d+[.)] /, ''))}</li>`).join('')}</ol>`
        case 'quote':
          return `<blockquote><p>${lines.map((l) => inline(l.slice(2))).join('<br>')}</p></blockquote>`
        case 'img':
          return `<p><img src="${escapeHtml(lines[0].replace(/^!\[[^\]]*\]\((\S+)\)$/, '$1'))}" alt=""></p>`
        case 'text':
          return `<p>${lines.map(inline).join('<br>')}</p>`
        default:
          return ''
      }
    })
    .join('')
}

export function blogToDraft(b: BlogResponse): BlogDraft {
  return {
    title: decodeEntities(b.title ?? ''),
    category: b.category || BlogCategory.STORY,
    body: htmlToDraftBody(b.content),
  }
}

export const emptyBlogDraft = (): BlogDraft => ({ title: '', category: BlogCategory.STORY, body: '' })

export function validateBlogDraft(d: BlogDraft): Partial<Record<keyof BlogDraft, string>> {
  const e: Partial<Record<keyof BlogDraft, string>> = {}
  if (d.title.trim().length < 5) e.title = 'Tiêu đề cần ít nhất 5 ký tự'
  else if (d.title.trim().length > 200) e.title = 'Tiêu đề tối đa 200 ký tự'
  if (d.body.trim().length < 20) e.body = 'Nội dung cần ít nhất 20 ký tự'
  return e
}

export function toBlogRequest(d: BlogDraft, status: BlogStatus, pictureUrl?: string): BlogCreateRequest {
  return {
    title: d.title.trim(),
    category: d.category as BlogCategory,
    content: draftBodyToHtml(d.body),
    status,
    pictureUrl,
  }
}
