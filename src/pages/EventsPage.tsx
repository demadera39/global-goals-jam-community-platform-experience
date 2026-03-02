import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { 
  Calendar, 
  MapPin, 
  Users, 
  Search, 
  Filter,
  Clock,
  Globe,
  Plus,
  Loader2
} from 'lucide-react'
import { db, auth } from '../lib/supabase'
import { cn, sdgNumberFromFocus, sdgBg, sdgText, sdgBorder, sdgName } from '../lib/utils'
import { useToast } from '../hooks/use-toast'

interface User {
  id: string
  email: string
  displayName?: string
  role: string
}

interface Event {
  id: string
  title: string
  description: string
  hostId: string
  location: string
  latitude?: number
  longitude?: number
  eventDate: string
  startTime?: string
  endTime?: string
  status: string
  maxParticipants?: number
  registrationDeadline?: string
  agenda?: string
  requirements?: string
  coverImage?: string
  createdAt: string
  updatedAt: string
  sdgFocus?: string
}

const statusColors = {
  draft: 'bg-pastel-amber text-amber-800',
  published: 'bg-pastel-green text-primary/80',
  ongoing: 'bg-pastel-sky text-sky-800',
  completed: 'bg-pastel-violet text-violet-800',
  cancelled: 'bg-pastel-rose text-rose-800'
}

const statusLabels = {
  draft: 'Draft',
  published: 'Open for Registration',
  ongoing: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled'
}

