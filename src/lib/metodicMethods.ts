// Cross-project retrieval of Metodic's real facilitation-method library.
//
// The GGJ toolkit generator grounds its agendas in Metodic's curated method
// database instead of letting the AI invent generic methods. Metodic's
// `domain_toolkit_methods` table is public-read (RLS: SELECT where is_active),
// so we can fetch it with a plain anon key — no auth, no credits.
//
// We deliberately use a bare `fetch` (not the GGJ supabase client) so this
// cross-project concern stays isolated and never touches GGJ's auth session.

const METODIC_URL =
  (import.meta.env.VITE_METODIC_SUPABASE_URL as string | undefined) ||
  'https://sjqautbrynptqfeziocu.supabase.co'

// Public, read-only anon key (safe to ship — it only grants RLS-scoped reads).
const METODIC_ANON_KEY =
  (import.meta.env.VITE_METODIC_ANON_KEY as string | undefined) ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqcWF1dGJyeW5wdHFmZXppb2N1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMjA4NjcsImV4cCI6MjA3ODY5Njg2N30.h2pJSq3C6n6cxwuPRQPCJ2Oah4aBfrDi28E9EGyIg-E'

export type SprintPhase = 'understand' | 'define' | 'prototype' | 'implement'

export interface MetodicMethod {
  id: string
  toolkitSlug: string
  toolkitName: string
  attributionName: string | null
  attributionUrl: string | null
  title: string
  description: string
  icon: string | null
  category: string
  categoryColor: string | null
  durationLabel: string | null
  durationMin: number | null
  durationMax: number | null
  tasks: string[]
  whenToUse: string | null
  whyUse: string | null
  output: string | null
  note: string | null
  nextSteps: string | null
  reference: string | null
  language: string
  /** Derived client-side hint for which GGJ sprint this method best fits. */
  suggestedPhase: SprintPhase
}

/** Compact record handed to the AI so it can SELECT (not invent) methods. */
export interface CatalogEntry {
  id: string
  title: string
  category: string
  phase: SprintPhase
  duration: string
  description: string
}

export interface FetchMethodsResult {
  methods: MetodicMethod[]
  /** false when we fell back to the bundled set (Metodic unreachable). */
  grounded: boolean
}

// Verified real slugs in Metodic's table (note: no hyphens on the two compound ones).
const SLUGS = {
  sdg: 'sdg',
  design: 'design',
  behavioralChange: 'behavioralchange',
  strategicForesight: 'strategicforesight',
  teamAlignment: 'team-alignment',
  culturalIntelligence: 'cultural-intelligence',
  productLifecycle: 'product-lifecycle',
} as const

// category (per slug) → GGJ sprint phase. Used as a hint, not a hard rule.
// The AI makes the final placement; this just nudges + powers fallback ordering.
const CATEGORY_PHASE: Record<string, SprintPhase> = {
  // sdg
  'Goal Cards': 'define',
  'Systems Lenses': 'understand',
  'Scale & Context': 'implement',
  'Technology & Future': 'implement',
  // design (double diamond)
  Research: 'understand',
  'Know User': 'understand',
  'Frame Insights': 'define',
  'Define Intentions': 'define',
  'Ideation & Concepts': 'prototype',
  'Prototype & Test': 'prototype',
  // behavioralchange
  Diagnosis: 'understand',
  Nudges: 'prototype',
  Habits: 'prototype',
  Ethics: 'implement',
  // strategicforesight
  Scanning: 'understand',
  Scenarios: 'define',
  'Stress-Testing': 'prototype',
  Readiness: 'implement',
  // team-alignment
  Foundation: 'understand',
  Safety: 'understand',
  Rituals: 'prototype',
  Evolution: 'implement',
  // cultural-intelligence
  'The Self': 'understand',
  'The Team': 'understand',
  'The Map': 'define',
  'The Bridge': 'prototype',
  // product-lifecycle
  Discovery: 'understand',
  Growth: 'define',
  Launch: 'prototype',
  Sustain: 'implement',
}

export function mapCategoryToPhase(category: string | null | undefined): SprintPhase {
  if (!category) return 'implement'
  return CATEGORY_PHASE[category] || 'implement'
}

/**
 * Pick which Metodic toolkits to pull for a given jam. Always include the SDG
 * toolkit (goal cards + systems lenses) and the core Design toolkit (covers all
 * four sprints), plus at most one thematic toolkit matched from the challenge.
 */
