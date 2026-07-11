import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'

/**
 * AdminShell — the shared operator layout for every /admin route.
 *
 * Same design language as the marketing pages ("the jam poster") but with an
 * operator texture: ground #F6FAF7, ink #14201a, GGJ green voice, hairline
 * #dfe9e2 borders, an eyebrow + extrabold title band and a horizontal
 * tool-rail of pills instead of a sidebar. Content sits in a max-w-7xl
 * container on the ground.
 */

const TOOLS: { label: string; to: string }[] = [
  { label: 'Overview', to: '/admin-dashboard' },
  { label: 'Users', to: '/admin/users' },
  { label: 'Passwords', to: '/admin/passwords' },
  { label: 'Certificates', to: '/admin/certificate-creator' },
  { label: 'Cert access', to: '/admin/certificate-fix' },
  { label: 'Highlights', to: '/admin/highlights' },
  { label: 'Carousel', to: '/admin/carousel' },
]

/** Small SDG dot accents next to the eyebrow — the only colour flourish. */
const SDG_DOTS = ['#E5243B', '#FCC30B', '#4C9F38', '#26BDE2', '#DD1367']

interface AdminShellProps {
  /** Page title rendered in the header band (extrabold display type). */
  title: string
  /** One quiet line under the title. */
  description?: string
  /** Right-aligned header actions (quiet buttons, "view site" links, …). */
  actions?: ReactNode
  children: ReactNode
}

export default function AdminShell({ title, description, actions, children }: AdminShellProps) {
  const { pathname } = useLocation()

  return (
    <div className="flex min-h-screen flex-col bg-[#F6FAF7] text-[#14201a]">
      {/* Slim operator header band */}
      <header className="border-b border-[#dfe9e2] bg-white/70">
        <div className="mx-auto w-full max-w-7xl px-5 pt-7 sm:px-8 sm:pt-8">
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
            <div className="min-w-0">
              <p className="flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.28em] text-[#00713a]">
                GGJ Admin
                <span className="flex items-center gap-1" aria-hidden="true">
                  {SDG_DOTS.map((c) => (
                    <span key={c} className="h-1.5 w-1.5 rounded-full" style={{ background: c }} />
                  ))}
                </span>
              </p>
              <h1 className="mt-2 font-display text-2xl font-extrabold tracking-tight sm:text-3xl [text-wrap:balance]">
                {title}
              </h1>
              {description && (
                <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-[#4c5a52]">{description}</p>
              )}
            </div>
            {actions && <div className="flex flex-wrap items-center gap-2 pb-0.5">{actions}</div>}
          </div>

          {/* Horizontal tool-rail — pills across all admin routes */}
          <nav aria-label="Admin tools" className="mt-6 flex gap-2 overflow-x-auto pb-4">
            {TOOLS.map((tool) => {
              const active = pathname === tool.to
              return (
                <Link
                  key={tool.to}
                  to={tool.to}
                  aria-current={active ? 'page' : undefined}
                  className={
                    active
                      ? 'inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-[#14201a] bg-[#14201a] px-4 py-1.5 text-[13px] font-semibold text-white'
                      : 'inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-[#dfe9e2] bg-white px-4 py-1.5 text-[13px] font-semibold text-[#4c5a52] transition-colors hover:border-[#00A651]/50 hover:text-[#00713a]'
                  }
                >
                  {active && <span className="h-1.5 w-1.5 rounded-full bg-[#00A651]" aria-hidden="true" />}
                  {tool.label}
                </Link>
              )
            })}
          </nav>
        </div>
      </header>

      {/* Content area on the ground */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-8 sm:px-8 sm:py-10">{children}</main>

      {/* SDG rainbow hairline closes the admin surface, mirroring the site footer */}
      <div className="ggj-rainbow h-1 w-full" aria-hidden="true" />
    </div>
  )
}

/* ── Shared operator primitives ──────────────────────────────────────── */

export type PillTone = 'green' | 'grey' | 'amber' | 'red' | 'ink' | 'outline'

const PILL_TONES: Record<PillTone, string> = {
  green: 'bg-[#00A651]/10 text-[#00713a] ring-1 ring-inset ring-[#00A651]/25',
  grey: 'bg-[#14201a]/5 text-[#4c5a52] ring-1 ring-inset ring-[#dfe9e2]',
  amber: 'bg-amber-400/15 text-amber-800 ring-1 ring-inset ring-amber-500/30',
  red: 'bg-red-500/10 text-red-700 ring-1 ring-inset ring-red-500/25',
  ink: 'bg-[#14201a] text-white',
  outline: 'bg-white text-[#7d8a83] ring-1 ring-inset ring-[#dfe9e2]',
}

/** Quiet status pill — keeps semantic colours without the pastel candy. */
export function Pill({
  tone = 'outline',
  title,
  children,
}: {
  tone?: PillTone
  title?: string
  children: ReactNode
}) {
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${PILL_TONES[tone]}`}
    >
      {children}
    </span>
  )
}

/** White card on hairline border — the operator content surface. */
export const adminCardClass = 'rounded-2xl border border-[#dfe9e2] bg-white shadow-sm'

/** Underline-rail styling for in-page shadcn Tabs (secondary navigation). */
export const railTabsListClass =
  'h-auto w-full justify-start gap-6 overflow-x-auto rounded-none border-b border-[#dfe9e2] bg-transparent p-0 text-[#7d8a83]'
export const railTabTriggerClass =
  'rounded-none border-b-2 border-transparent bg-transparent px-0 pb-3 pt-1 text-sm font-semibold text-[#7d8a83] shadow-none transition-colors hover:text-[#14201a] data-[state=active]:border-[#00A651] data-[state=active]:bg-transparent data-[state=active]:text-[#14201a] data-[state=active]:shadow-none'

/** Quiet rounded-full buttons in the GGJ voice. */
export const quietButtonClass =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full border border-[#dfe9e2] bg-white px-4 py-2 text-sm font-semibold text-[#14201a] transition-colors hover:border-[#00A651]/50 hover:text-[#00713a] disabled:pointer-events-none disabled:opacity-50'
export const primaryButtonClass =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-[#00A651] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#008a44] disabled:pointer-events-none disabled:opacity-50'
