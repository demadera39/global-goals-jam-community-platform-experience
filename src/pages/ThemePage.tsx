import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { ArrowRight, Globe, Lightbulb, Users, Droplets, Leaf, Heart, Building2, Scale, GraduationCap } from 'lucide-react'

const JAM_IDEAS = [
  {
    title: 'Water-Resilient Neighbourhoods',
    sdgs: [6, 11, 13],
    description: 'Design community-level solutions for water scarcity, flooding, or contamination. Prototype rainwater harvesting systems, water-sharing networks, or early-warning tools for water-related disasters in your area.',
    icon: Droplets,
    color: 'bg-sdg-6',
  },
  {
    title: 'Climate-Proof Food Systems',
    sdgs: [2, 12, 13],
    description: 'Reimagine how your city or region produces, distributes, and consumes food under changing climate conditions. Create solutions for urban farming, food waste reduction, or supply chain resilience.',
    icon: Leaf,
    color: 'bg-sdg-2',
  },
  {
    title: 'Mental Health in a Changing World',
    sdgs: [3, 11, 13],
    description: 'Address the growing mental health impacts of climate anxiety, displacement, and uncertainty. Design peer support systems, community spaces, or digital tools that build psychological resilience.',
    icon: Heart,
    color: 'bg-sdg-3',
  },
  {
    title: 'Just Energy Transitions',
    sdgs: [7, 10, 13],
    description: 'Ensure the shift to renewable energy leaves no one behind. Prototype solutions for energy poverty, community-owned renewables, or fair transition plans for fossil-fuel-dependent communities.',
    icon: Lightbulb,
    color: 'bg-sdg-7',
  },
  {
    title: 'Inclusive Disaster Preparedness',
    sdgs: [1, 10, 11],
    description: 'Design early-warning systems and response plans that centre the most vulnerable: elderly residents, people with disabilities, informal workers, and migrant communities.',
    icon: Users,
    color: 'bg-sdg-10',
  },
  {
    title: 'Regenerative Urban Spaces',
    sdgs: [11, 13, 15],
    description: 'Transform unused or degraded urban spaces into green, climate-adaptive community assets. Prototype pocket parks, urban forests, cooling corridors, or biodiversity hubs for your neighbourhood.',
    icon: Building2,
    color: 'bg-sdg-11',
  },
  {
    title: 'Climate Justice & Local Governance',
    sdgs: [13, 16, 17],
    description: 'Create tools that give communities a stronger voice in local climate policy. Design citizen assemblies, participatory budgeting platforms, or accountability dashboards for climate commitments.',
    icon: Scale,
    color: 'bg-sdg-16',
  },
  {
    title: 'Skills for a Resilient Future',
    sdgs: [4, 8, 13],
    description: 'Design learning pathways and reskilling programmes that prepare young people and workers for green jobs and climate adaptation. Prototype community learning hubs or peer-mentoring networks.',
    icon: GraduationCap,
    color: 'bg-sdg-4',
  },
]