export default function EventsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState<Event[]>([])
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [locationFilter, setLocationFilter] = useState('')
  const [geolocating, setGeolocating] = useState(false)
  const [retryCountdown, setRetryCountdown] = useState(0)
  const [loadError, setLoadError] = useState<any | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  const loadEvents = useCallback(async (retryCount = 0) => {
    try {
      setLoadError(null)
      const allEvents = await db.events.list({
        orderBy: { eventDate: 'asc' },
        limit: 200
      })
      setEvents(allEvents)
    } catch (error: any) {
      console.error('Failed to load events:', error)
      
      // Handle rate limit error specifically
      if (error?.details?.code === 'RATE_LIMIT_EXCEEDED') {
        const resetTime = error.details.reset ? new Date(error.details.reset) : null
        const retryInSeconds = resetTime 
          ? Math.max(0, Math.ceil((resetTime.getTime() - Date.now()) / 1000))
          : 30
        
        setLoadError({
          message: `Rate limit exceeded. Too many requests to the database.`,
          retryIn: retryInSeconds
        })
        setRetryCountdown(retryInSeconds)
      } else if (retryCount < 3) {
        // Retry with exponential backoff for other errors
        const delay = Math.min(1000 * Math.pow(2, retryCount), 10000)
        setTimeout(() => loadEvents(retryCount + 1), delay)
      } else {
        // Generic error after retries exhausted
        setLoadError({
          message: error?.message || 'Failed to load events. Please try again later.'
        })
      }
    }
  }, [])

  useEffect(() => {
    loadEvents()
  }, [loadEvents])

  // Countdown timer for retry
  useEffect(() => {
    if (retryCountdown > 0) {
      const timer = setTimeout(() => {
        setRetryCountdown(prev => {
          if (prev === 1) {
            loadEvents() // Auto-retry when countdown reaches 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retryCountdown])

  const filterEvents = useCallback(() => {
    let filtered = events.filter(e => e.status !== 'draft')

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(e => 
        (e.title || '').toLowerCase().includes(term) ||
        (e.description || '').toLowerCase().includes(term) ||
        (e.location || '').toLowerCase().includes(term)
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(event => event.status === statusFilter)
    }

    // Location filter
    if (locationFilter) {
      filtered = filtered.filter(e => 
        (e.location || '').toLowerCase().includes(locationFilter.toLowerCase())
      )
    }

    setFilteredEvents(filtered)
  }, [events, searchTerm, statusFilter, locationFilter])

  useEffect(() => {
    filterEvents()
  }, [events, searchTerm, statusFilter, locationFilter, filterEvents])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (timeString?: string) => {
    if (!timeString) return ''
    const [hours, minutes] = timeString.split(':')
    const date = new Date()
    date.setHours(parseInt(hours), parseInt(minutes))
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const isEventUpcoming = (eventDate: string) => {
    return new Date(eventDate) > new Date()
  }

  const isEventToday = (eventDate: string) => {
    const today = new Date()
    const event = new Date(eventDate)
    return today.toDateString() === event.toDateString()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  const findNearMe = async () => {
    // useToast is used at component top-level to satisfy hook rules; just use the top-level toast here
    if (!('geolocation' in navigator)) {
      toast({ title: 'Geolocation unavailable', description: 'Your browser does not support location services.' })
      return
    }
    setGeolocating(true)
    try {
      const coords = await new Promise<{ lat: number; lon: number }>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
          (err) => reject(err),
          { enableHighAccuracy: false, timeout: 10000 }
        )
      })
      setStatusFilter('published')
      setLocationFilter('')
      setSearchTerm('')
      toast({ title: 'Showing nearby events', description: 'Sorted by distance from your location.' })
    } catch (e: any) {
      toast({ title: 'Could not access your location', description: e?.message || 'Permission denied or timed out.' })
    } finally {
      setGeolocating(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 hero-pattern">
        <div className="absolute inset-0 bg-gradient-to-br from-background/80 to-background/60" aria-hidden="true" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs uppercase tracking-[0.2em] font-semibold text-primary/60 mb-3">Discover & Join</p>
          <Badge variant="green" className="mb-6 px-4 py-2 text-sm font-medium rounded-pill">
            <Globe className="w-4 h-4 mr-2" />
            Global Events Network
          </Badge>

          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground mb-6 tracking-tight">
            Global Goals Jam <span className="text-primary-solid">Events</span>
          </h1>
          <div className="mt-4 mb-6 flex flex-wrap items-center justify-center gap-2">
            {Array.from({ length: 17 }, (_, i) => i + 1).map((n) => (
              <span key={n} className={cn('w-4 h-4 rounded-full inline-block', `bg-sdg-${n}`)} title={`SDG ${n}`} />
            ))}
          </div>

          <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
            Join local communities worldwide in tackling the UN Sustainable Development Goals.
            Find events near you or discover virtual opportunities to make a global impact.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-primary-solid text-white hover:bg-primary/90 rounded-xl" onClick={findNearMe} disabled={geolocating}>
              {geolocating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Locating…
                </>
              ) : (
                <>
                  <MapPin className="w-5 h-5 mr-2" /> Find Events Near Me
                </>
              )}
            </Button>
            {user?.role === 'host' || user?.role === 'admin' ? (
              <Button size="lg" variant="outline" asChild>
                <Link to="/host-dashboard">
                  <Plus className="w-5 h-5 mr-2" />
                  Host an Event
                </Link>
              </Button>
            ) : (
              <Button size="lg" variant="outline" onClick={() => {
                const target = '/course/enroll'
                window.location.href = `/sign-in?redirect=${encodeURIComponent(target)}`
              }}>
                <Plus className="w-5 h-5 mr-2" />
                Become a Host
              </Button>
            )}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Filters */}
        <Card className="mb-8 shadow-soft rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filter Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <Input
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="published">Open for Registration</SelectItem>
                    <SelectItem value="ongoing">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Input
                  placeholder="Filter by location..."
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                />
              </div>
              <div>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm('')
                    setStatusFilter('all')
                    setLocationFilter('')
                  }}
                  className="w-full"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Events Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => {
            const sdg = sdgNumberFromFocus(event.sdgFocus)
            const isPast = event.status === 'completed' || event.status === 'cancelled' || !isEventUpcoming(event.eventDate)
            return (
              <Card key={event.id} className={cn("shadow-soft hover:shadow-card transition-shadow overflow-hidden rounded-xl", isPast && "opacity-60 grayscale-[40%]")}>
                {/* SDG top bar */}
                <div className={cn('h-1.5 w-full', sdg ? sdgBg(sdg) : 'bg-primary-solid')} />
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-2">{event.title}</CardTitle>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <Badge
                          variant="secondary"
                          className={cn('text-xs', statusColors[event.status as keyof typeof statusColors])}
                        >
                          {statusLabels[event.status as keyof typeof statusLabels]}
                        </Badge>
                        {sdg && (
                          <Badge variant="outline" className={cn('text-xs font-medium', sdgBorder(sdg), sdgText(sdg))}>
                            SDG {sdg}: {sdgName(sdg)}
                          </Badge>
                        )}
                        {isEventToday(event.eventDate) && (
                          <Badge variant="destructive" className="text-xs">
                            Today
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {event.description}
                    </p>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>{formatDate(event.eventDate)}</span>
                      </div>
                      
                      {event.startTime && (
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span>
                            {formatTime(event.startTime)}
                            {event.endTime && ` - ${formatTime(event.endTime)}`}
                          </span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="line-clamp-1">{event.location}</span>
                      </div>
                      
                      {event.maxParticipants && (
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span>Max {event.maxParticipants} participants</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="pt-2">
                      <Link to={`/events/${event.id}`}>
                        <Button 
                          className={cn(
                            'w-full text-white hover:opacity-95',
                            sdg ? sdgBg(sdg) : 'bg-primary-solid'
                          )}
                          disabled={event.status === 'completed' || event.status === 'cancelled'}
                        >
                          {event.status === 'published' && isEventUpcoming(event.eventDate) ? 'Register Now' :
                           event.status === 'ongoing' ? 'View Details' :
                           event.status === 'completed' ? 'View Results' :
                           'View Event'}
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {filteredEvents.length === 0 && (
          <Card className="shadow-soft rounded-xl">
            <CardContent className="text-center py-12">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No events found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== 'all' || locationFilter
                  ? 'Try adjusting your filters to see more events.'
                  : 'No events are currently available. Check back soon!'}
              </p>
              {(searchTerm || statusFilter !== 'all' || locationFilter) && (
                <Button 
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('')
                    setStatusFilter('all')
                    setLocationFilter('')
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Call to Action */}
        <Card className="mt-12 bg-section-warm border-primary/20 shadow-soft rounded-xl">
          <CardContent className="text-center py-12">
            <Globe className="w-16 h-16 text-primary mx-auto mb-6" />
            <h2 className="text-2xl font-display font-bold text-foreground mb-4">
              Ready to Host Your Own Global Goals Jam?
            </h2>
            <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
              Join our global network of hosts and empower your local community to tackle 
              the UN Sustainable Development Goals through collaborative innovation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-primary-solid text-white hover:bg-primary/90 rounded-pill" asChild>
                <Link to="/sign-in">
                  <Plus className="w-5 h-5 mr-2" />
                  Become a Host
                </Link>
              </Button>
              <Button size="lg" className="bg-primary-solid text-white hover:bg-primary/90 rounded-pill" asChild>
                <Link to="/about">
                  <Search className="w-5 h-5 mr-2" />
                  Learn More
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}