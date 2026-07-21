import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Users, Award, BookOpen, Mail, ArrowRight } from 'lucide-react'
import { db, safeDbCall } from '@/lib/supabase'
import { toast } from 'sonner'
import { appAuth } from '@/lib/simpleAuth'
import { getStoredUser } from '@/lib/auth'
import { callSupabaseFunction } from '@/lib/supabase-functions'
import LearnShowcase, { ProgrammeModuleCards } from '@/components/LearnShowcase'
import { goToLearn } from '@/lib/learnUrl'
import { usePageMeta } from '@/lib/usePageMeta'

// The Host Programme is free for everyone. The one payment moment in the
// model is the official certification (€39), claimed on the learn platform
// after completing the capstone — stated up front on this page so it never
// feels like a surprise. Enrollment activates instantly via the
// enroll-course-free edge function (which also provisions the learn account
// and emails a one-click sign-in link).
export default function CourseEnrollmentPage() {
  usePageMeta({
    title: 'Free Host Programme & GGJ Host Certification',
    description: 'Learn to facilitate a Global Goals Jam with the free 9-module Host Programme. Official Certified GGJ Host certification (€39) unlocks host status, the host dashboard and the right to run official jams.',
    path: '/course/enroll',
  })
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [checkingEnrollment, setCheckingEnrollment] = useState(true)
  const [enrolling, setEnrolling] = useState(false)
  const [justEnrolled, setJustEnrolled] = useState(false)
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const checkEnrollmentStatus = async (userId: string) => {
      try {
        const enrollments = await safeDbCall(() => db.courseEnrollments.list({ where: { userId }, orderBy: { createdAt: 'desc' }, limit: 1 }))
        if (enrollments.length > 0) {
          if (enrollments[0].status === 'active' || enrollments[0].status === 'completed') {
            goToLearn()
            return
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
    }
  }, [])

  const enrollFree = async () => {
    if (!user || enrolling) return
    setEnrolling(true)
    try {
      const data = await callSupabaseFunction<{ ok?: boolean; status?: string; emailSent?: boolean; error?: string }>('enroll-course-free', {
        userId: user.id,
      })
      if (data?.ok) {
        setJustEnrolled(true)
        toast.success('You’re enrolled! The course is free — see you on the learning platform.')
      } else {
        toast.error(data?.error || 'Could not activate your enrollment. Please try again.')
      }
    } catch (err: any) {
      console.error('Enrollment error', err)
      const msg = err?.message || ''
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
        toast.error('Could not reach the enrollment service. Please try again in a moment.')
      } else {
        toast.error(`Could not enroll: ${msg || 'unknown error'}`)
      }
    } finally {
      setEnrolling(false)
    }
  }

  const handleEnroll = () => {
    if (!user) {
      window.location.href = `/sign-in?redirect=${encodeURIComponent('/course/enroll?checkout=1')}`
      return
    }
    enrollFree()
  }

  // If user just signed up and landed here with checkout=1, auto-enroll.
  // (The param name is kept for old links/emails that still carry it.)
  const autoEnrollTriggered = useRef(false)
  useEffect(() => {
    if (!loading && !checkingEnrollment && user && !autoEnrollTriggered.current) {
      if (searchParams.get('checkout') === '1' && !justEnrolled) {
        autoEnrollTriggered.current = true
        enrollFree()
      }
    }
  }, [loading, checkingEnrollment, user, searchParams, justEnrolled])

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

  // Just enrolled → welcome state with the two ways in: the emailed
  // one-click link, or heading to the learn platform directly.
  if (justEnrolled) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="font-display">You’re in! 🎉</CardTitle>
            <CardDescription>Your free enrollment in the Host Programme is active.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-col items-center gap-4 py-2 w-full">
              <p className="text-sm text-muted-foreground text-center">
                We’ve emailed <strong>{user?.email}</strong> a one-click sign-in link for the learning platform. You can also head straight over and sign in with this email address.
              </p>
              <Button onClick={() => goToLearn()} className="w-full">
                Go to the learning platform
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-2">
                When you complete the programme you can claim your official Host certification (€39) — it unlocks host status and the host dashboard, and supports the GGJ community and this platform. Without it you simply stay a participant with full course access.
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
          <p className="text-xs uppercase tracking-[0.2em] font-semibold text-primary/60 mb-3">Host Programme</p>
          <Badge variant="green" className="mb-6 px-4 py-2 text-sm font-medium rounded-pill">
            <Award className="w-4 h-4 mr-2" />
            9 modules · 4 sprints · free for everyone
          </Badge>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground mb-6 tracking-tight">
            Become a Certified <span className="text-primary-solid">Facilitator</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            The full course is free. Learn to facilitate a Global Goals Jam at your own pace — and when you complete it, claim your official Host certification for €39.
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
                    <p className="text-sm text-muted-foreground">An animated explainer per module, narrated by an AI in Marco’s voice</p>
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
                    <p className="text-sm text-muted-foreground">Recognized globally by the GGJ network — €39 when you complete the programme</p>
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

        {/* Enrollment card */}
        <Card variant="elevated" className="max-w-lg mx-auto border-primary">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-display">The course is free</CardTitle>
            <CardDescription>For everyone, everywhere. Official certification is €39 once you complete the programme — that contribution supports the GGJ community and this platform.</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="mb-6">
              <span className="text-5xl font-bold">€0</span>
              <p className="text-muted-foreground mt-2">Full course access · certification €39 on completion</p>
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
                <span>Official certification (€39) unlocks host status + host dashboard</span>
              </div>
              <div className="flex items-center gap-2 justify-center">
                <Users className="h-4 w-4 text-primary" />
                <span>Join global host community</span>
              </div>
            </div>

            <Button size="xl" variant="pill" className="w-full" onClick={handleEnroll} disabled={enrolling}>
              {enrolling ? 'Activating your enrollment…' : 'Start the free course'}
              {!enrolling && <ArrowRight className="ml-2 h-5 w-5" />}
            </Button>

            <p className="text-xs text-muted-foreground mt-4">
              No payment needed to learn — as a participant you get the full course. When you finish, the official Certified GGJ Host credential (€39) unlocks your verified certificate, host status with the host dashboard, and the right to run official jams. Skip it and you simply stay a participant with full course access.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
