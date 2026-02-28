import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { useToast } from '@/hooks/use-toast'
import blink from '@/lib/blink'
import { appAuth } from '@/lib/simpleAuth'
import EnrollmentNudgeBanner from '@/components/EnrollmentNudgeBanner'

interface ProfileForm {
  displayName: string
  bio: string
  location: string
  profileImage: string
}

export default function ProfilePage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState<string>('')
  const [email, setEmail] = useState<string>('')
  const [role, setRole] = useState<string>('participant')
  const [form, setForm] = useState<ProfileForm>({ displayName: '', bio: '', location: '', profileImage: '' })
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [hasActiveCourse, setHasActiveCourse] = useState(false)

  useEffect(() => {
    setLoading(true)

    const init = async () => {
      const stored = appAuth.get()
      if (!stored) {
        window.location.href = `/sign-in?redirect=${encodeURIComponent(window.location.href)}`
        return
      }
      try {
        setUserId(stored.id)
        setEmail(stored.email)
        setRole(stored.role || 'participant')
        // Load DB record (best-effort)
        const rows = await blink.db.users.list({ where: { id: stored.id }, limit: 1 })
        const row = rows?.[0]
        setForm({
          displayName: row?.displayName || stored.displayName || '',
          bio: row?.bio || '',
          location: row?.location || '',
          profileImage: row?.profileImage || ''
        })
        // Check active course enrollment
        try {
          const enrollments = await blink.db.courseEnrollments.list({ where: { userId: stored.id }, limit: 1 })
          const e = enrollments?.[0]
          setHasActiveCourse(!!(e && (e.status === 'active' || e.status === 'completed')))
        } catch (_) {
          setHasActiveCourse(false)
        }
      } catch (e) {
        console.error('Failed to load profile:', e)
      } finally {
        setLoading(false)
      }
    }

    const unsub = appAuth.onChange((u) => {
      if (!u) {
        window.location.href = '/sign-in'
      }
    })

    init().catch(console.error)

    return () => {
      unsub && unsub()
    }
  }, [])

  useEffect(() => {
    const welcome = searchParams.get('welcome')
    const enrolled = searchParams.get('enrolled')
    if (welcome || enrolled) {
      toast({
        title: welcome ? 'Welcome to Global Goals Jam!' : 'Enrollment complete',
        description: welcome
          ? 'Your account is ready. You can update your profile below.'
          : 'You are enrolled. You can manage your profile and course access here.'
      })
      const params = new URLSearchParams(window.location.search)
      params.delete('welcome')
      params.delete('enrolled')
      const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`
      navigate(newUrl, { replace: true })
    }
  }, [searchParams, navigate, toast])

  const handleChange = (key: keyof ProfileForm, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const saveProfile = async () => {
    if (!userId) return
    setSaving(true)
    try {
      await blink.db.users.update(userId, {
        displayName: form.displayName?.trim() || undefined,
        bio: form.bio?.trim() || undefined,
        location: form.location?.trim() || undefined,
        profileImage: form.profileImage?.trim() || undefined
      })
      toast({ title: 'Profile saved', description: 'Your changes have been updated.' })
    } catch (e: any) {
      toast({ title: 'Error', description: 'Could not save profile. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Enrollment nudge for newly signed-up users who haven't enrolled yet */}
      <EnrollmentNudgeBanner />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">My Profile</h1>
          <p className="text-muted-foreground">Manage your name, photo, and details used across the platform.</p>
          {hasActiveCourse && (
            <div className="mt-4">
              <Button className="bg-primary-solid text-white hover:bg-primary/90" onClick={() => navigate('/course/dashboard')}>
                Go to Course
              </Button>
            </div>
          )}
        </div>

        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={form.profileImage} alt={form.displayName || email} />
                <AvatarFallback>{(form.displayName || email).charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="grid md:grid-cols-2 gap-4 flex-1">
                <div>
                  <Label htmlFor="displayName">Display name</Label>
                  <Input id="displayName" value={form.displayName} onChange={(e) => handleChange('displayName', e.target.value)} placeholder="Your name" />
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" value={form.location} onChange={(e) => handleChange('location', e.target.value)} placeholder="City, Country" />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="profileImage">Avatar image URL</Label>
                  <Input id="profileImage" value={form.profileImage} onChange={(e) => handleChange('profileImage', e.target.value)} placeholder="https://..." />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea id="bio" value={form.bio} onChange={(e) => handleChange('bio', e.target.value)} placeholder="A few words about you" className="min-h-[90px]" />
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <div className="text-xs text-muted-foreground">Email</div>
                <div className="text-sm font-medium break-all">{email}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Role</div>
                <div className="text-sm font-medium capitalize">{role}</div>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => blink.auth.logout()}>Sign out</Button>
              <Button onClick={saveProfile} className="bg-primary-solid text-white hover:bg-primary/90" disabled={saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}