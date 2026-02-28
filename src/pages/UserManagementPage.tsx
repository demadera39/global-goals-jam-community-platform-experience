import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Search, Mail, Key, Trash2, Shield, User, Edit, AlertCircle, CheckCircle, Clock, X, Send, Loader2, Award, LogIn } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { blink } from '@/lib/blink'
import { config } from '@/lib/config'
import { showCertificateInNewTab, createCertificateRecord } from '@/lib/certificates'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import { sendTestReceiptEmail } from '@/lib/notifications'
import { appAuth } from '@/lib/simpleAuth'

interface UserData {
  id: string
  email: string
  displayName: string
  role: string
  status: string
  location?: string
  createdAt: string
  passwordHash?: string
}

interface PasswordResetData {
  id: string
  userId: string
  email: string
  token: string
  expiresAt: string
  used: number
  createdAt: string
}

export default function UserManagementPage() {
  const { toast } = useToast()
  const [users, setUsers] = useState<UserData[]>([])
  const [enrollments, setEnrollments] = useState<Record<string, { status: 'not_enrolled' | 'pending' | 'active' | 'completed'; isPaid: boolean; paidStrict: boolean; stripePaymentIntent?: string; enrolledAt?: string }>>({})
  const [passwordResets, setPasswordResets] = useState<PasswordResetData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingInviteId, setProcessingInviteId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    displayName: '',
    role: '',
    status: '',
    location: '',
    courseStatus: 'not_enrolled' as 'not_enrolled' | 'pending' | 'active' | 'completed',
    markPaid: false
  })
  const [isImpersonating, setIsImpersonating] = useState(false)

  useEffect(() => {
    try {
      setIsImpersonating(!!localStorage.getItem('impersonator_user'))
    } catch { setIsImpersonating(false) }
  }, [])

  const loadUsers = async () => {
    try {
      const data = await blink.db.users.list({
        orderBy: { createdAt: 'desc' },
        limit: 100
      })
      setUsers(data as UserData[])
    } catch (error) {
      console.error('Failed to load users:', error)
      toast({
        title: 'Error loading users',
        description: 'Failed to fetch user data',
        variant: 'destructive'
      })
    }
  }

  const loadPasswordResets = async () => {
    try {
      const data = await blink.db.passwordResets.list({
        orderBy: { createdAt: 'desc' },
        limit: 50
      })
      setPasswordResets(data as PasswordResetData[])
    } catch (error) {
      console.error('Failed to load password resets:', error)
    }
  }

  const loadEnrollments = async () => {
    try {
      const list = await blink.db.courseEnrollments.list({
        orderBy: { enrolledAt: 'desc' },
        limit: 1000
      }) as any[]
      const map: Record<string, { status: 'not_enrolled' | 'pending' | 'active' | 'completed'; isPaid: boolean; paidStrict: boolean; stripePaymentIntent?: string; enrolledAt?: string }> = {}
      for (const e of list) {
        if (!e?.userId) continue
        const status = (e.status === 'completed') ? 'completed' : (e.status === 'active') ? 'active' : (e.status === 'pending') ? 'pending' : 'not_enrolled'
        const isPaid = !!(e.amountPaid && parseFloat(e.amountPaid) > 0)
        const paidStrict = (status === 'active' || status === 'completed') && !!(e.stripePaymentIntent && String(e.stripePaymentIntent).trim() !== '')
        // Always keep the most valid/latest record per user
        const existing = map[e.userId]
        if (!existing || (existing.status !== 'completed' && status === 'completed') || (existing.status === 'pending' && (status === 'active' || status === 'completed'))) {
          map[e.userId] = { status, isPaid, paidStrict, stripePaymentIntent: e.stripePaymentIntent, enrolledAt: e.enrolledAt }
        }
      }
      setEnrollments(map)
    } catch (error) {
      console.error('Failed to load enrollments:', error)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([loadUsers(), loadPasswordResets()])
      await loadEnrollments()
      setLoading(false)
    }
    loadData()
  }, [])

  const handleEditUser = (user: UserData) => {
    setSelectedUser(user)
    const e = enrollments[user.id]
    setEditForm({
      displayName: user.displayName,
      role: user.role,
      status: user.status,
      location: user.location || '',
      courseStatus: e?.status || 'not_enrolled',
      markPaid: !!e?.paidStrict
    })
    setShowEditDialog(true)
  }

  const handleSaveEdit = async () => {
    if (!selectedUser) return

    setIsProcessing(true)
    try {
      await blink.db.users.update(selectedUser.id, {
        displayName: editForm.displayName,
        role: editForm.role,
        status: editForm.status,
        location: editForm.location || null,
        updatedAt: new Date().toISOString()
      })

      // Update course enrollment based on edit form
      try {
        const existing = await blink.db.courseEnrollments.list({
          where: { userId: selectedUser.id },
          orderBy: { createdAt: 'desc' },
          limit: 1
        }) as any[]
        const rec = existing?.[0]
        const desired = editForm.courseStatus
        if (desired === 'not_enrolled') {
          if (rec) {
            await blink.db.courseEnrollments.delete(rec.id)
          }
        } else {
          const update: any = {
            userId: selectedUser.id,
            status: desired,
            updatedAt: new Date().toISOString()
          }
          if (!rec) {
            update.enrolledAt = new Date().toISOString()
            if (editForm.markPaid) {
              update.amountPaid = '39.99'
              update.stripePaymentIntent = `manual_${Date.now()}`
            }
            await blink.db.courseEnrollments.create(update)
          } else {
            if (editForm.markPaid) {
              update.amountPaid = rec.amountPaid || '39.99'
              update.stripePaymentIntent = rec.stripePaymentIntent || `manual_${Date.now()}`
            } else {
              update.amountPaid = rec.amountPaid || null
              update.stripePaymentIntent = rec.stripePaymentIntent || null
            }
            await blink.db.courseEnrollments.update(rec.id, update)
          }
        }
        await loadEnrollments()
      } catch (e) {
        console.warn('Enrollment update failed', e)
      }

      toast({
        title: 'User updated',
        description: `Successfully updated ${editForm.displayName}`
      })

      setShowEditDialog(false)
      await Promise.all([loadUsers(), loadEnrollments()])
    } catch (error) {
      console.error('Failed to update user:', error)
      toast({
        title: 'Update failed',
        description: 'Failed to update user details',
        variant: 'destructive'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSendPasswordReset = async () => {
    if (!selectedUser) return

    setIsProcessing(true)
    try {
      const response = await fetch(config.api.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'forgot-password',
          email: selectedUser.email
        })
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: 'Password reset sent',
          description: `Password reset email sent to ${selectedUser.email}`,
        })
        setShowPasswordDialog(false)
        await loadPasswordResets()
      } else {
        throw new Error(result.error || 'Failed to send reset email')
      }
    } catch (error: any) {
      console.error('Failed to send password reset:', error)
      toast({
        title: 'Failed to send reset',
        description: error.message || 'Could not send password reset email',
        variant: 'destructive'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSetPassword = async () => {
    if (!selectedUser) return

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'Please ensure both passwords are identical',
        variant: 'destructive'
      })
      return
    }

    if (newPassword.length < 8) {
      toast({
        title: 'Password too short',
        description: 'Password must be at least 8 characters long',
        variant: 'destructive'
      })
      return
    }

    setIsProcessing(true)
    try {
      // Edge-safe PBKDF2 password hashing (matches functions/auth implementation)
      const hashedPassword = await pbkdf2Hash(newPassword)

      await blink.db.users.update(selectedUser.id, {
        passwordHash: hashedPassword,
        password_hash: hashedPassword,
        updatedAt: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

      toast({
        title: 'Password updated',
        description: `Password has been set for ${selectedUser.email}`
      })

      setShowPasswordDialog(false)
      setNewPassword('')
      setConfirmPassword('')
    } catch (error) {
      console.error('Failed to set password:', error)
      toast({
        title: 'Update failed',
        description: 'Failed to update user password',
        variant: 'destructive'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) return

    setIsProcessing(true)
    try {
      await blink.db.users.delete(selectedUser.id)
      
      toast({
        title: 'User deleted',
        description: `Successfully deleted ${selectedUser.email}`
      })

      setShowDeleteDialog(false)
      await loadUsers()
    } catch (error) {
      console.error('Failed to delete user:', error)
      toast({
        title: 'Delete failed',
        description: 'Failed to delete user',
        variant: 'destructive'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSendTestEmail = async () => {
    setIsProcessing(true)
    try {
      const ok = await sendTestReceiptEmail('me@marcovanhout.com')
      if (ok) {
        toast({ title: 'Test email sent', description: 'Please check your inbox (and spam).' })
      } else {
        toast({ title: 'Send failed', description: 'Could not send test email', variant: 'destructive' })
      }
    } catch (e: any) {
      toast({ title: 'Send failed', description: e?.message || 'Unknown error', variant: 'destructive' })
    } finally {
      setIsProcessing(false)
    }
  }

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.location?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'default'
      case 'host': return 'secondary'
      default: return 'outline'
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved': return 'default'
      case 'pending': return 'secondary'
      case 'suspended': return 'destructive'
      default: return 'outline'
    }
  }

  const isResetExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date()
  }

  const renderCourseBadge = (userId: string) => {
    const info = enrollments[userId]
    if (!info) return <Badge variant="outline">not enrolled</Badge>
    if (info.status === 'completed') return <Badge variant="default">completed</Badge>
    if (info.status === 'active') return <Badge variant="secondary">active</Badge>
    if (info.status === 'pending') return <Badge variant="outline">pending</Badge>
    return <Badge variant="outline">not enrolled</Badge>
  }

  const shouldShowInvite = (user: UserData) => {
    const info = enrollments[user.id]
    return !(info && (info.status === 'active' || info.status === 'completed'))
  }

  const sendCourseInvite = async (user: UserData) => {
    setProcessingInviteId(user.id)
    try {
      const enrollUrl = `${window.location.origin}/course/enroll?utm_source=admin_invite&utm_medium=email&utm_campaign=ggj_course_invite`
      const firstName = (user.displayName || user.email || '').split('@')[0]
      // Immediate feedback while sending
      toast({ title: 'Sending invite...', description: `Sending to ${user.email}` })
      const result: any = await new Promise(async (resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Email send timed out. Please try again.')), 15000)
        try {
          const recipient = String(user.email || '').trim()
          if (!recipient || !recipient.includes('@')) {
            throw new Error('Invalid recipient email')
          }
          const res = await blink.notifications.email({
            to: recipient,
            from: 'marco@globalgoalsjam.org',
            replyTo: 'marco@globalgoalsjam.org',
            subject: 'A personal invite to the GGJ Certification Course',
            html: `
          <div style="font-family: Inter, Arial, sans-serif; max-width: 640px; margin: 0 auto;">
            <div style="background: #00A651; padding: 20px; color: white; border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0;">Global Goals Jam</h1>
            </div>
            <div style="background: #ffffff; padding: 24px; border-radius: 0 0 12px 12px;">
              <p>Hi ${firstName},</p>
              <p><strong>Marco here!</strong> I’m really happy you’ve joined our community. Your energy and experience make the Global Goals Jam stronger.</p>
              <p>I’d love to personally invite you to our Train‑the‑Trainer Certification Course. Enrolling directly supports the platform and unlocks all host tools and methods.</p>
              <ul>
                <li>Unlock the complete host toolkit: methods, templates, and session plans</li>
                <li>Access exclusive brand assets and facilitation resources</li>
                <li>Join the global network of certified GGJ hosts</li>
              </ul>
              <div style="text-align:center; margin: 28px 0;">
                <a href="${enrollUrl}" style="background:#00A651; color:white; padding: 12px 22px; text-decoration:none; border-radius:8px; font-weight:600;">Enroll now</a>
              </div>
              <p>Thank you for supporting the platform and our work as a community. If you already enrolled, you can access your course dashboard anytime from the website.</p>
              <p style="margin-top:24px;">Warmly,<br/>Marco — Global Goals Jam</p>
            </div>
          </div>
        `,
            text: `Hi ${firstName},\n\nMarco here! I’m really happy you’ve joined our community. I’d love to personally invite you to our Train-the-Trainer Certification Course. It supports the platform and unlocks all host tools and methods.\n\nEnroll now: ${enrollUrl}\n\nWarmly,\nMarco — Global Goals Jam`
          })
          clearTimeout(timer)
          resolve(res)
        } catch (e) {
          clearTimeout(timer)
          reject(e)
        }
      })

      if (result && (result as any).success) {
        const msgId = (result as any).messageId ? ` (ID: ${(result as any).messageId})` : ''
        toast({ title: 'Invite sent', description: `Invitation sent to ${user.email}${msgId}` })
        // Do not create pending enrollment automatically; let checkout create/manage it
        await loadEnrollments()
      } else {
        toast({ title: 'Email failed', description: 'Could not send invite email', variant: 'destructive' })
      }
    } catch (err: any) {
      console.error('Invite email error', err)
      toast({ title: 'Email error', description: err?.message || 'Failed to send invite', variant: 'destructive' })
    } finally {
      setProcessingInviteId(null)
    }
  }

  // Certificate download handler
  const handleDownloadCertificate = async (user: UserData) => {
    try {
      const displayName = (user.displayName && user.displayName.trim()) || (user.email?.split('@')[0]) || 'Participant'
      const info = enrollments[user.id]
      const isHostCert = (user.role === 'host') || (info?.status === 'completed')

      if (isHostCert) {
        await showCertificateInNewTab({
          participantName: displayName,
          eventTitle: 'Host Certification Course',
          eventLocation: 'Online',
          eventDate: new Date().toISOString(),
          certificateKind: 'host'
        }, {
          saveRecord: { eventId: 'host-course', recipientId: user.id, certificateType: 'host' }
        })
        toast({ title: 'Host certificate opened', description: 'Use your browser to print or save as PDF.' })
        return
      }

      // Participant certificate: use latest event registration if available
      let eventTitle = 'Global Goals Jam'
      let eventLocation = '—'
      let eventDate = new Date().toISOString()
      try {
        const regs = await blink.db.eventRegistrations.list({ where: { participantId: user.id }, orderBy: { registrationDate: 'desc' }, limit: 1 }) as any[]
        const reg = regs?.[0]
        if (reg?.eventId) {
          const evs = await blink.db.events.list({ where: { id: reg.eventId }, limit: 1 }) as any[]
          const ev = evs?.[0]
          if (ev) {
            eventTitle = ev.title || eventTitle
            eventLocation = ev.location || eventLocation
            eventDate = ev.eventDate || eventDate
          }
        }
      } catch (e) {
        console.warn('Failed to load latest event for participant', e)
      }

      await showCertificateInNewTab({
        participantName: displayName,
        eventTitle,
        eventLocation,
        eventDate,
        certificateKind: 'participation'
      }, {
        saveRecord: { eventId: 'participant-event', recipientId: user.id, certificateType: 'participation' }
      })
      toast({ title: 'Participant certificate opened', description: 'Use your browser to print or save as PDF.' })
    } catch (e: any) {
      console.error('Certificate generation failed', e)
      toast({ title: 'Could not generate certificate', description: e?.message || 'Please try again later', variant: 'destructive' })
    }
  }

  const handleImpersonate = async (user: UserData) => {
    try {
      setIsProcessing(true)

      // Require custom auth token (email+password flow) and admin role
      const currentUserStr = localStorage.getItem('user')
      const currentToken = (localStorage.getItem('auth_token') || '').trim()

      if (!currentUserStr) {
        toast({ title: 'Sign in required', description: 'Please sign in as an admin (email + password) before impersonating.', variant: 'destructive' })
        return
      }

      let currentUser: any = null
      try { currentUser = JSON.parse(currentUserStr) } catch { currentUser = null }
      if (!currentUser?.id || currentUser?.role !== 'admin') {
        toast({ title: 'Admin only', description: 'You must be an admin to impersonate users.', variant: 'destructive' })
        return
      }

      if (!currentToken || currentToken.length < 16) {
        toast({ title: 'Missing token', description: 'Please re-sign in (email + password) to obtain an admin token.', variant: 'destructive' })
        return
      }

      const res = await fetch(config.functions.impersonateUserUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentToken}`
        },
        body: JSON.stringify({ userId: user.id, ttlMinutes: 60 })
      })

      // Try to parse JSON safely
      let data: any = null
      try { data = await res.json() } catch { data = null }

      if (!res.ok || !data?.token) {
        const errMsg = data?.error || (res.status === 403 ? 'Forbidden — your admin session is not recognized. Sign in via email+password and try again.' : 'Failed to impersonate')
        throw new Error(errMsg)
      }

      // Store admin (impersonator) state so we can return later
      localStorage.setItem('impersonator_user', currentUserStr)
      localStorage.setItem('impersonator_token', currentToken)

      // Switch to target user session
      localStorage.setItem('auth_token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))

      // Keep simple auth in sync
      appAuth.set({ id: data.user.id, email: data.user.email, displayName: data.user.displayName, role: data.user.role })

      // Set token in Blink SDK so db/auth state aligns
      try { blink.auth.setToken(data.token) } catch (_) {}

      setIsImpersonating(true)
      toast({ title: 'Now impersonating', description: `${user.email}` })
      window.location.href = '/profile'
    } catch (e: any) {
      console.error('Impersonation failed', e)
      toast({ title: 'Impersonation failed', description: e?.message || 'Could not switch session', variant: 'destructive' })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReturnToAdmin = () => {
    try {
      const adminUserStr = localStorage.getItem('impersonator_user')
      const adminToken = localStorage.getItem('impersonator_token')
      if (!adminUserStr || !adminToken) {
        toast({ title: 'No admin session', description: 'Original admin session not found', variant: 'destructive' })
        return
      }
      localStorage.setItem('auth_token', adminToken)
      localStorage.setItem('user', adminUserStr)
      localStorage.removeItem('impersonator_user')
      localStorage.removeItem('impersonator_token')

      const adminUser = JSON.parse(adminUserStr)
      appAuth.set({ id: adminUser.id, email: adminUser.email, displayName: adminUser.displayName, role: adminUser.role })

      // Restore Blink SDK token as well
      try { blink.auth.setToken(adminToken) } catch (_) {}

      setIsImpersonating(false)
      toast({ title: 'Returned to admin session' })
      window.location.reload()
    } catch (e: any) {
      console.error('Return to admin failed', e)
      toast({ title: 'Restore failed', description: e?.message || 'Could not restore admin session', variant: 'destructive' })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading user data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">User Management</h1>
          <p className="text-muted-foreground">Manage users, reset passwords, and control access</p>
        </div>
        <div className="flex items-center gap-2">
          {isImpersonating && (
            <Button variant="secondary" onClick={handleReturnToAdmin}>
              Return to admin
            </Button>
          )}
          <Button variant="outline" onClick={handleSendTestEmail} disabled={isProcessing}>
            <Mail className="h-4 w-4 mr-2" />
            Send test email
          </Button>
        </div>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList>
          <TabsTrigger value="users">Users ({users.length})</TabsTrigger>
          <TabsTrigger value="resets">Password Resets ({passwordResets.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Users</CardTitle>
              <CardDescription>Manage user accounts and permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by email, name, or location..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <ScrollArea className="h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Paid</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{user.displayName}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getRoleBadgeVariant(user.role)}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(user.status)}>
                            {user.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {renderCourseBadge(user.id)}
                        </TableCell>
                        <TableCell>
                          {(() => {
                            const info = enrollments[user.id]
                            if (info?.paidStrict) {
                              return <Badge variant="secondary">yes</Badge>
                            }
                            return <Badge variant="outline">no</Badge>
                          })()}
                        </TableCell>
                        <TableCell>{user.location || '-'}</TableCell>
                        <TableCell>
                          {new Date(user.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {shouldShowInvite(user) && (
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => sendCourseInvite(user)}
                                title="Invite to course"
                                disabled={processingInviteId === user.id}
                              >
                                {processingInviteId === user.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Send className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDownloadCertificate(user)}
                              title={(user.role === 'host' || enrollments[user.id]?.status === 'completed') ? 'Download host certificate' : 'Download participant certificate'}
                            >
                              <Award className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleImpersonate(user)}
                              title="Log in as this user"
                            >
                              <LogIn className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleEditUser(user)}
                              title="Edit user"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                setSelectedUser(user)
                                setShowPasswordDialog(true)
                              }}
                              title="Reset password"
                            >
                              <Key className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                setSelectedUser(user)
                                setShowDeleteDialog(true)
                              }}
                              title="Delete user"
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Password Reset History</CardTitle>
              <CardDescription>View recent password reset requests</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Requested</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {passwordResets.map((reset) => (
                      <TableRow key={reset.id}>
                        <TableCell className="font-medium">{reset.email}</TableCell>
                        <TableCell>
                          {new Date(reset.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {new Date(reset.expiresAt).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {Number(reset.used) > 0 ? (
                            <Badge variant="default">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Used
                            </Badge>
                          ) : isResetExpired(reset.expiresAt) ? (
                            <Badge variant="secondary">
                              <X className="h-3 w-3 mr-1" />
                              Expired
                            </Badge>
                          ) : (
                            <Badge variant="outline">
                              <Clock className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user details for {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={editForm.displayName}
                onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <Select
                value={editForm.role}
                onValueChange={(value) => setEditForm({ ...editForm, role: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="participant">Participant</SelectItem>
                  <SelectItem value="host">Host</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={editForm.status}
                onValueChange={(value) => setEditForm({ ...editForm, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={editForm.location}
                onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                placeholder="City, Country"
              />
            </div>
          </div>
          <div className="pt-2 border-t">
            <Label>Course Enrollment</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <div>
                <Label htmlFor="courseStatus">Status</Label>
                <Select
                  value={editForm.courseStatus}
                  onValueChange={(v) => setEditForm({ ...editForm, courseStatus: v as any })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select course status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_enrolled">Not enrolled</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Checkbox id="markPaid" checked={editForm.markPaid} onCheckedChange={(checked) => setEditForm({ ...editForm, markPaid: !!checked })} />
                <Label htmlFor="markPaid">Mark as paid (manual override)</Label>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Marking as paid will set a manual payment reference and allow access immediately.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={isProcessing}>
              {isProcessing ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Password Management Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Password Management</DialogTitle>
            <DialogDescription>
              Reset password for {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <Mail className="h-4 w-4" />
              <AlertDescription>
                Send a password reset email to the user, or manually set a new password.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-4">
              <Button 
                className="w-full" 
                onClick={handleSendPasswordReset}
                disabled={isProcessing}
              >
                <Mail className="h-4 w-4 mr-2" />
                {isProcessing ? 'Sending...' : 'Send Password Reset Email'}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or set manually</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
              </div>

              <Button 
                className="w-full" 
                variant="secondary"
                onClick={handleSetPassword}
                disabled={isProcessing || !newPassword || !confirmPassword}
              >
                <Key className="h-4 w-4 mr-2" />
                {isProcessing ? 'Setting...' : 'Set Password Manually'}
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user?
            </DialogDescription>
          </DialogHeader>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This action cannot be undone. The user <strong>{selectedUser?.email}</strong> will be permanently deleted.
            </AlertDescription>
          </Alert>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteUser}
              disabled={isProcessing}
            >
              {isProcessing ? 'Deleting...' : 'Delete User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Edge-safe PBKDF2 password hashing (matches functions/auth implementation)
async function pbkdf2Hash(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const saltBytes = crypto.getRandomValues(new Uint8Array(16))
  // base64url encode salt
  const salt = btoa(String.fromCharCode(...saltBytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+/g, '')

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  )

  // derive 256 bits
  const derived = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: Uint8Array.from(atob(salt.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0)).buffer, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    256
  )
  const bytes = new Uint8Array(derived)
  const binary = Array.from(bytes).map(b => String.fromCharCode(b)).join('')
  const derivedB64 = btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+/g, '')
  return `${salt}:${derivedB64}`
}
