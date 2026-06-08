import { ArrowRight, Sparkles } from 'lucide-react'

/**
 * Subtle funnel from the GGJ toolkit experience to Metodic — the facilitation
 * platform that powers the generator. Kept understated on purpose: it appears
 * once, at the natural "you've seen the value" moment, never as a pop-up.
 */

const METODIC_FEATURES = [
  'Edit & remix every method',
  'Auto-build the agenda & slides',
  'Present live & track participants',
  '500+ facilitation methods',
]

export function metodicUrl(content: string) {
  const params = new URLSearchParams({
    utm_source: 'globalgoalsjam',
    utm_medium: 'toolkit',
    utm_campaign: 'ggj_toolkit_generator',
    utm_content: content,
  })
  return `https://metodic.io/?${params.toString()}`
}

/**
 * Hand off a GGJ jam brief (and the methods we already selected) to Metodic's
 * Session Studio, where the AI architect continues the build. The brief is
 * encoded as `ggj_brief` (base64) and Session Studio auto-sends it to the
 * architect as the opening message. Until the Metodic companion reader ships,
 * the link still lands users in the Studio (behind the gate) with UTM tracking.
 */
export function metodicBuildUrl(brief: {
  challenge: string
  sdgLabel?: string
  durationDays: number
  participants?: string
  difficulty?: string
  methods?: string[]
}) {
  const dur = brief.durationDays >= 2 ? `${brief.durationDays}-day` : 'one-day'
  const parts: string[] = [
    `I'm planning a Global Goals Jam — a ${dur} design sprint${brief.participants ? ` for ${brief.participants} participants` : ''}${brief.difficulty ? ` (${brief.difficulty} level)` : ''}.`,
    '',
    `Challenge: ${brief.challenge}`,
  ]
  if (brief.sdgLabel) parts.push(`SDG focus: ${brief.sdgLabel}`)
  parts.push('', 'Please design the full session using the four Global Goals Jam sprints in order — Understand, Define, Prototype, Implement — as a timed agenda with facilitator guidance.')
  if (brief.methods && brief.methods.length) {
    parts.push('', `I've already shortlisted these methods — build the agenda around them and flesh them out: ${brief.methods.slice(0, 16).join('; ')}.`)
  }
  const initialMessage = parts.join('\n')
  // utf-8-safe base64
  const b64 = btoa(unescape(encodeURIComponent(initialMessage)))
  const params = new URLSearchParams({
    ggj_brief: b64,
    utm_source: 'globalgoalsjam',
    utm_medium: 'toolkit',
    utm_campaign: 'ggj_build_in_metodic',
    utm_content: 'jam_agenda_cta',
  })
  return `https://metodic.io/session-studio?${params.toString()}`
}

interface MetodicUpsellProps {
  /** UTM content tag so we can tell which placement converts. */
  source: string
  /** 'card' = full invitation block; 'line' = one quiet sentence. */
  variant?: 'card' | 'line'
  className?: string
}

export default function MetodicUpsell({ source, variant = 'card', className = '' }: MetodicUpsellProps) {
  if (variant === 'line') {
    return (
      <p className={`text-sm text-muted-foreground ${className}`}>
        Powered by{' '}
        <a
          href={metodicUrl(source)}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-foreground underline decoration-primary/40 underline-offset-2 hover:decoration-primary"
        >
          Metodic
        </a>{' '}
        — the facilitation platform behind this generator.
      </p>
    )
  }

  return (
    <div
      className={`rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background p-6 sm:p-7 ${className}`}
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-xl">
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
            <Sparkles className="h-3 w-3" />
            Powered by Metodic
          </div>
          <h3 className="font-display text-lg font-bold tracking-tight sm:text-xl">
            Want to run this jam for real?
          </h3>
          <p className="mt-1.5 text-sm text-muted-foreground">
            This toolkit was generated with Metodic — the platform behind GGJ's generator.
            Take it live: refine the methods, build your agenda, present it, and track your participants.
          </p>
          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
            {METODIC_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-primary/60" />
                {f}
              </li>
            ))}
          </ul>
        </div>
        <a
          href={metodicUrl(source)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-primary-solid px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary/90"
        >
          Explore Metodic
          <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    </div>
  )
}
