import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Clock, Users, Award, BookOpen, Mail, CreditCard, ArrowRight } from 'lucide-react'
import blink, { safeDbCall } from '@/lib/blink'
import { toast } from 'sonner'
import { courseModules } from '@/data/courseContent'
import { appAuth } from '@/lib/simpleAuth'
import { getStoredUser } from '@/lib/auth'
import { config } from '@/lib/config'

export default function CourseEnrollmentPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [enrollment, setEnrollment] = useState<any>(null)
  const [checkingEnrollment, setCheckingEnrollment] = useState(true)
  const [searchParams] = useSearchParams()
  const [isPolling, setIsPolling] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const pollRef = useRef<number | null>(null)
  const pollTimeoutRef = useRef<number | null>(null)
  const pollingIntervalRef = useRef<number | null>()

  // Stripe return and UI gating flags
  const hasStripeReturn = searchParams.get('success') === '1' && !!searchParams.get('session_id')
  // Show processing only when Stripe redirected back with a session_id.
  // This avoids showing a spinner if checkout never opened.
  const showProcessing = hasStripeReturn && (!enrollment || enrollment.status === 'pending')
  const showResumeCard = !showProcessing && !!enrollment && enrollment.status === 'pending'

  // Define stopEnrollmentPolling before using it
  const stopEnrollmentPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current)
      pollTimeoutRef.current = null
    }
    setIsPolling(false)
  }, [setIsPolling])

  // Polling: refetch a single enrollment by id until status becomes active/completed or timeout
  const startEnrollmentPolling = useCallback((enrollmentId: string) => {
    // If there's already a poll running, don't start another
    if (pollRef.current) return
    setIsPolling(true)

    const pollInterval = 5000 // ms
    const maxDuration = 2 * 60 * 1000 // 2 minutes
    const start = Date.now()

    const tick = async () => {
      try {
        const rows = await safeDbCall(() => blink.db.courseEnrollments.list({ where: { id: enrollmentId }, limit: 1 }))
        const row = rows?.[0]
        if (!row) {
          // Enrollment disappeared — stop
          stopEnrollmentPolling()
          setEnrollment(null)
          setCheckingEnrollment(false)
          return
        }

        setEnrollment(row)

        if (row.status === 'active' || row.status === 'completed') {
          stopEnrollmentPolling()
          toast.success('Payment received — enrollment confirmed')
          navigate('/course/dashboard?enrolled=1')
          return
        }

        // If polling has exceeded max duration, stop and show a message
        if (Date.now() - start > maxDuration) {
          stopEnrollmentPolling()
          setCheckingEnrollment(false)
          toast.error('Payment is taking longer than expected. If your card was charged, contact support or reload this page.')
          return
        }
      } catch (err) {
        console.error('Polling error:', err)
      }
    }

    // Run immediately then set interval
    tick()
    const id = window.setInterval(tick, pollInterval)
    pollRef.current = id

    // Safety timeout to force stop after maxDuration
    const timeoutId = window.setTimeout(() => {
      if (pollRef.current) {
        stopEnrollmentPolling()
        toast.error('Payment confirmation timed out. Please check your email or contact support.')
      }
    }, maxDuration + 5000)
    pollTimeoutRef.current = timeoutId
  }, [navigate, stopEnrollmentPolling])

  useEffect(() => {
    const checkEnrollmentStatus = async (userId: string) => {
      try {
        // short-term cache to avoid rate limits
        try {
          const cacheKey = `enroll_status_${userId}`
          const cached = sessionStorage.getItem(cacheKey)
          if (cached) {
            const { ts, data } = JSON.parse(cached)
            if (Date.now() - ts < 20000) {
              setEnrollment(data)
              if (data?.status === 'active' || data?.status === 'completed') {
                navigate('/course/dashboard?enrolled=1')
                return
              }
              if (data?.status === 'pending') {
                const shouldPoll = searchParams.get('success') === '1' && !!searchParams.get('session_id')
                if (shouldPoll) startEnrollmentPolling(data.id)
              }
              setCheckingEnrollment(false)
              return
            }
          }
        } catch (_) {}

        const enrollments = await safeDbCall(() => blink.db.courseEnrollments.list({ where: { userId }, orderBy: { createdAt: 'desc' }, limit: 1 }))
        try {
          const cacheKey = `enroll_status_${userId}`
          sessionStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), data: enrollments[0] || null }))
        } catch (_) {}
        if (enrollments.length > 0) {
          setEnrollment(enrollments[0])
          if (enrollments[0].status === 'active' || enrollments[0].status === 'completed') {
            navigate('/course/dashboard?enrolled=1')
            return
          }

          // If enrollment is pending, start polling for updates (webhook / manual update)
          if (enrollments[0].status === 'pending') {
            const shouldPoll = searchParams.get('success') === '1' && !!searchParams.get('session_id')
            if (shouldPoll) startEnrollmentPolling(enrollments[0].id)
          }
        }
      } catch (error) {
        console.error('Error checking enrollment:', error)
      } finally {
        setCheckingEnrollment(false)
      }
    }

    // Prefer our local email/password auth state (custom auth)
    const init = async () => {
      try {
        const stored = await getStoredUser()
        setUser(stored)
        setLoading(false)
        if (stored?.id) {
          await checkEnrollmentStatus(stored.id)
        } else {
          setCheckingEnrollment(false)
        }
      } catch (e) {
        setUser(null)
        setLoading(false)
        setCheckingEnrollment(false)
      }
    }

    const unsubscribe = appAuth.onChange((u) => {
      setUser(u)
      setLoading(false)
      if (u?.id) checkEnrollmentStatus(u.id)
      else setCheckingEnrollment(false)
    })

    init()

    // Safety timeout to avoid endless loading when backend is slow
    const safety = window.setTimeout(() => {
      setCheckingEnrollment(false)
      setLoading(false)
    }, 10000)

    return () => {
      window.clearTimeout(safety)
      unsubscribe()
      stopEnrollmentPolling()
    }
  }, [navigate, stopEnrollmentPolling, startEnrollmentPolling])

  const confirmEnrollmentNow = async () => {
    try {
      setConfirming(true)
      const sessionId = searchParams.get('session_id')

      // If we have a Stripe session_id from success redirect → call confirm endpoint
      if (sessionId) {
        const resp = await fetch(config.functions.confirmCourseEnrollmentUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, userId: user?.id, enrollmentId: searchParams.get('enr_id') || enrollment?.id })
        })
        const data = await resp.json().catch(() => null)
        if (!resp.ok) {
          if (resp.status === 409 || resp.status === 202) {
            toast.message?.('Payment not confirmed yet. We’ll keep checking for a bit…')
            const id = data?.enrollment?.id || enrollment?.id
            if (id) startEnrollmentPolling(id)
            return false
          }
          const fallbackId = data?.enrollment?.id || enrollment?.id
          if (fallbackId) startEnrollmentPolling(fallbackId)
          throw new Error(data?.error || 'Failed to confirm enrollment')
        }
        if (data?.enrollment) setEnrollment(data.enrollment)
        toast.success('Enrollment confirmed')
        navigate('/course/dashboard?enrolled=1')
        return true
      }

      // If there's no session_id, NEVER reopen checkout from Verify button.
      // Instead, check the latest enrollment and poll until webhook/confirm marks it active.
      if (!user?.id) {
        toast.message?.('Looking up your enrollment…')
        return false
      }

      // Load the most recent enrollment for this user
      const latest = await safeDbCall(() => blink.db.courseEnrollments.list({ where: { userId: user.id }, orderBy: { createdAt: 'desc' }, limit: 1 }))
      const rec = latest?.[0]
      if (!rec) {
        toast.error('No enrollment found yet. Please start checkout first.')
        return false
      }
      setEnrollment(rec)

      if (rec.status === 'active' || rec.status === 'completed') {
        navigate('/course/dashboard?enrolled=1')
        return true
      }

      // Pending → start polling and inform the user
      toast.message?.('Checking Stripe for your payment… we’ll update automatically.')
      startEnrollmentPolling(rec.id)
      return false
    } catch (err) {
      console.error('Confirm enrollment error', err)
      toast.error('Could not verify payment yet')
      return false
    } finally {
      setConfirming(false)
    }
  }

  const startCheckout = async () => {
    if (!user) return
    try {
      // Ensure a pending enrollment exists
      let existing = await safeDbCall(() => blink.db.courseEnrollments.list({ where: { userId: user.id }, orderBy: { enrolledAt: 'desc' }, limit: 1 }))
      let record = existing?.[0]
      if (!record) {
        record = await safeDbCall(() => blink.db.courseEnrollments.create({
          userId: user.id,
          status: 'pending',
          enrolledAt: new Date().toISOString()
        }))
      } else if (record.status !== 'pending') {
        // If already active/completed, go to dashboard
        if (record.status === 'active' || record.status === 'completed') {
          navigate('/course/dashboard')
          return
        }
      }
      setEnrollment(record)

      const baseUrl = window.location.origin
      const successUrl = `${baseUrl}/course/enroll?success=1&session_id={CHECKOUT_SESSION_ID}&enr_id=${record.id}`
      const cancelUrl = `${baseUrl}/course/enroll?canceled=1`

      // Request Stripe Checkout Session via Edge Function
      const resp = await fetch(config.functions.createCourseCheckoutUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enrollmentId: record.id,
          userId: user.id,
          email: user.email || '',
          successUrl,
          cancelUrl,
          amount: 3999
        })
      })
      if (!resp.ok) {
        const errText = await resp.text().catch(() => '')
        throw new Error(`Failed to create checkout: ${resp.status} ${errText}`)
      }
      const { url: checkoutUrl } = await resp.json() as any
      if (checkoutUrl) {
        // Open Stripe in a new tab as required (must be via user gesture)
        const win = window.open(checkoutUrl, '_blank')
        if (!win || win.closed || typeof win.closed === 'undefined') {
          // Likely blocked by popup blocker — instruct user
          toast.warning?.('We tried to open Stripe but your browser blocked it. Please allow pop-ups and click the button again.')
        } else {
          toast('Checkout opened in a new tab')
        }
      } else {
        toast.error('Failed to start checkout')
      }
    } catch (err: any) {
      console.error('Checkout error', err)
      toast.error('Could not start checkout')
    }
  }

  const handleStartCheckout = () => {
    if (!user) {
      window.location.href = `/sign-in?redirect=${encodeURIComponent('/course/enroll?checkout=1')}`
      return
    }
    startCheckout()
  }

  const scheduleEmailSequence = async (enrollmentId: string, userId: string) => {
    const startDate = new Date()
    for (let day = 1; day <= 8; day++) {
      const scheduledDate = new Date(startDate)
      scheduledDate.setDate(scheduledDate.getDate() + (day - 1))
      scheduledDate.setHours(9, 0, 0, 0) // 9 AM
      await safeDbCall(() => blink.db.emailSchedule.create({
        id: `email_${enrollmentId}_${day}`,
        enrollmentId,
        userId,
        moduleNumber: String(day),
        scheduledFor: scheduledDate.toISOString(),
        status: 'scheduled'
      }))
    }
  }

  // Note: Do not auto-open Stripe on load to avoid popup blockers.
  // Users must click the "Start Your Journey" button to open checkout in a new tab.

  // If returning from Stripe success, try to confirm immediately
  useEffect(() => {
    if (!loading) {
      const success = searchParams.get('success') === '1'
      const sid = searchParams.get('session_id')
      if (success && sid) {
        // Call confirmation immediately; userId is optional server-side
        confirmEnrollmentNow()
      }
    }
  }, [loading, searchParams])

  if (loading || checkingEnrollment) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Only show processing if we are polling or we actually have a session_id from Stripe success
  if (showProcessing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Confirming your enrollment</CardTitle>
            <CardDescription>We’re checking Stripe for your payment confirmation…</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-col items-center gap-4 py-2">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            <p className="text-sm text-muted-foreground text-center">
              This usually takes a few seconds. If you just completed checkout in the other tab, click “Verify Now”. We’ll also update automatically.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 w-full mt-2">
              <Button onClick={confirmEnrollmentNow} disabled={confirming} className="w-full">
                {confirming ? 'Verifying…' : 'Verify Now'}
              </Button>
              <Button variant="outline" onClick={handleStartCheckout} className="w-full">
                Open Checkout Again
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">
              If verification fails, we’ll keep checking for a couple of minutes. You can safely close this tab — you’ll also receive a receipt email from Stripe.
            </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Pending enrollment but not in Stripe return flow → show a clear resume card
  if (showResumeCard) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Finish your enrollment</CardTitle>
            <CardDescription>Your enrollment is not complete yet — start checkout to secure access.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-col items-center gap-4 py-2 w-full">
              <div className="w-full flex flex-col gap-2">
                <Button onClick={handleStartCheckout} className="w-full">Start Checkout</Button>
                <Button variant="outline" onClick={confirmEnrollmentNow} disabled={confirming} className="w-full">
                  {confirming ? 'Checking…' : 'I already paid — Verify'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center mt-2">
                We’ll verify your payment and activate your dashboard immediately after checkout.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <Badge className="mb-4" variant="secondary">CERTIFICATION REQUIRED — supports the community</Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Become a Certified Global Goals Jam Facilitator (or Host)
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Not planning to host (yet)? You can still take the course to become a skilled Jam facilitator — and unlock the full toolkit, templates, and community access.
          </p>
        </div>

        {/* Peer-review policy note */}
        <Card className="max-w-4xl mx-auto mb-6 border-amber-300 bg-amber-50">
          <CardContent className="p-4 text-sm text-amber-800">
            Note: The capstone project is peer-reviewed by a fellow host or mentor you choose. The GGJ organization does not actively review or grade capstones. Arrange your peer reviewer before starting Module 8.
          </CardContent>
        </Card>

        {/* Course Overview */}
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Course Structure
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <strong>8 comprehensive modules</strong>
                    <p className="text-sm text-muted-foreground">From foundations to advanced facilitation</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <strong>Daily email lessons</strong>
                    <p className="text-sm text-muted-foreground">Bite-sized learning delivered to your inbox</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <strong>Interactive learning dashboard</strong>
                    <p className="text-sm text-muted-foreground">Videos, templates, and exercises</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <strong>Official certification</strong>
                    <p className="text-sm text-muted-foreground">Recognized globally by the GGJ network</p>
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                What You'll Master
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <strong>Complex challenge framing</strong>
                    <p className="text-sm text-muted-foreground">Transform global goals into local action</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <strong>6-Sprint methodology</strong>
                    <p className="text-sm text-muted-foreground">Guide teams from ideation to documentation</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <strong>Facilitation excellence</strong>
                    <p className="text-sm text-muted-foreground">Manage dynamics and unlock creativity</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <strong>Open design practices</strong>
                    <p className="text-sm text-muted-foreground">Amplify impact through sharing</p>
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Module Preview */}
        <Card className="max-w-4xl mx-auto mb-12">
          <CardHeader>
            <CardTitle>Course Modules</CardTitle>
            <CardDescription>Your 8-day journey to becoming a certified facilitator — host-ready when you are</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {courseModules.map((m) => (
                <div key={m.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="font-semibold text-primary">{m.moduleNumber}</span>
                    </div>
                    <div>
                      <h4 className="font-medium">{m.title}</h4>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {typeof m.duration === 'number' ? `${m.duration} min` : `${m.durationMinutes || ''} min`}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">Day {m.moduleNumber}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Fast track to hosting */}
        <Card className="max-w-5xl mx-auto mb-12">
          <CardHeader>
            <CardTitle>Fast track to hosting (when you’re ready)</CardTitle>
            <CardDescription>Hosting is optional — take the course to become a skilled facilitator now; when you’re ready, we’ll help you pick a challenge, plan your jam, and get certified.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
              <li>Pick a relevant SDG challenge for your community</li>
              <li>Plan a complete 2-day jam with ready-to-use templates</li>
              <li>Facilitate each sprint with step-by-step guidance</li>
              <li>Document outcomes and submit for certification</li>
            </ul>
          </CardContent>
        </Card>

        {/* What it means to host */}
        <Card className="max-w-6xl mx-auto mb-12">
          <CardHeader>
            <CardTitle>What it means to host a Global Goals Jam</CardTitle>
            <CardDescription>And how this course gives you a head start</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-semibold mb-2">As a host, you will:</h4>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li>Frame a local SDG challenge with partners</li>
                <li>Recruit and welcome a diverse group of participants</li>
                <li>Facilitate the 6-sprint jam process</li>
                <li>Document outcomes and share them with the community</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">This course helps you:</h4>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li>Get a complete, ready-to-run jam agenda</li>
                <li>Use printable templates, method cards and checklists</li>
                <li>Practice core facilitation moves with exercises</li>
                <li>Track impact and prepare for certification</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Pricing Card */}
        <Card className="max-w-lg mx-auto border-primary">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">Investment in Your Impact</CardTitle>
            <CardDescription>Your one-time fee supports the GGJ community and this platform — and unlocks all facilitator and host tools</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="mb-6">
              <span className="text-5xl font-bold">$39.99</span>
              <p className="text-muted-foreground mt-2">One-time payment</p>
            </div>
            
            <div className="space-y-3 mb-8">
              <div className="flex items-center gap-2 justify-center">
                <Mail className="h-4 w-4 text-primary" />
                <span>8-day email course</span>
              </div>
              <div className="flex items-center gap-2 justify-center">
                <BookOpen className="h-4 w-4 text-primary" />
                <span>Full learning dashboard access</span>
              </div>
              <div className="flex items-center gap-2 justify-center">
                <Award className="h-4 w-4 text-primary" />
                <span>Official host certification</span>
              </div>
              <div className="flex items-center gap-2 justify-center">
                <Users className="h-4 w-4 text-primary" />
                <span>Join global host community</span>
              </div>
            </div>

            <Button size="lg" className="w-full" onClick={handleStartCheckout}>
              <CreditCard className="mr-2 h-5 w-5" />
              Start Your Journey
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            
            <p className="text-xs text-muted-foreground mt-4">
              Opens Stripe Checkout in a new tab. Promo codes accepted. Not planning to host? You’ll still earn a facilitation certificate and full access to tools and templates.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
