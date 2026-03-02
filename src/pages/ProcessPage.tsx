import { Badge } from '../components/ui/badge'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Search,
  Lightbulb,
  Hammer,
  Share2,
  FileText,
  MapPin,
  Clock,
  Users,
  Target,
  Coffee,
  Presentation,
  Sparkles,
  MessageSquare,
  Globe
} from 'lucide-react'
import { cn } from '../lib/utils'

const sprints = [
  {
    number: 0,
    title: 'Localise it!',
    icon: MapPin,
    color: 'bg-pastel-green',
    iconColor: 'text-primary dark:text-green-300',
    borderColor: 'border-primary/20',
    time: 'Pre-jam',
    day: 'prep',
    description: 'Translate a global theme into a local challenge that is relevant to your community.',
    activities: [
      'Pick a Sustainable Development Goal relevant to your context',
      'Identify a local challenge connected to the global theme',
      'Frame a "How might we..." question for your teams',
      'Connect with local partners and stakeholders'
    ],
    deliverable: 'A clearly framed local challenge statement'
  },
  {
    number: 1,
    title: 'Explore it!',
    icon: Search,
    color: 'bg-pastel-amber',
    iconColor: 'text-amber-600 dark:text-amber-300',
    borderColor: 'border-amber-500/20',
    time: '3–4 hours',
    day: 1,
    description: 'Dive deep into the context of your challenge through a datajam — collect and analyse data.',
    activities: [
      'Research your challenge: facts, maps, stories, quotes, stakeholders',
      'Conduct interviews, photo safaris, or desk research',
      'Create empathy maps and identify key insights',
      'Share findings within your team'
    ],
    deliverable: 'Main insights about your challenge',
    methods: ['Interviewing', 'Photo Safari', 'Empathy Map', 'Desk Research', 'WWWWH']
  },
  {
    number: 2,
    title: 'Respond to it!',
    icon: Lightbulb,
    color: 'bg-pastel-rose',
    iconColor: 'text-rose-600 dark:text-rose-300',
    borderColor: 'border-rose-500/20',
    time: '3–4 hours',
    day: 1,
    description: 'Create a lo-fi prototype of a conversational object — a tool, game, installation, or experience.',
    activities: [
      'Brainstorm responses to your insights',
      'Sketch concepts and create rapid prototypes',
      'Build a lo-fi prototype or data visualisation',
      'Share with another team and collect feedback'
    ],
    deliverable: 'Lo-fi prototype shared with another team + collected feedback',
    methods: ['Concept Sketch', 'Infographic', 'Prototype for Empathy']
  },
  {
    number: 3,
    title: 'Make it!',
    icon: Hammer,
    color: 'bg-pastel-violet',
    iconColor: 'text-violet-600 dark:text-violet-300',
    borderColor: 'border-violet-500/20',
    time: '3–4 hours',
    day: 2,
    description: 'Make your final idea tangible — create a high-quality provocative prototype.',
    activities: [
      'Refine your concept based on feedback',
      'Build a high-quality conversational object or prototype',
      'Plan how to share and test it with others',
      'Speed-date with other teams for rapid feedback'
    ],
    deliverable: 'Final provocative prototype + sharing plan'
  },
  {
    number: 4,
    title: 'Share it!',
    icon: Share2,
    color: 'bg-pastel-sky',
    iconColor: 'text-sky-600 dark:text-sky-300',
    borderColor: 'border-sky-500/20',
    time: '3–4 hours',
    day: 2,
    description: 'Present your object, test it with others, and collect feedback on both your work and the initial challenge.',
    activities: [
      'Present your final object to all teams',
      'Test or demonstrate your prototype with participants',
      'Collect feedback on your prototype and challenge insights',
      'Document your process and results'
    ],
    deliverable: 'Final presentation + documentation (slides, photos, video, or write-up)',
    methods: ['Through Other Eyes', 'Video Prototype']
  },
  {
    number: 5,
    title: 'Document it!',
    icon: FileText,
    color: 'bg-pastel-mint',
    iconColor: 'text-emerald-600 dark:text-emerald-300',
    borderColor: 'border-emerald-500/20',
    time: 'Post-jam',
    day: 'post',
    description: 'Share your process and results openly so the global community can build upon your work.',
    activities: [
      'Upload your process documentation',
      'Share insights and outcomes on the platform',
      'Connect with teams who worked on similar challenges',
      'Plan follow-up actions and next steps'
    ],
    deliverable: 'Published process documentation accessible to the global community'
  }
]

