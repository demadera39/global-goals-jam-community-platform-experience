import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { MapPin, Calendar, Users, ExternalLink, AlertCircle } from 'lucide-react'
import blink, { safeDbCall } from '../lib/blink'
import { cn, sdgNumberFromFocus } from '../lib/utils'
import { geocodeLocation, distanceKm } from '../lib/geocoding'
import { usePublishedEvents, applyEventCoordUpdates } from '../hooks/usePublishedEvents'

// Leaflet
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet'
import type { Map as LeafletMap } from 'leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

// Fix default icon paths for bundlers
;(L.Icon.Default as any).mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

interface Event {
  id: string
  title: string
  location: string
  eventDate: string
  maxParticipants?: number
  status: string
  latitude?: number
  longitude?: number
  sdgFocus?: string
}

export default function GlobalMap() {
  const { events: sharedEvents, loading: loadingShared, error, retryInSec, refresh } = usePublishedEvents({ maxAgeMs: 60_000 })
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [geocoding, setGeocoding] = useState(false)
  const [currentPos, setCurrentPos] = useState<[number, number] | null>(null)
  const mapRef = useRef<LeafletMap | null>(null)
  const fitTimeout = useRef<number | null>(null)
  const hasFittedRef = useRef<string>('')
  const navigate = useNavigate()

  // Initialize from shared loader; avoid direct DB call here (prevents duplicate fetch and 429s)
  useEffect(() => {
    setEvents(sharedEvents as unknown as Event[])
    setLoading(false)
  }, [sharedEvents])

  // After initial load, geocode any events missing coordinates or with incorrect coords
  useEffect(() => {
    if (loading || events.length === 0) return
    geocodeAndFixEvents().catch((e) => console.warn('geocode pass failed', e))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading])

  const loadEvents = async () => {
    try {
      const eventList = await safeDbCall(() => blink.db.events.list({
        where: { OR: [ { status: 'published' }, { status: 'ongoing' }, { status: 'completed' }, { status: 'draft' } ] },
        orderBy: { eventDate: 'asc' },
        limit: 200
      }))
      setEvents(eventList)
    } catch (error: any) {
      // Swallow rate limit error on initial load to avoid log noise; UI will show empty state gracefully
      if (error?.status === 429 || error?.details?.code === 'RATE_LIMIT_EXCEEDED') {
        console.warn('Events rate-limited on map load; will retry on user action or later geocode pass')
      } else {
        console.error('Failed to load events:', error)
      }
    } finally {
      setLoading(false)
    }
  }

  // Geocode pass: for events without coords, or coords clearly off (>500km from geocoded city)
  async function geocodeAndFixEvents() {
    try {
      setGeocoding(true)
      const updates: Array<{ id: string; latitude: number; longitude: number }> = []

      for (const e of events) {
        const needsGeocode = !Number.isFinite(Number(e.latitude)) || !Number.isFinite(Number(e.longitude))
        if (!e.location || (!needsGeocode && e.latitude !== undefined && e.longitude !== undefined)) {
          // If it has coords, still sanity-check against the geocode of the location string
          if (e.location && Number.isFinite(Number(e.latitude)) && Number.isFinite(Number(e.longitude))) {
            const geo = await geocodeLocation(e.location)
            if (geo) {
              const dist = distanceKm({ lat: geo.lat, lon: geo.lon }, { lat: Number(e.latitude), lon: Number(e.longitude) })
              if (dist > 500) {
                updates.push({ id: e.id, latitude: geo.lat, longitude: geo.lon })
              }
            }
          }
          continue
        }

        // Missing or invalid coords → geocode
        const geo = await geocodeLocation(e.location)
        if (geo) {
          updates.push({ id: e.id, latitude: geo.lat, longitude: geo.lon })
        }
      }

      if (updates.length) {
        // Persist updates to DB (upsertMany for efficiency)
        await safeDbCall(() => blink.db.events.upsertMany(updates))
        // Locally apply updates and avoid triggering another DB read
        setEvents(prev => applyEventCoordUpdates(prev, updates))
      }
    } catch (err) {
      console.warn('geocodeAndFixEvents error:', err)
    } finally {
      setGeocoding(false)
    }
  }

  const geoEvents = useMemo(() => {
    const geos = events.filter(
      (e) => e.latitude !== undefined && e.longitude !== undefined && !isNaN(Number(e.latitude)) && !isNaN(Number(e.longitude))
    )
    return geos.map((e) => ({
      ...e,
      latitude: Number(e.latitude),
      longitude: Number(e.longitude),
    })) as Event[]
  }, [events])

  // Debounced fitBounds to avoid jitter when events update rapidly
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    // Compose a signature to avoid re-fitting on identical marker sets
    const sig = geoEvents.map((e) => `${e.latitude.toFixed(3)},${e.longitude.toFixed(3)}`).sort().join('|')
    if (sig === hasFittedRef.current) return

    if (fitTimeout.current) {
      window.clearTimeout(fitTimeout.current)
    }

    if (geoEvents.length >= 2) {
      fitTimeout.current = window.setTimeout(() => {
        const bounds = L.latLngBounds(geoEvents.map((e) => [e.latitude as number, e.longitude as number]))
        map.fitBounds(bounds.pad(0.1), { animate: true })
        hasFittedRef.current = sig
      }, 150)
    } else if (geoEvents.length === 1) {
      fitTimeout.current = window.setTimeout(() => {
        map.setView([geoEvents[0].latitude as number, geoEvents[0].longitude as number], 4, { animate: true })
        hasFittedRef.current = sig
      }, 150)
    }

    return () => {
      if (fitTimeout.current) window.clearTimeout(fitTimeout.current)
    }
  }, [geoEvents])

  const initialCenter: [number, number] = useMemo(() => {
    if (geoEvents.length > 0) {
      const lat = geoEvents.reduce((sum, e) => sum + (e.latitude as number), 0) / geoEvents.length
      const lng = geoEvents.reduce((sum, e) => sum + (e.longitude as number), 0) / geoEvents.length
      return [lat, lng]
    }
    return [20, 0] // world view
  }, [geoEvents])

  const handleSelectEvent = (event: Event) => {
    setSelectedEvent(event)
    if (event.latitude !== undefined && event.longitude !== undefined && mapRef.current) {
      mapRef.current.flyTo([Number(event.latitude), Number(event.longitude)], 6, { duration: 0.8 })
    }
  }

  return (
    <section className="py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Global Goals Jams Worldwide
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Discover local jams happening around the world and join the movement in your city.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Interactive Map */}
          <div className="relative rounded-lg border border-border overflow-hidden">
            <div className="aspect-[4/3]">
              <MapContainer 
                center={initialCenter} 
                zoom={geoEvents.length ? 2 : 2} 
                scrollWheelZoom 
                className="h-full w-full"
                whenCreated={(map) => { 
                  mapRef.current = map 
                  // Ensure tiles render correctly when container becomes visible
                  setTimeout(() => map.invalidateSize(), 0)
                }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {geoEvents.map((event) => (
                  <Marker 
                    key={event.id} 
                    position={[event.latitude as number, event.longitude as number]}
                    eventHandlers={{
                      click: () => setSelectedEvent(event)
                    }}
                  >
                    <Popup>
                      <div className="space-y-1">
                        <div className="font-semibold text-sm">{event.title}</div>
                        <div className="text-xs text-muted-foreground flex items-center">
                          <MapPin className="w-3 h-3 mr-1" /> {event.location}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center">
                          <Calendar className="w-3 h-3 mr-1" /> {new Date(event.eventDate).toLocaleDateString()}
                        </div>
                        <Button 
                          size="sm" 
                          className="mt-2 w-full bg-primary-solid text-white hover:bg-primary/90"
                          onClick={() => navigate(`/events/${event.id}`)}
                        >
                          View Event
                        </Button>
                      </div>
                    </Popup>
                  </Marker>
                ))}

                {selectedEvent?.latitude && selectedEvent?.longitude && (
                  <Circle 
                    center={[selectedEvent.latitude, selectedEvent.longitude]} 
                    radius={50000} 
                    pathOptions={{ color: '#00A651', fillOpacity: 0.05 }}
                  />
                )}
              </MapContainer>
            </div>

            {(error || (!loading && !geocoding && geoEvents.length === 0)) && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm">
                <div className="text-center p-6">
                  <AlertCircle className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                  <h3 className="font-semibold mb-1">No geocoded events yet</h3>
                  <p className="text-sm text-muted-foreground">
                    {error ? (retryInSec > 0 ? `We’re being rate-limited. Retrying in ${retryInSec}s…` : 'We’re being rate-limited. Try again.') : 'Published events will appear here once they have latitude/longitude.'}
                  </p>
                  {error && (
                    <Button size="sm" className="mt-3 bg-primary-solid text-white" onClick={() => refresh(true)}>
                      Retry now
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Event List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">Upcoming Events</h3>
              <Badge variant="secondary">{events.length}</Badge>
            </div>
            
            {loading || geocoding ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
                {events.map((event) => (
                  <Card 
                    key={event.id} 
                    className={cn('cursor-pointer transition-all duration-200 hover:shadow-md', selectedEvent?.id === event.id ? 'ring-2 ring-primary' : '')}
                    onClick={() => handleSelectEvent(event)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{event.title}</CardTitle>
                          <CardDescription className="flex items-center mt-1">
                            <MapPin className="w-4 h-4 mr-1" />
                            <Link 
                              to={`/location/${encodeURIComponent(event.location)}`}
                              className="hover:text-primary hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {event.location}
                            </Link>
                          </CardDescription>
                        </div>
                        <Badge variant="outline" className={cn('ml-2', sdgNumberFromFocus(event.sdgFocus) ? `text-sdg-${sdgNumberFromFocus(event.sdgFocus)} border-sdg-${sdgNumberFromFocus(event.sdgFocus)}` : '')}>
                          {event.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {new Date(event.eventDate).toLocaleDateString()}
                        </div>
                        {event.maxParticipants && (
                          <div className="flex items-center">
                            <Users className="w-4 h-4 mr-1" />
                            Up to {event.maxParticipants} participants
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {events.length === 0 && (
                  <Card>
                    <CardContent className="text-center py-10">
                      <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">No published events yet.</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
            
            <Button asChild variant="outline" className="w-full">
              <Link to="/events">
                <ExternalLink className="w-4 h-4 mr-2" />
                View All Events
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}