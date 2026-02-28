import { useEffect, useMemo, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Clock, Download, Loader2, Users } from 'lucide-react'
import blink, { getFullUser } from '../lib/blink'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import ToolkitDisplay from '../components/ToolkitDisplay'
import { buildToolkitHtml, markdownToBasicHtml } from '../lib/toolkitExport'

interface Toolkit {
  id: string
  title: string
  description: string
  content: string
  createdBy: string
  isPublic: string | boolean
  sdgFocus: string
  durationMinutes: number
  participantCount: string
  difficultyLevel: string
  downloadCount: number
  createdAt: string
}

const sdgOptions = [
  { value: 'sdg1', label: 'No Poverty', color: 'bg-sdg-1' },
  { value: 'sdg2', label: 'Zero Hunger', color: 'bg-sdg-2' },
  { value: 'sdg3', label: 'Good Health and Well-being', color: 'bg-sdg-3' },
  { value: 'sdg4', label: 'Quality Education', color: 'bg-sdg-4' },
  { value: 'sdg5', label: 'Gender Equality', color: 'bg-sdg-5' },
  { value: 'sdg6', label: 'Clean Water and Sanitation', color: 'bg-sdg-6' },
  { value: 'sdg7', label: 'Affordable and Clean Energy', color: 'bg-sdg-7' },
  { value: 'sdg8', label: 'Decent Work and Economic Growth', color: 'bg-sdg-8' },
  { value: 'sdg9', label: 'Industry, Innovation and Infrastructure', color: 'bg-sdg-9' },
  { value: 'sdg10', label: 'Reduced Inequalities', color: 'bg-sdg-10' },
  { value: 'sdg11', label: 'Sustainable Cities and Communities', color: 'bg-sdg-11' },
  { value: 'sdg12', label: 'Responsible Consumption and Production', color: 'bg-sdg-12' },
  { value: 'sdg13', label: 'Climate Action', color: 'bg-sdg-13' },
  { value: 'sdg14', label: 'Life Below Water', color: 'bg-sdg-14' },
  { value: 'sdg15', label: 'Life on Land', color: 'bg-sdg-15' },
  { value: 'sdg16', label: 'Peace, Justice and Strong Institutions', color: 'bg-sdg-16' },
  { value: 'sdg17', label: 'Partnerships for the Goals', color: 'bg-sdg-17' }
]

