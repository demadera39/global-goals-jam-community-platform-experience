import HeroSection from '../components/HeroSection'
import WIDDAnnouncement from '../components/WIDDAnnouncement'
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

      {/* WIDD 2026 Partnership Announcement */}
      <WIDDAnnouncement />

      {/* What is a Global Goals Jam? */}
      <section className="py-20 bg-section-warm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight mb-4">
            What is a Global Goals Jam?
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed mb-2">
            A Global Goals Jam is a 2-day design sprint where local teams tackle the UN Sustainable Development Goals through creative problem-solving. Communities worldwide come together to prototype solutions for their most pressing social and environmental challenges.
          </p>
          <Link
            to="/about"
            className="inline-flex items-center text-primary hover:underline text-sm font-medium mt-4"
          >
            Learn more about Global Goals Jam <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
      </section>

      {/* Supporters strip (logos) */}
      <SponsorBanner />

      {/* UN SDG Report Intro */}
      <section className="py-20 bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border-0 bg-card p-6 sm:p-8 shadow-card">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
                State of SDGs: An alarmingly high need for our community to step up
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
              The latest United Nations progress update on the Sustainable Development Goals paints a stark picture:
            </p>

            <div className="grid sm:grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-2xl border" style={{ backgroundColor: 'hsl(32 98% 57% / 0.12)', borderColor: 'hsl(32 98% 57% / 0.2)' }}>
                <div className="font-display text-3xl font-extrabold text-sdg-11">11</div>
                <p className="text-sm" style={{ color: 'hsl(32 98% 47%)' }}>goals face significant challenges</p>
              </div>
              <div className="p-4 rounded-2xl border" style={{ backgroundColor: 'hsl(351 77% 52% / 0.12)', borderColor: 'hsl(351 77% 52% / 0.2)' }}>
                <div className="font-display text-3xl font-extrabold text-sdg-1">6</div>
                <p className="text-sm" style={{ color: 'hsl(351 77% 42%)' }}>goals face major challenges (most severe)</p>
              </div>
              <div className="p-4 rounded-2xl border" style={{ backgroundColor: 'hsl(199 93% 45% / 0.12)', borderColor: 'hsl(199 93% 45% / 0.2)' }}>
                <div className="font-display text-3xl font-extrabold text-sdg-14">0</div>
                <p className="text-sm" style={{ color: 'hsl(199 93% 35%)' }}>goals are on track</p>
              </div>
            </div>

            <p className="text-foreground font-medium mb-4">
              That's why the Global Goals Jam exists. Each year, we mobilise designers, students, researchers and local partners to turn urgency into action — city by city, weekend by weekend.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/course/enroll" className="inline-flex items-center justify-center px-5 py-3 rounded-pill bg-primary-solid text-white hover:bg-primary/90 transition-colors">
                Enroll in the certification course
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
              <Link to="/events" className="inline-flex items-center justify-center px-5 py-3 rounded-pill border hover:bg-muted transition-colors">
                Find a Jam near you <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Sustainable Development Goals Grid */}
      <section className="py-20 bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-2">United Nations</p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight mb-3">
              The 17 Sustainable Development Goals
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Every Global Goals Jam is centred around one or more of these goals. Together, they form the blueprint for a better, more sustainable future for all.
            </p>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 sm:gap-3">
            {[
              'No Poverty', 'Zero Hunger', 'Good Health', 'Quality Education',
              'Gender Equality', 'Clean Water', 'Clean Energy', 'Decent Work',
              'Innovation', 'Reduced Inequalities', 'Sustainable Cities', 'Responsible Consumption',
              'Climate Action', 'Life Below Water', 'Life on Land', 'Peace & Justice', 'Partnerships',
            ].map((name, i) => (
              <div
                key={i}
                className={`bg-sdg-${i + 1} rounded-xl p-3 sm:p-4 flex flex-col items-start justify-between aspect-square text-white relative overflow-hidden group hover:scale-[1.04] transition-transform cursor-default`}
              >
                <span className="text-[2rem] sm:text-[2.5rem] font-display font-extrabold leading-none opacity-30">{i + 1}</span>
                <span className="text-[0.65rem] sm:text-xs font-semibold leading-tight">{name}</span>
              </div>
            ))}
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
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SponsorSection />
        </div>
      </section>

      {/* Global Theme Section */}
      <section className="py-20 bg-section-alt">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-8 items-stretch">
            <Card variant="elevated" className="overflow-hidden">
              <CardHeader className="border-b">
                <div className="flex items-center gap-2">
                  <Badge variant="amber">2026 Theme</Badge>
                </div>
                <CardTitle className="text-2xl mt-2">
                  <h2 className="font-display text-2xl font-bold">Resilient by Design</h2>
                </CardTitle>
                <p className="text-muted-foreground">
                  Local solutions for a world under pressure. From water stress to extreme heat, from food insecurity to displacement — every community faces unique climate realities. This year, we design resilience from the ground up.
                </p>
              </CardHeader>
              <CardContent className="p-6">
                <ul className="grid sm:grid-cols-2 gap-4 text-sm">
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-sdg-13 mt-2 flex-shrink-0" />
                    Climate adaptation and resilience at the local level
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-sdg-11 mt-2 flex-shrink-0" />
                    Designing cities and spaces that withstand disruption
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-sdg-6 mt-2 flex-shrink-0" />
                    Water, food, and energy resilience for every community
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-sdg-10 mt-2 flex-shrink-0" />
                    Centre the most vulnerable in every solution you design
                  </li>
                </ul>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link to="/theme" className="inline-flex items-center text-primary hover:underline font-medium">
                    Explore the 2026 theme <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                  <Link to="/events" className="inline-flex items-center text-muted-foreground hover:text-primary hover:underline">
                    View upcoming Jams <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card variant="elevated" className="flex flex-col justify-between">
              <CardHeader>
                <CardTitle className="text-xl"><h2 className="font-display text-xl font-bold">Get ready to host</h2></CardTitle>
                <p className="text-muted-foreground text-sm">
                  Learn best practices, facilitation tips and the full GGJ process.
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button asChild variant="pill" size="lg" className="w-full">
                  <Link to="/course/train-the-trainer">
                    <GraduationCap className="w-5 h-5 mr-2" /> Train‑the‑Trainer Course
                  </Link>
                </Button>
                <Button asChild variant="pill-outline" size="lg" className="w-full">
                  <Link to="/faq">
                    Read FAQ <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>

                {/* Mini host callout */}
                <div className="mt-4 rounded-xl bg-pastel-green p-4 text-sm text-left">
                  <h3 className="font-display font-semibold mb-2">What you'll do as a host</h3>
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
      <section className="py-20 bg-section-warm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-8 items-stretch">
          <Card variant="elevated" className="overflow-hidden">
            <CardHeader className="border-b">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                <span className="text-sm text-muted-foreground">Together with UNDP</span>
              </div>
              <CardTitle><h2 className="font-display font-bold leading-none tracking-tight">Design community x Sustainable Development Goals</h2></CardTitle>
              <p className="text-muted-foreground">
                In 2016, UNDP approached Digital Society School to connect the global design community with the SDGs. Since then, GGJ has enabled people everywhere to take real action on local challenges with global impact.
              </p>
            </CardHeader>
            <CardContent className="p-6">
              <blockquote className="text-sm text-muted-foreground border-l-2 border-primary/30 pl-4">
                "Our partnership with Digital Society School in the Global Goals Jam facilitates a way to take real action. People all over the world can see and learn from each other's work, as well as create impact." — UNDP & Digital Society School
              </blockquote>
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardHeader>
              <CardTitle><h2 className="font-display font-bold leading-none tracking-tight">Jamkit + FAQ</h2></CardTitle>
              <p className="text-muted-foreground">Get the updated toolkit and answers to common questions.</p>
            </CardHeader>
            <CardContent className="p-6 flex gap-3 flex-wrap">
              <Button asChild variant="pill">
                <Link to="/toolkit">Open Jamkit</Link>
              </Button>
              <Button asChild variant="pill-outline">
                <Link to="/faq">See frequently asked questions</Link>
              </Button>
              <div className="pt-4 border-t w-full">
                <DonateButton variant="pill-outline" size="default" className="w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </section>


    </div>
  )
}
