import { useMemo, useState } from 'react'
import { Eye, PenLine, X } from 'lucide-react'
import {
  ARTICLE_CATEGORIES,
  type Article,
  type ArticleCategory,
  type ArticleStatus,
  renderArticleHtml,
  slugify,
} from '@/lib/articles'

/**
 * ArticleEditor — the shared write/edit surface for articles.
 *
 * Used in two places with different button sets:
 *   · host dashboard  → "Save draft" + "Submit for review"
 *   · /admin/articles → "Save draft" + "Publish"
 *
 * Content is markdown with a live Write/Preview toggle rendered through the
 * same .article-prose styles as the public reader — what you see is what
 * readers get.
 */

export interface ArticleDraft {
  title: string
  category: ArticleCategory
  excerpt: string
  coverImageUrl: string
  tags: string
  content: string
}

const inputClass =
  'w-full rounded-xl border border-[#dfe9e2] bg-white px-3.5 py-2.5 text-sm text-[#14201a] placeholder:text-[#9aa8a0] focus:outline-none focus:ring-2 focus:ring-[#00A651]/25 focus:border-[#00A651] transition-colors'
const labelClass =
  'block text-[11px] font-bold uppercase tracking-[0.18em] text-[#7d8a83] mb-1.5'

export default function ArticleEditor({
  initial,
  mode,
  saving,
  onCancel,
  onSave,
}: {
  initial?: Partial<Article> | null
  mode: 'host' | 'admin'
  saving?: boolean
  onCancel: () => void
  onSave: (draft: ArticleDraft, statusIntent: ArticleStatus) => void
}) {
  const [title, setTitle] = useState(initial?.title || '')
  const [category, setCategory] = useState<ArticleCategory>(
    (initial?.category as ArticleCategory) || 'stories'
  )
  const [excerpt, setExcerpt] = useState(initial?.excerpt || '')
  const [coverImageUrl, setCoverImageUrl] = useState(initial?.coverImageUrl || '')
  const [tags, setTags] = useState(initial?.tags || '')
  const [content, setContent] = useState(initial?.content || '')
  const [view, setView] = useState<'write' | 'preview'>('write')

  const previewHtml = useMemo(
    () => (view === 'preview' ? renderArticleHtml(content || '*Nothing written yet.*') : ''),
    [view, content]
  )

  const canSave = title.trim().length >= 4 && content.trim().length >= 50
  const draft: ArticleDraft = {
    title: title.trim(),
    category,
    excerpt: excerpt.trim(),
    coverImageUrl: coverImageUrl.trim(),
    tags,
    content,
  }

  return (
    <div className="rounded-2xl border border-[#dfe9e2] bg-white shadow-sm overflow-hidden">
      <div className="ggj-rainbow h-1 w-full" aria-hidden />
      <div className="p-5 sm:p-7">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#00713a]">
              {initial?.id ? 'Edit article' : 'New article'}
            </p>
            <p className="text-sm text-[#7d8a83] mt-1">
              Markdown in, magazine out — use the preview to see exactly what readers will see.
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-2 rounded-lg text-[#7d8a83] hover:text-[#14201a] hover:bg-[#f0f7f2] transition-colors"
            title="Close editor"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid gap-4">
          {/* Title + slug */}
          <div>
            <label className={labelClass}>Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. What thirty neighbours taught our jam about heat"
              className={inputClass + ' font-display font-bold text-base'}
            />
            {title.trim() && (
              <p className="mt-1 font-mono text-[11px] tabular-nums text-[#9aa8a0]">
                /articles/{slugify(title)}
              </p>
            )}
          </div>

          {/* Category chips + tags */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Category</label>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(ARTICLE_CATEGORIES) as ArticleCategory[]).map((c) => {
                  const cfg = ARTICLE_CATEGORIES[c]
                  const active = category === c
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCategory(c)}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                        active
                          ? 'border-[#00A651] bg-[#e8f6ee] text-[#00713a]'
                          : 'border-[#dfe9e2] bg-white text-[#4c5a52] hover:border-[#b9cfc1]'
                      }`}
                    >
                      <span className="h-2 w-2 rounded-full" style={{ background: cfg.dot }} />
                      {cfg.label}
                    </button>
                  )
                })}
              </div>
            </div>
            <div>
              <label className={labelClass}>Tags (comma-separated)</label>
              <input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="heat, SDG 11, Amsterdam"
                className={inputClass}
              />
            </div>
          </div>

          {/* Excerpt + cover */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Excerpt (preview text)</label>
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                rows={2}
                maxLength={220}
                placeholder="One or two sentences shown on the article card."
                className={inputClass + ' resize-y'}
              />
            </div>
            <div>
              <label className={labelClass}>Cover image URL (optional)</label>
              <input
                value={coverImageUrl}
                onChange={(e) => setCoverImageUrl(e.target.value)}
                placeholder="https://…"
                className={inputClass}
              />
              {coverImageUrl.trim() && (
                <img
                  src={coverImageUrl}
                  alt="Cover preview"
                  className="mt-2 h-20 rounded-lg border border-[#dfe9e2] object-cover"
                  onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
                />
              )}
            </div>
          </div>

          {/* Content: write / preview */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={labelClass + ' mb-0'}>Article body (markdown)</label>
              <div className="inline-flex rounded-full border border-[#dfe9e2] bg-white p-0.5">
                <button
                  type="button"
                  onClick={() => setView('write')}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                    view === 'write' ? 'bg-[#00A651] text-white' : 'text-[#4c5a52]'
                  }`}
                >
                  <PenLine className="w-3 h-3" /> Write
                </button>
                <button
                  type="button"
                  onClick={() => setView('preview')}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                    view === 'preview' ? 'bg-[#00A651] text-white' : 'text-[#4c5a52]'
                  }`}
                >
                  <Eye className="w-3 h-3" /> Preview
                </button>
              </div>
            </div>
            {view === 'write' ? (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={16}
                placeholder={
                  'Start with your opening paragraph (no need to repeat the title).\n\n## A section heading\n\nShort paragraphs, 2–3 sentences. **Bold** for emphasis, > for a quote.'
                }
                className={inputClass + ' font-mono text-[13px] leading-relaxed resize-y'}
              />
            ) : (
              <div className="rounded-xl border border-[#dfe9e2] bg-[#fbfdfc] px-5 py-5 max-h-[520px] overflow-y-auto">
                <div className="article-prose" dangerouslySetInnerHTML={{ __html: previewHtml }} />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#f0f4f1]">
            <p className="text-xs text-[#7d8a83]">
              {mode === 'host'
                ? 'Submitted articles are reviewed by the GGJ team before publishing.'
                : 'Publishing makes it live on /articles immediately.'}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onSave(draft, 'draft')}
                disabled={!canSave || saving}
                className="rounded-full border border-[#dfe9e2] px-5 py-2.5 text-sm font-semibold text-[#14201a] hover:border-[#00A651]/50 hover:text-[#00713a] transition-colors disabled:opacity-50"
              >
                Save draft
              </button>
              <button
                type="button"
                onClick={() => onSave(draft, mode === 'host' ? 'pending' : 'published')}
                disabled={!canSave || saving}
                className="rounded-full bg-[#00A651] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#008a44] transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving…' : mode === 'host' ? 'Submit for review' : 'Publish'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
