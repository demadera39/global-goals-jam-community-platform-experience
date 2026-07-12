import { toast } from 'sonner'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import RichTextEditor from '../components/RichTextEditor'
import { ArrowLeft, Save, Check, Users, AlertCircle, Loader2, ArrowUpRight, Sparkles } from 'lucide-react'
import { db, auth, safeDbCall } from '../lib/supabase'
import { getUserProfile } from '../lib/userStatus'
import { stripHtml } from '../lib/utils'
import EventMediaSection from '../components/EventMediaSection'
import { invalidateEventsCache } from '../hooks/usePublishedEvents'

interface User {
  id: string
  email: string
  displayName?: string
  role: string
}

interface EventRow {
  id: string
  title: string
  description?: string
  hostId: string
  location: string
  eventDate: string
  resultsSummary?: string
}

export default function EventResultsPage() {
  const { id } = useParams<{ id: string }>()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [justSaved, setJustSaved] = useState(false)
  const [event, setEvent] = useState<EventRow | null>(null)
  const [summary, setSummary] = useState('')
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    // auth.onAuthStateChanged yields the user object ({ id, email, displayName })
    // or null — not a { user, isLoading } wrapper. Populate `user` directly
    // (null-safe) and enrich it with the profile role so the host/admin guard
    // that gates the Save button actually works.
    const unsub = auth.onAuthStateChanged((state) => {
      const base = (state as any) || null
      setLoading(false)
      if (!base?.id) {
        setUser(null)
        return
      }
      setUser(base)
      getUserProfile(base.id)
        .then((p) => { if (p?.role) setUser({ ...base, role: p.role }) })
        .catch(() => {})
    })
    return unsub
  }, [])

  useEffect(() => () => { if (savedTimer.current) clearTimeout(savedTimer.current) }, [])

  const loadEvent = useCallback(async () => {
    if (!id) return
    try {
      const rows = await safeDbCall(() => db.events.list<EventRow>({ where: { id }, limit: 1 }))
      const ev = rows[0]
      setEvent(ev || null)
      setSummary((ev?.resultsSummary as string) || '')
    } catch (e) {
      console.error('Failed to load event', e)
    }
  }, [id])

  useEffect(() => {
    loadEvent().catch(console.error)
  }, [loadEvent])

  const canEdit = !!user && (!!event && (user.id === event.hostId || (user as any).role === 'admin'))
  const summaryIsEmpty = stripHtml(summary).trim().length === 0

  const saveSummary = async () => {
    if (!event) return
    setSaving(true)
    setJustSaved(false)
    try {
      await safeDbCall(() => db.events.update(event.id, { resultsSummary: summary || '' }))
      invalidateEventsCache()
      toast.success('Results summary saved — it will appear on the event page, the community feed and the homepage.')
      setJustSaved(true)
      if (savedTimer.current) clearTimeout(savedTimer.current)
      savedTimer.current = setTimeout(() => setJustSaved(false), 2800)
    } catch (e) {
      console.error('Failed to save summary', e)
      toast.error('Failed to save summary. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading && !event) {
    return (
      <div className="min-h-screen bg-[#F6FAF7] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#00A651]" aria-label="Loading" />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-[#F6FAF7] flex items-center justify-center px-5">
        <div className="max-w-md w-full rounded-2xl border border-[#dfe9e2] bg-white p-10 text-center shadow-soft">
          <AlertCircle className="w-12 h-12 text-[#7d8a83] mx-auto mb-4" />
          <h2 className="text-xl font-display font-extrabold mb-2">Event not found</h2>
          <p className="text-[#4c5a52] mb-6">This event does not exist or is no longer available.</p>
          <Link
            to="/events"
            className="inline-flex items-center rounded-full bg-[#00A651] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#008a44] transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to events
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F6FAF7] text-[#14201a]">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-10 sm:py-12">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-3">
          <Link
            to={`/events/${event.id}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#00713a] hover:text-[#008a44] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to event
          </Link>
          <Link
            to={`/events/${event.id}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#dfe9e2] bg-white px-4 py-2 text-sm font-semibold text-[#14201a] hover:border-[#00A651]/50 hover:text-[#00713a] transition-colors"
          >
            Open event page <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Eyebrow + title */}
        <div className="mt-8 max-w-3xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#00713a]">
            Jam results
          </p>
          <h1 className="mt-3 font-display font-extrabold tracking-tight text-3xl sm:text-4xl leading-[1.05] [text-wrap:balance]">
            {event.title}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[#4c5a52]">
            {event.location && <span>{event.location}</span>}
            {event.eventDate && (
              <>
                <span className="hidden sm:inline text-[#c3d3ca]" aria-hidden="true">·</span>
                <span className="font-mono tabular-nums text-[13px] text-[#7d8a83]">
                  {new Date(event.eventDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                </span>
              </>
            )}
            {!canEdit && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#dfe9e2] bg-white px-2.5 py-1 text-[12px] font-medium text-[#7d8a83]">
                <Users className="w-3.5 h-3.5" /> Only the host can edit
              </span>
            )}
          </div>
        </div>

        {/* Two-panel layout */}
        <div className="mt-8 grid gap-6 lg:grid-cols-2 items-start">
          {/* Summary editor */}
          <section className="rounded-2xl border border-[#dfe9e2] bg-white p-5 sm:p-6 shadow-soft">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#7d8a83]">
                  The write-up
                </p>
                <h2 className="mt-1 font-display text-xl font-extrabold">Results summary</h2>
              </div>
              <span className="hidden sm:block h-1.5 w-8 rounded-full bg-[#00A651]/70" aria-hidden="true" />
            </div>

            {summaryIsEmpty && canEdit && (
              <div className="mt-4 flex items-start gap-3 rounded-xl border border-dashed border-[#00A651]/30 bg-[#F6FAF7] p-4">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#00A651]" aria-hidden="true" />
                <p className="text-sm leading-relaxed text-[#4c5a52]">
                  Share what your teams built — it becomes your jam&rsquo;s public results and appears in the
                  community feed and on the homepage.
                </p>
              </div>
            )}

            <div className="mt-4">
              <RichTextEditor
                value={summary}
                onChange={(value) => setSummary(value)}
                placeholder="Write a concise summary of your jam outcomes, highlights, learnings and links to public resources. Use the toolbar above for headings and lists."
                minHeight="260px"
                variant="ggj"
              />
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-[#7d8a83] max-w-sm leading-relaxed">
                {canEdit
                  ? 'Your summary and the uploads beside it appear on the event page under Results & Media.'
                  : 'Only the event host or an admin can edit this write-up.'}
              </p>
              <button
                type="button"
                onClick={saveSummary}
                disabled={!canEdit || saving}
                className="inline-flex items-center rounded-full bg-[#00A651] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#008a44] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…</>
                ) : justSaved ? (
                  <><Check className="w-4 h-4 mr-2" /> Saved</>
                ) : (
                  <><Save className="w-4 h-4 mr-2" /> Save summary</>
                )}
              </button>
            </div>
          </section>

          {/* Media / uploads */}
          <div className="min-w-0">
            <EventMediaSection event={{ id: event.id, hostId: event.hostId }} user={user} variant="editor" />
          </div>
        </div>
      </div>
    </div>
  )
}
