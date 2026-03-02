import { Link } from 'react-router-dom'
import { ArrowRight, Droplets, Building2, Leaf, Users, Heart, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ThemePage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative py-24 bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <div className="container mx-auto px-4 text-center">
          <p className="text-xs uppercase tracking-[0.2em] font-semibold text-primary/60 mb-4">2026 Global Theme</p>
          <h1 className="font-display text-5xl sm:text-6xl font-bold text-foreground mb-6">
            Resilient <span className="italic text-primary">by Design</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Local solutions for a world under pressure. From water stress to extreme heat, from food insecurity to displacement — every community faces unique climate realities. This year, we design resilience from the ground up.
          </p>
        </div>
      </section>

      {/* Why Resilience */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-display text-3xl font-bold mb-8 text-center">Why Resilience?</h2>
            <div className="max-w-3xl mx-auto text-muted-foreground space-y-4 text-lg leading-relaxed">
              <p>
                Climate disruption is no longer a distant threat — it is a lived reality. Communities worldwide are experiencing more frequent and severe weather events, resource scarcity, and displacement. The question is no longer <em>if</em> we will be affected, but <em>how we respond</em>.
              </p>
              <p>
                <strong className="text-foreground">Resilient by Design</strong> challenges Global Goals Jam participants to create solutions that help communities adapt, recover, and thrive in the face of disruption. We believe the best solutions come from the people who live with these challenges every day.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Focus Areas */}
      <section className="py-20 bg-section-alt">
        <div className="container mx-auto px-4">
          <h2 className="font-display text-3xl font-bold mb-4 text-center">Focus Areas</h2>
          <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            Design challenges that build resilience across six interconnected areas
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { icon: Droplets, title: 'Water Resilience', desc: 'Clean water access, flood management, and drought adaptation for vulnerable communities.', color: 'text-blue-500' },
              { icon: Building2, title: 'Urban Adaptation', desc: 'Designing cities and spaces that withstand heat, storms, and changing conditions.', color: 'text-slate-600' },
              { icon: Leaf, title: 'Food & Energy Security', desc: 'Local food systems and renewable energy that sustain communities through disruption.', color: 'text-green-600' },
              { icon: Users, title: 'Community Networks', desc: 'Social infrastructure that connects neighbors and enables rapid mutual aid.', color: 'text-purple-600' },
              { icon: Heart, title: 'Health & Wellbeing', desc: 'Mental health support and healthcare systems that function during crises.', color: 'text-red-500' },
              { icon: Globe, title: 'Inclusive Recovery', desc: 'Centering the most vulnerable in every solution — leaving no one behind.', color: 'text-amber-600' },
            ].map((area) => (
              <div key={area.title} className="bg-card rounded-xl p-6 shadow-sm border">
                <area.icon className={`w-8 h-8 ${area.color} mb-4`} />
                <h3 className="font-display text-lg font-semibold mb-2">{area.title}</h3>
                <p className="text-sm text-muted-foreground">{area.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Related SDGs */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-3xl font-bold mb-4">Connected Global Goals</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            This year's theme connects directly to these UN Sustainable Development Goals
          </p>
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {[
              { num: 6, label: 'Clean Water', color: 'bg-sdg-6' },
              { num: 10, label: 'Reduced Inequalities', color: 'bg-sdg-10' },
              { num: 11, label: 'Sustainable Cities', color: 'bg-sdg-11' },
              { num: 13, label: 'Climate Action', color: 'bg-sdg-13' },
            ].map((sdg) => (
              <div key={sdg.num} className={`${sdg.color} text-white rounded-xl px-6 py-4 text-center min-w-[140px]`}>
                <div className="text-2xl font-bold">SDG {sdg.num}</div>
                <div className="text-sm opacity-90">{sdg.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-section-alt">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-3xl font-bold mb-4">Ready to Design Resilience?</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Join a Global Goals Jam near you or become a certified host to run your own.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild size="lg" className="rounded-full">
              <Link to="/events">Find a Jam <ArrowRight className="w-4 h-4 ml-2" /></Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full">
              <Link to="/course/enroll">Become a Host</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
