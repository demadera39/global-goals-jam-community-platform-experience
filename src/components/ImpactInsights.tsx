import { useEffect, useMemo, useState } from 'react'
import { Quote } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Skeleton } from './ui/skeleton'
import { AspectRatio } from './ui/aspect-ratio'
import blink from '../lib/blink'

interface ImpactInsightsProps {
  pdfUrl: string
  count?: number
  title?: string
  images?: string[] // optional preview images to pair with insights
  startIndex?: number // skip N top picks to ensure different sets per page
  showDiversityPhrases?: boolean // render short phrases collage
}

interface InsightQuote {
  text: string
  source?: string
}

function cleanText(input: string) {
  return input
    .replace(/\s+/g, ' ')
    .replace(/^[“"']|[”"']$/g, '')
    .trim()
}

function parseQuotesFromText(text: string, max: number): InsightQuote[] {
  const keywords = [
    'host', 'hosts', 'community', 'communities', 'participants', 'partner', 'partners',
    'impact', 'SDG', 'sustainable', 'local', 'global', 'future', 'together', 'action'
  ]
  const paragraphs = text.split(/\n{2,}/).map(p => p.trim()).filter(Boolean)

  const candidates: InsightQuote[] = []

  for (const p of paragraphs) {
    const normalized = cleanText(p)
    if (normalized.length < 80 || normalized.length > 420) continue
    const hasKeyword = keywords.some(k => new RegExp(`\\b${k}\\b`, 'i').test(normalized))
    if (!hasKeyword) continue

    // Try to detect inline source “— Name, Org”
    let source: string | undefined
    const dashMatch = normalized.match(/—\s*([^\n]{2,80})$/)
    if (dashMatch) {
      source = dashMatch[1].trim()
    }

    const cleaned = dashMatch ? normalized.replace(/—\s*[^\n]{2,80}$/, '').trim() : normalized

    candidates.push({ text: cleaned, source })
  }

  // If not enough, also split into sentences and pick some
  if (candidates.length < max) {
    const sentences = text
      .replace(/\n+/g, ' ')
      .split(/(?<=[.!?])\s+(?=[A-Z0-9“"'])/)
      .map(s => cleanText(s))
      .filter(Boolean)

    for (const s of sentences) {
      if (s.length < 80 || s.length > 240) continue
      const hasKeyword = keywords.some(k => new RegExp(`\\b${k}\\b`, 'i').test(s))
      if (!hasKeyword) continue
      candidates.push({ text: s })
      if (candidates.length >= max * 3) break
    }
  }

  // Deduplicate by text
  const seen = new Set<string>()
  const unique = candidates.filter(c => {
    const key = c.text.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  // Prioritize paragraphs (richer) over sentences
  const scored = unique.map(c => ({
    q: c,
    score: (c.text.length > 120 ? 2 : 1) + (/([“”"'])/.test(c.text) ? 1 : 0) + (c.source ? 1 : 0)
  }))

  scored.sort((a, b) => b.score - a.score)
  return scored.map(s => s.q)
}

function pickShortPhrases(text: string, max: number): string[] {
  const sentences = text
    .replace(/\n+/g, ' ')
    .split(/(?<=[.!?])\s+(?=[A-Z0-9“"'])/)
    .map(s => cleanText(s))
    .filter(Boolean)

  const phrases: string[] = []
  const seen = new Set<string>()
  const keywords = ['together', 'community', 'local', 'global', 'future', 'impact', 'learn', 'share']

  for (const s of sentences) {
    if (s.length < 30 || s.length > 90) continue
    const hasKeyword = keywords.some(k => new RegExp(`\\b${k}\\b`, 'i').test(s))
    if (!hasKeyword) continue
    const key = s.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    phrases.push(s.replace(/[“”]/g, ''))
    if (phrases.length >= max) break
  }
  return phrases
}

export default function ImpactInsights({ pdfUrl, count = 3, title, images, startIndex = 0, showDiversityPhrases = false }: ImpactInsightsProps) {
  const [quotes, setQuotes] = useState<InsightQuote[] | null>(null)
  const [shortPhrases, setShortPhrases] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  const safeUrl = useMemo(() => pdfUrl, [pdfUrl])

  useEffect(() => {
    let mounted = true
    const run = async () => {
      try {
        setLoading(true)
        setError(null)
        const extracted = await (blink.data as any).extractFromUrl(safeUrl, { chunking: true, chunkSize: 2500 })
        const text: string = Array.isArray(extracted) ? extracted.join('\n\n') : String(extracted || '')
        const parsedAll = parseQuotesFromText(text, Math.max(count + startIndex, count * 2))
        const picked = parsedAll.slice(startIndex, startIndex + count)

        const finalQuotes = picked.length > 0 ? picked : (parsedAll.slice(0, count))

        if (!mounted) return
        setQuotes(finalQuotes)
        setShortPhrases(pickShortPhrases(text, 4))
      } catch (e: any) {
        if (!mounted) return
        setError(e?.message || 'Failed to load report insights')
        setQuotes([
          { text: 'Hosts report stronger local partnerships and clearer pathways from ideas to action across the SDGs.' },
          { text: 'Participants value the structured, sprint-based process that turns community challenges into tangible concepts.' },
          { text: 'Sharing results openly helps other cities build on proven methods and outcomes.' }
        ].slice(0, count))
      } finally {
        if (mounted) setLoading(false)
      }
    }
    run()
    return () => { mounted = false }
  }, [safeUrl, count, startIndex])

  // Resolve image list sized to card count
  const cardImages = useMemo(() => {
    if (!images || images.length === 0) return Array(count).fill(undefined)
    const arr = Array.from({ length: count }, (_, i) => images[i % images.length])
    return arr
  }, [images, count])

  return (
    <div className="w-full">
      {title && (
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold tracking-tight">{title}</h3>
          <a
            href={pdfUrl}
            target="_blank"
            rel="noreferrer"
            className="text-primary text-sm hover:underline"
          >
            Read the full report →
          </a>
        </div>
      )}

      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: count }).map((_, i) => (
            <Card key={i} className="border bg-card overflow-hidden">
              <div className="bg-muted/40">
                <AspectRatio ratio={16/9}>
                  <Skeleton className="w-full h-full" />
                </AspectRatio>
              </div>
              <CardHeader className="space-y-2">
                <div className="inline-flex items-center gap-2 text-muted-foreground text-sm">
                  <Quote className="w-4 h-4" />
                  Impact Insight
                </div>
                <CardTitle className="text-base font-medium">Loading…</CardTitle>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && quotes && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quotes.map((q, idx) => (
            <Card key={idx} className="border bg-card/80 backdrop-blur overflow-hidden">
              {cardImages[idx] && (
                <div className="relative">
                  <AspectRatio ratio={16/9}>
                    <img
                      src={cardImages[idx]!}
                      alt={`Impact visual ${idx+1}`}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  </AspectRatio>
                </div>
              )}

              <CardHeader className="space-y-2">
                <div className="inline-flex items-center gap-2 text-muted-foreground text-sm">
                  <Quote className="w-4 h-4" />
                  Impact Insight
                </div>
                <CardTitle className="text-base font-medium">
                  {q.source ? q.source : 'GGJ Impact Report'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="italic text-muted-foreground">“{q.text}”</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && showDiversityPhrases && shortPhrases.length > 0 && (
        <div className="mt-6">
          <div className="text-sm text-muted-foreground mb-2">Voices around the world:</div>
          <div className="flex flex-wrap gap-2">
            {shortPhrases.map((p, i) => (
              <span key={i} className="px-3 py-1 rounded-full border bg-muted/40 text-xs">
                {p}
              </span>
            ))}
          </div>
        </div>
      )}

      {!loading && error && (
        <p className="mt-4 text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}
