import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import blink, { safeDbCall } from '../lib/blink'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar'
import { Calendar, MapPin, Users, ArrowLeft, Image as ImageIcon, FileText, Link as LinkIcon, Share2 } from 'lucide-react'
import { cn } from '../lib/utils'

interface UserRow {
  id: string
  email: string
  displayName?: string
  profileImage?: string
  bio?: string
  location?: string
  role: string
}

interface EventRow {
  id: string
  title: string
  description?: string
  eventDate: string
  location: string
  status: string
  sdgFocus?: string
}

interface MediaItem {
  id: string
  uploadedBy: string
  title: string
  description?: string
  fileUrl: string
  fileType: string
  createdAt: string
}

export default function HostPage() {
  const { id } = useParams<{ id: string }>()
  const [host, setHost] = useState<UserRow | null>(null)
  const [events, setEvents] = useState<EventRow[]>([])
  const [media, setMedia] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      if (!id) return
      setLoading(true)
      try {
        const users = await safeDbCall(() => blink.db.users.list<UserRow>({ where: { id }, limit: 1 }))
        setHost(users[0] || null)

        const evs = await safeDbCall(() => blink.db.events.list<EventRow>({ where: { hostId: id }, orderBy: { eventDate: 'desc' }, limit: 200 }))
        setEvents(evs)

        const recent = await safeDbCall(() => blink.db.media.list<MediaItem>({ where: { uploadedBy: id }, orderBy: { createdAt: 'desc' }, limit: 12 }))
        setMedia(recent)
      } catch (e) {
        console.error('Failed to load host page:', e)
      } finally {
        setLoading(false)
      }
    }
    load().catch(console.error)
  }, [id])

  const archived = useMemo(() => {
    const now = new Date()
    return events.filter(e => e.status === 'completed' || new Date(e.eventDate) < now)
  }, [events])

  const upcoming = useMemo(() => {
    const now = new Date()
    return events
      .filter(e => e.status !== 'completed' && new Date(e.eventDate) >= now)
      .sort((a,b) => +new Date(a.eventDate) - +new Date(b.eventDate))
  }, [events])

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })

  const isImage = (m: MediaItem) => (m.fileType || '').toLowerCase().startsWith('image/') || /\.(png|jpg|jpeg|gif|webp)$/i.test(m.fileUrl)

  const shareHostLink = async () => {
    const url = `${window.location.origin}/host/${host?.id}`
    try {
      if (navigator.share) await navigator.share({ title: host?.displayName || host?.email || 'Host', url })
      else { await navigator.clipboard.writeText(url); }
      alert('Host page link copied')
    } catch {}
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  if (!host) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="text-center py-12">
            <h2 className="text-xl font-semibold mb-2">Host Not Found</h2>
            <p className="text-muted-foreground mb-4">This host profile does not exist.</p>
            <Link to="/events"><Button><ArrowLeft className="w-4 h-4 mr-2" /> Back to Events</Button></Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Header */}
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={host.profileImage} alt={host.displayName || host.email} />
            <AvatarFallback>{(host.displayName || host.email).charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-bold truncate">{host.displayName || host.email}</h1>
            {host.location && <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1"><MapPin className="w-4 h-4" /> {host.location}</div>}
            {host.bio && <p className="mt-3 text-muted-foreground whitespace-pre-wrap">{host.bio}</p>}
          </div>
          <div className="flex-shrink-0">
            <Button variant="outline" onClick={shareHostLink}>
              <Share2 className="w-4 h-4 mr-2" /> Share Host Page
            </Button>
          </div>
        </div>

        {/* Upcoming events */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">Upcoming Events</h2>
            <Badge variant="secondary">{upcoming.length}</Badge>
          </div>
          {upcoming.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">No upcoming events.</CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcoming.map(ev => (
                <Card key={ev.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg line-clamp-2">{ev.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-muted-foreground" /><span>{formatDate(ev.eventDate)}</span></div>
                      <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-muted-foreground" /><span className="line-clamp-1">{ev.location}</span></div>
                    </div>
                    <div className="pt-3">
                      <Link to={`/events/${ev.id}`}><Button variant="outline" className="w-full">View Event</Button></Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Archived events */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">Archived Events</h2>
            <Badge variant="secondary">{archived.length}</Badge>
          </div>
          {archived.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">No archived events yet.</CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {archived.map(ev => (
                <Card key={ev.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg line-clamp-2">{ev.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-muted-foreground" /><span>{formatDate(ev.eventDate)}</span></div>
                      <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-muted-foreground" /><span className="line-clamp-1">{ev.location}</span></div>
                    </div>
                    <div className="pt-3">
                      <Link to={`/events/${ev.id}`}><Button variant="outline" className="w-full">View Event</Button></Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Recent Results */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">Recent Results</h2>
            <Badge variant="secondary">{media.length}</Badge>
          </div>
          {media.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">No results uploaded yet.</CardContent>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {media.map(m => (
                <a key={m.id} href={m.fileUrl} target="_blank" rel="noreferrer" className="group border rounded-lg overflow-hidden bg-card">
                  {isImage(m) ? (
                    <img src={m.fileUrl} alt={m.title} className="w-full h-40 object-cover" />
                  ) : m.fileType === 'link' ? (
                    <div className="w-full h-40 bg-muted flex items-center justify-center"><LinkIcon className="w-8 h-8 text-muted-foreground" /></div>
                  ) : (
                    <div className="w-full h-40 bg-muted flex items-center justify-center"><FileText className="w-8 h-8 text-muted-foreground" /></div>
                  )}
                  <div className="p-3">
                    <div className="text-sm font-medium truncate">{m.title || 'Untitled'}</div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
