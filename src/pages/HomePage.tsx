import HeroSection from '../components/HeroSection'
import SponsorBanner from '../components/SponsorBanner'
import SponsorSection from '../components/SponsorSection'
import JamDiversityCarousel from '../components/JamDiversityCarousel'
import Footer from '../components/Footer'
import { Link } from 'react-router-dom'
import { ArrowRight, GraduationCap, Users, Download } from 'lucide-react'
import GlobalEventsOverview from '../components/GlobalEventsOverview'
import JamHighlights from '../components/JamHighlights'
import HostExploreBanner from '../components/HostExploreBanner'
import TestimonialsSection from '../components/TestimonialsSection'

/**
 * Homepage — composed in the GGJ "jam poster" design language.
 * Ground #F6FAF7, ink #14201a, GGJ green (#00A651 / #008a44 / #00713a)
 * as the only voice colour, SDG palette as small dot accents, sections
 * alternating between the ground and white/70 hairline bands.
 */

const VALUE_PROPS = [
  {
    dot: '#26BDE2',
    title: 'Global network',
    blurb: 'Connect with hosts and participants from around the world working on similar challenges.',
  },
  {
    dot: '#E5243B',
    title: 'SDG focus',
    blurb: 'Every jam targets specific UN Sustainable Development Goals with actionable outcomes.',
  },
  {
    dot: '#FD6925',
    title: 'Community driven',
    blurb: 'Access exclusive toolkits, share results, and learn from a vibrant global community.',
  },
]

const SDG_NAMES = [
  'No Poverty', 'Zero Hunger', 'Good Health', 'Quality Education',
  'Gender Equality', 'Clean Water', 'Clean Energy', 'Decent Work',
  'Innovation', 'Reduced Inequalities', 'Sustainable Cities', 'Responsible Consumption',
  'Climate Action', 'Life Below Water', 'Life on Land', 'Peace & Justice', 'Partnerships',
]

