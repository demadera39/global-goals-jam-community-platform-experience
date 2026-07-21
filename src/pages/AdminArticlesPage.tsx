import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft, Check, Copy, ExternalLink, PenLine, Sparkles, Trash2, X,
} from 'lucide-react'
import { toast } from 'sonner'
import { db, safeDbCall } from '@/lib/supabase'
import { callSupabaseFunction } from '@/lib/supabase-functions'
import ArticleEditor, { type ArticleDraft } from '@/components/ArticleEditor'
import {
  ARTICLE_CATEGORIES,
  type Article,
  type ArticleCategory,
  type ArticleStatus,
  fetchAllArticles,
  formatArticleDate,
  readMinutes,
  slugify,
  uniqueSlug,
} from '@/lib/articles'

/**
 * /admin/articles — the editorial desk.
 *
 * Mirrors Metodic's AdminArticles: stats, review queue, full list, and a
 * "Generate with AI" dialog (topic + source URLs + context → Claude Sonnet 5
 * via the generate-article edge function). Generation never publishes —
 * the draft lands in the editor for human review first.
 */

interface GeneratedArticle {
  title: string
  slug: string
  excerpt: string
  content_markdown: string
  tags: string[]
  suggested_category: ArticleCategory
  linkedin_post: string
}

const STATUS_CHIP: Record<ArticleStatus, { label: string; cls: string }> = {
  draft: { label: 'Draft', cls: 'bg-[#f0f4f1] text-[#4c5a52]' },
  pending: { label: 'In review', cls: 'bg-amber-50 text-amber-700' },
  published: { label: 'Published', cls: 'bg-[#e8f6ee] text-[#00713a]' },
  rejected: { label: 'Rejected', cls: 'bg-rose-50 text-rose-700' },
}

const inputClass =
  'w-full rounded-xl border border-[#dfe9e2] bg-white px-3.5 py-2.5 text-sm text-[#14201a] placeholder:text-[#9aa8a0] focus:outline-none focus:ring-2 focus:ring-[#00A651]/25 focus:border-[#00A651] transition-colors'
const labelClass = 'block text-[11px] font-bold uppercase tracking-[0.18em] text-[#7d8a83] mb-1.5'

