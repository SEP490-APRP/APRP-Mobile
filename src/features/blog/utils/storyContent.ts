import type { BlogResponse } from '@/services/blog.service'
import { BlogCategoryLabel } from '@/types'
import { absoluteUrl } from '@/utils/helpers'

/** Đoạn chữ cùng kiểu (đậm / nghiêng) trong một khối. */
export interface StoryRun {
  text: string
  bold?: boolean
  italic?: boolean
}

/** Khối nội dung bài viết, vẽ bằng component RN thay cho dangerouslySetInnerHTML của web. */
export type StoryBlock =
  | { type: 'paragraph'; runs: StoryRun[] }
  | { type: 'heading'; level: 1 | 2 | 3; runs: StoryRun[] }
  | { type: 'quote'; runs: StoryRun[] }
  | { type: 'list'; ordered: boolean; items: StoryRun[][] }
  | { type: 'image'; src: string; alt?: string }

/** Danh mục lọc trên trang "Chuyện nhà nông" (FARMER_STORIES_CATEGORIES bản web). */
export const STORY_CATEGORIES = [
  { id: 'all', label: 'Tất cả bài viết' },
  { id: 'STORY', label: 'Chuyện nhà nông' },
  { id: 'NEW_PRODUCT', label: 'Mùa vụ & Nông sản mới' },
  { id: 'GUIDE', label: 'Cẩm nang & Mẹo vặt' },
  { id: 'PROMOTION', label: 'Khuyến mãi & Ưu đãi' },
  { id: 'SUC_KHOE', label: 'Sức khỏe dinh dưỡng' },
  { id: 'NONG_NGHIEP', label: 'Nông nghiệp sạch' },
] as const

export type StoryCategoryFilter = (typeof STORY_CATEGORIES)[number]['id']

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  ndash: '–',
  mdash: '—',
  hellip: '…',
  laquo: '«',
  raquo: '»',
}

export function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, code: string) => {
    if (code[0] === '#') {
      const n = code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10)
      return Number.isFinite(n) ? String.fromCodePoint(n) : m
    }
    return ENTITIES[code.toLowerCase()] ?? m
  })
}

/** Nội dung là HTML (bài soạn bằng trình soạn thảo) hay chữ thường tách đoạn bằng dòng trống. */
export function isHtmlContent(content: string): boolean {
  return /<(p|div|h[1-6]|br|ul|ol|li|img|strong|b|em|i|blockquote)\b/i.test(content)
}

/** Gộp các đoạn liền nhau cùng kiểu và bỏ khoảng trắng thừa ở đầu, cuối khối. */
function tidyRuns(runs: StoryRun[]): StoryRun[] {
  const out: StoryRun[] = []
  for (const r of runs) {
    const last = out[out.length - 1]
    if (last && !!last.bold === !!r.bold && !!last.italic === !!r.italic) last.text += r.text
    else out.push({ ...r })
  }
  for (const r of out) r.text = r.text.replace(/ *\n */g, '\n')
  if (out.length) {
    out[0].text = out[0].text.replace(/^\s+/, '')
    out[out.length - 1].text = out[out.length - 1].text.replace(/\s+$/, '')
  }
  return out.filter((r) => r.text.length > 0)
}

function plainToBlocks(content: string): StoryBlock[] {
  return content
    .replace(/\r\n/g, '\n')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => ({ type: 'paragraph' as const, runs: [{ text: p }] }))
}

const BLOCK_TAGS = new Set(['p', 'div', 'section', 'article', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'li'])

/**
 * Chuyển nội dung bài viết thành các khối hiển thị. Chỉ hiểu nhóm thẻ trình soạn thảo hay sinh
 * (p, h1–h6, ul/ol/li, blockquote, br, img, b/strong, i/em); thẻ lạ bị bỏ, chữ bên trong vẫn giữ.
 */
