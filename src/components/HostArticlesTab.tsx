import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink, PenLine, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { db, safeDbCall } from '@/lib/supabase'
import ArticleEditor, { type ArticleDraft } from './ArticleEditor'
import {
  ARTICLE_CATEGORIES,
  type Article,
  type ArticleStatus,
  fetchMyArticles,
  formatArticleDate,
  readMinutes,
  slugify,
  uniqueSlug,
} from '@/lib/articles'

/**
 * Host dashboard → Articles tab.
 *
 * Hosts write jam stories/methods/impact pieces here. Submissions go into
 * review ('pending'); the GGJ team publishes them to /articles. Editable
 * while draft/pending/rejected; published pieces link out to the live page.
 */

const STATUS_CHIP: Record<ArticleStatus, { label: string; cls: string }> = {
  draft: { label: 'Draft', cls: 'bg-[#f0f4f1] text-[#4c5a52]' },
  pending: { label: 'In review', cls: 'bg-amber-50 text-amber-700' },
  published: { label: 'Published', cls: 'bg-[#e8f6ee] text-[#00713a]' },
  rejected: { label: 'Needs changes', cls: 'bg-rose-50 text-rose-700' },
}

export default function HostArticlesTab({
  user,
}: {
  user: { id: string; displayName?: string | null; email?: string | null } | null
}) {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Article | 'new' | null>(null)
  const [saving, setSaving] = useState(false)

  const reload = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      setArticles(await fetchMyArticles(user.id))
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    reload()
  }, [reload])

  const handleSave = async (draft: ArticleDraft, intent: ArticleStatus) => {
    if (!user?.id) return
    setSaving(true)
    try {
      const base = {
        title: draft.title,
        excerpt: draft.excerpt || null,
        content: draft.content,
        coverImageUrl: draft.coverImageUrl || null,
        coverCaption: draft.coverCaption || null,
        category: draft.category,
        tags: draft.tags || null,
        status: intent,
        readMinutes: readMinutes(draft.content),
        updatedAt: new Date().toISOString(),
      }
      if (editing && editing !== 'new') {
        await safeDbCall(() => db.articles.update(editing.id, base))
      } else {
        const slug = await uniqueSlug(slugify(draft.title))
        await safeDbCall(() =>
          db.articles.create({
            id: `art_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
            slug,
            ...base,
            authorId: user.id,
            authorName: user.displayName || user.email?.split('@')[0] || 'GGJ Host',
            source: 'host',
          })
        )
      }
      toast.success(
        intent === 'pending'
          ? 'Submitted — the GGJ team will review it soon.'
          : 'Draft saved.'
      )
      setEditing(null)
      reload()
    } catch (e) {
      console.error(e)
      toast.error('Could not save the article')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (a: Article) => {
    if (!confirm(`Delete “${a.title}”? This cannot be undone.`)) return
    try {
      await safeDbCall(() => db.articles.delete(a.id))
      toast.success('Article deleted')
      reload()
    } catch {
      toast.error('Could not delete the article')
    }
  }

  if (editing) {
    return (
      <ArticleEditor
        mode="host"
        initial={editing === 'new' ? null : editing}
        saving={saving}
        onCancel={() => setEditing(null)}
        onSave={handleSave}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Intro band */}
      <div className="rounded-2xl border border-[#dfe9e2] bg-white p-6 sm:p-7 shadow-sm sm:flex items-center justify-between gap-6">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#00713a]">
            Your stories, on the network
          </p>
          <h3 className="font-display font-extrabold text-xl mt-1.5">
            Write for the GGJ Articles section.
          </h3>
          <p className="text-sm text-[#4c5a52] mt-1.5 max-w-xl">
            Jam stories, facilitation methods, what happened after the weekend — submit a
            piece and the GGJ team reviews and publishes it on{' '}
            <Link to="/articles" className="font-semibold text-[#00713a] underline decoration-[#00A651]/30 underline-offset-2">
              /articles
            </Link>
            , with your name on it.
          </p>
        </div>
        <button
          onClick={() => setEditing('new')}
          className="mt-4 sm:mt-0 inline-flex shrink-0 items-center rounded-full bg-[#00A651] px-6 py-3 text-sm font-semibold text-white hover:bg-[#008a44] transition-colors"
        >
          <PenLine className="w-4 h-4 mr-2" /> Write an article
        </button>
      </div>

      {/* My articles */}
      {loading ? (
        <div className="rounded-2xl border border-[#dfe9e2] bg-white p-8 text-center text-[#7d8a83]">
          Loading your articles…
        </div>
      ) : articles.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#c9d8ce] bg-white/60 p-8 text-center text-sm text-[#7d8a83]">
          Nothing yet — your first article is one honest jam story away.
        </div>
      ) : (
        <div className="grid gap-3">
          {articles.map((a) => {
            const chip = STATUS_CHIP[a.status] || STATUS_CHIP.draft
            const cfg = ARTICLE_CATEGORIES[a.category] || ARTICLE_CATEGORIES.stories
            return (
              <div
                key={a.id}
                className="rounded-2xl border border-[#dfe9e2] bg-white p-5 sm:flex items-center justify-between gap-4 hover:border-[#b9cfc1] transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${chip.cls}`}>
                      {chip.label}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: cfg.dot }}>
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: cfg.dot }} />
                      {cfg.label}
                    </span>
                    <span className="font-mono text-[11px] tabular-nums text-[#9aa8a0]">
                      {formatArticleDate(a.publishedAt || a.updatedAt || a.createdAt)}
                    </span>
                  </div>
                  <p className="font-display font-bold text-[15px] mt-1.5 truncate">{a.title}</p>
                  {a.status === 'rejected' && a.reviewNote && (
                    <p className="text-xs text-rose-700 bg-rose-50 rounded-lg px-2.5 py-1.5 mt-2">
                      Reviewer: {a.reviewNote}
                    </p>
                  )}
                </div>
                <div className="mt-3 sm:mt-0 flex shrink-0 items-center gap-1.5">
                  {a.status === 'published' ? (
                    <Link
                      to={`/articles/${a.slug}`}
                      className="inline-flex items-center rounded-full border border-[#dfe9e2] px-4 py-2 text-xs font-semibold text-[#00713a] hover:border-[#00A651]/50 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> View live
                    </Link>
                  ) : (
                    <>
                      <button
                        onClick={() => setEditing(a)}
                        className="inline-flex items-center rounded-full border border-[#dfe9e2] px-4 py-2 text-xs font-semibold text-[#14201a] hover:border-[#00A651]/50 hover:text-[#00713a] transition-colors"
                      >
                        <PenLine className="w-3.5 h-3.5 mr-1.5" /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(a)}
                        className="p-2 rounded-full text-[#9aa8a0] hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
