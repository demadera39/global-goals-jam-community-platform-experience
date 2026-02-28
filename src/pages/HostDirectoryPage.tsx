import { useEffect, useMemo, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import blink, { safeDbCall, isCertifiedHost } from '../lib/blink'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar'
import { MapPin } from 'lucide-react'

interface HostRow {
  id: string
  email: string
  displayName?: string
  profileImage?: string
  location?: string
  bio?: string
  role: string
}

interface EventHostOnly {
  hostId: string
}

export default function HostDirectoryPage() {
  const [hosts, setHosts] = useState<HostRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [city, setCity] = useState<string>('All')
  const [certified, setCertified] = useState<Set<string>>(new Set())

  const fetchHosts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // 1) Base list: fetch hosts and admins separately (avoid invalid SQL OR)
      const hostRows = await safeDbCall(() => blink.db.users.list<HostRow>({
        where: { role: 'host' },
        orderBy: { displayName: 'asc' },
        limit: 500
      }))

      const adminRows = await safeDbCall(() => blink.db.users.list<HostRow>({
        where: { role: 'admin' },
        orderBy: { displayName: 'asc' },
        limit: 500
      }))

      const byId = new Map<string, HostRow>()
      for (const r of [...hostRows, ...adminRows]) byId.set(r.id, r)

      // 2) Include anyone who actually hosted an event (even if their role flag isn't set yet)
      const events = await safeDbCall(() => blink.db.events.list<EventHostOnly>({
        orderBy: { createdAt: 'desc' },
        limit: 1000
      }))
      const uniqueEventHostIds = Array.from(new Set(events.map(e => (e as any).hostId).filter(Boolean))) as string[]
      const missingIds = uniqueEventHostIds.filter(id => !byId.has(id))

      if (missingIds.length) {
        const chunkSize = 40
        for (let i = 0; i < missingIds.length; i += chunkSize) {
          const ids = missingIds.slice(i, i + chunkSize)
          for (const id of ids) {
            const rows = await safeDbCall(() => (blink.db as any).users.list<HostRow>({ where: { id }, limit: 1 }))
            if (rows && rows[0]) byId.set(rows[0].id, rows[0])
          }
        }
      }

      const merged = Array.from(byId.values())
      merged.sort((a, b) => (a.displayName || a.email).localeCompare(b.displayName || b.email))
      setHosts(merged)

      // Resolve certification states in background
      const ids = merged.map(h => h.id)
      const certSet = new Set<string>()
      for (const id of ids) {
        try {
          const ok = await isCertifiedHost(id)
          if (ok) certSet.add(id)
        } catch (e) { /* ignore */ }
      }
      setCertified(certSet)
    } catch (e: any) {
      console.error('Failed to load hosts:', e)
      setError(e?.message || 'Failed to load hosts')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchHosts().catch(console.error)
  }, [fetchHosts])

  const allCities = useMemo(() => {
    const set = new Set<string>()
    for (const h of hosts) {
      const loc = (h.location || '').trim()
      if (loc) set.add(loc)
    }
    return ['All', ...Array.from(set).sort((a, b) => a.localeCompare(b))]
  }, [hosts])

  const filtered = useMemo(() => {
    let list = hosts
    const q = query.trim().toLowerCase()
    if (q) {
      list = list.filter(h => (h.displayName || h.email).toLowerCase().includes(q) || (h.location || '').toLowerCase().includes(q))
    }
    if (city !== 'All') {
      list = list.filter(h => (h.location || '').trim() === city)
    }
    return list
  }, [hosts, query, city])

  const grouped = useMemo(() => {
    const map = new Map<string, HostRow[]>()
    for (const h of filtered) {
      const key = (h.location || 'Unknown').trim() || 'Unknown'
      const arr = map.get(key) || []
      arr.push(h)
      map.set(key, arr)
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  }, [filtered])

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Host Directory</h1>
            <p className="text-muted-foreground">Discover Global Goals Jam organisers by city and visit their profile pages.</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Input
              placeholder="Search host or city..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="sm:w-[280px]"
            />
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="h-10 px-3 rounded-md border bg-background"
            >
              {allCities.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-muted-foreground">Loading…</div>
        ) : error ? (
          <Card>
            <CardContent className="py-10 text-center">
              <div className="text-red-600 mb-4">Failed to load hosts: {error}</div>
              <Button variant="outline" onClick={() => fetchHosts()}>Retry</Button>
            </CardContent>
          </Card>
        ) : grouped.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">No hosts found.</CardContent>
          </Card>
        ) : (
          <div className="space-y-10">
            {grouped.map(([cityName, rows]) => (
              <section key={cityName}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-semibold flex items-center gap-2">
                    <MapPin className="w-5 h-5" /> {cityName}
                  </h2>
                  <Badge variant="secondary">{rows.length}</Badge>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {rows.map(h => (
                    <Card key={h.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={h.profileImage} alt={h.displayName || h.email} />
                            <AvatarFallback>{(h.displayName || h.email).charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <CardTitle className="text-lg truncate">{h.displayName || h.email}</CardTitle>
                              {certified.has(h.id) && (
                                <Badge className="bg-emerald-600 text-white">Certified Host</Badge>
                              )}
                            </div>
                            {h.location && (
                              <div className="text-sm text-muted-foreground truncate flex items-center gap-1"><MapPin className="w-4 h-4" /> {h.location}</div>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {h.bio && <p className="text-sm text-muted-foreground line-clamp-2">{h.bio}</p>}
                        <div className="pt-3">
                          <Link to={`/host/${h.id}`}>
                            <Button variant="outline" className="w-full">View Profile</Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
