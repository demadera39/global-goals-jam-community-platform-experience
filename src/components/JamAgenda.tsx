import { useState } from 'react'
import { Card, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import {
  Target, Lightbulb, Zap, TrendingUp, Clock, Users, MapPin,
  ChevronDown, ChevronRight, ExternalLink, Sparkles, ArrowRight, Download, BookOpen,
} from 'lucide-react'
import { markdownToBasicHtml } from '../lib/toolkitExport'
import { metodicSparkUrl } from './MetodicUpsell'
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

function GroundedMethodCard({ method, proposed }: { method?: MetodicMethod; proposed?: ProposedMethod }) {
  const [open, setOpen] = useState(false)
  const title = method?.title || proposed?.title || 'Activity'
  const description = method?.description || proposed?.description || ''
  const duration = method?.durationLabel || ''
  return (
    <div className="rounded-lg border bg-card">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-start gap-3 p-3 text-left"
      >
        <div className="mt-0.5 text-muted-foreground">
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{title}</span>
            {proposed && (
              <Badge variant="outline" className="border-amber-300 text-amber-700 text-[10px]">Proposed — not yet in the library</Badge>
            )}
            {method?.category && (
              <Badge variant="secondary" className="text-[10px]">{method.category}</Badge>
            )}
            {duration && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3 w-3" />{duration}</span>
            )}
          </div>
          {description && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{description}</p>}
        </div>
      </button>

      {open && (
        <div className="space-y-3 border-t px-4 pb-4 pt-3 text-sm">
          {description && <p className="text-muted-foreground">{description}</p>}
          {method?.tasks?.length ? (
            <div>
              <p className="mb-1 font-semibold">How to run it</p>
              <ol className="list-decimal space-y-1 pl-5 text-muted-foreground">
                {method.tasks.map((t, i) => <li key={i}>{t}</li>)}
              </ol>
            </div>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-3">
            {method?.whenToUse && (
              <div><p className="font-semibold text-foreground">When to use</p><p className="text-muted-foreground">{method.whenToUse}</p></div>
            )}
            {method?.whyUse && (
              <div><p className="font-semibold text-foreground">Why it works</p><p className="text-muted-foreground">{method.whyUse}</p></div>
            )}
            {method?.output && (
              <div><p className="font-semibold text-foreground">Output</p><p className="text-muted-foreground">{method.output}</p></div>
            )}
          </div>
          {method?.attributionName && (
            <p className="pt-1 text-xs text-muted-foreground">
              Method from the Metodic library · {method.attributionUrl ? (
                <a href={method.attributionUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">{method.attributionName}</a>
              ) : method.attributionName}
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
  const handoffUrl = metodicSparkUrl({
    workshopTitle: meta.challenge ? `${meta.sdgLabel ? meta.sdgLabel + ' — ' : ''}${meta.challenge}` : 'Global Goals Jam',
    challenge: meta.challenge || '',
    sdgLabel: meta.sdgLabel,
    durationDays: days,
    participants: meta.participants || '',
    difficulty: meta.difficulty,
    localContext: undefined,
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
          Build in Metodic <ExternalLink className="h-3 w-3" />
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
            <h3 className="font-display text-lg font-bold tracking-tight sm:text-xl">Build the full toolkit in Metodic</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">
              This agenda is your starting point. Open it in Metodic to turn each method into facilitator
              guides, participant worksheets and presentation slides — then run it live and track your jam.
            </p>
          </div>
          <a
            href={handoffUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
            style={{ backgroundColor: METODIC_CORAL }}
          >
            Build in Metodic <ExternalLink className="h-4 w-4" />
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
            Continue in Metodic <ArrowRight className="ml-2 h-4 w-4" />
          </a>
        </Button>
      </div>
    </div>
  )
}
