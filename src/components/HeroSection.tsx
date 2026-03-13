import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Card } from './ui/card'
import { ArrowRight, Globe, Users, Target, Download } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center hero-pattern overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-background/80 to-background/60" aria-hidden="true" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-4xl mx-auto">
          {/* GGJ Marker Logo */}
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-pastel-green blur-2xl opacity-40 scale-150" aria-hidden="true" />
              <img
                src="/marker.png"
                alt="Global Goals Jam marker logo"
                className="relative w-20 h-24 sm:w-24 sm:h-28 object-contain drop-shadow-lg"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none'
                }}
              />
            </div>
          </div>

          {/* Badge (theme label) */}
          <Badge variant="green" className="mb-6 px-4 py-2 text-sm font-medium rounded-pill">
            <Globe className="w-4 h-4 mr-2" />
            This Year's Theme
          </Badge>

          {/* Main Heading */}
          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-extrabold text-foreground mb-6 leading-[1.1] tracking-tight">
            Resilient
            <br className="hidden sm:block" />
            <span className="text-primary-solid">by Design</span>
          </h1>

          {/* Subheading */}
          <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
            Local solutions for a world under pressure. From water stress to extreme heat, from food insecurity to displacement — join a global movement of designers and changemakers building resilience from the ground up, city by city.
          </p>

          {/* Stats - Pastel colored chips */}
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mb-12">
            <div className="bg-pastel-green rounded-2xl px-6 py-4 text-center min-w-[130px]">
              <div className="font-display text-3xl sm:text-4xl font-extrabold text-primary/80 dark:text-green-300">~55</div>
              <div className="text-sm font-medium text-primary dark:text-green-400">Events per year</div>
            </div>
            <div className="bg-pastel-amber rounded-2xl px-6 py-4 text-center min-w-[130px]">
              <div className="font-display text-3xl sm:text-4xl font-extrabold text-amber-700 dark:text-amber-300">~2,750</div>
              <div className="text-sm font-medium text-amber-600 dark:text-amber-400">Changemakers yearly</div>
            </div>
            <div className="bg-pastel-violet rounded-2xl px-6 py-4 text-center min-w-[130px]">
              <div className="font-display text-3xl sm:text-4xl font-extrabold text-violet-700 dark:text-violet-300">2</div>
              <div className="text-sm font-medium text-violet-600 dark:text-violet-400">Days to impact</div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-14">
            <Button variant="pill" size="xl" asChild className="group">
              <Link to="/course/train-the-trainer">
                Start your host journey
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button variant="pill-outline" size="lg" asChild className="gap-2">
              <a href="https://kzeoegabvbaonypooaev.supabase.co/storage/v1/object/public/Assets/GGJ_2026_Resilient_by_Design.pdf" target="_blank" rel="noreferrer">
                <Download className="w-4 h-4" />
                Download 2026 Guide
              </a>
            </Button>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card variant="feature" className="p-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-pastel-green flex items-center justify-center mb-4 mx-auto">
                <Globe className="w-7 h-7 text-primary dark:text-green-300" />
              </div>
              <h3 className="font-display text-lg font-semibold mb-2">Global Network</h3>
              <p className="text-muted-foreground text-sm">
                Connect with hosts and participants from around the world working on similar challenges.
              </p>
            </Card>

            <Card variant="feature" className="p-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-pastel-amber flex items-center justify-center mb-4 mx-auto">
                <Target className="w-7 h-7 text-amber-600 dark:text-amber-300" />
              </div>
              <h3 className="font-display text-lg font-semibold mb-2">SDG Focus</h3>
              <p className="text-muted-foreground text-sm">
                Every jam targets specific UN Sustainable Development Goals with actionable outcomes.
              </p>
            </Card>

            <Card variant="feature" className="p-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-pastel-violet flex items-center justify-center mb-4 mx-auto">
                <Users className="w-7 h-7 text-violet-600 dark:text-violet-300" />
              </div>
              <h3 className="font-display text-lg font-semibold mb-2">Community Driven</h3>
              <p className="text-muted-foreground text-sm">
                Access exclusive toolkits, share results, and learn from a vibrant global community.
              </p>
            </Card>
          </div>
        </div>
      </div>

      {/* SDG Color Strip at bottom of hero */}
      <div className="absolute bottom-0 inset-x-0 flex h-1" aria-label="UN Sustainable Development Goals colors">
        {Array.from({ length: 17 }, (_, i) => (
          <div key={i} className={`flex-1 bg-sdg-${i + 1}`} />
        ))}
      </div>
    </section>
  )
}
