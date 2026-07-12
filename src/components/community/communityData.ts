import type { PublishedEvent } from '@/hooks/usePublishedEvents'
import { firstMediaImage, summaryExcerpt, type HighlightMedia } from '@/lib/highlights'

// ---------------------------------------------------------------------------
// Types shared by the community hub
// ---------------------------------------------------------------------------

export interface Space {
  id: string
  name: string
  description?: string
  isHostOnly?: boolean
  sortOrder?: number
  createdAt?: string
}

export interface Thread {
  id: string
  categoryId: string
  title: string
  authorId: string
  isPinned?: boolean
  isLocked?: boolean
  replyCount?: number
  lastReplyAt?: string
  createdAt: string
}

export interface Post {
  id: string
  threadId: string
  authorId: string
  content: string
  isFirstPost?: boolean
  createdAt: string
  updatedAt?: string
}

export interface Author {
  id: string
  displayName?: string
  role?: string
  profileImage?: string
}

export interface MediaRow {
  id: string
  eventId?: string
  title?: string
  fileUrl?: string
  fileType?: string
  createdAt?: string
}

/** Events come back from `select *`, so the extra columns exist at runtime. */
export interface CommunityEvent extends PublishedEvent {
  createdAt?: string
  updatedAt?: string
  endDate?: string
  hostName?: string
  resultsSummary?: string
}

/** A computed card derived from real platform data — never stored. */
export interface ActivityCard {
  key: string
  kind: 'event-published' | 'results' | 'media'
  emoji: string
  headline: string
  sub?: string
  /** Plain-text results excerpt — only set on 'results' cards that have a summary. */
  excerpt?: string
  date: Date
  href: string
  image?: string
  dot: string
}

export type FeedItem =
  | { type: 'thread'; date: Date; thread: Thread }
  | { type: 'activity'; date: Date; card: ActivityCard }

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

/** SDG palette used for the small dot accents. */
const SDG_DOTS = [
  '#E5243B', '#DDA63A', '#4C9F38', '#26BDE2', '#FCC30B', '#A21942',
  '#FD6925', '#DD1367', '#3F7E44', '#0A97D9', '#56C02B', '#00689D',
]

export function sdgDot(seed: string): string {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return SDG_DOTS[h % SDG_DOTS.length]
}

export function toDate(value?: string | Date | null): Date | undefined {
  if (!value) return undefined
  const d = value instanceof Date ? value : new Date(value)
  return isNaN(d.getTime()) ? undefined : d
}

/** Short mono-friendly date, year only when it differs from the current one. */
export function monoDate(value?: string | Date): string {
  const d = toDate(value)
  if (!d) return ''
  const sameYear = d.getFullYear() === new Date().getFullYear()
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  })
}

