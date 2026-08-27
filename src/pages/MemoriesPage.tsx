import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowRight, Camera, Check, Loader2, MapPin, Upload } from 'lucide-react'
import { usePageMeta } from '@/lib/usePageMeta'
import { storage } from '../lib/supabase'
import { addHighlight, getRandomHighlights, type JamHighlight } from '../lib/jamHighlights'

/**
 * /memories — Jam Memories.
 *
 * Ten years of jams live in people's phones, not on our servers. This page
 * lets anyone who was there upload one photo plus the story behind it. The
 * submission lands unverified in jam_highlights; admins review it on
 * /admin/highlights, and verified memories show up here and across the site.
 */

const MAX_FILE_MB = 8
const YEARS = Array.from({ length: 11 }, (_, i) => 2016 + i)

export default function MemoriesPage() {
  usePageMeta({
    title: 'Jam Memories',
    description:
      'Were you at a Global Goals Jam somewhere in the past ten years? Share one photo and the story behind it, and help build the community archive.',
    path: '/memories',
  })

  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [city, setCity] = useState('')
  const [country, setCountry] = useState('')
  const [year, setYear] = useState('')
  const [story, setStory] = useState('')
  const [consent, setConsent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const [memories, setMemories] = useState<JamHighlight[]>([])

  useEffect(() => {
    getRandomHighlights(24).then(setMemories)
  }, [])

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const canSubmit = useMemo(
    () => !!file && name.trim().length > 1 && story.trim().length > 10 && consent && !submitting,
    [file, name, story, consent, submitting]
  )

  const handleFile = (f: File | null) => {
    if (!f) return
    if (!f.type.startsWith('image/')) {
      toast.error('Please choose an image file (JPG, PNG or WebP).')
      return
    }
    if (f.size > MAX_FILE_MB * 1024 * 1024) {
      toast.error(`That image is over ${MAX_FILE_MB} MB — please pick a smaller one.`)
      return
    }
    setFile(f)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit || !file) return
    setSubmitting(true)
    try {
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
      const path = `memories/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
      const { publicUrl } = await storage.upload(file, path)

      const id = await addHighlight({
        imageUrl: publicUrl,
        city: city.trim() || undefined,
        country: country.trim() || undefined,
        year: year ? Number(year) : undefined,
        description: story.trim(),
        submittedBy: name.trim(),
        isVerified: false,
      })
      if (!id) throw new Error('insert failed')

      setSubmitted(true)
    } catch (err) {
      console.error('Memory submission failed:', err)
      toast.error('Something went wrong while sending your memory. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setFile(null)
    setName('')
    setCity('')
    setCountry('')
    setYear('')
    setStory('')
    setConsent(false)
    setSubmitted(false)
  }

  const inputClass =
    'w-full rounded-xl border border-[#dfe9e2] bg-white px-3.5 py-2.5 text-sm text-[#14201a] placeholder:text-[#9aa8a1] focus:border-[#00A651] focus:outline-none focus:ring-2 focus:ring-[#00A651]/20'

  return (
    <div className="bg-[#F6FAF7]">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="hero-pattern">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-[#00713a]">
            The community archive
          </p>
          <h1 className="font-display mt-3 text-4xl font-extrabold tracking-tight text-[#14201a] sm:text-5xl">
            Jam Memories
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-[#3d4f45]">
            Two hundred jams in a hundred cities, and most of the photos are
            still on the phones of the people who were there. Were you one of
            them? Share one photo and the story behind it — we review every
            submission and publish it with your name.
          </p>
          <div className="ggj-rainbow mt-7 h-1.5 w-40 rounded-full" aria-hidden="true" />
        </div>
      </section>

      {/* ── Form ─────────────────────────────────────────────── */}
      <section className="mx-auto max-w-3xl px-4 pb-16 sm:px-6 lg:px-8">
        {submitted ? (
          <div className="ggj-rise rounded-2xl border border-[#dfe9e2] bg-white p-10 text-center shadow-card">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#00A651]/10">
              <Check className="h-7 w-7 text-[#00A651]" />
            </span>
            <h2 className="font-display mt-5 text-2xl font-extrabold text-[#14201a]">
              Thanks — it’s in the archive queue
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-[#3d4f45]">
              We review every memory before it goes live. Once approved it
              appears here and on the ten-years page, credited to you.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={resetForm}
                className="rounded-full border border-[#dfe9e2] bg-white px-5 py-2.5 text-sm font-semibold text-[#14201a] transition-colors hover:border-[#00A651]/50 hover:text-[#00713a]"
              >
                Add another memory
              </button>
              <Link
                to="/ten"
                className="inline-flex items-center gap-2 rounded-full bg-[#00A651] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#008a44]"
              >
                See ten years of jamming
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-[#dfe9e2] bg-white p-6 shadow-card sm:p-8"
          >
            {/* Photo */}
            <label className="block">
              <span className="text-sm font-semibold text-[#14201a]">Your photo *</span>
              <div className="mt-2">
                {previewUrl ? (
                  <div className="relative overflow-hidden rounded-xl border border-[#dfe9e2]">
                    <img src={previewUrl} alt="Preview of your upload" className="max-h-80 w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setFile(null)}
                      className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[#14201a] shadow-sm hover:bg-white"
                    >
                      Change photo
                    </button>
                  </div>
                ) : (
                  <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#dfe9e2] bg-[#F6FAF7] px-6 py-10 text-center transition-colors hover:border-[#00A651]/50">
                    <Upload className="h-6 w-6 text-[#00A651]" />
                    <span className="text-sm font-semibold text-[#14201a]">
                      Choose a photo from your jam
                    </span>
                    <span className="text-xs text-[#7d8a83]">JPG, PNG or WebP, up to {MAX_FILE_MB} MB</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                    />
                  </label>
                )}
              </div>
            </label>

            {/* Who / where / when */}
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="text-sm font-semibold text-[#14201a]">Your name *</span>
                <input
                  className={`${inputClass} mt-1.5`}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="How should we credit you?"
                  maxLength={80}
                  required
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-[#14201a]">City</span>
                <input
                  className={`${inputClass} mt-1.5`}
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Where did you jam?"
                  maxLength={60}
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-[#14201a]">Country</span>
                <input
                  className={`${inputClass} mt-1.5`}
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="Country"
                  maxLength={60}
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-[#14201a]">Year</span>
                <select
                  className={`${inputClass} mt-1.5`}
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                >
                  <option value="">Which edition?</option>
                  {YEARS.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {/* Story */}
            <label className="mt-4 block">
              <span className="text-sm font-semibold text-[#14201a]">The story behind it *</span>
              <textarea
                className={`${inputClass} mt-1.5 min-h-28 resize-y`}
                value={story}
                onChange={(e) => setStory(e.target.value)}
                placeholder="What is happening in this photo? What did your team work on, and what do you remember most?"
                maxLength={600}
                required
              />
              <span className="mt-1 block text-right font-mono text-[11px] tabular-nums text-[#9aa8a1]">
                {story.length}/600
              </span>
            </label>

            {/* Consent */}
            <label className="mt-2 flex items-start gap-3 rounded-xl bg-[#F6FAF7] p-4">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-[#00A651]"
                required
              />
              <span className="text-xs leading-relaxed text-[#3d4f45]">
                This photo is mine to share (or I have permission from whoever
                took it), and the Global Goals Jam may publish it on
                globalgoalsjam.org and its channels, credited with my name.
              </span>
            </label>

            <button
              type="submit"
              disabled={!canSubmit}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#00A651] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#008a44] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending your memory…
                </>
              ) : (
                <>
                  <Camera className="h-4 w-4" />
                  Send my memory
                </>
              )}
            </button>
          </form>
        )}
      </section>

      {/* ── Published memories ───────────────────────────────── */}
      {memories.length > 0 && (
        <section className="border-t border-[#dfe9e2] bg-white/60 py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <h2 className="font-display text-2xl font-extrabold tracking-tight text-[#14201a] sm:text-3xl">
              From the archive
            </h2>
            <div className="mt-8 columns-2 gap-4 sm:columns-3 lg:columns-4 [&>figure]:mb-4 [&>figure]:break-inside-avoid">
              {memories.map((m, i) => (
                <figure
                  key={m.id}
                  className="ggj-artefact overflow-hidden rounded-2xl border border-[#dfe9e2] bg-white shadow-soft"
                  style={{ transform: `rotate(${[-0.9, 0.7, -0.5, 1.0][i % 4]}deg)` }}
                >
                  <img src={m.imageUrl} alt={m.description || 'Jam memory'} loading="lazy" className="w-full" />
                  {(m.description || m.city || m.submittedBy) && (
                    <figcaption className="p-3">
                      {m.description && (
                        <p className="line-clamp-3 text-xs leading-relaxed text-[#3d4f45]">{m.description}</p>
                      )}
                      <p className="mt-1.5 flex flex-wrap items-center gap-x-2 text-[11px] text-[#7d8a83]">
                        {m.city && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {m.city}
                            {m.year ? ` · ${m.year}` : ''}
                          </span>
                        )}
                        {m.submittedBy && <span>— {m.submittedBy}</span>}
                      </p>
                    </figcaption>
                  )}
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
