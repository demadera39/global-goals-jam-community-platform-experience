import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { usePublishedEvents } from '@/hooks/usePublishedEvents'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, CalendarDays, MapPin } from 'lucide-react'

export default function EventsSpotlight() {
  const { events, loading, error, refresh, retryInSec } = usePublishedEvents({ maxAgeMs: 60_000 })
  const currentYear = new Date().getFullYear()

  const sample = useMemo(() => {
    const eList = events ?? []
    const now = new Date()
    
    // Filter events for current year
    const thisEdition = eList.filter((e) => {
      if (!e.eventDate) return false
      const year = new Date(e.eventDate).getFullYear()
      return year === currentYear
    })
    
    // Sort by date: upcoming events first (closest to today), then recent past events
    const sorted = thisEdition.sort((a, b) => {
      const dateA = new Date(a.eventDate)
      const dateB = new Date(b.eventDate)
      
      const isAUpcoming = dateA >= now
      const isBUpcoming = dateB >= now
      
      // Both upcoming: show closest first
      if (isAUpcoming && isBUpcoming) {
        return dateA.getTime() - dateB.getTime()
      }
      
      // Both past: show most recent first
      if (!isAUpcoming && !isBUpcoming) {
        return dateB.getTime() - dateA.getTime()
      }
      
      // Upcoming events come before past events
      return isAUpcoming ? -1 : 1
    })
    
    // Show up to 9 events (3x3 grid)
    return sorted.slice(0, 9)
  }, [events, currentYear])

  const sampleLength = (sample || []).length

  return (
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">This edition</p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Happening around the world in {currentYear}</h2>
          </div>
          <Link to="/events" className="text-primary hover:underline inline-flex items-center text-sm font-medium">
            View all events <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>

        {loading && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-40 rounded-xl border bg-card animate-pulse" />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="rounded-xl border bg-card p-6 text-sm">
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground">Could not load events. {retryInSec ? `Retry in ${retryInSec}s` : ''}</p>
              <button onClick={() => refresh(true)} className="text-primary hover:underline">Retry</button>
            </div>
          </div>
        )}

        {!loading && !error && sampleLength === 0 && (
          <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
            No published events for this edition yet. Check back soon.
          </div>
        )}

        {!loading && !error && sampleLength > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(sample || []).map((e) => {
              const eventDate = new Date(e.eventDate)
              const isPast = eventDate < new Date()
              
              return (
                <Link key={e.id} to={`/events/${e.id}`} className="group">
                  <Card className={`h-full overflow-hidden transition-all group-hover:shadow-md ${isPast ? 'opacity-60 grayscale' : ''}`}>
                    <div className="h-28">
                      {e.coverImage ? (
                        <img src={e.coverImage} alt={e.title} className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-[#00A651]/20 to-[#00A651]/5" />
                      )}
                    </div>
                    <CardHeader className="pb-2">
                      <Badge variant={isPast ? "outline" : "secondary"} className="w-fit">
                        {isPast ? 'Completed' : new Date(e.eventDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </Badge>
                      <CardTitle className="text-lg line-clamp-2 mt-1">{e.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 pb-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="w-4 h-4" />
                        <span>{new Date(e.eventDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                      </div>
                      {e.location && (
                        <div className="flex items-center gap-2 mt-1">
                          <MapPin className="w-4 h-4" />
                          <span className="truncate" title={e.location}>{e.location}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
