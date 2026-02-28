// Simple heuristic-based supplemental quote generator

export function splitSentences(text: string) {
  if (!text) return []
  return text
    .replace(/\n+/g, ' ')
    .split(/(?<=[.!?])\s+(?=[A-Z0-9“"'])/)
    .map(s => s.trim())
    .filter(Boolean)
}

export function pickSentencesWithKeywords(sentences: string[], keywords: string[], max: number) {
  const lowerKeys = keywords.map(k => k.toLowerCase())
  const picked: string[] = []
  const seen = new Set<string>()
  for (const s of sentences) {
    const sLow = s.toLowerCase()
    if (s.length < 40 || s.length > 240) continue
    if (!lowerKeys.some(k => sLow.includes(k))) continue
    const key = sLow
    if (seen.has(key)) continue
    seen.add(key)
    picked.push(s)
    if (picked.length >= max) break
  }
  return picked
}

export function generateSupplementalQuotes(imageText: string, reportText: string, max = 2) {
  const keywords = ['host', 'hosts', 'community', 'participant', 'participants', 'partner', 'impact', 'sdg', 'local', 'global', 'action', 'together']
  const reportSentences = splitSentences(reportText)
  const reportPicks = pickSentencesWithKeywords(reportSentences, keywords, max * 2)

  const imageSentences = splitSentences(imageText || '')
  const imageSnippet = imageSentences.find(s => s.length > 30) || imageText || ''

  const derived: string[] = []

  // Prefer combining a strong report sentence with image snippet
  for (let i = 0; i < Math.min(max, reportPicks.length); i++) {
    const r = reportPicks[i]
    if (imageSnippet) {
      derived.push(`${r} — Inspired by an on-the-ground host quote: “${imageSnippet}”`)
    } else {
      derived.push(`${r} (Derived from report)`)
    }
  }

  // Fallback: use report sentences if not enough
  for (let i = derived.length; i < max && i < reportSentences.length; i++) {
    derived.push(`${reportSentences[i]} (Derived from report)`)
  }

  return derived.slice(0, max)
}
