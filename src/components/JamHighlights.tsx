import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Clock } from 'lucide-react'
import { db, safeDbCall } from '../lib/supabase'
import { usePublishedEvents } from '../hooks/usePublishedEvents'
import type { PublishedEvent } from '../hooks/usePublishedEvents'
import {
  hasSummary,
  highlightThumb,
  summaryExcerpt,
  type HighlightMedia,
} from '../lib/highlights'
import { cityFromLocation, monoDate, sdgDot } from './community/communityData'
import {
  ARTICLE_CATEGORIES,
  type Article,
  fetchPublishedArticles,
} from '../lib/articles'

/**
 * Homepage "Articles & Highlights" band — computed, never stored.
 *
 * One mixed strip of what the network is producing:
 *   · highlights — recent completed jams with real results (summary/media),
 *     linking to their event pages;
 *   · articles  — the latest published pieces from /articles.
 * Merged newest-first, rendered as the gently-tilted card scatter. If
 * NOTHING qualifies the section renders nothing — an empty band is a worse
 * signal than no band at all.
 */

interface CompletedEvent extends PublishedEvent {
  resultsSummary?: string
  createdAt?: string
  updatedAt?: string
  endDate?: string
}

interface MixedItem {
  kind: 'highlight' | 'article'
  id: string
  to: string
  title: string
  /** Small uppercase label above the title (city, or article author). */
  eyebrow: string
  dot: string
  chip: string
  date?: string
  excerpt?: string
  thumb?: string
  readMinutes?: number | null
}

const MAX_CANDIDATES = 8
const MAX_HIGHLIGHTS = 4
const MAX_ARTICLES = 4
const MAX_TOTAL = 8
const TILTS = [-1.2, 0.9, -0.8, 1.2, -1.0, 0.7, -1.3, 1.0]

function completedNewestFirst(a: CompletedEvent, b: CompletedEvent): number {
  const at = new Date(a.eventDate || a.createdAt || 0).getTime()
  const bt = new Date(b.eventDate || b.createdAt || 0).getTime()
  return bt - at
}

