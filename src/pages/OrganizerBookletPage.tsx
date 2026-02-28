import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Separator } from '../components/ui/separator'
import { Download, BookOpen, Globe2, Users, Sparkles, MessageSquare, Calendar, CheckSquare, ArrowLeft, Target, MapPin, Clock } from 'lucide-react'


export default function OrganizerBookletPage() {
  const contentRef = useRef<HTMLDivElement | null>(null)

  const Year = new Date().getFullYear()

  return (
    <div className="min-h-screen bg-background">
      {/* Cover */}
      <section className="relative overflow-hidden py-16 sm:py-24 bg-gradient-to-br from-primary via-primary-80 to-accent">
        <div className="absolute inset-0 opacity-10 hero-pattern" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge variant="secondary" className="mb-6 bg-white text-primary-solid">{Year} Edition</Badge>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight">
            Global Goals Jam
          </h1>
          <p className="mt-3 text-2xl font-medium text-white/90">Organiser Booklet</p>
          <p className="mt-6 max-w-3xl mx-auto text-white/90">
            A practical, print-ready guide for planning, facilitating, and amplifying your Global Goals Jam. 
            Designed for impact. Optimised for community.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Button onClick={() => navigate('/host-dashboard?tab=assets')} variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Assets
            </Button>
            <a href="#toc" className="text-white/90 underline decoration-2">Skip to contents</a>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 sm:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6" id="toc">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-primary" /> Table of contents
            </h2>
            <span className="text-sm text-muted-foreground">Print-friendly</span>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
            <a href="#ch1" className="p-3 rounded-md border hover:bg-secondary transition">01. Introduction & Mission</a>
            <a href="#ch2" className="p-3 rounded-md border hover:bg-secondary transition">02. Toolkit Generator (powered by Metodic)</a>
            <a href="#ch3" className="p-3 rounded-md border hover:bg-secondary transition">03. Planning Your Jam</a>
            <a href="#ch4" className="p-3 rounded-md border hover:bg-secondary transition">04. Process & Methodology</a>
            <a href="#ch5" className="p-3 rounded-md border hover:bg-secondary transition">05. Community & Partnerships</a>
            <a href="#ch6" className="p-3 rounded-md border hover:bg-secondary transition">06. Day-by-Day Timelines</a>
            <a href="#ch7" className="p-3 rounded-md border hover:bg-secondary transition">07. Checklists & Templates</a>
          </div>
        </div>
      </section>

      <Separator />

      <section className="py-12 sm:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8" ref={contentRef}>
          {/* Chapter 01 */}
          <div id="ch1" className="space-y-6">
            <div>
              <p className="uppercase tracking-widest text-sm text-primary">Chapter 01</p>
              <h3 className="text-3xl sm:text-4xl font-extrabold text-foreground">Introduction & Mission</h3>
              <p className="mt-3 text-muted-foreground max-w-3xl">
                Welcome to Global Goals Jam — a worldwide movement turning the UN Sustainable Development Goals into local action through collaborative design.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2"><Globe2 className="w-5 h-5 text-primary" /> Global impact, local action</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  Every local Jam contributes to a global understanding of challenges across cultures and contexts — creating empathy, momentum, and collaboration.
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5 text-primary" /> Diverse collaboration</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  Students, professionals, and community members learn together, prototype together, and share knowledge openly for sustained impact.
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { n: '150+', l: 'Cities' },
                { n: '10,000+', l: 'Participants' },
                { n: '17', l: 'SDGs' },
                { n: 'Year‑round', l: 'Schedule' },
              ].map((s, i) => (
                <div key={i} className="text-center rounded-lg border p-6 bg-card">
                  <div className="text-3xl font-extrabold text-primary-solid">{s.n}</div>
                  <div className="text-sm text-muted-foreground">{s.l}</div>
                </div>
              ))}
            </div>

            <div className="rounded-xl bg-secondary p-6 border">
              <div className="flex items-center gap-2 font-semibold">
                <Sparkles className="w-5 h-5 text-primary" /> New for {Year}
              </div>
              <p className="mt-2 text-muted-foreground">
                Organise your Jam anytime in the year to align with local calendars and campaigns.
              </p>
            </div>
          </div>

          <Separator className="my-12" />

          {/* Chapter 02 */}
          <div id="ch2" className="space-y-6">
            <div>
              <p className="uppercase tracking-widest text-sm text-primary">Chapter 02</p>
              <h3 className="text-3xl sm:text-4xl font-extrabold text-foreground">Toolkit Generator on globalgoalsjam.org</h3>
              <p className="mt-3 text-muted-foreground max-w-3xl">
                Plan your sessions with our built‑in Toolkit Generator on globalgoalsjam.org — powered behind the scenes by Metodic. You stay on our platform; no separate accounts needed.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>What it creates</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                    <li>Context‑aware facilitation guide</li>
                    <li>Method cards per sprint</li>
                    <li>Templates & worksheets</li>
                    <li>Time‑optimised schedules</li>
                    <li>Difficulty‑tuned instructions</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>How to use it</CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="list-decimal pl-5 text-muted-foreground space-y-1">
                    <li>Go to Toolkit → Generator (requires host access)</li>
                    <li>Enter challenge, SDG focus, duration, participants</li>
                    <li>Optionally add local context and resources</li>
                    <li>Generate, review, and export as HTML/PDF</li>
                  </ol>
                </CardContent>
              </Card>
            </div>

            <div className="rounded-xl p-6 bg-gradient-to-br from-primary to-accent text-white">
              <p className="font-semibold">Powered by Metodic</p>
              <p className="opacity-90">We proudly collaborate with Metodic to deliver the generator — but your full experience happens on globalgoalsjam.org.</p>
            </div>
          </div>

          <Separator className="my-12" />

          {/* Chapter 03 - NEW: Toolkit Examples */}
          <div id="ch3" className="space-y-6">
            <div>
              <p className="uppercase tracking-widest text-sm text-primary">Chapter 03</p>
              <h3 className="text-3xl sm:text-4xl font-extrabold text-foreground">Toolkit Examples & Scenarios</h3>
              <p className="mt-3 text-muted-foreground max-w-3xl">Real-world examples of how to use the Toolkit Generator for different jam contexts, challenges, and locations.</p>
            </div>

            {/* Example 1: Urban Sustainability */}
            <Card className="border-l-4 border-l-primary">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    Example 1: Urban Sustainability Jam - Amsterdam
                  </CardTitle>
                  <Badge>SDG 11</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="font-semibold text-sm mb-2">Challenge Context:</p>
                    <p className="text-sm text-muted-foreground">"How might we reduce food waste in urban neighborhoods while building community connections?"</p>
                  </div>
                  <div>
                    <p className="font-semibold text-sm mb-2">Toolkit Generator Input:</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Duration: 2 days</li>
                      <li>• Participants: 25 (mixed ages)</li>
                      <li>• Resources: Local food bank partner</li>
                    </ul>
                  </div>
                </div>
                <Separator />
                <div>
                  <p className="font-semibold text-sm mb-2">Generated Toolkit Highlights:</p>
                  <div className="grid sm:grid-cols-3 gap-3 mt-3">
                    <div className="p-3 bg-secondary rounded-lg">
                      <p className="font-medium text-sm">Day 1 Morning</p>
                      <p className="text-xs text-muted-foreground mt-1">Food waste mapping exercise using neighborhood walk</p>
                    </div>
                    <div className="p-3 bg-secondary rounded-lg">
                      <p className="font-medium text-sm">Day 1 Afternoon</p>
                      <p className="text-xs text-muted-foreground mt-1">Ideation: Community composting & sharing apps</p>
                    </div>
                    <div className="p-3 bg-secondary rounded-lg">
                      <p className="font-medium text-sm">Day 2</p>
                      <p className="text-xs text-muted-foreground mt-1">Prototype testing with local residents</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-primary/5 rounded-lg">
                  <p className="text-sm"><strong>Result:</strong> Teams created a neighborhood food-sharing app prototype and established 3 community composting points.</p>
                </div>
              </CardContent>
            </Card>

            {/* Example 2: Rural Education */}
            <Card className="border-l-4 border-l-accent">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-accent" />
                    Example 2: Quality Education Jam - Rural Kenya
                  </CardTitle>
                  <Badge variant="secondary">SDG 4</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="font-semibold text-sm mb-2">Challenge Context:</p>
                    <p className="text-sm text-muted-foreground">"How might we improve access to digital learning resources for students without reliable internet?"</p>
                  </div>
                  <div>
                    <p className="font-semibold text-sm mb-2">Toolkit Generator Input:</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Duration: 1 day intensive</li>
                      <li>• Participants: 15 teachers & tech volunteers</li>
                      <li>• Resources: Solar charging station, offline tablets</li>
                    </ul>
                  </div>
                </div>
                <Separator />
                <div>
                  <p className="font-semibold text-sm mb-2">Generated Toolkit Approach:</p>
                  <div className="space-y-2 mt-3">
                    <div className="flex gap-3">
                      <Clock className="w-4 h-4 text-primary mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">9:00 - Context Immersion</p>
                        <p className="text-xs text-muted-foreground">Teachers share daily challenges, students demonstrate current tools</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Clock className="w-4 h-4 text-primary mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">11:00 - Rapid Ideation</p>
                        <p className="text-xs text-muted-foreground">Focus on offline-first solutions, peer-to-peer sharing</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Clock className="w-4 h-4 text-primary mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">14:00 - Build & Test</p>
                        <p className="text-xs text-muted-foreground">Create offline content packages, test with students</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-accent/5 rounded-lg">
                  <p className="text-sm"><strong>Result:</strong> Developed an offline learning hub system now used in 12 schools, reaching 800+ students.</p>
                </div>
              </CardContent>
            </Card>

            {/* Example 3: Climate Action */}
            <Card className="border-l-4 border-l-green-500">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Globe2 className="w-5 h-5 text-green-500" />
                    Example 3: Climate Action Jam - Singapore
                  </CardTitle>
                  <Badge variant="outline">SDG 13</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="font-semibold text-sm mb-2">Challenge Context:</p>
                    <p className="text-sm text-muted-foreground">"How might we help small businesses reduce their carbon footprint affordably?"</p>
                  </div>
                  <div>
                    <p className="font-semibold text-sm mb-2">Toolkit Generator Input:</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Duration: 3-day sprint</li>
                      <li>• Participants: 30 (business owners, designers, engineers)</li>
                      <li>• Resources: Energy audit tools, government grants info</li>
                    </ul>
                  </div>
                </div>
                <Separator />
                <div>
                  <p className="font-semibold text-sm mb-2">Toolkit Methods Used:</p>
                  <div className="grid sm:grid-cols-2 gap-3 mt-3">
                    <div className="p-3 border rounded-lg">
                      <p className="font-medium text-sm">Carbon Footprint Mapping</p>
                      <p className="text-xs text-muted-foreground mt-1">Visual tool to identify biggest impact areas</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <p className="font-medium text-sm">Cost-Benefit Matrix</p>
                      <p className="text-xs text-muted-foreground mt-1">Prioritize solutions by impact vs. investment</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <p className="font-medium text-sm">Stakeholder Journey Maps</p>
                      <p className="text-xs text-muted-foreground mt-1">Understand decision-making processes</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <p className="font-medium text-sm">Rapid Prototyping</p>
                      <p className="text-xs text-muted-foreground mt-1">Test solutions with real businesses</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-green-500/5 rounded-lg">
                  <p className="text-sm"><strong>Result:</strong> Created a free carbon calculator tool and guidebook, adopted by 50+ SMEs in first month.</p>
                </div>
              </CardContent>
            </Card>

            {/* Tips for Using Toolkit Generator */}
            <Card className="bg-gradient-to-br from-primary/5 to-accent/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Pro Tips: Getting the Most from Your Toolkit
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div>
                      <p className="font-semibold text-sm mb-1">🎯 Be Specific with Challenges</p>
                      <p className="text-sm text-muted-foreground">Instead of "improve education," try "help rural teachers create engaging science lessons with limited resources"</p>
                    </div>
                    <div>
                      <p className="font-semibold text-sm mb-1">👥 Know Your Participants</p>
                      <p className="text-sm text-muted-foreground">Specify expertise levels, age ranges, and backgrounds for tailored activities</p>
                    </div>
                    <div>
                      <p className="font-semibold text-sm mb-1">⏱️ Time Allocation Matters</p>
                      <p className="text-sm text-muted-foreground">1-day jams need focused sprints; 3-day jams can include deeper research phases</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="font-semibold text-sm mb-1">🔧 Adapt on the Fly</p>
                      <p className="text-sm text-muted-foreground">Use the toolkit as a foundation but adjust based on group energy and progress</p>
                    </div>
                    <div>
                      <p className="font-semibold text-sm mb-1">🌍 Include Local Context</p>
                      <p className="text-sm text-muted-foreground">Mention local partners, cultural considerations, and available resources</p>
                    </div>
                    <div>
                      <p className="font-semibold text-sm mb-1">📊 Plan for Documentation</p>
                      <p className="text-sm text-muted-foreground">Assign someone to capture insights—the toolkit includes templates for this</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Separator className="my-12" />

          {/* Chapter 04 */}
          <div id="ch4" className="space-y-6">
            <div>
              <p className="uppercase tracking-widest text-sm text-primary">Chapter 04</p>
              <h3 className="text-3xl sm:text-4xl font-extrabold text-foreground">Planning Your Jam</h3>
              <p className="mt-3 text-muted-foreground max-w-3xl">Start 8–12 weeks out. Define focus, partners, and logistics.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Pre‑planning checklist</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                    <li>Pick 1–2 SDGs with strong local relevance</li>
                    <li>Line up challenge partners and coaches</li>
                    <li>Define success metrics and timing</li>
                    <li>Open registration and outreach</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Venue & materials</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                    <li>Flexible space for 15–40 participants</li>
                    <li>Teams of 4–6, strong Wi‑Fi, projection</li>
                    <li>Walls/boards for posting and sharing</li>
                    <li>Toolkit printouts, markers, sticky notes</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>

          <Separator className="my-12" />

          {/* Chapter 05 */}
          <div id="ch5" className="space-y-6">
            <div>
              <p className="uppercase tracking-widest text-sm text-primary">Chapter 05</p>
              <h3 className="text-3xl sm:text-4xl font-extrabold text-foreground">Process & Methodology</h3>
              <p className="mt-3 text-muted-foreground max-w-3xl">A focused 4‑sprint flow over 1–3 days: Understand → Define → Prototype → Share.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Day 1: Explore & Define</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  Kickoff, challenge framing, team formation, research, and insight synthesis.
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Day 2: Create & Share</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  Rapid prototyping, testing, iterations, presentations, and next‑steps planning.
                </CardContent>
              </Card>
            </div>
          </div>

          <Separator className="my-12" />

          {/* Chapter 05 */}
          <div id="ch5" className="space-y-6">
            <div>
              <p className="uppercase tracking-widest text-sm text-primary">Chapter 05</p>
              <h3 className="text-3xl sm:text-4xl font-extrabold text-foreground">Community & Partnerships</h3>
              <p className="mt-3 text-muted-foreground max-w-3xl">Build regional networks, involve partners, and keep alumni engaged.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-2"><CardTitle>Strategic partners</CardTitle></CardHeader>
                <CardContent className="text-muted-foreground">NGOs, universities, public sector, and purposeful companies supply challenges and pathways for impact.</CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle>Participant mix</CardTitle></CardHeader>
                <CardContent className="text-muted-foreground">Prioritise diversity across disciplines and backgrounds — it fuels better outcomes.</CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle>Always‑on community</CardTitle></CardHeader>
                <CardContent className="text-muted-foreground flex items-center gap-2"><MessageSquare className="w-4 h-4 text-primary"/>Use our forum and community spaces for support, sharing, and collaboration.</CardContent>
              </Card>
            </div>
          </div>

          <Separator className="my-12" />

          {/* Chapter 07 - Day by Day Timelines */}
          <div id="ch7" className="space-y-6">
            <div>
              <p className="uppercase tracking-widest text-sm text-primary">Chapter 07</p>
              <h3 className="text-3xl sm:text-4xl font-extrabold text-foreground flex items-center gap-2"><Calendar className="w-6 h-6 text-primary"/>Day‑by‑Day Timelines</h3>
              <p className="mt-3 text-muted-foreground max-w-3xl">Suggested schedules for 1‑day, 2‑day, and 3‑day Jams. Adjust with the Toolkit Generator based on duration and team size.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-2"><CardTitle>1‑Day Jam</CardTitle></CardHeader>
                <CardContent>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li><strong>09:00</strong> Check‑in & kickoff</li>
                    <li><strong>09:30</strong> Challenge brief & team formation</li>
                    <li><strong>10:15</strong> Research sprint</li>
                    <li><strong>12:00</strong> Lunch</li>
                    <li><strong>13:00</strong> Define opportunity</li>
                    <li><strong>14:00</strong> Prototype sprint</li>
                    <li><strong>16:00</strong> Test & iterate</li>
                    <li><strong>17:00</strong> Presentations</li>
                    <li><strong>18:00</strong> Wrap‑up</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2"><CardTitle>2‑Day Jam</CardTitle></CardHeader>
                <CardContent>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li><strong>Day 1 AM</strong> Kickoff, research</li>
                    <li><strong>Day 1 PM</strong> Define, concept</li>
                    <li><strong>Day 2 AM</strong> Prototype</li>
                    <li><strong>Day 2 PM</strong> Test, iterate, present</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2"><CardTitle>3‑Day Jam</CardTitle></CardHeader>
                <CardContent>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li><strong>Day 1</strong> Explore problem space</li>
                    <li><strong>Day 2</strong> Prototype & test</li>
                    <li><strong>Day 3</strong> Iterate & present</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>

          <Separator className="my-12" />

          {/* Chapter 07 - Checklists & Templates */}
          <div id="ch7" className="space-y-6">
            <div>
              <p className="uppercase tracking-widest text-sm text-primary">Chapter 07</p>
              <h3 className="text-3xl sm:text-4xl font-extrabold text-foreground flex items-center gap-2"><CheckSquare className="w-6 h-6 text-primary"/>Checklists & Templates</h3>
              <p className="mt-3 text-muted-foreground max-w-3xl">Print, share, or export via the Toolkit Generator. Tailor to your context.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-2"><CardTitle>Host Checklist</CardTitle></CardHeader>
                <CardContent>
                  <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                    <li>Confirm venue, Wi‑Fi, and accessibility</li>
                    <li>Recruit coaches and lightning speakers</li>
                    <li>Publish registration and communications</li>
                    <li>Prepare materials (printables, name tags, markers)</li>
                    <li>Set up photo consent and documentation plan</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2"><CardTitle>Team Template Pack</CardTitle></CardHeader>
                <CardContent>
                  <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                    <li>Challenge Brief sheet</li>
                    <li>Assumption map</li>
                    <li>Storyboard template</li>
                    <li>Test interview guide</li>
                    <li>Pitch outline</li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <div className="rounded-lg border p-4 text-sm text-muted-foreground">
              Tip: Inside Toolkit → Generator, pick “Include printable pack” to auto‑bundle all relevant templates for your plan.
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
