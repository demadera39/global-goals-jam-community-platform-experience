import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion'
import { Badge } from '../components/ui/badge'
import { Loader2 } from 'lucide-react'

export default function FAQPage() {
  const [loading, setLoading] = useState(false)

  const sections = [
    {
      title: 'How to host your own Global Goals Jam',
      items: [
        {
          q: 'What is required to host a Jam?',
          a: "You'll need a venue that comfortably seats your participants, reliable Internet access, access to our methods, tools and templates (Jamkit), and basic design tools (post‑its, markers, paper, tape, etc.). Typical jams host between 20–40 participants."
        },
        { q: 'Until when is it possible to start organising a Global Goals Jam?', a: 'You can organise throughout the year. We recommend aligning with global waves (e.g., September) for shared momentum, but local needs come first.' },
        { q: 'Is it ok if we work on a different theme than your global themes selected this year?', a: 'Yes. You know your local context best. We encourage alignment to global themes when possible, but local relevance is key.' },
        { q: 'How can we finance our local Jam?', a: 'Combine small sponsorships, in‑kind support (venue, snacks), local grants, and participant contributions. Keep accessibility in mind.' },
        { q: 'How can we involve sponsors to fund our local Jam?', a: 'Offer visibility (logo, short intro), co‑create challenges with them, and communicate impact clearly. Keep the jam community‑first and values‑aligned.' },
        { q: 'Do we really need to document our process?', a: 'Yes. Documentation helps the global community learn from your jam and amplifies your impact. Templates are included in the Jamkit.' },
        { q: 'What do we do with all the photos & videos and selfies?', a: 'Collect consents, share highlights on your event page, and tag SDGs. We will provide guidance for storage and sharing in the host dashboard.' },
        { q: 'How do we connect local Jams with each other?', a: 'Use our platform’s forum and showcase features. Consider joint challenges across cities and schedule cross‑city check‑ins.' }
      ]
    },
    {
      title: 'On the jamkit and sprints',
      items: [
        { q: 'How do I get the full jamkit with all the methods and tools?', a: 'Sign up as a local organiser. Approved hosts gain access to the full Jamkit in the dashboard.' },
        { q: "The methods in your kit are nice, but I'd like to use others my community is familiar with. Can I?", a: 'Absolutely. The shared process is key, but methods can be adapted to your context.' },
        { q: 'What is a sprint?', a: 'A focused block of time with clear objectives. GGJ typically runs four sprints: Understand, Define, Prototype, Implement.' },
        { q: 'Is it possible to just do a short minijam of one day?', a: 'Yes. Mini‑jams are supported with adjusted sprint timings in the Jamkit.' },
        { q: 'Which communication tools and channels will we use?', a: 'We recommend tools that work best locally. The platform offers announcements, email, and forum for hosts.' },
        { q: 'How do I become a jammer?', a: 'Find and register for a local event on the Events page. Many jams also accept walk‑ins depending on capacity.' }
      ]
    },
    {
      title: 'On this website',
      items: [
        { q: 'How do we add information about our Jam to this website?', a: 'Apply to become a host. Once approved, you can create and manage your event page directly.' },
        { q: 'I already have an account to this site, how do I add my local Jam information?', a: 'Log in and use the Host Dashboard → Event Management to add/update your event.' },
        { q: 'How can I put my Jam on the home page map?', a: 'Add your event with location; approved/published events appear automatically on the global map.' },
        { q: "Help! I added a Jam! Why doesn't it show anywhere on the site?", a: 'Ensure the status is set to “published” and the location is valid. Some approvals may take time.' }
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      <section className="relative py-16 hero-pattern">
        <div className="absolute inset-0 bg-background/80 -z-10" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge variant="secondary" className="mb-4">FAQ</Badge>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">Frequently Asked Questions</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            The essentials for hosts and participants. Updated for the 2025 season.
          </p>
        </div>
      </section>


      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {sections.map((sec, idx) => (
          <Card key={idx} className="mb-8">
            <CardHeader>
              <CardTitle>{sec.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {sec.items.map((item, i) => (
                  <AccordionItem key={i} value={`item-${idx}-${i}`}>
                    <AccordionTrigger className="text-left">{item.q}</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">{item.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
