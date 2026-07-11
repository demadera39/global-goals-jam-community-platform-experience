import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import { Mail, Key, CheckCircle2, RefreshCw, ShieldAlert } from 'lucide-react'
import { db, auth } from '@/lib/supabase'
import { getFullUser } from '@/lib/userProfile'
import { config } from '@/lib/config'
import AdminShell, {
  Pill,
  adminCardClass,
  quietButtonClass,
  primaryButtonClass,
} from '@/components/admin/AdminShell'

interface UserRow {
  id: string
  email: string
  displayName: string
  role: string
  status: string
  hasPassword: boolean
}

export default function PasswordManagementPage() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [generatedPasswords, setGeneratedPasswords] = useState<Record<string, string>>({})
  const [copiedEmails, setCopiedEmails] = useState<Set<string>>(new Set())
  const [authToken, setAuthToken] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState<boolean>(false)

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((state: any) => {
      const t = state?.tokens?.accessToken || state?.tokens?.token || state?.tokens?.jwt || null
      setAuthToken(t)
    })
    ;(async () => {
      const user = await getFullUser()
      setIsAdmin(user?.role === 'admin')
      await fetchUsers()
    })()
    return () => { try { unsub && unsub() } catch {} }
  }, [])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const data = await (db as any).users.list({ orderBy: { createdAt: 'desc' }, limit: 500 })
      const rows: UserRow[] = (data || []).map((u: any) => ({
        id: u.id,
        email: u.email,
        displayName: u.displayName || 'No name',
        role: u.role,
        status: u.status,
        hasPassword: Boolean(u.passwordHash || u.password_hash)
      }))
      setUsers(rows)
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%'
    let password = ''
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
  }

  const setUserPassword = async (userId: string, email: string) => {
    const password = newPassword || generatePassword()

    try {
      const res = await fetch(config.api.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify({ action: 'admin-set-password', userId, password })
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok || data?.success === false) {
        throw new Error(data?.error || 'Failed to set password')
      }

      setGeneratedPasswords(prev => ({ ...prev, [email]: password }))
      toast.success(`Password set for ${email}`)
      setNewPassword('')
      setSelectedUser(null)
      fetchUsers()
    } catch (error) {
      console.error('Error setting password:', error)
      toast.error('Failed to set password')
    }
  }

  const copyEmailTemplate = (email: string, password: string) => {
    const template = `
Subject: Your Global Goals Jam Account - Password Setup

Hi there,

Your Global Goals Jam account has been set up with email authentication. Here are your login credentials:

Email: ${email}
Temporary Password: ${password}

Please log in at: https://globalgoalsjam.org/login

After logging in, you can change your password in your profile settings.

If you have any questions, please don't hesitate to reach out.

Best regards,
The Global Goals Jam Team
`.trim()

    navigator.clipboard.writeText(template)
    setCopiedEmails(prev => new Set(prev).add(email))
    setTimeout(() => {
      setCopiedEmails(prev => {
        const next = new Set(prev)
        next.delete(email)
        return next
      })
    }, 2000)
    toast.success('Email template copied to clipboard')
  }

  const bulkGeneratePasswords = async () => {
    const usersWithoutPasswords = users.filter(u => !u.hasPassword)

    if (usersWithoutPasswords.length === 0) {
      toast.info('All users already have passwords')
      return
    }

    if (!confirm(`This will generate passwords for ${usersWithoutPasswords.length} users. Continue?`)) {
      return
    }

    setLoading(true)
    const results: Record<string, string> = {}

    for (const user of usersWithoutPasswords) {
      const password = generatePassword()
      try {
        const res = await fetch(config.api.baseUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
          },
          body: JSON.stringify({ action: 'admin-set-password', userId: user.id, password })
        })
        const data = await res.json().catch(() => ({}))
        if (res.ok && data?.success !== false) {
          results[user.email] = password
        } else {
          console.error(`Failed to set password for ${user.email}:`, data?.error || res.statusText)
        }
      } catch (error) {
        console.error(`Failed to set password for ${user.email}:`, error)
      }
    }

    setGeneratedPasswords(results)
    toast.success(`Generated passwords for ${Object.keys(results).length} users`)
    fetchUsers()
    setLoading(false)
  }

  if (loading) {
    return (
      <AdminShell title="Passwords" description="Manage user passwords and send credentials via email.">
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#00A651]"></div>
        </div>
      </AdminShell>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#F6FAF7] flex items-center justify-center px-5">
        <div className={`${adminCardClass} max-w-md w-full p-8 text-center`}>
          <ShieldAlert className="w-10 h-10 text-[#7d8a83] mx-auto" />
          <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.28em] text-[#00713a]">GGJ Admin</p>
          <h2 className="mt-2 font-display text-2xl font-extrabold tracking-tight text-[#14201a]">Access restricted</h2>
          <p className="mt-2 text-sm leading-relaxed text-[#4c5a52]">Only admins can manage user passwords.</p>
        </div>
      </div>
    )
  }

  return (
    <AdminShell
      title="Passwords"
      description="Manage user passwords and send credentials via email."
      actions={
        <>
          <button type="button" onClick={fetchUsers} className={quietButtonClass}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button type="button" onClick={bulkGeneratePasswords} className={primaryButtonClass}>
            <Key className="h-4 w-4" />
            Bulk generate passwords
          </button>
        </>
      }
    >
      <div className="space-y-6">
        {Object.keys(generatedPasswords).length > 0 && (
          <div className={`${adminCardClass} overflow-hidden`}>
            <div className="flex items-center justify-between gap-3 border-b border-[#dfe9e2] px-6 py-4">
              <div>
                <h2 className="font-display text-lg font-extrabold text-[#14201a]">Generated passwords</h2>
                <p className="mt-0.5 text-sm text-[#4c5a52]">Copy these to send to users via email.</p>
              </div>
              <span className="h-1.5 w-6 rounded-full bg-[#00A651]/70" aria-hidden="true" />
            </div>
            <ul className="divide-y divide-[#dfe9e2]">
              {Object.entries(generatedPasswords).map(([email, password]) => (
                <li key={email} className="flex flex-wrap items-center justify-between gap-3 px-6 py-3.5">
                  <div>
                    <p className="text-sm font-semibold text-[#14201a]">{email}</p>
                    <p className="mt-0.5 font-mono text-sm tabular-nums text-[#4c5a52]">{password}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyEmailTemplate(email, password)}
                    className={copiedEmails.has(email) ? primaryButtonClass : quietButtonClass}
                  >
                    {copiedEmails.has(email) ? (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4" />
                        Copy email
                      </>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className={`${adminCardClass} overflow-hidden`}>
          <div className="border-b border-[#dfe9e2] px-6 py-4">
            <h2 className="font-display text-lg font-extrabold text-[#14201a]">All accounts</h2>
            <p className="mt-0.5 text-sm text-[#4c5a52]">
              <span className="font-mono tabular-nums">{users.length}</span> accounts — set passwords individually or in bulk.
            </p>
          </div>
          <div className="overflow-x-auto px-2">
            <Table>
              <TableHeader>
                <TableRow className="border-[#dfe9e2] hover:bg-transparent">
                  <TableHead className="h-10 text-[11px] font-bold uppercase tracking-[0.16em] text-[#7d8a83]">Email</TableHead>
                  <TableHead className="h-10 text-[11px] font-bold uppercase tracking-[0.16em] text-[#7d8a83]">Name</TableHead>
                  <TableHead className="h-10 text-[11px] font-bold uppercase tracking-[0.16em] text-[#7d8a83]">Role</TableHead>
                  <TableHead className="h-10 text-[11px] font-bold uppercase tracking-[0.16em] text-[#7d8a83]">Status</TableHead>
                  <TableHead className="h-10 text-[11px] font-bold uppercase tracking-[0.16em] text-[#7d8a83]">Password</TableHead>
                  <TableHead className="h-10 text-[11px] font-bold uppercase tracking-[0.16em] text-[#7d8a83]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} className="border-[#dfe9e2] hover:bg-[#F6FAF7]/70">
                    <TableCell className="text-sm font-semibold text-[#14201a]">{user.email}</TableCell>
                    <TableCell className="text-[13px] text-[#4c5a52]">{user.displayName}</TableCell>
                    <TableCell>
                      <Pill tone={user.role === 'admin' ? 'ink' : user.role === 'host' ? 'green' : 'outline'}>
                        {user.role}
                      </Pill>
                    </TableCell>
                    <TableCell>
                      <Pill tone={user.status === 'active' || user.status === 'approved' ? 'green' : 'outline'}>
                        {user.status}
                      </Pill>
                    </TableCell>
                    <TableCell>
                      {user.hasPassword ? (
                        <Pill tone="green">
                          <CheckCircle2 className="h-3 w-3" />
                          set
                        </Pill>
                      ) : (
                        <Pill tone="amber">not set</Pill>
                      )}
                    </TableCell>
                    <TableCell>
                      {selectedUser === user.id ? (
                        <div className="flex gap-2">
                          <Input
                            type="text"
                            placeholder="Auto-generate"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="h-8 w-32 rounded-full border-[#dfe9e2] bg-white text-sm"
                          />
                          <Button
                            size="sm"
                            onClick={() => setUserPassword(user.id, user.email)}
                            className="h-8 rounded-full bg-[#00A651] px-3.5 text-xs font-semibold text-white hover:bg-[#008a44]"
                          >
                            Set
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedUser(null)
                              setNewPassword('')
                            }}
                            className="h-8 rounded-full border-[#dfe9e2] bg-white px-3.5 text-xs font-semibold text-[#4c5a52] hover:border-[#00A651]/50 hover:text-[#00713a]"
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedUser(user.id)}
                          className="h-8 rounded-full border-[#dfe9e2] bg-white px-3.5 text-xs font-semibold text-[#4c5a52] hover:border-[#00A651]/50 hover:text-[#00713a]"
                        >
                          <Key className="mr-1 h-3.5 w-3.5" />
                          Set password
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </AdminShell>
  )
}