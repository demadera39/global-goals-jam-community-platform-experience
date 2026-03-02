import { Link } from 'react-router-dom'
import { ArrowRight, Lightbulb, Users, Target, Rocket, Clock, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ProcessPage() {
  const steps = [
    {
      icon: Target,
      title: 'Pick a Challenge',
      desc: 'Choose a local challenge connected to the Global Goals. What does your community need most?',
      color: 'bg-sdg-13',
    },
    {
      icon: Users,
      title: 'Form a Team',
      desc: 'Bring together diverse perspectives — designers, activists, students, engineers, community members.',
      color: 'bg-sdg-10',
    },
    {
      icon: Lightbulb,
      title: 'Research & Empathize',
      desc: 'Go out and talk to people affected by the challenge. Understand the real needs, not assumptions.',
      color: 'bg-sdg-6',
    },
    {
      icon: Rocket,
      title: 'Ideate & Prototype',
      desc: 'Generate bold ideas and build quick prototypes. Test them with real people. Iterate fast.',
      color: 'bg-sdg-11',
    },
    {
      icon: CheckCircle,
      title: 'Present & Share',
      desc: 'Pitch your solution. Share it with the global community. Inspire others to act.',
      color: 'bg-primary',
    },
  ]

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative py-24 bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <div className="container mx-auto px-4 text-center">
          <p className="text-xs uppercase tracking-[0.2em] font-semibold text-primary/60 mb-4">How It Works</p>
          <h1 className="font-display text-5xl sm:text-6xl font-bold text-foreground mb-6">
            The Jam Process
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            A 48-hour design sprint where local teams tackle global challenges. Here is how a Global Goals Jam works, from start to finish.
          </p>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            {steps.map((step, i) => (
              <div key={step.title} className="flex gap-6 mb-12 last:mb-0">
                {/* Step number + line */}
                <div className="flex flex-col items-center">
                  <div className={`${step.color} text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0`}>
                    {i + 1}
                  </div>
                  {i < steps.length - 1 && (
                    <div className="w-0.5 bg-border flex-1 mt-2" />
                  )}
                </div>
                {/* Content */}
                <div className="pb-8">
                  <div className="flex items-center gap-3 mb-2">
                    <step.icon className="w-5 h-5 text-muted-foreground" />
                    <h3 className="font-display text-xl font-semibold">{step.title}</h3>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Duration */}
      <section className="py-20 bg-section-alt">
        <div className="container mx-auto px-4 text-center">
          <Clock className="w-12 h-12 text-primary mx-auto mb-6" />
          <h2 className="font-display text-3xl font-bold mb-4">48 Hours. Real Impact.</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed mb-8">
            Every Global Goals Jam runs over a weekend — two intense days of collaboration, creativity, and community. You will walk away with a real prototype and a network of changemakers.
          </p>
          <div className="grid sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="bg-card rounded-xl p-6 border shadow-sm">
              <div className="text-3xl font-bold text-primary mb-1">Day 1</div>
              <p className="text-sm text-muted-foreground">Research, empathize, and start ideating</p>
            </div>
            <div className="bg-card rounded-xl p-6 border shadow-sm">
              <div className="text-3xl font-bold text-primary mb-1">Night</div>
              <p className="text-sm text-muted-foreground">Let ideas simmer (or keep hacking!)</p>
            </div>
            <div className="bg-card rounded-xl p-6 border shadow-sm">
              <div className="text-3xl font-bold text-primary mb-1">Day 2</div>
              <p className="text-sm text-muted-foreground">Prototype, test, and present</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-3xl font-bold mb-4">Ready to Jam?</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Find a Jam happening near you, or learn how to host your own.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild size="lg" className="rounded-full">
              <Link to="/events">Find a Jam <ArrowRight className="w-4 h-4 ml-2" /></Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full">
              <Link to="/course/enroll">Host a Jam</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
