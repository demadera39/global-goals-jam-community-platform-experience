import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Progress } from '../components/ui/progress'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Switch } from '../components/ui/switch'
import { 
  Users, 
  Calendar, 
  MessageSquare, 
  Gift, 
  GraduationCap, 
  Settings, 
  BarChart3, 
  MapPin, 
  FileText, 
  Mail,
  Shield,
  Key,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Eye,
  Edit,
  Trash2,
  Plus,
  Search,
  Download,
  Upload,
  AlertCircle,
  Globe,
  User,
  UserCheck,
  BookOpen,
  Award,
  Star,
  Heart,
  Sparkles,
  Image as ImageIcon,
  Video,
  ExternalLink,
  Database,
  Bell,
  Zap,
  Filter
} from 'lucide-react'
import SupportersAdmin from '../components/SupportersAdmin'
import CourseManagement from '../components/CourseManagement'
import blink, { getFullUser } from '../lib/blink'
import { config } from '../lib/config'
import toast from 'react-hot-toast'
import { invalidateEventsCache } from '../hooks/usePublishedEvents'

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
  const [currentUser, setCurrentUser] = useState<User | null>(null)
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
        blink.db.users.list({ orderBy: { createdAt: 'desc' } }),
        blink.db.events.list({ orderBy: { createdAt: 'desc' } }),
        blink.db.hostApplications.list({ orderBy: { createdAt: 'desc' } }),
        blink.db.media.list({ orderBy: { createdAt: 'desc' } })
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
      await blink.db.hostApplications.update(applicationId, {
        status: 'approved',
        reviewedBy: currentUser?.id,
        reviewedAt: new Date().toISOString()
      })
      
      const application = hostApplications.find(app => app.id === applicationId)
      if (application?.userId) {
        await blink.db.users.update(application.userId, {
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
      await blink.db.hostApplications.update(applicationId, {
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
      await blink.db.events.update(eventId, { status })
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

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved':
      case 'published':
      case 'completed':
        return 'default'
      case 'pending':
        return 'secondary'
      case 'rejected':
      case 'cancelled':
        return 'destructive'
      case 'draft':
        return 'outline'
      default:
        return 'secondary'
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!currentUser || (currentUser.role !== 'admin' && !(Array.isArray(config.admins?.emails) && currentUser.email && config.admins.emails.map((e: string) => e.toLowerCase()).includes(currentUser.email.toLowerCase())))) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="text-center py-12">
            <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">
              You need admin privileges to access this dashboard.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button onClick={() => window.history.back()}>Go Back</Button>
              <Button variant="outline" onClick={() => { window.location.href = `/sign-in?redirect=${encodeURIComponent(window.location.href)}` }}>Sign In</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
              <p className="text-muted-foreground mt-1">
                Global Goals Jam Platform Administration
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-primary">
                Admin Access
              </Badge>
              <Button variant="outline" asChild>
                <Link to="/">
                  <Globe className="w-4 h-4 mr-2" />
                  View Website
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-10 w-full">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="events" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Events
            </TabsTrigger>
            <TabsTrigger value="applications" className="flex items-center gap-2">
              <UserCheck className="w-4 h-4" />
              Applications
            </TabsTrigger>
            <TabsTrigger value="media" className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              Media
            </TabsTrigger>
            <TabsTrigger value="highlights" className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Highlights
            </TabsTrigger>
            <TabsTrigger value="course" className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              Course
            </TabsTrigger>
            <TabsTrigger value="supporters" className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              Supporters
            </TabsTrigger>
            <TabsTrigger value="community" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Community
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">{stats.totalUsers}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.recentSignups} new this week
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Hosts</CardTitle>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{stats.totalHosts}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.pendingApplications} pending approval
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Events</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{stats.totalEvents}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.publishedEvents} published
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Media Files</CardTitle>
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">{stats.totalMedia}</div>
                  <p className="text-xs text-muted-foreground">
                    Uploaded content
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline" onClick={() => setActiveTab('applications')}>
                      <UserCheck className="w-4 h-4 mr-2" />
                      Review Applications ({stats.pendingApplications})
                    </Button>
                    <Button variant="outline" onClick={() => setActiveTab('events')}>
                      <Calendar className="w-4 h-4 mr-2" />
                      Manage Events
                    </Button>
                    <Button variant="outline" asChild>
                      <Link to="/admin/users">
                        <Users className="w-4 h-4 mr-2" />
                        User Management
                      </Link>
                    </Button>
                    <Button variant="outline" onClick={() => setActiveTab('supporters')}>
                      <Heart className="w-4 h-4 mr-2" />
                      Update Supporters
                    </Button>
                    <Button variant="outline" asChild>
                      <Link to="/admin/certificate-creator">
                        <Award className="w-4 h-4 mr-2" />
                        Create Certificate
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Latest system activity and updates
                    </p>
                    <div className="space-y-2">
                      {events.slice(0, 5).map(event => (
                        <div key={event.id} className="flex items-center gap-3">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <div className="flex-1">
                            <p className="text-sm">{event.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(event.createdAt)}
                            </p>
                          </div>
                          <Badge variant={getStatusBadgeVariant(event.status)}>
                            {event.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Manage all platform users, roles, and permissions
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <Input placeholder="Search users..." className="max-w-sm" />
                    <Select>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Filter by role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="host">Host</SelectItem>
                        <SelectItem value="participant">Participant</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    {users.slice(0, 10).map(user => (
                      <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{user.displayName || user.email}</p>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                              {user.location && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {user.location}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <Badge variant={getStatusBadgeVariant(user.role)}>
                              {user.role}
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDate(user.createdAt)}
                            </p>
                          </div>
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="events" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Event Management</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Manage all Global Goals Jam events and their status
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <Input 
                      placeholder="Search events..." 
                      className="max-w-sm" 
                      value={eventSearch}
                      onChange={(e) => setEventSearch(e.target.value)}
                    />
                    <Select value={eventStatusFilter} onValueChange={setEventStatusFilter}>
                      <SelectTrigger className="w-48">
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

                  <div className="space-y-2">
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
                      <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <Calendar className="w-5 h-5 text-primary" />
                            <div>
                              <p className="font-medium">{event.title}</p>
                              <p className="text-sm text-muted-foreground">
                                {event.location} • {formatDate(event.eventDate)}
                              </p>
                              {event.hostName && (
                                <p className="text-xs text-muted-foreground">
                                  Host: {event.hostName}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <Badge variant={getStatusBadgeVariant(event.status)}>
                              {event.status}
                            </Badge>
                            {event.sdgFocus && (
                              <p className="text-xs text-muted-foreground mt-1">
                                SDG: {event.sdgFocus}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">Visible</span>
                              <Switch
                                checked={event.status === 'published'}
                                onCheckedChange={(val) => toggleEventVisibility(event.id, Boolean(val))}
                              />
                            </div>
                            <Button variant="outline" size="sm" asChild>
                              <Link to={`/events/${event.id}`}>
                                <Eye className="w-4 h-4" />
                              </Link>
                            </Button>
                            <Select onValueChange={(value) => updateEventStatus(event.id, value)}>
                              <SelectTrigger className="w-32">
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
                        </div>
                      </div>
                    ))}
                    {events.length === 0 && (
                      <div className="text-center py-8 text-sm text-muted-foreground">No events yet.</div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="applications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Host Applications</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Review and approve host applications
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {hostApplications.length === 0 ? (
                    <div className="text-center py-8">
                      <UserCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No applications pending</h3>
                      <p className="text-muted-foreground">
                        Host applications will appear here for review
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {hostApplications.filter(app => app.status === 'pending').map(application => (
                        <div key={application.id} className="p-6 border rounded-lg space-y-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold">{application.email}</h3>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <MapPin className="w-4 h-4" />
                                {application.location}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                Applied: {formatDate(application.createdAt)}
                              </p>
                            </div>
                            <Badge variant={getStatusBadgeVariant(application.status)}>
                              {application.status}
                            </Badge>
                          </div>
                          
                          <div>
                            <Label className="text-sm font-medium">Motivation</Label>
                            <p className="text-sm text-muted-foreground mt-1">
                              {application.motivation}
                            </p>
                          </div>

                          <div className="flex gap-3">
                            <Button 
                              onClick={() => approveHostApplication(application.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Approve
                            </Button>
                            <Button 
                              onClick={() => rejectHostApplication(application.id)}
                              variant="destructive"
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Reject
                            </Button>
                            <Button variant="outline">
                              <Mail className="w-4 h-4 mr-2" />
                              Contact
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="media" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Media Management</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Manage uploaded media files and assets
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <Input placeholder="Search media..." className="max-w-sm" />
                    <Select>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Filter by type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="image">Images</SelectItem>
                        <SelectItem value="video">Videos</SelectItem>
                        <SelectItem value="document">Documents</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {media.slice(0, 9).map(file => (
                      <Card key={file.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-3">
                            {file.fileType.startsWith('image/') ? (
                              <ImageIcon className="w-8 h-8 text-blue-500" />
                            ) : file.fileType.startsWith('video/') ? (
                              <Video className="w-8 h-8 text-green-500" />
                            ) : (
                              <FileText className="w-8 h-8 text-gray-500" />
                            )}
                            <div className="flex-1">
                              <p className="font-medium text-sm">{file.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {file.fileType}
                              </p>
                            </div>
                          </div>
                          
                          {file.description && (
                            <p className="text-xs text-muted-foreground mb-3">
                              {file.description}
                            </p>
                          )}
                          
                          <div className="flex justify-between items-center">
                            <p className="text-xs text-muted-foreground">
                              {formatDate(file.createdAt)}
                            </p>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" asChild>
                                <a href={file.fileUrl} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </Button>
                              <Button size="sm" variant="destructive">
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="highlights" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Jam Highlights Management</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Manage the photo carousel showcasing Global Goals Jam moments from around the world
                </p>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Sparkles className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Highlights Gallery</h3>
                  <p className="text-muted-foreground mb-4">
                    Review, verify, and manage scraped jam photos
                  </p>
                  <div className="flex gap-3">
                    <Button asChild>
                      <Link to="/admin/highlights">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Open Highlights Manager
                      </Link>
                    </Button>
                    <Button variant="outline" asChild>
                      <Link to="/admin/carousel">
                        <ImageIcon className="w-4 h-4 mr-2" />
                        Carousel Images
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="course">
            <CourseManagement />
          </TabsContent>

          <TabsContent value="supporters">
            <SupportersAdmin />
          </TabsContent>

          <TabsContent value="community" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Community Management</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Manage forum posts, discussions, and community features
                </p>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Community Features</h3>
                  <p className="text-muted-foreground mb-4">
                    Forum management and community moderation tools
                  </p>
                  <Button variant="outline" asChild>
                    <Link to="/community">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View Community
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Site Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Site Title</Label>
                    <Input value="Global Goals Jam" />
                  </div>
                  <div>
                    <Label>Site Description</Label>
                    <Input value="Community platform for hosting Global Goals Jam events" />
                  </div>
                  <Button>Save Changes</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Integration Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span>Email Notifications</span>
                      <Badge variant="default">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Stripe Payments</span>
                      <Badge variant="default">Connected</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Analytics</span>
                      <Badge variant="secondary">Setup Required</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}