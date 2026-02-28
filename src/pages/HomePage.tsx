import HeroSection from '../components/HeroSection'
import SponsorBanner from '../components/SponsorBanner'
import SponsorSection from '../components/SponsorSection'
import SponsorSection2 from '../components/SponsorSection'
import FloatingAnnouncement from '../components/FloatingAnnouncement'
import JamDiversityCarousel from '../components/JamDiversityCarousel'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Link } from 'react-router-dom'
import { ArrowRight, GraduationCap, Users, Globe } from 'lucide-react'
import GlobalEventsOverview from '../components/GlobalEventsOverview'
import HostExploreBanner from '../components/HostExploreBanner'
import TestimonialsSection from '../components/TestimonialsSection'
import DonateButton from '../components/DonateButton'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <FloatingAnnouncement />
      <HeroSection />

      {/* Supporters strip (logos) */}
      <SponsorBanner />

      {/* UN SDG 2025 Report Intro */}
      <section className="py-12 bg-card/50 border-y">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border bg-background p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                State of SDGs 2025: An alarmingly high need for our community to step up
              </h2>
              <a
                href="https://unstats.un.org/sdgs/report/2025/"
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline text-sm font-medium"
              >
                Read the UN report →
              </a>
            </div>

            <p className="text-muted-foreground mb-6">
              Days ago, the United Nations released its 2025 progress update on the Sustainable Development Goals. The results are stark:
            </p>

            <div className="grid sm:grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-lg border bg-card">
                <div className="text-3xl font-extrabold text-amber-600">11</div>
                <p className="text-sm text-muted-foreground">goals face significant challenges</p>
              </div>
              <div className="p-4 rounded-lg border bg-card">
                <div className="text-3xl font-extrabold text-red-600">6</div>
                <p className="text-sm text-muted-foreground">goals face major challenges (most severe)</p>
              </div>
              <div className="p-4 rounded-lg border bg-card">
                <div className="text-3xl font-extrabold text-foreground">0</div>
                <p className="text-sm text-muted-foreground">goals are on track</p>
              </div>
            </div>

            <p className="text-foreground font-medium mb-4">
              That's why the Global Goals Jam exists. Each year, we mobilise designers, students, researchers and local partners to turn urgency into action — city by city, weekend by weekend.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/course/enroll" className="inline-flex items-center justify-center px-5 py-3 rounded-lg bg-primary-solid text-white hover:bg-primary/90">
                Become a certified jam host
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
              <Link to="/events" className="inline-flex items-center justify-center px-5 py-3 rounded-lg border hover:bg-muted">
                Find a Jam near you <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Global Events Overview (This Edition) */}
      <GlobalEventsOverview />

      {/* Jam Diversity Carousel - Showcasing jams from different cities */}
      <JamDiversityCarousel />

      {/* Explore all hosts */}
      <HostExploreBanner />

      {/* Testimonials: OCR + Derived Quotes (Home-specific) */}
      <TestimonialsSection
        pdfUrl="https://firebasestorage.googleapis.com/v0/b/blink-451505.firebasestorage.app/o/user-uploads%2Fz9Up8fyufsOU2ncxMU2r2iGBON23%2FGGJimpactreport_compressed2__9665dd7f.pdf?alt=media&token=41c7c767-9e12-43be-b12a-9f3e16644c83"
        count={3}
        startIndex={0}
        variant="home"
      />

      {/* Metodic Sponsor Banner */}
      <section className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SponsorSection />
        </div>
      </section>

      {/* Global Theme Section */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-8 items-stretch">
            <Card className="overflow-hidden">
              <CardHeader className="border-b">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">2025 Theme</Badge>
                </div>
                <CardTitle className="text-2xl mt-2">
                  Co-Intelligence for a Shared Planet
                </CardTitle>
                <p className="text-muted-foreground">
                  New opportunities for co-intelligence. Join a global movement using AI and collective creativity to tackle the world’s biggest challenges. Let’s co-create futures that are inclusive, regenerative, and just.
                </p>
              </CardHeader>
              <CardContent className="p-6">
                <ul className="grid sm:grid-cols-2 gap-4 text-sm">
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                    Co-create with communities using AI as an augmenting partner
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                    Ethics-first: inclusive, regenerative, and just outcomes
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                    Toolkits and method cards tailored to SDG-aligned challenges
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                    Share learnings to amplify impact across the global network
                  </li>
                </ul>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link to="/events" className="inline-flex items-center text-primary hover:underline">
                    View upcoming Jams <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card className="flex flex-col justify-between">
              <CardHeader>
                <CardTitle className="text-xl">Get ready to host</CardTitle>
                <p className="text-muted-foreground text-sm">
                  Learn best practices, facilitation tips and the full GGJ process.
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button asChild size="lg" className="w-full bg-primary-solid text-white hover:bg-primary/90">
                  <Link to="/course/train-the-trainer">
                    <GraduationCap className="w-5 h-5 mr-2" /> Train‑the‑Trainer Course
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="w-full">
                  <Link to="/faq">
                    Read FAQ <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>

                {/* Mini host callout */}
                <div className="mt-4 rounded-lg border bg-muted/40 p-4 text-sm text-left">
                  <h4 className="font-medium mb-2">What you’ll do as a host</h4>
                  <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                    <li>Pick a local SDG challenge with partners</li>
                    <li>Plan your 2‑day jam using our Jamkit</li>
                    <li>Facilitate 6 sprints from ideas to actions</li>
                    <li>Document outcomes and share with the community</li>
                  </ul>
                </div>

                <div className="pt-4 border-t">
                  <Button asChild variant="ghost" className="w-full justify-start">
                    <Link to="/host-dashboard">
                      <Users className="w-4 h-4 mr-2" /> Become a Local Organiser
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Partnership + Jamkit CTA */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-8 items-stretch">
          <Card className="overflow-hidden">
            <CardHeader className="border-b">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                <span className="text-sm text-muted-foreground">Together with UNDP</span>
              </div>
              <CardTitle>Design community × Sustainable Development Goals</CardTitle>
              <p className="text-muted-foreground">
                In 2016, UNDP approached Digital Society School to connect the global design community with the SDGs. Since then, GGJ has enabled people everywhere to take real action on local challenges with global impact.
              </p>
            </CardHeader>
            <CardContent className="p-6">
              <blockquote className="text-sm text-muted-foreground border-l-2 pl-4">
                “Our partnership with Digital Society School in the Global Goals Jam facilitates a way to take real action. People all over the world can see and learn from each other’s work, as well as create impact.” — UNDP & Digital Society School
              </blockquote>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Jamkit + FAQ</CardTitle>
              <p className="text-muted-foreground">Get the updated toolkit and answers to common questions.</p>
            </CardHeader>
            <CardContent className="p-6 flex gap-3 flex-wrap">
              <Button asChild className="bg-primary-solid text-white hover:bg-primary/90">
                <Link to="/toolkit">Open Jamkit</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/faq">Read FAQ</Link>
              </Button>
              <div className="pt-4 border-t">
                <DonateButton variant="outline" size="default" className="w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </section>


    </div>
  )
}
