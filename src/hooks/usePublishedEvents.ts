import { useEffect, useMemo, useState } from 'react'
import blink, { safeDbCall } from '../lib/blink'

export interface PublishedEvent {
  id: string
  title: string
  description?: string
  location: string
  latitude?: number
  longitude?: number
  eventDate: string
  status: string
  coverImage?: string
  sdgFocus?: string
  hostId?: string
}

// Module-level cache to dedupe requests across components
let cache: PublishedEvent[] | null = null
let lastFetchedAt = 0
let inFlight: Promise<PublishedEvent[]> | null = null
let lastError: any = null
let retryAtTs: number | null = null

async function fetchPublished(): Promise<PublishedEvent[]> {
  // If another component is already fetching, reuse it
  if (inFlight) return inFlight

  inFlight = (async () => {
    try {
      lastError = null
      retryAtTs = null
      const rows = await safeDbCall(() => blink.db.events.list<PublishedEvent>({
        orderBy: { eventDate: 'asc' },
        limit: 200
      }))
      const filtered = (rows || []).filter(r => r.status !== 'draft')
      cache = filtered
      lastFetchedAt = Date.now()
      return filtered
    } catch (err: any) {
      lastError = err
      // Handle rate limit info if present
      const reset = err?.details?.reset
      if (reset) {
        try {
          retryAtTs = new Date(reset).getTime()
        } catch (_) {
          retryAtTs = Date.now() + 15000
        }
      } else {
        retryAtTs = Date.now() + 15000
      }
      throw err
    } finally {
      inFlight = null
    }
  })()

  return inFlight
}

export function usePublishedEvents(options?: { maxAgeMs?: number }) {
  const maxAgeMs = options?.maxAgeMs ?? 60_000 // 1 minute cache by default
  const [events, setEvents] = useState<PublishedEvent[] | null>(cache)
  const [loading, setLoading] = useState(!cache)
  const [error, setError] = useState<any>(lastError)
  const [retryAt, setRetryAt] = useState<number | null>(retryAtTs)

  useEffect(() => {
    let cancelled = false

    const stale = !cache || (Date.now() - lastFetchedAt) > maxAgeMs
    if (!stale) {
      setEvents(cache)
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    fetchPublished()
      .then((rows) => {
        if (cancelled) return
        setEvents(rows)
        setError(null)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err)
        setRetryAt(retryAtTs)
      })
      .finally(() => {
        if (cancelled) return
        setLoading(false)
      })

    return () => { cancelled = true }
  }, [maxAgeMs])

  // Expose a refresh that respects retryAt
  const refresh = async (force = false) => {
    if (!force && retryAt && Date.now() < retryAt) {
      // Too soon; let caller show countdown
      return
    }
    setLoading(true)
    try {
      const rows = await fetchPublished()
      setEvents(rows)
      setError(null)
      setRetryAt(null)
    } catch (err) {
      setError(err)
      setRetryAt(retryAtTs)
    } finally {
      setLoading(false)
    }
  }

  const retryInSec = useMemo(() => {
    if (!retryAt) return 0
    const delta = Math.ceil((retryAt - Date.now()) / 1000)
    return delta > 0 ? delta : 0
  }, [retryAt])

  return {
    events: events ?? [],
    loading,
    error,
    retryAt,
    retryInSec,
    refresh,
  }
}

// Utility to locally apply coordinate updates without triggering another DB read
export function applyEventCoordUpdates(list: PublishedEvent[], updates: Array<{ id: string; latitude: number; longitude: number }>): PublishedEvent[] {
  if (!updates.length) return list
  const map = new Map(list.map(e => [e.id, e]))
  for (const u of updates) {
    const ex = map.get(u.id)
    if (ex) {
      ex.latitude = u.latitude
      ex.longitude = u.longitude
    }
  }
  return Array.from(map.values())
}

// Cache invalidation function - call this after creating/updating/deleting events
export function invalidateEventsCache() {
  cache = null
  lastFetchedAt = 0
  inFlight = null
  lastError = null
  retryAtTs = null
}