export function getRelevantSlugs(challenge: string): string[] {
  const slugs: string[] = [SLUGS.sdg, SLUGS.design]
  const c = (challenge || '').toLowerCase()
  const add = (s: string) => {
    if (!slugs.includes(s)) slugs.push(s)
  }
  if (/\b(future|foresight|scenario|trend|long[- ]?term|anticipat)/.test(c)) add(SLUGS.strategicForesight)
  else if (/\b(behaviou?r|habit|nudge|adopt|change people|mindset)/.test(c)) add(SLUGS.behavioralChange)
  else if (/\b(team|organi[sz]ation|culture|collaborat|stakeholder align)/.test(c)) add(SLUGS.teamAlignment)
  else if (/\b(global|cross[- ]?cultural|inclusi|divers|migrat|communit)/.test(c)) add(SLUGS.culturalIntelligence)
  else if (/\b(product|service|launch|lifecycle|business model|scal)/.test(c)) add(SLUGS.productLifecycle)
  return slugs.slice(0, 3)
}

const SELECT_COLUMNS = [
  'id', 'toolkit_slug', 'toolkit_name', 'attribution_name', 'attribution_url',
  'title', 'description', 'icon', 'category', 'category_color', 'duration_label',
  'duration_min', 'duration_max', 'tasks', 'when_to_use', 'why_use', 'output',
  'note', 'next_steps', 'reference', 'language', 'display_order',
].join(',')

function mapRow(row: any): MetodicMethod {
  const tasks = Array.isArray(row.tasks)
    ? row.tasks.map((t: any) => String(t))
    : typeof row.tasks === 'string'
      ? (() => { try { const p = JSON.parse(row.tasks); return Array.isArray(p) ? p.map(String) : [] } catch { return [] } })()
      : []
  return {
    id: String(row.id),
    toolkitSlug: row.toolkit_slug,
    toolkitName: row.toolkit_name,
    attributionName: row.attribution_name ?? null,
    attributionUrl: row.attribution_url ?? null,
    title: row.title,
    description: row.description,
    icon: row.icon ?? null,
    category: row.category,
    categoryColor: row.category_color ?? null,
    durationLabel: row.duration_label ?? null,
    durationMin: row.duration_min ?? null,
    durationMax: row.duration_max ?? null,
    tasks,
    whenToUse: row.when_to_use ?? null,
    whyUse: row.why_use ?? null,
    output: row.output ?? null,
    note: row.note ?? null,
    nextSteps: row.next_steps ?? null,
    reference: row.reference ?? null,
    language: row.language || 'en',
    suggestedPhase: mapCategoryToPhase(row.category),
  }
}

// ---- caching -------------------------------------------------------------

const memCache = new Map<string, MetodicMethod[]>()
const TTL_MS = 24 * 60 * 60 * 1000
const lsKey = (cacheKey: string) => `ggj_metodic_methods_v1:${cacheKey}`

function readLocal(cacheKey: string): MetodicMethod[] | null {
  try {
    const raw = localStorage.getItem(lsKey(cacheKey))
    if (!raw) return null
    const parsed = JSON.parse(raw) as { ts: number; data: MetodicMethod[] }
    if (!parsed?.ts || Date.now() - parsed.ts > TTL_MS) return null
    return Array.isArray(parsed.data) ? parsed.data : null
  } catch {
    return null
  }
}

function writeLocal(cacheKey: string, data: MetodicMethod[]) {
  try {
    localStorage.setItem(lsKey(cacheKey), JSON.stringify({ ts: Date.now(), data }))
  } catch {
    /* quota / private mode — ignore */
  }
}

// ---- fetch ---------------------------------------------------------------

export async function fetchMethods(opts: {
  challenge: string
  sdgFocus?: string
  language?: string
}): Promise<FetchMethodsResult> {
  const language = opts.language || 'en'
  const slugs = getRelevantSlugs(opts.challenge)
  const cacheKey = `${slugs.join(',')}|${language}`

  if (memCache.has(cacheKey)) return { methods: memCache.get(cacheKey)!, grounded: true }
  const local = readLocal(cacheKey)
  if (local) {
    memCache.set(cacheKey, local)
    return { methods: local, grounded: true }
  }

  try {
    const url =
      `${METODIC_URL}/rest/v1/domain_toolkit_methods` +
      `?toolkit_slug=in.(${slugs.join(',')})` +
      `&is_active=eq.true&language=eq.${encodeURIComponent(language)}` +
      `&select=${encodeURIComponent(SELECT_COLUMNS)}` +
      `&order=display_order.asc`

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 12_000)
    const res = await fetch(url, {
      headers: { apikey: METODIC_ANON_KEY, Authorization: `Bearer ${METODIC_ANON_KEY}` },
      signal: controller.signal,
    })
    clearTimeout(timer)
    if (!res.ok) throw new Error(`Metodic methods fetch failed: ${res.status}`)
    const rows = (await res.json()) as any[]
    const methods = rows.map(mapRow)
    if (methods.length === 0) throw new Error('Metodic returned no methods')
    memCache.set(cacheKey, methods)
    writeLocal(cacheKey, methods)
    return { methods, grounded: true }
  } catch (e) {
    console.warn('[metodicMethods] falling back to bundled methods:', e)
    return { methods: FALLBACK_METHODS, grounded: false }
  }
}

