import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { Badge } from '../components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import {
  Plus,
  Calendar,
  Users,
  MapPin,
  Edit,
  Trash2,
  Eye,
  Download,
  Upload,
  Image as ImageIcon,
  Award,
  Loader2,
  AlertCircle,
  CheckCircle,
  Share2,
  Check,
  BookOpen,
  Compass,
  FileText,
  Clock
} from 'lucide-react'
import blink, { getFullUser, safeDbCall } from '../lib/blink'
import { getUserProfile, canAccessFeature } from '../lib/userStatus'
import type { UserProfile } from '../lib/userStatus'
import { getStoredUser } from '../lib/auth'
import { appAuth } from '../lib/simpleAuth'
import HostAssets from '../components/HostAssets'
import { FloatingFeedback } from '../components/FloatingFeedback'
import DonateButton from '../components/DonateButton'
import { toast } from 'sonner'

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
  endDate?: string
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
}

interface Registration {
  id: string
  eventId: string
  participantId: string
  registrationDate: string
  status: string
  notes?: string
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-500',
  published: 'bg-green-600',
  ongoing: 'bg-blue-600',
  completed: 'bg-purple-600',
  cancelled: 'bg-red-600'
}

export default function HostDashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const canCreateEvents = profile ? canAccessFeature(profile, 'create_events') : false
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [courseEnrollment, setCourseEnrollment] = useState<any>(null)
  const [hostEligible, setHostEligible] = useState(false)
  const [eligibilityChecked, setEligibilityChecked] = useState(false)
  const [showNewEventDialog, setShowNewEventDialog] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const headerInputRef = useRef<HTMLInputElement | null>(null)
  const [headerUploading, setHeaderUploading] = useState(false)

  // Certificate generation overlay state
  const [certGenerating, setCertGenerating] = useState(false)
  const [certStatus, setCertStatus] = useState('')

  // Form state
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    location: '',
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    maxParticipants: '',
    registrationDeadline: '',
    agenda: '',
    requirements: '',
    coverImage: '',
    hostName: '',
    team: ''
  })

  const loadHostEvents = useCallback(async () => {
    if (!user) return
    try {
      const hostEvents = await safeDbCall(() => blink.db.events.list({
        where: { hostId: user.id },
        orderBy: { createdAt: 'desc' }
      }))
      setEvents(hostEvents)
    } catch (error) {
      console.error('Failed to load host events:', error)
    }
  }, [user])

  const loadRegistrations = useCallback(async () => {
    if (!user) return
    try {
      // Get all registrations then filter by host events
      const allRegistrations = await safeDbCall(() => blink.db.eventRegistrations.list({
        orderBy: { registrationDate: 'desc' },
        limit: 1000
      }))
      const hostEventIds = new Set((events || []).map(e => e.id))
      setRegistrations((allRegistrations || []).filter(r => hostEventIds.has(r.eventId)))
    } catch (error) {
      console.error('Failed to load registrations:', error)
    }
  }, [user, events])

  const loadCourseEnrollment = useCallback(async () => {
    if (!user) return
    try {
      const enrollments = await safeDbCall(() => blink.db.courseEnrollments.list({
        where: { userId: user.id },
        orderBy: { enrolledAt: 'desc' },
        limit: 1
      }), { retries: 2 })
      if (enrollments && enrollments.length > 0) setCourseEnrollment(enrollments[0])
    } catch (error) {
      // Silently handle network errors - course enrollment is optional
      console.debug('Course enrollment check skipped (network or service unavailable):', (error as any)?.code || 'unknown error')
      setCourseEnrollment(null)
    }
  }, [user])

  useEffect(() => {
    const update = async () => {
      setLoading(true)
      setEligibilityChecked(false)
      try {
        // Try multiple sources to get a stable user id
        let full = await getFullUser()
        if (!full) {
          try { full = await getStoredUser() as any } catch { /* ignore */ }
        }
        const local = appAuth.get()
        const userId = (full as any)?.id || local?.id
        const userRole = (full as any)?.role || local?.role

        setUser((full as any) || (local as any) || null)

        if (userId) {
          let eligible = false
          try {
            const profile = await getUserProfile(userId)
            setProfile(profile)
            if (profile) {
              // ROLE-ONLY eligibility: host or admin
              eligible = (profile.role === 'admin' || profile.role === 'host')
            }
          } catch { /* best effort */ }

          setHostEligible(eligible)
        } else {
          setHostEligible(false)
        }
      } catch (err) {
        console.error('HostDashboard update failed:', err)
      } finally {
        setLoading(false)
        setEligibilityChecked(true)
      }
    }

    const unsubscribe = blink.auth.onAuthStateChanged(() => {
      update().catch(console.error)
    })

    update().catch(console.error)

    return unsubscribe
  }, [])

  // Welcome toast when redirected after successful enrollment
  const [searchParams] = useSearchParams()
  useEffect(() => {
    if (searchParams.get('enrolled') === '1') {
      toast.success('Welcome! Your course enrollment is active. Start hosting with your new tools.')
      const params = new URLSearchParams(window.location.search)
      params.delete('enrolled')
      navigate(`${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`, { replace: true })
    }
  }, [searchParams, navigate])

  useEffect(() => {
    if (user && hostEligible) {
      loadHostEvents()
      loadRegistrations()
      loadCourseEnrollment()
    }
  }, [user, hostEligible, loadHostEvents, loadRegistrations, loadCourseEnrollment])

  const handleInputChange = (field: string, value: string) => {
    setEventForm(prev => ({ ...prev, [field]: value }))
  }

  const resetForm = () => {
    setEventForm({
      title: '',
      description: '',
      location: '',
      startDate: '',
      endDate: '',
      startTime: '',
      endTime: '',
      maxParticipants: '',
      registrationDeadline: '',
      agenda: '',
      requirements: '',
      coverImage: '',
      hostName: '',
      team: ''
    })
    setSelectedEvent(null)
  }

  const openEditDialog = (event: Event) => {
    setEventForm({
      title: event.title,
      description: event.description,
      location: event.location,
      startDate: event.eventDate || '',
      endDate: event.endDate || event.eventDate || '',
      startTime: event.startTime || '',
      endTime: event.endTime || '',
      maxParticipants: event.maxParticipants?.toString() || '',
      registrationDeadline: event.registrationDeadline || '',
      agenda: event.agenda || '',
      requirements: event.requirements || '',
      coverImage: event.coverImage || '',
      hostName: event.hostName || (user?.displayName || user?.email || ''),
      team: event.team || ''
    })
    setSelectedEvent(event)
    setShowNewEventDialog(true)
  }

  const saveEvent = async () => {
    if (!user || !eventForm.title.trim() || !eventForm.description.trim() || !eventForm.location.trim() || !eventForm.startDate) {
      alert('Please fill in all required fields')
      return
    }

    // Enforce role-based creation/editing
    if (!canCreateEvents) { alert('Only approved hosts can create or edit events.'); return }
    setSubmitting(true)
    try {
      const eventData = {
        title: eventForm.title.trim(),
        description: eventForm.description.trim(),
        location: eventForm.location.trim(),
        eventDate: eventForm.startDate || undefined,
        endDate: eventForm.endDate || undefined,
        startTime: eventForm.startTime || undefined,
        endTime: eventForm.endTime || undefined,
        maxParticipants: eventForm.maxParticipants ? parseInt(eventForm.maxParticipants) : undefined,
        registrationDeadline: eventForm.registrationDeadline || undefined,
        agenda: eventForm.agenda || undefined,
        requirements: eventForm.requirements || undefined,
        coverImage: eventForm.coverImage || undefined,
        hostName: (eventForm.hostName || '').trim() || user.displayName || user.email,
        team: (eventForm.team || '').trim() || undefined,
        status: 'draft'
      }

      if (selectedEvent) {
        const updated = await safeDbCall(() => blink.db.events.update(selectedEvent.id, { ...eventData, hostId: selectedEvent.hostId || user.id }))
        if (updated && Array.isArray(updated) && updated.length > 0) {
          const rec = updated[0]
          setEvents(prev => prev.map(e => e.id === rec.id ? { ...e, ...rec } as Event : e))
        } else if (updated && (updated as any).id) {
          setEvents(prev => prev.map(e => e.id === (updated as any).id ? { ...e, ...(updated as any) } as Event : e))
        }
      } else {
        const created = await safeDbCall(() => blink.db.events.create({
          ...eventData,
          hostId: user.id
        }))
        if (created) {
          if (Array.isArray(created)) {
            const rec = created[0]
            if (rec) setEvents(prev => [rec as Event, ...prev])
          } else if ((created as any).id) {
            setEvents(prev => [created as Event, ...prev])
          }
        }
      }

      await loadHostEvents()
      resetForm()
      setShowNewEventDialog(false)
    } catch (error) {
      console.error('Failed to save event:', error)
      alert('Failed to save event. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const publishEvent = async (eventId: string) => {
    try {
      await safeDbCall(() => blink.db.events.update(eventId, { status: 'published' }))
      await loadHostEvents()
      toast.success('Event published')
    } catch (error) {
      console.error('Failed to publish event:', error)
      alert('Failed to publish event. Please try again.')
    }
  }

  const completeEvent = async (eventId: string) => {
    try {
      await safeDbCall(() => blink.db.events.update(eventId, { status: 'completed' }))
      await loadHostEvents()
      toast.success('Event marked as completed')
    } catch (error) {
      console.error('Failed to complete event:', error)
      alert('Failed to complete event. Please try again.')
    }
  }

  const deleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) return

    const prev = events
    setEvents(prev.filter(e => e.id !== eventId))

    try {
      try {
        const regs = await safeDbCall(() => blink.db.eventRegistrations.list({ where: { eventId }, limit: 1000 }))
        await Promise.all((regs || []).map((r: any) => safeDbCall(() => blink.db.eventRegistrations.delete(r.id))))
      } catch {}
      try {
        const items = await safeDbCall(() => blink.db.media.list({ where: { eventId }, limit: 1000 }))
        await Promise.all((items || []).map((m: any) => safeDbCall(() => blink.db.media.delete(m.id))))
      } catch {}
      try {
        const certs = await safeDbCall(() => blink.db.certificates.list({ where: { eventId }, limit: 1000 }))
        await Promise.all((certs || []).map((c: any) => safeDbCall(() => blink.db.certificates.delete(c.id))))
      } catch {}

      await safeDbCall(() => blink.db.events.delete(eventId))
      await loadHostEvents()
      toast.success('Event deleted')
    } catch (error) {
      console.error('Failed to delete event:', error)
      setEvents(prev)
      alert('Failed to delete event. Please try again.')
    }
  }

  const formatDate = (dateString: string) => {
    const d = new Date(dateString)
    if (isNaN(d.getTime())) return dateString || 'TBD'
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const viewPublic = (eventId: string) => {
    window.open(`/events/${eventId}`, '_blank')
  }

  const shareEventLink = async (eventId: string) => {
    const url = `${window.location.origin}/events/${eventId}`
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Global Goals Jam Event', url })
      } else {
        await navigator.clipboard.writeText(url)
        toast.success('Event link copied to clipboard')
      }
    } catch {}
  }

  // CSV Export helpers
  async function fetchUsersByIds(ids: string[]): Promise<Record<string, { email?: string; displayName?: string }>> {
    const unique = Array.from(new Set(ids)).filter(Boolean)
    const map: Record<string, { email?: string; displayName?: string }> = {}
    await Promise.all(unique.map(async (id) => {
      try {
        const rows = await safeDbCall(() => blink.db.users.list({ where: { id }, limit: 1 }))
        const u = rows?.[0]
        if (u) map[id] = { email: u.email, displayName: u.displayName }
      } catch {}
    }))
    return map
  }

  async function exportParticipantsCSV(eventId?: string) {
    const rows = eventId ? registrations.filter(r => r.eventId === eventId) : registrations
    if (rows.length === 0) {
      alert('No participants to export yet.')
      return
    }
    const userMap = await fetchUsersByIds(rows.map(r => r.participantId))
    const header = ['event_title','event_id','participant_id','participant_name','participant_email','registration_date']
    const findEventTitle = (id: string) => events.find(e => e.id === id)?.title || ''
    const dataLines = rows.map(r => {
      const u = userMap[r.participantId] || {}
      const name = (u.displayName || '').replaceAll('"','""')
      const email = (u.email || '').replaceAll('"','""')
      const title = (findEventTitle(r.eventId) || '').replaceAll('"','""')
      return `"${title}","${r.eventId}","${r.participantId}","${name}","${email}","${r.registrationDate}"`
    })
    const csv = [header.join(','), ...dataLines].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = eventId ? `participants_${eventId}.csv` : 'participants_all_events.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (loading || !eligibilityChecked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user || !hostEligible) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
            <p className="text-muted-foreground mb-4">
              Host role required to access this dashboard.
            </p>
            <div className="grid gap-2">
              <Button onClick={() => { window.location.href = `/profile` }}>
                Request Host Access
              </Button>
              <Button variant="outline" onClick={() => { window.location.href = `/` }}>
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background relative">
      <FloatingFeedback context="host" userEmail={user?.email || ''} userName={user?.displayName || ''} />

      {certGenerating && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 shadow-xl w-[320px] text-center">
            <div className="mx-auto mb-4 w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            <h3 className="text-lg font-semibold">Working…</h3>
            <p className="text-sm text-muted-foreground mt-1">{certStatus || 'Please wait a moment'}</p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Host Dashboard</h1>
              <p className="text-muted-foreground">Manage your Global Goals Jam events and engage with your community.</p>
            </div>
            <DonateButton variant="outline" size="default" className="self-start sm:self-auto" />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Events</p>
                  <p className="text-2xl font-bold text-primary">{events.length}</p>
                </div>
                <Calendar className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Participants</p>
                  <p className="text-2xl font-bold text-primary">{registrations.length}</p>
                </div>
                <Users className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Published Events</p>
                  <p className="text-2xl font-bold text-primary">{events.filter(e => e.status === 'published').length}</p>
                </div>
                <Check className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completed Events</p>
                  <p className="text-2xl font-bold text-primary">{events.filter(e => e.status === 'completed').length}</p>
                </div>
                <Award className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Access */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Quick Access</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => { const a = document.createElement('a'); a.href = '/assets/ggj_assets.zip'; a.download = ''; document.body.appendChild(a); a.click(); document.body.removeChild(a); }} >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <ImageIcon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">Brand Assets</h3>
                    <p className="text-sm text-muted-foreground">Logos & visual elements</p>
                  </div>
                  <Download className="w-4 h-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.open('/assets/ggj_info_booklet.pdf', '_blank')}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">Instruction Guide</h3>
                    <p className="text-sm text-muted-foreground">Full jam overview</p>
                  </div>
                  <Eye className="w-4 h-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            <Link to="/organizer-booklet" className="block">
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">Organizer Booklet</h3>
                      <p className="text-sm text-muted-foreground">Interactive toolkit</p>
                    </div>
                    <Compass className="w-4 h-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        <Tabs defaultValue="events" className="w-full">
          <TabsList className="grid w-full grid-cols-4 md:grid-cols-5">
            <TabsTrigger value="events">My Events</TabsTrigger>
            <TabsTrigger value="participants">Participants</TabsTrigger>
            <TabsTrigger value="certificates">Certificates</TabsTrigger>
            <TabsTrigger value="courses">My Courses</TabsTrigger>
            <TabsTrigger value="assets">Assets</TabsTrigger>
          </TabsList>

          <TabsContent value="events" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground">My Events</h2>
              <Dialog open={showNewEventDialog} onOpenChange={setShowNewEventDialog}>
                <DialogTrigger asChild>
                  <Button onClick={resetForm} className="bg-primary-solid text-white hover:bg-primary/90">
                    <Plus className="w-4 h-4 mr-2" /> New Event
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{selectedEvent ? 'Edit Event' : 'Create New Event'}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="title">Event Title *</Label>
                        <Input id="title" value={eventForm.title} onChange={(e) => handleInputChange('title', e.target.value)} placeholder="Enter event title..." />
                      </div>
                      <div>
                        <Label htmlFor="location">Location *</Label>
                        <Input id="location" value={eventForm.location} onChange={(e) => handleInputChange('location', e.target.value)} placeholder="Enter event location..." />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="description">Description *</Label>
                      <Textarea id="description" value={eventForm.description} onChange={(e) => handleInputChange('description', e.target.value)} placeholder="Describe your event..." className="min-h-[100px]" />
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="startDate">Start Date *</Label>
                        <Input id="startDate" type="date" value={eventForm.startDate} onChange={(e) => handleInputChange('startDate', e.target.value)} />
                      </div>
                      <div>
                        <Label htmlFor="endDate">End Date</Label>
                        <Input id="endDate" type="date" value={eventForm.endDate} onChange={(e) => handleInputChange('endDate', e.target.value)} />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor="startTime">Start Time</Label>
                          <Input id="startTime" type="time" value={eventForm.startTime} onChange={(e) => handleInputChange('startTime', e.target.value)} />
                        </div>
                        <div>
                          <Label htmlFor="endTime">End Time</Label>
                          <Input id="endTime" type="time" value={eventForm.endTime} onChange={(e) => handleInputChange('endTime', e.target.value)} />
                        </div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="hostName">Host</Label>
                        <Input id="hostName" value={eventForm.hostName} onChange={(e) => handleInputChange('hostName', e.target.value)} placeholder="e.g., Jane Doe" />
                      </div>
                      <div>
                        <Label htmlFor="team">Team (comma-separated)</Label>
                        <Textarea id="team" value={eventForm.team} onChange={(e) => handleInputChange('team', e.target.value)} placeholder="e.g., Alice, Bob, Charlie" className="min-h-[60px]" />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="maxParticipants">Max Participants</Label>
                        <Input id="maxParticipants" type="number" value={eventForm.maxParticipants} onChange={(e) => handleInputChange('maxParticipants', e.target.value)} placeholder="Leave empty for unlimited" />
                      </div>
                      <div>
                        <Label htmlFor="registrationDeadline">Registration Deadline</Label>
                        <Input id="registrationDeadline" type="date" value={eventForm.registrationDeadline} onChange={(e) => handleInputChange('registrationDeadline', e.target.value)} />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="agenda">Agenda</Label>
                      <Textarea id="agenda" value={eventForm.agenda} onChange={(e) => handleInputChange('agenda', e.target.value)} placeholder="Event agenda and schedule..." className="min-h-[100px]" />
                    </div>

                    <div>
                      <Label htmlFor="requirements">Requirements</Label>
                      <Textarea id="requirements" value={eventForm.requirements} onChange={(e) => handleInputChange('requirements', e.target.value)} placeholder="What participants should bring or prepare..." />
                    </div>

                    <div>
                      <Label>Header Photo (optional)</Label>
                      <div className="mt-2 rounded-lg border overflow-hidden">
                        {eventForm.coverImage ? (
                          <img src={eventForm.coverImage} alt="Header" className="w-full h-40 object-cover" />
                        ) : (
                          <div className="h-40 bg-muted flex items-center justify-center text-muted-foreground"><ImageIcon className="w-6 h-6 mr-2" /> No image selected</div>
                        )}
                      </div>
                      <div className="flex gap-2 mt-2">
                        <input
                          ref={headerInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.currentTarget.files?.[0]
                            if (!file) return
                            setHeaderUploading(true)
                            try {
                              const { publicUrl } = await blink.storage.upload(
                                file,
                                `events/headers/${user?.id || 'unknown'}/${Date.now()}.${file.name.split('.').pop()}`,
                                { upsert: true }
                              )
                              setEventForm(prev => ({ ...prev, coverImage: publicUrl }))
                            } catch (err) {
                              console.error('Header upload failed:', err)
                              alert('Failed to upload image. Please try again.')
                            } finally {
                              setHeaderUploading(false)
                              e.currentTarget.value = ''
                            }
                          }}
                        />
                        <Button variant="outline" onClick={() => headerInputRef.current?.click()} disabled={headerUploading}>
                          <Upload className="w-4 h-4 mr-2" /> {headerUploading ? 'Uploading…' : 'Upload Image'}
                        </Button>
                        {eventForm.coverImage && (
                          <Button variant="ghost" onClick={() => setEventForm(prev => ({ ...prev, coverImage: '' }))}>
                            <Trash2 className="w-4 h-4 mr-2" /> Remove
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" onClick={() => setShowNewEventDialog(false)}>Cancel</Button>
                      <Button onClick={saveEvent} disabled={submitting} className="bg-primary-solid text-white hover:bg-primary/90">
                        {submitting ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>) : (selectedEvent ? 'Update Event' : 'Create Event')}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
                </Dialog>
              ) : (
                <div className="text-sm text-muted-foreground">
                  Host role required to create events.
                </div>
              )}
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <Card key={event.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg line-clamp-2">{event.title}</CardTitle>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary" className={`text-xs text-white ${statusColors[event.status] || 'bg-gray-500'}`}>
                            {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span>{event.eventDate ? (event.endDate ? `${formatDate(event.eventDate)} — ${formatDate(event.endDate)}` : formatDate(event.eventDate)) : '—'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span className="line-clamp-1">{event.location}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span>{registrations.filter(r => r.eventId === event.id).length} registered{event.maxParticipants && ` / ${event.maxParticipants} max`}</span>
                        </div>

                        <div className="flex flex-wrap gap-2 pt-2">
                          {canCreateEvents && (
                            <Button size="sm" variant="outline" onClick={() => openEditDialog(event)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                          <Link to={`/events/${event.id}/results`}>
                            <Button size="sm" className="bg-primary-solid text-white hover:bg-primary/90">
                              <Upload className="w-4 h-4 mr-1" /> Add Results
                            </Button>
                          </Link>
                          <Button size="sm" variant="outline" onClick={() => viewPublic(event.id)}>
                            <Eye className="w-4 h-4 mr-1" /> View
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => shareEventLink(event.id)}>
                            <Share2 className="w-4 h-4 mr-1" /> Share
                          </Button>
                          {event.status === 'draft' && canCreateEvents && (
                            <Button size="sm" onClick={() => publishEvent(event.id)} className="bg-green-600 text-white hover:bg-green-700">
                              Publish
                            </Button>
                          )}
                          {(event.status === 'published' || event.status === 'ongoing') && canCreateEvents && (
                            <Button size="sm" onClick={() => completeEvent(event.id)} className="bg-purple-600 text-white hover:bg-purple-700">
                              Complete
                            </Button>
                          )}
                          {canCreateEvents && (
                            <Button size="sm" variant="destructive" onClick={() => deleteEvent(event.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {events.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No events yet</h3>
                  <p className="text-muted-foreground mb-4">Create your first Global Goals Jam event to get started!</p>
                  {canCreateEvents ? (
                    <Button onClick={() => { resetForm(); setShowNewEventDialog(true) }} className="bg-primary-solid text-white hover:bg-primary/90">
                      <Plus className="w-4 h-4 mr-2" /> Create First Event
                    </Button>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      Host role required to create events.
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="participants" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground">Event Participants</h2>
              <Button variant="outline" onClick={() => exportParticipantsCSV()}>
                <Download className="w-4 h-4 mr-2" /> Export All CSV
              </Button>
            </div>

            <div className="space-y-4">
              {events.map((event) => {
                const eventRegistrations = registrations.filter(r => r.eventId === event.id)
                if (eventRegistrations.length === 0) return null
                return (
                  <Card key={event.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{event.title}</CardTitle>
                          <p className="text-sm text-muted-foreground">{eventRegistrations.length} participants registered</p>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => exportParticipantsCSV(event.id)}>
                          <Download className="w-4 h-4 mr-2" /> Export CSV
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {eventRegistrations.map((registration) => (
                          <div key={registration.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <div>
                              <p className="font-medium">Participant</p>
                              <p className="text-sm text-muted-foreground">Registered {formatDate(registration.registrationDate)}</p>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => window.open(`/events/${event.id}`, '_blank')}>
                                <Eye className="w-4 h-4 mr-1" /> View Event
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}

              {registrations.length === 0 && (
                <Card>
                  <CardContent className="text-center py-12">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No participants yet</h3>
                    <p className="text-muted-foreground">Participants will appear here once they register for your events.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="certificates" className="space-y-6">
            <Card>
              <CardContent className="grid md:grid-cols-2 gap-6 py-8">
                <div className="text-center p-6 border rounded-lg">
                  <Award className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <h3 className="text-base font-semibold mb-1">Participant Certificates</h3>
                  <p className="text-sm text-muted-foreground mb-4">Generate participation certificates for your event attendees from the Participants tab.</p>
                </div>
                <div className="text-center p-6 border rounded-lg">
                  <Award className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <h3 className="text-base font-semibold mb-1">Host Certificate</h3>
                  <p className="text-sm text-muted-foreground mb-4">Generate your own certificate as proof of hosting from your course dashboard.</p>
                  <Button className="bg-primary-solid text-white hover:bg-primary/90" onClick={() => navigate('/course/dashboard')}>Open Course Dashboard</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="courses" className="space-y-6">
            <Card>
              <CardContent className="py-8 text-center">
                <h3 className="text-lg font-semibold mb-2">Host Certification Course</h3>
                <p className="text-sm text-muted-foreground mb-4">Access your modules, progress, and certificate.</p>
                <Button className="bg-primary-solid text-white hover:bg-primary/90" onClick={() => navigate('/course/dashboard')}>Go to Course</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assets" className="space-y-6">
            <HostAssets />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