export function parseStoryContent(content?: string | null): StoryBlock[] {
  if (!content?.trim()) return []
  if (!isHtmlContent(content)) return plainToBlocks(content)

  const blocks: StoryBlock[] = []
  let runs: StoryRun[] = []
  let kind: 'paragraph' | 'heading' | 'li' = 'paragraph'
  let level: 1 | 2 | 3 = 2
  let quote = 0
  let bold = 0
  let italic = 0
  let skip = 0
  let list: { ordered: boolean; items: StoryRun[][] } | null = null

  const flush = () => {
    const tidy = tidyRuns(runs)
    runs = []
    if (!tidy.length) return
    if (kind === 'li' && list) list.items.push(tidy)
    else if (kind === 'heading') blocks.push({ type: 'heading', level, runs: tidy })
    else if (quote > 0) blocks.push({ type: 'quote', runs: tidy })
    else blocks.push({ type: 'paragraph', runs: tidy })
  }

  const tagRe = /<(\/?)([a-z][a-z0-9]*)([^>]*)>|<!--[\s\S]*?-->/gi
  let at = 0
  let m: RegExpExecArray | null
  const pushText = (raw: string) => {
    if (skip) return
    const text = decodeEntities(raw.replace(/\s+/g, ' '))
    if (text) runs.push({ text, bold: bold > 0, italic: italic > 0 })
  }

  while ((m = tagRe.exec(content))) {
    pushText(content.slice(at, m.index))
    at = tagRe.lastIndex
    if (!m[2]) continue // chú thích HTML
    const closing = m[1] === '/'
    const tag = m[2].toLowerCase()
    const attrs = m[3] ?? ''

    if (tag === 'script' || tag === 'style') skip += closing ? -1 : 1
    else if (tag === 'b' || tag === 'strong') bold = Math.max(0, bold + (closing ? -1 : 1))
    else if (tag === 'i' || tag === 'em') italic = Math.max(0, italic + (closing ? -1 : 1))
    else if (tag === 'br') runs.push({ text: '\n', bold: bold > 0, italic: italic > 0 })
    else if (tag === 'img' && !closing) {
      const src = /\ssrc=["']([^"']+)["']/i.exec(attrs)?.[1]
      if (src && /^https?:\/\//i.test(src)) {
        flush()
        const alt = /\salt=["']([^"']*)["']/i.exec(attrs)?.[1]
        blocks.push({ type: 'image', src, alt: alt ? decodeEntities(alt) : undefined })
      }
    } else if (tag === 'ul' || tag === 'ol') {
      flush()
      if (!closing) {
        list = { ordered: tag === 'ol', items: [] }
      } else if (list) {
        if (list.items.length) blocks.push({ type: 'list', ordered: list.ordered, items: list.items })
        list = null
        kind = 'paragraph'
      }
    } else if (BLOCK_TAGS.has(tag)) {
      flush()
      if (tag === 'blockquote') quote = Math.max(0, quote + (closing ? -1 : 1))
      if (closing) kind = 'paragraph'
      else if (tag === 'li') kind = 'li'
      else if (tag[0] === 'h') {
        kind = 'heading'
        level = Math.min(3, Number(tag[1])) as 1 | 2 | 3
      } else kind = 'paragraph'
    }
  }
  pushText(content.slice(at))
  flush()
  if (list?.items.length) blocks.push({ type: 'list', ordered: list.ordered, items: list.items })
  return blocks
}

/** Chữ thuần của bài (bỏ thẻ), dùng cho đoạn trích và thời gian đọc. */
export function storyPlainText(content?: string | null): string {
  if (!content) return ''
  return decodeEntities(
    content
      .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
      // Thẻ kiểu chữ nằm giữa câu: bỏ hẳn để không chèn khoảng trắng trước dấu câu.
      .replace(/<\/?(b|strong|i|em|u|span|a|mark|small)\b[^>]*>/gi, '')
      .replace(/<[^>]+>/g, ' '),
  )
    .replace(/\s+/g, ' ')
    .trim()
}

export function storyExcerpt(content?: string | null, max = 140): string {
  const text = storyPlainText(content)
  if (text.length <= max) return text
  const cut = text.slice(0, max)
  return `${cut.slice(0, cut.lastIndexOf(' ') > max * 0.6 ? cut.lastIndexOf(' ') : max).trimEnd()}…`
}

/** Phút đọc, khoảng 200 từ mỗi phút, ít nhất 1 phút. */
export function readingMinutes(content?: string | null): number {
  const words = storyPlainText(content).split(' ').filter(Boolean).length
  return Math.max(1, Math.round(words / 200))
}

export const storyId = (b: Pick<BlogResponse, 'blogId' | 'id'>) => b.blogId || b.id || 0
export const storyImage = (b: BlogResponse) => b.pictureUrl || b.imageUrl || undefined
export const storyDate = (b: BlogResponse) => b.createAt || b.createdAt
export const storyAuthor = (b: BlogResponse) => b.shopName || b.authorName || b.adminName || 'CapNong'
export const storyViews = (b: BlogResponse) => Number(b.views ?? b.viewCount ?? 0)

export function storyCategoryLabel(category?: string | null): string {
  return (category && BlogCategoryLabel[category]) || 'Câu chuyện'
}

/** dd/mm/yyyy, không phụ thuộc bộ locale của máy. */
export function formatStoryDate(iso?: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`
}

/** "vừa xong", "5 phút trước"… cho bình luận; quá 7 ngày thì hiện ngày. */
export function timeAgo(iso?: string | null, now = Date.now()): string {
  if (!iso) return ''
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return ''
  const min = Math.floor((now - t) / 60000)
  if (min < 1) return 'vừa xong'
  if (min < 60) return `${min} phút trước`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h} giờ trước`
  const d = Math.floor(h / 24)
  if (d <= 7) return `${d} ngày trước`
  return formatStoryDate(iso)
}

/** Số gọn: 1200 -> 1,2k. */
export function compactCount(n?: number | null): string {
  const v = Number(n ?? 0)
  if (v < 1000) return String(v)
  return `${(v / 1000)
    .toFixed(v < 10000 ? 1 : 0)
    .replace('.0', '')
    .replace('.', ',')}k`
}

/** Link chia sẻ trỏ về trang web, giống nút "Sao chép liên kết" bản web. */
export const storyShareUrl = (id: number) => absoluteUrl(`/cau-chuyen-nong-dan?blogId=${id}`)
