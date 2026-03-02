import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { CheckCircle, Clock, Award, BookOpen, Users, CreditCard, ArrowRight } from 'lucide-react'
import { auth } from '../lib/supabase'
import { toast } from 'sonner'
import { courseModules } from '../data/courseContent'

export default function CourseRegistrationPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  const handleStartCheckout = () => {
    navigate('/course/enroll')
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative py-20 hero-pattern">
        <div className="absolute inset-0 bg-gradient-to-br from-background/80 to-background/60" aria-hidden="true" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs uppercase tracking-[0.2em] font-semibold text-primary/60 mb-3">Train the Trainer</p>
          <Badge variant="green" className="mb-6 px-4 py-2 text-sm font-medium rounded-pill">
            <BookOpen className="w-4 h-4 mr-2" />
            8-Day Certification Course
          </Badge>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground mb-6 tracking-tight">
            Global Goals Jam <span className="text-primary-solid">Train‑the‑Trainer</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            A focused 8‑day path to become a certified GGJ host. Learn the essentials, complete practical exercises, and join a global network of facilitators.
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid lg:grid-cols-[1fr_0.9fr] gap-8">
        {/* Overview */}
        <Card variant="elevated" className="order-2 lg:order-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display">
              <BookOpen className="w-5 h-5" /> Program Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-sm text-muted-foreground">
            <div className="space-y-2 text-foreground">
              <p>Get everything you need to confidently host a Jam — in one cohesive journey.</p>
            </div>

            <div>
              <h3 className="text-foreground font-semibold mb-2 text-xs uppercase tracking-[0.2em] text-primary/60">What you’ll get</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Clear Jam structure, agenda and roles</li>
                <li>Curated method picks + printable materials</li>
                <li>Outreach kit (emails, posts), partner & venue checklist</li>
                <li>Facilitation moves for momentum and inclusion</li>
                <li>Impact tracking and follow‑up plan</li>
                <li>Official certificate upon completion</li>
              </ul>
            </div>

            <div>
              <h3 className="text-foreground font-semibold mb-2 text-xs uppercase tracking-[0.2em] text-primary/60">Modules at a glance</h3>
              <div className="grid gap-3">
                {courseModules.map((m) => (
                  <div key={m.id} className="flex items-center justify-between p-4 border rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-pastel-green flex items-center justify-center">
                        <span className="font-semibold text-primary">{m.moduleNumber}</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground">{m.title}</h4>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {typeof m.duration === 'number' ? `${m.duration} min` : `${m.durationMinutes || ''} min`}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">Day {m.moduleNumber}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* What it means to host */}
        <Card variant="elevated" className="order-2 lg:order-1">
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

        {/* CTA / Pricing */}
        <Card variant="elevated" className="order-1 lg:order-2 border-primary">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-display">Become a Certified Host</CardTitle>
            <CardDescription>Support the platform and unlock host access</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="mb-6">
              <span className="text-5xl font-bold">$39.99</span>
              <p className="text-muted-foreground mt-2">One-time payment</p>
            </div>

            <div className="space-y-3 mb-8">
              <div className="flex items-center gap-2 justify-center"><Award className="h-4 w-4 text-primary" /><span>Official host certification</span></div>
              <div className="flex items-center gap-2 justify-center"><BookOpen className="h-4 w-4 text-primary" /><span>Full learning dashboard access</span></div>
              <div className="flex items-center gap-2 justify-center"><Users className="h-4 w-4 text-primary" /><span>Join global host community</span></div>
            </div>

            <Button size="xl" variant="pill" className="w-full" onClick={handleStartCheckout} disabled={loading}>
              <CreditCard className="mr-2 h-5 w-5" /> Enroll & Start Payment <ArrowRight className="ml-2 h-5 w-5" />
            </Button>

            <p className="text-xs text-muted-foreground mt-4">Opens Stripe Checkout in a new tab. Promo codes accepted.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
