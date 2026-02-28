import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { ArrowRight, Globe, Users, Target } from 'lucide-react'
import { Link } from 'react-router-dom'
import DonateButton from './DonateButton'

export default function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center hero-pattern overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-background/80 to-background/60" />

      {/* Hero kept clean per original style */}
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-4xl mx-auto">
          {/* Emblem above logo + full GGJ logo centered to match design */}
          <div className="mb-4 flex flex-col items-center justify-center">
            <img 
              src="/GGJ_logo_socials.png" 
              alt="GGJ emblem" 
              className="w-36 h-36 sm:w-44 sm:h-44 object-contain mb-2" 
              onError={(e) => {
                // Hide if image fails to load - fallback to text only
                (e.currentTarget as HTMLImageElement).style.display = 'none'
              }}
            />
            <img
              src="/ggj-logo.svg"
              alt="Global Goals Jam"
              className="w-60 sm:w-72 h-24 object-contain drop-shadow"
              onError={(e) => {
                // If SVG fails, simply hide the image to avoid duplicating header text
                (e.currentTarget as HTMLImageElement).style.display = 'none'
              }}
            />
          </div>

          {/* Badge (theme label) kept below logo */}
          <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm font-medium">
            <Globe className="w-4 h-4 mr-2" />
            This Year's Theme
          </Badge>

          {/* Main Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
            Co-Intelligence for
            <br className="hidden sm:block" />
            <span className="text-primary-solid">a Shared Planet</span>
          </h1>

          {/* Subheading */}
          <p className="text-xl sm:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
            This year’s theme is all about new opportunities for co-intelligence. Join a global movement of designers, thinkers, and changemakers using AI and collective creativity to tackle the world’s biggest challenges. Let’s co-create futures that are inclusive, regenerative, and just.
          </p>

          {/* Stats - Historical Averages */}
          <div className="flex flex-wrap justify-center gap-8 mb-12">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">~55</div>
              <div className="text-sm text-muted-foreground">Events per year</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">~2,750</div>
              <div className="text-sm text-muted-foreground">Changemakers yearly</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">2</div>
              <div className="text-sm text-muted-foreground">Days to impact</div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button asChild size="lg" className="bg-primary-solid text-white px-8 py-4 text-lg font-semibold group hover:bg-primary/90">
              <Link to="/course/train-the-trainer">
                Become a certified jam host
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            {/* Replaced Read FAQ with Donate action in hero */}
            <div>
              <DonateButton size="lg" variant="outline" className="px-8 py-4 text-lg font-semibold border-2" />
            </div>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-card/50 backdrop-blur-sm rounded-lg p-6 border border-border/50">
              <div className="w-12 h-12 rounded-lg bg-primary-solid flex items-center justify-center mb-4 mx-auto">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Global Network</h3>
              <p className="text-muted-foreground text-sm">
                Connect with hosts and participants from around the world working on similar challenges.
              </p>
            </div>
            
            <div className="bg-card/50 backdrop-blur-sm rounded-lg p-6 border border-border/50">
              <div className="w-12 h-12 rounded-lg bg-accent-solid flex items-center justify-center mb-4 mx-auto">
                <Target className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">SDG Focus</h3>
              <p className="text-muted-foreground text-sm">
                Every jam targets specific UN Sustainable Development Goals with actionable outcomes.
              </p>
            </div>
            
            <div className="bg-card/50 backdrop-blur-sm rounded-lg p-6 border border-border/50">
              <div className="w-12 h-12 rounded-lg bg-primary-solid flex items-center justify-center mb-4 mx-auto">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Community Driven</h3>
              <p className="text-muted-foreground text-sm">
                Access exclusive toolkits, share results, and learn from a vibrant global community.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
