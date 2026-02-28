import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Calendar, MapPin, ChevronRight, Globe2 } from 'lucide-react'
import { cn, sdgNumberFromFocus, sdgBg } from '../lib/utils'
import { resolveContinent, extractCity, type Continent } from '../lib/regions'
import { usePublishedEvents } from '../hooks/usePublishedEvents'

interface Event {
  id: string
  title: string
  description?: string
  location: string
  latitude?: number
  longitude?: number
  eventDate: string
  status: string
  sdgFocus?: string
}

const CONTINENTS: Continent[] = [
  'Africa',
  'Asia',
  'Europe',
  'North America',
  'South America',
  'Oceania',
  'Antarctica'
]

const continentEmoji: Record<Continent, string> = {
  Africa: '🌍',
  Asia: '🌏',
  Europe: '🌍',
  'North America': '🌎',
  'South America': '🌎',
  Oceania: '🌊',
  Antarctica: '🧊',
  Unknown: '🗺️'
}

export default function ContinentsOverview() {
  const { events: published, loading, error, retryInSec, refresh } = usePublishedEvents({ maxAgeMs: 60_000 })
  const [active, setActive] = useState<Continent>('Europe')
  const events = published as unknown as Event[]

  const grouped = useMemo(() => {
    const map = new Map<Continent, Map<string, Event[]>>()
    for (const c of CONTINENTS) map.set(c, new Map())

    for (const e of events) {
      const cont = resolveContinent(
        e.latitude !== undefined ? Number(e.latitude) : undefined,
        e.longitude !== undefined ? Number(e.longitude) : undefined,
        e.location
      )
      const city = extractCity(e.location)
      const contMap = map.get(cont)!
      if (!contMap.has(city)) contMap.set(city, [])
      contMap.get(city)!.push(e)
    }

    // Sort cities alphabetically and events by date
    const sorted: Record<Continent, Array<{ city: string; events: Event[] }>> = {
      'Africa': [], 'Asia': [], 'Europe': [], 'North America': [], 'South America': [], 'Oceania': [], 'Antarctica': [], 'Unknown': []
    }

    for (const [continent, cityMap] of map) {
      const cities = [...cityMap.entries()].map(([city, list]) => ({
        city,
        events: list.sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime())
      }))
      cities.sort((a, b) => a.city.localeCompare(b.city))
      sorted[continent] = cities
    }

    return sorted
  }, [events])

  // Pick initial active continent with most events
  useEffect(() => {
    if (events.length === 0) return
    let best: Continent = 'Europe'
    let bestCount = -1
    for (const c of CONTINENTS) {
      const count = grouped[c]?.reduce((acc, g) => acc + g.events.length, 0) ?? 0
      if (count > bestCount) { best = c; bestCount = count }
    }
    setActive(best)
  }, [events, grouped])

  return (
    <section className="py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">
            <Globe2 className="w-4 h-4 mr-2" /> Global Overview
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
            Explore Jams by Continent
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Browse cities hosting Global Goals Jams — clean, fast, and map-free.
          </p>
        </div>

        <Tabs value={active} onValueChange={(v) => setActive(v as Continent)}>
          <div className="flex flex-col items-center">
            <TabsList className="mb-8 overflow-x-auto max-w-full">
              {CONTINENTS.map((c) => (
                <TabsTrigger key={c} value={c} className="min-w-[140px]">
                  <span className="mr-2">{continentEmoji[c]}</span>
                  {c}
                  <span className="ml-2 text-xs text-muted-foreground">
                    ({grouped[c]?.reduce((acc, g) => acc + g.events.length, 0) ?? 0})
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {CONTINENTS.map((c) => (
            <TabsContent key={c} value={c}>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />
                  ))
                ) : error ? (
                  <Card className="md:col-span-2 lg:col-span-3">
                    <CardContent className="py-10 text-center">
                      <div className="text-sm text-muted-foreground">
                        We’re being rate-limited. {retryInSec > 0 ? `Retrying in ${retryInSec}s…` : 'Please try again.'}
                      </div>
                      <Button onClick={() => refresh(true)} className="mt-3 bg-primary-solid text-white">Retry now</Button>
                    </CardContent>
                  </Card>
                ) : grouped[c] && grouped[c].length > 0 ? (
                  grouped[c].map(({ city, events }) => (
                    <Card key={city} className="group hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center justify-between">
                          <span className="truncate">{city}</span>
                          <Badge variant="outline">{events.length}</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          {events.slice(0, 3).map((e) => {
                            const sdg = sdgNumberFromFocus(e.sdgFocus)
                            return (
                              <Link key={e.id} to={`/events/${e.id}`} className="block">
                                <div className="flex items-start justify-between rounded-lg border p-3 hover:bg-muted/60 transition-colors">
                                  <div className="min-w-0 pr-3">
                                    <div className="font-medium truncate">{e.title}</div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <Calendar className="w-4 h-4" />
                                      <span>{new Date(e.eventDate).toLocaleDateString()}</span>
                                      <span className="inline-flex items-center gap-1 truncate">
                                        <MapPin className="w-4 h-4" />
                                        <span className="truncate">{e.location}</span>
                                      </span>
                                    </div>
                                  </div>
                                  <div className={cn('ml-2 h-2 w-2 rounded-full flex-shrink-0', sdg ? sdgBg(sdg) : 'bg-primary-solid')} />
                                </div>
                              </Link>
                            )
                          })}
                          {events.length > 3 && (
                            <Button asChild variant="ghost" className="w-full justify-between">
                              <Link to={`/events?continent=${encodeURIComponent(c)}&city=${encodeURIComponent(city)}`}>
                                View all {events.length} events <ChevronRight className="w-4 h-4" />
                              </Link>
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card className="md:col-span-2 lg:col-span-3">
                    <CardContent className="py-12 text-center text-muted-foreground">
                      No events yet in {c}.
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  )
}
