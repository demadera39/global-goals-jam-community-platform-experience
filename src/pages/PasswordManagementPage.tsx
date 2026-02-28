import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Loader2, Mail, Key, CheckCircle2, ShieldAlert } from 'lucide-react'
import blink, { getFullUser } from '@/lib/blink'
import { config } from '@/lib/config'

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
    const unsub = blink.auth.onAuthStateChanged((state: any) => {
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
      const data = await (blink.db as any).users.list({ orderBy: { createdAt: 'desc' }, limit: 500 })
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
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ShieldAlert className="h-5 w-5 text-red-500" /> Access restricted</CardTitle>
            <CardDescription>Only admins can manage user passwords.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Password Management</CardTitle>
          <CardDescription>
            Manage user passwords and send credentials via email
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Button onClick={bulkGeneratePasswords} className="mr-2">
              <Key className="h-4 w-4 mr-2" />
              Bulk Generate Passwords
            </Button>
            <Button onClick={fetchUsers} variant="outline">
              Refresh
            </Button>
          </div>

          {Object.keys(generatedPasswords).length > 0 && (
            <Card className="mb-6 border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-green-800">Generated Passwords</CardTitle>
                <CardDescription>
                  Copy these to send to users via email
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(generatedPasswords).map(([email, password]) => (
                    <div key={email} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                      <div>
                        <p className="font-medium">{email}</p>
                        <p className="text-sm text-gray-600 font-mono">{password}</p>
                      </div>
                      <Button
                        size="sm"
                        variant={copiedEmails.has(email) ? 'default' : 'outline'}
                        onClick={() => copyEmailTemplate(email, password)}
                      >
                        {copiedEmails.has(email) ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Mail className="h-4 w-4 mr-2" />
                            Copy Email
                          </>
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Password</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell>{user.displayName}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.status === 'active' || user.status === 'approved' ? 'default' : 'outline'}>
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.hasPassword ? (
                        <Badge variant="outline" className="bg-green-50">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Set
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-yellow-50">
                          Not Set
                        </Badge>
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
                            className="w-32"
                          />
                          <Button
                            size="sm"
                            onClick={() => setUserPassword(user.id, user.email)}
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
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedUser(user.id)}
                        >
                          <Key className="h-4 w-4 mr-1" />
                          Set Password
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}