const daySchedule = [
  {
    day: 1,
    title: 'Day 1 — Understand & Respond',
    subtitle: 'From global challenge to local insight to first prototype',
    color: 'bg-pastel-green',
    textColor: 'text-primary dark:text-green-300',
    items: [
      { time: '09:00', label: 'Welcome & Introduction', icon: Globe, type: 'session' },
      { time: '09:30', label: 'Sprint 0: Localise it — frame your local challenge', icon: MapPin, type: 'sprint' },
      { time: '10:00', label: 'Sprint 1: Explore it — datajam & research', icon: Search, type: 'sprint' },
      { time: '12:30', label: 'Lunch break', icon: Coffee, type: 'break' },
      { time: '13:30', label: 'Sprint 2: Respond to it — lo-fi prototyping', icon: Lightbulb, type: 'sprint' },
      { time: '16:30', label: 'Team share-out & feedback', icon: MessageSquare, type: 'session' },
      { time: '17:00', label: 'End of Day 1', icon: Sparkles, type: 'end' }
    ]
  },
  {
    day: 2,
    title: 'Day 2 — Make & Share',
    subtitle: 'From prototype to provocative object to global documentation',
    color: 'bg-pastel-violet',
    textColor: 'text-violet-600 dark:text-violet-300',
    items: [
      { time: '09:00', label: 'Day 2 kick-off & energizer', icon: Sparkles, type: 'session' },
      { time: '09:30', label: 'Sprint 3: Make it — build final prototype', icon: Hammer, type: 'sprint' },
      { time: '12:30', label: 'Lunch break', icon: Coffee, type: 'break' },
      { time: '13:30', label: 'Sprint 4: Share it — present & test', icon: Share2, type: 'sprint' },
      { time: '16:00', label: 'Final presentations', icon: Presentation, type: 'session' },
      { time: '17:00', label: 'Closing & next steps', icon: Target, type: 'end' }
    ]
  }
]

