// Schedule normalization & validation utilities
// Ensures each day runs 09:00–17:00 (480 minutes), is contiguous, and durations are sane.

export type EnergyLevel = 'low' | 'medium' | 'high'

export interface SessionActivityLike {
  time: string
  duration: string
  title: string
  description: string
  materials: string[]
  steps?: string[]
  facilitatorNotes: string[]
  energyLevel: EnergyLevel
}

export interface DayPlanLike<T extends SessionActivityLike = SessionActivityLike> {
  day: number
  theme: string
  objective: string
  activities: T[]
}

export interface NormalizedResult<T extends SessionActivityLike = SessionActivityLike> {
  activities: T[]
  totalMinutes: number
  notes: string[]
  adjusted: boolean
}

export interface NormalizeOptions {
  startTime?: string // default 09:00
  endTime?: string   // default 17:00
  minBlockMinutes?: number // default 5
  createFillerTitle?: string // default "Break & Transition"
}

const DEFAULTS: Required<NormalizeOptions> = {
  startTime: '09:00',
  endTime: '17:00',
  minBlockMinutes: 5,
  createFillerTitle: 'Break & Transition'
}

export function normalizePlanDays<T extends SessionActivityLike = SessionActivityLike>(
  days: DayPlanLike<T>[],
  options?: NormalizeOptions
): { days: DayPlanLike<T>[], meta: { adjustedDays: number, totalNotes: number } } {
  const meta = { adjustedDays: 0, totalNotes: 0 }
  const normalizedDays = days.map((day) => {
    const res = normalizeDayActivities(day.activities as SessionActivityLike[], options) as NormalizedResult
    const adjusted = res.adjusted
    if (adjusted) meta.adjustedDays += 1
    meta.totalNotes += res.notes.length
    return {
      ...day,
      activities: res.activities as T[]
    }
  })
  return { days: normalizedDays, meta }
}

export function normalizeDayActivities<T extends SessionActivityLike = SessionActivityLike>(
  activities: T[],
  options?: NormalizeOptions
): NormalizedResult<T> {
  const cfg = { ...DEFAULTS, ...(options || {}) }
  const notes: string[] = []
  let adjusted = false

  const startMin = parseTimeToMinutes(cfg.startTime)
  const endMin = parseTimeToMinutes(cfg.endTime)
  const windowMinutes = endMin - startMin // should be 480

  // Parse durations, defaulting invalid to 15 minutes
  const parsed: { idx: number; item: T; durationMin: number }[] = activities.map((item, idx) => {
    let d = parseDurationToMinutes(item.duration)
    if (!Number.isFinite(d) || d <= 0) {
      d = 15
      notes.push(`Activity "${safeTitle(item.title)}" had invalid duration; defaulted to 15 min`)
      adjusted = true
    }
    if (d < cfg.minBlockMinutes) {
      notes.push(`Activity "${safeTitle(item.title)}" duration raised to minimum ${cfg.minBlockMinutes} min`)
      d = cfg.minBlockMinutes
      adjusted = true
    }
    return { idx, item, durationMin: d }
  })

  // Sequentially assign times from startMin
  let cursor = startMin
  const normalized: T[] = parsed.map(({ item, durationMin }) => {
    const newItem = { ...item } as T
    newItem.time = formatMinutes(cursor)
    newItem.duration = formatDuration(durationMin)
    cursor += durationMin
    return newItem
  })

  const total = parsed.reduce((sum, p) => sum + p.durationMin, 0)
  const diff = windowMinutes - total // positive: we are short, negative: we overran

  if (diff > 0) {
    // Add filler break at the end
    const filler: T = {
      ...(normalized[normalized.length - 1] || ({} as T)),
      title: cfg.createFillerTitle,
      description: 'Use this time for breaks, transitions, or discussion.',
      time: formatMinutes(cursor),
      duration: formatDuration(diff),
      materials: [],
      steps: [],
      facilitatorNotes: ['Flexible buffer to keep the day on time.'],
      energyLevel: 'low'
    }
    normalized.push(filler)
    notes.push(`Added buffer block to fill remaining ${diff} min`)
    adjusted = true
    cursor += diff
  } else if (diff < 0) {
    // Need to trim |diff| minutes from the schedule. Trim from the last blocks backward respecting minBlockMinutes.
    let toTrim = -diff
    for (let i = normalized.length - 1; i >= 0 && toTrim > 0; i--) {
      const d = parseDurationToMinutes(normalized[i].duration)
      const possible = Math.max(0, d - cfg.minBlockMinutes)
      if (possible <= 0) continue
      const take = Math.min(possible, toTrim)
      const newDur = d - take
      normalized[i] = {
        ...normalized[i],
        duration: formatDuration(newDur)
      }
      toTrim -= take
    }

    if (toTrim > 0) {
      // Could not trim enough due to all being at min; force-trim the last one
      const lastIdx = Math.max(0, normalized.length - 1)
      const d = parseDurationToMinutes(normalized[lastIdx].duration)
      const newDur = Math.max(cfg.minBlockMinutes, d - toTrim)
      normalized[lastIdx] = { ...normalized[lastIdx], duration: formatDuration(newDur) }
      toTrim = 0
    }

    // Reflow times again from start to ensure contiguity
    cursor = startMin
    for (let i = 0; i < normalized.length; i++) {
      const d = parseDurationToMinutes(normalized[i].duration)
      normalized[i] = { ...normalized[i], time: formatMinutes(cursor) }
      cursor += d
    }

    notes.push('Trimmed schedule to fit 09:00–17:00 window')
    adjusted = true
  }

  // Final guard: ensure ending exactly at endMin
  const finalEnd = parseTimeToMinutes(normalized[normalized.length - 1]?.time || cfg.startTime) + parseDurationToMinutes(normalized[normalized.length - 1]?.duration || '0')
  if (finalEnd !== endMin) {
    const endDelta = endMin - finalEnd
    if (endDelta > 0) {
      // extend last block
      const lastIdx = Math.max(0, normalized.length - 1)
      const d = parseDurationToMinutes(normalized[lastIdx].duration)
      normalized[lastIdx] = { ...normalized[lastIdx], duration: formatDuration(d + endDelta) }
      notes.push(`Extended last block by ${endDelta} min to align with ${cfg.endTime}`)
    } else if (endDelta < 0) {
      // shrink last block
      const lastIdx = Math.max(0, normalized.length - 1)
      const d = parseDurationToMinutes(normalized[lastIdx].duration)
      normalized[lastIdx] = { ...normalized[lastIdx], duration: formatDuration(Math.max(cfg.minBlockMinutes, d + endDelta)) }
      notes.push(`Reduced last block by ${-endDelta} min to align with ${cfg.endTime}`)
    }
    // reflow times
    cursor = startMin
    for (let i = 0; i < normalized.length; i++) {
      const d = parseDurationToMinutes(normalized[i].duration)
      normalized[i] = { ...normalized[i], time: formatMinutes(cursor) }
      cursor += d
    }
    adjusted = true
  }

  // Sanity: ensure total now equals exactly windowMinutes
  const finalTotal = normalized.reduce((sum, a) => sum + parseDurationToMinutes(a.duration), 0)
  if (finalTotal !== windowMinutes) {
    // Force last block to absorb delta
    const delta = windowMinutes - finalTotal
    const lastIdx = Math.max(0, normalized.length - 1)
    const d = parseDurationToMinutes(normalized[lastIdx].duration)
    normalized[lastIdx] = { ...normalized[lastIdx], duration: formatDuration(Math.max(cfg.minBlockMinutes, d + delta)) }
    // reflow times
    cursor = startMin
    for (let i = 0; i < normalized.length; i++) {
      const d2 = parseDurationToMinutes(normalized[i].duration)
      normalized[i] = { ...normalized[i], time: formatMinutes(cursor) }
      cursor += d2
    }
    notes.push('Final alignment applied to reach exact 480 minutes')
    adjusted = true
  }

  return {
    activities: normalized,
    totalMinutes: windowMinutes,
    notes,
    adjusted
  }
}

