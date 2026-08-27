import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Camera, ExternalLink } from 'lucide-react'
import { usePageMeta } from '@/lib/usePageMeta'
import VideoArchive from '../components/VideoArchive'
import {
  DECADE_CITIES,
  DECADE_STATS,
  EDITIONS,
  SPRINT_COLORS,
} from '../data/decade'

/**
 * /ten — Ten Years of Jamming.
 *
 * The anniversary retrospective: a counting stat wall, the edition-by-edition
 * timeline in rotating sprint colours, the Jam Cinema video archive, the wall
 * of every city that ever hosted, and the call to add your own memory.
 * Content lives in src/data/decade.ts (sourced from the 2026 content sweep).
 */

/** Counts up from 0 once the element scrolls into view. */
function CountUp({ value, suffix }: { value: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [display, setDisplay] = useState(0)
  const started = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting || started.current) return
        started.current = true
        if (reduced) {
          setDisplay(value)
          return
        }
        const duration = 1400
        const start = performance.now()
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / duration)
          const eased = 1 - Math.pow(1 - t, 3)
          setDisplay(Math.round(eased * value))
          if (t < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      },
      { threshold: 0.4 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [value])

  return (
    <span ref={ref} className="font-mono tabular-nums">
      {display.toLocaleString('en-US')}
      {suffix}
    </span>
  )
}

