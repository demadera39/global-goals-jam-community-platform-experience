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
import { db, auth, notifications, supabase } from '@/lib/supabase'
import { config } from '@/lib/config'
import { showCertificateInNewTab, createCertificateRecord } from '@/lib/certificates'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import { sendTestReceiptEmail } from '@/lib/notifications'
import { appAuth } from '@/lib/simpleAuth'
import MessageUserDialog, { MessageTemplate } from '@/components/admin/MessageUserDialog'

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
  const [enrollments, setEnrollments] = useState<Record<string, { status: 'not_enrolled' | 'pending' | 'active' | 'completed'; isPaid: boolean; paidStrict: boolean; hasRealPayment: boolean; isManualOverride: boolean; needsPaymentReview: boolean; molliePaymentId?: string; amountPaid?: string | null; enrolledAt?: string }>>({})
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
  const [processingInquiryId, setProcessingInquiryId] = useState<string | null>(null)
  const [messageDialogOpen, setMessageDialogOpen] = useState(false)
  const [messageRecipient, setMessageRecipient] = useState<UserData | null>(null)
  const [messageTemplate, setMessageTemplate] = useState<MessageTemplate>('invite')
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
      const data = await db.users.list({
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
      const data = await db.passwordResets.list({
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
      const list = await db.courseEnrollments.list({
        orderBy: { enrolledAt: 'desc' },
        limit: 1000
      }) as any[]
      const map: Record<string, { status: 'not_enrolled' | 'pending' | 'active' | 'completed'; isPaid: boolean; paidStrict: boolean; hasRealPayment: boolean; isManualOverride: boolean; needsPaymentReview: boolean; molliePaymentId?: string; amountPaid?: string | null; enrolledAt?: string }> = {}
      for (const e of list) {
        if (!e?.userId) continue
        const status = (e.status === 'completed') ? 'completed' : (e.status === 'active') ? 'active' : (e.status === 'pending') ? 'pending' : 'not_enrolled'
        // Single source of truth for any kind of "paid": actual amount_paid > 0.
        // This covers real Mollie payments AND manual admin overrides (both write amount_paid).
        const isPaid = !!(e.amountPaid && parseFloat(e.amountPaid) > 0)
        const paidStrict = isPaid
        // Real payment = amount recorded AND payment ref looks like a real provider id.
        // `mollie_payment_id` was renamed from `stripe_session_id` in migration
        // 20260313100000_stripe_to_mollie.sql, so legacy Stripe sessions (cs_/pi_) are
        // also stored there and count as real payments.
        const molliePaymentId = String(e.molliePaymentId || '').trim()
        const hasRealPayment = isPaid && (
          molliePaymentId.startsWith('tr_') ||  // Mollie transaction
          molliePaymentId.startsWith('cs_') ||  // Stripe checkout session (legacy)
          molliePaymentId.startsWith('pi_')     // Stripe payment intent (legacy)
        )
        // Manual override = paid but no real provider ref (e.g. "manual_<timestamp>" or empty).
        const isManualOverride = isPaid && !hasRealPayment
        // Flag users who look "done" but have no recorded payment — likely abandoned / expired Mollie checkouts
        // where the course status was flipped manually or via legacy data.
        const needsPaymentReview = (status === 'active' || status === 'completed') && !isPaid
        const existing = map[e.userId]
        if (!existing || (existing.status !== 'completed' && status === 'completed') || (existing.status === 'pending' && (status === 'active' || status === 'completed'))) {
          map[e.userId] = { status, isPaid, paidStrict, hasRealPayment, isManualOverride, needsPaymentReview, molliePaymentId: e.molliePaymentId, amountPaid: e.amountPaid, enrolledAt: e.enrolledAt }
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
      markPaid: !!e?.isPaid
    })
    setShowEditDialog(true)
  }

  const handleSaveEdit = async () => {
    if (!selectedUser) return

    setIsProcessing(true)
    try {
      await db.users.update(selectedUser.id, {
        displayName: editForm.displayName,
        role: editForm.role,
        status: editForm.status,
        location: editForm.location || null,
        updatedAt: new Date().toISOString()
      })

      // Update course enrollment based on edit form
      try {
        const existing = await db.courseEnrollments.list({
          where: { userId: selectedUser.id },
          orderBy: { enrolledAt: 'desc' },
          limit: 1
        }) as any[]
        const rec = existing?.[0]
        const desired = editForm.courseStatus
        if (desired === 'not_enrolled') {
          if (rec) {
            try {
              await db.courseEnrollments.delete(rec.id)
            } catch (delErr) {
              await db.courseEnrollments.update(rec.id, { status: 'expired', updatedAt: new Date().toISOString() })
            }
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
              update.molliePaymentId = `manual_${Date.now()}`
            }
            await db.courseEnrollments.create(update)
          } else {
            if (editForm.markPaid) {
              update.amountPaid = rec.amountPaid || '39.99'
              update.molliePaymentId = rec.molliePaymentId || `manual_${Date.now()}`
            } else {
              // Explicitly clear payment when admin unchecks "Mark as paid".
              // Previous code used `rec.amountPaid || null` which kept the
              // existing value (e.g. '39.99' stays '39.99'), making the
              // checkbox a silent no-op.
              update.amountPaid = null
              update.molliePaymentId = null
            }
            await db.courseEnrollments.update(rec.id, update)
          }
        }
        await loadEnrollments()
      } catch (e: any) {
        console.error('Enrollment update failed', e)
        toast({
          title: 'Enrollment update failed',
          description: e?.message || 'Could not save course status / payment',
          variant: 'destructive'
        })
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
      // Use Supabase Auth's native recovery flow (not the dead /auth endpoint).
      // Supabase emails the recipient a magic link that lands on /reset-password
      // and triggers PASSWORD_RECOVERY for the inline updateUser flow.
      const redirectTo = `${window.location.origin}/reset-password`
      const { error } = await supabase.auth.resetPasswordForEmail(
        selectedUser.email.trim().toLowerCase(),
        { redirectTo }
      )
      if (error) throw error

      toast({
        title: 'Password reset sent',
        description: `Reset link emailed to ${selectedUser.email}. If it doesn't arrive within a few minutes, check Supabase Auth → SMTP settings.`,
      })
      setShowPasswordDialog(false)
      await loadPasswordResets()
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
      // Call the set-user-password edge function. It uses the service-role key
      // to update auth.users.encrypted_password for Supabase Auth users (UUID
      // ids) AND mirror to public.users.password_hash for legacy users. The
      // previous code only updated password_hash, which silently did nothing
      // for Supabase Auth users — they could never log in with the new
      // password.
      const { data: { session } } = await supabase.auth.getSession()
      const adminToken = session?.access_token || ''
      if (!adminToken) {
        throw new Error('Admin session expired — sign back in and try again.')
      }

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/set-user-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ userId: selectedUser.id, email: selectedUser.email, password: newPassword }),
      })
      const result = await res.json().catch(() => ({}))
      if (!res.ok || !result?.success) {
        throw new Error(result?.error || `HTTP ${res.status} from set-user-password`)
      }

      toast({
        title: 'Password updated',
        description: `New password set for ${selectedUser.email} (${result.backend === 'supabase_auth' ? 'Supabase Auth — they can sign in immediately' : 'legacy auth path'}).`
      })

      setShowPasswordDialog(false)
      setNewPassword('')
      setConfirmPassword('')
    } catch (error: any) {
      console.error('Failed to set password:', error)
      toast({
        title: 'Update failed',
        description: error?.message || 'Failed to update user password',
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
      await db.users.delete(selectedUser.id)
      
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

  const openMessageDialog = (user: UserData, template: MessageTemplate = 'invite') => {
    setMessageRecipient(user)
    setMessageTemplate(template)
    setMessageDialogOpen(true)
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
          const res = await notifications.email({
            to: recipient,
            from: 'Global Goals Jam <marco@globalgoalsjam.org>',
            subject: 'You\'re Invited to the GGJ Host Certification Course!',
            html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: #00A651; padding: 24px; text-align: center;">
                <h1 style="color: white; margin: 0;">You're Invited!</h1>
              </div>
              <div style="padding: 24px;">
                <p>Hi ${firstName},</p>
                <p>You've been invited to enroll in the <strong>GGJ Host Certification Course</strong>.</p>
                <p>This course will equip you with the skills and knowledge to host a Global Goals Jam in your community.</p>
                <p><a href="${enrollUrl}" style="display:inline-block;padding:12px 24px;background:#00A651;color:white;text-decoration:none;border-radius:8px;font-weight:bold;">Enroll Now</a></p>
              </div>
            </div>`,
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

  // Payment inquiry — friendly follow-up for users whose Mollie checkout expired
  const sendPaymentInquiry = async (user: UserData) => {
    const confirm = window.confirm(
      `Send a friendly payment follow-up to ${user.email}?\n\nThis asks if they hit an issue with checkout and offers a fresh link to complete enrollment.`
    )
    if (!confirm) return

    setProcessingInquiryId(user.id)
    try {
      const enrollUrl = `${window.location.origin}/course/enroll?utm_source=admin_inquiry&utm_medium=email&utm_campaign=ggj_course_payment_followup`
      const firstName = (user.displayName || user.email || '').split('@')[0]
      toast({ title: 'Sending follow-up...', description: `Sending to ${user.email}` })
      const recipient = String(user.email || '').trim()
      if (!recipient || !recipient.includes('@')) {
        throw new Error('Invalid recipient email')
      }
      const result: any = await new Promise(async (resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Email send timed out. Please try again.')), 15000)
        try {
          const res = await notifications.email({
            to: recipient,
            from: 'Global Goals Jam <marco@globalgoalsjam.org>',
            subject: 'Everything OK with your GGJ enrollment?',
            html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #111827;">
              <div style="background: #00A651; padding: 24px; text-align: center;">
                <h1 style="color: white; margin: 0;">A quick check-in</h1>
              </div>
              <div style="padding: 24px; line-height: 1.6;">
                <p>Hi ${firstName},</p>
                <p>I noticed you started signing up for the <strong>GGJ Host Certification Course</strong>, but your payment didn't come through. These things happen — a bank redirect can time out, the iDEAL app doesn't always open, or life just got in the way.</p>
                <p>Was there anything that went wrong on your side? I'd love to hear it so we can smooth things out.</p>
                <p>If you're still keen to join and support the Global Goals Jam movement, you can pick up right where you left off:</p>
                <p style="text-align: center;"><a href="${enrollUrl}" style="display:inline-block;padding:12px 24px;background:#00A651;color:white;text-decoration:none;border-radius:8px;font-weight:bold;">Complete my enrollment</a></p>
                <p>Either way, just reply to this email — I read every message.</p>
                <p>Warmly,<br/>Marco<br/><em>Founder, Global Goals Jam</em></p>
              </div>
            </div>`,
            text: `Hi ${firstName},\n\nI noticed you started signing up for the GGJ Host Certification Course, but your payment didn't come through. Was there anything that went wrong on your side? I'd love to hear it so we can smooth things out.\n\nIf you're still keen to join, you can pick up where you left off here:\n${enrollUrl}\n\nEither way, just reply to this email — I read every message.\n\nWarmly,\nMarco — Founder, Global Goals Jam`,
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
        toast({ title: 'Follow-up sent', description: `Message sent to ${user.email}${msgId}` })
      } else {
        toast({ title: 'Email failed', description: 'Could not send follow-up email', variant: 'destructive' })
      }
    } catch (err: any) {
      console.error('Payment inquiry email error', err)
      toast({ title: 'Email error', description: err?.message || 'Failed to send follow-up', variant: 'destructive' })
    } finally {
      setProcessingInquiryId(null)
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
        const regs = await db.eventRegistrations.list({ where: { participantId: user.id }, orderBy: { registrationDate: 'desc' }, limit: 1 }) as any[]
        const reg = regs?.[0]
        if (reg?.eventId) {
          const evs = await db.events.list({ where: { id: reg.eventId }, limit: 1 }) as any[]
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

      // The live Supabase session is the ONLY trustworthy source of the admin
      // identity + token. Impersonation overlays localStorage ('auth_token' and
      // 'user'), but it never touches the real Supabase session (stored under
      // Supabase's own key) — so getSession() always returns the real admin,
      // even mid-impersonation. Reading localStorage here is what made repeat
      // impersonation fail: 'auth_token' held a fake token (gateway 401) and
      // 'user' held the previously-impersonated person (false "Admin only").
      const { data: { session } } = await supabase.auth.getSession()
      const currentToken = session?.access_token || ''
      const adminAuthId = session?.user?.id || ''

      if (!currentToken || !adminAuthId) {
        toast({ title: 'Admin session expired', description: 'Sign out and sign back in with email + password, then try again.', variant: 'destructive' })
        return
      }

      // Capture the admin record so "Return to admin" can restore the display.
      // If we're already impersonating, keep the original admin record intact.
      let impersonatorRecord = localStorage.getItem('impersonator_user')
      if (!impersonatorRecord) {
        let adminProfile: any = null
        try {
          const rows = await db.users.list({ where: { id: adminAuthId }, limit: 1 }) as any[]
          adminProfile = rows?.[0] || null
        } catch { /* best effort */ }
        impersonatorRecord = JSON.stringify({
          id: adminAuthId,
          email: session?.user?.email || adminProfile?.email || '',
          displayName: adminProfile?.displayName || session?.user?.email || '',
          role: adminProfile?.role || 'admin'
        })
      }

      let res: Response
      try {
        res = await fetch(config.functions.impersonateUserUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${currentToken}`
          },
          body: JSON.stringify({ userId: user.id, ttlMinutes: 60 })
        })
      } catch (networkErr: any) {
        throw new Error(`Network error reaching impersonate-user: ${networkErr?.message || networkErr}`)
      }

      // Try to parse JSON safely; if the body isn't JSON (e.g. HTML 500), keep the raw text so we can show it.
      let data: any = null
      let rawBody = ''
      try {
        rawBody = await res.text()
        try { data = JSON.parse(rawBody) } catch { data = null }
      } catch { /* ignore */ }

      if (!res.ok || !data?.token) {
        console.error('[impersonate] non-ok response', { status: res.status, data, rawBody })
        const serverError = data?.error || (rawBody && rawBody.length < 400 ? rawBody : '')
        const context =
          res.status === 401 ? 'Admin session invalid — sign out and back in with email + password.' :
          res.status === 403 ? 'Admin access required — your account must have role = "admin".' :
          res.status === 404 ? 'Target user not found.' :
          res.status >= 500 ? 'Edge function crashed (check Supabase function logs).' :
          'Failed to impersonate.'
        const errMsg = serverError ? `${context} — ${serverError}` : `${context} (HTTP ${res.status})`
        throw new Error(errMsg)
      }

      // Store admin (impersonator) state so we can return later
      localStorage.setItem('impersonator_user', impersonatorRecord)
      localStorage.setItem('impersonator_token', currentToken)

      // Switch to target user session
      localStorage.setItem('auth_token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))

      // Keep simple auth in sync
      appAuth.set({ id: data.user.id, email: data.user.email, displayName: data.user.displayName, role: data.user.role })

      // Set token so db/auth state aligns
      try { auth.setToken(data.token) } catch (_) {}

      setIsImpersonating(true)
      toast({ title: 'Now impersonating', description: `${user.email}` })
      window.location.href = '/profile'
    } catch (e: any) {
      console.error('Impersonation failed', e)
      toast({
        title: 'Impersonation failed',
        description: e?.message || 'Could not switch session — see browser console for details.',
        variant: 'destructive',
        duration: 10000
      })
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

      // Restore auth token as well
      try { auth.setToken(adminToken) } catch (_) {}

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
                            if (info?.hasRealPayment) {
                              return (
                                <Badge
                                  variant="green"
                                  title={`Real Mollie payment (${info.molliePaymentId})`}
                                >
                                  paid
                                </Badge>
                              )
                            }
                            if (info?.isManualOverride) {
                              return (
                                <Badge
                                  variant="secondary"
                                  title={`Marked paid manually (ref: ${info.molliePaymentId || '—'}). No real Mollie transaction recorded.`}
                                >
                                  paid · manual
                                </Badge>
                              )
                            }
                            if (info?.needsPaymentReview) {
                              return (
                                <Badge
                                  variant="amber"
                                  title={`Enrollment is ${info.status} but no payment recorded. Check Mollie — may be expired / abandoned checkout.`}
                                >
                                  needs review
                                </Badge>
                              )
                            }
                            return <span className="text-muted-foreground text-sm">no</span>
                          })()}
                        </TableCell>
                        <TableCell>{user.location || '-'}</TableCell>
                        <TableCell>
                          {new Date(user.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                const info = enrollments[user.id]
                                const defaultTemplate: MessageTemplate = info?.needsPaymentReview
                                  ? 'payment_followup'
                                  : shouldShowInvite(user)
                                    ? 'invite'
                                    : 'custom'
                                openMessageDialog(user, defaultTemplate)
                              }}
                              title={
                                enrollments[user.id]?.needsPaymentReview
                                  ? 'Message — defaults to payment follow-up'
                                  : shouldShowInvite(user)
                                    ? 'Message — defaults to course invite'
                                    : 'Send a message'
                              }
                              className={enrollments[user.id]?.needsPaymentReview ? 'text-amber-700 hover:text-amber-900' : ''}
                            >
                              <Mail className="h-4 w-4" />
                            </Button>
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
            <p className="text-xs text-muted-foreground mt-2">
              Checked → sets <code>amount_paid = 39.99</code> and a manual reference (keeps any real Mollie/Stripe ref if present).<br />
              Unchecked → <strong>clears both</strong> <code>amount_paid</code> and <code>mollie_payment_id</code> for this enrollment.
            </p>
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

      {/* Unified Message Dialog */}
      <MessageUserDialog
        open={messageDialogOpen}
        onOpenChange={setMessageDialogOpen}
        recipient={messageRecipient ? {
          id: messageRecipient.id,
          email: messageRecipient.email,
          displayName: messageRecipient.displayName
        } : null}
        initialTemplate={messageTemplate}
      />
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
