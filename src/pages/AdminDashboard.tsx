import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Switch } from '../components/ui/switch'
import {
  MessageSquare,
  Shield,
  CheckCircle,
  XCircle,
  Eye,
  MapPin,
  Mail,
  Globe,
  UserCheck,
  Sparkles,
  Image as ImageIcon,
  Video,
  FileText,
  ExternalLink,
  Trash2,
  ArrowRight,
} from 'lucide-react'
import SupportersAdmin from '../components/SupportersAdmin'
import CourseManagement from '../components/CourseManagement'
import { db } from '../lib/supabase'
import { getFullUser, type FullUser } from '../lib/userProfile'
import { config } from '../lib/config'
import toast from 'react-hot-toast'
import { invalidateEventsCache } from '../hooks/usePublishedEvents'
import AdminShell, {
  Pill,
  type PillTone,
  adminCardClass,
  railTabsListClass,
  railTabTriggerClass,
  quietButtonClass,
  primaryButtonClass,
} from '../components/admin/AdminShell'

interface User {
  id: string
  email: string
  displayName?: string
  role: string
  status: string
  createdAt: string
  location?: string
  bio?: string
}

interface Event {
  id: string
  title: string
  hostId: string
  hostName?: string
  location: string
  eventDate: string
  status: string
  createdAt: string
  maxParticipants?: number
  sdgFocus?: string
}

interface HostApplication {
  id: string
  userId: string
  email: string
  location: string
  motivation: string
  status: string
  createdAt: string
  reviewedBy?: string
  reviewedAt?: string
}

interface Media {
  id: string
  eventId?: string
  uploadedBy: string
  title: string
  description?: string
  fileUrl: string
  fileType: string
  fileSize?: number
  sdgTags?: string
  isFeatureed?: boolean
  createdAt: string
}