export default function TenYearsPage() {
  usePageMeta({
    title: 'Ten Years of Jamming',
    description:
      'Ten years of the Global Goals Jam: 100 cities, 7,000+ jammers and 200+ local jams since 2016. The full story, the videos and the memories — and how to join the anniversary edition.',
    path: '/ten',
  })

  return (
    <div className="bg-[#F6FAF7]">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="hero-pattern relative overflow-hidden">
        <img
          src="/marker.png"
          alt=""
          aria-hidden="true"
          className="ggj-logo-spin pointer-events-none absolute -right-24 -top-24 h-[380px] w-[380px] object-contain opacity-80 sm:-right-16 sm:-top-12"
          onError={(e) => {
            const img = e.currentTarget as HTMLImageElement
            if (!img.src.endsWith('/ggj-logo.svg')) img.src = '/ggj-logo.svg'
          }}
        />
        <div className="relative mx-auto max-w-5xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-[#00713a]">
            2016 — 2026
          </p>
          <h1 className="font-display mt-3 max-w-3xl text-4xl font-extrabold tracking-tight text-[#14201a] sm:text-6xl">
            Ten years of jamming
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-[#3d4f45]">
            In September 2016, five hundred people in seventeen cities spent one
            weekend designing for the Global Goals. Ten years later that weekend
            has happened in a hundred cities, from Amsterdam to Mogadishu. This
            is what it looked like.
          </p>
          <div className="ggj-rainbow mt-8 h-1.5 w-40 rounded-full" aria-hidden="true" />
        </div>
      </section>

      {/* ── Stat wall ────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-4 pb-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {DECADE_STATS.map((s, i) => (
            <div
              key={s.label}
              className="ggj-artefact rounded-2xl border border-[#dfe9e2] bg-white p-6 shadow-card"
              style={{ transform: `rotate(${[-0.8, 0.6, -0.5, 0.9][i % 4]}deg)` }}
            >
              <div className="text-4xl font-extrabold text-[#00A651] sm:text-5xl">
                <CountUp value={s.value} suffix={s.suffix} />
              </div>
              <p className="mt-2 text-sm text-[#3d4f45]">{s.label}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-[#7d8a83]">
          Figures from the official edition records and the five-year impact
          report by the World Design Organization.
        </p>
      </section>

      {/* ── Timeline ─────────────────────────────────────────── */}
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-[#00713a]">
          Edition by edition
        </p>
        <h2 className="font-display mt-2 text-3xl font-extrabold tracking-tight text-[#14201a] sm:text-4xl">
          How one weekend grew
        </h2>

        <div className="mt-10 space-y-10">
          {EDITIONS.map((ed, i) => {
            const color = SPRINT_COLORS[i % SPRINT_COLORS.length]
            return (
              <article
                key={ed.year}
                className="relative border-l-4 pl-6 sm:pl-8"
                style={{ borderColor: color }}
              >
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="font-mono text-sm font-semibold tabular-nums text-[#7d8a83]">
                    {ed.year}
                  </span>
                  <h3 className="font-display text-xl font-extrabold text-[#14201a]">
                    {ed.title}
                  </h3>
                  <span
                    className="rounded-full px-2.5 py-0.5 font-mono text-[11px] font-semibold text-[#14201a]"
                    style={{ backgroundColor: `${color}26` }}
                  >
                    {ed.cities}
                    {ed.jammers ? ` · ${ed.jammers}` : ''}
                  </span>
                </div>
                <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-[#3d4f45]">
                  {ed.summary}
                </p>
                {ed.quote && (
                  <blockquote
                    className="ggj-artefact mt-4 max-w-xl rounded-2xl border border-[#dfe9e2] bg-white p-5 shadow-soft"
                    style={{ transform: `rotate(${i % 2 === 0 ? -0.7 : 0.7}deg)` }}
                  >
                    <p className="font-display text-[15px] font-bold leading-snug text-[#14201a]">
                      “{ed.quote.text}”
                    </p>
                    <cite className="mt-2 block text-xs not-italic text-[#7d8a83]">
                      {ed.quote.by}
                      {ed.quote.href && (
                        <a
                          href={ed.quote.href}
                          target="_blank"
                          rel="noreferrer"
                          className="ml-1.5 inline-flex items-center text-[#00713a] hover:underline"
                          aria-label="Open source"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </cite>
                  </blockquote>
                )}
                <a
                  href={ed.sourceHref}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#00713a] hover:underline"
                >
                  Source
                  <ExternalLink className="h-3 w-3" />
                </a>
              </article>
            )
          })}
        </div>
      </section>

      {/* ── Jam Cinema ───────────────────────────────────────── */}
      <section className="border-y border-[#dfe9e2] bg-white/60 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-[#00713a]">
            Jam Cinema
          </p>
          <h2 className="font-display mt-2 text-3xl font-extrabold tracking-tight text-[#14201a] sm:text-4xl">
            Ten years on film
          </h2>
          <p className="mt-3 max-w-2xl text-[#3d4f45]">
            Official trailers and aftermovies since 2016, plus films local
            hosts made of their own jams — from a Snapchat story in Twente to
            a full livestream from Tokyo. Made one we missed? Let us know via{' '}
            <Link to="/memories" className="font-semibold text-[#00713a] underline decoration-[#00A651]/40 underline-offset-2 hover:decoration-[#00A651]">Jam Memories</Link>.
          </p>
          <div className="mt-10">
            <VideoArchive />
          </div>
        </div>
      </section>

      {/* ── City wall ────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-[#00713a]">
          The network
        </p>
        <h2 className="font-display mt-2 text-3xl font-extrabold tracking-tight text-[#14201a] sm:text-4xl">
          The cities that jammed
        </h2>
        <p className="mt-3 max-w-2xl text-[#3d4f45]">
          The {DECADE_CITIES.length} cities we could verify from archived
          edition pages and host reports — the real list is longer. Was your
          city part of it? <Link to="/memories" className="font-semibold text-[#00713a] underline decoration-[#00A651]/40 underline-offset-2 hover:decoration-[#00A651]">Add your memory</Link>.
        </p>
        <div className="mt-8 flex flex-wrap gap-2">
          {DECADE_CITIES.map((city, i) => (
            <span
              key={city}
              className="rounded-full border border-[#dfe9e2] bg-white px-3 py-1 text-[13px] font-medium text-[#3d4f45]"
            >
              <span
                className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full align-middle"
                style={{ backgroundColor: SPRINT_COLORS[i % SPRINT_COLORS.length] }}
                aria-hidden="true"
              />
              {city}
            </span>
          ))}
        </div>
      </section>

      {/* ── Memories CTA + next jam ──────────────────────────── */}
      <section className="border-t border-[#dfe9e2] bg-[#14201a]">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-2">
            <div className="ggj-artefact rounded-2xl border border-white/10 bg-white/5 p-7" style={{ transform: 'rotate(-0.6deg)' }}>
              <Camera className="h-7 w-7 text-[#FCC30B]" />
              <h3 className="font-display mt-4 text-2xl font-extrabold text-white">
                Were you there?
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/70">
                Ten years of jams live on in phones and hard drives all over the
                world. Send us one photo and the story behind it — we’ll add it
                to the archive with your name on it.
              </p>
              <Link
                to="/memories"
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#00A651] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#008a44]"
              >
                Add your memory
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="ggj-artefact rounded-2xl border border-white/10 bg-white/5 p-7" style={{ transform: 'rotate(0.6deg)' }}>
              <div className="ggj-rainbow h-1.5 w-16 rounded-full" aria-hidden="true" />
              <h3 className="font-display mt-4 text-2xl font-extrabold text-white">
                Be part of year ten
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/70">
                The anniversary edition jams in September 2026. Join a jam near
                you, or train as a host and bring the tenth year to your own
                city.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  to="/events"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[#14201a] transition-colors hover:bg-white/90"
                >
                  Find a jam
                </Link>
                <Link
                  to="/course/enroll"
                  className="inline-flex items-center gap-2 rounded-full border border-white/25 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                >
                  Become a host
                </Link>
              </div>
            </div>
          </div>
        </div>
        <div className="ggj-rainbow h-1.5 w-full" aria-hidden="true" />
      </section>
    </div>
  )
}
