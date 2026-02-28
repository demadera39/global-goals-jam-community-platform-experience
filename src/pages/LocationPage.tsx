import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import { 
  MapPin, 
  Calendar, 
  Users, 
  Clock,
  Globe,
  Mail,
  Phone,
  ExternalLink,
  Plus,
  Award,
  Image as ImageIcon,
  Video,
  FileText,
  Loader2,
  ArrowLeft
} from 'lucide-react'
import blink, { getFullUser } from '../lib/blink'

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
}

interface Media {
  id: string
  eventId: string
  uploadedBy: string
  title: string
  description: string
  fileUrl: string
  fileType: string
  fileSize: number
  sdgTags: string
  isFeatured: boolean
  createdAt: string
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

export default function LocationPage() {
  const { location } = useParams<{ location: string }>()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState<Event[]>([])
  const [media, setMedia] = useState<Media[]>([])
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [hostInfo, setHostInfo] = useState<User | null>(null)

  useEffect(() => {
    const update = async () => {
      setLoading(true)
      const full = await getFullUser()
      setUser(full)
      setLoading(false)
    }

    const unsubscribe = blink.auth.onAuthStateChanged(() => {
      update().catch(console.error)
    })

    update().catch(console.error)

    return unsubscribe
  }, [])

  const promptSignInEmail = () => {
    window.location.href = `/sign-in?redirect=${encodeURIComponent(window.location.href)}`
  }

  useEffect(() => {
    if (location) {
      loadLocationData()
    }
  }, [location]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadLocationData = async () => {
    if (!location) return

    try {
      // Decode the location parameter
      const decodedLocation = decodeURIComponent(location)
      
      // Load events for this location
      const locationEvents = await blink.db.events.list({
        where: { location: decodedLocation },
        orderBy: { eventDate: 'desc' }
      })
      setEvents(locationEvents)

      // Load media for these events
      if (locationEvents.length > 0) {
        const eventIds = locationEvents.map(e => e.id)
        const allMedia = await blink.db.media.list({
          orderBy: { createdAt: 'desc' }
        })
        const locationMedia = allMedia.filter(m => eventIds.includes(m.eventId))
        setMedia(locationMedia)

        // Load registrations for these events
        const allRegistrations = await blink.db.eventRegistrations.list({
          orderBy: { registrationDate: 'desc' }
        })
        const locationRegistrations = allRegistrations.filter(r => eventIds.includes(r.eventId))
        setRegistrations(locationRegistrations)

        // Load host info (assuming first event's host represents the location)
        if (locationEvents[0]) {
          const host = await blink.db.users.list({
            where: { id: locationEvents[0].hostId },
            limit: 1
          })
          if (host.length > 0) {
            setHostInfo(host[0])
          }
        }
      }
    } catch (error) {
      console.error('Failed to load location data:', error)
    }
  }

  const registerForEvent = async (eventId: string) => {
    if (!user) {
      window.location.href = `/sign-in?redirect=${encodeURIComponent(window.location.href)}`
      return
    }

    try {
      // Ensure participant profile exists
      try {
        const profile = await blink.db.users.list({ where: { id: user.id }, limit: 1 })
        if (!profile?.[0]) {
          await blink.db.users.create({
            id: user.id,
            email: (user as any).email,
            displayName: (user as any).displayName || (user as any).email,
            role: 'participant',
            status: 'approved'
          })
        }
      } catch (e) {
        console.warn('ensure profile (location) failed:', e)
      }

      // Prevent duplicate registration
      const existing = await blink.db.eventRegistrations.list({
        where: { eventId, participantId: user.id },
        limit: 1
      })
      if (existing.length > 0) {
        alert('You are already registered for this event.')
        return
      }

      await blink.db.eventRegistrations.create({
        eventId,
        participantId: user.id,
        status: 'registered'
      })
      
      // Refresh registrations
      loadLocationData()
      alert('Successfully registered for the event!')
    } catch (error) {
      console.error('Failed to register for event:', error)
      alert('Failed to register for event. Please try again.')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (timeString?: string) => {
    if (!timeString) return ''
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const getMediaIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <ImageIcon className="w-4 h-4" />
    if (fileType.startsWith('video/')) return <Video className="w-4 h-4" />
    return <FileText className="w-4 h-4" />
  }

  const upcomingEvents = events.filter(e => 
    e.status === 'published' && new Date(e.eventDate) >= new Date()
  )
  const pastEvents = events.filter(e => 
    e.status === 'completed' || new Date(e.eventDate) < new Date()
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!location) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="text-center py-12">
            <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Location Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The requested location could not be found.
            </p>
            <Button asChild>
              <Link to="/events">Browse All Events</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const decodedLocation = decodeURIComponent(location)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary-solid text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="sm" asChild className="text-white hover:bg-white/20">
              <Link to="/events">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Events
              </Link>
            </Button>
          </div>
          
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <MapPin className="w-8 h-8" />
                <h1 className="text-3xl lg:text-4xl font-bold">{decodedLocation}</h1>
              </div>
              
              <div className="grid md:grid-cols-3 gap-6 text-white/90">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  <div>
                    <p className="text-sm opacity-80">Total Events</p>
                    <p className="text-xl font-semibold">{events.length}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  <div>
                    <p className="text-sm opacity-80">Total Participants</p>
                    <p className="text-xl font-semibold">{registrations.length}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  <div>
                    <p className="text-sm opacity-80">Completed Events</p>
                    <p className="text-xl font-semibold">{pastEvents.length}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {hostInfo && (
              <Card className="lg:w-80">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={hostInfo.profileImage} />
                      <AvatarFallback>
                        {(hostInfo.displayName || hostInfo.email).charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {hostInfo.displayName || 'Local Host'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {hostInfo.role === 'host' ? 'Community Host' : 'Organizer'}
                      </p>
                    </div>
                  </div>
                  
                  {user && (user.role === 'host' || user.role === 'admin') && (
                    <div className="mt-4 pt-4 border-t">
                      <Button 
                        asChild 
                        className="w-full bg-primary-solid text-white hover:bg-primary/90"
                      >
                        <Link to="/host-dashboard">
                          <Plus className="w-4 h-4 mr-2" />
                          Create Event Here
                        </Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="upcoming">Upcoming Events</TabsTrigger>
            <TabsTrigger value="past">Past Events</TabsTrigger>
            <TabsTrigger value="media">Media Gallery</TabsTrigger>
            <TabsTrigger value="about">About Location</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-foreground">Upcoming Events</h2>
              {!user && (
                <Button onClick={() => {
                  const email = window.prompt('Enter your email to receive a sign-in link:')
                  if (email) {
                    const setupLink = window.location.href
                    blink.notifications.email({ to: email, from: 'welcome@globalgoalsjam.org', subject: 'Sign in to Global Goals Jam', html: `<p>Open: <a href="${setupLink}">${setupLink}</a></p>`, text: `Open: ${setupLink}` }).catch(console.error)
                    alert('If that email exists, we sent a sign-in link. Check your inbox.')
                  }
                }}>
                  Sign In to Register
                </Button>
              )}
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingEvents.map((event) => {
                const eventRegistrations = registrations.filter(r => r.eventId === event.id)
                const isRegistered = user && eventRegistrations.some(r => r.participantId === user.id)
                
                return (
                  <Card key={event.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg line-clamp-2">{event.title}</CardTitle>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge 
                              variant="secondary" 
                              className={`text-xs text-white ${statusColors[event.status as keyof typeof statusColors]}`}
                            >
                              {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <p className="text-sm text-muted-foreground line-clamp-2">
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
                            <Users className="w-4 h-4 text-muted-foreground" />
                            <span>
                              {eventRegistrations.length} registered
                              {event.maxParticipants && ` / ${event.maxParticipants} max`}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 pt-2">
                          <Button 
                            asChild
                            variant="outline"
                            size="sm"
                            className="flex-1"
                          >
                            <Link to={`/events/${event.id}`}>
                              <ExternalLink className="w-4 h-4 mr-1" />
                              View Details
                            </Link>
                          </Button>
                          
                          {user && !isRegistered && event.status === 'published' && (
                            <Button 
                              size="sm" 
                              onClick={() => registerForEvent(event.id)}
                              className="bg-primary-solid text-white hover:bg-primary/90"
                            >
                              Register
                            </Button>
                          )}
                          
                          {isRegistered && (
                            <Badge variant="secondary" className="px-3 py-1">
                              Registered
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {upcomingEvents.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No upcoming events</h3>
                  <p className="text-muted-foreground mb-4">
                    There are currently no upcoming events scheduled for {decodedLocation}.
                  </p>
                  {user && (user.role === 'host' || user.role === 'admin') && (
                    <Button asChild className="bg-primary-solid text-white hover:bg-primary/90">
                      <Link to="/host-dashboard">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Event
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Past Events</h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pastEvents.map((event) => {
                const eventRegistrations = registrations.filter(r => r.eventId === event.id)
                
                return (
                  <Card key={event.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-lg line-clamp-2">{event.title}</CardTitle>
                      <Badge variant="outline" className="w-fit">
                        {formatDate(event.eventDate)}
                      </Badge>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {event.description}
                        </p>
                        
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span>{eventRegistrations.length} participants</span>
                        </div>
                        
                        <Button 
                          asChild
                          variant="outline"
                          size="sm"
                          className="w-full"
                        >
                          <Link to={`/events/${event.id}`}>
                            <ExternalLink className="w-4 h-4 mr-1" />
                            View Event Details
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {pastEvents.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <Award className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No past events</h3>
                  <p className="text-muted-foreground">
                    No events have been completed in {decodedLocation} yet.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="media" className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Media Gallery</h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {media.map((item) => (
                <Card key={item.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg line-clamp-2">{item.title}</CardTitle>
                        <div className="flex items-center gap-2 mt-2">
                          {getMediaIcon(item.fileType)}
                          <span className="text-sm text-muted-foreground">
                            {item.fileType.split('/')[0]}
                          </span>
                          {item.isFeatured && (
                            <Badge variant="secondary" className="text-xs">Featured</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {item.description}
                      </p>
                      
                      {item.sdgTags && (
                        <div className="flex flex-wrap gap-1">
                          {item.sdgTags.split(',').map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag.trim()}
                            </Badge>
                          ))}
                        </div>
                      )}
                      
                      <Button 
                        asChild
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        <a href={item.fileUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4 mr-1" />
                          View Media
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {media.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No media yet</h3>
                  <p className="text-muted-foreground">
                    Media from events in {decodedLocation} will appear here.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="about" className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">About {decodedLocation}</h2>

            <div className="grid lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Location Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-primary" />
                    <span className="font-medium">{decodedLocation}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">{events.length}</p>
                      <p className="text-sm text-muted-foreground">Total Events</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">{registrations.length}</p>
                      <p className="text-sm text-muted-foreground">Participants</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {hostInfo && (
                <Card>
                  <CardHeader>
                    <CardTitle>Local Host</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 mb-4">
                      <Avatar className="w-16 h-16">
                        <AvatarImage src={hostInfo.profileImage} />
                        <AvatarFallback className="text-lg">
                          {(hostInfo.displayName || hostInfo.email).charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-lg font-semibold">
                          {hostInfo.displayName || 'Local Host'}
                        </h3>
                        <p className="text-muted-foreground">
                          {hostInfo.role === 'host' ? 'Community Host' : 'Organizer'}
                        </p>
                      </div>
                    </div>
                    
                    {hostInfo.bio && (
                      <p className="text-sm text-muted-foreground mb-4">
                        {hostInfo.bio}
                      </p>
                    )}
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span>{hostInfo.email}</span>
                      </div>
                      
                      {hostInfo.location && (
                        <div className="flex items-center gap-2 text-sm">
                          <Globe className="w-4 h-4 text-muted-foreground" />
                          <span>{hostInfo.location}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}