const THEME_FOCUS = [
  { dot: '#3F7E44', text: 'Climate adaptation and resilience at the local level' },
  { dot: '#FD9D24', text: 'Designing cities and spaces that withstand disruption' },
  { dot: '#26BDE2', text: 'Water, food, and energy resilience for every community' },
  { dot: '#DD1367', text: 'Centre the most vulnerable in every solution you design' },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#F6FAF7] text-[#14201a] overflow-x-clip">
      <HeroSection />

      {/* What is a Global Goals Jam? */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 py-16 sm:py-20">
        <div className="max-w-2xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#00713a]">
            The format
          </p>
          <h2 className="font-display font-extrabold tracking-tight text-3xl sm:text-4xl mt-3 [text-wrap:balance]">
            What is a Global Goals Jam?
          </h2>
          <p className="text-[#4c5a52] text-lg leading-relaxed mt-4">
            A Global Goals Jam is a 2-day design sprint where local teams tackle
            the UN Sustainable Development Goals through creative
            problem-solving. Communities worldwide come together to prototype
            solutions for their most pressing social and environmental
            challenges.
          </p>
          <Link
            to="/about"
            className="inline-flex items-center mt-5 text-sm font-semibold text-[#00713a] underline decoration-2 decoration-[#00A651]/30 underline-offset-4 hover:decoration-[#00A651] transition-colors"
          >
            Learn more about Global Goals Jam <ArrowRight className="w-4 h-4 ml-1.5" />
          </Link>
        </div>

        <div className="mt-10 grid sm:grid-cols-3 gap-px bg-[#dfe9e2] rounded-2xl overflow-hidden border border-[#dfe9e2]">
          {VALUE_PROPS.map((v) => (
            <div key={v.title} className="bg-white p-6 sm:p-7">
              <span className="block h-2.5 w-2.5 rounded-full" style={{ background: v.dot }} aria-hidden="true" />
              <h3 className="font-display font-extrabold text-xl mt-4">{v.title}</h3>
              <p className="text-sm text-[#4c5a52] mt-2 leading-relaxed">{v.blurb}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Metodic toolkit sponsor — quiet strip */}
      <div className="max-w-6xl mx-auto px-5 sm:px-8 pb-6">
        <SponsorBanner />
      </div>

      {/* UN SDG Report */}
      <section className="border-y border-[#dfe9e2] bg-white/70 mt-10">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-16 sm:py-20">
          <div className="flex items-end justify-between flex-wrap gap-4">
            <div className="max-w-2xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#00713a]">
                State of the goals
              </p>
              <h2 className="font-display font-extrabold tracking-tight text-3xl sm:text-4xl mt-3 [text-wrap:balance]">
                An alarmingly high need for our community to step up.
              </h2>
            </div>
            <a
              href="https://unstats.un.org/sdgs/report/2025/"
              target="_blank"
              rel="noreferrer"
              className="text-sm font-semibold text-[#00713a] underline decoration-2 decoration-[#00A651]/30 underline-offset-4 hover:decoration-[#00A651] transition-colors"
            >
              Read the UN report →
            </a>
          </div>

          <p className="text-[#4c5a52] mt-4 max-w-2xl">
            The latest United Nations progress update on the Sustainable
            Development Goals paints a stark picture:
          </p>

          <div className="mt-8 grid sm:grid-cols-3 gap-px bg-[#dfe9e2] rounded-2xl overflow-hidden border border-[#dfe9e2]">
            {[
              { n: '11', dot: '#FD9D24', text: 'goals face significant challenges' },
              { n: '6', dot: '#E5243B', text: 'goals face major challenges (most severe)' },
              { n: '0', dot: '#0A97D9', text: 'goals are on track' },
            ].map((s) => (
              <div key={s.text} className="bg-white p-6">
                <div className="flex items-center justify-between">
                  <span className="font-display text-4xl font-extrabold tabular-nums">{s.n}</span>
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.dot }} aria-hidden="true" />
                </div>
                <p className="text-sm text-[#4c5a52] mt-3 leading-relaxed">{s.text}</p>
              </div>
            ))}
          </div>

          <p className="mt-8 font-medium max-w-2xl">
            That's why the Global Goals Jam exists. Each year, we mobilise
            designers, students, researchers and local partners to turn urgency
            into action — city by city, weekend by weekend.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
            <Link
              to="/course/enroll"
              className="inline-flex items-center rounded-full bg-[#00A651] px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#008a44] transition-colors"
            >
              Enroll in the certification course
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
            <Link
              to="/events"
              className="inline-flex items-center rounded-full border border-[#dfe9e2] bg-white px-6 py-3 text-sm font-semibold text-[#14201a] hover:border-[#00A651]/50 hover:text-[#00713a] transition-colors"
            >
              Find a Jam near you <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* The 17 Sustainable Development Goals */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 py-16 sm:py-20">
        <div className="max-w-2xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#00713a]">
            United Nations
          </p>
          <h2 className="font-display font-extrabold tracking-tight text-3xl sm:text-4xl mt-3 [text-wrap:balance]">
            The 17 Sustainable Development Goals.
          </h2>
          <p className="text-[#4c5a52] mt-4 leading-relaxed">
            Every Global Goals Jam is centred around one or more of these goals.
            Together, they form the blueprint for a better, more sustainable
            future for all.
          </p>
        </div>
        <div className="mt-10 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 sm:gap-3">
          {SDG_NAMES.map((name, i) => (
            <div
              key={i}
              className={`bg-sdg-${i + 1} rounded-xl p-3 sm:p-4 flex flex-col items-start justify-between aspect-square text-white relative overflow-hidden group hover:scale-[1.04] transition-transform cursor-default`}
            >
              <span className="text-[2rem] sm:text-[2.5rem] font-display font-extrabold leading-none opacity-30">{i + 1}</span>
              <span className="text-[0.65rem] sm:text-xs font-semibold leading-tight">{name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Global Events Overview (This Edition) */}
      <GlobalEventsOverview />

      {/* Jam Highlights — computed strip of completed jams that have results */}
      <JamHighlights />

      {/* Jam Diversity Carousel - Showcasing jams from different cities */}
      <JamDiversityCarousel />

      {/* Explore all hosts */}
      <HostExploreBanner />

      {/* Testimonials: OCR + Derived Quotes (Home-specific) */}
      <TestimonialsSection
        pdfUrl="https://firebasestorage.googleapis.com/v0/b/blink-451505.firebasestorage.app/o/user-uploads%2Fz9Up8fyufsOU2ncxMU2r2iGBON23%2FGGJimpactreport_compressed2__9665dd7f.pdf?alt=media&token=41c7c767-9e12-43be-b12a-9f3e16644c83"
        count={3}
        startIndex={0}
        variant="home"
      />

      {/* Community sponsors (renders only when sponsor data exists) */}
      <SponsorSection />

      {/* 2026 theme + get ready to host */}
      <section className="border-y border-[#dfe9e2] bg-white/70">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-16 sm:py-20">
          <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-10 lg:gap-14 items-start">
            {/* Theme */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#00713a]">
                2026 theme
              </p>
              <h2 className="font-display font-extrabold tracking-tight text-3xl sm:text-4xl mt-3 [text-wrap:balance]">
                Resilient <span className="text-[#00A651]">by Design</span>
              </h2>
              <p className="text-[#4c5a52] mt-4 leading-relaxed">
                Local solutions for a world under pressure. From water stress to
                extreme heat, from food insecurity to displacement — every
                community faces unique climate realities. This year, we design
                resilience from the ground up.
              </p>
              <ul className="mt-7 grid sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                {THEME_FOCUS.map((f) => (
                  <li key={f.text} className="flex items-start gap-2.5">
                    <span
                      className="mt-1.5 h-2.5 w-2.5 rounded-full flex-shrink-0"
                      style={{ background: f.dot }}
                      aria-hidden="true"
                    />
                    <span className="text-[#4c5a52] leading-relaxed">{f.text}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
                <Link
                  to="/theme"
                  className="inline-flex items-center rounded-full bg-[#00A651] px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#008a44] transition-colors"
                >
                  Explore the 2026 theme <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
                <Link
                  to="/events"
                  className="inline-flex items-center text-sm font-semibold text-[#00713a] underline decoration-2 decoration-[#00A651]/30 underline-offset-4 hover:decoration-[#00A651] transition-colors"
                >
                  View upcoming Jams <ArrowRight className="w-4 h-4 ml-1.5" />
                </Link>
              </div>
            </div>

            {/* Get ready to host — sticky-note artefact card */}
            <div
              className="ggj-artefact rounded-2xl border border-[#dfe9e2] bg-white p-6 sm:p-7 shadow-sm"
              style={{ transform: 'rotate(-1.4deg)' }}
            >
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#7d8a83]">
                  Get ready to host
                </p>
                <span className="h-1.5 w-6 rounded-full bg-[#00A651]/70" aria-hidden="true" />
              </div>
              <h3 className="font-display font-extrabold text-xl mt-2">
                Learn best practices, facilitation tips and the full GGJ process.
              </h3>
              <div className="mt-5 space-y-2.5">
                <Link
                  to="/course/train-the-trainer"
                  className="flex w-full items-center justify-center rounded-full bg-[#00A651] px-5 py-3 text-sm font-semibold text-white hover:bg-[#008a44] transition-colors"
                >
                  <GraduationCap className="w-4 h-4 mr-2" /> Train-the-Trainer Course
                </Link>
                <Link
                  to="/faq"
                  className="flex w-full items-center justify-center rounded-full border border-[#dfe9e2] px-5 py-3 text-sm font-semibold text-[#14201a] hover:border-[#00A651]/50 hover:text-[#00713a] transition-colors"
                >
                  Read FAQ <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </div>

              <div className="mt-6">
                <h4 className="font-display font-bold text-sm">What you'll do as a host</h4>
                <ul className="mt-3 space-y-2 text-sm text-[#4c5a52]">
                  {[
                    'Pick a local SDG challenge with partners',
                    'Plan your 2-day jam using our Jamkit',
                    'Facilitate 6 sprints from ideas to actions',
                    'Document outcomes and share with the community',
                  ].map((step) => (
                    <li key={step} className="flex items-start gap-2.5">
                      <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-[#00A651] flex-shrink-0" aria-hidden="true" />
                      <span className="leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6 pt-5 border-t border-[#dfe9e2]">
                <Link
                  to="/host-dashboard"
                  className="inline-flex items-center text-sm font-semibold text-[#00713a] hover:text-[#008a44] transition-colors"
                >
                  <Users className="w-4 h-4 mr-2" /> Become a Local Organiser
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Partnership + Jamkit CTA */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 py-16 sm:py-20 grid lg:grid-cols-2 gap-6 lg:gap-8 items-stretch">
        <div className="rounded-2xl border border-[#dfe9e2] bg-white p-6 sm:p-8 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#00713a]">
            Together with UNDP
          </p>
          <h2 className="font-display font-extrabold tracking-tight text-2xl mt-3 [text-wrap:balance]">
            Design community &times; Sustainable Development Goals
          </h2>
          <p className="text-[#4c5a52] mt-3 leading-relaxed">
            In 2016, UNDP approached Digital Society School to connect the global
            design community with the SDGs. Since then, GGJ has enabled people
            everywhere to take real action on local challenges with global
            impact.
          </p>
          <blockquote className="mt-6 border-l-2 border-[#00A651]/50 pl-4 text-sm text-[#4c5a52] leading-relaxed">
            "Our partnership with Digital Society School in the Global Goals Jam
            facilitates a way to take real action. People all over the world can
            see and learn from each other's work, as well as create impact."
            — UNDP &amp; Digital Society School
          </blockquote>
        </div>

        <div
          className="ggj-artefact rounded-2xl border border-[#dfe9e2] bg-white p-6 sm:p-8 shadow-sm"
          style={{ transform: 'rotate(1.6deg)' }}
        >
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#00713a]">
              Tools &amp; answers
            </p>
            <span className="h-1.5 w-6 rounded-full bg-[#00A651]/70" aria-hidden="true" />
          </div>
          <h2 className="font-display font-extrabold tracking-tight text-2xl mt-3">
            Jamkit + FAQ
          </h2>
          <p className="text-[#4c5a52] mt-3 leading-relaxed">
            Get the updated toolkit and answers to common questions.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/toolkit"
              className="inline-flex items-center rounded-full bg-[#00A651] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#008a44] transition-colors"
            >
              Open Jamkit
            </Link>
            <Link
              to="/faq"
              className="inline-flex items-center rounded-full border border-[#dfe9e2] px-5 py-2.5 text-sm font-semibold text-[#14201a] hover:border-[#00A651]/50 hover:text-[#00713a] transition-colors"
            >
              See frequently asked questions
            </Link>
            <a
              href="https://kzeoegabvbaonypooaev.supabase.co/storage/v1/object/public/Assets/GGJ_2026_Resilient_by_Design.pdf"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-[#dfe9e2] px-5 py-2.5 text-sm font-semibold text-[#14201a] hover:border-[#00A651]/50 hover:text-[#00713a] transition-colors"
            >
              <Download className="w-4 h-4" />
              Download 2026 Guide
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
