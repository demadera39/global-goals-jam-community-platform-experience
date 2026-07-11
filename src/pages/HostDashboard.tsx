import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { Badge } from '../components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Progress } from '../components/ui/progress'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
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
  Link as LinkIcon,
  Code,
  Clipboard,
  Check,
  BookOpen,
  Compass,
  FileText,
  Clock,
  FileUp,
  UserPlus,
  ArrowRight
} from 'lucide-react'
import { LEARN_URL } from '../lib/learnUrl'
import { db, auth, storage, safeDbCall, supabase } from '../lib/supabase'
import { stripHtml } from '../lib/utils'
import { getFullUser } from '../lib/userProfile'
import { getUserProfile, canAccessFeature } from '../lib/userStatus'
import type { UserProfile } from '../lib/userStatus'
import { getStoredUser } from '../lib/auth'
import { appAuth } from '../lib/simpleAuth'
import HostAssets from '../components/HostAssets'
import { showCertificateInNewTab } from '../lib/certificates'
import { FloatingFeedback } from '../components/FloatingFeedback'
import DonateButton from '../components/DonateButton'
import RichTextEditor from '../components/RichTextEditor'
import { toast } from 'sonner'
import { invalidateEventsCache } from '../hooks/usePublishedEvents'

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
  firstName?: string
  lastName?: string
  registrationDate: string
  status: string
  notes?: string
}

