import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  ArrowLeft,
  UserPlus,
  Download,
  Share2,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react'
import blink, { safeDbCall, getFullUser } from '../lib/blink'
import EventMediaSection from '../components/EventMediaSection'
import { cn, sdgNumberFromFocus, sdgBg, sdgText, sdgTheme } from '../lib/utils'
import { isCertifiedHost } from '../lib/blink'

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
  hostName?: string
  team?: string
  coverImage?: string
  createdAt: string
  updatedAt: string
  sdgFocus?: string
  resultsSummary?: string
}

interface Registration {
  id: string
  eventId: string
  participantId: string
  registrationDate: string
  status: string
  notes?: string
}

const statusColors = {
  draft: 'bg-gray-500',
  published: 'bg-green-500',
  ongoing: 'bg-blue-500',
  completed: 'bg-purple-500',
  cancelled: 'bg-red-500'
}

const statusLabels = {
  draft: 'Draft',
  published: 'Open for Registration',
  ongoing: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled'
}

export default function EventDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [event, setEvent] = useState<Event | null>(null)
  const [registration, setRegistration] = useState<Registration | null>(null)
  const [registering, setRegistering] = useState(false)
  const [hostDisplayName, setHostDisplayName] = useState<string>('Local Host')
  const [teamMembers, setTeamMembers] = useState<string[]>([])
  const [hostCertified, setHostCertified] = useState<boolean>(false)
  const [headerImage, setHeaderImage] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged(async (state) => {
      setLoading(state.isLoading)
      if (state.user) {
        try {
          const full = await getFullUser()
          setUser(full as any)
        } catch {
          setUser(state.user as any)
        }
      } else {
        setUser(null)
      }
    })
    return unsubscribe
  }, [])

  const checkRegistration = useCallback(async () => {
    if (!user || !event) return

    try {
      const registrations = await safeDbCall(() => blink.db.eventRegistrations.list<Registration>({
        where: {
          eventId: event.id,
          participantId: user.id
        },
        limit: 1
      }))
      if (registrations.length > 0) {
        setRegistration(registrations[0])
      }
    } catch (error) {
      console.error('Failed to check registration:', error)
    }
  }, [user, event])

  useEffect(() => {
    if (id) {
      loadEvent(id)
    }
  }, [id])

  useEffect(() => {
    if (user && event) {
      checkRegistration()
    }
  }, [user, event, checkRegistration])

  // Resolve header image (prefer coverImage; fallback to first media image)
  useEffect(() => {
    if (!event) return
    if (event.coverImage && event.coverImage.trim()) {
      setHeaderImage(event.coverImage)
      return
    }
    ;(async () => {
      try {
        const media = await safeDbCall(() => blink.db.media.list<{ fileUrl: string; fileType: string }>({
          where: { eventId: event.id },
          orderBy: { createdAt: 'asc' },
          limit: 20
        }))
        const img = media.find(m => {
          const t = (m.fileType || '').toLowerCase()
          const url = (m.fileUrl || '').toLowerCase()
          return t.startsWith('image/') || /\.(png|jpe?g|gif|webp)$/.test(url)
        })
        if (img) setHeaderImage(img.fileUrl)
      } catch {}
    })()
  }, [event])

  useEffect(() => {
    const loadHostInfo = async () => {
      if (!event) return
      if (event.team) {
        const names = event.team.split(/[;,\n]/).map(s => s.trim()).filter(Boolean)
        setTeamMembers(names)
      } else {
        setTeamMembers([])
      }
      if (event.hostName && event.hostName.trim()) {
        setHostDisplayName(event.hostName.trim())
      } else {
        try {
          const u = await safeDbCall(() => blink.db.users.list({ where: { id: event.hostId }, limit: 1 }))
          if (u?.[0]) {
            setHostDisplayName(u[0].displayName || u[0].email || 'Local Host')
          } else {
            setHostDisplayName('Local Host')
          }
        } catch {
          setHostDisplayName('Local Host')
        }
      }
    }
    loadHostInfo()
  }, [event])

  const loadEvent = async (eventId: string) => {
    try {
      const events = await safeDbCall(() => blink.db.events.list<Event>({
        where: { id: eventId },
        limit: 1
      }))
      if (events.length > 0) {
        setEvent(events[0])
      } else {
        setEvent(null)
      }
    } catch (error) {
      console.error('Failed to load event:', error)
      setEvent(null)
    }
  }

  const registerForEvent = async () => {
    if (!user || !event) {
      window.location.href = `/sign-in?redirect=${encodeURIComponent(window.location.href)}`
      return
    }

    setRegistering(true)
    try {
      // 1) Ensure a participant profile exists
      try {
        const existingProfile = await safeDbCall(() => (blink.db as any).users.list({ where: { id: user.id }, limit: 1 }))
        if (!existingProfile?.[0]) {
          await safeDbCall(() => (blink.db as any).users.create({
            id: user.id,
            email: (user as any).email,
            displayName: (user as any).displayName || (user as any).email,
            role: 'participant',
            status: 'approved'
          }))
        }
      } catch (e) {
        console.warn('ensure profile failed (non-fatal):', e)
      }

      // 2) Deduplicate registration for this user+event
      const existing = await safeDbCall(() => blink.db.eventRegistrations.list<Registration>({
        where: { eventId: event.id, participantId: user.id },
        limit: 1
      }))
      if (existing.length > 0) {
        setRegistration(existing[0])
        return
      }

      // 3) Create registration
      const newRegistration = await safeDbCall(() => blink.db.eventRegistrations.create<Registration>({
        eventId: event.id,
        participantId: user.id,
        status: 'registered'
      }))
      setRegistration(newRegistration)
    } catch (error) {
      console.error('Failed to register for event:', error)
      alert('Failed to register for event. Please try again.')
    } finally {
      setRegistering(false)
    }
  }

  const isValidDate = (d: Date) => !isNaN(d.getTime())

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    if (!isValidDate(date)) return dateString || 'TBD'
    try {
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch {
      return dateString || 'TBD'
    }
  }

  const formatTime = (timeString?: string) => {
    if (!timeString) return ''
    const parts = timeString.split(':')
    if (parts.length < 2) return timeString
    const [hours, minutes] = parts
    const date = new Date()
    date.setHours(parseInt(hours, 10) || 0, parseInt(minutes, 10) || 0)
    if (!isValidDate(date)) return timeString
    try {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    } catch {
      return timeString
    }
  }

  const isEventUpcoming = (eventDate: string) => {
    const d = new Date(eventDate)
    if (!isValidDate(d)) return false
    return d > new Date()
  }

  const isRegistrationOpen = () => {
    if (!event) return false
    if (event.status !== 'published') return false
    if (!isEventUpcoming(event.eventDate)) return false
    if (event.registrationDeadline) {
      const rd = new Date(event.registrationDeadline)
      if (!isValidDate(rd)) return true
      return rd > new Date()
    }
    return true
  }

  const shareEvent = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event?.title || 'Global Goals Jam Event',
          text: event?.description || 'Join us for a GGJ event!',
          url: window.location.href
        })
      } catch (error) {
        console.log('Error sharing:', error)
      }
    } else {
      // Fallback to copying URL
      try {
        await navigator.clipboard.writeText(window.location.href)
        alert('Event URL copied to clipboard!')
      } catch {
        // ignore
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Event Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The event you're looking for doesn't exist or has been removed.
            </p>
            <Link to="/events">
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Events
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={cn('min-h-screen bg-background', sdgTheme(sdgNumberFromFocus(event.sdgFocus)))}>
      {/* Hero header */}
      <section className="relative w-full h-64 sm:h-80 lg:h-96 overflow-hidden">
        {headerImage ? (
          <img src={headerImage} alt={event.title} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#00A651]/20 to-[#00A651]/5" />
        )}
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-x-0 bottom-0 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge variant="secondary">{formatDate(event.eventDate)}</Badge>
            <span className="inline-flex items-center text-white/90 text-sm">
              <MapPin className="w-4 h-4 mr-1" /> {event.location}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white drop-shadow-md">{event.title}</h1>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Button */}
        <div className="mb-6">
          <Link to="/events">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Events
            </Button>
          </Link>
        </div>

        {/* Event Header */}
        <Card className="mb-8 overflow-hidden">
          {/* SDG top bar */}
          <div className={cn('h-1 w-full', sdgNumberFromFocus(event.sdgFocus) ? sdgBg(sdgNumberFromFocus(event.sdgFocus)) : 'bg-primary-solid')} />
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge
                    variant="secondary"
                    className={`text-white ${statusColors[event.status as keyof typeof statusColors]}`}
                  >
                    {statusLabels[event.status as keyof typeof statusLabels]}
                  </Badge>
                  {sdgNumberFromFocus(event.sdgFocus) && (
                    <Badge variant="outline" className={cn('text-xs', sdgText(sdgNumberFromFocus(event.sdgFocus)))}>
                      SDG {sdgNumberFromFocus(event.sdgFocus)}
                    </Badge>
                  )}
                  {registration && (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Registered
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-3xl mb-4">{event.title}</CardTitle>
                <div className="text-lg text-muted-foreground prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: event.description }} />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={shareEvent}>
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
                {isRegistrationOpen() && !registration && (
                  <Button
                    onClick={registerForEvent}
                    disabled={registering}
                    className={cn('text-white hover:opacity-95', sdgNumberFromFocus(event.sdgFocus) ? sdgBg(sdgNumberFromFocus(event.sdgFocus)) : 'bg-primary-solid')}
                  >
                    {registering ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Registering...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Register Now
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {/* Event Details */}
            <Card>
              <CardHeader>
                <CardTitle>Event Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{formatDate(event.eventDate)}</div>
                    {event.startTime && (
                      <div className="text-sm text-muted-foreground">
                        {formatTime(event.startTime)}
                        {event.endTime && ` - ${formatTime(event.endTime)}`}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{event.location}</div>
                  </div>
                </div>

                {(typeof event.maxParticipants === 'number' && event.maxParticipants > 0) || (event as any).manualParticipantCount ? (
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-muted-foreground" />
                    <div>
                      {(event as any).manualParticipantCount ? (
                        <div className="font-medium">{(event as any).manualParticipantCount} participants</div>
                      ) : (
                        <div className="font-medium">Max {event.maxParticipants} participants</div>
                      )}
                    </div>
                  </div>
                ) : null}

                {event.registrationDeadline && (
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Registration Deadline</div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(event.registrationDeadline)}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Agenda */}
            {event.agenda && (
              <Card>
                <CardHeader>
                  <CardTitle>Agenda</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: event.agenda }} />
                </CardContent>
              </Card>
            )}

            {/* Requirements */}
            {event.requirements && (
              <Card>
                <CardHeader>
                  <CardTitle>Requirements</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: event.requirements }} />
                </CardContent>
              </Card>
            )}

            {/* Results Summary */}
            {event.resultsSummary && event.resultsSummary.trim().length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: event.resultsSummary }} />
                </CardContent>
              </Card>
            )}

            {/* Results & Media */}
            <EventMediaSection event={{ id: event.id, hostId: event.hostId }} user={user} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Registration Status */}
            <Card>
              <CardHeader>
                <CardTitle>Registration</CardTitle>
              </CardHeader>
              <CardContent>
                {registration ? (
                  <div className="text-center">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <h3 className="font-semibold text-green-600 mb-2">You're Registered!</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {(() => {
                        const d = new Date(registration.registrationDate)
                        return isValidDate(d) ? `Registered on ${d.toLocaleDateString()}` : 'Registered'
                      })()}
                    </p>
                    <Button variant="outline" className="w-full">
                      <Download className="w-4 h-4 mr-2" />
                      Download Calendar Event
                    </Button>
                  </div>
                ) : isRegistrationOpen() ? (
                  <div className="text-center">
                    <UserPlus className="w-12 h-12 text-primary mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">Registration Open</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Join this Global Goals Jam event and make a difference in your community.
                    </p>
                    {(event as any).customRegistrationLink ? (
                      <Button
                        onClick={() => window.open((event as any).customRegistrationLink, '_blank')}
                        className="w-full bg-primary-solid text-white hover:bg-primary/90"
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Register on External Form
                      </Button>
                    ) : (
                      <Button
                        onClick={registerForEvent}
                        disabled={registering}
                        className="w-full bg-primary-solid text-white hover:bg-primary/90"
                      >
                        {registering ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Registering...
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-4 h-4 mr-2" />
                            Register Now
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="text-center">
                    <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">Registration Closed</h3>
                    <p className="text-sm text-muted-foreground">
                      {event.status === 'completed'
                        ? 'This event has already taken place.'
                        : event.status === 'cancelled'
                        ? 'This event has been cancelled.'
                        : 'Registration is no longer available for this event.'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Host Information */}
            <Card>
              <CardHeader>
                <CardTitle>Event Host</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-primary-solid/10 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Link to={`/host/${event.hostId}`} className="font-medium truncate text-primary hover:underline">{hostDisplayName}</Link>
                      {hostCertified && (<Badge className="bg-emerald-600 text-white">Certified Host</Badge>)}
                    </div>
                    {teamMembers.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {teamMembers.map((name, idx) => (
                          <span key={idx} className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground">{name}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Event
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Download className="w-4 h-4 mr-2" />
                  Add to Calendar
                </Button>
                <Link to="/community" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="w-4 h-4 mr-2" />
                    Join Discussion
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
