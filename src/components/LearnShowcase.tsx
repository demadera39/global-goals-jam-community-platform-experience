import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  Sparkles, PlayCircle, BookOpen, Users, Activity, Layers, ArrowRight, GraduationCap,
} from 'lucide-react'

/**
 * LearnShowcase — a SaaS-style product tour of the GGJ Learn platform.
 *
 * A framed, gently-tilted autoplay demo video (the real platform walkthrough)
 * surrounded by floating feature cards. Two variants:
 *   · "enroll"  — full section for the certification-course enrol page.
 *   · "landing" — a condensed feature band for the homepage, with a CTA.
 *
 * The video lives at /public/learn-demo/. It's silent, so it autoplays muted
 * on loop when scrolled into view (paused off-screen to save the tab).
 */

const VIDEO_SRC = '/learn-demo/ggj-learn-demo.mp4'
const VIDEO_POSTER = '/learn-demo/ggj-learn-demo-poster.jpg'

type Feature = {
  icon: typeof Sparkles
  title: string
  body: string
  tint: string // pastel bg for the icon chip
  ink: string // icon colour
}

const FEATURES: Feature[] = [
  {
    icon: Layers,
    title: 'Nine modules, one jam plan',
    body: 'Every module leaves an artefact on the table — they stack into a complete, ready-to-run jam plan. Not theory: the plan you host from.',
    tint: 'rgba(0,166,81,0.10)',
    ink: '#00873f',
  },
  {
    icon: Sparkles,
    title: 'Your AI Jam Facilitator',
    body: 'A coach on every lesson — asks the right questions, reviews your work, and writes your module syntheses. You always pass, with feedback made together.',
    tint: 'rgba(253,105,37,0.12)',
    ink: '#e4551a',
  },
  {
    icon: PlayCircle,
    title: 'Explainers & deep dives',
    body: 'A short animated explainer opens each module, narrated by an AI in Marco’s own voice — with longer deep-dive videos underneath for when you want to go further.',
    tint: 'rgba(38,189,226,0.14)',
    ink: '#1595bd',
  },
  {
    icon: BookOpen,
    title: 'Your personal playbook',
    body: 'Everything you write becomes a designed, downloadable jam bible — plus a facilitator’s read of your file. Your bible for the weekend.',
    tint: 'rgba(76,159,56,0.14)',
    ink: '#3f8a30',
  },
  {
    icon: Activity,
    title: 'Watch yourself grow',
    body: 'Score six host competencies at the start, and again at day 90. The delta between the two numbers is the only score this programme celebrates.',
    tint: 'rgba(252,195,11,0.16)',
    ink: '#b98600',
  },
  {
    icon: Users,
    title: 'A global cohort',
    body: 'Jam alongside hosts worldwide in a community organised by module — questions, announcements, and the people running jams in their own cities.',
    tint: 'rgba(221,19,103,0.10)',
    ink: '#c01059',
  },
]

/** The framed, tilted autoplay demo video. */
export function LearnDemoVideo({ tilt = true }: { tilt?: boolean }) {
  const ref = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) el.play().catch(() => {})
        else el.pause()
      },
      { threshold: 0.25 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div className="learn-demo-stage" data-tilt={tilt ? 'on' : 'off'}>
      {/* soft brand glow behind the frame */}
      <div className="learn-demo-glow" aria-hidden="true" />
      <div className="learn-demo-frame">
        {/* browser chrome */}
        <div className="learn-demo-chrome">
          <span className="learn-demo-dot" style={{ background: '#ff5f57' }} />
          <span className="learn-demo-dot" style={{ background: '#febc2e' }} />
          <span className="learn-demo-dot" style={{ background: '#28c840' }} />
          <div className="learn-demo-url">
            <span className="learn-demo-lock" aria-hidden="true">🔒</span>
            learn.globalgoalsjam.org
          </div>
        </div>
        <video
          ref={ref}
          className="learn-demo-video"
          src={VIDEO_SRC}
          poster={VIDEO_POSTER}
          muted
          loop
          playsInline
          preload="metadata"
          aria-label="A 25-second tour of the GGJ Learn platform"
        />
      </div>
    </div>
  )
}

/** A single floating, gently-tilted feature card. */
function FeatureCard({ feature, index }: { feature: Feature; index: number }) {
  const Icon = feature.icon
  // Alternate a subtle rotation so the grid reads as a scatter of cards.
  const rot = [(-1.4), 1.1, -0.8, 1.3, -1.1, 0.9][index % 6]
  return (
    <div
      className="learn-feature-card group"
      style={{ ['--rot' as string]: `${rot}deg` }}
    >
      <div
        className="learn-feature-icon"
        style={{ background: feature.tint, color: feature.ink }}
      >
        <Icon className="w-5 h-5" strokeWidth={2.2} />
      </div>
      <h3 className="font-display font-extrabold text-[1.02rem] leading-tight text-foreground mb-1.5">
        {feature.title}
      </h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{feature.body}</p>
    </div>
  )
}

