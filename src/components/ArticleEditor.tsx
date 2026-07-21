import { useMemo, useRef, useState } from 'react'
import { Camera, Eye, ImagePlus, PenLine, Trash2, Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import { storage } from '@/lib/supabase'
import {
  ARTICLE_CATEGORIES,
  type Article,
  type ArticleCategory,
  type ArticleStatus,
  renderArticleHtml,
  slugify,
} from '@/lib/articles'

/** Cover guidance: cards crop to 16:9 and the reader shows up to ~1400px
 *  wide — 1600×900 is the sweet spot. */
const COVER_HINT = '16:9 landscape · ideally 1600 × 900 px (min 1200 wide) · JPG or PNG, max 5 MB'
const MAX_COVER_BYTES = 5 * 1024 * 1024

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
  coverCaption: string
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
  const [coverCaption, setCoverCaption] = useState(initial?.coverCaption || '')
  const [tags, setTags] = useState(initial?.tags || '')
  const [content, setContent] = useState(initial?.content || '')
  const [view, setView] = useState<'write' | 'preview'>('write')
  const [uploading, setUploading] = useState(false)
  const [coverDims, setCoverDims] = useState<{ w: number; h: number } | null>(null)
  const fileRef = useRef<HTMLInputElement | null>(null)

  const uploadCover = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please pick an image file (JPG or PNG).')
      return
    }
    if (file.size > MAX_COVER_BYTES) {
      toast.error('That image is over 5 MB — resize it and try again.')
      return
    }
    setUploading(true)
    try {
      const ext = file.name.split('.').pop() || 'jpg'
      const { publicUrl } = await storage.upload(
        file,
        `articles/covers/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`,
        { upsert: true }
      )
      setCoverDims(null)
      setCoverImageUrl(publicUrl)
      toast.success('Cover uploaded')
    } catch (e) {
      console.error(e)
      toast.error('Upload failed — try again or paste an image URL.')
    } finally {
      setUploading(false)
    }
  }

  /** Soft quality check once the preview loads — never blocks saving. */
  const coverWarning = useMemo(() => {
    if (!coverDims) return null
    const { w, h } = coverDims
    if (w < 1200) return `This image is ${w}×${h}px — under 1200px wide it may look soft on the article page.`
    const ratio = w / h
    if (Math.abs(ratio - 16 / 9) / (16 / 9) > 0.25)
      return `This image is ${w}×${h}px (${ratio.toFixed(2)}:1) — cards crop covers to 16:9, so the edges may be cut off.`
    return null
  }, [coverDims])

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
    coverCaption: coverCaption.trim(),
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
              <label className={labelClass}>Cover image (optional)</label>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) uploadCover(f)
                  e.target.value = ''
                }}
              />
              {coverImageUrl.trim() ? (
                <div className="rounded-xl border border-[#dfe9e2] overflow-hidden">
                  <div className="relative aspect-[16/9] bg-[#f0f7f2]">
                    <img
                      src={coverImageUrl}
                      alt="Cover preview"
                      className="absolute inset-0 h-full w-full object-cover"
                      onLoad={(e) => {
                        const img = e.currentTarget
                        setCoverDims({ w: img.naturalWidth, h: img.naturalHeight })
                      }}
                      onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
                    />
                    {coverCaption.trim() && <CoverCaption caption={coverCaption} />}
                  </div>
                  <div className="flex items-center justify-between gap-2 px-3 py-2 bg-white">
                    <span className="font-mono text-[11px] tabular-nums text-[#7d8a83] truncate">
                      {coverDims ? `${coverDims.w} × ${coverDims.h} px` : '…'}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        disabled={uploading}
                        className="inline-flex items-center gap-1 rounded-full border border-[#dfe9e2] px-2.5 py-1 text-[11px] font-semibold text-[#4c5a52] hover:border-[#00A651]/50 hover:text-[#00713a] transition-colors disabled:opacity-50"
                      >
                        <Upload className="w-3 h-3" /> Replace
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCoverImageUrl('')
                          setCoverDims(null)
                        }}
                        className="p-1.5 rounded-full text-[#9aa8a0] hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Remove cover"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="w-full rounded-xl border-2 border-dashed border-[#c9d8ce] bg-[#fbfdfc] px-4 py-6 text-center hover:border-[#00A651]/50 transition-colors disabled:opacity-60"
                >
                  <ImagePlus className="w-5 h-5 mx-auto text-[#7d8a83]" />
                  <span className="block text-sm font-semibold text-[#14201a] mt-1.5">
                    {uploading ? 'Uploading…' : 'Upload a cover'}
                  </span>
                  <span className="block text-[11px] text-[#7d8a83] mt-0.5">{COVER_HINT}</span>
                </button>
              )}
              {coverWarning && (
                <p className="mt-1.5 text-[11px] leading-snug text-amber-700 bg-amber-50 rounded-lg px-2.5 py-1.5">
                  {coverWarning}
                </p>
              )}
              <div className="mt-1.5 flex items-center gap-2">
                <input
                  value={coverImageUrl}
                  onChange={(e) => {
                    setCoverDims(null)
                    setCoverImageUrl(e.target.value)
                  }}
                  placeholder="…or paste an image URL"
                  className={inputClass + ' !py-1.5 text-xs font-mono'}
                />
              </div>
              {coverImageUrl.trim() && (
                <div className="mt-2.5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Camera className="w-3 h-3 text-[#00A651]" />
                    <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#7d8a83]">
                      Caption (optional)
                    </span>
                  </div>
                  <input
                    value={coverCaption}
                    onChange={(e) => setCoverCaption(e.target.value)}
                    maxLength={90}
                    placeholder="e.g. Photo by Nadia · Amsterdam Noord, Sept 2026"
                    className={inputClass + ' !py-2 text-xs'}
                  />
                  <p className="mt-1 text-[11px] text-[#9aa8a0]">
                    Shown as a tilted chip on the image — a credit or where it was taken.
                  </p>
                </div>
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

/**
 * The tilted caption chip that sits on a cover image — shared by the editor
 * preview and the public reader so they look identical. Alternate the tilt by
 * passing `tilt`.
 */
export function CoverCaption({ caption, tilt = -2 }: { caption: string; tilt?: number }) {
  return (
    <div
      className="absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-[80%]"
      style={{ transform: `rotate(${tilt}deg)` }}
    >
      <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#dfe9e2] bg-white/95 px-2.5 py-1.5 text-[11px] sm:text-xs font-semibold leading-snug text-[#14201a] shadow-[0_6px_18px_-8px_rgba(15,32,24,0.45)] backdrop-blur">
        <Camera className="w-3 h-3 shrink-0 text-[#00A651]" aria-hidden />
        <span className="truncate">{caption}</span>
      </span>
    </div>
  )
}
