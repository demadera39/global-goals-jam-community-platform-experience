import { toast } from 'sonner'
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Badge } from '../components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Separator } from '../components/ui/separator'
import { Switch as PublicSwitch } from '../components/ui/switch'
import {
  Wand2,
  Download,
  Clock,
  Users,
  BookOpen,
  Loader2,
  User as UserIcon,
  MapPin,
  Plus,
  Save as SaveIcon
} from 'lucide-react'
import { db, auth, safeDbCall, supabase } from '../lib/supabase'
import { getFullUser } from '../lib/userProfile'
import ToolkitDisplay from '../components/ToolkitDisplay'
import { buildToolkitHtml, markdownToBasicHtml, buildJamAgendaHtml } from '../lib/toolkitExport'
import { fetchMethods, toCatalogForPrompt, indexById } from '../lib/metodicMethods'

interface User {
  id: string
  email: string
  displayName?: string
  role: string
}

interface Toolkit {
  id: string
  title: string
  description: string
  content: string
  createdBy: string
  isPublic: boolean | string
  sdgFocus: string
  durationMinutes: number
  participantCount: string
  difficultyLevel: string
  downloadCount: number
  createdAt: string
}

interface UserProfile {
  id: string
  displayName?: string
  email: string
  location?: string
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

type LibraryFilter = 'all' | 'mine' | 'others'

export default function ToolkitPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [toolkits, setToolkits] = useState<Toolkit[]>([])
  const [generating, setGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState('')
  const [libraryFilter, setLibraryFilter] = useState<LibraryFilter>('all')
  const [creators, setCreators] = useState<Record<string, UserProfile>>({})
  const [, setIsPreview] = useState(false)
  const [, setIsCertified] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedToolkitId, setSavedToolkitId] = useState<string | null>(null)
  const [genStatus, setGenStatus] = useState('')
  // Flow: once a result exists we collapse the form to a compact "brief" bar and
  // scroll the user to the result, so it's clear the output is below.
  const [editingInputs, setEditingInputs] = useState(true)
  const resultRef = useRef<HTMLDivElement | null>(null)
  const formRef = useRef<HTMLDivElement | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    challenge: '',
    sdgFocus: '',
    jamDuration: '', // 1, 2, or 3 days
    participants: '',
    resources: '',
    difficultyLevel: 'intermediate',
    localContext: ''
  })

  useEffect(() => {
    const update = async () => {
      setLoading(true)
      try {
        const full = await getFullUser()
        setUser(full as any)
      } catch (e) {
        console.warn('[ToolkitPage] getFullUser failed', e)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    const unsubscribe = auth.onAuthStateChanged(() => {
      update().catch(console.error)
    })
    update().catch(console.error)
    return unsubscribe
  }, [])

  // SIMPLIFIED: Any registered user can access toolkit
  useEffect(() => {
    if (user?.id) {
      setIsCertified(true)
    } else {
      setIsCertified(false)
    }
  }, [user?.id])

  const mergePublicAndMine = useCallback(async (uid?: string) => {
    try {
      let merged: any[] = []
      if (uid) {
        // Fallback to two simple queries (no OR support in older SDK)
        const [publicRows, myRows] = await Promise.all([
          safeDbCall<any[]>(() => (db as any).toolkits.list({
            where: { isPublic: true },
            orderBy: { createdAt: 'desc' },
            limit: 50
          })),
          safeDbCall<any[]>(() => (db as any).toolkits.list({
            where: { createdBy: uid },
            orderBy: { createdAt: 'desc' },
            limit: 50
          }))
        ])
        const all = [...(publicRows || []), ...(myRows || [])]
        const byId = new Map<string, any>()
        for (const row of all) {
          if (row?.id && !byId.has(row.id)) byId.set(row.id, row)
        }
        merged = Array.from(byId.values())
        merged.sort((a, b) => {
          const da = new Date(a.createdAt || a.created_at || 0).getTime()
          const db = new Date(b.createdAt || b.created_at || 0).getTime()
          return db - da
        })
        merged = merged.slice(0, 50)
      } else {
        // Guests: only public toolkits
        merged = (await safeDbCall(() => (db as any).toolkits.list({
          where: { isPublic: true },
          orderBy: { createdAt: 'desc' },
          limit: 50
        }))) || []
      }

      const list: Toolkit[] = (merged || []).map((row: any) => ({
        id: row.id,
        title: row.title,
        description: row.description || '',
        // Avoid holding massive content in memory for listings; fetch on-demand when opening details/download
        content: '',
        createdBy: row.createdBy,
        isPublic: Number(row.isPublic) > 0 || row.isPublic === true,
        sdgFocus: row.sdgFocus || '',
        durationMinutes: Number(row.durationMinutes) || 0,
        participantCount: row.participantCount || '',
        difficultyLevel: row.difficultyLevel || '',
        downloadCount: Number(row.downloadCount) || 0,
        createdAt: row.createdAt
      }))

      return list
    } catch (err) {
      console.error('[ToolkitPage] Error fetching toolkits:', err)
      return []
    }
  }, [])

  const loadToolkits = useCallback(async () => {
    try {
      const list = await mergePublicAndMine(user?.id)
      setToolkits(list)
    } catch (error) {
      console.error('Failed to load toolkits:', error)
    }
  }, [mergePublicAndMine, user?.id])

  // Load toolkits once auth state resolved
  useEffect(() => {
    if (!loading) {
      loadToolkits().catch(console.error)
    }
  }, [loading, loadToolkits])

  // Load creator profiles for labels (displayName + location)
  useEffect(() => {
    const fetchCreators = async () => {
      try {
        const ids = Array.from(new Set(toolkits.map(t => t.createdBy))).filter(Boolean)
        const missing = ids.filter(id => !creators[id])
        if (missing.length === 0) return

        const results: Record<string, UserProfile> = { ...creators }
        await Promise.all(missing.map(async (id) => {
          try {
            const rows = await safeDbCall<any[]>(() => (db as any).users.list({ where: { id }, limit: 1 }))
            const row = rows?.[0]
            if (row) {
              results[id] = {
                id: row.id,
                displayName: row.displayName || row.email,
                email: row.email,
                location: row.location || ''
              }
            }
          } catch (_) {
            // ignore single failures
          }
        }))
        setCreators(results)
      } catch (e) {
        console.warn('fetchCreators failed', e)
      }
    }
    if (toolkits.length > 0) fetchCreators()
  }, [toolkits, creators])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Robustly extract a JSON object from AI output that may include code fences or extra text
  // Attempt to repair JSON that was truncated mid-stream (e.g. the model hit
  // its max-token budget on a long 3-day jam). We close any open strings,
  // arrays and objects so the bulk of the toolkit still renders.
  function repairTruncatedJson(input: string): string {
    let s = input
    // Drop a trailing partial token after the last complete value, if any.
    const stack: string[] = []
    let inString = false
    let escaped = false
    let lastSafe = -1 // index just after the last balanced top-level-ish value
    for (let i = 0; i < s.length; i++) {
      const ch = s[i]
      if (inString) {
        if (escaped) { escaped = false }
        else if (ch === '\\') { escaped = true }
        else if (ch === '"') { inString = false }
        continue
      }
      if (ch === '"') { inString = true; continue }
      if (ch === '{' || ch === '[') { stack.push(ch === '{' ? '}' : ']') }
      else if (ch === '}' || ch === ']') { stack.pop(); lastSafe = i }
      else if (ch === ',') { lastSafe = i }
    }
    // If we ended mid-string, cut back to the last safe boundary.
    if (inString && lastSafe >= 0) {
      s = s.slice(0, lastSafe + 1)
      // recompute open structures on the trimmed string
      return repairTruncatedJson(s)
    }
    // Remove a dangling trailing comma.
    s = s.replace(/,\s*$/, '')
    // Close any still-open arrays/objects in reverse order.
    while (stack.length) s += stack.pop()
    return s
  }

  function extractJsonObject(raw: string): any | null {
    if (!raw) return null
    let s = raw.trim()
    // strip markdown fences if present
    s = s.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim()
    // find first opening brace and last closing brace
    const start = s.indexOf('{')
    const end = s.lastIndexOf('}')
    const candidate = start >= 0 && end > start ? s.slice(start, end + 1) : s
    // 1) straight parse
    try { return JSON.parse(candidate) } catch (_) { /* fall through */ }
    // 2) strip trailing commas
    try {
      return JSON.parse(candidate.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']'))
    } catch (_) { /* fall through */ }
    // 3) repair truncation (close open strings/arrays/objects)
    try {
      const fromBrace = start >= 0 ? s.slice(start) : s
      const repaired = repairTruncatedJson(fromBrace).replace(/,\s*}/g, '}').replace(/,\s*]/g, ']')
      return JSON.parse(repaired)
    } catch (_) { /* ignore */ }
    return null
  }

  const generateToolkit = async () => {
    if (!formData.challenge || !formData.sdgFocus || !formData.jamDuration || !formData.participants) {
      toast.error('Please fill in all required fields')
      return
    }

    // Always run full generation; guests allowed (we'll skip DB save for guests)
    setIsPreview(false)
    setGeneratedContent('')
    setGenerating(true)

    // Do not auto-save. Show explicit Save button for users to add to their library.
    setSavedToolkitId(null)

    // Small delay to ensure UI updates with loading state
    await new Promise(resolve => setTimeout(resolve, 50))

    try {
      const selectedSDG = sdgOptions.find(sdg => sdg.value === formData.sdgFocus)
      const days = parseInt(formData.jamDuration) || 1
      const totalHours = days * 8

      // 1) Retrieve REAL methods from Metodic's library (grounding — not invention)
      setGenStatus('Pulling real methods from the Metodic library…')
      const { methods, grounded } = await fetchMethods({
        challenge: formData.challenge,
        sdgFocus: formData.sdgFocus,
        language: 'en',
      })
      const catalog = toCatalogForPrompt(methods)
      const methodsById = indexById(methods)
      const validIds = new Set(methods.map(m => m.id))
      const titleIndex = new Map(methods.map(m => [m.title.toLowerCase().trim(), m.id]))

      // 2) Ask the AI to SELECT + ARRANGE catalog methods into a 4-sprint agenda
      setGenStatus('Designing your 4-sprint agenda…')
      const prompt = `Design a complete Global Goals Jam agenda for the brief below by SELECTING and ARRANGING methods from the provided CATALOG. Reference methods by their exact "id".

BRIEF:
Challenge: ${formData.challenge}
SDG focus: ${selectedSDG?.label || 'General SDG'}
Duration: ${days} day(s) (${totalHours} hours total; each day runs 09:00–17:00)
Participants: ${formData.participants}
Difficulty: ${formData.difficultyLevel}
${formData.localContext ? `Local context: ${formData.localContext}\n` : ''}${formData.resources ? `Available resources: ${formData.resources}\n` : ''}
CATALOG (${catalog.length} real methods — choose by "id"):
${JSON.stringify(catalog)}`

      console.log('[ToolkitPage] 🚀 Generating grounded agenda; catalog size:', catalog.length, 'grounded:', grounded)
      const startTime = Date.now()

      let text: string = ''
      const { data: aiResult, error: aiError } = await supabase.functions.invoke('gemini-ai', {
        body: { prompt, action: 'generate_jam_agenda' },
      })

      // supabase.functions.invoke surfaces non-2xx responses as a
      // FunctionsHttpError whose real message lives in error.context (a Response).
      if (aiError) {
        let serverMessage = aiError.message
        try {
          const ctx = (aiError as any).context
          if (ctx && typeof ctx.json === 'function') {
            const bodyJson = await ctx.json()
            if (bodyJson?.error) serverMessage = bodyJson.error
          }
        } catch (_) { /* keep default message */ }
        throw new Error(serverMessage)
      }
      text = aiResult?.text || ''

      const duration = ((Date.now() - startTime) / 1000).toFixed(2)
      console.log(`[ToolkitPage] ✓ Agenda generated in ${duration}s, text length:`, text?.length, 'truncated:', aiResult?.truncated)

      if (!text || text.length < 20) {
        throw new Error('The AI returned an empty agenda. Please try again.')
      }

      const agenda: any = extractJsonObject(text)
      if (!agenda || !Array.isArray(agenda.sprints)) {
        throw new Error('The AI returned an unexpected format. Please try again.')
      }

      // 3) Validate method ids (anti-hallucination): repair by title, else demote to a flagged proposal
      const proposed: any[] = Array.isArray(agenda.proposedMethods) ? [...agenda.proposedMethods] : []
      for (const sprint of agenda.sprints) {
        if (!Array.isArray(sprint.blocks)) { sprint.blocks = []; continue }
        for (const b of sprint.blocks) {
          if (b.methodId && !validIds.has(b.methodId)) {
            const byTitle = titleIndex.get((b.title || '').toLowerCase().trim())
            if (byTitle) {
              b.methodId = byTitle
            } else {
              const key = `auto_${proposed.length + 1}`
              proposed.push({
                key,
                title: b.title || 'Custom activity',
                description: '',
                phase: sprint.phase,
                rationale: b.rationale || '',
                flagged: true,
              })
              b.methodId = null
              b.proposedMethodKey = key
            }
          }
        }
      }
      agenda.proposedMethods = proposed

      // 4) Attach meta + format marker + a self-contained snapshot of the methods used
      const usedIds = new Set<string>()
      for (const s of agenda.sprints) for (const b of (s.blocks || [])) if (b.methodId) usedIds.add(b.methodId)
      const usedMethods: Record<string, any> = {}
      usedIds.forEach((id) => { if (methodsById[id]) usedMethods[id] = methodsById[id] })

      agenda.format = 'ggj.jam-agenda.v1'
      agenda.meta = {
        sdgFocus: formData.sdgFocus,
        sdgLabel: selectedSDG?.label || '',
        jamDuration: formData.jamDuration,
        participants: formData.participants,
        challenge: formData.challenge,
        difficulty: formData.difficultyLevel,
        grounded,
        methodCatalogIds: Array.from(usedIds),
        generatedAt: new Date().toISOString(),
      }

      const contentToStore = JSON.stringify({ ...agenda, _methods: usedMethods })

      if (!grounded) {
        toast.warning('The Metodic method library was unavailable, so this agenda uses a small fallback set.')
      }
      if (aiResult?.truncated) {
        toast.warning('This jam was large, so the agenda may be slightly trimmed. Try a shorter duration for full detail.')
      }

      setIsPreview(false)
      setGeneratedContent(contentToStore)

      // Do not auto-save. Show explicit Save button for users to add to their library.
      setSavedToolkitId(null)

      // Collapse the form and bring the freshly-built agenda into view.
      setEditingInputs(false)
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200)

    } catch (error: any) {
      console.error('[ToolkitPage] ✗ Generation failed:', error)

      const msg = (error?.message || '').toString()
      let userMessage = 'Failed to generate toolkit. '

      if (/not configured|missing|invalid|authentication/i.test(msg)) {
        userMessage += 'The AI service is not configured yet — please contact the GGJ team.'
      } else if (/rate limit|busy/i.test(msg)) {
        userMessage += 'The AI is busy right now. Please try again in a moment.'
      } else if (/timed out|timeout/i.test(msg)) {
        userMessage += 'The request timed out. Try again, or pick a shorter jam duration.'
      } else if (/network|fetch|failed to fetch/i.test(msg)) {
        userMessage += 'Network error. Please check your connection and try again.'
      } else if (msg) {
        userMessage += msg
      } else {
        userMessage += 'Something went wrong. Please try again.'
      }

      toast.error(userMessage)
    } finally {
      console.log('[ToolkitPage] 🏁 Generation process finished (success or error)')
      setGenerating(false)
      setGenStatus('')
    }
  }

  const downloadToolkit = async (toolkit: Toolkit) => {
    try {
      // Update download count optimistically
      await db.toolkits.update(toolkit.id, {
        downloadCount: (toolkit.downloadCount || 0) + 1
      })

      // Fetch full content on-demand to avoid loading massive payloads in listings
      const fullRows = await safeDbCall<any[]>(() => (db as any).toolkits.list({ where: { id: toolkit.id }, limit: 1 }))
      const full = fullRows?.[0]
      const content = full?.content || ''

      const html = buildToolkitHtml({
        title: toolkit.title,
        sdgLabel: sdgOptions.find(s => s.value === toolkit.sdgFocus)?.label,
        jamDuration: String(Math.round((toolkit.durationMinutes || 0) / 480)),
        participants: toolkit.participantCount,
        challenge: toolkit.description,
        contentHtml: markdownToBasicHtml(content)
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

      // No need to reload entire list here
    } catch (error) {
      console.error('Failed to download toolkit:', error)
    }
  }

  const sdgThemeClass = formData.sdgFocus ? `sdg-theme-${formData.sdgFocus.replace('sdg','')}` : 'theme-orange'

  // Filtered view of toolkits for Library tab
  const filteredToolkits = useMemo(() => {
    if (!user?.id) return toolkits
    if (libraryFilter === 'mine') return toolkits.filter(t => t.createdBy === user.id)
    if (libraryFilter === 'others') return toolkits.filter(t => t.createdBy !== user.id)
    return toolkits
  }, [toolkits, libraryFilter, user?.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  // New: Save function for generated content
  const saveGeneratedToolkit = async () => {
    let currentUser = user
    if (!currentUser?.id) {
      try {
        const refreshed = await getFullUser()
        if (refreshed) {
          setUser(refreshed as any)
          currentUser = refreshed as any
        }
      } catch {}
    }
    if (!currentUser?.id) {
      navigate('/sign-in?redirect=/toolkit')
      return
    }
    if (!generatedContent) return

    setSaving(true)
    try {
      const selectedSDG = sdgOptions.find(sdg => sdg.value === formData.sdgFocus)
      const truncatedTitle = `${selectedSDG?.label || 'GGJ'} Jam: ${formData.challenge.substring(0, 80)}${formData.challenge.length > 80 ? '...' : ''}`
      const durationMinutes = parseInt(formData.jamDuration || '0') * 480

      const newToolkit = {
        // The live toolkits.id has no working default, so generate one client-side.
        id: (typeof crypto !== 'undefined' && crypto.randomUUID)
          ? crypto.randomUUID()
          : `tk_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
        title: truncatedTitle,
        description: `AI-generated ${formData.jamDuration}-day GGJ toolkit for ${formData.participants} participants`,
        content: generatedContent,
        createdBy: currentUser.id,
        isPublic: false,
        sdgFocus: formData.sdgFocus,
        durationMinutes,
        participantCount: formData.participants,
        difficultyLevel: formData.difficultyLevel,
        downloadCount: 0
      }

      const saved = await (db as any).toolkits.create(newToolkit)
      const newId = saved?.id as string
      setSavedToolkitId(newId || null)

      // Optimistically add to in-memory library so it appears instantly
      const justSaved = {
        id: newId,
        title: newToolkit.title,
        description: newToolkit.description,
        content: '', // keep listing light; fetch full content on details/download
        createdBy: currentUser.id,
        isPublic: false,
        sdgFocus: newToolkit.sdgFocus,
        durationMinutes: newToolkit.durationMinutes,
        participantCount: newToolkit.participantCount,
        difficultyLevel: newToolkit.difficultyLevel,
        downloadCount: 0,
        createdAt: new Date().toISOString()
      } as Toolkit
      setToolkits(prev => [justSaved, ...prev.filter(t => t.id !== newId)])

      // Switch to Library → Mine so user immediately sees it
      setLibraryFilter('mine')
      ;(document.querySelector('[value="library"]') as HTMLElement)?.click()

      toast.success('Toolkit saved to your library! It is now visible under "My Toolkits".')
    } catch (e: any) {
      const msg = e?.message || e?.error_description || e?.details || ''
      console.error('[ToolkitPage] Save failed:', msg || e, e)
      toast.error(msg ? `Failed to save: ${msg}` : 'Failed to save toolkit. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const startNewToolkit = () => {
    setGeneratedContent('')
    setSavedToolkitId(null)
    setIsPreview(false)
    setFormData({
      challenge: '', sdgFocus: '', jamDuration: '', participants: '',
      resources: '', difficultyLevel: 'intermediate', localContext: '',
    })
    setEditingInputs(true)
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60)
  }

  return (
    <div className={`min-h-screen bg-background ${sdgThemeClass}`}>
      {/* Compact header — keep the focus on the form below */}
      <section className="border-b bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
                  <Wand2 className="h-3 w-3" /> AI Session Planner
                </span>
              </div>
              <h1 className="mt-2 font-display text-2xl sm:text-3xl font-extrabold tracking-tight">
                Toolkit <span className="text-primary-solid">Generator</span>
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                Answer a few questions and we'll build a 4-sprint jam agenda from real facilitation methods — powered by Metodic.
              </p>
            </div>
            {user && (
              <span className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
                <UserIcon className="h-3.5 w-3.5" /> {user.displayName || user.email}
              </span>
            )}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs defaultValue="generator" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="generator">Generate Toolkit</TabsTrigger>
            <TabsTrigger value="library">Toolkit Library</TabsTrigger>
          </TabsList>

          <TabsContent value="generator" className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wand2 className="w-5 h-5" />
                  AI Toolkit Generator
                </CardTitle>
                <p className="text-muted-foreground">
                  Answer a few questions and we'll build a 4-sprint jam agenda from real facilitation methods. Continue in{' '}
                  <span className="font-medium text-foreground">Metodic</span> to turn it into facilitator guides and slides, or complete the{' '}
                  <Link to="/course/enroll" className="text-primary hover:underline font-medium">Train-the-Trainer course</Link>{' '}
                  to unlock the full Jamkit.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {(editingInputs || !generatedContent) ? (
                <div ref={formRef} className="space-y-6 scroll-mt-24">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="challenge">Challenge Description *</Label>
                      <Textarea
                        id="challenge"
                        placeholder="Describe the specific challenge or problem you want to address in your session..."
                        value={formData.challenge}
                        onChange={(e) => handleInputChange('challenge', e.target.value)}
                        className="min-h-[100px]"
                      />
                    </div>

                    <div>
                      <Label htmlFor="sdg">SDG Focus *</Label>
                      <Select value={formData.sdgFocus} onValueChange={(value) => handleInputChange('sdgFocus', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a Sustainable Development Goal" />
                        </SelectTrigger>
                        <SelectContent>
                          {sdgOptions.map((sdg) => (
                            <SelectItem key={sdg.value} value={sdg.value}>
                              <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${sdg.color}`} />
                                {sdg.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="jamDuration">Jam Duration *</Label>
                      <Select value={formData.jamDuration} onValueChange={(value) => handleInputChange('jamDuration', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select jam duration" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 Day Jam (8 hours)</SelectItem>
                          <SelectItem value="2">2 Day Jam (16 hours)</SelectItem>
                          <SelectItem value="3">3 Day Jam (24 hours)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="participants">Number of Participants *</Label>
                      <Select value={formData.participants} onValueChange={(value) => handleInputChange('participants', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select participant count" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5-10">Small group (5-10 people)</SelectItem>
                          <SelectItem value="10-20">Medium group (10-20 people)</SelectItem>
                          <SelectItem value="20-50">Large group (20-50 people)</SelectItem>
                          <SelectItem value="50+">Very large group (50+ people)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="difficulty">Difficulty Level</Label>
                      <Select value={formData.difficultyLevel} onValueChange={(value) => handleInputChange('difficultyLevel', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="beginner">Beginner - New to design thinking</SelectItem>
                          <SelectItem value="intermediate">Intermediate - Some experience</SelectItem>
                          <SelectItem value="advanced">Advanced - Experienced facilitators</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="localContext">Local Context</Label>
                      <Textarea
                        id="localContext"
                        placeholder="Describe your local context, community, or specific regional considerations..."
                        value={formData.localContext}
                        onChange={(e) => handleInputChange('localContext', e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="resources">Available Resources</Label>
                      <Textarea
                        id="resources"
                        placeholder="List any specific materials, tools, or resources you have available (optional)..."
                        value={formData.resources}
                        onChange={(e) => handleInputChange('resources', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Loading Overlay during generation - PROMINENT VERSION */}
                {generating && (
                  <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-card border-2 border-primary/30 rounded-3xl p-12 shadow-2xl max-w-md mx-4 text-center space-y-6">
                      <div className="flex justify-center">
                        <div className="relative">
                          <Loader2 className="w-20 h-20 text-primary animate-spin" />
                          <div className="absolute inset-0 w-20 h-20 rounded-full border-4 border-primary/10" />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-foreground mb-3">
                          🤖 Building your jam agenda
                        </h3>
                        <p className="text-base text-muted-foreground leading-relaxed">
                          {genStatus || 'Selecting real facilitation methods from the Metodic library and arranging them across the four GGJ sprints…'}
                        </p>
                        <p className="text-sm text-primary font-medium mt-4">
                          This usually takes 30–60 seconds
                        </p>
                      </div>
                      <div className="flex justify-center gap-3">
                        <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}

                {!generating && (
                  <div className="flex justify-center">
                    <Button
                      onClick={generateToolkit}
                      disabled={loading || generating || !formData.challenge || !formData.sdgFocus || !formData.jamDuration || !formData.participants}
                      size="lg"
                      className="bg-primary-solid text-white hover:bg-primary/90"
                    >
                      {generating ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Generating your custom toolkit...
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-5 h-5 mr-2" />
                          {generatedContent ? 'Regenerate' : 'Generate Custom Toolkit'}
                        </>
                      )}
                    </Button>
                  </div>
                )}
                </div>
                ) : (
                  <div ref={formRef} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-muted/30 p-4 scroll-mt-24">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Your brief</p>
                      <p className="truncate font-medium">
                        {sdgOptions.find(s => s.value === formData.sdgFocus)?.label}: {formData.challenge}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formData.jamDuration} day{formData.jamDuration !== '1' ? 's' : ''} · {formData.participants} · {formData.difficultyLevel}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button
                        variant="outline"
                        onClick={() => { setEditingInputs(true); setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80) }}
                      >
                        <Wand2 className="w-4 h-4 mr-2" />Edit &amp; regenerate
                      </Button>
                      <Button variant="ghost" onClick={startNewToolkit}>
                        <Plus className="w-4 h-4 mr-2" />Start new
                      </Button>
                    </div>
                  </div>
                )}

                {generatedContent && (
                  <div ref={resultRef} className="scroll-mt-24">
                    <ToolkitDisplay
                      content={generatedContent}
                      sdgFocus={formData.sdgFocus}
                      jamDuration={formData.jamDuration}
                      participants={formData.participants}
                      challenge={formData.challenge}
                      onDownload={() => {
                        const selectedSDG = sdgOptions.find(sdg => sdg.value === formData.sdgFocus)

                        // New grounded agenda format → dedicated export
                        try {
                          const maybe = JSON.parse(generatedContent)
                          if (maybe?.format === 'ggj.jam-agenda.v1') {
                            const html = buildJamAgendaHtml(maybe, maybe._methods || {})
                            const blob = new Blob([html], { type: 'text/html' })
                            const url = URL.createObjectURL(blob)
                            const a = document.createElement('a')
                            a.href = url
                            a.download = `ggj_agenda_${(selectedSDG?.label || 'jam').replace(/[^a-z0-9]/gi, '_')}.html`
                            document.body.appendChild(a)
                            a.click()
                            document.body.removeChild(a)
                            URL.revokeObjectURL(url)
                            return
                          }
                        } catch (_) { /* fall through to legacy export */ }

                        // Try to build from structured JSON when available
                        let contentHtml = ''
                        try {
                          const data = JSON.parse(generatedContent)
                          const parts: string[] = []
                          if (data.overviewMarkdown) {
                            parts.push(markdownToBasicHtml(data.overviewMarkdown))
                          }
                          if (Array.isArray(data.methodCards) && data.methodCards.length) {
                            parts.push('<h2>Method Cards</h2>' + data.methodCards.map((m: any) => `
                              <h3>${m.title}</h3>
                              <p>${m.description}</p>
                              <p><strong>Duration:</strong> ${m.duration} &nbsp; <strong>Participants:</strong> ${m.participants}</p>
                              ${m.materials?.length ? `<h4>Materials</h4><ul>${m.materials.map((x: string) => `<li>${x}</li>`).join('')}</ul>` : ''}
                              ${m.steps?.length ? `<h4>Steps</h4><ol>${m.steps.map((x: string) => `<li>${x}</li>`).join('')}</ol>` : ''}
                              ${m.tips?.length ? `<div><strong>Tips</strong><ul>${m.tips.map((x: string) => `<li>${x}</li>`).join('')}</ul></div>` : ''}
                            `).join(''))
                          }
                          if (Array.isArray(data.templates) && data.templates.length) {
                            parts.push('<h2>Participant Templates</h2>' + data.templates.map((t: any) => `
                              <h3>${t.title}</h3>
                              <p>${t.description}</p>
                              ${Array.isArray(t.sections) ? t.sections.map((s: any) => `
                                <h4>${s.title}</h4>
                                <p>${s.prompt}</p>
                              `).join('') : ''}
                            `).join(''))
                          }
                          if (data.sessionPlan?.days?.length) {
                            parts.push('<h2>Session Plan</h2>' + data.sessionPlan.days.map((d: any) => `
                              <h3>Day ${d.day}: ${d.theme}</h3>
                              <p><em>${d.objective}</em></p>
                              ${d.activities.map((a: any) => `
                                <div>
                                  <strong>${a.time}</strong> (${a.duration}) — ${a.title}<br/>
                                  <span>${a.description}</span>
                                </div>
                              `).join('')}
                            `).join(''))
                          }
                          contentHtml = parts.join('\n')
                        } catch (_) {
                          // Fallback: treat as markdown text
                          contentHtml = markdownToBasicHtml(generatedContent)
                        }

                        const html = buildToolkitHtml({
                          title: `${selectedSDG?.label}: ${formData.challenge}`,
                          sdgLabel: selectedSDG?.label,
                          jamDuration: formData.jamDuration,
                          participants: formData.participants,
                          challenge: formData.challenge,
                          contentHtml
                        })
                        const blob = new Blob([html], { type: 'text/html' })
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = `toolkit_${selectedSDG?.label?.replace(/[^a-z0-9]/gi, '_')}.html`
                        document.body.appendChild(a)
                        a.click()
                        document.body.removeChild(a)
                        URL.revokeObjectURL(url)
                      }}
                      locked={false}
                      onUnlock={() => navigate('/sign-in')}
                    />

                    {/* Actions below the generated preview */}
                    <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:justify-center">
                      <Button
                        onClick={saveGeneratedToolkit}
                        disabled={saving}
                        className="bg-primary-solid text-white hover:bg-primary/90"
                      >
                        <SaveIcon className="w-4 h-4 mr-2" />
                        {saving ? 'Saving…' : savedToolkitId ? 'Saved ✓' : 'Save to My Toolkits'}
                      </Button>
                      {savedToolkitId && (
                        <Button
                          variant="outline"
                          onClick={() => navigate(`/toolkit/${savedToolkitId}`)}
                        >
                          View Saved Toolkit
                        </Button>
                      )}
                      <Button variant="ghost" onClick={startNewToolkit}>
                        <Plus className="w-4 h-4 mr-2" />Start a new toolkit
                      </Button>
                    </div>

                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="library" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold font-display text-foreground">Toolkit Library</h2>
                <p className="text-muted-foreground">Browse and download community-created toolkits</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={libraryFilter === 'all' ? 'default' : 'outline'}
                  className={libraryFilter === 'all' ? 'bg-primary-solid text-white hover:bg-primary/90' : ''}
                  onClick={() => setLibraryFilter('all')}
                  size="sm"
                >
                  All
                </Button>
                <Button
                  variant={libraryFilter === 'mine' ? 'default' : 'outline'}
                  className={libraryFilter === 'mine' ? 'bg-primary-solid text-white hover:bg-primary/90' : ''}
                  onClick={() => setLibraryFilter('mine')}
                  size="sm"
                >
                  My Toolkits
                </Button>
                <Button
                  variant={libraryFilter === 'others' ? 'default' : 'outline'}
                  className={libraryFilter === 'others' ? 'bg-primary-solid text-white hover:bg-primary/90' : ''}
                  onClick={() => setLibraryFilter('others')}
                  size="sm"
                >
                  Other Hosts
                </Button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredToolkits.map((toolkit) => {
                const sdg = sdgOptions.find(s => s.value === toolkit.sdgFocus)
                const creator = creators[toolkit.createdBy]
                const isMine = toolkit.createdBy === user?.id
                const isPublic = Boolean(toolkit.isPublic)
                return (
                  <Link key={toolkit.id} to={`/toolkit/${toolkit.id}`} className="block group">
                    <Card className="shadow-soft hover:shadow-card-hover transition-all group-hover:-translate-y-0.5">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">{toolkit.title}</CardTitle>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {toolkit.description}
                            </p>
                            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                              <span className="inline-flex items-center gap-1">
                                <UserIcon className="w-3 h-3" />
                                {creator?.displayName || 'Unknown'}
                              </span>
                              {creator?.location && (
                                <span className="inline-flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {creator.location}
                                </span>
                              )}
                              {isMine && (
                                <Badge variant="outline" className="text-[10px]">Mine</Badge>
                              )}
                              {isMine && (
                                <Badge variant="secondary" className="text-[10px]">
                                  {isPublic ? 'Public' : 'Private'}
                                </Badge>
                              )}
                            </div>
                          </div>
                          {sdg && (
                            <div className={`w-4 h-4 rounded-full ${sdg.color} flex-shrink-0 ml-2`} />
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex flex-wrap gap-2">
                            {sdg && (
                              <Badge variant="secondary" className="text-xs">
                                {sdg.label}
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-xs">
                              <Clock className="w-3 h-3 mr-1" />
                              {Math.round((toolkit.durationMinutes || 0) / 480)} day{Math.round((toolkit.durationMinutes || 0) / 480) !== 1 ? 's' : ''}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              <Users className="w-3 h-3 mr-1" />
                              {toolkit.participantCount}
                            </Badge>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              {toolkit.downloadCount || 0} downloads
                            </span>
                            <Button
                              size="sm"
                              onClick={(e) => { e.preventDefault(); downloadToolkit(toolkit) }}
                              className="bg-primary-solid text-white hover:bg-primary/90"
                            >
                              <Download className="w-4 h-4 mr-1" />
                              Download
                            </Button>
                          </div>

                          {isMine && libraryFilter === 'mine' && (
                            <div className="flex items-center justify-between pt-3 mt-1 border-t">
                              <span className="text-xs text-muted-foreground">Public in Library</span>
                              {/* Stop link navigation when toggling */}
                              <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                                {/* @ts-ignore - Switch accepts onClick */}
                                <PublicSwitch
                                  checked={isPublic}
                                  onCheckedChange={async (checked: boolean) => {
                                    // optimistic update
                                    setToolkits(prev => prev.map(t => t.id === toolkit.id ? { ...t, isPublic: checked } : t))
                                    try {
                                      await (db as any).toolkits.update(toolkit.id, { isPublic: checked })
                                    } catch (err) {
                                      // revert
                                      setToolkits(prev => prev.map(t => t.id === toolkit.id ? { ...t, isPublic: !checked } : t))
                                      toast.error('Failed to update visibility. Please try again.')
                                    }
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>

            {filteredToolkits.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No toolkits found</h3>
                  <p className="text-muted-foreground mb-4">
                    {libraryFilter === 'mine' ? "You haven't generated any toolkits yet." : libraryFilter === 'others' ? 'No community toolkits available yet.' : 'Be the first to generate a toolkit and contribute to the library!'}
                  </p>
                  <Button onClick={() => (document.querySelector('[value=\"generator\"]') as HTMLElement)?.click()}>
                    <Wand2 className="w-4 h-4 mr-2" />
                    Generate Toolkit
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
