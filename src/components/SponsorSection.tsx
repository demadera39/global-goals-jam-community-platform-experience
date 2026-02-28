import React, { useEffect, useState } from 'react'
import { Card } from './ui/card'
import { blink, safeDbCall } from '../lib/blink'

interface Sponsor {
  id: string
  donorName: string
  donorOrganization: string | null
  donorLogoUrl: string | null
  amount: number
  tierName: string
  paidAt: string
}

const CACHE_KEY = 'ggj_sponsors_cache_v1'
const CACHE_TTL_MS = 30 * 1000 // 30 seconds

async function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms))
}

async function fetchWithRetry<T>(fn: () => Promise<T>, maxAttempts = 4, baseDelay = 500) {
  let attempt = 0
  while (true) {
    try {
      return await fn()
    } catch (err: any) {
      attempt++
      const status = err?.status || err?.statusCode || null
      const isRateLimit = status === 429 || err?.details?.code === 'RATE_LIMIT_EXCEEDED'
      if (attempt >= maxAttempts || !isRateLimit) {
        throw err
      }

      // Try to respect reset time if provided
      const reset = err?.details?.reset ? new Date(err.details.reset).getTime() : null
      const now = Date.now()
      let wait = baseDelay * Math.pow(2, attempt - 1)
      if (reset && reset > now) {
        wait = Math.max(wait, reset - now + 250)
      }

      // Gentle jitter
      wait = Math.floor(wait * (0.75 + Math.random() * 0.5))
      console.warn(`Sponsor fetch attempt ${attempt} failed with rate limit. Retrying in ${wait}ms`)
      await sleep(wait)
    }
  }
}

const SponsorSection = () => {
  const [sponsors, setSponsors] = useState<Sponsor[]>([])
  const [loading, setLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    let cancelled = false

    const loadFromCache = () => {
      try {
        const raw = sessionStorage.getItem(CACHE_KEY)
        if (!raw) return null
        const parsed = JSON.parse(raw)
        if (parsed?.ts && Date.now() - parsed.ts < CACHE_TTL_MS) {
          return parsed.data as Sponsor[]
        }
      } catch (e) {
        // ignore
      }
      return null
    }

    const saveToCache = (data: Sponsor[]) => {
      try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }))
      } catch (e) {
        // ignore
      }
    }

    const fetchSponsors = async () => {
      setLoading(true)
      try {
        const cached = loadFromCache()
        if (cached) {
          setSponsors(cached)
          // cached data is fresh enough — stop loading immediately
          if (!cancelled) setLoading(false)
          return
        }

        const donations = await safeDbCall(() => (blink.db as any).donations.list({
          where: {
            status: 'completed',
            donorName: { '!=': null },
            formCompletedAt: { '!=': null }
          },
          orderBy: { amount: 'desc' }
        }))

        if (cancelled) return
        setSponsors(donations)
        saveToCache(donations)
      } catch (error) {
        console.warn('Sponsors unavailable (network or rate limit):', error)
        // keep silent in UI but don't crash
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchSponsors()

    // Optionally refresh briefly later to pick up updates without hammering DB
    const interval = setInterval(() => {
      fetchSponsors().catch(console.error)
    }, 60 * 1000) // refresh every minute

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  if (loading || sponsors.length === 0) {
    return null
  }

  const majorSponsors = sponsors.filter(s => Number(s.amount) >= 10000) // high tier
  const regularSponsors = sponsors.filter(s => Number(s.amount) < 10000)

  const visibleRegular = showAll ? regularSponsors : regularSponsors.slice(0, 6)

  return (
    <section className="py-12 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">Sponsored and supported by</h2>
          <p className="text-muted-foreground">
            Thank you to our community of supporters making Global Goals Jam possible.
          </p>
        </div>

        {majorSponsors.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-center mb-6">Major Sponsors</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
              {majorSponsors.map((sponsor) => (
                <Card key={sponsor.id} className="text-center p-4 w-full max-w-md mx-auto">
                  {(() => {
                    const src = sponsor.donorLogoUrl ? (sponsor.donorLogoUrl.startsWith('http') ? sponsor.donorLogoUrl : `/assets/${sponsor.donorLogoUrl}`) : null
                    return src ? (
                      <img
                        src={src}
                        alt={`${sponsor.donorName} logo`}
                        className="mx-auto max-w-xs h-16 object-contain mb-3"
                        loading="lazy"
                        onError={(e) => { const img = e.target as HTMLImageElement; img.style.display = 'none' }}
                      />
                    ) : (
                      <div className="w-full h-16 bg-muted rounded flex items-center justify-center mb-3">
                        <span className="text-2xl font-bold text-muted-foreground">
                          {sponsor.donorName.charAt(0)}
                        </span>
                      </div>
                    )
                  })()}
                  <div className="space-y-1">
                    <h4 className="font-medium text-sm">{sponsor.donorName}</h4>
                    {sponsor.donorOrganization && (
                      <p className="text-xs text-muted-foreground">{sponsor.donorOrganization}</p>
                    )}
                    <p className="text-xs text-primary font-medium">{sponsor.tierName}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {regularSponsors.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-center mb-6">Community Supporters</h3>
            <div className="flex flex-wrap justify-center items-center gap-6">
              {visibleRegular.map((sponsor) => (
                <div key={sponsor.id} className="text-center w-full max-w-xs mx-auto">
                  {sponsor.donorLogoUrl ? (
                    <img 
                      src={sponsor.donorLogoUrl} 
                      alt={`${sponsor.donorName} logo`}
                      className="mx-auto max-h-16 object-contain mb-2"
                    />
                  ) : (
                    <div className="w-full h-12 bg-muted rounded flex items-center justify-center mb-2">
                      <span className="text-lg font-bold text-muted-foreground">
                        {sponsor.donorName.charAt(0)}
                      </span>
                    </div>
                  )}
                  <p className="text-xs font-medium">{sponsor.donorName}</p>
                  {sponsor.donorOrganization && (
                    <p className="text-xs text-muted-foreground">{sponsor.donorOrganization}</p>
                  )}
                </div>
              ))}
            </div>

            {regularSponsors.length > visibleRegular.length && (
              <div className="mt-6 text-center">
                <button
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:opacity-95"
                  onClick={() => setShowAll(!showAll)}
                >
                  {showAll ? 'Show less' : `View all ${regularSponsors.length} supporters`}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

export default SponsorSection
