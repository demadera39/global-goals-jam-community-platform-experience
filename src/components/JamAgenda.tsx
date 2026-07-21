import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import {
  Target, Lightbulb, Zap, TrendingUp, Clock, Users, MapPin,
  ChevronDown, ChevronRight, ExternalLink, Sparkles, ArrowRight, Download, BookOpen,
  FileText, Info, AlertCircle, ArrowLeftRight, Trash2, Send, RotateCcw, Search, Loader2,
} from 'lucide-react'
import { markdownToBasicHtml } from '../lib/toolkitExport'
import { metodicBuildUrl } from './MetodicUpsell'
import { fetchMethods, type MetodicMethod, type SprintPhase } from '../lib/metodicMethods'

// ————————————————————————————————————————————————————————————————————————
// GGJ Jam Studio (mini) — the agenda rendered the way Metodic's Session
// Studio renders it (thin phase-colour bar · mono time rail · compact rows ·
// hover actions), skinned in GGJ's poster language. Light edits happen here
// (swap a method, retime a block, remove one); CONVERSATIONAL editing is the
// deliberate hand-off to Metodic's real Session Studio — the chat bar at the
// bottom is the funnel, not a feature.
// ————————————————————————————————————————————————————————————————————————

// Metodic brand tokens — scoped to the "powered by / continue in Metodic"
// zones so the studio itself stays GGJ-green.
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

// The four official GGJ sprint colours (SDG 6/7/9/3 hues) — the design
// language's canon, replacing the old sky/amber/violet/green approximation.
const PHASE_META: Record<SprintPhase, { label: string; icon: any; hex: string }> = {
  understand: { label: 'Understand', icon: Target, hex: '#26BDE2' },
  define: { label: 'Define', icon: Lightbulb, hex: '#FCC30B' },
  prototype: { label: 'Prototype', icon: Zap, hex: '#FD6925' },
  implement: { label: 'Implement', icon: TrendingUp, hex: '#4C9F38' },
}
const PHASE_ORDER: SprintPhase[] = ['understand', 'define', 'prototype', 'implement']

// —— time helpers ————————————————————————————————————————————————————————
const toMin = (t?: string): number | null => {
  if (!t) return null
  const m = /^(\d{1,2}):(\d{2})$/.exec(t.trim())
  return m ? parseInt(m[1]) * 60 + parseInt(m[2]) : null
}
const toHHMM = (min: number): string => {
  const h = Math.floor(min / 60) % 24
  const m = min % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}
function blockMinutes(b: JamBlock, method?: MetodicMethod): number {
  const s = toMin(b.startTime); const e = toMin(b.endTime)
  if (s != null && e != null && e > s) return e - s
  const fromLabel = /(\d+)/.exec(b.duration || '')
  if (fromLabel) return parseInt(fromLabel[1])
  return method?.durationMin || 30
}
/** Re-flow start/end times inside one sprint after an edit, keeping the
 *  sprint's original starting time as the anchor. */
function reflowSprint(sprint: JamSprint, methods: Record<string, MetodicMethod>): JamSprint {
  const anchor = toMin(sprint.blocks[0]?.startTime)
  if (anchor == null) return sprint
  let cursor = anchor
  const blocks = sprint.blocks.map((b) => {
    const mins = blockMinutes(b, b.methodId ? methods[b.methodId] : undefined)
    const nb = { ...b, startTime: toHHMM(cursor), endTime: toHHMM(cursor + mins) }
    cursor += mins
    return nb
  })
  return { ...sprint, blocks }
}