export default function AdminArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Article | 'new' | null>(null)
  const [saving, setSaving] = useState(false)
  const [showGenerate, setShowGenerate] = useState(false)
  const [pendingLinkedIn, setPendingLinkedIn] = useState<string | null>(null)
  const [aiSeed, setAiSeed] = useState<Partial<Article> | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      setArticles(await fetchAllArticles())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  const stats = useMemo(() => {
    const by = (s: ArticleStatus) => articles.filter((a) => a.status === s).length
    return { total: articles.length, published: by('published'), pending: by('pending'), drafts: by('draft') + by('rejected') }
  }, [articles])

  const pending = articles.filter((a) => a.status === 'pending')

  /* ── Save (create/update from the editor) ─────────────────── */
  const handleSave = async (draft: ArticleDraft, intent: ArticleStatus) => {
    setSaving(true)
    try {
      const existing = editing && editing !== 'new' ? editing : null
      const base: Record<string, unknown> = {
        title: draft.title,
        excerpt: draft.excerpt || null,
        content: draft.content,
        coverImageUrl: draft.coverImageUrl || null,
        category: draft.category,
        tags: draft.tags || null,
        status: intent,
        readMinutes: readMinutes(draft.content),
        updatedAt: new Date().toISOString(),
      }
      if (intent === 'published') {
        base.publishedAt = existing?.publishedAt || new Date().toISOString()
      }
      if (existing) {
        await safeDbCall(() => db.articles.update(existing.id, base))
      } else {
        const slug = await uniqueSlug(slugify(draft.title))
        await safeDbCall(() =>
          db.articles.create({
            id: `art_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
            slug,
            ...base,
            authorName: 'Global Goals Jam',
            source: aiSeed ? 'ai' : 'admin',
            linkedinPost: pendingLinkedIn,
          })
        )
      }
      toast.success(intent === 'published' ? 'Published — it’s live on /articles.' : 'Saved.')
      setEditing(null)
      setAiSeed(null)
      setPendingLinkedIn(null)
      reload()
    } catch (e) {
      console.error(e)
      toast.error('Could not save the article')
    } finally {
      setSaving(false)
    }
  }

  /* ── Review actions ───────────────────────────────────────── */
  const publish = async (a: Article) => {
    await safeDbCall(() =>
      db.articles.update(a.id, {
        status: 'published',
        publishedAt: a.publishedAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    )
    toast.success(`Published “${a.title}”`)
    reload()
  }

  const unpublish = async (a: Article) => {
    await safeDbCall(() => db.articles.update(a.id, { status: 'draft', updatedAt: new Date().toISOString() }))
    toast.success('Unpublished — back to draft')
    reload()
  }

  const reject = async (a: Article) => {
    const note = prompt(`Feedback for the author of “${a.title}” (they see this):`)
    if (note === null) return
    await safeDbCall(() =>
      db.articles.update(a.id, { status: 'rejected', reviewNote: note || null, updatedAt: new Date().toISOString() })
    )
    toast.success('Sent back with feedback')
    reload()
  }

  const remove = async (a: Article) => {
    if (!confirm(`Delete “${a.title}” permanently?`)) return
    await safeDbCall(() => db.articles.delete(a.id))
    toast.success('Deleted')
    reload()
  }

  const copyLinkedIn = async (a: Article) => {
    const url = `https://www.globalgoalsjam.org/articles/${a.slug}`
    await navigator.clipboard.writeText((a.linkedinPost || '').replace(/\{\{article_url\}\}/g, url))
    toast.success('LinkedIn post copied')
  }

  /* ── Render ───────────────────────────────────────────────── */
  if (editing) {
    return (
      <div className="min-h-screen bg-[#F6FAF7] text-[#14201a]">
        <div className="max-w-4xl mx-auto px-5 sm:px-8 py-10">
          <ArticleEditor
            mode="admin"
            initial={editing === 'new' ? aiSeed : editing}
            saving={saving}
            onCancel={() => {
              setEditing(null)
              setAiSeed(null)
              setPendingLinkedIn(null)
            }}
            onSave={handleSave}
          />
          {pendingLinkedIn && (
            <div className="mt-5 rounded-2xl border border-[#dfe9e2] bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#00713a]">
                  Bonus: drafted LinkedIn post
                </p>
                <button
                  onClick={async () => {
                    await navigator.clipboard.writeText(pendingLinkedIn)
                    toast.success('Copied')
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#dfe9e2] px-3 py-1.5 text-xs font-semibold text-[#4c5a52] hover:border-[#00A651]/50 hover:text-[#00713a]"
                >
                  <Copy className="w-3 h-3" /> Copy
                </button>
              </div>
              <p className="text-sm text-[#33413a] whitespace-pre-wrap leading-relaxed">{pendingLinkedIn}</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F6FAF7] text-[#14201a]">
      <div className="max-w-5xl mx-auto px-5 sm:px-8 py-10">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <Link
              to="/admin-dashboard"
              className="inline-flex items-center text-sm font-semibold text-[#00713a] hover:text-[#008a44] transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" /> Admin
            </Link>
            <h1 className="font-display font-extrabold tracking-tight text-3xl sm:text-4xl mt-2">
              Articles<span className="text-[#00A651]">.</span>
            </h1>
            <p className="text-[#4c5a52] mt-1.5">
              Review host submissions, write, and generate with AI — published pieces appear on{' '}
              <Link to="/articles" className="font-semibold text-[#00713a] underline decoration-[#00A651]/30 underline-offset-2">
                /articles
              </Link>.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowGenerate(true)}
              className="inline-flex items-center rounded-full border border-[#00A651] bg-[#e8f6ee] px-5 py-2.5 text-sm font-semibold text-[#00713a] hover:bg-[#d9f0e3] transition-colors"
            >
              <Sparkles className="w-4 h-4 mr-2" /> Generate with AI
            </button>
            <button
              onClick={() => setEditing('new')}
              className="inline-flex items-center rounded-full bg-[#00A651] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#008a44] transition-colors"
            >
              <PenLine className="w-4 h-4 mr-2" /> Write
            </button>
          </div>
        </div>

        {/* Stats band */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[#dfe9e2] rounded-2xl overflow-hidden border border-[#dfe9e2] mb-8">
          {[
            { label: 'Total', value: stats.total, dot: '#00A651' },
            { label: 'Published', value: stats.published, dot: '#4C9F38' },
            { label: 'In review', value: stats.pending, dot: '#FCC30B' },
            { label: 'Drafts', value: stats.drafts, dot: '#26BDE2' },
          ].map((s) => (
            <div key={s.label} className="bg-white p-5">
              <span className="block h-2 w-2 rounded-full" style={{ background: s.dot }} aria-hidden />
              <p className="font-display font-extrabold text-2xl mt-2 tabular-nums">{s.value}</p>
              <p className="text-xs text-[#7d8a83] mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Review queue */}
        {pending.length > 0 && (
          <div className="mb-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#b98600] mb-3">
              Waiting for review · {pending.length}
            </p>
            <div className="grid gap-3">
              {pending.map((a) => (
                <div key={a.id} className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5">
                  <div className="sm:flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-display font-extrabold text-lg leading-snug">{a.title}</p>
                      <p className="text-xs text-[#7d8a83] mt-1">
                        By {a.authorName || 'unknown'} · {ARTICLE_CATEGORIES[a.category]?.label} ·{' '}
                        {formatArticleDate(a.updatedAt || a.createdAt)} · {a.readMinutes || '?'} min
                      </p>
                      {a.excerpt && <p className="text-sm text-[#4c5a52] mt-2 line-clamp-2">{a.excerpt}</p>}
                    </div>
                    <div className="mt-3 sm:mt-0 flex shrink-0 items-center gap-1.5">
                      <button
                        onClick={() => setEditing(a)}
                        className="inline-flex items-center rounded-full border border-[#dfe9e2] bg-white px-4 py-2 text-xs font-semibold text-[#14201a] hover:border-[#00A651]/50 transition-colors"
                      >
                        <PenLine className="w-3.5 h-3.5 mr-1.5" /> Read & edit
                      </button>
                      <button
                        onClick={() => publish(a)}
                        className="inline-flex items-center rounded-full bg-[#00A651] px-4 py-2 text-xs font-semibold text-white hover:bg-[#008a44] transition-colors"
                      >
                        <Check className="w-3.5 h-3.5 mr-1.5" /> Publish
                      </button>
                      <button
                        onClick={() => reject(a)}
                        className="inline-flex items-center rounded-full border border-rose-200 bg-white px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <X className="w-3.5 h-3.5 mr-1.5" /> Send back
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All articles */}
        <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#7d8a83] mb-3">
          All articles
        </p>
        {loading ? (
          <div className="rounded-2xl border border-[#dfe9e2] bg-white p-8 text-center text-[#7d8a83]">Loading…</div>
        ) : articles.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#c9d8ce] bg-white/60 p-8 text-center text-sm text-[#7d8a83]">
            No articles yet — write one or generate with AI.
          </div>
        ) : (
          <div className="grid gap-2.5">
            {articles.map((a) => {
              const chip = STATUS_CHIP[a.status] || STATUS_CHIP.draft
              const cfg = ARTICLE_CATEGORIES[a.category] || ARTICLE_CATEGORIES.stories
              return (
                <div
                  key={a.id}
                  className="rounded-2xl border border-[#dfe9e2] bg-white px-5 py-4 sm:flex items-center justify-between gap-4 hover:border-[#b9cfc1] transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${chip.cls}`}>{chip.label}</span>
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: cfg.dot }}>
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: cfg.dot }} />
                        {cfg.label}
                      </span>
                      {a.source === 'ai' && (
                        <span className="rounded-full bg-[#f0eefc] px-2 py-0.5 text-[10px] font-bold text-[#6d5bd0]">AI draft</span>
                      )}
                      <span className="font-mono text-[11px] tabular-nums text-[#9aa8a0]">
                        {formatArticleDate(a.publishedAt || a.updatedAt || a.createdAt)}
                      </span>
                    </div>
                    <p className="font-display font-bold text-[15px] mt-1 truncate">{a.title}</p>
                    <p className="text-xs text-[#7d8a83] mt-0.5">By {a.authorName || '—'}</p>
                  </div>
                  <div className="mt-3 sm:mt-0 flex shrink-0 items-center gap-1.5">
                    {a.linkedinPost && (
                      <button
                        onClick={() => copyLinkedIn(a)}
                        className="p-2 rounded-full text-[#9aa8a0] hover:text-[#0a66c2] hover:bg-[#eaf3fb] transition-colors"
                        title="Copy the drafted LinkedIn post"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {a.status === 'published' && (
                      <Link
                        to={`/articles/${a.slug}`}
                        className="p-2 rounded-full text-[#9aa8a0] hover:text-[#00713a] hover:bg-[#e8f6ee] transition-colors"
                        title="View live"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    )}
                    <button
                      onClick={() => setEditing(a)}
                      className="p-2 rounded-full text-[#9aa8a0] hover:text-[#00713a] hover:bg-[#e8f6ee] transition-colors"
                      title="Edit"
                    >
                      <PenLine className="w-3.5 h-3.5" />
                    </button>
                    {a.status === 'published' ? (
                      <button
                        onClick={() => unpublish(a)}
                        className="inline-flex items-center rounded-full border border-[#dfe9e2] px-3.5 py-1.5 text-xs font-semibold text-[#4c5a52] hover:border-[#b9cfc1] transition-colors"
                      >
                        Unpublish
                      </button>
                    ) : (
                      <button
                        onClick={() => publish(a)}
                        className="inline-flex items-center rounded-full bg-[#00A651] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#008a44] transition-colors"
                      >
                        Publish
                      </button>
                    )}
                    <button
                      onClick={() => remove(a)}
                      className="p-2 rounded-full text-[#9aa8a0] hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showGenerate && (
        <GenerateDialog
          onClose={() => setShowGenerate(false)}
          onGenerated={(g) => {
            setShowGenerate(false)
            setPendingLinkedIn(g.linkedin_post || null)
            setAiSeed({
              title: g.title,
              excerpt: g.excerpt,
              content: g.content_markdown,
              category: g.suggested_category,
              tags: (g.tags || []).join(', '),
            })
            setEditing('new')
          }}
        />
      )}
    </div>
  )
}

/* ── The Metodic-style generate dialog ──────────────────────── */

function GenerateDialog({
  onClose,
  onGenerated,
}: {
  onClose: () => void
  onGenerated: (g: GeneratedArticle) => void
}) {
  const [topic, setTopic] = useState('')
  const [urls, setUrls] = useState('')
  const [category, setCategory] = useState<ArticleCategory>('stories')
  const [extraContext, setExtraContext] = useState('')
  const [generating, setGenerating] = useState(false)

  const generate = async () => {
    const urlList = urls.split('\n').map((u) => u.trim()).filter((u) => /^https?:\/\//i.test(u))
    if (!topic.trim() && urlList.length === 0) {
      toast.error('Give it a topic, source links, or both.')
      return
    }
    setGenerating(true)
    try {
      const res = await callSupabaseFunction<{ article?: GeneratedArticle; error?: string }>(
        'generate-article',
        { topic: topic.trim(), urls: urlList, category, extraContext: extraContext.trim() }
      )
      if (!res.article) throw new Error(res.error || 'Generation failed')
      toast.success('Draft ready — review before publishing.')
      onGenerated(res.article)
    } catch (e) {
      console.error(e)
      toast.error(e instanceof Error ? e.message : 'Generation failed — try again.')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#14201a]/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl bg-white shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ggj-rainbow h-1 w-full" aria-hidden />
        <div className="p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#00713a]">
                Generate with AI
              </p>
              <h2 className="font-display font-extrabold text-xl mt-1">Draft an article.</h2>
              <p className="text-xs text-[#7d8a83] mt-1">
                Claude (Sonnet 5) writes in the GGJ voice — you review and publish. A LinkedIn
                post comes with it.
              </p>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg text-[#7d8a83] hover:text-[#14201a] hover:bg-[#f0f7f2]">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid gap-4">
            <div>
              <label className={labelClass}>Topic / brief</label>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                rows={3}
                placeholder="e.g. Why the 90 days after a jam matter more than the weekend — with practical follow-up rhythms for hosts."
                className={inputClass + ' resize-y'}
              />
            </div>
            <div>
              <label className={labelClass}>Source URLs (optional, one per line)</label>
              <textarea
                value={urls}
                onChange={(e) => setUrls(e.target.value)}
                rows={2}
                placeholder={'https://…\nhttps://…'}
                className={inputClass + ' font-mono text-xs resize-y'}
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ArticleCategory)}
                  className={inputClass}
                >
                  {(Object.keys(ARTICLE_CATEGORIES) as ArticleCategory[]).map((c) => (
                    <option key={c} value={c}>
                      {ARTICLE_CATEGORIES[c].label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Editor notes (optional)</label>
                <input
                  value={extraContext}
                  onChange={(e) => setExtraContext(e.target.value)}
                  placeholder="Angle, audience, things to avoid…"
                  className={inputClass}
                />
              </div>
            </div>
            <button
              onClick={generate}
              disabled={generating}
              className="inline-flex items-center justify-center rounded-full bg-[#00A651] px-6 py-3 text-sm font-semibold text-white hover:bg-[#008a44] transition-colors disabled:opacity-60"
            >
              <Sparkles className={`w-4 h-4 mr-2 ${generating ? 'animate-pulse' : ''}`} />
              {generating ? 'Writing… ~30s' : 'Generate draft'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
