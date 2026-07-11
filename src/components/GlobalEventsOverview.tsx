import { Link } from 'react-router-dom'
import { useMemo, useEffect, useState } from 'react'
import { usePublishedEvents } from '@/hooks/usePublishedEvents'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, MapPin, Globe, Calendar, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EventStats {
  totalEvents: number
  upcomingEvents: number
  countries: Set<string>
  cities: Set<string>
  estimatedParticipants: number
  completedEvents: number
  currentYearEvents: number
  yearsActive: number
  avgEventsPerYear: number
  avgParticipantsPerYear: number
}

export default function GlobalEventsOverview() {
  const { events, loading } = usePublishedEvents({ maxAgeMs: 60_000 })
  const currentYear = new Date().getFullYear()
  const [animateNumbers, setAnimateNumbers] = useState(false)

  const stats = useMemo(() => {
    const eList = events ?? []
    const now = new Date()
    
    // Calculate ALL-TIME stats (year-agnostic)
    const countries = new Set<string>()
    const cities = new Set<string>()
    let estimatedParticipants = 0
    let currentYearCount = 0
    let upcomingCount = 0
    let completedCount = 0
    const yearSet = new Set<number>()

    eList.forEach((e) => {
      if (!e.eventDate) return
      
      const eventDate = new Date(e.eventDate)
      const eventYear = eventDate.getFullYear()
      yearSet.add(eventYear)
      
      // Count current year events separately
      if (eventYear === currentYear) {
        currentYearCount++
        if (eventDate >= now) upcomingCount++
        else completedCount++
      }
      
      // Parse location for ALL events (all-time)
      if (e.location) {
        const parts = e.location.split(',').map(p => p.trim())
        if (parts.length >= 2) {
          cities.add(parts[0])
          countries.add(parts[parts.length - 1])
        } else if (parts.length === 1) {
          cities.add(parts[0])
        }
      }
      
      // Estimate participants for ALL events (all-time)
      const manualCount = e.manualParticipantCount ? parseInt(e.manualParticipantCount) : 0
      const maxPart = e.maxParticipants || 0
      const estimate = manualCount || maxPart || 30
      estimatedParticipants += estimate
    })

    // Calculate yearly averages (only if we have multiple years)
    const yearsCount = yearSet.size || 1
    const avgEventsPerYear = Math.round(eList.length / yearsCount)
    const avgParticipantsPerYear = Math.round(estimatedParticipants / yearsCount)

    return {
      totalEvents: eList.length, // All-time total
      upcomingEvents: upcomingCount,
      countries,
      cities,
      estimatedParticipants,
      completedEvents: completedCount,
      currentYearEvents: currentYearCount,
      yearsActive: yearsCount,
      avgEventsPerYear,
      avgParticipantsPerYear
    } as EventStats
  }, [events, currentYear])

  // Trigger animation when stats are loaded
  useEffect(() => {
    if (!loading && stats.totalEvents > 0) {
      setTimeout(() => setAnimateNumbers(true), 100)
    }
  }, [loading, stats.totalEvents])

  // Upcoming jams only — never back-fill the homepage with past/grayed events.
  // If there are no upcoming jams we show a warm invitation instead (below).
  const upcomingFeatured = useMemo(() => {
    const eList = events ?? []
    const now = new Date()
    return eList
      .filter((e) => e.eventDate && new Date(e.eventDate) >= now)
      .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime())
      .slice(0, 3)
  }, [events])

  if (loading) {
    return (
      <section className="border-y border-[#dfe9e2] bg-white/70 py-16">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="h-96 rounded-2xl border border-[#dfe9e2] bg-white animate-pulse" />
        </div>
      </section>
    )
  }

  if (stats.totalEvents === 0) {
    return (
      <section className="border-y border-[#dfe9e2] bg-white/70 py-16">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="rounded-2xl border border-[#dfe9e2] bg-white p-8 text-center">
            <Globe className="w-12 h-12 text-[#7d8a83] mx-auto mb-4" />
            <h3 className="font-display font-extrabold text-xl mb-2">No events scheduled yet</h3>
            <p className="text-[#4c5a52]">Check back soon for upcoming Global Goals Jam events.</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="border-y border-[#dfe9e2] bg-white/70">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-16 sm:py-20">
        {/* Header */}
        <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
          <div className="max-w-2xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#00713a]">Global impact</p>
            <h2 className="font-display font-extrabold tracking-tight text-3xl sm:text-4xl mt-3 [text-wrap:balance]">
              Creating <span className="text-[#00A651]">global impact</span> together.
            </h2>
            <p className="text-sm text-[#7d8a83] mt-3">
              Empowering approximately 55 events and 2,750 changemakers annually worldwide
            </p>
          </div>
          <Link
            to="/events"
            className="hidden sm:inline-flex items-center text-sm font-semibold text-[#00713a] underline decoration-2 decoration-[#00A651]/30 underline-offset-4 hover:decoration-[#00A651] transition-colors"
          >
            View all events <ArrowRight className="w-4 h-4 ml-1.5" />
          </Link>
        </div>

        {/* Global Impact Stats — quiet stat rail */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-[#dfe9e2] rounded-2xl overflow-hidden border border-[#dfe9e2] mb-10">
          {[
            { label: 'Global Events', value: '~55', caption: 'Events per year', dot: '#00A651', delay: '' },
            { label: 'Countries', value: '20+', caption: 'Countries reached', dot: '#FCC30B', delay: 'delay-100' },
            { label: 'Changemakers', value: '~2,750', caption: 'Changemakers yearly', dot: '#DD1367', delay: 'delay-200' },
            { label: 'Cities', value: '50+', caption: 'Cities engaged', dot: '#26BDE2', delay: 'delay-300' },
          ].map((s) => (
            <div key={s.label} className="bg-white p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-[#4c5a52]">{s.label}</p>
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.dot }} aria-hidden="true" />
              </div>
              <p className={cn(
                'font-display text-4xl font-extrabold tabular-nums text-[#14201a] mt-3 transition-all duration-1000',
                s.delay,
                animateNumbers ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
              )}>
                {s.value}
              </p>
              <p className="text-xs text-[#7d8a83] mt-2">{s.caption}</p>
            </div>
          ))}
        </div>

        {/* Upcoming Jams — only rendered when there are upcoming jams.
            An empty section reads as inactivity, so we omit it entirely
            otherwise; the impact stats + "Explore all events" CTA carry the
            section, and past activity lives in the diversity carousel below. */}
        {upcomingFeatured.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-[#00A651]" />
              <h3 className="font-display font-extrabold text-xl">Upcoming Jams</h3>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingFeatured.map((event) => {
                const eventDate = new Date(event.eventDate)
                return (
                  <Link key={event.id} to={`/events/${event.id}`} className="group">
                    <Card className="h-full overflow-hidden rounded-2xl border-[#dfe9e2] shadow-sm transition-all group-hover:shadow-xl group-hover:-translate-y-1.5">
                      <div className="h-32 relative">
                        {event.coverImage ? (
                          <img
                            src={event.coverImage}
                            alt={event.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="h-full w-full bg-gradient-to-br from-[#00A651]/20 to-[#00A651]/5" />
                        )}
                        <div className="absolute top-2 right-2">
                          <Badge variant="default" className="bg-white/90 text-[#00713a] hover:bg-white/90">Upcoming</Badge>
                        </div>
                      </div>
                      <CardContent className="pt-4 pb-4">
                        <h4 className="font-display font-bold text-base line-clamp-2 mb-2 group-hover:text-[#00713a] transition-colors">
                          {event.title}
                        </h4>
                        <div className="space-y-1.5 text-sm text-[#4c5a52]">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span className="font-mono text-[13px] tabular-nums">
                              {eventDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          </div>
                          {event.location && (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              <span className="truncate" title={event.location}>{event.location}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* View All CTA */}
        <div className="text-center pt-8 border-t border-[#dfe9e2]">
          <Link
            to="/events"
            className="inline-flex items-center rounded-full bg-[#00A651] px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-[#00A651]/25 hover:bg-[#008a44] transition-colors"
          >
            <Globe className="w-5 h-5 mr-2" />
            Explore all events
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </div>
      </div>
    </section>
  )
}