function MethodIcon({ icon, color }: { icon?: string | null; color: string }) {
  // Iconify icons the way Metodic renders them; graceful FileText fallback.
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
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg [&_svg]:h-5 [&_svg]:w-5"
      style={{ backgroundColor: `${color}1f`, color }}
    >
      {svg ? <div dangerouslySetInnerHTML={{ __html: svg }} /> : <FileText className="h-4 w-4" />}
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

/** Expanded method detail under a row — the same content Metodic shows in its
 *  block drawer, condensed. */
function MethodDetail({ method, proposed, color }: { method?: MetodicMethod; proposed?: ProposedMethod; color: string }) {
  const description = method?.description || proposed?.description || ''
  return (
    <div className="space-y-4 rounded-b-lg border-x border-b bg-muted/20 px-4 pb-4 pt-3 text-sm">
      {description && <p className="text-muted-foreground">{description}</p>}
      {method?.tasks?.length ? (
        <div>
          <SectionLabel icon={FileText}>Steps</SectionLabel>
          <ol className="space-y-1.5 text-muted-foreground">
            {method.tasks.map((t, i) => (
              <li key={i} className="flex gap-2">
                <span className="font-semibold tabular-nums" style={{ color }}>{i + 1}.</span>
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
  )
}

/** The swap picker — same-phase methods from the (cached) Metodic catalog. */
function SwapPicker({
  phase, currentId, challenge, sdgFocus, onPick, children,
}: {
  phase: SprintPhase
  currentId: string | null
  challenge: string
  sdgFocus?: string
  onPick: (m: MetodicMethod) => void
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [loadingList, setLoadingList] = useState(false)
  const [candidates, setCandidates] = useState<MetodicMethod[] | null>(null)
  const [q, setQ] = useState('')

  const load = async () => {
    if (candidates) return
    setLoadingList(true)
    try {
      const { methods } = await fetchMethods({ challenge, sdgFocus, language: 'en' })
      setCandidates(methods)
    } catch { setCandidates([]) }
    finally { setLoadingList(false) }
  }

  const shown = (candidates || [])
    .filter((m) => m.suggestedPhase === phase && m.id !== currentId)
    .filter((m) => !q || m.title.toLowerCase().includes(q.toLowerCase()) || m.category.toLowerCase().includes(q.toLowerCase()))
    .slice(0, 30)

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (o) load() }}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b p-2">
          <div className="flex items-center gap-2 rounded-md bg-muted px-2 py-1.5">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={`Swap for another ${PHASE_META[phase].label} method…`}
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>
        <div className="max-h-72 overflow-y-auto p-1.5">
          {loadingList && (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading the Metodic library…
            </div>
          )}
          {!loadingList && shown.length === 0 && (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">No matching methods.</p>
          )}
          {shown.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => { onPick(m); setOpen(false) }}
              className="flex w-full items-start gap-2.5 rounded-md px-2 py-2 text-left transition-colors hover:bg-muted"
            >
              <span className="mt-1 h-5 w-[3px] shrink-0 rounded-sm" style={{ backgroundColor: PHASE_META[phase].hex }} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium">{m.title}</span>
                <span className="block truncate text-[11px] text-muted-foreground">{m.category}{m.durationLabel ? ` · ${m.durationLabel}` : ''}</span>
              </span>
            </button>
          ))}
        </div>
        <p className="border-t px-3 py-2 text-[10px] uppercase tracking-wide text-muted-foreground">Metodic method library</p>
      </PopoverContent>
    </Popover>
  )
}

export default function JamAgenda({
  agenda, onDownload, onChange,
}: {
  agenda: ParsedJamAgenda
  onDownload?: () => void
  /** When provided, the studio's light edits (swap / retime / remove) are on
   *  and each edit emits the full updated agenda for persistence. */
  onChange?: (updated: ParsedJamAgenda) => void
}) {
  const meta = agenda.meta || {}
  const editable = !!onChange

  // Local working copy so edits render instantly; the original is kept for
  // one-tap restore.
  const original = useRef<ParsedJamAgenda>(agenda)
  const [working, setWorking] = useState<ParsedJamAgenda>(agenda)
  const [dirty, setDirty] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [editingDur, setEditingDur] = useState<string | null>(null)
  const [draftDur, setDraftDur] = useState('')
  const [funnelOpen, setFunnelOpen] = useState(false)
  const [chatDraft, setChatDraft] = useState('')

  const methodsById = working._methods || {}
  const proposedByKey: Record<string, ProposedMethod> = {}
  for (const p of working.proposedMethods || []) proposedByKey[p.key] = p

  const sprints = [...(working.sprints || [])].sort(
    (a, b) => PHASE_ORDER.indexOf(a.phase) - PHASE_ORDER.indexOf(b.phase),
  )

  const days = parseInt(meta.jamDuration || '1') || 1
  const totalMin = sprints.reduce((acc, s) =>
    acc + (s.blocks || []).reduce((a, b) => a + blockMinutes(b, b.methodId ? methodsById[b.methodId] : undefined), 0), 0)

  const methodTitles: string[] = []
  for (const s of sprints) for (const b of (s.blocks || [])) {
    const t = (b.methodId && methodsById[b.methodId]?.title) || b.title
    if (t && !methodTitles.includes(t)) methodTitles.push(t)
  }
  const handoffUrl = metodicBuildUrl({
    challenge: meta.challenge || '',
    sdgLabel: meta.sdgLabel,
    durationDays: days,
    participants: meta.participants,
    difficulty: meta.difficulty,
    methods: methodTitles,
  })

  // —— edit plumbing ——
  const commit = (next: ParsedJamAgenda) => {
    setWorking(next)
    setDirty(true)
    onChange?.(next)
  }
  const updateSprint = (phase: SprintPhase, updater: (s: JamSprint) => JamSprint) => {
    const next = {
      ...working,
      sprints: (working.sprints || []).map((s) => (s.phase === phase ? reflowSprint(updater(s), methodsById) : s)),
    }
    commit(next)
  }
  const swapMethod = (phase: SprintPhase, bi: number, m: MetodicMethod) => {
    const withMethod = { ...working, _methods: { ...(working._methods || {}), [m.id]: m } }
    const next = {
      ...withMethod,
      sprints: (withMethod.sprints || []).map((s) => {
        if (s.phase !== phase) return s
        const blocks = s.blocks.map((b, i) => (i === bi
          ? { ...b, methodId: m.id, proposedMethodKey: null, title: m.title, duration: m.durationLabel || b.duration }
          : b))
        return reflowSprint({ ...s, blocks }, withMethod._methods!)
      }),
    }
    commit(next)
  }
  const removeBlock = (phase: SprintPhase, bi: number) =>
    updateSprint(phase, (s) => ({ ...s, blocks: s.blocks.filter((_, i) => i !== bi) }))
  const setDuration = (phase: SprintPhase, bi: number, mins: number) =>
    updateSprint(phase, (s) => ({
      ...s,
      blocks: s.blocks.map((b, i) => (i === bi
        ? { ...b, duration: `${mins} min`, endTime: undefined, startTime: i === 0 ? b.startTime : undefined }
        : b)),
    }))
  const restore = () => {
    setWorking(original.current)
    setDirty(false)
    onChange?.(original.current)
  }

  const funnelChips = [
    'Make the afternoon shorter',
    'Add an energizer after lunch',
    'More beginner-friendly methods',
    'Turn this into facilitator guides',
  ]

  return (
    <div className="space-y-6">
      {/* Powered-by band */}
      <div
        className="flex flex-col gap-2 rounded-xl border px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between"
        style={{ borderColor: METODIC_CORAL_SOFT, background: METODIC_CREAM }}
      >
        <div className="flex items-center gap-2.5">
          <img src={METODIC_LOGO} alt="Metodic" className="h-5 w-auto object-contain" loading="lazy" />
          <span className="text-xs text-muted-foreground">AI facilitation methods, powered by Metodic</span>
        </div>
        <a
          href={handoffUrl} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-semibold hover:underline"
          style={{ color: METODIC_CORAL }}
        >
          Open in Session Studio <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {/* ——— The studio panel ——— */}
      <div className="overflow-hidden rounded-2xl border bg-card shadow-soft">
        {/* Studio header */}
        <div className="border-b bg-muted/30 px-5 py-4 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/70">
                Jam Studio <span className="text-muted-foreground/60">· mini</span>
              </p>
              <h2 className="mt-1 truncate font-display text-xl font-extrabold tracking-tight sm:text-2xl">
                {meta.sdgLabel ? `${meta.sdgLabel}: ` : ''}{meta.challenge || 'Your Global Goals Jam'}
              </h2>
              <div className="mt-1.5 flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{days} day{days > 1 ? 's' : ''} · <span className="font-mono tabular-nums">{Math.floor(totalMin / 60)}h{totalMin % 60 ? ` ${totalMin % 60}m` : ''}</span></span>
                {meta.participants && <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" />{meta.participants}</span>}
                {meta.difficulty && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{meta.difficulty}</span>}
                {meta.grounded !== false && (
                  <span className="inline-flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" />real methods</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {dirty && (
                <>
                  <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">Edited</Badge>
                  <Button size="sm" variant="ghost" onClick={restore} className="h-7 px-2 text-xs">
                    <RotateCcw className="mr-1 h-3 w-3" />Restore
                  </Button>
                </>
              )}
              {onDownload && (
                <Button size="sm" variant="outline" onClick={onDownload} className="h-7 px-2.5 text-xs">
                  <Download className="mr-1 h-3 w-3" />Download
                </Button>
              )}
            </div>
          </div>
          {/* sprint legend */}
          <div className="mt-3 flex flex-wrap gap-2">
            {PHASE_ORDER.map((phase, i) => {
              const m = PHASE_META[phase]
              return (
                <span key={phase} className="inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-1 text-[11px] font-medium" style={{ borderColor: `${m.hex}55`, color: m.hex, backgroundColor: `${m.hex}10` }}>
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: m.hex }} />
                  Sprint {i + 1} · {m.label}
                </span>
              )
            })}
          </div>
        </div>

        {/* Sprint sections with Metodic-style rows */}
        <div className="divide-y">
          {sprints.map((sprint) => {
            const m = PHASE_META[sprint.phase] || PHASE_META.understand
            const Icon = m.icon
            return (
              <div key={sprint.phase} className="px-3 py-4 sm:px-5">
                <div className="mb-2 flex items-start gap-2.5 px-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: `${m.hex}1f` }}>
                    <Icon className="h-4 w-4" style={{ color: m.hex }} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-display text-[15px] font-bold leading-tight">{sprint.title || m.label}</h3>
                    {sprint.objective && <p className="text-xs text-muted-foreground">{sprint.objective}</p>}
                  </div>
                </div>

                <div className="space-y-0.5">
                  {(sprint.blocks || []).map((block, bi) => {
                    const method = block.methodId ? methodsById[block.methodId] : undefined
                    const proposed = block.proposedMethodKey ? proposedByKey[block.proposedMethodKey] : undefined
                    const key = `${sprint.phase}-${bi}`
                    const isOpen = expanded === key
                    const mins = blockMinutes(block, method)
                    const title = method?.title || proposed?.title || block.title
                    return (
                      <div key={key}>
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => setExpanded(isOpen ? null : key)}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpanded(isOpen ? null : key) } }}
                          className={`group flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors ${isOpen ? 'rounded-b-none border-border bg-muted/40' : 'border-transparent hover:bg-muted/50'}`}
                        >
                          <span aria-hidden="true" className="h-6 w-[3px] shrink-0 rounded-sm" style={{ backgroundColor: m.hex }} />
                          <span className="w-11 shrink-0 font-mono text-[12.5px] tabular-nums text-muted-foreground">
                            {block.startTime || ''}
                          </span>
                          <span className="flex min-w-0 flex-1 flex-col">
                            <span className="flex min-w-0 items-center gap-2">
                              <span className="truncate text-[13.5px] font-medium text-foreground">{title}</span>
                              <span className="hidden shrink-0 text-[11.5px] text-muted-foreground/80 sm:inline">· {method?.category || m.label}</span>
                              {proposed && (
                                <span className="shrink-0 rounded-sm bg-amber-500/15 px-1.5 py-px text-[10px] font-medium uppercase tracking-wide text-amber-700">Proposed</span>
                              )}
                            </span>
                            {block.rationale && !isOpen && (
                              <span className="hidden truncate text-[11.5px] text-muted-foreground sm:block">{block.rationale}</span>
                            )}
                          </span>

                          {/* duration — click-to-edit in editable mode */}
                          {editable && editingDur === key ? (
                            <span className="shrink-0 inline-flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="number" min={5} step={5} autoFocus value={draftDur}
                                onChange={(e) => setDraftDur(e.target.value)}
                                onBlur={() => { const v = parseInt(draftDur); if (v >= 5) setDuration(sprint.phase, bi, v); setEditingDur(null) }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') { e.preventDefault(); const v = parseInt(draftDur); if (v >= 5) setDuration(sprint.phase, bi, v); setEditingDur(null) }
                                  else if (e.key === 'Escape') { e.preventDefault(); setEditingDur(null) }
                                }}
                                className="h-6 w-14 rounded-sm border bg-background px-1 text-right font-mono text-[12px] tabular-nums focus:outline-none focus:ring-1 focus:ring-primary"
                              />
                              <span className="font-mono text-[12px] text-muted-foreground">min</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); if (editable) { setDraftDur(String(mins)); setEditingDur(key) } }}
                              className={`shrink-0 font-mono text-[12px] tabular-nums text-muted-foreground ${editable ? 'rounded-sm px-1 -mx-1 decoration-dotted underline-offset-[3px] hover:bg-muted hover:text-foreground hover:underline' : ''}`}
                              title={editable ? 'Click to edit duration' : undefined}
                            >
                              {mins} min
                            </button>
                          )}

                          {/* hover actions */}
                          {editable && (
                            <span className="flex shrink-0 items-center" onClick={(e) => e.stopPropagation()}>
                              <SwapPicker
                                phase={sprint.phase}
                                currentId={block.methodId}
                                challenge={meta.challenge || ''}
                                sdgFocus={meta.sdgFocus}
                                onPick={(picked) => swapMethod(sprint.phase, bi, picked)}
                              >
                                <button
                                  type="button" title="Swap method"
                                  className="rounded-md p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
                                >
                                  <ArrowLeftRight className="h-3.5 w-3.5" />
                                </button>
                              </SwapPicker>
                              <button
                                type="button" title="Remove activity"
                                onClick={() => { if (confirm('Remove this activity from the agenda?')) removeBlock(sprint.phase, bi) }}
                                className="rounded-md p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </span>
                          )}
                          <span className="shrink-0 text-muted-foreground">
                            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </span>
                        </div>
                        {isOpen && (
                          <div className="flex gap-3 pl-0">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-3 border-x border-t-0 bg-muted/20 px-4 pt-3">
                                <MethodIcon icon={method?.icon} color={proposed ? '#f59e0b' : m.hex} />
                                <div className="min-w-0">
                                  <span className="block truncate text-sm font-semibold">{title}</span>
                                  {method?.durationLabel && <span className="text-xs text-muted-foreground">{method.durationLabel}</span>}
                                </div>
                              </div>
                              <MethodDetail method={method} proposed={!method ? proposed : undefined} color={proposed ? '#f59e0b' : m.hex} />
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {/* ——— Chat bar: the funnel to the real Session Studio ——— */}
        <div className="border-t bg-muted/20 px-4 py-4 sm:px-6">
          <div className="mb-2.5 flex flex-wrap gap-1.5">
            {funnelChips.map((chip) => (
              <button
                key={chip} type="button"
                onClick={() => { setChatDraft(chip); setFunnelOpen(true) }}
                className="rounded-pill border bg-card px-2.5 py-1 text-[11px] text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
              >
                “{chip}”
              </button>
            ))}
          </div>
          <div
            role="button" tabIndex={0}
            onClick={() => setFunnelOpen(true)}
            onKeyDown={(e) => { if (e.key === 'Enter') setFunnelOpen(true) }}
            className="flex cursor-text items-center gap-2.5 rounded-xl border bg-card px-3.5 py-2.5 shadow-sm transition focus-within:ring-1 focus-within:ring-primary hover:border-primary/40"
          >
            <Sparkles className="h-4 w-4 shrink-0" style={{ color: METODIC_CORAL }} />
            <input
              value={chatDraft}
              onChange={(e) => setChatDraft(e.target.value)}
              onFocus={() => setFunnelOpen(true)}
              placeholder="Ask for changes — the AI architect edits your agenda in conversation…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <Button size="sm" className="h-7 shrink-0 rounded-pill px-3 text-xs text-white" style={{ backgroundColor: METODIC_CORAL }} onClick={(e) => { e.stopPropagation(); setFunnelOpen(true) }}>
              <Send className="mr-1 h-3 w-3" />Send
            </Button>
          </div>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            Conversational editing happens in your very own Session Studio in <span className="font-semibold" style={{ color: METODIC_CORAL }}>Metodic</span> — free to start.
          </p>
        </div>
      </div>

      {/* Overview narrative */}
      {working.overviewMarkdown && (
        <div className="rounded-2xl border bg-card p-6">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/70">About this jam</p>
          <div className="prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: markdownToBasicHtml(working.overviewMarkdown) }} />
        </div>
      )}

      {/* Funnel dialog — the deliberate hand-off */}
      <Dialog open={funnelOpen} onOpenChange={setFunnelOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mb-1 flex items-center gap-2">
              <img src={METODIC_LOGO} alt="Metodic" className="h-4 w-auto object-contain" />
              <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide" style={{ backgroundColor: METODIC_CORAL_SOFT, color: METODIC_CORAL }}>Session Studio</span>
            </div>
            <DialogTitle className="font-display">Continue in your own Session Studio</DialogTitle>
            <DialogDescription>
              {chatDraft ? <>“{chatDraft}” — exactly the kind of request the AI architect handles. </> : null}
              Your agenda and shortlisted methods carry over; Metodic picks up right where this leaves off.
            </DialogDescription>
          </DialogHeader>
          <ul className="space-y-2 text-sm">
            {[
              'Edit the agenda in conversation — retime, swap, restructure',
              'Generate facilitator guides, worksheets and slides',
              'Print-ready method card decks',
              'Run the session live, with timers and materials',
            ].map((line) => (
              <li key={line} className="flex items-start gap-2">
                <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: METODIC_CORAL }} />
                <span>{line}</span>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex flex-col gap-2">
            <a
              href={handoffUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
              style={{ backgroundColor: METODIC_CORAL }}
            >
              Open Metodic Session Studio — free sign-up <ExternalLink className="h-4 w-4" />
            </a>
            <Button variant="ghost" onClick={() => setFunnelOpen(false)} className="text-muted-foreground">Maybe later</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Secondary hand-off strip (kept compact — the chat bar is the funnel) */}
      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center">
        <Button asChild variant="ghost" style={{ color: METODIC_CORAL }}>
          <a href={handoffUrl} target="_blank" rel="noopener noreferrer">
            Continue in Metodic Session Studio <ArrowRight className="ml-2 h-4 w-4" />
          </a>
        </Button>
      </div>
    </div>
  )
}