export default function ToolkitDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [toolkit, setToolkit] = useState<Toolkit | null>(null)
  const [loading, setLoading] = useState(true)
  const [related, setRelated] = useState<Toolkit[]>([])
  const [user, setUser] = useState<{ id: string; role: string } | null>(null)
  const [isCertified, setIsCertified] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  useEffect(() => {
    const load = async () => {
      if (!id) return
      try {
        const list = await blink.db.toolkits.list({ where: { id }, limit: 1 })
        const tk = list[0] || null
        setToolkit(tk)

        if (tk) {
          // fetch related: same SDG, exclude current, order by downloads
          const same = await blink.db.toolkits.list({
            where: { sdgFocus: tk.sdgFocus, isPublic: "1", id: { NEQ: tk.id } },
            orderBy: { downloadCount: 'desc' },
            limit: 6
          })
          setRelated(same)
        }
      } catch (e) {
        console.error('Failed to load toolkit', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  // Load current user and compute certification (host/admin)
  useEffect(() => {
    const init = async () => {
      try {
        const full = await getFullUser()
        setUser(full as any)
      } catch (_) {
        setUser(null)
      } finally {
        setAuthChecked(true)
      }
    }
    const unsub = blink.auth.onAuthStateChanged(() => init().catch(() => setAuthChecked(true)))
    init().catch(() => setAuthChecked(true))
    return unsub
  }, [])

  useEffect(() => {
    const check = async () => {
      if (!user?.id) { setIsCertified(false); return }
      // Fast path from in-memory role
      if (user.role === 'host' || user.role === 'admin') { setIsCertified(true); return }
      try {
        const { getUserProfile } = await import('@/lib/userStatus')
        const profile = await getUserProfile(user.id)
        setIsCertified(profile?.role === 'host' || profile?.role === 'admin')
      } catch (e) {
        console.warn('[ToolkitDetails] profile check failed', e)
        setIsCertified(false)
      }
    }
    check().catch(() => setIsCertified(false))
  }, [user?.id, user?.role])

  const sdg = useMemo(() => sdgOptions.find(s => s.value === toolkit?.sdgFocus), [toolkit?.sdgFocus])
  const days = useMemo(() => Math.max(1, Math.round((toolkit?.durationMinutes || 960) / 480)), [toolkit?.durationMinutes])

  const isPublic = toolkit?.isPublic === true || toolkit?.isPublic === '1'
  const locked = !isPublic && !isCertified

  const handleDownload = async () => {
    if (!toolkit) return
    const canDownload = isPublic || isCertified
    if (!canDownload) {
      navigate('/course/enroll')
      return
    }
    try {
      await blink.db.toolkits.update(toolkit.id, { downloadCount: (toolkit.downloadCount || 0) + 1 })
      const html = buildToolkitHtml({
        title: toolkit.title,
        sdgLabel: sdg?.label,
        jamDuration: String(days),
        participants: toolkit.participantCount,
        challenge: toolkit.description || toolkit.title,
        contentHtml: markdownToBasicHtml(toolkit.content)
      })
      const blob = new Blob([html], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${toolkit.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setToolkit({ ...toolkit, downloadCount: (toolkit.downloadCount || 0) + 1 })
    } catch (e) {
      console.error('Download failed', e)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!toolkit) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <Link to="/toolkit" className="inline-flex items-center text-primary hover:underline mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Toolkit Library
        </Link>
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-muted-foreground">Toolkit not found.</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <Link to="/toolkit" className="inline-flex items-center text-primary hover:underline">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Toolkit Library
          </Link>
          <div className="flex items-center gap-2">
            {sdg && <Badge variant="secondary" className="flex items-center gap-2"><span className={`w-2 h-2 rounded-full ${sdg.color}`} />{sdg.label}</Badge>}
            <Badge variant="outline" className="text-xs"><Clock className="w-3 h-3 mr-1" />{days} day{days !== 1 ? 's' : ''}</Badge>
            <Badge variant="outline" className="text-xs"><Users className="w-3 h-3 mr-1" />{toolkit.participantCount || '20-50'}</Badge>
            <Button size="sm" className="bg-primary-solid text-white hover:bg-primary/90" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-1" /> Download
            </Button>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">{toolkit.title}</CardTitle>
            <p className="text-muted-foreground mt-1">{toolkit.description}</p>
          </CardHeader>
        </Card>

        <ToolkitDisplay
          content={toolkit.content}
          sdgFocus={toolkit.sdgFocus}
          jamDuration={String(days)}
          participants={toolkit.participantCount || '20-50'}
          challenge={toolkit.description || toolkit.title}
          onDownload={handleDownload}
          locked={locked}
          onUnlock={() => navigate('/course/enroll')}
        />
      </div>

      {/* Related Toolkits */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {related && related.length > 0 && (
          <div className="mt-2">
            <h3 className="text-xl font-semibold mb-4">Related toolkits</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {related.map(rt => {
                const sdg = sdgOptions.find(s => s.value === rt.sdgFocus)
                return (
                  <Link key={rt.id} to={`/toolkit/${rt.id}`} className="block group">
                    <Card className="hover:shadow-lg transition-all group-hover:-translate-y-0.5">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-base line-clamp-2 group-hover:text-primary transition-colors">{rt.title}</CardTitle>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{rt.description}</p>
                          </div>
                          {sdg && <div className={`w-3 h-3 rounded-full ${sdg.color} flex-shrink-0 ml-2`} />}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span><Clock className="w-3 h-3 inline mr-1" />{Math.max(1, Math.round((rt.durationMinutes || 480)/480))}d</span>
                          <span>•</span>
                          <span><Users className="w-3 h-3 inline mr-1" />{rt.participantCount || '20-50'}</span>
                          <span>•</span>
                          <span>{rt.downloadCount || 0} downloads</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}