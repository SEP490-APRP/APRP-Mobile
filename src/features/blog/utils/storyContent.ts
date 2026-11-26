import type { BlogResponse } from '@/services/blog.service'
import { BlogCategoryLabel } from '@/types'
import { absoluteUrl } from '@/utils/helpers'

/** Đoạn chữ cùng kiểu (đậm / nghiêng / gạch chân / liên kết) trong một khối. */
export interface StoryRun {
  text: string
  bold?: boolean
  italic?: boolean
  underline?: boolean
  href?: string
}

/** Khối nội dung bài viết, vẽ bằng component RN thay cho dangerouslySetInnerHTML của web. */
export type StoryBlock =
  | { type: 'paragraph'; runs: StoryRun[] }
  | { type: 'heading'; level: 1 | 2 | 3; runs: StoryRun[] }
  | { type: 'quote'; runs: StoryRun[] }
  | { type: 'list'; ordered: boolean; items: StoryRun[][] }
  | { type: 'image'; src: string; alt?: string; caption?: string }
  | { type: 'table'; rows: string[][] }

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

/** Nội dung là HTML (bài soạn bằng trình soạn thảo CKEditor / web) hay chữ thường tách đoạn bằng dòng trống. */
export function isHtmlContent(content: string): boolean {
  return /<(p|div|h[1-6]|br|ul|ol|li|img|figure|figcaption|table|tr|td|th|strong|b|em|i|u|a|blockquote)\b/i.test(content)
}