const statusColors: Record<string, string> = {
  draft: 'bg-pastel-amber text-amber-800',
  published: 'bg-pastel-green text-primary/80',
  ongoing: 'bg-pastel-sky text-sky-800',
  completed: 'bg-pastel-violet text-violet-800',
  cancelled: 'bg-pastel-rose text-rose-800'
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
  // Inline validation: which required event fields are currently flagged empty
  const [eventFieldErrors, setEventFieldErrors] = useState<{ title?: boolean; location?: boolean; description?: boolean; startDate?: boolean }>({})
  const headerInputRef = useRef<HTMLInputElement | null>(null)
  const [headerUploading, setHeaderUploading] = useState(false)

  // Media manager state
  const [mediaItems, setMediaItems] = useState<any[]>([])
  const mediaInputRef = useRef<HTMLInputElement | null>(null)
  const [mediaUploading, setMediaUploading] = useState(false)
  const [newLink, setNewLink] = useState({ title: '', url: '', eventId: '' })

  // Manual participant add state
  const [addParticipantEventId, setAddParticipantEventId] = useState('')
  const [newParticipant, setNewParticipant] = useState({ firstName: '', lastName: '' })
  const [addingParticipant, setAddingParticipant] = useState(false)
  const csvInputRef = useRef<HTMLInputElement | null>(null)

  // Certificate generation overlay state
  const [certGenerating, setCertGenerating] = useState(false)
  const [certStatus, setCertStatus] = useState('')

  // Which management tab is open — controlled so the lifecycle rail can jump to a tab
  const [activeTab, setActiveTab] = useState('events')
  const tabsRef = useRef<HTMLDivElement | null>(null)

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
    team: '',
    manualParticipantCount: '',
    customRegistrationLink: ''
  })

  const loadHostEvents = useCallback(async () => {
    if (!user) return
    try {
      const hostEvents = await safeDbCall(() => db.events.list({
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
      const allRegistrations = await safeDbCall(() => db.eventRegistrations.list({
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
      const enrollments = await safeDbCall(() => db.courseEnrollments.list({
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

  const loadMedia = useCallback(async () => {
    if (!user) return
    try {
      const items = await safeDbCall(() => db.media.list({
        where: { uploadedBy: user.id },
        orderBy: { createdAt: 'desc' },
        limit: 200
      }))
      setMediaItems(items || [])
    } catch (error) {
      console.error('Failed to load media:', error)
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
          let isApprovedHost = false
          try {
            const profile = await getUserProfile(userId)
            setProfile(profile)
            if (profile) {
              // ROLE-ONLY eligibility: host or admin
              if (profile.role === 'admin' || profile.role === 'host') {
                isApprovedHost = true
              }
            }
          } catch { /* best effort */ }

          setHostEligible(isApprovedHost)
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

    const unsubscribe = auth.onAuthStateChanged(() => {
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
    if (user && eligibilityChecked) {
      loadCourseEnrollment()
      if (hostEligible) {
        loadHostEvents()
        loadRegistrations()
        loadMedia()
      }
    }
  }, [user, hostEligible, eligibilityChecked, loadHostEvents, loadRegistrations, loadCourseEnrollment, loadMedia])

  const handleInputChange = (field: string, value: string) => {
    setEventForm(prev => ({ ...prev, [field]: value }))
    // Clear the inline error for this field as soon as the user provides a value
    if (value && value.trim() && field in eventFieldErrors) {
      setEventFieldErrors(prev => ({ ...prev, [field]: false }))
    }
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
      team: '',
      manualParticipantCount: '',
      customRegistrationLink: ''
    })
    setSelectedEvent(null)
    setEventFieldErrors({})
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
      team: event.team || '',
      manualParticipantCount: (event as any).manualParticipantCount || '',
      customRegistrationLink: (event as any).customRegistrationLink || ''
    })
    setSelectedEvent(event)
    setShowNewEventDialog(true)
  }

  const saveEvent = async () => {
    // Tell the user exactly which field is missing instead of a generic toast —
    // people were filling everything in but still hitting this.
    if (!user) { toast.error('You must be signed in to create an event'); return }
    const errs = {
      title: !eventForm.title.trim(),
      location: !eventForm.location.trim(),
      description: !eventForm.description.trim(),
      startDate: !eventForm.startDate,
    }
    const missing = Object.entries(errs).filter(([, v]) => v).map(([k]) =>
      k === 'startDate' ? 'Start date' : k.charAt(0).toUpperCase() + k.slice(1)
    )
    if (missing.length) {
      setEventFieldErrors(errs)
      toast.error(`Please fill in the highlighted field${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}`)
      console.warn('[saveEvent] missing fields:', missing, { eventForm })
      return
    }
    setEventFieldErrors({})

    // Enforce role-based creation/editing. If this trips when the admin sees the
    // user as a host, the most likely cause is profile load not finishing (or
    // a stale localStorage), so include diagnostics in the toast/console.
    if (!canCreateEvents) {
      console.error('[saveEvent] canCreateEvents=false', { profile, user, hostEligible })
      if (!profile) {
        toast.error('Your profile is still loading — give it a moment and try again.')
      } else if (profile.role !== 'host' && profile.role !== 'admin') {
        toast.error(`Your account role is "${profile.role}", which can't create events. Email marco@globalgoalsjam.org if this is wrong.`)
      } else if (profile.status !== 'approved') {
        toast.error(`Your account status is "${profile.status}" — must be "approved" to create events.`)
      } else {
        toast.error('Cannot create events right now. Sign out and back in, then try again.')
      }
      return
    }
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
        manualParticipantCount: eventForm.manualParticipantCount || undefined,
        customRegistrationLink: eventForm.customRegistrationLink || undefined,
        status: 'draft'
      }

      if (selectedEvent) {
        const updated = await safeDbCall(() => db.events.update(selectedEvent.id, { ...eventData, hostId: selectedEvent.hostId || user.id }))
        if (updated && Array.isArray(updated) && updated.length > 0) {
          const rec = updated[0]
          setEvents(prev => prev.map(e => e.id === rec.id ? { ...e, ...rec } as Event : e))
        } else if (updated && (updated as any).id) {
          setEvents(prev => prev.map(e => e.id === (updated as any).id ? { ...e, ...(updated as any) } as Event : e))
        }
      } else {
        const created = await safeDbCall(() => db.events.create({
          // The deployed events.id column has no working default, so generate
          // one client-side (same pattern used for enrollments). Without this
          // every insert sends id=null and Postgres rejects it with 23502.
          id: (crypto?.randomUUID?.() || `evt_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`),
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
      // Invalidate the global events cache so other components refresh
      invalidateEventsCache()
      resetForm()
      setShowNewEventDialog(false)
    } catch (error: any) {
      // Surface the real error so hosts can actually act on it (or send us a
      // useful screenshot). Common shapes from supabase-js: { message, code,
      // details, hint } or a plain Error.
      console.error('Failed to save event:', error)
      const code = error?.code || error?.status || ''
      const detail = error?.details || error?.hint || ''
      const baseMsg = error?.message || (typeof error === 'string' ? error : 'Unknown error')
      const friendly =
        code === '23505' ? 'An event with the same id already exists.' :
        code === '23503' ? 'Your account record is missing — sign out and back in, then try again.' :
        code === '42501' || /row-level security|rls|permission/i.test(baseMsg) ?
          'Permission denied by the database. Your session may have expired — sign out and back in.' :
        code === 'PGRST301' || /jwt expired|invalid jwt/i.test(baseMsg) ?
          'Your session expired. Sign in again.' :
        ''
      const full = [friendly || 'Failed to save event.', baseMsg, detail].filter(Boolean).join(' — ')
      toast.error(full, { duration: 10000 })
    } finally {
      setSubmitting(false)
    }
  }

  const publishEvent = async (eventId: string) => {
    try {
      await safeDbCall(() => db.events.update(eventId, { status: 'published' }))
      await loadHostEvents()
      invalidateEventsCache()
      toast.success('Event published')
    } catch (error) {
      console.error('Failed to publish event:', error)
      toast.error('Failed to publish event. Please try again.')
    }
  }

  const completeEvent = async (eventId: string) => {
    try {
      await safeDbCall(() => db.events.update(eventId, { status: 'completed' }))
      await loadHostEvents()
      invalidateEventsCache()
      toast.success('Event marked as completed')
    } catch (error) {
      console.error('Failed to complete event:', error)
      toast.error('Failed to complete event. Please try again.')
    }
  }

  const deleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) return

    const prev = events
    setEvents(prev.filter(e => e.id !== eventId))

    try {
      try {
        const regs = await safeDbCall(() => db.eventRegistrations.list({ where: { eventId }, limit: 1000 }))
        await Promise.all((regs || []).map((r: any) => safeDbCall(() => db.eventRegistrations.delete(r.id))))
      } catch {}
      try {
        const items = await safeDbCall(() => db.media.list({ where: { eventId }, limit: 1000 }))
        await Promise.all((items || []).map((m: any) => safeDbCall(() => db.media.delete(m.id))))
      } catch {}
      try {
        const certs = await safeDbCall(() => db.certificates.list({ where: { eventId }, limit: 1000 }))
        await Promise.all((certs || []).map((c: any) => safeDbCall(() => db.certificates.delete(c.id))))
      } catch {}

      await safeDbCall(() => db.events.delete(eventId))
      await loadHostEvents()
      invalidateEventsCache()
      toast.success('Event deleted')
    } catch (error) {
      console.error('Failed to delete event:', error)
      setEvents(prev)
      toast.error('Failed to delete event. Please try again.')
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

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Copied to clipboard')
    } catch {
      toast.error('Copy failed. Please copy manually.')
    }
  }

  const handleMediaFile = async (file: File, eventId?: string) => {
    if (!user) return
    setMediaUploading(true)
    try {
      const { publicUrl } = await storage.upload(
        file,
        `media/${user.id}/${Date.now()}.${file.name.split('.').pop()}`,
        { upsert: true }
      )
      const created = await safeDbCall(() => db.media.create({
        uploadedBy: user.id,
        title: file.name,
        description: '',
        fileUrl: publicUrl,
        fileType: file.type || 'image/*',
        eventId: eventId || undefined
      }))
      if (created) {
        const rec = Array.isArray(created) ? created[0] : created
        setMediaItems(prev => [rec as any, ...prev])
      }
      toast.success('Media uploaded')
    } catch (e) {
      console.error('Upload failed:', e)
      toast.error('Upload failed')
    } finally {
      setMediaUploading(false)
    }
  }

  const handleAddLink = async () => {
    if (!user || !newLink.url.trim() || !newLink.title.trim()) return
    try {
      const created = await safeDbCall(() => db.media.create({
        uploadedBy: user.id,
        title: newLink.title.trim(),
        description: '',
        fileUrl: newLink.url.trim(),
        fileType: 'link',
        eventId: (newLink.eventId && newLink.eventId !== '_none') ? newLink.eventId : undefined
      }))
      if (created) {
        const rec = Array.isArray(created) ? created[0] : created
        setMediaItems(prev => [rec as any, ...prev])
      }
      setNewLink({ title: '', url: '', eventId: '' })
      toast.success('Link added')
    } catch (e) {
      console.error('Add link failed:', e)
      toast.error('Add link failed')
    }
  }

  // The event_registrations.id column lost its server-side default during the
  // Blink migration, so we generate one client-side too (32-char hex, matching
  // the table's existing id format). A DB-default migration backs this up.
  const newRegistrationId = () =>
    (crypto?.randomUUID?.() || `reg_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`).replace(/-/g, '')

  // Manual participant add
  const handleAddParticipant = async () => {
    if (!newParticipant.firstName.trim() || !newParticipant.lastName.trim() || !addParticipantEventId) return
    setAddingParticipant(true)
    try {
      const created = await safeDbCall(() => db.eventRegistrations.create({
        id: newRegistrationId(),
        eventId: addParticipantEventId,
        participantId: `manual_${Date.now()}`,
        firstName: newParticipant.firstName.trim(),
        lastName: newParticipant.lastName.trim(),
        status: 'registered',
      }))
      if (created) {
        const rec = Array.isArray(created) ? created[0] : created
        setRegistrations(prev => [rec as any, ...prev])
      }
      setNewParticipant({ firstName: '', lastName: '' })
      toast.success('Participant added')
    } catch (e) {
      console.error('Add participant failed:', e)
      toast.error('Failed to add participant')
    } finally {
      setAddingParticipant(false)
    }
  }

  // CSV upload handler (expects: First Name, Last Name)
  const handleCSVUpload = async (file: File) => {
    if (!addParticipantEventId) {
      toast.error('Please select an event first')
      return
    }
    const text = await file.text()
    const lines = text.split(/\r?\n/).filter(l => l.trim())
    if (lines.length === 0) { toast.error('CSV file is empty'); return }

    // Detect if first line is header
    const firstLine = lines[0].toLowerCase()
    const startIndex = (firstLine.includes('name') || firstLine.includes('first') || firstLine.includes('last')) ? 1 : 0

    const participants: { firstName: string; lastName: string }[] = []
    for (let i = startIndex; i < lines.length; i++) {
      // Support both comma and semicolon separators, handle quoted fields
      const parts = lines[i].match(/(".*?"|[^",;\t]+)/g)?.map(s => s.replace(/^"|"$/g, '').trim()) || []
      if (parts.length >= 2) {
        participants.push({ firstName: parts[0], lastName: parts[1] })
      } else if (parts.length === 1 && parts[0].includes(' ')) {
        // Single "Full Name" column - split on first space
        const [first, ...rest] = parts[0].split(' ')
        participants.push({ firstName: first, lastName: rest.join(' ') })
      }
    }

    if (participants.length === 0) {
      toast.error('No valid participants found. Use: First Name, Last Name')
      return
    }

    setAddingParticipant(true)
    let added = 0
    for (const p of participants) {
      try {
        const created = await safeDbCall(() => db.eventRegistrations.create({
          id: newRegistrationId(),
          eventId: addParticipantEventId,
          participantId: `manual_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          firstName: p.firstName,
          lastName: p.lastName,
          status: 'registered',
        }))
        if (created) {
          const rec = Array.isArray(created) ? created[0] : created
          setRegistrations(prev => [rec as any, ...prev])
          added++
        }
      } catch (e) {
        console.error('Failed to add participant:', p, e)
      }
    }
    setAddingParticipant(false)
    toast.success(`Added ${added} participant${added !== 1 ? 's' : ''} from CSV`)
  }

  // CSV Export helpers
  async function fetchUsersByIds(ids: string[]): Promise<Record<string, { email?: string; displayName?: string }>> {
    const unique = Array.from(new Set(ids)).filter(Boolean)
    const map: Record<string, { email?: string; displayName?: string }> = {}
    await Promise.all(unique.map(async (id) => {
      try {
        const rows = await safeDbCall(() => db.users.list({ where: { id }, limit: 1 }))
        const u = rows?.[0]
        if (u) map[id] = { email: u.email, displayName: u.displayName }
      } catch {}
    }))
    return map
  }

  async function exportParticipantsCSV(eventId?: string) {
    const rows = eventId ? registrations.filter(r => r.eventId === eventId) : registrations
    if (rows.length === 0) {
      toast.info('No participants to export yet.')
      return
    }
    const nonManualIds = rows.map(r => r.participantId).filter(id => id && !id.startsWith('manual_'))
    const userMap = await fetchUsersByIds(nonManualIds)
    const header = ['event_title','first_name','last_name','participant_email','registration_date']
    const findEventTitle = (id: string) => events.find(e => e.id === id)?.title || ''
    const dataLines = rows.map(r => {
      const u = userMap[r.participantId] || {}
      const firstName = (r.firstName || '').replaceAll('"','""')
      const lastName = (r.lastName || '').replaceAll('"','""')
      const displayName = u.displayName || ''
      const fn = firstName || displayName.split(' ')[0] || ''
      const ln = lastName || displayName.split(' ').slice(1).join(' ') || ''
      const email = (u.email || '').replaceAll('"','""')
      const title = (findEventTitle(r.eventId) || '').replaceAll('"','""')
      return `"${title}","${fn.replaceAll('"','""')}","${ln.replaceAll('"','""')}","${email}","${r.registrationDate}"`
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F6FAF7] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F6FAF7] flex items-center justify-center">
        <Card variant="flat" className="max-w-md rounded-2xl border-[#dfe9e2] bg-white shadow-sm">
          <CardContent className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
            <p className="text-muted-foreground mb-4">
              Please sign in to access your dashboard.
            </p>
            <Button 
              onClick={() => {
                const redirectUrl = window.location.href
                window.location.href = `/sign-in?redirect=${encodeURIComponent(redirectUrl)}`
              }}
              className="bg-primary-solid text-white hover:bg-primary/90"
            >
              Continue to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ─── Jam lifecycle derivation (presentation only) ─────────────────────────
  // Recomposes the same events/registrations signals the old onboarding
  // checklist used into a Plan → Publish → Run → Wrap up rail. No new fetches.
  const parseDay = (value?: string) => {
    if (!value) return null
    const d = new Date(value)
    return isNaN(d.getTime()) ? null : d
  }
  const jamEnded = (e: Event) => {
    const end = parseDay(e.endDate || e.eventDate)
    if (!end) return false
    const cutoff = new Date(end)
    cutoff.setHours(23, 59, 59, 999)
    return cutoff.getTime() < Date.now()
  }
  const daysUntil = (value?: string) => {
    const d = parseDay(value)
    if (!d) return null
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const target = new Date(d); target.setHours(0, 0, 0, 0)
    return Math.round((target.getTime() - today.getTime()) / 86400000)
  }

  const draftEvents = events.filter(e => e.status === 'draft')
  const liveEvents = events.filter(e => e.status === 'published' || e.status === 'ongoing')
  const completedEvents = events.filter(e => e.status === 'completed')

  // The jam the host is "on" right now: an ongoing one, else the soonest
  // upcoming one, else the most recent live one, else the latest created.
  const upcomingEvents = events
    .filter(e => e.status !== 'completed' && e.status !== 'cancelled' && parseDay(e.eventDate) && !jamEnded(e))
    .sort((a, b) => parseDay(a.eventDate)!.getTime() - parseDay(b.eventDate)!.getTime())
  const focusEvent =
    events.find(e => e.status === 'ongoing') ||
    upcomingEvents[0] ||
    liveEvents[0] ||
    events[0] ||
    null

  // Stage completion — monotonic (each flag implies the previous), so the
  // first "not done" stage is where the host's jam is right now.
  const stageDone = [
    events.length > 0,                                        // Plan: an event exists
    liveEvents.length > 0 || completedEvents.length > 0,      // Publish: ever went public
    completedEvents.length > 0 || liveEvents.some(jamEnded),  // Run: jam day happened
    completedEvents.length > 0,                               // Wrap up: marked completed
  ]
  const doneCount = stageDone.filter(Boolean).length
  const currentStage = stageDone.findIndex(d => !d) // -1 → all four done

  const publishTarget = draftEvents[0] || null
  const wrapTarget = liveEvents.find(jamEnded) || liveEvents[0] || null
  const shareTarget = completedEvents[0] || focusEvent

  const daysToJam = focusEvent ? daysUntil(focusEvent.eventDate) : null
  const jamIsLive = !!focusEvent && (
    focusEvent.status === 'ongoing' ||
    (daysToJam !== null && daysToJam <= 0 && !jamEnded(focusEvent) && focusEvent.status !== 'draft' && focusEvent.status !== 'completed')
  )
  const jamDateLabel = focusEvent?.eventDate
    ? (focusEvent.endDate && focusEvent.endDate !== focusEvent.eventDate
        ? `${formatDate(focusEvent.eventDate)} — ${formatDate(focusEvent.endDate)}`
        : formatDate(focusEvent.eventDate))
    : null
  const firstName = ((user.displayName || '').trim().split(/\s+/)[0]) || 'host'

  const openTab = (tab: string) => {
    setActiveTab(tab)
    requestAnimationFrame(() => tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }
  const openCreateDialog = () => {
    // The create/edit dialog lives inside the events tab, so surface that tab first.
    setActiveTab('events')
    resetForm()
    setShowNewEventDialog(true)
  }

  // Header context line — "where is my jam right now?"
  const dateChip = (label: string) => (
    <span className="ml-2 inline-flex translate-y-[-1px] items-center rounded-full border border-[#dfe9e2] bg-white px-2.5 py-0.5 font-mono text-[11px] font-semibold tabular-nums text-[#00713a] align-middle whitespace-nowrap">
      {label}
    </span>
  )
  const jamContext = !focusEvent ? (
    <>Your jam HQ — plan, publish, run and wrap up your Global Goals Jam, all from here.</>
  ) : jamIsLive ? (
    <>
      <strong className="font-semibold text-[#14201a]">{focusEvent.title}</strong> is live in {focusEvent.location} — make it count.
      {dateChip('happening now')}
    </>
  ) : daysToJam !== null && daysToJam > 0 && focusEvent.status !== 'completed' ? (
    <>
      Next jam: <strong className="font-semibold text-[#14201a]">{focusEvent.title}</strong>
      {jamDateLabel ? <> · {jamDateLabel}</> : null}
      {focusEvent.location ? <> · {focusEvent.location}</> : null}
      {dateChip(`T−${daysToJam} day${daysToJam === 1 ? '' : 's'}`)}
    </>
  ) : (focusEvent.status === 'completed' || jamEnded(focusEvent)) ? (
    <>
      Your last jam, <strong className="font-semibold text-[#14201a]">{focusEvent.title}</strong>, has wrapped
      {jamDateLabel ? <> — it ran {jamDateLabel}</> : null}. Time to share what happened.
    </>
  ) : (
    <>
      Shaping <strong className="font-semibold text-[#14201a]">{focusEvent.title}</strong>
      {jamDateLabel ? <> · {jamDateLabel}</> : <> — set a date to get rolling</>}.
    </>
  )

  // Shared rail styles — the "jam poster" language
  const pillSolid = 'inline-flex items-center gap-1.5 rounded-full bg-[#00A651] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#008a44] transition-colors'
  const pillQuiet = 'inline-flex items-center gap-1.5 rounded-full border border-[#dfe9e2] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#14201a] hover:border-[#00A651]/50 hover:text-[#00713a] transition-colors'
  const railLink = 'inline-flex items-center gap-1 text-xs font-semibold text-[#00713a] underline decoration-[#00A651]/30 decoration-2 underline-offset-4 hover:decoration-[#00A651] transition-colors'
  const tabTriggerClass = 'rounded-full border border-transparent px-4 py-1.5 text-sm font-semibold text-[#4c5a52] transition-colors hover:text-[#14201a] data-[state=active]:border-[#dfe9e2] data-[state=active]:bg-white data-[state=active]:text-[#00713a] data-[state=active]:shadow-sm'

  const stages: { key: string; title: string; tagline: string; meta: React.ReactNode; actions: React.ReactNode }[] = [
    {
      key: 'plan',
      title: 'Plan',
      tagline: 'Shape your jam — pick the challenge, set the dates.',
      meta: (
        <><span className="font-mono tabular-nums">{events.length}</span> event{events.length === 1 ? '' : 's'} created</>
      ),
      actions: (
        <>
          {canCreateEvents && (
            <button type="button" onClick={openCreateDialog} className={currentStage === 0 ? pillSolid : pillQuiet}>
              <Plus className="h-3.5 w-3.5" /> {events.length === 0 ? 'Create your first event' : 'Create event'}
            </button>
          )}
          <Link to="/toolkit" className={railLink}>Open the Jamkit</Link>
          <a href={LEARN_URL} className={railLink}>Host Programme <ArrowRight className="h-3 w-3" /></a>
        </>
      ),
    },
    {
      key: 'publish',
      title: 'Publish',
      tagline: 'Go public and gather your crew of jammers.',
      meta: (
        <><span className="font-mono tabular-nums">{registrations.length}</span> registered</>
      ),
      actions: (
        <>
          {publishTarget && canCreateEvents && (
            <button type="button" onClick={() => publishEvent(publishTarget.id)} className={currentStage === 1 ? pillSolid : pillQuiet}>
              Publish <span className="max-w-[9rem] truncate">“{publishTarget.title}”</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (!addParticipantEventId && focusEvent) setAddParticipantEventId(focusEvent.id)
              openTab('participants')
            }}
            className={currentStage === 1 && (!publishTarget || !canCreateEvents) ? pillSolid : pillQuiet}
          >
            <UserPlus className="h-3.5 w-3.5" /> Add participants
          </button>
          {liveEvents[0] && (
            <button type="button" onClick={() => shareEventLink(liveEvents[0].id)} className={railLink}>
              Share link
            </button>
          )}
        </>
      ),
    },
    {
      key: 'run',
      title: 'Run',
      tagline: 'Jam days — facilitate the sprints, capture the energy.',
      meta: jamIsLive
        ? <span className="font-semibold text-[#00713a]">Happening now</span>
        : daysToJam !== null && daysToJam > 0 && focusEvent?.status !== 'completed'
          ? <><span className="font-mono tabular-nums">{daysToJam}</span> day{daysToJam === 1 ? '' : 's'} to jam day</>
          : jamDateLabel
            ? <>{jamDateLabel}</>
            : <>Date to be set</>,
      actions: (
        <>
          {focusEvent && (
            <button type="button" onClick={() => viewPublic(focusEvent.id)} className={currentStage === 2 ? pillSolid : pillQuiet}>
              <Eye className="h-3.5 w-3.5" /> Event page
            </button>
          )}
          <button type="button" onClick={() => openTab('media')} className={focusEvent ? pillQuiet : (currentStage === 2 ? pillSolid : pillQuiet)}>
            <Upload className="h-3.5 w-3.5" /> Upload media
          </button>
        </>
      ),
    },
    {
      key: 'wrap',
      title: 'Wrap up',
      tagline: 'Close the loop — certificates, results, celebration.',
      meta: (
        <><span className="font-mono tabular-nums">{completedEvents.length}</span> completed</>
      ),
      actions: (
        <>
          {wrapTarget && canCreateEvents && (
            <button type="button" onClick={() => completeEvent(wrapTarget.id)} className={currentStage === 3 ? pillSolid : pillQuiet}>
              <CheckCircle className="h-3.5 w-3.5" /> Mark completed
            </button>
          )}
          <button type="button" onClick={() => openTab('certificates')} className={currentStage === 3 && !(wrapTarget && canCreateEvents) ? pillSolid : pillQuiet}>
            <Award className="h-3.5 w-3.5" /> Certificates
          </button>
          {shareTarget && (
            <Link to={`/events/${shareTarget.id}/results`} className={railLink}>Share results</Link>
          )}
        </>
      ),
    },
  ]
  const stageHeadline = currentStage === -1
    ? 'Jam wrapped — beautifully done.'
    : ['Plan your jam.', 'Time to go public.', 'Jam days are coming.', 'Wrap up and share.'][currentStage]

  return (
    <div className="min-h-screen bg-[#F6FAF7] text-[#14201a] relative">
      <FloatingFeedback context="host" userEmail={user?.email || ''} userName={user?.displayName || ''} />

      {certGenerating && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-card rounded-xl p-6 shadow-xl w-[320px] text-center">
            <div className="mx-auto mb-4 w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            <h3 className="text-lg font-semibold">Working…</h3>
            <p className="text-sm text-muted-foreground mt-1">{certStatus || 'Please wait a moment'}</p>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-12 sm:pt-16 pb-16">
        {/* Header — eyebrow, display greeting, jam-date context */}
        <header className="mb-10">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div className="max-w-2xl">
              <p className="ggj-rise text-[11px] font-bold uppercase tracking-[0.3em] text-[#00713a]">
                Host dashboard
                {!hostEligible && <Badge variant="secondary" className="ml-2 align-middle tracking-normal">Preview</Badge>}
              </p>
              <h1
                className="ggj-rise font-display font-extrabold tracking-tight text-[clamp(2.1rem,4.5vw,3rem)] leading-[1.05] mt-3 text-[#14201a] [text-wrap:balance]"
                style={{ animationDelay: '60ms' }}
              >
                Welcome back, <span className="text-[#00A651]">{firstName}</span>.
              </h1>
              <p className="ggj-rise text-[#4c5a52] mt-3 leading-relaxed" style={{ animationDelay: '120ms' }}>
                {jamContext}
              </p>
            </div>
            <DonateButton variant="pill-outline" size="default" className="self-start sm:self-auto sm:mb-1" />
          </div>
        </header>

        {/* Preview mode — host tools locked */}
        {!hostEligible && (
          <div className="ggj-rise mb-10 rounded-2xl border border-[#dfe9e2] bg-white p-5 sm:p-6 shadow-sm" style={{ animationDelay: '160ms' }}>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-[#7d8a83]">
                  <span className="h-2 w-2 rounded-full bg-[#FCC30B]" aria-hidden="true" /> Preview mode — host tools locked
                </p>
                <p className="text-sm text-[#4c5a52] mt-2">Host role required. Request host access to unlock creation, publishing and management tools.</p>
              </div>
              <div className="flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={() => navigate('/profile')}
                  className="inline-flex items-center rounded-full bg-[#00A651] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#008a44] transition-colors"
                >
                  Request Host Access
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/about')}
                  className="inline-flex items-center rounded-full border border-[#dfe9e2] bg-white px-5 py-2.5 text-sm font-semibold text-[#14201a] hover:border-[#00A651]/50 hover:text-[#00713a] transition-colors"
                >
                  Learn more
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Jam lifecycle rail — the dashboard's spine. Evolved from the old
            onboarding checklist: same data signals, recomposed as four stages
            that each surface their own actions. */}
        {hostEligible && (
          <section
            aria-label="Jam lifecycle"
            className="ggj-rise mb-10 overflow-hidden rounded-2xl border border-[#dfe9e2] bg-white shadow-sm"
            style={{ animationDelay: '180ms' }}
          >
            <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 px-5 sm:px-6 py-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#00713a]">Jam lifecycle</p>
                <h2 className="font-display font-extrabold tracking-tight text-xl mt-1 text-[#14201a]">{stageHeadline}</h2>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-semibold tabular-nums text-[#7d8a83]">{doneCount}/4 stages</span>
                <Progress value={(doneCount / 4) * 100} className="h-1.5 w-24 sm:w-32" />
              </div>
            </div>
            <div className="grid gap-px border-t border-[#dfe9e2] bg-[#dfe9e2] sm:grid-cols-2 lg:grid-cols-4">
              {stages.map((stage, i) => {
                const done = stageDone[i]
                const isCurrent = i === currentStage
                return (
                  <div key={stage.key} className="relative bg-white p-5">
                    {isCurrent && <span className="absolute inset-x-0 top-0 h-[3px] bg-[#00A651]" aria-hidden="true" />}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ${
                            done
                              ? 'bg-[#00A651] text-white'
                              : isCurrent
                                ? 'border-2 border-[#00A651] text-[#00713a]'
                                : 'border border-[#dfe9e2] text-[#7d8a83]'
                          }`}
                          aria-hidden="true"
                        >
                          {done ? <Check className="h-3.5 w-3.5" /> : <span className="font-mono text-[11px] font-semibold tabular-nums">{i + 1}</span>}
                        </span>
                        <span className={`font-display text-base font-extrabold tracking-tight truncate ${done && !isCurrent ? 'text-[#7d8a83]' : 'text-[#14201a]'}`}>
                          {stage.title}
                        </span>
                      </div>
                      {isCurrent ? (
                        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#00713a]">Now</span>
                      ) : done ? (
                        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9fada6]">Done</span>
                      ) : null}
                    </div>
                    <p className="mt-2.5 text-xs leading-relaxed text-[#7d8a83]">{stage.tagline}</p>
                    <p className="mt-2 text-xs text-[#4c5a52]">{stage.meta}</p>
                    <div className="mt-3.5 flex flex-wrap items-center gap-x-3 gap-y-2">{stage.actions}</div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Stat rail — quiet hairline tiles, tabular numbers, SDG dot accents */}
        <div
          className="ggj-rise mb-10 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-[#dfe9e2] bg-[#dfe9e2] lg:grid-cols-4"
          style={{ animationDelay: '240ms' }}
        >
          {[
            { label: 'Total events', value: events.length, dot: '#E5243B' },
            { label: 'Participants', value: registrations.length, dot: '#26BDE2' },
            { label: 'Published', value: events.filter(e => e.status === 'published').length, dot: '#FCC30B' },
            { label: 'Completed', value: events.filter(e => e.status === 'completed').length, dot: '#3F7E44' },
          ].map((s) => (
            <div key={s.label} className="bg-white px-5 py-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[12px] text-[#7d8a83]">{s.label}</span>
                <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: s.dot }} aria-hidden="true" />
              </div>
              <div className="mt-1 font-display text-2xl sm:text-3xl font-extrabold tabular-nums text-[#14201a]">{s.value}</div>
            </div>
          ))}
        </div>

        {/* Management tabs — ordered along the lifecycle: plan/publish first,
            run (media) and wrap-up (certificates) after */}
        <div ref={tabsRef} className="scroll-mt-24">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex h-auto w-full flex-wrap items-center justify-start gap-1.5 rounded-none border-b border-[#dfe9e2] bg-transparent p-0 pb-3 text-[#4c5a52]">
            <TabsTrigger value="events" className={tabTriggerClass}>My Events</TabsTrigger>
            <TabsTrigger value="participants" className={tabTriggerClass}>Participants</TabsTrigger>
            <TabsTrigger value="promote" className={tabTriggerClass}>Promote</TabsTrigger>
            <TabsTrigger value="media" className={tabTriggerClass}>Media</TabsTrigger>
            <TabsTrigger value="certificates" className={tabTriggerClass}>Certificates</TabsTrigger>
            <TabsTrigger value="courses" className={tabTriggerClass}>My Courses</TabsTrigger>
            <TabsTrigger value="assets" className={tabTriggerClass}>Assets</TabsTrigger>
          </TabsList>

          <TabsContent value="events" className="space-y-6 pt-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-extrabold tracking-tight text-[#14201a]">My Events</h2>
              {canCreateEvents ? (
                <Dialog open={showNewEventDialog} onOpenChange={setShowNewEventDialog}>
                  <DialogTrigger asChild>
                    <Button onClick={resetForm} className="bg-primary-solid text-white hover:bg-primary/90">
                      <Plus className="w-4 h-4 mr-2" /> New Event
                    </Button>
                  </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{selectedEvent ? 'Edit Event' : 'Create New Event'}</DialogTitle>
                    <DialogDescription>Fields marked with * are required.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="title" className={eventFieldErrors.title ? 'text-destructive' : ''}>Event Title *</Label>
                        <Input id="title" value={eventForm.title} onChange={(e) => handleInputChange('title', e.target.value)} placeholder="Enter event title..." aria-invalid={!!eventFieldErrors.title} className={eventFieldErrors.title ? 'border-destructive focus-visible:ring-destructive' : ''} />
                        {eventFieldErrors.title && <p className="text-xs text-destructive mt-1">Event title is required</p>}
                      </div>
                      <div>
                        <Label htmlFor="location" className={eventFieldErrors.location ? 'text-destructive' : ''}>Location *</Label>
                        <Input id="location" value={eventForm.location} onChange={(e) => handleInputChange('location', e.target.value)} placeholder="Enter event location..." aria-invalid={!!eventFieldErrors.location} className={eventFieldErrors.location ? 'border-destructive focus-visible:ring-destructive' : ''} />
                        {eventFieldErrors.location && <p className="text-xs text-destructive mt-1">Location is required</p>}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <Label htmlFor="description" className={eventFieldErrors.description ? 'text-destructive' : ''}>Description * (with formatting)</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          disabled={!eventForm.title.trim()}
                          onClick={async () => {
                            if (!eventForm.title.trim()) return
                            toast.info('Generating description...')
                            try {
                              const { data, error } = await supabase.functions.invoke('gemini-ai', {
                                body: {
                                  prompt: `Write a compelling event description for a Global Goals Jam event titled "${eventForm.title}" in ${eventForm.location || 'a local community'}. Keep it 2-3 paragraphs, inspiring, and focused on SDG impact.`,
                                  action: 'event_description',
                                },
                              })
                              if (error) throw error
                              if (data?.text) {
                                handleInputChange('description', data.text)
                                toast.success('Description generated!')
                              }
                            } catch (err: any) {
                              toast.error(err?.message || 'Failed to generate description')
                            }
                          }}
                        >
                          <span className="mr-1">&#10024;</span> AI Assist
                        </Button>
                      </div>
                      <div className={eventFieldErrors.description ? 'rounded-md ring-1 ring-destructive' : ''}>
                        <RichTextEditor
                          value={eventForm.description}
                          onChange={(value) => handleInputChange('description', value)}
                          placeholder="Describe your event... Use formatting tools above for headers, bold, italic, lists, etc."
                          minHeight="150px"
                        />
                      </div>
                      {eventFieldErrors.description && <p className="text-xs text-destructive mt-1">Description is required</p>}
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="startDate" className={eventFieldErrors.startDate ? 'text-destructive' : ''}>Start Date *</Label>
                        <Input id="startDate" type="date" value={eventForm.startDate} onChange={(e) => handleInputChange('startDate', e.target.value)} aria-invalid={!!eventFieldErrors.startDate} className={eventFieldErrors.startDate ? 'border-destructive focus-visible:ring-destructive' : ''} />
                        {eventFieldErrors.startDate && <p className="text-xs text-destructive mt-1">Start date is required</p>}
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
                      <Label htmlFor="agenda">Agenda (with formatting)</Label>
                      <RichTextEditor 
                        value={eventForm.agenda || ''} 
                        onChange={(value) => handleInputChange('agenda', value)} 
                        placeholder="Event agenda and schedule... Use formatting tools for better structure."
                        minHeight="120px"
                      />
                    </div>

                    <div>
                      <Label htmlFor="requirements">Requirements (with formatting)</Label>
                      <RichTextEditor 
                        value={eventForm.requirements || ''} 
                        onChange={(value) => handleInputChange('requirements', value)} 
                        placeholder="What participants should bring or prepare..."
                        minHeight="100px"
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="manualParticipantCount">Manual Participant Count</Label>
                        <Input 
                          id="manualParticipantCount" 
                          type="number" 
                          value={eventForm.manualParticipantCount} 
                          onChange={(e) => handleInputChange('manualParticipantCount', e.target.value)} 
                          placeholder="e.g., 45" 
                        />
                        <p className="text-xs text-muted-foreground mt-1">For display when actual registrations aren't tracked online</p>
                      </div>
                      <div>
                        <Label htmlFor="customRegistrationLink">Custom Registration Link</Label>
                        <Input 
                          id="customRegistrationLink" 
                          type="url" 
                          value={eventForm.customRegistrationLink} 
                          onChange={(e) => handleInputChange('customRegistrationLink', e.target.value)} 
                          placeholder="https://..." 
                        />
                        <p className="text-xs text-muted-foreground mt-1">External registration form (e.g., Google Forms, Eventbrite)</p>
                      </div>
                    </div>

                    <div>
                      <Label>Header Photo (optional)</Label>
                      <div className="mt-2 rounded-xl border overflow-hidden">
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
                              const { publicUrl } = await storage.upload(
                                file,
                                `events/headers/${user?.id || 'unknown'}/${Date.now()}.${file.name.split('.').pop()}`,
                                { upsert: true }
                              )
                              setEventForm(prev => ({ ...prev, coverImage: publicUrl }))
                            } catch (err) {
                              console.error('Header upload failed:', err)
                              toast.error('Failed to upload image. Please try again.')
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
                <Card key={event.id} variant="flat" className="rounded-2xl border-[#dfe9e2] bg-white shadow-sm hover:shadow-card transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg line-clamp-2">{event.title}</CardTitle>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary" className={`text-xs ${statusColors[event.status] || 'bg-pastel-amber text-amber-800'}`}>
                            {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground line-clamp-2">{stripHtml(event.description)}</p>

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
                            <Button size="sm" onClick={() => publishEvent(event.id)} className="bg-[#00A651] text-white hover:bg-[#008a44]">
                              Publish
                            </Button>
                          )}
                          {(event.status === 'published' || event.status === 'ongoing') && canCreateEvents && (
                            <Button size="sm" onClick={() => completeEvent(event.id)} className="bg-[#14201a] text-white hover:bg-[#14201a]/85">
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

          <TabsContent value="participants" className="space-y-6 pt-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-extrabold tracking-tight text-[#14201a]">Event Participants</h2>
              <Button variant="outline" onClick={() => exportParticipantsCSV()}>
                <Download className="w-4 h-4 mr-2" /> Export All CSV
              </Button>
            </div>

            {/* Add participants manually or via CSV */}
            {events.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <UserPlus className="w-5 h-5" /> Add Participants
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">Manually add participants or upload a CSV file (First Name, Last Name).</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Select Event</Label>
                    <Select value={addParticipantEventId || '_none'} onValueChange={(v) => setAddParticipantEventId(v === '_none' ? '' : v)}>
                      <SelectTrigger className="w-full mt-1"><SelectValue placeholder="Choose an event..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_none">Select an event</SelectItem>
                        {events.map(e => (
                          <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {addParticipantEventId && (
                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Manual single add */}
                      <div className="p-4 border rounded-xl space-y-3">
                        <div className="font-medium text-sm">Add Single Participant</div>
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            placeholder="First Name"
                            value={newParticipant.firstName}
                            onChange={(e) => setNewParticipant(prev => ({ ...prev, firstName: e.target.value }))}
                          />
                          <Input
                            placeholder="Last Name"
                            value={newParticipant.lastName}
                            onChange={(e) => setNewParticipant(prev => ({ ...prev, lastName: e.target.value }))}
                          />
                        </div>
                        <Button
                          onClick={handleAddParticipant}
                          disabled={!newParticipant.firstName.trim() || !newParticipant.lastName.trim() || addingParticipant}
                          className="w-full"
                        >
                          <UserPlus className="w-4 h-4 mr-2" />
                          {addingParticipant ? 'Adding...' : 'Add Participant'}
                        </Button>
                      </div>

                      {/* CSV upload */}
                      <div className="p-4 border rounded-xl space-y-3">
                        <div className="font-medium text-sm">Upload CSV</div>
                        <p className="text-xs text-muted-foreground">CSV format: <code className="bg-muted px-1 rounded">First Name, Last Name</code> (one per line)</p>
                        <input
                          ref={csvInputRef}
                          type="file"
                          accept=".csv,.txt,.tsv"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.currentTarget.files?.[0]
                            if (file) handleCSVUpload(file)
                            if (csvInputRef.current) csvInputRef.current.value = ''
                          }}
                        />
                        <Button
                          variant="outline"
                          onClick={() => csvInputRef.current?.click()}
                          disabled={addingParticipant}
                          className="w-full"
                        >
                          <FileUp className="w-4 h-4 mr-2" />
                          {addingParticipant ? 'Importing...' : 'Upload CSV File'}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Participant list by event */}
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
                          <p className="text-sm text-muted-foreground">{eventRegistrations.length} participant{eventRegistrations.length !== 1 ? 's' : ''}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => exportParticipantsCSV(event.id)}>
                            <Download className="w-4 h-4 mr-2" /> Export CSV
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {eventRegistrations.map((registration) => {
                          const name = (registration.firstName && registration.lastName)
                            ? `${registration.firstName} ${registration.lastName}`
                            : null
                          return (
                            <div key={registration.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                              <div>
                                <p className="font-medium">{name || 'Participant'}</p>
                                <p className="text-sm text-muted-foreground">Registered {formatDate(registration.registrationDate)}</p>
                              </div>
                              <div className="flex gap-2">
                                {name && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      showCertificateInNewTab({
                                        participantName: name,
                                        eventTitle: event.title,
                                        eventLocation: event.location,
                                        eventDate: event.eventDate,
                                        certificateKind: 'participation',
                                      })
                                    }}
                                  >
                                    <Award className="w-4 h-4 mr-1" /> Certificate
                                  </Button>
                                )}
                                <Button size="sm" variant="ghost" onClick={() => {
                                  if (!confirm('Remove this participant?')) return
                                  safeDbCall(() => db.eventRegistrations.delete(registration.id)).then(() => {
                                    setRegistrations(prev => prev.filter(r => r.id !== registration.id))
                                    toast.success('Participant removed')
                                  })
                                }}>
                                  <Trash2 className="w-4 h-4 text-muted-foreground" />
                                </Button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}

              {registrations.length === 0 && events.length === 0 && (
                <Card>
                  <CardContent className="text-center py-12">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No participants yet</h3>
                    <p className="text-muted-foreground">Create an event first, then add participants manually or let them register.</p>
                  </CardContent>
                </Card>
              )}

              {registrations.length === 0 && events.length > 0 && (
                <Card>
                  <CardContent className="text-center py-12">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No participants yet</h3>
                    <p className="text-muted-foreground">Add participants manually above or let them register for your events.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="certificates" className="space-y-6 pt-6">
            <Card>
              <CardContent className="grid md:grid-cols-2 gap-6 py-8">
                <div className="text-center p-6 border rounded-xl">
                  <Award className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <h3 className="text-base font-semibold mb-1">Participant Certificates</h3>
                  <p className="text-sm text-muted-foreground mb-4">Generate participation certificates for your event attendees from the Participants tab.</p>
                  <Button variant="outline" onClick={() => openTab('participants')}>Open Participants</Button>
                </div>
                <div className="text-center p-6 border rounded-xl">
                  <Award className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <h3 className="text-base font-semibold mb-1">Host Certificate</h3>
                  <p className="text-sm text-muted-foreground mb-4">Generate your own certificate as proof of hosting.</p>
                  <Button className="bg-primary-solid text-white hover:bg-primary/90" onClick={() => navigate('/course/certificate')}>Generate Host Certificate</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="courses" className="space-y-6 pt-6">
            <Card>
              <CardContent className="py-8 text-center">
                <h3 className="text-lg font-semibold mb-2">GGJ Host Programme</h3>
                <p className="text-sm text-muted-foreground mb-4">Your modules, artefacts and Facilitator live on the Learn platform.</p>
                <Button className="bg-primary-solid text-white hover:bg-primary/90" onClick={() => { window.location.assign(LEARN_URL) }}>Go to Course</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="promote" className="space-y-6 pt-6">
            <Card>
              <CardHeader>
                <CardTitle>Promote Your Events</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">Quickly share and embed your events across platforms. Copy a link or an embed snippet for your website.</p>
                <div className="space-y-4">
                  {events.length === 0 && (
                    <div className="text-sm text-muted-foreground">No events yet. Create one in the My Events tab.</div>
                  )}
                  {events.map((ev) => {
                    const url = `${window.location.origin}/events/${ev.id}`
                    const embed = `<iframe src="${url}" style="width:100%;height:420px;border:0;border-radius:12px;overflow:hidden" title="Global Goals Jam Event"></iframe>`
                    return (
                      <div key={ev.id} className="p-4 border rounded-xl">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="font-medium line-clamp-1">{ev.title}</div>
                            <div className="text-xs text-muted-foreground line-clamp-1">{ev.location} · {formatDate(ev.eventDate)}</div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => copyText(url)}>
                              <LinkIcon className="w-4 h-4 mr-1" /> Copy Link
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => copyText(embed)}>
                              <Code className="w-4 h-4 mr-1" /> Copy Embed
                            </Button>
                            <Button size="sm" onClick={() => viewPublic(ev.id)} className="bg-primary-solid text-white hover:bg-primary/90">
                              <Eye className="w-4 h-4 mr-1" /> Open
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="media" className="space-y-6 pt-6">
            <Card>
              <CardHeader>
                <CardTitle>Media Library</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col md:flex-row gap-3 md:items-end">
                  <div className="flex-1">
                    <Label>Upload File</Label>
                    <div className="flex gap-2 mt-1">
                      <input
                        ref={mediaInputRef}
                        type="file"
                        accept="image/*,video/*,application/pdf"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.currentTarget.files?.[0]
                          if (!file) return
                          const eventId = events[0]?.id // simple default; assign first event if any
                          await handleMediaFile(file, eventId)
                          if (mediaInputRef.current) mediaInputRef.current.value = ''
                        }}
                      />
                      <Button variant="outline" onClick={() => mediaInputRef.current?.click()} disabled={mediaUploading}>
                        <Upload className="w-4 h-4 mr-2" /> {mediaUploading ? 'Uploading…' : 'Choose File'}
                      </Button>
                      {events.length > 0 && (
                        <Select value={newLink.eventId || '_none'} onValueChange={(v) => setNewLink(prev => ({ ...prev, eventId: v === '_none' ? '' : v }))}>
                          <SelectTrigger className="w-[220px]"><SelectValue placeholder="Assign to event (optional)" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="_none">No Event</SelectItem>
                            {events.map(e => (
                              <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="md:col-span-1 p-4 border rounded-xl space-y-2">
                    <div className="font-medium">Add External Link</div>
                    <Input placeholder="Title" value={newLink.title} onChange={(e) => setNewLink(prev => ({ ...prev, title: e.target.value }))} />
                    <Input placeholder="https://..." value={newLink.url} onChange={(e) => setNewLink(prev => ({ ...prev, url: e.target.value }))} />
                    <div className="flex items-center gap-2">
                      {events.length > 0 && (
                        <Select value={newLink.eventId || '_none'} onValueChange={(v) => setNewLink(prev => ({ ...prev, eventId: v === '_none' ? '' : v }))}>
                          <SelectTrigger className="w-[220px]"><SelectValue placeholder="Assign to event (optional)" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="_none">No Event</SelectItem>
                            {events.map(e => (
                              <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      <Button onClick={handleAddLink} disabled={!newLink.title || !newLink.url}>Add</Button>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    {mediaItems.length === 0 ? (
                      <div className="text-sm text-muted-foreground p-6 border rounded-xl text-center">No media yet.</div>
                    ) : (
                      <div className="grid sm:grid-cols-2 gap-4">
                        {mediaItems.map((m: any) => (
                          <a key={m.id} href={m.fileUrl} target="_blank" rel="noreferrer" className="group border rounded-xl overflow-hidden bg-card">
                            {String(m.fileType || '').startsWith('image/') ? (
                              <img src={m.fileUrl} alt={m.title} className="w-full h-40 object-cover" />
                            ) : String(m.fileType) === 'link' ? (
                              <div className="w-full h-40 bg-muted flex items-center justify-center"><LinkIcon className="w-8 h-8 text-muted-foreground" /></div>
                            ) : (
                              <div className="w-full h-40 bg-muted flex items-center justify-center"><FileText className="w-8 h-8 text-muted-foreground" /></div>
                            )}
                            <div className="p-3">
                              <div className="text-sm font-medium truncate">{m.title || 'Untitled'}</div>
                              {m.eventId && (<div className="text-xs text-muted-foreground truncate">Event: {events.find(e => e.id === m.eventId)?.title || m.eventId}</div>)}
                            </div>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assets" className="space-y-6 pt-6">
            <HostAssets />
          </TabsContent>
        </Tabs>
        </div>

        {/* Host resources — moved from the old "Quick Access" cards to a quiet
            strip at the end; same three destinations and handlers */}
        <section aria-label="Host resources" className="mt-14">
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#00713a]">Host resources</p>
          <div className="mt-3 grid gap-px overflow-hidden rounded-2xl border border-[#dfe9e2] bg-[#dfe9e2] sm:grid-cols-3">
            <button
              type="button"
              className="group bg-white p-5 text-left transition-colors hover:bg-[#F6FAF7]"
              onClick={() => { const a = document.createElement('a'); a.href = 'https://kzeoegabvbaonypooaev.supabase.co/storage/v1/object/public/Assets/GGJ_assets.zip'; a.download = ''; document.body.appendChild(a); a.click(); document.body.removeChild(a); }}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#00A651]/10 text-[#00713a]">
                  <ImageIcon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-[#14201a]">Brand Assets</span>
                  <span className="block text-xs text-[#7d8a83]">Logos &amp; visual elements</span>
                </span>
                <Download className="h-4 w-4 flex-shrink-0 text-[#7d8a83] transition-colors group-hover:text-[#00713a]" />
              </div>
            </button>
            <button
              type="button"
              className="group bg-white p-5 text-left transition-colors hover:bg-[#F6FAF7]"
              onClick={() => window.open('https://kzeoegabvbaonypooaev.supabase.co/storage/v1/object/public/Assets/ggj_info_booklet.pdf', '_blank')}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#00A651]/10 text-[#00713a]">
                  <FileText className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-[#14201a]">Instruction Guide</span>
                  <span className="block text-xs text-[#7d8a83]">Full jam overview</span>
                </span>
                <Eye className="h-4 w-4 flex-shrink-0 text-[#7d8a83] transition-colors group-hover:text-[#00713a]" />
              </div>
            </button>
            <button
              type="button"
              className="group bg-white p-5 text-left transition-colors hover:bg-[#F6FAF7]"
              onClick={() => window.open('https://kzeoegabvbaonypooaev.supabase.co/storage/v1/object/public/Assets/GGJimpactreport_compressed.pdf', '_blank')}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#00A651]/10 text-[#00713a]">
                  <BookOpen className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-[#14201a]">Impact Report</span>
                  <span className="block text-xs text-[#7d8a83]">Results &amp; outcomes</span>
                </span>
                <Eye className="h-4 w-4 flex-shrink-0 text-[#7d8a83] transition-colors group-hover:text-[#00713a]" />
              </div>
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}