export default function AdminDashboard() {
  const [currentUser, setCurrentUser] = useState<FullUser | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [hostApplications, setHostApplications] = useState<HostApplication[]>([])
  const [media, setMedia] = useState<Media[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  // Admin Events filters
  const [eventSearch, setEventSearch] = useState('')
  const [eventStatusFilter, setEventStatusFilter] = useState('all')

  useEffect(() => {
    loadAdminData()
  }, [])

  const loadAdminData = async () => {
    setLoading(true)
    try {
      const user = await getFullUser()
      setCurrentUser(user)

      if (!user) {
        // Require authentication for admin dashboard; redirect to custom sign-in
        window.location.href = `/sign-in?redirect=${encodeURIComponent(window.location.href)}`
        return
      }

      const allow = Array.isArray(config.admins?.emails) ? config.admins.emails.map((e: string) => e.toLowerCase()) : []
      const isAllowlisted = user.email ? allow.includes(user.email.toLowerCase()) : false

      if (!isAllowlisted && user.role !== 'admin') {
        toast.error('Access denied - Admin privileges required')
        return
      }

      const [usersData, eventsData, applicationsData, mediaData] = await Promise.all([
        db.users.list({ orderBy: { createdAt: 'desc' } }),
        db.events.list({ orderBy: { createdAt: 'desc' } }),
        db.hostApplications.list({ orderBy: { createdAt: 'desc' } }),
        db.media.list({ orderBy: { createdAt: 'desc' } })
      ])

      setUsers(usersData || [])
      setEvents(eventsData || [])
      setHostApplications(applicationsData || [])
      setMedia(mediaData || [])
    } catch (error) {
      console.error('Failed to load admin data:', error)
      toast.error('Failed to load admin data')
    } finally {
      setLoading(false)
    }
  }

  const approveHostApplication = async (applicationId: string) => {
    try {
      await db.hostApplications.update(applicationId, {
        status: 'approved',
        reviewedBy: currentUser?.id,
        reviewedAt: new Date().toISOString()
      })

      const application = hostApplications.find(app => app.id === applicationId)
      if (application?.userId) {
        await db.users.update(application.userId, {
          role: 'host',
          status: 'approved'
        })
      }

      toast.success('Host application approved')
      loadAdminData()
    } catch (error) {
      console.error('Failed to approve application:', error)
      toast.error('Failed to approve application')
    }
  }

  const rejectHostApplication = async (applicationId: string) => {
    try {
      await db.hostApplications.update(applicationId, {
        status: 'rejected',
        reviewedBy: currentUser?.id,
        reviewedAt: new Date().toISOString()
      })
      toast.success('Host application rejected')
      loadAdminData()
    } catch (error) {
      console.error('Failed to reject application:', error)
      toast.error('Failed to reject application')
    }
  }

  const updateEventStatus = async (eventId: string, status: string) => {
    try {
      await db.events.update(eventId, { status })
      // Optimistic local update
      setEvents(prev => prev.map(e => e.id === eventId ? { ...e, status } : e))
      invalidateEventsCache()
      toast.success(status === 'published' ? 'Event published' : status === 'draft' ? 'Event set to draft' : `Event ${status}`)
    } catch (error) {
      console.error('Failed to update event status:', error)
      toast.error('Failed to update event status')
    }
  }

  const toggleEventVisibility = async (eventId: string, isPublished: boolean) => {
    const nextStatus = isPublished ? 'published' : 'draft'
    await updateEventStatus(eventId, nextStatus)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const statusTone = (status: string): PillTone => {
    switch (status) {
      case 'approved':
      case 'published':
      case 'completed':
        return 'green'
      case 'pending':
        return 'amber'
      case 'rejected':
      case 'cancelled':
        return 'red'
      case 'draft':
        return 'outline'
      default:
        return 'grey'
    }
  }

  const roleTone = (role: string): PillTone => {
    switch (role) {
      case 'admin':
        return 'ink'
      case 'host':
        return 'green'
      default:
        return 'outline'
    }
  }

  // Statistics
  const stats = {
    totalUsers: users.length,
    totalHosts: users.filter(u => u.role === 'host').length,
    totalEvents: events.length,
    publishedEvents: events.filter(e => e.status === 'published').length,
    pendingApplications: hostApplications.filter(app => app.status === 'pending').length,
    totalMedia: media.length,
    recentSignups: users.filter(u => {
      const signupDate = new Date(u.createdAt)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return signupDate > weekAgo
    }).length
  }

  const statRail = [
    { value: stats.totalUsers, label: 'Users', sub: `+${stats.recentSignups} this week` },
    { value: stats.totalHosts, label: 'Hosts', sub: 'host accounts' },
    { value: stats.totalEvents, label: 'Events', sub: `${stats.publishedEvents} published` },
    { value: stats.pendingApplications, label: 'Applications', sub: 'awaiting review' },
    { value: stats.totalMedia, label: 'Media files', sub: 'uploaded content' },
  ]

  // Operator tool grid — routed admin tools + in-dashboard sections
  const tools: { dot: string; title: string; blurb: string; to?: string; tab?: string; count?: number }[] = [
    { dot: '#26BDE2', title: 'Users', blurb: 'Accounts, roles, course payments and impersonation.', to: '/admin/users' },
    { dot: '#FCC30B', title: 'Passwords', blurb: 'Set or bulk-generate sign-in credentials.', to: '/admin/passwords' },
    { dot: '#A21942', title: 'Certificates', blurb: 'Compose and download custom certificates.', to: '/admin/certificate-creator' },
    { dot: '#FD6925', title: 'Cert access', blurb: 'Repair certificate access for completed learners.', to: '/admin/certificate-fix' },
    { dot: '#4C9F38', title: 'Articles', blurb: 'Review host stories, write and AI-generate pieces.', to: '/admin/articles' },
    { dot: '#DD1367', title: 'Highlights', blurb: 'Verify and curate jam photos for the site.', to: '/admin/highlights' },
    { dot: '#0A97D9', title: 'Carousel', blurb: 'Manage homepage carousel imagery.', to: '/admin/carousel' },
    { dot: '#4C9F38', title: 'Events', blurb: 'Publish, draft and update every jam.', tab: 'events' },
    { dot: '#E5243B', title: 'Applications', blurb: 'Review pending host applications.', tab: 'applications', count: stats.pendingApplications },
    { dot: '#19486A', title: 'Course', blurb: 'Manage course content and enrollment.', tab: 'course' },
    { dot: '#56C02B', title: 'Supporters', blurb: 'Sponsor and partner logos on the site.', tab: 'supporters' },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F6FAF7] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00A651] mx-auto"></div>
          <p className="mt-4 text-sm text-[#7d8a83]">Loading admin data…</p>
        </div>
      </div>
    )
  }

  if (!currentUser || (currentUser.role !== 'admin' && !(Array.isArray(config.admins?.emails) && currentUser.email && config.admins.emails.map((e: string) => e.toLowerCase()).includes(currentUser.email.toLowerCase())))) {
    return (
      <div className="min-h-screen bg-[#F6FAF7] flex items-center justify-center px-5">
        <div className={`${adminCardClass} max-w-md w-full p-8 text-center`}>
          <Shield className="w-10 h-10 text-[#7d8a83] mx-auto" />
          <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.28em] text-[#00713a]">GGJ Admin</p>
          <h2 className="mt-2 font-display text-2xl font-extrabold tracking-tight text-[#14201a]">Access denied</h2>
          <p className="mt-2 text-sm leading-relaxed text-[#4c5a52]">
            You need admin privileges to access this dashboard.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <button className={primaryButtonClass} onClick={() => window.history.back()}>Go back</button>
            <button className={quietButtonClass} onClick={() => { window.location.href = `/sign-in?redirect=${encodeURIComponent(window.location.href)}` }}>Sign in</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <AdminShell
      title="Operations overview"
      description="Global Goals Jam platform administration — everything the community runs on, in one place."
      actions={
        <Link to="/" className={quietButtonClass}>
          <Globe className="w-4 h-4" />
          View website
        </Link>
      }
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <TabsList className={railTabsListClass}>
          <TabsTrigger value="overview" className={railTabTriggerClass}>Overview</TabsTrigger>
          <TabsTrigger value="users" className={railTabTriggerClass}>Users</TabsTrigger>
          <TabsTrigger value="events" className={railTabTriggerClass}>Events</TabsTrigger>
          <TabsTrigger value="applications" className={railTabTriggerClass}>
            Applications
            {stats.pendingApplications > 0 && (
              <span className="ml-1.5 font-mono text-xs tabular-nums text-[#00713a]">{stats.pendingApplications}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="media" className={railTabTriggerClass}>Media</TabsTrigger>
          <TabsTrigger value="highlights" className={railTabTriggerClass}>Highlights</TabsTrigger>
          <TabsTrigger value="course" className={railTabTriggerClass}>Course</TabsTrigger>
          <TabsTrigger value="supporters" className={railTabTriggerClass}>Supporters</TabsTrigger>
          <TabsTrigger value="community" className={railTabTriggerClass}>Community</TabsTrigger>
          <TabsTrigger value="settings" className={railTabTriggerClass}>Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-10">
          {/* Stat rail — tabular numbers on hairline dividers */}
          <dl className="grid grid-cols-2 border-y border-[#dfe9e2] sm:grid-cols-3 lg:grid-cols-5 sm:divide-x sm:divide-[#dfe9e2]">
            {statRail.map((s, i) => (
              <div key={s.label} className={`py-5 ${i === 0 ? 'pr-4 sm:pr-6' : 'px-4 sm:px-6'}`}>
                <dd className="font-display text-3xl font-extrabold tabular-nums text-[#14201a]">{s.value}</dd>
                <dt className="mt-1 text-[13px] font-semibold text-[#14201a]">{s.label}</dt>
                <p className="mt-0.5 text-[12px] leading-snug text-[#7d8a83]">{s.sub}</p>
              </div>
            ))}
          </dl>

          <div className="grid gap-8 lg:grid-cols-3 lg:gap-6">
            {/* Tool grid */}
            <section className="lg:col-span-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#00713a]">Tools</p>
              <div className="mt-4 grid gap-px overflow-hidden rounded-2xl border border-[#dfe9e2] bg-[#dfe9e2] sm:grid-cols-2">
                {tools.map((tool) => {
                  const inner = (
                    <>
                      <span className="flex items-center justify-between">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: tool.dot }} aria-hidden="true" />
                        <ArrowRight className="h-4 w-4 text-[#7d8a83] transition-transform group-hover:translate-x-1 group-hover:text-[#00713a]" />
                      </span>
                      <span className="mt-3 flex items-center gap-2 font-display text-base font-extrabold text-[#14201a]">
                        {tool.title}
                        {typeof tool.count === 'number' && tool.count > 0 && (
                          <Pill tone="amber">{tool.count} pending</Pill>
                        )}
                      </span>
                      <span className="mt-1 block text-[13px] leading-relaxed text-[#4c5a52]">{tool.blurb}</span>
                    </>
                  )
                  return tool.to ? (
                    <Link key={tool.title} to={tool.to} className="group bg-white p-5 transition-colors hover:bg-[#F6FAF7]">
                      {inner}
                    </Link>
                  ) : (
                    <button
                      key={tool.title}
                      type="button"
                      onClick={() => setActiveTab(tool.tab!)}
                      className="group bg-white p-5 text-left transition-colors hover:bg-[#F6FAF7]"
                    >
                      {inner}
                    </button>
                  )
                })}
              </div>
            </section>

            {/* Recent activity */}
            <section>
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#00713a]">Latest events</p>
              <div className={`${adminCardClass} mt-4 overflow-hidden`}>
                {events.length === 0 ? (
                  <p className="p-6 text-center text-sm text-[#7d8a83]">No events yet.</p>
                ) : (
                  <ul className="divide-y divide-[#dfe9e2]">
                    {events.slice(0, 6).map(event => (
                      <li key={event.id} className="flex items-start justify-between gap-3 px-5 py-3.5">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[#14201a]">{event.title}</p>
                          <p className="mt-0.5 font-mono text-xs tabular-nums text-[#7d8a83]">{formatDate(event.createdAt)}</p>
                        </div>
                        <Pill tone={statusTone(event.status)}>{event.status}</Pill>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="border-t border-[#dfe9e2] px-5 py-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab('events')}
                    className="inline-flex items-center text-sm font-semibold text-[#00713a] transition-colors hover:text-[#008a44]"
                  >
                    Manage all events <ArrowRight className="ml-1.5 h-4 w-4" />
                  </button>
                </div>
              </div>
            </section>
          </div>
        </TabsContent>

        <TabsContent value="users">
          <div className={`${adminCardClass} overflow-hidden`}>
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#dfe9e2] px-6 py-5">
              <div>
                <h2 className="font-display text-lg font-extrabold text-[#14201a]">Latest sign-ups</h2>
                <p className="mt-0.5 text-sm text-[#4c5a52]">The ten newest accounts on the platform.</p>
              </div>
              <Link to="/admin/users" className="inline-flex items-center text-sm font-semibold text-[#00713a] transition-colors hover:text-[#008a44]">
                Open user management <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </div>
            <ul className="divide-y divide-[#dfe9e2]">
              {users.slice(0, 10).map(user => (
                <li key={user.id} className="flex items-center justify-between gap-4 px-6 py-3.5">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#00A651]/10 font-display text-sm font-extrabold text-[#00713a]">
                      {(user.displayName || user.email || '?').charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#14201a]">{user.displayName || user.email}</p>
                      <p className="truncate text-[13px] text-[#7d8a83]">
                        {user.email}
                        {user.location && (
                          <span className="ml-2 inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{user.location}</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3 text-right">
                    <Pill tone={roleTone(user.role)}>{user.role}</Pill>
                    <span className="hidden font-mono text-xs tabular-nums text-[#7d8a83] sm:block">{formatDate(user.createdAt)}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </TabsContent>

        <TabsContent value="events">
          <div className={`${adminCardClass} overflow-hidden`}>
            <div className="border-b border-[#dfe9e2] px-6 py-5">
              <h2 className="font-display text-lg font-extrabold text-[#14201a]">Event management</h2>
              <p className="mt-0.5 text-sm text-[#4c5a52]">Publish, draft and update every Global Goals Jam event.</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Input
                  placeholder="Search events…"
                  className="h-9 max-w-sm rounded-full border-[#dfe9e2] bg-white text-sm"
                  value={eventSearch}
                  onChange={(e) => setEventSearch(e.target.value)}
                />
                <Select value={eventStatusFilter} onValueChange={setEventStatusFilter}>
                  <SelectTrigger className="h-9 w-44 rounded-full border-[#dfe9e2] bg-white text-sm">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="ongoing">Ongoing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <ul className="divide-y divide-[#dfe9e2]">
              {events
                .filter(e => {
                  const matchesSearch = eventSearch.trim() === '' ||
                    e.title.toLowerCase().includes(eventSearch.toLowerCase()) ||
                    (e.location || '').toLowerCase().includes(eventSearch.toLowerCase()) ||
                    (e.hostName || '').toLowerCase().includes(eventSearch.toLowerCase())
                  const matchesStatus = eventStatusFilter === 'all' || e.status === eventStatusFilter
                  return matchesSearch && matchesStatus
                })
                .map(event => (
                <li key={event.id} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 px-6 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[#14201a]">{event.title}</p>
                    <p className="mt-0.5 text-[13px] text-[#4c5a52]">
                      {event.location} · <span className="font-mono text-xs tabular-nums text-[#7d8a83]">{formatDate(event.eventDate)}</span>
                    </p>
                    {event.hostName && (
                      <p className="text-[12px] text-[#7d8a83]">Host: {event.hostName}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <div className="text-right">
                      <Pill tone={statusTone(event.status)}>{event.status}</Pill>
                      {event.sdgFocus && (
                        <p className="mt-1 text-[11px] text-[#7d8a83]">SDG: {event.sdgFocus}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#7d8a83]">Visible</span>
                      <Switch
                        checked={event.status === 'published'}
                        onCheckedChange={(val) => toggleEventVisibility(event.id, Boolean(val))}
                      />
                    </div>
                    <Link
                      to={`/events/${event.id}`}
                      title="View event"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#dfe9e2] bg-white text-[#7d8a83] transition-colors hover:border-[#00A651]/50 hover:text-[#00713a]"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                    <Select onValueChange={(value) => updateEventStatus(event.id, value)}>
                      <SelectTrigger className="h-8 w-32 rounded-full border-[#dfe9e2] bg-white text-xs">
                        <SelectValue placeholder="Actions" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="published">Publish</SelectItem>
                        <SelectItem value="draft">Set to Draft</SelectItem>
                        <SelectItem value="completed">Mark Complete</SelectItem>
                        <SelectItem value="cancelled">Cancel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </li>
              ))}
              {events.length === 0 && (
                <li className="px-6 py-10 text-center text-sm text-[#7d8a83]">No events yet.</li>
              )}
            </ul>
          </div>
        </TabsContent>

        <TabsContent value="applications">
          <div className={`${adminCardClass} overflow-hidden`}>
            <div className="border-b border-[#dfe9e2] px-6 py-5">
              <h2 className="font-display text-lg font-extrabold text-[#14201a]">Host applications</h2>
              <p className="mt-0.5 text-sm text-[#4c5a52]">Review and approve people who want to host a jam.</p>
            </div>
            {hostApplications.filter(app => app.status === 'pending').length === 0 ? (
              <div className="px-6 py-14 text-center">
                <UserCheck className="mx-auto h-10 w-10 text-[#7d8a83]" />
                <h3 className="mt-4 font-display text-lg font-extrabold text-[#14201a]">No applications pending</h3>
                <p className="mt-1 text-sm text-[#7d8a83]">Host applications will appear here for review.</p>
              </div>
            ) : (
              <ul className="divide-y divide-[#dfe9e2]">
                {hostApplications.filter(app => app.status === 'pending').map(application => (
                  <li key={application.id} className="space-y-4 px-6 py-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold text-[#14201a]">{application.email}</h3>
                        <p className="mt-1 flex items-center gap-1.5 text-[13px] text-[#4c5a52]">
                          <MapPin className="h-3.5 w-3.5" />
                          {application.location}
                        </p>
                        <p className="mt-1 font-mono text-xs tabular-nums text-[#7d8a83]">
                          Applied {formatDate(application.createdAt)}
                        </p>
                      </div>
                      <Pill tone={statusTone(application.status)}>{application.status}</Pill>
                    </div>

                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#7d8a83]">Motivation</p>
                      <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-[#4c5a52]">
                        {application.motivation}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2.5">
                      <button
                        type="button"
                        onClick={() => approveHostApplication(application.id)}
                        className={primaryButtonClass}
                      >
                        <CheckCircle className="h-4 w-4" />
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => rejectHostApplication(application.id)}
                        className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition-colors hover:border-red-400 hover:bg-red-50"
                      >
                        <XCircle className="h-4 w-4" />
                        Reject
                      </button>
                      <a href={`mailto:${application.email}`} className={quietButtonClass}>
                        <Mail className="h-4 w-4" />
                        Contact
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </TabsContent>

        <TabsContent value="media">
          <div className="space-y-4">
            <div>
              <h2 className="font-display text-lg font-extrabold text-[#14201a]">Media library</h2>
              <p className="mt-0.5 text-sm text-[#4c5a52]">The latest uploaded media files and assets.</p>
            </div>
            {media.length === 0 ? (
              <div className={`${adminCardClass} px-6 py-14 text-center`}>
                <ImageIcon className="mx-auto h-10 w-10 text-[#7d8a83]" />
                <p className="mt-4 text-sm text-[#7d8a83]">No media uploaded yet.</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {media.slice(0, 9).map(file => (
                  <div key={file.id} className={`${adminCardClass} p-5`}>
                    <div className="flex items-center gap-3">
                      {file.fileType.startsWith('image/') ? (
                        <ImageIcon className="h-7 w-7 text-[#26BDE2]" />
                      ) : file.fileType.startsWith('video/') ? (
                        <Video className="h-7 w-7 text-[#00A651]" />
                      ) : (
                        <FileText className="h-7 w-7 text-[#7d8a83]" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[#14201a]">{file.title}</p>
                        <p className="truncate font-mono text-xs text-[#7d8a83]">{file.fileType}</p>
                      </div>
                    </div>

                    {file.description && (
                      <p className="mt-3 line-clamp-2 text-[13px] leading-relaxed text-[#4c5a52]">{file.description}</p>
                    )}

                    <div className="mt-4 flex items-center justify-between border-t border-[#dfe9e2] pt-3">
                      <p className="font-mono text-xs tabular-nums text-[#7d8a83]">{formatDate(file.createdAt)}</p>
                      <div className="flex gap-1.5">
                        <a
                          href={file.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Open file"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#dfe9e2] bg-white text-[#7d8a83] transition-colors hover:border-[#00A651]/50 hover:text-[#00713a]"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                        <button
                          type="button"
                          title="Delete file"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#dfe9e2] bg-white text-[#7d8a83] transition-colors hover:border-red-300 hover:text-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="highlights">
          <div className={`${adminCardClass} px-6 py-14 text-center`}>
            <Sparkles className="mx-auto h-10 w-10 text-[#00A651]" />
            <h2 className="mt-4 font-display text-lg font-extrabold text-[#14201a]">Highlights gallery</h2>
            <p className="mx-auto mt-1 max-w-md text-sm leading-relaxed text-[#4c5a52]">
              Review, verify and manage the jam photos shown across the site.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link to="/admin/highlights" className={primaryButtonClass}>
                Open highlights manager <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/admin/carousel" className={quietButtonClass}>
                <ImageIcon className="h-4 w-4" />
                Carousel images
              </Link>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="course">
          <CourseManagement />
        </TabsContent>

        <TabsContent value="supporters">
          <SupportersAdmin />
        </TabsContent>

        <TabsContent value="community">
          <div className={`${adminCardClass} px-6 py-14 text-center`}>
            <MessageSquare className="mx-auto h-10 w-10 text-[#7d8a83]" />
            <h2 className="mt-4 font-display text-lg font-extrabold text-[#14201a]">Community features</h2>
            <p className="mx-auto mt-1 max-w-md text-sm leading-relaxed text-[#4c5a52]">
              Forum management and community moderation tools.
            </p>
            <div className="mt-6">
              <Link to="/community" className={quietButtonClass}>
                <ExternalLink className="h-4 w-4" />
                View community
              </Link>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className={`${adminCardClass} p-6`}>
              <h2 className="font-display text-lg font-extrabold text-[#14201a]">Site settings</h2>
              <div className="mt-5 space-y-4">
                <div>
                  <Label className="text-[13px] font-semibold text-[#14201a]">Site Title</Label>
                  <Input className="mt-1.5 rounded-xl border-[#dfe9e2] bg-white" value="Global Goals Jam" readOnly />
                </div>
                <div>
                  <Label className="text-[13px] font-semibold text-[#14201a]">Site Description</Label>
                  <Input className="mt-1.5 rounded-xl border-[#dfe9e2] bg-white" value="Community platform for hosting Global Goals Jam events" readOnly />
                </div>
                <button type="button" className={primaryButtonClass}>Save changes</button>
              </div>
            </div>

            <div className={`${adminCardClass} p-6`}>
              <h2 className="font-display text-lg font-extrabold text-[#14201a]">Integrations</h2>
              <ul className="mt-5 divide-y divide-[#dfe9e2]">
                <li className="flex items-center justify-between py-3">
                  <span className="text-sm text-[#4c5a52]">Email notifications</span>
                  <Pill tone="green">active</Pill>
                </li>
                <li className="flex items-center justify-between py-3">
                  <span className="text-sm text-[#4c5a52]">Mollie payments</span>
                  <Pill tone="green">connected</Pill>
                </li>
                <li className="flex items-center justify-between py-3">
                  <span className="text-sm text-[#4c5a52]">Analytics</span>
                  <Pill tone="amber">setup required</Pill>
                </li>
              </ul>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </AdminShell>
  )
}
