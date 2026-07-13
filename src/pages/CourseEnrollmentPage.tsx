import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Users, Award, BookOpen, Mail, CreditCard, ArrowRight } from 'lucide-react'
import { db, safeDbCall } from '@/lib/supabase'
import { toast } from 'sonner'
import { appAuth } from '@/lib/simpleAuth'
import { getStoredUser } from '@/lib/auth'
import { config } from '@/lib/config'
import { callSupabaseFunction } from '@/lib/supabase-functions'
import LearnShowcase, { ProgrammeModuleCards } from '@/components/LearnShowcase'
import { goToLearn } from '@/lib/learnUrl'

export default function CourseEnrollmentPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [enrollment, setEnrollment] = useState<any>(null)
  const [checkingEnrollment, setCheckingEnrollment] = useState(true)
  const [searchParams] = useSearchParams()
  // Start in the "confirming" state when we land back from the payment page so
  // there's no flash of the resume card before the verify poll kicks in.
  const [verifying, setVerifying] = useState(searchParams.get('success') === '1')
  const verifyPollRef = useRef<number | null>(null)

  // While we confirm the payment (active verify poll), show a calm "confirming"
  // state — the system checks payment itself; the user is never asked to verify
  // anything by hand. This clears on its own once the poll resolves (activated
  // → dashboard) or gives up (→ resume card), so a stalled/failed payment can
  // never trap the user on a spinner.
  const showConfirming = verifying
  // A genuinely unfinished enrollment that we're NOT actively confirming → the
  // only action is to (re)start checkout. No manual "I already paid" button.
  const showResumeCard = !showConfirming && !!enrollment && enrollment.status === 'pending'

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
        toast.success('Payment confirmed — you’re in! Taking you to your course…')
        goToLearn()
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
                goToLearn()
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
            goToLearn()
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
      if (verifyPollRef.current) { window.clearTimeout(verifyPollRef.current); verifyPollRef.current = null }
    }
  }, [navigate, startVerifyPolling, verifyMolliePayment])

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
        // If already active/completed, go straight to the learn platform
        if (record.status === 'active' || record.status === 'completed') {
          goToLearn()
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
        toast.error('Could not reach the checkout service. Please try again in a moment.')
      } else if (msg.includes('not configured')) {
        toast.error('Payments are not configured on the server. Please contact the administrator.')
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

  // If user just signed up and landed here with checkout=1, auto-start checkout.
  // We use a ref to ensure we only trigger once.
  const autoCheckoutTriggered = useRef(false)
  useEffect(() => {
    if (!loading && !checkingEnrollment && user && !autoCheckoutTriggered.current) {
      const wantsCheckout = searchParams.get('checkout') === '1'
      const isPaymentReturn = searchParams.get('success') === '1' || searchParams.get('canceled') === '1'
      // Only auto-trigger if checkout=1 is set and this isn't a payment return
      if (wantsCheckout && !isPaymentReturn && !enrollment) {
        autoCheckoutTriggered.current = true
        startCheckout()
      }
    }
  }, [loading, checkingEnrollment, user, searchParams, enrollment])

  // Returning from the payment page → confirm automatically by verifying the
  // payment directly against Mollie and activating.
  useEffect(() => {
    if (loading) return
    if (searchParams.get('success') === '1') {
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

  // Pending enrollment but not in a payment-return flow → show a clear resume card
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
            9 modules · 4 sprints · certificate
          </Badge>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground mb-6 tracking-tight">
            Become a Certified <span className="text-primary-solid">Facilitator</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Not planning to host (yet)? You can still take the course to become a skilled Jam facilitator — and unlock the full toolkit, templates, and community access.
          </p>
        </div>
      </section>

      {/* SaaS-style tour of the Learn platform: framed demo video + feature cards */}
      <LearnShowcase variant="enroll" />

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
                    <strong>9 guided modules</strong>
                    <p className="text-sm text-muted-foreground">Across four sprints — Understand, Define, Prototype, Implement</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <strong>Narrated video explainers</strong>
                    <p className="text-sm text-muted-foreground">Marco walks you through every module, in his own voice</p>
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
                    <strong>The 4-sprint jam method</strong>
                    <p className="text-sm text-muted-foreground">Guide teams from understanding to implementation</p>
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

        {/* Programme overview — the 4-sprint path as floating tilted module cards */}
        <div className="max-w-6xl mx-auto mb-14">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <p className="text-xs uppercase tracking-[0.22em] font-semibold text-primary/70 mb-2">The programme</p>
            <h3 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground mb-3">
              Nine modules across four sprints
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              The same Understand → Define → Prototype → Implement rhythm you’ll run at your jam. Each
              module ends with an artefact — together they become your complete jam plan.
            </p>
          </div>
          <ProgrammeModuleCards />
        </div>

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
                <li>Facilitate the 4-sprint jam process</li>
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
                <span>Self-paced · 9 modules on the platform</span>
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
              Opens the secure payment page in a new tab. Promo codes accepted. Not planning to host? You’ll still earn a facilitation certificate and full access to tools and templates.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
