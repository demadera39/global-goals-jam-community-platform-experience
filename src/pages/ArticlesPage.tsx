import { useEffect, useMemo, useState } from 'react'
import { usePageMeta } from '@/lib/usePageMeta'
import { Link } from 'react-router-dom'
import { ArrowRight, Clock, PenLine } from 'lucide-react'
import Footer from '../components/Footer'
import {
  ARTICLE_CATEGORIES,
  type Article,
  type ArticleCategory,
  fetchPublishedArticles,
  formatArticleDate,
} from '@/lib/articles'

/**
 * /articles — field notes from the network.
 *
 * Jam-poster language: eyebrow + display hero, category chips with live
 * counts, a featured lead article, then a scatter of gently-tilted cards
 * (same vocabulary as the programme/learn-feature cards).
 */

const TILTS = [-1.4, 1.1, -0.9, 1.3, -1.1, 0.8, -1.2, 1.0, -0.7]

function CategoryChip({ dot, label, count, active, onClick }: {
  dot: string; label: string; count?: number; active: boolean; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
        active
          ? 'border-[#00A651] bg-[#e8f6ee] text-[#00713a]'
          : 'border-[#dfe9e2] bg-white text-[#4c5a52] hover:border-[#b9cfc1]'
      }`}
    >
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: dot }} aria-hidden />
      {label}
      {typeof count === 'number' && (
        <span className="font-mono text-[11px] tabular-nums text-[#7d8a83]">{count}</span>
      )}
    </button>
  )
}

function CardMeta({ a }: { a: Article }) {
  const cfg = ARTICLE_CATEGORIES[a.category] || ARTICLE_CATEGORIES.stories
  return (
    <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em]">
      <span className="h-2 w-2 rounded-full" style={{ background: cfg.dot }} aria-hidden />
      <span style={{ color: cfg.dot }}>{cfg.label}</span>
      <span className="text-[#b6c2ba] normal-case tracking-normal font-mono tabular-nums">
        {formatArticleDate(a.publishedAt)}{a.readMinutes ? ` · ${a.readMinutes} min` : ''}
      </span>
    </div>
  )
}

function Cover({ a, className }: { a: Article; className?: string }) {
  return a.coverImageUrl ? (
    <img src={a.coverImageUrl} alt="" className={`article-card__cover ${className || ''}`} loading="lazy" />
  ) : (
    <div className={`article-card__cover--empty ${className || ''}`} aria-hidden>
      <img src="/marker.png" alt="" />
    </div>
  )
}

export default function ArticlesPage() {
  usePageMeta({
    title: 'Articles — Stories, Methods & Impact',
    description: 'Stories, methods, impact and news from the worldwide Global Goals Jam community, written by hosts and the GGJ team.',
    path: '/articles',
  })
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | ArticleCategory>('all')

  useEffect(() => {
    fetchPublishedArticles()
      .then(setArticles)
      .finally(() => setLoading(false))
  }, [])

  const counts = useMemo(() => {
    const c: Record<string, number> = {}
    for (const a of articles) c[a.category] = (c[a.category] || 0) + 1
    return c
  }, [articles])

  const visible = filter === 'all' ? articles : articles.filter((a) => a.category === filter)
  const [featured, ...rest] = visible

  return (
    <div className="min-h-screen bg-[#F6FAF7] text-[#14201a] overflow-x-clip">
      {/* Hero */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 pt-16 sm:pt-20 pb-10">
        <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#00713a]">
          Field notes from the network
        </p>
        <h1 className="font-display font-extrabold tracking-tight text-4xl sm:text-5xl mt-3 [text-wrap:balance]">
          Articles<span className="text-[#00A651]">.</span>
        </h1>
        <p className="text-[#4c5a52] text-lg leading-relaxed mt-4 max-w-2xl">
          Stories from jam floors around the world, the craft of facilitation, and what
          outlives the weekend — written by hosts, for hosts.
        </p>

        {/* Category filter */}
        <div className="mt-7 flex flex-wrap gap-2.5">
          <CategoryChip dot="#00A651" label="All" count={articles.length} active={filter === 'all'} onClick={() => setFilter('all')} />
          {(Object.keys(ARTICLE_CATEGORIES) as ArticleCategory[]).map((c) => (
            <CategoryChip
              key={c}
              dot={ARTICLE_CATEGORIES[c].dot}
              label={ARTICLE_CATEGORIES[c].label}
              count={counts[c] || 0}
              active={filter === c}
              onClick={() => setFilter(c)}
            />
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-5 sm:px-8 pb-20">
        {loading ? (
          <div className="rounded-2xl border border-[#dfe9e2] bg-white p-10 text-center text-[#7d8a83]">
            Loading articles…
          </div>
        ) : visible.length === 0 ? (
          <div className="rounded-2xl border border-[#dfe9e2] bg-white p-10 text-center">
            <p className="font-display font-extrabold text-xl">Nothing here yet.</p>
            <p className="text-[#4c5a52] mt-2 max-w-md mx-auto">
              The first stories are being written. Hosting a jam? Your story belongs here —
              submit it from your host dashboard.
            </p>
          </div>
        ) : (
          <>
            {/* Featured lead */}
            {featured && (
              <Link
                to={`/articles/${featured.slug}`}
                className="article-card grid md:grid-cols-[1.15fr_1fr] mb-10"
                style={{ ['--rot' as string]: '-0.5deg' }}
              >
                <Cover a={featured} className="h-full md:aspect-auto" />
                <div className="p-6 sm:p-8 flex flex-col">
                  <CardMeta a={featured} />
                  <h2 className="font-display font-extrabold tracking-tight text-2xl sm:text-[1.9rem] leading-tight mt-3">
                    {featured.title}
                  </h2>
                  {featured.excerpt && (
                    <p className="text-[#4c5a52] leading-relaxed mt-3 line-clamp-3">{featured.excerpt}</p>
                  )}
                  <div className="mt-auto pt-5 flex items-center justify-between">
                    <span className="text-sm text-[#7d8a83]">
                      {featured.authorName ? `By ${featured.authorName}` : 'Global Goals Jam'}
                    </span>
                    <span className="inline-flex items-center text-sm font-semibold text-[#00713a]">
                      Read <ArrowRight className="w-4 h-4 ml-1.5" />
                    </span>
                  </div>
                </div>
              </Link>
            )}

            {/* The scatter */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {rest.map((a, i) => (
                <Link
                  key={a.id}
                  to={`/articles/${a.slug}`}
                  className="article-card"
                  style={{ ['--rot' as string]: `${TILTS[i % TILTS.length]}deg` }}
                >
                  <Cover a={a} />
                  <div className="p-5 flex flex-col flex-1">
                    <CardMeta a={a} />
                    <h3 className="font-display font-extrabold text-lg leading-snug mt-2.5 line-clamp-2">
                      {a.title}
                    </h3>
                    {a.excerpt && (
                      <p className="text-sm text-[#4c5a52] leading-relaxed mt-2 line-clamp-3">{a.excerpt}</p>
                    )}
                    <div className="mt-auto pt-4 flex items-center justify-between text-xs text-[#7d8a83]">
                      <span className="truncate">{a.authorName || 'Global Goals Jam'}</span>
                      {a.readMinutes ? (
                        <span className="inline-flex items-center gap-1 font-mono tabular-nums shrink-0">
                          <Clock className="w-3 h-3" /> {a.readMinutes} min
                        </span>
                      ) : null}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}

        {/* Write-your-own band */}
        <div
          className="ggj-artefact mt-14 rounded-2xl border border-[#dfe9e2] bg-white p-6 sm:p-8 shadow-sm sm:flex items-center justify-between gap-6"
          style={{ transform: 'rotate(-0.6deg)' }}
        >
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#7d8a83]">
              Hosted a jam?
            </p>
            <h3 className="font-display font-extrabold text-xl mt-1.5">
              Your city's story belongs here.
            </h3>
            <p className="text-sm text-[#4c5a52] mt-1.5 max-w-lg">
              Hosts publish their jam stories, methods and follow-ups straight from the host
              dashboard — reviewed by the GGJ team, read by the whole network.
            </p>
          </div>
          <Link
            to="/host-dashboard"
            className="mt-4 sm:mt-0 inline-flex shrink-0 items-center rounded-full bg-[#00A651] px-6 py-3 text-sm font-semibold text-white hover:bg-[#008a44] transition-colors"
          >
            <PenLine className="w-4 h-4 mr-2" /> Write an article
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
