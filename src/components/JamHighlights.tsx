import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
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

/**
 * Homepage "Jam highlights" strip — computed, never stored.
 *
 * Surfaces the most recent completed jams that actually have results (a written
 * summary and/or uploaded media), newest first, capped at four. Each links to
 * its event page. If nothing qualifies the section renders NOTHING — an empty
 * highlights band is a worse signal than no band at all.
 */

interface CompletedEvent extends PublishedEvent {
  resultsSummary?: string
  createdAt?: string
  updatedAt?: string
  endDate?: string
}

interface Highlight {
  id: string
  title: string
  city: string
  date?: string
  excerpt: string
  thumb?: string
  dot: string
}

const MAX_CANDIDATES = 8
const MAX_HIGHLIGHTS = 4

function completedNewestFirst(a: CompletedEvent, b: CompletedEvent): number {
  const at = new Date(a.eventDate || a.createdAt || 0).getTime()
  const bt = new Date(b.eventDate || b.createdAt || 0).getTime()
  return bt - at
}

export default function JamHighlights() {
  const { events, loading } = usePublishedEvents({ maxAgeMs: 60_000 })
  const [highlights, setHighlights] = useState<Highlight[] | null>(null)
  const reqRef = useRef(0)

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
            id: e.id,
            title: e.title,
            city: cityFromLocation(e.location, e.title),
            date: e.eventDate || e.createdAt,
            excerpt: summaryExcerpt(e.resultsSummary, 150),
            thumb: highlightThumb(e, media),
            dot: sdgDot(`hl-${e.id}`),
          } as Highlight
        }),
      )

      if (cancelled || reqId !== reqRef.current) return
      setHighlights(probed.filter((h): h is Highlight => h !== null).slice(0, MAX_HIGHLIGHTS))
    })()

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, candidateKey])

  // Nothing to show (still probing, or zero qualified) → render nothing.
  if (!highlights || highlights.length === 0) return null

  return (
    <section className="max-w-6xl mx-auto px-5 sm:px-8 py-16 sm:py-20">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div className="max-w-2xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#00713a]">
            From the network
          </p>
          <h2 className="font-display font-extrabold tracking-tight text-3xl sm:text-4xl mt-3 [text-wrap:balance]">
            Jam highlights
          </h2>
          <p className="text-[#4c5a52] mt-4 leading-relaxed">
            What local teams actually built — outcomes and stories from jams
            that have wrapped, straight from the community.
          </p>
        </div>
        <Link
          to="/community"
          className="text-sm font-semibold text-[#00713a] underline decoration-2 decoration-[#00A651]/30 underline-offset-4 hover:decoration-[#00A651] transition-colors"
        >
          See the community feed →
        </Link>
      </div>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {highlights.map((h, i) => (
            <Link
              key={h.id}
              to={`/events/${h.id}`}
              className="group ggj-rise flex flex-col overflow-hidden rounded-2xl border border-[#dfe9e2] bg-white shadow-soft transition-all hover:-translate-y-1 hover:shadow-card-hover"
              style={{ animationDelay: `${Math.min(i, 6) * 70}ms` }}
            >
              {/* Thumbnail — first media image, else cover image, else a green
                  gradient. The gradient is the container backdrop so a broken
                  image URL never leaves an empty box. */}
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
                {/* Highlights chip with SDG-dot accent */}
                <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#14201a] shadow-sm backdrop-blur">
                  <span className="h-2 w-2 rounded-full" style={{ background: h.dot }} aria-hidden="true" />
                  Highlights
                </span>
              </div>

              <div className="flex min-w-0 flex-1 flex-col p-5">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-[11px] font-bold uppercase tracking-[0.22em] text-[#00713a]">
                    {h.city}
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
                  See the results
                  <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
                </span>
              </div>
            </Link>
          ))}
        </div>
    </section>
  )
}
