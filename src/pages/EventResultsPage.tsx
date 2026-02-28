import { useEffect, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import RichTextEditor from '../components/RichTextEditor'
import { ArrowLeft, Save, Upload, Users, AlertCircle, Loader2 } from 'lucide-react'
import blink, { safeDbCall } from '../lib/blink'
import EventMediaSection from '../components/EventMediaSection'
import { invalidateEventsCache } from '../hooks/usePublishedEvents'

interface User {
  id: string
  email: string
  displayName?: string
  role: string
}

interface EventRow {
  id: string
  title: string
  description?: string
  hostId: string
  location: string
  eventDate: string
  resultsSummary?: string
}

export default function EventResultsPage() {
  const { id } = useParams<{ id: string }>()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [event, setEvent] = useState<EventRow | null>(null)
  const [summary, setSummary] = useState('')

  useEffect(() => {
    const unsub = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user as any)
      setLoading(state.isLoading)
    })
    return unsub
  }, [])

  const loadEvent = useCallback(async () => {
    if (!id) return
    try {
      const rows = await safeDbCall(() => blink.db.events.list<EventRow>({ where: { id }, limit: 1 }))
      const ev = rows[0]
      setEvent(ev || null)
      setSummary((ev?.resultsSummary as string) || '')
    } catch (e) {
      console.error('Failed to load event', e)
    }
  }, [id])

  useEffect(() => {
    loadEvent().catch(console.error)
  }, [loadEvent])

  const canEdit = !!user && (!!event && (user.id === event.hostId || (user as any).role === 'admin'))

  const saveSummary = async () => {
    if (!event) return
    setSaving(true)
    try {
      await safeDbCall(() => blink.db.events.update(event.id, { resultsSummary: summary || '' }))
      invalidateEventsCache()
    } catch (e) {
      console.error('Failed to save summary', e)
      alert('Failed to save summary. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading && !event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Event Not Found</h2>
            <p className="text-muted-foreground mb-4">This event does not exist.</p>
            <Link to="/events"><Button><ArrowLeft className="w-4 h-4 mr-2" /> Back to Events</Button></Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link to={`/events/${event.id}`}><Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Event</Button></Link>
            <h1 className="text-xl sm:text-2xl font-bold">Add Results: {event.title}</h1>
          </div>
          <Link to={`/events/${event.id}`} className="hidden sm:block">
            <Button>Open Event Page</Button>
          </Link>
        </div>

        {/* Summary Editor */}
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!canEdit && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="w-4 h-4" /> Only the event host can edit this page.
              </div>
            )}
            <RichTextEditor
              value={summary}
              onChange={(value) => setSummary(value)}
              placeholder="Write a concise summary of your jam outcomes, highlights, learnings and links to public resources. Use formatting tools above for better structure."
              minHeight="200px"
            />
            <div className="flex justify-end">
              <Button onClick={saveSummary} disabled={!canEdit || saving} className="bg-primary-solid text-white hover:bg-primary/90">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Summary
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Your summary and uploads below will appear on the event page under Results & Media.</p>
          </CardContent>
        </Card>

        {/* Uploads */}
        <EventMediaSection event={{ id: event.id, hostId: event.hostId }} user={user} />
      </div>
    </div>
  )
}