export default function ThemePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative py-20 sm:py-28 bg-gradient-to-b from-pastel-green/30 via-background to-background overflow-hidden">
        <div className="absolute inset-0 opacity-[0.035]" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, hsl(var(--sdg-13)) 0%, transparent 50%), radial-gradient(circle at 80% 30%, hsl(var(--sdg-6)) 0%, transparent 50%)' }} />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <Badge variant="amber" className="mb-4">2026 Theme</Badge>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6">
            Resilient by Design
          </h1>
          <p className="text-xl sm:text-2xl text-muted-foreground leading-relaxed max-w-3xl mx-auto mb-8">
            Local solutions for a world under pressure. From water stress to extreme heat, from food insecurity to displacement — every community faces unique climate realities. This year, we design resilience from the ground up.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button asChild variant="pill" size="xl">
              <Link to="/events">
                Find a Jam near you <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button asChild variant="pill-outline" size="xl">
              <Link to="/course/enroll">
                Become a Host <GraduationCap className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Why This Theme */}
      <section className="py-20 bg-section-warm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold tracking-widest uppercase text-primary/60 mb-3">Why this theme</p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight mb-6">
            2026 is the year resilience becomes personal
          </h2>
          <div className="space-y-5 text-foreground/80 leading-relaxed">
            <p>
              The evidence is undeniable. Record-breaking heatwaves, unprecedented flooding, prolonged droughts, and rapid urbanisation are no longer distant projections — they are lived realities for billions of people. The 2025 UN SDG Progress Report confirmed that not a single Sustainable Development Goal is on track, with climate action (SDG 13) facing the steepest decline.
            </p>
            <p>
              But here is what the data also tells us: <strong>the most effective responses are local.</strong> Community-led adaptation is faster, cheaper, and more inclusive than top-down policy alone. From rooftop gardens in Nairobi to flood-resilient housing in Bangladesh, from cooling networks in Barcelona to water cooperatives in rural India — ordinary people are already designing extraordinary solutions.
            </p>
            <p>
              <strong>"Resilient by Design"</strong> is an invitation to every Global Goals Jam community worldwide to focus on their own backyard. What does resilience look like in your city, your neighbourhood, your school? Which climate pressures are most urgent where you live, and who is most affected? What can you prototype in 48 hours that strengthens your community's ability to adapt, recover, and thrive?
            </p>
            <p>
              This theme is intentionally broad enough to be locally specific. A jam in Lagos might tackle urban heat islands. A jam in Amsterdam might address rising sea levels. A jam in Bogota might reimagine food distribution during extreme weather. The thread that connects them all: <strong>designing systems, services, and spaces that help communities withstand disruption and emerge stronger.</strong>
            </p>
          </div>
        </div>
      </section>

      {/* Focus SDGs */}
      <section className="py-20 bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold tracking-widest uppercase text-primary/60 mb-3">Core focus</p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight mb-3">
              SDGs at the heart of this theme
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              While every SDG is connected to resilience, these goals form the primary lens for 2026 jams. Organisers are encouraged to combine them with locally relevant goals.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { n: 13, name: 'Climate Action', desc: 'The central thread. Every jam should connect to climate adaptation, mitigation, or both.' },
              { n: 11, name: 'Sustainable Cities', desc: 'Most climate impacts are felt in urban areas. Design for heat, flooding, air quality, and green space.' },
              { n: 6, name: 'Clean Water', desc: 'Water scarcity and flooding are two sides of the same coin. Prototype solutions for both.' },
              { n: 2, name: 'Zero Hunger', desc: 'Climate disrupts food systems. Design resilient agriculture, distribution, and waste reduction.' },
              { n: 3, name: 'Good Health', desc: 'Heat stress, air pollution, and climate anxiety affect billions. Design for physical and mental wellbeing.' },
              { n: 10, name: 'Reduced Inequalities', desc: 'Climate impacts are not equal. Centre the most vulnerable in every solution you design.' },
            ].map(({ n, name, desc }) => (
              <Card key={n} variant="elevated" className="overflow-hidden border-0">
                <div className={`h-2 bg-sdg-${n}`} />
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-sdg-${n} font-display font-extrabold text-lg`}>{n}</span>
                    <span className="font-semibold text-sm">{name}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-8 p-5 rounded-2xl bg-pastel-green text-sm text-foreground/80">
            <strong className="text-foreground">Secondary SDGs to weave in:</strong> SDG 1 (No Poverty), SDG 4 (Quality Education), SDG 7 (Clean Energy), SDG 8 (Decent Work), SDG 9 (Innovation), SDG 12 (Responsible Consumption), SDG 15 (Life on Land), SDG 16 (Peace & Justice), SDG 17 (Partnerships). Your local context determines which combination matters most.
          </div>
        </div>
      </section>

      {/* Jam Ideas */}
      <section className="py-20 bg-section-alt">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold tracking-widest uppercase text-primary/60 mb-3">Inspiration for organisers</p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight mb-3">
              8 Jam Ideas to Get You Started
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              These are starting points, not prescriptions. Adapt them to your local reality, combine them, or invent entirely new angles. The best jams start with a real challenge your community faces.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            {JAM_IDEAS.map((idea, i) => {
              const Icon = idea.icon
              return (
                <Card key={i} variant="elevated" className="overflow-hidden border-0 hover:-translate-y-0.5 transition-all duration-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      <div className={`w-11 h-11 rounded-xl ${idea.color} flex items-center justify-center flex-shrink-0`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-base font-display font-bold">{idea.title}</CardTitle>
                        <div className="flex gap-1.5 mt-1">
                          {idea.sdgs.map(sdg => (
                            <Badge key={sdg} variant="outline" className="text-[10px] px-1.5 py-0">SDG {sdg}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground leading-relaxed">{idea.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* How to Use This Theme */}
      <section className="py-20 bg-section-warm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold tracking-widest uppercase text-primary/60 mb-3">For organisers</p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight mb-3">
              How to Use This Theme in Your Jam
            </h2>
          </div>

          <div className="space-y-6">
            {[
              {
                step: '1',
                title: 'Start with your local reality',
                text: 'What climate-related challenges does your community face right now? Heatwaves? Flooding? Drought? Air pollution? Rising costs of food or energy? Talk to local government, NGOs, and residents to identify the most pressing issues.',
              },
              {
                step: '2',
                title: 'Identify who is most affected',
                text: 'Resilience is about equity. Which groups in your community are most vulnerable to these pressures? Elderly people, children, low-income households, informal workers, people with disabilities, migrant communities? Centre their needs in your challenge brief.',
              },
              {
                step: '3',
                title: 'Pick your SDG combination',
                text: 'Choose 2-3 SDGs that best frame your local challenge. SDG 13 (Climate Action) should be one of them. Then add the SDGs most relevant to your context — for example, SDG 6 + SDG 11 for urban water resilience, or SDG 2 + SDG 12 for food system adaptation.',
              },
              {
                step: '4',
                title: 'Frame a design challenge',
                text: '"How might we help [specific community] become more resilient to [specific climate pressure] by designing [specific type of solution]?" Make it concrete, local, and actionable. Avoid challenges that are too broad to prototype in 48 hours.',
              },
              {
                step: '5',
                title: 'Prototype for the real world',
                text: 'The best jam outcomes are solutions that can actually be tested in your community after the event. Think services, apps, community agreements, physical interventions, policy proposals, or communication campaigns. Document everything so others can learn from your work.',
              },
            ].map(({ step, title, text }) => (
              <div key={step} className="flex gap-4">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="font-display font-bold text-primary text-sm">{step}</span>
                </div>
                <div>
                  <h3 className="font-display font-semibold mb-1">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Global Context */}
      <section className="py-20 bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold tracking-widest uppercase text-primary/60 mb-3">The bigger picture</p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight mb-3">
              Why Resilience, Why Now
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <Card variant="stat" className="border" style={{ backgroundColor: 'hsl(351 77% 52% / 0.08)' }}>
              <CardContent className="pt-5 pb-5">
                <div className="font-display text-3xl font-extrabold text-sdg-1 mb-1">3.6B</div>
                <p className="text-sm text-muted-foreground">people live in areas highly vulnerable to climate change</p>
              </CardContent>
            </Card>
            <Card variant="stat" className="border" style={{ backgroundColor: 'hsl(32 98% 57% / 0.08)' }}>
              <CardContent className="pt-5 pb-5">
                <div className="font-display text-3xl font-extrabold text-sdg-11 mb-1">2x</div>
                <p className="text-sm text-muted-foreground">increase in climate-related disasters since 2000</p>
              </CardContent>
            </Card>
            <Card variant="stat" className="border" style={{ backgroundColor: 'hsl(199 93% 45% / 0.08)' }}>
              <CardContent className="pt-5 pb-5">
                <div className="font-display text-3xl font-extrabold text-sdg-6 mb-1">2B+</div>
                <p className="text-sm text-muted-foreground">people face water stress, projected to worsen by 2030</p>
              </CardContent>
            </Card>
            <Card variant="stat" className="border" style={{ backgroundColor: 'hsl(142 76% 36% / 0.08)' }}>
              <CardContent className="pt-5 pb-5">
                <div className="font-display text-3xl font-extrabold text-primary mb-1">$1 : $7</div>
                <p className="text-sm text-muted-foreground">every dollar invested in adaptation saves seven in avoided damages</p>
              </CardContent>
            </Card>
          </div>

          <p className="text-sm text-muted-foreground text-center mt-6">
            Sources: IPCC AR6, UN SDG Report 2025, Global Commission on Adaptation
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-section-alt">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Globe className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight mb-4">
            Ready to design resilience for your community?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Join hundreds of teams worldwide. Whether you are an experienced organiser or hosting your first jam, we provide the tools, training, and community to make it happen.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button asChild variant="pill" size="xl">
              <Link to="/course/enroll">
                Start the Certification Course <GraduationCap className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button asChild variant="pill-outline" size="xl">
              <Link to="/toolkit">
                Explore the Jamkit <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