/** Relative time for thread cards: "just now", "5m", "3h", "4d", else a date. */
export function relTime(value?: string | Date): string {
  const d = toDate(value)
  if (!d) return ''
  const mins = Math.floor((Date.now() - d.getTime()) / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return monoDate(d)
}

const VENUE_WORDS = /university|universiteit|campus|center|centre|school|academy|college|institute|hub|lab\b|hall\b/i

/**
 * Best-effort "city" from a free-form location string.
 * Drops address parts containing digits, skips a leading venue name.
 */
export function cityFromLocation(location?: string, fallback = 'The network'): string {
  if (!location) return fallback
  const parts = location.split(',').map((p) => p.trim()).filter(Boolean)
  if (!parts.length) return fallback
  const noDigits = parts.filter((p) => !/\d/.test(p))
  const pool = noDigits.length ? noDigits : parts
  let pick = pool[0]
  if (VENUE_WORDS.test(pick) && pool.length > 1) pick = pool[1]
  return pick || fallback
}

/** First line of the composer text becomes the thread title. */
export function deriveTitle(content: string, maxLen = 90): string {
  const firstLine = content.trim().split(/\r?\n/, 1)[0]?.trim() ?? ''
  if (!firstLine) return 'Untitled post'
  if (firstLine.length <= maxLen) return firstLine
  return `${firstLine.slice(0, maxLen - 1).trimEnd()}…`
}

// ---------------------------------------------------------------------------
// Computed activity cards — derived at render time from existing tables.
// No cron, no stored bot posts: the feed can never look dead because the
// platform's real activity (events published, jams completed, media uploads)
// is folded into it.
// ---------------------------------------------------------------------------

export function buildActivityCards(events: CommunityEvent[], media: MediaRow[]): ActivityCard[] {
  const now = new Date()
  const cards: ActivityCard[] = []
  const eventById = new Map(events.map((e) => [e.id, e]))

  // First uploaded image per event — used as the results-card thumbnail (with
  // the cover image as fallback) so a completed jam reads richer than a link.
  const imageByEvent = new Map<string, string>()
  for (const m of media) {
    if (!m.eventId || imageByEvent.has(m.eventId)) continue
    const img = firstMediaImage([m as HighlightMedia])
    if (img) imageByEvent.set(m.eventId, img)
  }

  for (const e of events) {
    if (!e.id || e.status === 'draft') continue
    const city = cityFromLocation(e.location, e.title)

    // "{city} is hosting {title}" — anchored to when the event joined the calendar.
    const publishedAt = toDate(e.createdAt) ?? toDate(e.eventDate)
    if (publishedAt) {
      cards.push({
        key: `pub-${e.id}`,
        kind: 'event-published',
        emoji: '🌍',
        headline: `${city} is hosting ${e.title}`,
        sub: e.hostName ? `Organised by ${e.hostName}` : undefined,
        date: publishedAt,
        href: `/events/${e.id}`,
        image: e.coverImage,
        dot: sdgDot(e.id),
      })
    }

    // "Results are in from {title}" — once a jam is completed. Links to the
    // event page, where the results summary and media are publicly visible
    // (/events/:id/results is the host-only results *editor*).
    if (e.status === 'completed') {
      const end = toDate(e.endDate) ?? toDate(e.eventDate)
      const date = end && end <= now ? end : toDate(e.updatedAt) ?? toDate(e.createdAt) ?? end
      if (date) {
        const excerpt = summaryExcerpt(e.resultsSummary, 140)
        cards.push({
          key: `res-${e.id}`,
          kind: 'results',
          emoji: '🏁',
          headline: `Results are in from ${e.title}`,
          sub: `See what the teams in ${city} made`,
          excerpt: excerpt || undefined,
          date,
          href: `/events/${e.id}`,
          image: imageByEvent.get(e.id) || e.coverImage,
          dot: sdgDot(`res-${e.id}`),
        })
      }
    }
  }

  // Recent media uploads, grouped per event per day so a batch upload
  // becomes one card instead of a flood.
  const groups = new Map<string, { count: number; date: Date; eventId?: string; image?: string }>()
  for (const m of media) {
    const d = toDate(m.createdAt)
    if (!d) continue
    const key = `${m.eventId ?? 'network'}:${d.toISOString().slice(0, 10)}`
    const isImage = (m.fileType ?? '').startsWith('image/') && !!m.fileUrl
    const g = groups.get(key)
    if (g) {
      g.count += 1
      if (d > g.date) g.date = d
      if (!g.image && isImage) g.image = m.fileUrl
    } else {
      groups.set(key, { count: 1, date: d, eventId: m.eventId, image: isImage ? m.fileUrl : undefined })
    }
  }
  for (const [key, g] of groups.entries()) {
    const ev = g.eventId ? eventById.get(g.eventId) : undefined
    cards.push({
      key: `media-${key}`,
      kind: 'media',
      emoji: '📸',
      headline: ev ? `New media from ${ev.title}` : 'New media from the jam network',
      sub: g.count > 1 ? `${g.count} uploads` : undefined,
      date: g.date,
      href: ev ? `/events/${ev.id}` : '/events',
      image: g.image,
      dot: sdgDot(key),
    })
  }

  return cards.sort((a, b) => b.date.getTime() - a.date.getTime())
}

// ---------------------------------------------------------------------------
// "Get started" checklist persistence (localStorage only)
// ---------------------------------------------------------------------------

export interface ChecklistState {
  intro: boolean
  follow: boolean
  post: boolean
}

const CHECKLIST_KEY = 'ggj_community_checklist'

export function readChecklist(): ChecklistState {
  try {
    const raw = localStorage.getItem(CHECKLIST_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return { intro: !!parsed.intro, follow: !!parsed.follow, post: !!parsed.post }
    }
  } catch {
    /* ignore */
  }
  return { intro: false, follow: false, post: false }
}

export function writeChecklist(state: ChecklistState): void {
  try {
    localStorage.setItem(CHECKLIST_KEY, JSON.stringify(state))
  } catch {
    /* ignore */
  }
}
