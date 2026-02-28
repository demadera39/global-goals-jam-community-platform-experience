import { Badge } from '../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Calendar } from 'lucide-react'
import { Link } from 'react-router-dom'
import SponsorBanner from '../components/SponsorBanner'
import DonateButton from '../components/DonateButton'
import { AspectRatio } from '../components/ui/aspect-ratio'
import TestimonialsSection from '../components/TestimonialsSection'

export default function AboutPage() {
  // Copy extracted from the archived site (Jan 2025 snapshot)
  const why = `The challenges before us are so complex that no single discipline, mindset, or expertise will be able to solve them. To address social challenges globally, we need to collaborate and learn from local ideas that are being developed across the globe.\n\nTo collaborate, we need to engage in a way that goes beyond talking, towards making and creating, in a space for people from all backgrounds who bring in their local knowledge, ensuring a bottom-up, grassroots approach.\n\nThis is why we started the Jam: a 2-day event to engage makers and designers to contribute to the Sustainable Development Goals by creating short-term interventions with long-term impact. More than an event, it is a network of cities and organisations that are excited to engage their local communities to create real impact for the Global Goals.\n\nLocal organisers – ranging from universities and design labs to NGOs or consultancies – can apply to host a Jam. Together with partners from the local industry they co-design challenges related to one or more of the selected global themes. We provide them with a toolkit and online training to guide the design process.`

  const history = `The Global Goals Jam was founded by Marco van Hout and Gijs Gootjes of Digital Society School (DSS), Boaz Paldi, Simon van Woerden and Hana Omar of UNDP and has been further developed and coordinated by Anneke van Woerden (DSS). In the first edition in 2016, 17 cities participated, in 2017 45 cities, in 2018 75 cities, in 2019 over 85 cities, in 2020 (due to COVID19) 35 and in 2021 we grew back to around 60 cities. Thousands of change makers have used our methodology and are now part of this growing learning community around the SDGs, ready to design 2030 now.`

  const whatIsJam = [
    '2 days in the weekend before Climate Week in September',
    'Local challenges related to one of the Global Goals, co-created with the local community and industry',
    'Multidisciplinary teams of creatives, researchers and sustainability experts',
    'Short design sprints (4 sprints divided over 2 days)',
    'Global Goals Jamkit with methods and tools to guide the design process',
    'Process and results are shared so that the community can build upon each other’s work'
  ]

  const designWaste = `Vital insights from the design process are not documented, shared, found and re-used, and therefore go to waste. We desperately need a new, more sustainable mindset to reach the Sustainable Development Goals by 2030. We believe in creating a common language, using a shared process of design methods, and building upon each other’s work. And we have to dare to do it together: governments, educators and businesses.`

  const origins = `Rooted in strong bonds between Digital Society School and UNDP, now ready for a new era.\n\nConceived in 2016, the GGJ was created through a collaboration between the UN Development Programme (UNDP) and the Digital Society School (DSS) at the Amsterdam University of Applied Sciences. \n\nIt was founded by Marco van Hout and Gijs Gootjes (DSS), together with Boaz Paldi, Simon van Woerden, and Hana Omar (UNDP), and later coordinated by Anneke van Woerden. \n\nMarco, a designer-educator and co‑founder of DSS, has played a lead role in shaping the network and methods over the years. He will be leading the new era for GGJ as well, and his new organization Metodic.io will play an important role in supporting the event(s) and facilitators of jams.`

  const milestones: { year: string; value: string }[] = [
    { year: '2016', value: '17' },
    { year: '2017', value: '45' },
    { year: '2018', value: '65' },
    { year: '2019', value: '100' },
    { year: '2020', value: '35 (Covid)' },
    { year: '2021', value: '50 (Covid)' },
    { year: '2022', value: '60' },
    { year: '2023', value: '65' },
    { year: '2024', value: '60' }
  ]

  const impactPdf = 'https://firebasestorage.googleapis.com/v0/b/blink-451505.firebasestorage.app/o/user-uploads%2Fz9Up8fyufsOU2ncxMU2r2iGBON23%2FGGJimpactreport_compressed2__9665dd7f.pdf?alt=media&token=41c7c767-9e12-43be-b12a-9f3e16644c83'

  return (
    <div className="min-h-screen bg-background sdg-theme-17">
      {/* Hero Section */}
      <section className="relative py-20 hero-pattern">
        <div className="absolute inset-0 bg-background/80" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm font-medium">
            <Calendar className="w-4 h-4 mr-2" />
            About Global Goals Jam
          </Badge>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6">
            About
          </h1>
        </div>
      </section>

      {/* Video Embed */}
      <section className="py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-xl border bg-card overflow-hidden">
            <AspectRatio ratio={16 / 9}>
              <iframe
                title="Global Goals Jam Overview"
                src="https://www.youtube.com/embed/FmDsa0CxIuI"
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </AspectRatio>
          </div>
        </div>
      </section>

      {/* Why GGJ */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-foreground mb-6">Why Global Goals Jam?</h2>
          <div className="grid gap-10 lg:grid-cols-12">
            {/* Left: narrative */}
            <div className="lg:col-span-8">
              <div className="prose max-w-none text-muted-foreground whitespace-pre-line leading-relaxed">
                {why}
              </div>
            </div>

            {/* Right: At a glance card */}
            <div className="lg:col-span-4">
              <Card className="bg-card/80 backdrop-blur">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xl">At a glance</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    <li className="flex items-center gap-3"><span className="inline-flex h-2.5 w-2.5 rounded-full bg-primary" />Founded in 2016</li>
                    <li className="flex items-center gap-3"><span className="inline-flex h-2.5 w-2.5 rounded-full bg-primary" />17 → 100+ cities over 4 years</li>
                    <li className="flex items-center gap-3"><span className="inline-flex h-2.5 w-2.5 rounded-full bg-primary" />Thousands of change makers</li>
                    <li className="flex items-center gap-3"><span className="inline-flex h-2.5 w-2.5 rounded-full bg-primary" />2‑day sprint • 4 design sprints</li>
                    <li className="flex items-center gap-3"><span className="inline-flex h-2.5 w-2.5 rounded-full bg-primary" />Guided by Jamkit methods</li>
                  </ul>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <Button asChild className="bg-primary-solid text-white hover:bg-primary/90">
                      <Link to="/events">Join a Jam</Link>
                    </Button>
                    <Button asChild variant="outline" className="">
                      <a href="https://globalgoalsjam.org/organisers/" target="_blank" rel="noreferrer">Host a Jam</a>
                    </Button>
                    <DonateButton variant="outline" size="default" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* History */}
      <section className="py-16 bg-card/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-foreground mb-4">A brief history of growth and impact</h2>
          <p className="text-muted-foreground leading-relaxed">
            {history}
          </p>

          {/* Milestones with visual line */}
          <div className="mt-8 rounded-xl border bg-background p-2 sm:p-4">
            <div className="space-y-4">
              {milestones.map((m) => (
                <div key={m.year} className="sm:grid sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                  <div className="font-medium tabular-nums text-foreground sm:pr-6">{m.year}</div>
                  <div className="relative mx-3 my-3 sm:my-0 flex items-center justify-center">
                    {/* Vertical connector per row for a clean segmented line */}
                    <span className="hidden sm:block absolute left-1/2 top-0 -translate-x-1/2 h-full w-px bg-border" aria-hidden />
                    <span className="relative z-10 block w-2.5 h-2.5 rounded-full bg-primary" />
                  </div>
                  <div className="text-right font-medium tabular-nums text-muted-foreground sm:pl-6">{m.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Origins & Leadership */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-foreground mb-6">Origins & Leadership</h2>

          {/* blue banner - placed under title and before main text */}
          <div className="top-banner rounded-md mb-6 px-4 py-3 text-center text-white">
            Read the 5 Years of Impact report —
            <a href={impactPdf} target="_blank" rel="noreferrer" className="underline ml-2 font-semibold">Open report (PDF)</a>
          </div>

          {/* Option A: Side-by-side photo and text (image left on desktop) */}
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="sm:w-1/2 lg:w-1/3">
              <div className="rounded-xl overflow-hidden shadow-md">
                <AspectRatio ratio={1}>
                  <img
                    src="https://firebasestorage.googleapis.com/v0/b/blink-451505.firebasestorage.app/o/user-uploads%2Fz9Up8fyufsOU2ncxMU2r2iGBON23%2FSchermafbeelding2025-08-28om112100__c2e24b4c.png?alt=media&token=41e22ba9-8bf0-4aaa-a6cf-21f998f562cb"
                    alt="Marco van Hout and Gijs Gootjes (2015)"
                    className="w-full h-full object-cover object-center"
                    loading="lazy"
                  />
                </AspectRatio>
                <figcaption className="px-4 py-2 text-sm text-muted-foreground bg-gradient-to-t from-black/60 via-black/30 to-transparent text-white">
                  Marco van Hout &amp; Gijs Gootjes, 2015 — co-founders
                </figcaption>
              </div>
            </div>

            <div className="sm:w-1/2 lg:w-2/3">
              <p className="prose max-w-none text-muted-foreground whitespace-pre-line leading-relaxed">
                Marco van Hout and Gijs Gootjes in 2015 when they founded the idea of the Global Goals Jam, based on their years of international experience in designing across cultures, developing methods and tools as a common design language.
              </p>

              <div className="mt-4 prose text-muted-foreground">
                {origins}
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* What does a Jam look like? */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-foreground mb-4">What does a Jam look like?</h2>
          <Card>
            <CardContent className="p-6">
              <ul className="space-y-3 list-disc pl-6 text-muted-foreground">
                {whatIsJam.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-3">Interested in organising a Jam?</h3>
                <div className="flex flex-wrap gap-3">
                  <Button asChild className="bg-primary-solid text-white hover:bg-primary/90">
                    <a href="https://globalgoalsjam.org/organisers/" target="_blank" rel="noreferrer">For Organisers</a>
                  </Button>
                  <Link to="/events" className="inline-flex items-center text-primary hover:underline">
                    Explore upcoming Jams
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Design Waste */}
      <section className="py-16 bg-card/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-foreground mb-4">Design Waste</h2>
          <p className="text-muted-foreground leading-relaxed">
            {designWaste}
          </p>
        </div>
      </section>



      {/* Replace single Boaz quote with three curated quotes */}
      <section className="py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <TestimonialsSection
            pdfUrl={impactPdf}
            count={3}
            startIndex={0}
            showHeader={false}
            variant="about"
          />
        </div>
      </section>

      {/* Sponsor Banner at bottom */}
      <section className="py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <SponsorBanner />
        </div>
      </section>
    </div>
  )
}
