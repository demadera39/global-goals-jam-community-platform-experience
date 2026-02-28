import { Link } from 'react-router-dom'
import { useMemo, useEffect, useState } from 'react'
import { usePublishedEvents } from '@/hooks/usePublishedEvents'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowRight, MapPin, Users, Globe, Calendar, Zap } from 'lucide-react'
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

  // Get a few featured events (prioritize current year, but show others if needed)
  const featuredEvents = useMemo(() => {
    const eList = events ?? []
    const now = new Date()
    
    // Prioritize current year events but include other years if current year has < 3
    const thisYearEvents = eList.filter((e) => {
      if (!e.eventDate) return false
      return new Date(e.eventDate).getFullYear() === currentYear
    })
    
    const otherYearEvents = eList.filter((e) => {
      if (!e.eventDate) return false
      return new Date(e.eventDate).getFullYear() !== currentYear
    })
    
    // Sort: upcoming first, then recent past
    const sortEvents = (list: typeof eList) => list.sort((a, b) => {
      const dateA = new Date(a.eventDate)
      const dateB = new Date(b.eventDate)
      
      const isAUpcoming = dateA >= now
      const isBUpcoming = dateB >= now
      
      if (isAUpcoming && isBUpcoming) {
        return dateA.getTime() - dateB.getTime()
      }
      
      if (!isAUpcoming && !isBUpcoming) {
        return dateB.getTime() - dateA.getTime()
      }
      
      return isAUpcoming ? -1 : 1
    })
    
    const sortedThisYear = sortEvents(thisYearEvents)
    const sortedOtherYears = sortEvents(otherYearEvents)
    
    // Combine: current year first, then fill with other years if needed
    const combined = [...sortedThisYear, ...sortedOtherYears]
    
    // Show up to 3 featured events
    return combined.slice(0, 3)
  }, [events, currentYear])

  if (loading) {
    return (
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-96 rounded-xl border bg-card animate-pulse" />
        </div>
      </section>
    )
  }

  if (stats.totalEvents === 0) {
    return (
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-xl border bg-card p-8 text-center">
            <Globe className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No events scheduled yet</h3>
            <p className="text-muted-foreground">Check back soon for upcoming Global Goals Jam events.</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-12 bg-gradient-to-b from-background to-muted/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-1">Global Impact</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Creating <span className="text-primary-solid">Global Impact</span> Together
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              Empowering approximately 55 events and 2,750 changemakers annually worldwide
            </p>
          </div>
          <Button asChild variant="ghost" className="hidden sm:inline-flex text-primary hover:text-primary/80">
            <Link to="/events">
              View all events <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>

        {/* Global Impact Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="overflow-hidden border-primary/20 hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Global Events</p>
                  <p className={cn(
                    "text-4xl font-bold text-primary-solid transition-all duration-1000",
                    animateNumbers ? "opacity-100 scale-100" : "opacity-0 scale-95"
                  )}>
                    ~55
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Events per year
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-primary/30" />
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-primary/20 hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Countries</p>
                  <p className={cn(
                    "text-4xl font-bold text-primary-solid transition-all duration-1000 delay-100",
                    animateNumbers ? "opacity-100 scale-100" : "opacity-0 scale-95"
                  )}>
                    20+
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Countries reached
                  </p>
                </div>
                <Globe className="w-8 h-8 text-primary/30" />
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-primary/20 hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Changemakers</p>
                  <p className={cn(
                    "text-4xl font-bold text-primary-solid transition-all duration-1000 delay-200",
                    animateNumbers ? "opacity-100 scale-100" : "opacity-0 scale-95"
                  )}>
                    ~2,750
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Changemakers yearly
                  </p>
                </div>
                <Users className="w-8 h-8 text-primary/30" />
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-primary/20 hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Cities</p>
                  <p className={cn(
                    "text-4xl font-bold text-primary-solid transition-all duration-1000 delay-300",
                    animateNumbers ? "opacity-100 scale-100" : "opacity-0 scale-95"
                  )}>
                    50+
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Cities engaged
                  </p>
                </div>
                <MapPin className="w-8 h-8 text-primary/30" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Featured Events Preview */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-primary" />
            <h3 className="text-xl font-semibold">Featured Events</h3>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredEvents.map((event) => {
              const eventDate = new Date(event.eventDate)
              const isPast = eventDate < new Date()
              
              return (
                <Link key={event.id} to={`/events/${event.id}`} className="group">
                  <Card className={cn(
                    "h-full overflow-hidden transition-all group-hover:shadow-xl group-hover:-translate-y-1",
                    isPast ? "opacity-70" : ""
                  )}>
                    <div className="h-32 relative">
                      {event.coverImage ? (
                        <img 
                          src={event.coverImage} 
                          alt={event.title} 
                          className={cn(
                            "w-full h-full object-cover",
                            isPast ? "grayscale" : ""
                          )}
                          loading="lazy" 
                        />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-primary/20 to-primary/5" />
                      )}
                      <div className="absolute top-2 right-2">
                        <Badge variant={isPast ? "secondary" : "default"} className="bg-white/90 text-foreground">
                          {isPast ? 'Completed' : 'Upcoming'}
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="pt-4 pb-4">
                      <h4 className="font-semibold text-base line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                        {event.title}
                      </h4>
                      <div className="space-y-1.5 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{eventDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
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

        {/* View All CTA */}
        <div className="text-center pt-6 border-t">
          <Button asChild size="lg" className="bg-primary-solid text-white hover:bg-primary/90">
            <Link to="/events">
              <Globe className="w-5 h-5 mr-2" />
              Explore all events
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
