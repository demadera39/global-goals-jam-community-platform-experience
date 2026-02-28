import { Card, CardContent } from './ui/card'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Badge } from './ui/badge'
import { Quote } from 'lucide-react'
import { Carousel } from './ui/carousel'

interface Testimonial {
  id: string
  quote: string
  author: string
  role?: string
  organization?: string
  avatar?: string
  sdg?: string
  location?: string
  imageUrl?: string
}

interface TestimonialsSectionProps {
  pdfUrl?: string
  count?: number
  startIndex?: number
  showHeader?: boolean
  variant?: 'home' | 'about'
}

const HOME_TESTIMONIALS: Testimonial[] = [
  {
    id: 'home-1',
    quote:
      "Fukuoka Jam is grounded in inclusive, universal design — intentionally involving the elderly, people with disabilities, immigrants and exchange students.",
    author: 'Shinichiro Ito',
    organization: 'Fukuoka, Japan',
    sdg: 'Impact',
    location: 'Fukuoka, Japan'
  },
  {
    id: 'home-2',
    quote:
      "Across four jams 200 participants contributed 50+ ideas; the Jamkit method cards helped spark idea generation.",
    author: 'Sanmitra Chitte',
    organization: 'World University of Design, India',
    sdg: 'Impact',
    location: 'India'
  },
  {
    id: 'home-3',
    quote:
      "We aim to leave people with a changed mindset and perspective they can use in professional and daily life.",
    author: 'Nadim Choucair',
    organization: 'Berlin',
    sdg: 'Impact',
    location: 'Berlin, Germany'
  }
]

export default function TestimonialsSection({
  pdfUrl,
  count = 3,
  startIndex = 0,
  showHeader = true,
  variant = 'home'
}: TestimonialsSectionProps) {
  const pool = variant === 'about' ? HOME_TESTIMONIALS : HOME_TESTIMONIALS
  const displayed = (pool || []).slice(startIndex, startIndex + count)

  return (
    <section className="py-16 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {showHeader && (
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight mb-4">What hosts and partners say</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
              Voices from our global community of changemakers, innovators, and impact leaders
            </p>
            {pdfUrl && (
              <a
                href={pdfUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center text-primary hover:text-primary/80 font-medium transition-colors"
              >
                Read the full impact report →
              </a>
            )}
          </div>
        )}

        {/* Desktop grid */}
        <div className="hidden lg:grid gap-8 lg:grid-cols-3">
          {displayed.map((t, i) => (
            <TestimonialCard key={t.id} testimonial={t} index={i} />
          ))}
        </div>

        {/* Mobile carousel */}
        <div className="lg:hidden">
          <Carousel>
            {displayed.map((t) => (
              <div key={t.id} className="px-2">
                <TestimonialCard testimonial={t} index={0} compact />
              </div>
            ))}
          </Carousel>
        </div>

        {count < pool.length && showHeader && (
          <div className="text-center mt-12">
            <p className="text-sm text-muted-foreground">
              Showing {count} of {pool.length} testimonials
            </p>
          </div>
        )}
      </div>
    </section>
  )
}

function TestimonialCard({
  testimonial,
  index,
  compact
}: {
  testimonial: Testimonial
  index: number
  compact?: boolean
}) {
  const initials = (testimonial?.author || '').split(' ').map((n) => n[0] || '').join('')

  return (
    <Card
      className={`relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-card/95 backdrop-blur-sm ${
        compact ? 'p-3' : ''
      }`}
      style={{ animationDelay: `${index * 150}ms` }}
      aria-label={`Testimonial by ${testimonial.author}`}
    >
      <div className="absolute top-4 right-4 pointer-events-none">
        <Quote className="h-8 w-8 text-primary/20" />
      </div>

      <CardContent className={`p-6 ${compact ? 'p-4' : ''}`}>
        <div className="flex items-start gap-4 mb-4">
          <Avatar className="h-12 w-12 border-2 border-primary/20">
            {testimonial.avatar ? (
              <AvatarImage src={testimonial.avatar} alt={testimonial.author} />
            ) : (
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">{initials}</AvatarFallback>
            )}
          </Avatar>

          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-foreground truncate">{testimonial.author}</h4>
            {testimonial.role && <p className="text-sm text-muted-foreground">{testimonial.role}</p>}
            {testimonial.organization && <p className="text-xs text-muted-foreground font-medium">{testimonial.organization}</p>}
          </div>
        </div>

        <blockquote className="text-foreground/90 leading-relaxed mb-4 italic">"{testimonial.quote}"</blockquote>

        <div className="flex items-center justify-between pt-4 border-t border-border/50 mt-4">
          <Badge variant="secondary" className="text-xs font-medium">
            {testimonial.sdg || 'Community'}
          </Badge>
          <span className="text-xs text-muted-foreground">{testimonial.location}</span>
        </div>
      </CardContent>
    </Card>
  )
}