/** Gộp các đoạn liền nhau cùng kiểu và bỏ khoảng trắng thừa ở đầu, cuối khối. */
function tidyRuns(runs: StoryRun[]): StoryRun[] {
  const out: StoryRun[] = []
  for (const r of runs) {
    const last = out[out.length - 1]
    if (
      last &&
      !!last.bold === !!r.bold &&
      !!last.italic === !!r.italic &&
      !!last.underline === !!r.underline &&
      (last.href || '') === (r.href || '')
    ) {
      last.text += r.text
    } else {
      const normalized: StoryRun = {
        text: r.text,
        bold: !!r.bold,
        italic: !!r.italic,
      }
      if (r.underline) normalized.underline = true
      if (r.href) normalized.href = r.href
      out.push(normalized)
    }
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

function safeHref(raw?: string): string | undefined {
  if (!raw) return undefined
  const trimmed = decodeEntities(raw).trim()
  if (/^(https?:\/\/|mailto:|\/)/i.test(trimmed)) return trimmed
  return undefined
}

const BLOCK_TAGS = new Set([
  'p',
  'div',
  'section',
  'article',
  'figure',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'blockquote',
  'li',
])

/**
 * Chuyển nội dung bài viết thành các khối hiển thị (hỗ trợ đầy đủ HTML từ CKEditor 5 của web
 * như heading, list có lồng <p>, figure/figcaption, bảng, blockquote, link, gạch chân).
 */
export function parseStoryContent(content?: string | null): StoryBlock[] {
  if (!content?.trim()) return []
  if (!isHtmlContent(content)) return plainToBlocks(content)

  const blocks: StoryBlock[] = []
  let runs: StoryRun[] = []
  let kind: 'paragraph' | 'heading' = 'paragraph'
  let level: 1 | 2 | 3 = 2
  let quote = 0
  let inLi = false
  let inCaption = false
  let captionText = ''
  let bold = 0
  let italic = 0
  let underline = 0
  let currentHref: string | undefined
  let skip = 0
  let list: { ordered: boolean; items: StoryRun[][] } | null = null
  let tableRows: string[][] | null = null
  let currentRow: string[] | null = null
  let inCell = false
  let cellText = ''

  const makeRun = (text: string): StoryRun => {
    const r: StoryRun = { text, bold: bold > 0, italic: italic > 0 }
    if (underline > 0) r.underline = true
    if (currentHref) r.href = currentHref
    return r
  }

  const flush = () => {
    const tidy = tidyRuns(runs)
    runs = []
    if (!tidy.length) return
    if (inLi && list) list.items.push(tidy)
    else if (kind === 'heading') blocks.push({ type: 'heading', level, runs: tidy })
    else if (quote > 0) blocks.push({ type: 'quote', runs: tidy })
    else blocks.push({ type: 'paragraph', runs: tidy })
  }

  const flushCell = () => {
    if (!inCell || !currentRow) return
    currentRow.push(decodeEntities(cellText).replace(/\s+/g, ' ').trim())
    cellText = ''
    inCell = false
  }

  const tagRe = /<(\/?)([a-z][a-z0-9]*)([^>]*)>|<!--[\s\S]*?-->/gi
  let at = 0
  let m: RegExpExecArray | null
  const pushText = (raw: string) => {
    if (skip) return
    if (inCell) {
      cellText += raw
      return
    }
    if (inCaption) {
      captionText += decodeEntities(raw.replace(/\s+/g, ' '))
      return
    }
    const text = decodeEntities(raw.replace(/\s+/g, ' '))
    if (text) runs.push(makeRun(text))
  }

  while ((m = tagRe.exec(content))) {
    pushText(content.slice(at, m.index))
    at = tagRe.lastIndex
    if (!m[2]) continue // chú thích HTML
    const closing = m[1] === '/'
    const tag = m[2].toLowerCase()
    const attrs = m[3] ?? ''

    if (tag === 'script' || tag === 'style') {
      skip += closing ? -1 : 1
    } else if (tag === 'table') {
      if (!closing) {
        flush()
        tableRows = []
        currentRow = null
        inCell = false
        cellText = ''
      } else if (tableRows) {
        flushCell()
        if (currentRow?.some(Boolean)) tableRows.push(currentRow)
        if (tableRows.length) blocks.push({ type: 'table', rows: tableRows })
        tableRows = null
        currentRow = null
      }
    } else if (tableRows && tag === 'tr') {
      if (!closing) {
        flushCell()
        currentRow = []
      } else {
        flushCell()
        if (currentRow?.some(Boolean)) tableRows.push(currentRow)
        currentRow = null
      }
    } else if (tableRows && (tag === 'td' || tag === 'th')) {
      if (!closing) {
        flushCell()
        if (!currentRow) currentRow = []
        inCell = true
        cellText = ''
      } else {
        flushCell()
      }
    } else if (tag === 'figcaption') {
      if (!closing) {
        flush()
        inCaption = true
        captionText = ''
      } else if (inCaption) {
        const cleanCaption = captionText.replace(/\s+/g, ' ').trim()
        inCaption = false
        captionText = ''
        const lastBlock = blocks[blocks.length - 1]
        if (cleanCaption) {
          if (lastBlock?.type === 'image') lastBlock.caption = cleanCaption
          else blocks.push({ type: 'paragraph', runs: [{ text: cleanCaption, italic: true }] })
        }
      }
    } else if (tag === 'b' || tag === 'strong') {
      bold = Math.max(0, bold + (closing ? -1 : 1))
    } else if (tag === 'i' || tag === 'em') {
      italic = Math.max(0, italic + (closing ? -1 : 1))
    } else if (tag === 'u') {
      underline = Math.max(0, underline + (closing ? -1 : 1))
    } else if (tag === 'a') {
      if (!closing) {
        const hrefAttr = /\shref=["']([^"']+)["']/i.exec(attrs)?.[1]
        currentHref = safeHref(hrefAttr)
      } else {
        currentHref = undefined
      }
    } else if (tag === 'br') {
      if (inCell) cellText += ' '
      else runs.push(makeRun('\n'))
    } else if (tag === 'img' && !closing) {
      const src = /\ssrc=["']([^"']+)["']/i.exec(attrs)?.[1]
      if (src && /^https?:\/\//i.test(src)) {
        flush()
        const alt = /\salt=["']([^"']*)["']/i.exec(attrs)?.[1]
        blocks.push({ type: 'image', src, alt: alt ? decodeEntities(alt) : undefined })
      }
    } else if (tag === 'ul' || tag === 'ol') {
      flush()
      inLi = false
      if (!closing) {
        list = { ordered: tag === 'ol', items: [] }
      } else if (list) {
        if (list.items.length) blocks.push({ type: 'list', ordered: list.ordered, items: list.items })
        list = null
        kind = 'paragraph'
      }
    } else if (BLOCK_TAGS.has(tag)) {
      if (tag === 'li') {
        flush()
        inLi = !closing
        kind = 'paragraph'
      } else if (inLi && (tag === 'p' || tag === 'div')) {
        // CKEditor thường bọc <li><p>...</p></li>: giữ nguyên văn bản bên trong mục list hiện tại.
        if (!closing && runs.length > 0) runs.push(makeRun('\n'))
      } else if (quote > 0 && tag === 'p') {
        if (!closing && runs.length > 0) runs.push(makeRun('\n'))
      } else {
        flush()
        if (tag === 'blockquote') quote = Math.max(0, quote + (closing ? -1 : 1))
        if (closing) kind = 'paragraph'
        else if (tag[0] === 'h') {
          kind = 'heading'
          level = Math.min(3, Number(tag[1])) as 1 | 2 | 3
        } else {
          kind = 'paragraph'
        }
      }
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
