import { useState, useEffect, type ReactNode } from 'react'
import { Card, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import {
  Target, Lightbulb, Zap, TrendingUp, Clock, Users, MapPin,
  ChevronDown, ChevronRight, ExternalLink, Sparkles, ArrowRight, Download, BookOpen,
  FileText, Info, AlertCircle,
} from 'lucide-react'
import { markdownToBasicHtml } from '../lib/toolkitExport'
import { metodicBuildUrl } from './MetodicUpsell'
import type { MetodicMethod, SprintPhase } from '../lib/metodicMethods'

// Metodic brand tokens — scoped locally to this "Powered by Metodic" zone so the
// rest of GGJ keeps its green identity. Coral = Metodic's primary (hsl 16 80% 61%).
const METODIC_CORAL = 'hsl(16, 80%, 61%)'
const METODIC_CORAL_SOFT = 'hsl(16, 80%, 61%, 0.12)'
const METODIC_CREAM = 'hsl(28, 60%, 97%)'
const METODIC_LOGO =
  'https://firebasestorage.googleapis.com/v0/b/blink-451505.firebasestorage.app/o/user-uploads%2Fz9Up8fyufsOU2ncxMU2r2iGBON23%2Flogotype__fc060903.png?alt=media&token=9075314a-0c8f-4585-be0d-b9fdfd4092f6'

interface JamBlock {
  methodId: string | null
  proposedMethodKey?: string | null
  title: string
  startTime?: string
  endTime?: string
  duration?: string
  rationale?: string
}
interface JamSprint {
  phase: SprintPhase
  title: string
  objective: string
  blocks: JamBlock[]
}
interface ProposedMethod {
  key: string
  title: string
  description?: string
  phase?: SprintPhase
  rationale?: string
}
export interface ParsedJamAgenda {
  format: string
  overviewMarkdown?: string
  learningFlow?: string
  sprints: JamSprint[]
  proposedMethods?: ProposedMethod[]
  meta?: {
    sdgFocus?: string
    sdgLabel?: string
    jamDuration?: string
    participants?: string
    challenge?: string
    difficulty?: string
    grounded?: boolean
  }
  _methods?: Record<string, MetodicMethod>
}

const PHASE_META: Record<SprintPhase, { label: string; icon: any; color: string; bg: string; ring: string }> = {
  understand: { label: 'Understand', icon: Target, color: 'text-sky-600', bg: 'bg-pastel-sky', ring: 'ring-sky-200' },
  define: { label: 'Define', icon: Lightbulb, color: 'text-amber-600', bg: 'bg-pastel-amber', ring: 'ring-amber-200' },
  prototype: { label: 'Prototype', icon: Zap, color: 'text-violet-600', bg: 'bg-pastel-violet', ring: 'ring-violet-200' },
  implement: { label: 'Implement', icon: TrendingUp, color: 'text-primary', bg: 'bg-pastel-green', ring: 'ring-green-200' },
}
const PHASE_ORDER: SprintPhase[] = ['understand', 'define', 'prototype', 'implement']

// Metodic's category palette (fallback when the DB category_color isn't a hex).
const CATEGORY_HEX: Record<string, string> = {
  // design
  Research: '#14b8a6', 'Define Intentions': '#ec4899', 'Know User': '#22c55e',
  'Frame Insights': '#a855f7', 'Ideation & Concepts': '#f59e0b', 'Prototype & Test': '#3b82f6',
  // sdg
  'Goal Cards': '#00A651', 'Systems Lenses': '#9333ea', 'Scale & Context': '#14b8a6', 'Technology & Future': '#f59e0b',
  // behavioralchange / foresight / team / culture / product
  Diagnosis: '#14b8a6', Nudges: '#f59e0b', Habits: '#3b82f6', Ethics: '#ef4444',
  Scanning: '#14b8a6', Scenarios: '#a855f7', 'Stress-Testing': '#3b82f6', Readiness: '#22c55e',
  Foundation: '#14b8a6', Safety: '#22c55e', Rituals: '#f59e0b', Evolution: '#3b82f6',
  'The Self': '#14b8a6', 'The Team': '#22c55e', 'The Map': '#a855f7', 'The Bridge': '#3b82f6',
  Discovery: '#14b8a6', Growth: '#a855f7', Launch: '#f59e0b', Sustain: '#22c55e',
}
function methodColor(method?: MetodicMethod): string {
  const c = method?.categoryColor
  if (c && c.startsWith('#')) return c
  return (method?.category && CATEGORY_HEX[method.category]) || METODIC_CORAL
}

// Fetch + render an Iconify icon (e.g. "mdi:hand-coin"), the way Metodic does.
function MethodIcon({ icon, color }: { icon?: string | null; color: string }) {
  const [svg, setSvg] = useState<string | null>(null)
  useEffect(() => {
    let active = true
    if (icon && icon.includes(':')) {
      fetch(`https://api.iconify.design/${icon}.svg?width=40&height=40`)
        .then((r) => (r.ok ? r.text() : null))
        .then((t) => { if (active && t) setSvg(t.replace(/width="[^"]*"/, 'width="100%"').replace(/height="[^"]*"/, 'height="100%"')) })
        .catch(() => {})
    }
    return () => { active = false }
  }, [icon])
  return (
    <div
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg [&_svg]:h-6 [&_svg]:w-6"
      style={{ backgroundColor: `${color}1a`, color }}
    >
      {svg ? <div dangerouslySetInnerHTML={{ __html: svg }} /> : <FileText className="h-5 w-5" />}
    </div>
  )
}

function SectionLabel({ icon: Icon, children }: { icon: any; children: ReactNode }) {
  return (
    <h4 className="mb-1 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-foreground">
      <Icon className="h-3 w-3" />{children}
    </h4>
  )
}

function GroundedMethodCard({ method, proposed }: { method?: MetodicMethod; proposed?: ProposedMethod }) {
  const [open, setOpen] = useState(false)
  const title = method?.title || proposed?.title || 'Activity'
  const description = method?.description || proposed?.description || ''
  const duration = method?.durationLabel || ''
  const color = methodColor(method)

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      {/* category color bar (Metodic signature) */}
      <div className="h-1.5 w-full" style={{ backgroundColor: proposed ? '#f59e0b' : color }} />
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-start gap-3 p-3 text-left">
        <MethodIcon icon={method?.icon} color={proposed ? '#f59e0b' : color} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">{title}</span>
            {proposed ? (
              <Badge variant="outline" className="border-amber-300 text-amber-700 text-[10px]">Proposed — not yet in the library</Badge>
            ) : method?.category ? (
              <Badge className="border-0 text-[10px] text-white" style={{ backgroundColor: color }}>{method.category}</Badge>
            ) : null}
            {duration && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3 w-3" />{duration}</span>
            )}
          </div>
          {description && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{description}</p>}
        </div>
        <div className="mt-1 text-muted-foreground">
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </div>
      </button>

      {open && (
        <div className="space-y-4 border-t px-4 pb-4 pt-3 text-sm">
          {description && <p className="text-muted-foreground">{description}</p>}
          {method?.tasks?.length ? (
            <div>
              <SectionLabel icon={FileText}>Steps</SectionLabel>
              <ol className="space-y-1.5 text-muted-foreground">
                {method.tasks.map((t, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="font-semibold" style={{ color }}>{i + 1}.</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-3">
            {method?.whyUse && (
              <div><SectionLabel icon={Lightbulb}>Why</SectionLabel><p className="text-muted-foreground">{method.whyUse}</p></div>
            )}
            {method?.whenToUse && (
              <div><SectionLabel icon={Target}>When</SectionLabel><p className="text-muted-foreground">{method.whenToUse}</p></div>
            )}
            {method?.output && (
              <div><SectionLabel icon={Info}>Output</SectionLabel><p className="text-muted-foreground">{method.output}</p></div>
            )}
          </div>
          {method?.note && (
            <div className="rounded-md bg-amber-500/10 p-2">
              <SectionLabel icon={AlertCircle}><span className="text-amber-600">Note</span></SectionLabel>
              <p className="text-xs text-amber-700/90">{method.note}</p>
            </div>
          )}
          {method?.attributionName && (
            <p className="pt-1 text-xs text-muted-foreground">
              From {method.attributionUrl ? (
                <a href={method.attributionUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">{method.attributionName}</a>
              ) : method.attributionName} · via the Metodic library
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default function JamAgenda({ agenda, onDownload }: { agenda: ParsedJamAgenda; onDownload?: () => void }) {
  const meta = agenda.meta || {}
  const methodsById = agenda._methods || {}
  const proposedByKey: Record<string, ProposedMethod> = {}
  for (const p of agenda.proposedMethods || []) proposedByKey[p.key] = p

  // Order sprints by canonical phase order, just in case.
  const sprints = [...(agenda.sprints || [])].sort(
    (a, b) => PHASE_ORDER.indexOf(a.phase) - PHASE_ORDER.indexOf(b.phase),
  )

  const days = parseInt(meta.jamDuration || '1') || 1
  // Collect the real method titles we placed, so the Metodic architect can
  // continue the build from the same shortlist.
  const methodTitles: string[] = []
  for (const s of sprints) {
    for (const b of (s.blocks || [])) {
      const t = (b.methodId && methodsById[b.methodId]?.title) || b.title
      if (t && !methodTitles.includes(t)) methodTitles.push(t)
    }
  }
  const handoffUrl = metodicBuildUrl({
    challenge: meta.challenge || '',
    sdgLabel: meta.sdgLabel,
    durationDays: days,
    participants: meta.participants,
    difficulty: meta.difficulty,
    methods: methodTitles,
  })

  return (
    <div className="space-y-8">
      {/* Powered-by-Metodic band — the coral/cream brand zone */}
      <div
        className="flex flex-col gap-2 rounded-xl border px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between"
        style={{ borderColor: METODIC_CORAL_SOFT, background: METODIC_CREAM }}
      >
        <div className="flex items-center gap-2.5">
          <img src={METODIC_LOGO} alt="Metodic" className="h-5 w-auto object-contain" loading="lazy" />
          <span className="text-xs text-muted-foreground">
            AI facilitation methods, powered by Metodic
          </span>
        </div>
        <a
          href={handoffUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-semibold hover:underline"
          style={{ color: METODIC_CORAL }}
        >
          Open in Studio <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {/* Header */}
      <div>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <Badge className="border-0 text-white hover:opacity-90" style={{ backgroundColor: METODIC_CORAL }}><Sparkles className="mr-1 h-3 w-3" />4-Sprint Jam Agenda</Badge>
          {meta.grounded !== false && (
            <Badge variant="outline" className="text-[11px]" style={{ borderColor: METODIC_CORAL_SOFT, color: METODIC_CORAL }}><BookOpen className="mr-1 h-3 w-3" />Grounded in the Metodic method library</Badge>
          )}
        </div>
        <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
          {meta.sdgLabel ? `${meta.sdgLabel}: ` : ''}{meta.challenge || 'Your Global Goals Jam'}
        </h2>
        <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4" />{days} day{days > 1 ? 's' : ''}</span>
          {meta.participants && <span className="inline-flex items-center gap-1.5"><Users className="h-4 w-4" />{meta.participants} participants</span>}
          {meta.difficulty && <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" />{meta.difficulty}</span>}
        </div>
      </div>

      {/* 4-sprint overview strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {PHASE_ORDER.map((phase, i) => {
          const m = PHASE_META[phase]
          const Icon = m.icon
          return (
            <div key={phase} className={`rounded-xl ${m.bg} p-4 text-center`}>
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-card/70">
                <Icon className={`h-6 w-6 ${m.color}`} />
              </div>
              <div className="text-xs font-semibold">Sprint {i + 1}</div>
              <div className="text-xs text-muted-foreground">{m.label}</div>
            </div>
          )
        })}
      </div>

      {/* Overview narrative */}
      {agenda.overviewMarkdown && (
        <Card>
          <CardContent className="prose prose-sm max-w-none pt-6 dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: markdownToBasicHtml(agenda.overviewMarkdown) }}
          />
        </Card>
      )}

      {/* Sprints */}
      <div className="space-y-6">
        {sprints.map((sprint, idx) => {
          const m = PHASE_META[sprint.phase] || PHASE_META.understand
          const Icon = m.icon
          return (
            <div key={idx} className={`rounded-2xl border bg-card p-5 ring-1 ${m.ring}`}>
              <div className="mb-4 flex items-start gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${m.bg}`}>
                  <Icon className={`h-5 w-5 ${m.color}`} />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold">{sprint.title || `Sprint ${idx + 1} — ${m.label}`}</h3>
                  {sprint.objective && <p className="text-sm text-muted-foreground">{sprint.objective}</p>}
                </div>
              </div>

              <div className="space-y-3">
                {(sprint.blocks || []).map((block, bi) => {
                  const method = block.methodId ? methodsById[block.methodId] : undefined
                  const proposed = block.proposedMethodKey ? proposedByKey[block.proposedMethodKey] : undefined
                  return (
                    <div key={bi} className="flex gap-3">
                      {/* time rail */}
                      <div className="w-16 shrink-0 pt-3 text-right">
                        <div className="text-xs font-semibold tabular-nums">{block.startTime || ''}</div>
                        {block.endTime && <div className="text-[10px] text-muted-foreground tabular-nums">{block.endTime}</div>}
                      </div>
                      <div className="min-w-0 flex-1 space-y-2">
                        <GroundedMethodCard method={method} proposed={!method ? proposed : undefined} />
                        {block.rationale && (
                          <p className="border-l-2 border-primary/30 pl-3 text-xs italic text-muted-foreground">
                            {block.rationale}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Metodic handoff — the funnel (coral brand zone) */}
      <div
        className="rounded-2xl border p-6 sm:p-7"
        style={{ borderColor: METODIC_CORAL_SOFT, background: `linear-gradient(135deg, ${METODIC_CREAM}, hsl(0 0% 100%))` }}
      >
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-xl">
            <div className="mb-2 flex items-center gap-2">
              <img src={METODIC_LOGO} alt="Metodic" className="h-4 w-auto object-contain" loading="lazy" />
              <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide" style={{ backgroundColor: METODIC_CORAL_SOFT, color: METODIC_CORAL }}>
                Next step
              </span>
            </div>
            <h3 className="font-display text-lg font-bold tracking-tight sm:text-xl">Continue building in Metodic Studio</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Open this agenda in Metodic's Studio — the AI architect picks up your brief and shortlisted
              methods, then turns them into facilitator guides, worksheets and slides you can run live.
            </p>
          </div>
          <a
            href={handoffUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
            style={{ backgroundColor: METODIC_CORAL }}
          >
            Open in Metodic Studio <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>

      {/* Secondary actions */}
      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center">
        {onDownload && (
          <Button variant="outline" onClick={onDownload}>
            <Download className="mr-2 h-4 w-4" />Download agenda (HTML)
          </Button>
        )}
        <Button asChild variant="ghost" style={{ color: METODIC_CORAL }}>
          <a href={handoffUrl} target="_blank" rel="noopener noreferrer">
            Continue in Metodic Studio <ArrowRight className="ml-2 h-4 w-4" />
          </a>
        </Button>
      </div>
    </div>
  )
}