export default function JamHighlights() {
  const { events, loading } = usePublishedEvents({ maxAgeMs: 60_000 })
  const [highlights, setHighlights] = useState<MixedItem[] | null>(null)
  const [articles, setArticles] = useState<MixedItem[] | null>(null)
  const reqRef = useRef(0)

  // Latest published articles — independent of the events probe.
  useEffect(() => {
    let cancelled = false
    fetchPublishedArticles()
      .then((rows: Article[]) => {
        if (cancelled) return
        setArticles(
          rows.slice(0, MAX_ARTICLES).map((a) => {
            const cfg = ARTICLE_CATEGORIES[a.category] || ARTICLE_CATEGORIES.stories
            return {
              kind: 'article' as const,
              id: `art-${a.id}`,
              to: `/articles/${a.slug}`,
              title: a.title,
              eyebrow: a.authorName || 'Global Goals Jam',
              dot: cfg.dot,
              chip: cfg.label,
              date: a.publishedAt || a.createdAt,
              excerpt: a.excerpt || undefined,
              thumb: a.coverImageUrl || undefined,
              readMinutes: a.readMinutes,
            }
          }),
        )
      })
      .catch(() => !cancelled && setArticles([]))
    return () => {
      cancelled = true
    }
  }, [])

  // Latest completed events are the only candidates we probe for media.
  const candidates = useMemo(
    () =>
      (events as CompletedEvent[])
        .filter((e) => e.status === 'completed' && !!e.id)
        .sort(completedNewestFirst)
        .slice(0, MAX_CANDIDATES),
    [events],
  )

  // Fingerprint keeps the probe effect from re-running on unrelated re-renders.
  const candidateKey = candidates.map((e) => e.id).join(',')

  useEffect(() => {
    if (loading) return
    if (!candidates.length) {
      setHighlights([])
      return
    }

    const reqId = ++reqRef.current
    let cancelled = false

    ;(async () => {
      const probed = await Promise.all(
        candidates.map(async (e) => {
          let media: HighlightMedia[] = []
          try {
            media = (await safeDbCall(() =>
              db.media.list<HighlightMedia>({
                where: { eventId: e.id },
                orderBy: { createdAt: 'asc' },
                limit: 10,
              }),
            )) as HighlightMedia[]
          } catch {
            media = []
          }
          const qualifies = hasSummary(e) || media.length > 0
          if (!qualifies) return null
          return {
            kind: 'highlight' as const,
            id: `hl-${e.id}`,
            to: `/events/${e.id}`,
            title: e.title,
            eyebrow: cityFromLocation(e.location, e.title),
            dot: sdgDot(`hl-${e.id}`),
            chip: 'Highlights',
            date: e.eventDate || e.createdAt,
            excerpt: summaryExcerpt(e.resultsSummary, 150) || undefined,
            thumb: highlightThumb(e, media),
          } as MixedItem
        }),
      )

      if (cancelled || reqId !== reqRef.current) return
      setHighlights(probed.filter((h): h is MixedItem => h !== null).slice(0, MAX_HIGHLIGHTS))
    })()

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, candidateKey])

  // Merge newest-first once either source has resolved.
  const items = useMemo(() => {
    if (highlights === null && articles === null) return null
    const merged = [...(articles || []), ...(highlights || [])]
    merged.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())
    return merged.slice(0, MAX_TOTAL)
  }, [highlights, articles])

  // Nothing to show (still loading, or zero qualified) → render nothing.
  if (!items || items.length === 0) return null

  return (
    <section className="max-w-6xl mx-auto px-5 sm:px-8 py-16 sm:py-20">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div className="max-w-2xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#00713a]">
            From the network
          </p>
          <h2 className="font-display font-extrabold tracking-tight text-3xl sm:text-4xl mt-3 [text-wrap:balance]">
            Articles &amp; Highlights
          </h2>
          <p className="text-[#4c5a52] mt-4 leading-relaxed">
            What the network is making — stories and craft from the Articles desk, and the
            outcomes local teams actually built at jams that have wrapped.
          </p>
        </div>
        <div className="flex flex-col items-start sm:items-end gap-1.5">
          <Link
            to="/articles"
            className="text-sm font-semibold text-[#00713a] underline decoration-2 decoration-[#00A651]/30 underline-offset-4 hover:decoration-[#00A651] transition-colors"
          >
            All articles →
          </Link>
          <Link
            to="/community"
            className="text-sm font-semibold text-[#00713a] underline decoration-2 decoration-[#00A651]/30 underline-offset-4 hover:decoration-[#00A651] transition-colors"
          >
            See the community feed →
          </Link>
        </div>
      </div>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((h, i) => (
          <Link
            key={h.id}
            to={h.to}
            className="article-card group ggj-rise"
            style={{
              ['--rot' as string]: `${TILTS[i % TILTS.length]}deg`,
              animationDelay: `${Math.min(i, 6) * 70}ms`,
            }}
          >
            {/* Thumbnail — media/cover image, else a green gradient backdrop
                (highlights) or the SDG-dot paper (articles). */}
            {h.thumb || h.kind === 'highlight' ? (
              <div
                className="relative aspect-[16/10] overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #00A651 0%, #008a44 55%, #00713a 100%)' }}
              >
                {h.thumb && (
                  <img
                    src={h.thumb}
                    alt=""
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    onError={(e) => {
                      ;(e.currentTarget as HTMLImageElement).style.display = 'none'
                    }}
                  />
                )}
                <Chip dot={h.dot} label={h.chip} />
              </div>
            ) : (
              <div className="relative">
                <div className="article-card__cover--empty" aria-hidden>
                  <img src="/marker.png" alt="" />
                </div>
                <Chip dot={h.dot} label={h.chip} />
              </div>
            )}

            <div className="flex min-w-0 flex-1 flex-col p-5">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-[11px] font-bold uppercase tracking-[0.22em] text-[#00713a]">
                  {h.eyebrow}
                </span>
                {h.date && (
                  <span className="shrink-0 font-mono text-[11px] tabular-nums text-[#7d8a83]">
                    {monoDate(h.date)}
                  </span>
                )}
              </div>
              <h3 className="mt-1.5 font-display text-lg font-extrabold leading-snug text-[#14201a] transition-colors group-hover:text-[#00713a] [text-wrap:balance]">
                {h.title}
              </h3>
              {h.excerpt && (
                <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[#4c5a52]">
                  {h.excerpt}
                </p>
              )}
              <span className="mt-4 inline-flex items-center gap-1 text-[13px] font-semibold text-[#00713a]">
                {h.kind === 'article' ? 'Read the article' : 'See the results'}
                {h.kind === 'article' && h.readMinutes ? (
                  <span className="inline-flex items-center gap-1 font-mono text-[11px] tabular-nums text-[#7d8a83] font-normal ml-1">
                    <Clock className="h-3 w-3" /> {h.readMinutes} min
                  </span>
                ) : null}
                <ArrowUpRight
                  className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  aria-hidden="true"
                />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}

function Chip({ dot, label }: { dot: string; label: string }) {
  return (
    <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#14201a] shadow-sm backdrop-blur">
      <span className="h-2 w-2 rounded-full" style={{ background: dot }} aria-hidden="true" />
      {label}
    </span>
  )
}
