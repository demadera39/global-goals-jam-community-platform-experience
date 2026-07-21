/**
 * Articles — shared helpers for the GGJ articles feature.
 *
 * Architecture mirrors Metodic's news/articles: hosts submit from the host
 * dashboard (status 'pending'), admins review/publish on /admin/articles, an
 * AI generator (Claude, edge function `generate-article`) drafts pieces the
 * admin edits before publishing. One deliberate divergence from Metodic:
 * content is MARKDOWN (host-friendly plain editor, and what the model writes
 * natively), rendered through marked + DOMPurify into the .article-prose
 * magazine styles.
 */
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { db, safeDbCall } from './supabase'

export type ArticleStatus = 'draft' | 'pending' | 'published' | 'rejected'
export type ArticleCategory = 'stories' | 'methods' | 'impact' | 'news'
export type ArticleSource = 'host' | 'admin' | 'ai'

export interface Article {
  id: string
  slug: string
  title: string
  excerpt?: string | null
  content: string
  coverImageUrl?: string | null
  category: ArticleCategory
  tags?: string | null
  authorId?: string | null
  authorName?: string | null
  source: ArticleSource
  status: ArticleStatus
  reviewNote?: string | null
  linkedinPost?: string | null
  readMinutes?: number | null
  publishedAt?: string | null
  createdAt?: string
  updatedAt?: string
}

/** Category display config — jam-poster palette (sprint colours). */
export const ARTICLE_CATEGORIES: Record<
  ArticleCategory,
  { label: string; blurb: string; dot: string }
> = {
  stories: { label: 'Jam stories', blurb: 'What happened when a city jammed', dot: '#FD6925' },
  methods: { label: 'Methods & craft', blurb: 'Facilitation, tools and technique', dot: '#26BDE2' },
  impact: { label: 'Impact', blurb: 'What outlived the weekend', dot: '#4C9F38' },
  news: { label: 'News', blurb: 'From the network', dot: '#FCC30B' },
}

/** Auto-slug (Metodic pattern): lowercase, non-alphanumerics → dashes. */
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

/** Reading time (Metodic pattern): 200 wpm over the plain text. */
export function readMinutes(markdown: string): number {
  const words = markdown
    .replace(/[#*_>`\[\]()!-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length
  return Math.max(1, Math.ceil(words / 200))
}

/** Markdown → sanitized HTML for the .article-prose reader. */
export function renderArticleHtml(markdown: string): string {
  const raw = marked.parse(markdown, { async: false, gfm: true, breaks: false }) as string
  return DOMPurify.sanitize(raw, {
    ALLOWED_TAGS: [
      'h2', 'h3', 'h4', 'p', 'a', 'strong', 'em', 'blockquote', 'ul', 'ol', 'li',
      'img', 'hr', 'br', 'code', 'pre', 'figure', 'figcaption', 'table', 'thead',
      'tbody', 'tr', 'th', 'td',
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'target', 'rel'],
  })
}

export function tagList(tags?: string | null): string[] {
  return (tags || '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 6)
}

export function formatArticleDate(iso?: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

/* ── Data access ─────────────────────────────────────────────── */

export async function fetchPublishedArticles(): Promise<Article[]> {
  const rows = await safeDbCall(() =>
    db.articles.list({ where: { status: 'published' }, orderBy: { publishedAt: 'desc' }, limit: 100 })
  )
  return (rows || []) as Article[]
}

export async function fetchArticleBySlug(slug: string): Promise<Article | null> {
  const rows = await safeDbCall(() => db.articles.list({ where: { slug }, limit: 1 }))
  const a = rows?.[0] as Article | undefined
  return a && a.status === 'published' ? a : null
}

export async function fetchMyArticles(authorId: string): Promise<Article[]> {
  const rows = await safeDbCall(() =>
    db.articles.list({ where: { authorId }, orderBy: { createdAt: 'desc' }, limit: 100 })
  )
  return (rows || []) as Article[]
}

export async function fetchAllArticles(): Promise<Article[]> {
  const rows = await safeDbCall(() => db.articles.list({ orderBy: { createdAt: 'desc' }, limit: 300 }))
  return (rows || []) as Article[]
}

/** Ensure a slug is unique by suffixing -2, -3… when taken by another id. */
export async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  let candidate = base || 'article'
  for (let i = 0; i < 8; i++) {
    const rows = await safeDbCall(() => db.articles.list({ where: { slug: candidate }, limit: 1 }))
    const hit = rows?.[0] as Article | undefined
    if (!hit || hit.id === excludeId) return candidate
    candidate = `${base}-${i + 2}`
  }
  return `${base}-${Date.now().toString(36)}`
}