export default function ProcessPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 hero-pattern">
        <div className="absolute inset-0 bg-gradient-to-br from-background/80 to-background/60" aria-hidden="true" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs uppercase tracking-[0.2em] font-semibold text-primary/60 mb-3">The Jam Process</p>
          <Badge variant="green" className="mb-6 px-4 py-2 text-sm font-medium rounded-pill">
            <Clock className="w-4 h-4 mr-2" />
            2 Days of Design for Impact
          </Badge>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground mb-6 tracking-tight">
            The <span className="text-primary-solid">Jam Process</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            In just 2 days, multidisciplinary teams use the Empathy in Action method to transform global challenges into local, tangible solutions — falling in love with the problem, not the solution.
          </p>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="py-16 bg-section-alt">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-xs uppercase tracking-[0.2em] font-semibold text-primary/60 mb-2">Core Philosophy</p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Empathy in <span className="text-primary-solid">Action</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <Card variant="feature" className="p-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-pastel-amber flex items-center justify-center mb-4 mx-auto">
                <Target className="w-7 h-7 text-amber-600 dark:text-amber-300" />
              </div>
              <h3 className="font-display text-lg font-semibold mb-2">Fall in Love with the Problem</h3>
              <p className="text-muted-foreground text-sm">
                The most important thing is to deeply understand the challenge, not jump to solutions. Spend time exploring before creating.
              </p>
            </Card>
            <Card variant="feature" className="p-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-pastel-rose flex items-center justify-center mb-4 mx-auto">
                <Hammer className="w-7 h-7 text-rose-600 dark:text-rose-300" />
              </div>
              <h3 className="font-display text-lg font-semibold mb-2">Critical Making</h3>
              <p className="text-muted-foreground text-sm">
                Create something tangible that others can interact with and learn from — generating new insights and perspectives about the challenge.
              </p>
            </Card>
            <Card variant="feature" className="p-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-pastel-violet flex items-center justify-center mb-4 mx-auto">
                <Globe className="w-7 h-7 text-violet-600 dark:text-violet-300" />
              </div>
              <h3 className="font-display text-lg font-semibold mb-2">Open Design</h3>
              <p className="text-muted-foreground text-sm">
                Document and share your process so the global community can build upon your work — avoiding design waste.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Sprint Process — Visual Flow */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-xs uppercase tracking-[0.2em] font-semibold text-primary/60 mb-2">Design Sprints</p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              6 Sprints, 2 Days, <span className="text-primary-solid">Infinite Impact</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              The jam follows the Empathy in Action method, divided into 6 sprints across 2 intensive days. Each sprint builds on the previous one to move from understanding to action.
            </p>
          </div>

          {/* Sprint Cards */}
          <div className="space-y-6">
            {sprints.map((sprint, index) => (
              <Card
                key={sprint.number}
                variant="elevated"
                className={cn(
                  'overflow-hidden transition-all',
                  sprint.day === 'prep' || sprint.day === 'post' ? 'opacity-90 border-dashed' : ''
                )}
              >
                <CardContent className="p-0">
                  <div className="flex flex-col lg:flex-row">
                    {/* Sprint Number & Icon */}
                    <div className={cn('flex items-center justify-center p-6 lg:p-8 lg:w-48 shrink-0', sprint.color)}>
                      <div className="text-center">
                        <sprint.icon className={cn('w-10 h-10 mx-auto mb-2', sprint.iconColor)} />
                        <div className={cn('font-display text-sm font-bold', sprint.iconColor)}>
                          Sprint {sprint.number}
                        </div>
                        <div className={cn('text-xs mt-1 opacity-70', sprint.iconColor)}>
                          {sprint.day === 'prep' ? 'Pre-jam' : sprint.day === 'post' ? 'Post-jam' : `Day ${sprint.day}`}
                        </div>
                      </div>
                    </div>

                    {/* Sprint Content */}
                    <div className="flex-1 p-6 lg:p-8">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
                        <h3 className="font-display text-xl font-bold">{sprint.title}</h3>
                        <Badge variant="secondary" className="self-start shrink-0">
                          <Clock className="w-3 h-3 mr-1" />
                          {sprint.time}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground mb-4">{sprint.description}</p>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-2">Activities</p>
                          <ul className="space-y-1.5">
                            {sprint.activities.map((activity, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm">
                                <span className="text-primary mt-0.5 shrink-0">—</span>
                                <span>{activity}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-2">Deliverable</p>
                          <p className="text-sm font-medium">{sprint.deliverable}</p>

                          {sprint.methods && (
                            <div className="mt-3">
                              <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-2">Suggested Methods</p>
                              <div className="flex flex-wrap gap-1.5">
                                {sprint.methods.map((method) => (
                                  <Badge key={method} variant="secondary" className="text-xs">
                                    {method}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Day-by-Day Schedule */}
      <section className="py-20 bg-section-alt">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-xs uppercase tracking-[0.2em] font-semibold text-primary/60 mb-2">Day-by-Day</p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              A Typical <span className="text-primary-solid">Jam Schedule</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Here's how a typical 2-day Global Goals Jam is structured. Hosts may adapt the schedule to fit their local context.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {daySchedule.map((day) => (
              <Card key={day.day} variant="elevated" className="overflow-hidden">
                <div className={cn('p-6', day.color)}>
                  <h3 className={cn('font-display text-xl font-bold', day.textColor)}>
                    {day.title}
                  </h3>
                  <p className={cn('text-sm mt-1 opacity-80', day.textColor)}>
                    {day.subtitle}
                  </p>
                </div>
                <CardContent className="p-0">
                  <div className="divide-y divide-border/50">
                    {day.items.map((item, i) => (
                      <div
                        key={i}
                        className={cn(
                          'flex items-center gap-4 px-6 py-3',
                          item.type === 'break' && 'bg-muted/30',
                          item.type === 'end' && 'bg-muted/20'
                        )}
                      >
                        <span className="text-sm font-mono text-muted-foreground w-12 shrink-0">
                          {item.time}
                        </span>
                        <item.icon className={cn(
                          'w-4 h-4 shrink-0',
                          item.type === 'sprint' ? 'text-primary' :
                          item.type === 'break' ? 'text-amber-500' :
                          'text-muted-foreground'
                        )} />
                        <span className={cn(
                          'text-sm',
                          item.type === 'sprint' && 'font-medium',
                          item.type === 'break' && 'text-muted-foreground italic',
                          item.type === 'end' && 'font-medium text-muted-foreground'
                        )}>
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Key Principles */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-xs uppercase tracking-[0.2em] font-semibold text-primary/60 mb-2">Design Principles</p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              What Makes a <span className="text-primary-solid">Jam Different</span>
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            <Card variant="feature" className="p-6">
              <h3 className="font-display text-lg font-semibold mb-2">Not a Hackathon</h3>
              <p className="text-muted-foreground text-sm">
                We don't build apps in a weekend. We create conversational objects and provocative prototypes that challenge how people think about complex issues.
              </p>
            </Card>
            <Card variant="feature" className="p-6">
              <h3 className="font-display text-lg font-semibold mb-2">Local → Global → Local</h3>
              <p className="text-muted-foreground text-sm">
                Start with a global goal, translate it to a local challenge, create local solutions, then share globally so others can build upon your work.
              </p>
            </Card>
            <Card variant="feature" className="p-6">
              <h3 className="font-display text-lg font-semibold mb-2">Divergent & Convergent</h3>
              <p className="text-muted-foreground text-sm">
                Following the Double Diamond approach — alternate between expanding possibilities and narrowing focus to find the most impactful solutions.
              </p>
            </Card>
            <Card variant="feature" className="p-6">
              <h3 className="font-display text-lg font-semibold mb-2">Multiple Discovery</h3>
              <p className="text-muted-foreground text-sm">
                No invention was ever done alone. By sharing openly, teams worldwide can build on each other's work and accelerate impact for the SDGs.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-pastel-green">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-primary/90 dark:text-green-200 mb-4">
            Ready to Host a Jam?
          </h2>
          <p className="text-primary/70 dark:text-green-300 mb-8 max-w-2xl mx-auto">
            Become a certified host through our Train-the-Trainer course and get access to the full Jamkit with all methods, templates, and facilitation guides.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="pill" size="xl" asChild className="group">
              <Link to="/course/train-the-trainer">
                Start your host journey
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button variant="pill-outline" size="lg" asChild>
              <Link to="/events">
                <Users className="w-5 h-5 mr-2" />
                View upcoming jams
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
