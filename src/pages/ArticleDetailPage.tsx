import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Clock, Link2, PenLine, Share2 } from 'lucide-react'
import { toast } from 'sonner'
import Footer from '../components/Footer'
import { CoverCaption } from '../components/ArticleEditor'
import {
  ARTICLE_CATEGORIES,
  type Article,
  fetchArticleBySlug,
  formatArticleDate,
  renderArticleHtml,
  tagList,
} from '@/lib/articles'
import { usePageMeta } from '@/lib/usePageMeta'

/**
 * /articles/:slug — the magazine reader.
 * Jam-poster language: category eyebrow, display headline, mono meta row,
 * rainbow hairline, .article-prose body.
 */
export default function ArticleDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    fetchArticleBySlug(slug)
      .then((a) => setArticle(a))
      .finally(() => setLoading(false))
  }, [slug])

  usePageMeta({
    title: article?.title || 'Articles',
    description: article?.excerpt || 'Stories, methods, impact and news from the worldwide Global Goals Jam community.',
    path: slug ? `/articles/${slug}` : '/articles',
    image: article?.coverImageUrl || undefined,
    jsonLd: article
      ? {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: article.title,
          description: article.excerpt || undefined,
          image: article.coverImageUrl || undefined,
          datePublished: article.publishedAt || undefined,
          author: { '@type': 'Person', name: article.authorName || 'Global Goals Jam' },
          publisher: { '@id': 'https://www.globalgoalsjam.org/#org' },
          mainEntityOfPage: `https://www.globalgoalsjam.org/articles/${article.slug}`,
        }
      : null,
  })

  const html = useMemo(() => (article ? renderArticleHtml(article.content) : ''), [article])

  const share = async () => {
    const url = window.location.href
    try {
      if (navigator.share) {
        await navigator.share({ title: article?.title, url })
        return
      }
    } catch {
      /* fall through to clipboard */
    }
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Link copied')
    } catch {
      toast.error('Could not copy the link')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F6FAF7] flex items-center justify-center text-[#7d8a83]">
        Loading article…
      </div>
    )
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-[#F6FAF7] flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <p className="font-display font-extrabold text-2xl text-[#14201a]">Article not found.</p>
          <p className="text-[#4c5a52] mt-2">
            It may have been unpublished, or the link is wrong.
          </p>
          <Link
            to="/articles"
            className="mt-6 inline-flex items-center rounded-full bg-[#00A651] px-6 py-3 text-sm font-semibold text-white hover:bg-[#008a44] transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> All articles
          </Link>
        </div>
      </div>
    )
  }

  const cfg = ARTICLE_CATEGORIES[article.category] || ARTICLE_CATEGORIES.stories
  const tags = tagList(article.tags)

  return (
    <div className="min-h-screen bg-[#F6FAF7] text-[#14201a] overflow-x-clip">
      <article className="max-w-3xl mx-auto px-5 sm:px-8 pt-12 sm:pt-16 pb-20">
        {/* Back + share row */}
        <div className="flex items-center justify-between mb-8">
          <Link
            to="/articles"
            className="inline-flex items-center text-sm font-semibold text-[#00713a] hover:text-[#008a44] transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" /> All articles
          </Link>
          <button
            onClick={share}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#dfe9e2] bg-white px-4 py-2 text-xs font-semibold text-[#4c5a52] hover:border-[#00A651]/50 hover:text-[#00713a] transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" /> Share
          </button>
        </div>

        {/* Head */}
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em]">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: cfg.dot }} aria-hidden />
          <span style={{ color: cfg.dot }}>{cfg.label}</span>
        </div>
        <h1 className="font-display font-extrabold tracking-tight text-3xl sm:text-[2.6rem] leading-[1.08] mt-3 [text-wrap:balance]">
          {article.title}
        </h1>
        {article.excerpt && (
          <p className="text-lg text-[#4c5a52] leading-relaxed mt-4">{article.excerpt}</p>
        )}

        {/* Meta row */}
        <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[#7d8a83]">
          <span className="font-semibold text-[#14201a]">
            {article.authorName || 'Global Goals Jam'}
          </span>
          <span className="font-mono tabular-nums text-xs">{formatArticleDate(article.publishedAt)}</span>
          {article.readMinutes ? (
            <span className="inline-flex items-center gap-1 font-mono tabular-nums text-xs">
              <Clock className="w-3.5 h-3.5" /> {article.readMinutes} min read
            </span>
          ) : null}
        </div>

        <div className="ggj-rainbow h-1 w-full rounded-full mt-6" aria-hidden />

        {/* Cover */}
        {article.coverImageUrl && (
          <figure className="relative mt-8">
            <img
              src={article.coverImageUrl}
              alt=""
              className="w-full rounded-2xl border border-[#dfe9e2] object-cover max-h-[440px]"
            />
            {article.coverCaption && <CoverCaption caption={article.coverCaption} />}
          </figure>
        )}

        {/* Body */}
        <div className="article-prose mt-9" dangerouslySetInnerHTML={{ __html: html }} />

        {/* Tags */}
        {tags.length > 0 && (
          <div className="mt-10 flex flex-wrap gap-2">
            {tags.map((t) => (
              <span
                key={t}
                className="rounded-full border border-[#dfe9e2] bg-white px-3 py-1 text-xs font-semibold text-[#4c5a52]"
              >
                {t}
              </span>
            ))}
          </div>
        )}

        {/* End band */}
        <div
          className="ggj-artefact mt-12 rounded-2xl border border-[#dfe9e2] bg-white p-6 shadow-sm sm:flex items-center justify-between gap-6"
          style={{ transform: 'rotate(-0.5deg)' }}
        >
          <div>
            <h3 className="font-display font-extrabold text-lg">Got a jam story of your own?</h3>
            <p className="text-sm text-[#4c5a52] mt-1">
              Hosts publish theirs from the host dashboard — the network reads along.
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex shrink-0 items-center gap-2">
            <button
              onClick={share}
              className="inline-flex items-center rounded-full border border-[#dfe9e2] px-4 py-2.5 text-sm font-semibold text-[#14201a] hover:border-[#00A651]/50 hover:text-[#00713a] transition-colors"
            >
              <Link2 className="w-4 h-4 mr-2" /> Share this
            </button>
            <Link
              to="/host-dashboard"
              className="inline-flex items-center rounded-full bg-[#00A651] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#008a44] transition-colors"
            >
              <PenLine className="w-4 h-4 mr-2" /> Write yours
            </Link>
          </div>
        </div>
      </article>

      <Footer />
    </div>
  )
}
