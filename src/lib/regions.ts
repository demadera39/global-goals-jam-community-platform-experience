export type Continent =
  | 'Africa'
  | 'Asia'
  | 'Europe'
  | 'North America'
  | 'South America'
  | 'Oceania'
  | 'Antarctica'
  | 'Unknown'

// Rough geographic bounding boxes to infer continent from coordinates
export function continentFromLatLng(lat?: number | null, lng?: number | null): Continent {
  if (lat === null || lat === undefined || lng === null || lng === undefined) return 'Unknown'
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return 'Unknown'

  // Antarctica first
  if (lat < -60) return 'Antarctica'

  // South America
  if (lat >= -56 && lat <= 13 && lng >= -82 && lng <= -34) return 'South America'

  // North America (including Central America and Caribbean broadly)
  if (lat >= 5 && lat <= 83 && lng >= -170 && lng <= -50) return 'North America'

  // Europe
  if (lat >= 35 && lat <= 71 && lng >= -25 && lng <= 45) return 'Europe'

  // Africa
  if (lat >= -35 && lat <= 38 && lng >= -20 && lng <= 55) return 'Africa'

  // Oceania (Australia + NZ + Pacific Islands broadly)
  if (lat >= -50 && lat <= 0 && lng >= 110 && lng <= 180) return 'Oceania'

  // Asia (broad fallback incl. Middle East)
  if (lat >= -10 && lat <= 80 && lng >= 25 && lng <= 180) return 'Asia'

  return 'Unknown'
}

// City-specific overrides to avoid misclassification when only city is provided
const cityOverrides: Array<{ keyword: string; continent: Continent; unlessIncludes?: string[] }> = [
  { keyword: 'amsterdam', continent: 'Europe', unlessIncludes: ['south africa'] },
  { keyword: 'tokyo', continent: 'Asia' }
]

// Minimal keyword maps to aid detection when coords missing
const continentKeywords: Record<Exclude<Continent, 'Unknown'>, string[]> = {
  Africa: [
    'nigeria','kenya','south africa','egypt','morocco','ghana','ethiopia','uganda','tanzania','rwanda','algeria','tunisia','senegal','ivory coast','cote d’ivoire','cote d\'ivoire','cameroon','zimbabwe','zambia','botswana','namibia'
  ],
  Asia: [
    'india','china','japan','tokyo','korea','south korea','republic of korea','pakistan','bangladesh','indonesia','philippines','vietnam','thailand','malaysia','singapore','sri lanka','nepal','uae','united arab emirates','saudi','qatar','oman','jordan','lebanon','israel','turkey'
  ],
  Europe: [
    'united kingdom','uk','england','scotland','wales','ireland','france','germany','spain','portugal','italy','netherlands','amsterdam','belgium','sweden','norway','denmark','finland','iceland','poland','czech','austria','switzerland','greece','romania','bulgaria','serbia','croatia','estonia','latvia','lithuania','hungary'
  ],
  'North America': [
    'united states','usa','us','canada','mexico','jamaica','cuba','dominican republic','guatemala','costarica','costa rica','panama','honduras','nicaragua','el salvador','belize','bahamas','trinidad'
  ],
  'South America': [
    'brazil','argentina','chile','peru','colombia','ecuador','uruguay','paraguay','bolivia','venezuela','guyana','suriname'
  ],
  Oceania: [
    'australia','new zealand','fiji','papua new guinea','samoa','tonga','solomon islands','vanuatu'
  ],
  Antarctica: ['antarctica']
}

export function continentFromLocationString(location?: string | null): Continent {
  if (!location) return 'Unknown'
  const s = location.toLowerCase()

  // 1) City-specific overrides first
  for (const o of cityOverrides) {
    if (s.includes(o.keyword)) {
      const blocked = o.unlessIncludes?.some(ex => s.includes(ex))
      if (!blocked) return o.continent
    }
  }

  // 2) General country/region keywords
  for (const [continent, words] of Object.entries(continentKeywords) as [Exclude<Continent,'Unknown'>, string[]][]) {
    for (const w of words) {
      if (s.includes(w)) return continent
    }
  }
  return 'Unknown'
}

export function resolveContinent(lat?: number | null, lng?: number | null, location?: string | null): Continent {
  const byCoords = continentFromLatLng(lat ?? undefined, lng ?? undefined)

  // If coords say Africa but text strongly indicates known cities elsewhere, override
  if (byCoords === 'Africa' && location) {
    const s = location.toLowerCase()
    if (s.includes('amsterdam')) return 'Europe'
    if (s.includes('tokyo')) return 'Asia'
  }

  if (byCoords !== 'Unknown') return byCoords

  const byText = continentFromLocationString(location)
  return byText
}

export function extractCity(location?: string | null): string {
  if (!location) return 'Unknown City'
  // Heuristic: take first segment before comma or dash
  const first = location.split(',')[0].split(' - ')[0].split('–')[0]
  return first.trim() || 'Unknown City'
}
