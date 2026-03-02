export interface GeoPoint {
  lat: number
  lon: number
}

// Simple local cache to avoid hammering the API in a single session
const memoryCache = new Map<string, GeoPoint>()

function cacheKey(query: string) {
  return `geocode:${query.toLowerCase().trim()}`
}

export async function geocodeLocation(query: string): Promise<GeoPoint | null> {
  if (!query || !query.trim()) return null
  const key = cacheKey(query)

  // Memory cache first
  if (memoryCache.has(key)) return memoryCache.get(key) as GeoPoint

  // localStorage cache next
  try {
    const cached = localStorage.getItem(key)
    if (cached) {
      const parsed = JSON.parse(cached) as GeoPoint
      memoryCache.set(key, parsed)
      return parsed
    }
  } catch (_) { void 0 }

  try {
    // Use OpenStreetMap Nominatim directly (no CORS issues for GET requests)
    const params = new URLSearchParams({
      q: query,
      format: 'json',
      addressdetails: '0',
      limit: '1'
    })

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?${params}`,
      {
        headers: {
          'Accept': 'application/json',
        }
      }
    )

    const body = await response.json()
    const results = Array.isArray(body) ? body : []
    if (results.length === 0) return null

    const first = results[0]
    const lat = Number(first.lat)
    const lon = Number(first.lon)
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      const point = { lat, lon }
      memoryCache.set(key, point)
      try { localStorage.setItem(key, JSON.stringify(point)) } catch (_) { void 0 }
      return point
    }
    return null
  } catch (error) {
    console.warn('geocodeLocation failed:', error)
    return null
  }
}

// Haversine distance in kilometers
export function distanceKm(a: GeoPoint, b: GeoPoint) {
  const R = 6371
  const dLat = toRad(b.lat - a.lat)
  const dLon = toRad(b.lon - a.lon)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)

  const x = Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2)
  const y = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
  return R * y
}

function toRad(deg: number) { return (deg * Math.PI) / 180 }