export function parseTimeToMinutes(t: string): number {
  const m = String(t).trim().match(/^(\d{1,2}):(\d{2})$/)
  if (!m) return 9 * 60 // default 09:00 on invalid
  const hh = Math.min(23, Math.max(0, parseInt(m[1], 10)))
  const mm = Math.min(59, Math.max(0, parseInt(m[2], 10)))
  return hh * 60 + mm
}

export function formatMinutes(mins: number): string {
  const hh = Math.floor(mins / 60)
  const mm = mins % 60
  const pad = (n: number) => (n < 10 ? `0${n}` : String(n))
  return `${pad(hh)}:${pad(mm)}`
}

export function parseDurationToMinutes(s: string): number {
  const str = String(s).toLowerCase().trim()
  if (/^\d+$/.test(str)) {
    // plain minutes number
    return parseInt(str, 10)
  }
  // patterns like "90m", "90 min", "1h", "1h30", "1h 30m", "1 hr 15 min"
  let minutes = 0
  const hMatch = str.match(/(\d+)\s*(h|hr|hrs|hour|hours)/)
  const mMatch = str.match(/(\d+)\s*(m|min|mins|minute|minutes)/)
  const combo = str.match(/^(\d+)\s*h\s*(\d+)\s*m/)
  if (combo) {
    minutes = parseInt(combo[1], 10) * 60 + parseInt(combo[2], 10)
    return minutes
  }
  if (hMatch) minutes += parseInt(hMatch[1], 10) * 60
  if (mMatch) minutes += parseInt(mMatch[1], 10)
  if (minutes > 0) return minutes

  // fallback: "1h30" or "2:15"
  const hCompact = str.match(/^(\d+)h(\d{1,2})$/)
  if (hCompact) return parseInt(hCompact[1], 10) * 60 + parseInt(hCompact[2], 10)
  const colon = str.match(/^(\d+):(\d{1,2})$/)
  if (colon) return parseInt(colon[1], 10) * 60 + parseInt(colon[2], 10)

  return NaN
}

export function formatDuration(mins: number): string {
  if (mins % 60 === 0) return `${mins / 60} h`
  return `${mins} min`
}

function safeTitle(s: string) {
  return (s || '').slice(0, 60)
}
