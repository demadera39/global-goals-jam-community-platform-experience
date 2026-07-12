import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Clock, Users, Award, BookOpen, Mail, CreditCard, ArrowRight } from 'lucide-react'
import { db, safeDbCall } from '@/lib/supabase'
import { toast } from 'sonner'
import { courseModules } from '@/data/courseContent'
import { appAuth } from '@/lib/simpleAuth'
import { getStoredUser } from '@/lib/auth'
import { config } from '@/lib/config'
import { callSupabaseFunction } from '@/lib/supabase-functions'

export default function CourseEnrollmentPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [enrollment, setEnrollment] = useState<any>(null)
  const [checkingEnrollment, setCheckingEnrollment] = useState(true)
  const [searchParams] = useSearchParams()
  const [isPolling, setIsPolling] = useState(false)
  const [confirming, setConfirming] = useState(false)
  // Start in the "confirming" state when we land back from the payment page so
  // there's no flash of the resume card before the verify poll kicks in.
  const [verifying, setVerifying] = useState(searchParams.get('success') === '1')
  const pollRef = useRef<number | null>(null)
  const pollTimeoutRef = useRef<number | null>(null)
  const pollingIntervalRef = useRef<number | null>()
  const verifyPollRef = useRef<number | null>(null)

  // While we confirm the payment (active verify poll or legacy Stripe poll),
  // show a calm "confirming" state — the system checks payment itself; the user
  // is never asked to verify anything by hand. This clears on its own once the
  // poll resolves (activated → dashboard) or gives up (→ resume card), so a
  // stalled/failed payment can never trap the user on a spinner.
  const showConfirming = verifying || isPolling
  // A genuinely unfinished enrollment that we're NOT actively confirming → the
  // only action is to (re)start checkout. No manual "I already paid" button.
  const showResumeCard = !showConfirming && !!enrollment && enrollment.status === 'pending'

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

  // Ask the server to confirm the payment directly with Mollie and activate
  // the enrollment if paid (idempotent). Returns true once active.
  const verifyMolliePayment = useCallback(async (enrollmentId: string): Promise<boolean> => {
    try {
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
      const resp = await fetch(config.functions.verifyCoursePaymentUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${anonKey}` },
        body: JSON.stringify({ enrollmentId }),
      })
      const data = await resp.json().catch(() => null)
      if (data?.paid && (data.status === 'active' || data.status === 'completed')) {
        toast.success('Payment confirmed — you’re in!')
        navigate('/course/dashboard?enrolled=1')
        return true
      }
      return false
    } catch {
      return false
    }
  }, [navigate])

  // Poll the verifier for a short window after a return from payment (Mollie
  // can take a few seconds to settle), then stop quietly.
  const startVerifyPolling = useCallback((enrollmentId: string) => {
    if (verifyPollRef.current) return
    setVerifying(true)
    let tries = 0
    const tick = async () => {
      tries++
      const done = await verifyMolliePayment(enrollmentId)
      if (done) { setVerifying(false); verifyPollRef.current = null; return }
      if (tries >= 15) { setVerifying(false); verifyPollRef.current = null; return } // ~45s
      verifyPollRef.current = window.setTimeout(tick, 3000)
    }
    tick()
  }, [verifyMolliePayment])

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
        const rows = await safeDbCall(() => db.courseEnrollments.list({ where: { id: enrollmentId }, limit: 1 }))
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
                if (searchParams.get('success') === '1') startVerifyPolling(data.id)
                else verifyMolliePayment(data.id)
              }
              setCheckingEnrollment(false)
              return
            }
          }
        } catch (_) {}

        const enrollments = await safeDbCall(() => db.courseEnrollments.list({ where: { userId }, orderBy: { createdAt: 'desc' }, limit: 1 }))
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

          // Pending → confirm the payment ourselves. On a return from the
          // payment page, actively poll Mollie for a short window; otherwise do
          // one silent check to catch a missed webhook. No manual step.
          if (enrollments[0].status === 'pending') {
            if (searchParams.get('success') === '1') startVerifyPolling(enrollments[0].id)
            else verifyMolliePayment(enrollments[0].id)
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
      if (verifyPollRef.current) { window.clearTimeout(verifyPollRef.current); verifyPollRef.current = null }
    }
  }, [navigate, stopEnrollmentPolling, startEnrollmentPolling, startVerifyPolling, verifyMolliePayment])

  const confirmEnrollmentNow = async () => {
    try {
      setConfirming(true)
      const sessionId = searchParams.get('session_id')

      // If we have a Stripe session_id from success redirect → call confirm endpoint
      if (sessionId) {
        const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
        const resp = await fetch(config.functions.confirmCourseEnrollmentUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${anonKey}` },
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
      const latest = await safeDbCall(() => db.courseEnrollments.list({ where: { userId: user.id }, orderBy: { createdAt: 'desc' }, limit: 1 }))
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
      let existing = await safeDbCall(() => db.courseEnrollments.list({ where: { userId: user.id }, orderBy: { enrolledAt: 'desc' }, limit: 1 }))
      let record = existing?.[0]
      if (!record) {
        const enrollId = `enr_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
        record = await safeDbCall(() => db.courseEnrollments.create({
          id: enrollId,
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
      const successUrl = `${baseUrl}/course/enroll?success=1&enr_id=${record.id}`
      const cancelUrl = `${baseUrl}/course/enroll?canceled=1`

      const checkoutData = await callSupabaseFunction<{ url?: string; paymentId?: string; error?: string }>('create-mollie-course-checkout', {
        enrollmentId: record.id,
        userId: user.id,
        email: user.email || '',
        successUrl,
        cancelUrl,
        amount: 3999
      })
      const checkoutUrl = checkoutData.url
      // Persist the Mollie payment id now so we can confirm the payment
      // ourselves the moment the user returns — no manual step, even if the
      // webhook is delayed.
      if (checkoutData.paymentId && record?.id) {
        void safeDbCall(() => db.courseEnrollments.update(record.id, { molliePaymentId: checkoutData.paymentId }))
      }
      if (checkoutUrl) {
        const win = window.open(checkoutUrl, '_blank')
        if (!win || win.closed || typeof win.closed === 'undefined') {
          toast.warning?.('We tried to open the payment page but your browser blocked it. Please allow pop-ups and click the button again.')
        } else {
          toast('Payment page opened in a new tab')
        }
      } else {
        toast.error('Failed to start checkout')
      }
    } catch (err: any) {
      console.error('Checkout error', err)
      const msg = err?.message || ''
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
        toast.error('Could not reach the checkout service. The Stripe integration may not be deployed yet.')
      } else if (msg.includes('Stripe not configured')) {
        toast.error('Stripe is not configured on the server. Please contact the administrator.')
      } else {
        toast.error(`Could not start checkout: ${msg || 'unknown error'}`)
      }
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
      await safeDbCall(() => db.emailSchedule.create({
        id: `email_${enrollmentId}_${day}`,
        enrollmentId,
        userId,
        moduleNumber: String(day),
        scheduledFor: scheduledDate.toISOString(),
        status: 'scheduled'
      }))
    }
  }

  // If user just signed up and landed here with checkout=1, auto-start Stripe.
  // We use a ref to ensure we only trigger once.
  const autoCheckoutTriggered = useRef(false)
  useEffect(() => {
    if (!loading && !checkingEnrollment && user && !autoCheckoutTriggered.current) {
      const wantsCheckout = searchParams.get('checkout') === '1'
      const isStripeReturn = searchParams.get('success') === '1' || searchParams.get('canceled') === '1'
      // Only auto-trigger if checkout=1 is set and this isn't a Stripe return
      if (wantsCheckout && !isStripeReturn && !enrollment) {
        autoCheckoutTriggered.current = true
        startCheckout()
      }
    }
  }, [loading, checkingEnrollment, user, searchParams, enrollment])

  // Returning from the payment page → confirm automatically.
  useEffect(() => {
    if (loading) return
    const success = searchParams.get('success') === '1'
    const sid = searchParams.get('session_id')
    if (success && sid) {
      // Legacy Stripe return.
      confirmEnrollmentNow()
    } else if (success) {
      // Mollie return: verify the payment directly against Mollie and activate.
      const enrId = searchParams.get('enr_id')
      if (enrId) startVerifyPolling(enrId)
    }
  }, [loading, searchParams, startVerifyPolling])

  // Safety net: never leave the user stranded on the "confirming" spinner. If a
  // verify poll somehow never starts (e.g. no enrollment found for a success
  // return), force the confirming state to clear after a bounded window so the
  // resume card can take over.
  useEffect(() => {
    if (!verifying) return
    const t = window.setTimeout(() => setVerifying(false), 50000)
    return () => window.clearTimeout(t)
  }, [verifying])

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

  // Returning from payment (or actively verifying) → calm, hands-off state.
  // The system confirms the payment with Mollie itself; the user is never asked
  // to verify anything by hand.
  if (showConfirming) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Confirming your payment</CardTitle>
            <CardDescription>Hang tight — we’re activating your access.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-col items-center gap-4 py-2">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
              <p className="text-sm text-muted-foreground text-center">
                This usually takes just a few seconds. You’ll be taken to your course dashboard automatically as soon as your payment is confirmed — no action needed.
              </p>
              <p className="text-xs text-muted-foreground text-center mt-2">
                You can safely keep this tab open. A receipt will also be emailed to you.
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
              </div>
              <p className="text-xs text-muted-foreground text-center mt-2">
                As soon as you pay, we confirm it automatically and open your dashboard — there’s nothing else you need to do.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 hero-pattern">
        <div className="absolute inset-0 bg-gradient-to-br from-background/80 to-background/60" aria-hidden="true" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs uppercase tracking-[0.2em] font-semibold text-primary/60 mb-3">Certification Course</p>
          <Badge variant="green" className="mb-6 px-4 py-2 text-sm font-medium rounded-pill">
            <Award className="w-4 h-4 mr-2" />
            8-Day Program
          </Badge>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground mb-6 tracking-tight">
            Become a Certified <span className="text-primary-solid">Facilitator</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Not planning to host (yet)? You can still take the course to become a skilled Jam facilitator — and unlock the full toolkit, templates, and community access.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">

        {/* Peer-review policy note */}
        <Card className="max-w-4xl mx-auto mb-6 border-0 bg-pastel-amber">
          <CardContent className="p-4 text-sm text-amber-800 dark:text-amber-200">
            Note: The capstone project is peer-reviewed by a fellow host or mentor you choose. The GGJ organization does not actively review or grade capstones. Arrange your peer reviewer before starting Module 8.
          </CardContent>
        </Card>

        {/* Course Overview */}
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8 mb-12">
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display">
                <BookOpen className="h-5 w-5 text-primary" />
                Course Structure
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <strong>8 comprehensive modules</strong>
                    <p className="text-sm text-muted-foreground">From foundations to advanced facilitation</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <strong>Daily email lessons</strong>
                    <p className="text-sm text-muted-foreground">Bite-sized learning delivered to your inbox</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <strong>Interactive learning dashboard</strong>
                    <p className="text-sm text-muted-foreground">Videos, templates, and exercises</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <strong>Official certification</strong>
                    <p className="text-sm text-muted-foreground">Recognized globally by the GGJ network</p>
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display">
                <Award className="h-5 w-5 text-primary" />
                What You'll Master
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <strong>Complex challenge framing</strong>
                    <p className="text-sm text-muted-foreground">Transform global goals into local action</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <strong>6-Sprint methodology</strong>
                    <p className="text-sm text-muted-foreground">Guide teams from ideation to documentation</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <strong>Facilitation excellence</strong>
                    <p className="text-sm text-muted-foreground">Manage dynamics and unlock creativity</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
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
        <Card variant="elevated" className="max-w-4xl mx-auto mb-12">
          <CardHeader>
            <CardTitle className="font-display">Course Modules</CardTitle>
            <CardDescription>Your 8-day journey to becoming a certified facilitator — host-ready when you are</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {courseModules.map((m) => (
                <div key={m.id} className="flex items-center justify-between p-4 border rounded-xl">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-pastel-green flex items-center justify-center">
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
        <Card variant="elevated" className="max-w-5xl mx-auto mb-12">
          <CardHeader>
            <CardTitle className="font-display">Fast track to hosting (when you’re ready)</CardTitle>
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
        <Card variant="elevated" className="max-w-6xl mx-auto mb-12">
          <CardHeader>
            <CardTitle className="font-display">What it means to host a Global Goals Jam</CardTitle>
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
        <Card variant="elevated" className="max-w-lg mx-auto border-primary">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-display">Investment in Your Impact</CardTitle>
            <CardDescription>Your one-time fee supports the GGJ community and this platform — and unlocks all facilitator and host tools</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="mb-6">
              <span className="text-5xl font-bold">€39.99</span>
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

            <Button size="xl" variant="pill" className="w-full" onClick={handleStartCheckout}>
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