/** Strip heavy fields so the AI catalog stays small (it only needs to select). */
export function toCatalogForPrompt(methods: MetodicMethod[]): CatalogEntry[] {
  return methods.map((m) => ({
    id: m.id,
    title: m.title,
    category: m.category,
    phase: m.suggestedPhase,
    duration: m.durationLabel || (m.durationMin ? `${m.durationMin}-${m.durationMax || m.durationMin} min` : '—'),
    description: (m.description || '').slice(0, 240),
  }))
}

export function indexById(methods: MetodicMethod[]): Record<string, MetodicMethod> {
  const out: Record<string, MetodicMethod> = {}
  for (const m of methods) out[m.id] = m
  return out
}

// ---- offline fallback (one real GGJ-style method per sprint) -------------

export const FALLBACK_METHODS: MetodicMethod[] = [
  {
    id: 'fallback_understand', toolkitSlug: 'sdg', toolkitName: 'GGJ Core',
    attributionName: 'Global Goals Jam', attributionUrl: 'https://globalgoalsjam.org',
    title: 'System & Stakeholder Map', description: 'Map the people, forces and feedback loops around your challenge to find the real leverage points.',
    icon: null, category: 'Systems Lenses', categoryColor: null, durationLabel: '45-60 min',
    durationMin: 45, durationMax: 60,
    tasks: ['List everyone affected by the challenge', 'Map how they connect and influence each other', 'Mark tensions, gaps and feedback loops', 'Circle the highest-leverage points to act on'],
    whenToUse: 'Sprint 1, to understand the system before defining a direction', whyUse: 'To act on root causes, not symptoms',
    output: 'A stakeholder/system map with leverage points', note: null, nextSteps: null, reference: null, language: 'en', suggestedPhase: 'understand',
  },
  {
    id: 'fallback_define', toolkitSlug: 'sdg', toolkitName: 'GGJ Core',
    attributionName: 'Global Goals Jam', attributionUrl: 'https://globalgoalsjam.org',
    title: 'How Might We + SDG Audit', description: 'Reframe your insight into a sharp design challenge and align it to a specific SDG target.',
    icon: null, category: 'Define Intentions', categoryColor: null, durationLabel: '30-45 min',
    durationMin: 30, durationMax: 45,
    tasks: ['Turn your key insight into a "How Might We…" question', 'Check it against the relevant SDG targets', 'Sharpen the scope so it is neither too broad nor too narrow', 'Agree the challenge as a team'],
    whenToUse: 'Sprint 2, to converge insights into a clear challenge', whyUse: 'A well-framed challenge unlocks better ideas',
    output: 'A prioritised "How Might We" challenge statement', note: null, nextSteps: null, reference: null, language: 'en', suggestedPhase: 'define',
  },
  {
    id: 'fallback_prototype', toolkitSlug: 'design', toolkitName: 'GGJ Core',
    attributionName: 'Global Goals Jam', attributionUrl: 'https://globalgoalsjam.org',
    title: 'Rapid Paper Prototype', description: 'Make your concept tangible fast and test the riskiest assumption with real people.',
    icon: null, category: 'Prototype & Test', categoryColor: null, durationLabel: '60-90 min',
    durationMin: 60, durationMax: 90,
    tasks: ['Pick the riskiest assumption to test', 'Build the lowest-fidelity prototype that tests it', 'Test with 3-5 people and capture reactions', 'Note what to change'],
    whenToUse: 'Sprint 3, to learn before investing more', whyUse: 'Cheap tests beat long debates',
    output: 'A tested prototype + feedback', note: null, nextSteps: null, reference: null, language: 'en', suggestedPhase: 'prototype',
  },
  {
    id: 'fallback_implement', toolkitSlug: 'sdg', toolkitName: 'GGJ Core',
    attributionName: 'Global Goals Jam', attributionUrl: 'https://globalgoalsjam.org',
    title: 'Impact & Next-Steps Roadmap', description: 'Plan how the concept reaches real-world impact: partners, resources and the path to scale.',
    icon: null, category: 'Scale & Context', categoryColor: null, durationLabel: '45 min',
    durationMin: 45, durationMax: 45,
    tasks: ['Define the first concrete next step after the jam', 'List the partners and resources needed', 'Connect the concept to its SDG target', 'Prepare a short pitch'],
    whenToUse: 'Sprint 4, to turn the concept into action', whyUse: 'Momentum dies without an owner and a next step',
    output: 'An action roadmap + pitch', note: null, nextSteps: null, reference: null, language: 'en', suggestedPhase: 'implement',
  },
]
