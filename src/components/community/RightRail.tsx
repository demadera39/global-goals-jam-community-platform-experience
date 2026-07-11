import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Check, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ChecklistState, CommunityEvent } from './communityData'
import { cityFromLocation, monoDate, toDate } from './communityData'

interface RightRailProps {
  events: CommunityEvent[]
  hostsCount: number | null
  checklist: ChecklistState
  onChecklistAction: (item: keyof ChecklistState) => void
}

const CHECKLIST_ITEMS: Array<{ id: keyof ChecklistState; label: string; hint: string }> = [
  { id: 'intro', label: 'Introduce yourself', hint: 'Say hello in Introductions' },
  { id: 'follow', label: 'Follow a jam', hint: 'Find one near you on the events page' },
  { id: 'post', label: 'Share your first post', hint: 'Ask, show or tell the network' },
]

export default function RightRail({ events, hostsCount, checklist, onChecklistAction }: RightRailProps) {
  const upcoming = useMemo(() => {
    const now = new Date()
    return events
      .filter((e) => {
        const d = toDate(e.eventDate)
        return !!d && d >= now && e.status !== 'draft'
      })
      .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime())
      .slice(0, 4)
  }, [events])

  const stats = useMemo(() => {
    const countries = new Set<string>()
    let jams = 0
    for (const e of events) {
      if (e.status === 'draft') continue
      jams += 1
      if (e.location) {
        const parts = e.location.split(',').map((p) => p.trim()).filter(Boolean)
        if (parts.length >= 2) countries.add(parts[parts.length - 1])
      }
    }
    return { jams, countries: countries.size }
  }, [events])

  return (
    <div className="space-y-4">
      {/* Upcoming jams */}
      <section className="rounded-2xl border border-[#dfe9e2] bg-white p-4">
        <div className="flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5 text-[#00A651]" aria-hidden="true" />
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#00713a]">
            Upcoming jams
          </p>
        </div>
        {upcoming.length === 0 ? (
          <p className="mt-3 text-[13px] leading-relaxed text-[#7d8a83]">
            Nothing on the calendar right now — the next season of jams will land here.
          </p>
        ) : (
          <ul className="mt-3 space-y-1">
            {upcoming.map((e) => (
              <li key={e.id}>
                <Link
                  to={`/events/${e.id}`}
                  className="group flex items-baseline gap-3 rounded-xl px-2 py-1.5 -mx-2 transition-colors hover:bg-[#F6FAF7]"
                >
                  <span className="w-14 shrink-0 font-mono text-[12px] tabular-nums text-[#00713a]">
                    {monoDate(e.eventDate)}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-semibold text-[#14201a] group-hover:text-[#00713a]">
                      {e.title}
                    </span>
                    <span className="block truncate text-[12px] text-[#7d8a83]">
                      {cityFromLocation(e.location, '')}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Link
          to="/events"
          className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-[#00713a] underline decoration-2 decoration-[#00A651]/30 underline-offset-4 transition-colors hover:decoration-[#00A651]"
        >
          All events <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </section>

      {/* Get started checklist */}
      <section className="rounded-2xl border border-[#dfe9e2] bg-white p-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#00713a]">Get started</p>
        <ul className="mt-3 space-y-1">
          {CHECKLIST_ITEMS.map((item) => {
            const done = checklist[item.id]
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onChecklistAction(item.id)}
                  className="group flex w-full items-start gap-2.5 rounded-xl px-2 py-1.5 -mx-2 text-left transition-colors hover:bg-[#F6FAF7]"
                >
                  <span
                    className={cn(
                      'mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border transition-colors',
                      done ? 'border-transparent bg-[#00A651]' : 'border-[#dfe9e2] bg-white group-hover:border-[#00A651]/50'
                    )}
                    aria-hidden="true"
                  >
                    {done && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                  </span>
                  <span className="min-w-0">
                    <span
                      className={cn(
                        'block text-[13px] font-semibold',
                        done ? 'text-[#7d8a83] line-through decoration-[#dfe9e2]' : 'text-[#14201a]'
                      )}
                    >
                      {item.label}
                    </span>
                    {!done && <span className="block text-[12px] text-[#7d8a83]">{item.hint}</span>}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </section>

      {/* Network stats */}
      <section className="rounded-2xl border border-[#dfe9e2] bg-white p-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#00713a]">The network</p>
        <dl className="mt-3 space-y-2.5">
          {[
            ...(hostsCount !== null ? [{ dot: '#00A651', value: hostsCount, label: hostsCount === 1 ? 'certified host' : 'certified hosts' }] : []),
            { dot: '#FCC30B', value: stats.jams, label: stats.jams === 1 ? 'jam on the platform' : 'jams on the platform' },
            { dot: '#26BDE2', value: stats.countries, label: stats.countries === 1 ? 'country' : 'countries' },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-2.5">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: s.dot }} aria-hidden="true" />
              <dd className="font-display text-lg font-extrabold tabular-nums leading-none text-[#14201a]">
                {s.value}
              </dd>
              <dt className="text-[13px] text-[#4c5a52]">{s.label}</dt>
            </div>
          ))}
        </dl>
      </section>
    </div>
  )
}