export default function LearnShowcase({ variant = 'enroll' }: { variant?: 'enroll' | 'landing' }) {
  const isLanding = variant === 'landing'
  return (
    <section className={`learn-showcase ${isLanding ? 'learn-showcase--landing' : ''}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* top: header on the left, framed demo on the right */}
        <div className="grid lg:grid-cols-[0.82fr_1.18fr] gap-9 lg:gap-12 items-center mb-12 sm:mb-14">
          <div className="max-w-xl">
            <p className="text-xs uppercase tracking-[0.22em] font-semibold text-primary/70 mb-3">
              {isLanding ? 'The learning platform' : 'Inside the course'}
            </p>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-[2.55rem] font-extrabold tracking-tight text-foreground leading-[1.05] mb-4">
              {isLanding ? (
                <>A learning platform built to get you <span className="text-primary-solid">hosting</span>.</>
              ) : (
                <>Not a PDF course. A platform that gets you <span className="text-primary-solid">jam-ready</span>.</>
              )}
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              A guided path from “I’d like to host” to a complete jam plan — with an AI facilitator at
              your side, narrated explainers, your own living playbook, and a global cohort.
            </p>
            {isLanding && (
              <div className="mt-7">
                <Link
                  to="/course/enroll"
                  className="inline-flex items-center gap-2 rounded-pill bg-primary text-primary-foreground font-semibold px-7 py-3.5 text-[0.95rem] shadow-lg hover:brightness-105 transition"
                >
                  <GraduationCap className="w-5 h-5" />
                  Start the Host Programme
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <p className="text-xs text-muted-foreground mt-3">
                  Free course · official certification €39 · become a certified Global Goals Jam host
                </p>
              </div>
            )}
          </div>

          <div>
            <LearnDemoVideo />
            <p className="text-center text-[11px] uppercase tracking-[0.16em] text-muted-foreground/70 mt-4">
              A 25-second tour of the live platform
            </p>
          </div>
        </div>

        {/* feature cards, full width */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <FeatureCard key={f.title} feature={f} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── The programme, as a scatter of floating tilted module cards ──────────── */

type SprintDef = { name: string; color: string }
const SPRINTS: Record<string, SprintDef> = {
  start: { name: 'Start', color: '#00A651' },
  understand: { name: 'Sprint 1 · Understand', color: '#26BDE2' },
  define: { name: 'Sprint 2 · Define', color: '#FCC30B' },
  prototype: { name: 'Sprint 3 · Prototype', color: '#FD6925' },
  implement: { name: 'Sprint 4 · Implement', color: '#4C9F38' },
}

type ModuleDef = { n: number; title: string; artefact: string; sprint: keyof typeof SPRINTS }
const PROGRAMME: ModuleDef[] = [
  { n: 0, title: 'Arrival & Baseline', artefact: 'Your host profile + baseline scan', sprint: 'start' },
  { n: 1, title: 'Welcome to the Jam', artefact: 'Your host intention + a dated weekend', sprint: 'understand' },
  { n: 2, title: 'Systems & the Goals', artefact: 'Your challenge, mapped to one SDG target', sprint: 'understand' },
  { n: 3, title: 'Open Design & Partners', artefact: 'Partner & venue shortlist', sprint: 'define' },
  { n: 4, title: 'The Jamkit & Your Agenda', artefact: 'Your full 4-sprint agenda', sprint: 'define' },
  { n: 5, title: 'Facilitation Mastery', artefact: 'Your plan for the three hard moments', sprint: 'prototype' },
  { n: 6, title: 'Inclusion & Safety', artefact: 'Your inclusion + safety plan', sprint: 'prototype' },
  { n: 7, title: 'Impact & Continuation', artefact: 'Metrics + your 90-day plan', sprint: 'implement' },
  { n: 8, title: 'Capstone: Your Jam Plan', artefact: 'Your complete, reviewed jam plan', sprint: 'implement' },
]

export function ProgrammeModuleCards() {
  return (
    <div className="programme-cards">
      {PROGRAMME.map((m, i) => {
        const s = SPRINTS[m.sprint]
        const rot = [(-1.6), 1.2, -1, 1.5, -1.3, 1, -1.4, 1.3, -0.9][i % 9]
        const isCapstone = m.n === 8
        return (
          <div
            key={m.n}
            className={`programme-card group ${isCapstone ? 'programme-card--capstone' : ''}`}
            style={{ ['--rot' as string]: `${rot}deg`, ['--sprint' as string]: s.color }}
          >
            <div className="programme-card__top">
              <span className="programme-card__num font-display">{m.n === 0 ? '00' : `0${m.n}`}</span>
              <span className="programme-card__sprint" style={{ color: s.color }}>
                <span className="programme-card__tick" style={{ background: s.color }} />
                {s.name}
              </span>
            </div>
            <h4 className="programme-card__title font-display">{m.title}</h4>
            <p className="programme-card__artefact">
              <span className="programme-card__leave">You leave with</span> {m.artefact}
            </p>
          </div>
        )
      })}
    </div>
  )
}
