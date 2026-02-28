import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
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
  Target,
  BookOpen,
  Loader2,
  User as UserIcon,
  MapPin,
  Save as SaveIcon
} from 'lucide-react'
import blink, { safeDbCall, getFullUser } from '../lib/blink'
import ToolkitDisplay from '../components/ToolkitDisplay'
import { buildToolkitHtml, markdownToBasicHtml } from '../lib/toolkitExport'

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
  const [isPreview, setIsPreview] = useState(false)
  const [isCertified, setIsCertified] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedToolkitId, setSavedToolkitId] = useState<string | null>(null)

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
    const unsubscribe = blink.auth.onAuthStateChanged(() => {
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
          safeDbCall(() => (blink.db as any).toolkits.list({
            where: { isPublic: "1" },
            orderBy: { createdAt: 'desc' },
            limit: 50
          })),
          safeDbCall(() => (blink.db as any).toolkits.list({
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
        merged = (await safeDbCall(() => (blink.db as any).toolkits.list({
          where: { isPublic: "1" },
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
      console.error('[ToolkitPage] Error fetching toolkits (Blink DB):', err)
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
            const rows = await safeDbCall(() => (blink.db as any).users.list({ where: { id }, limit: 1 }))
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

  // Build a lightweight preview (no AI call)
  const buildPreviewContent = () => {
    const selectedSDG = sdgOptions.find(sdg => sdg.value === formData.sdgFocus)
    const sdgLabel = selectedSDG?.label || 'Selected SDG'
    return [
      '### Jam Overview',
      `- Duration: ${formData.jamDuration || '—'} day(s)`,
      `- Participants: ${formData.participants || '—'}`,
      `- SDG Focus: ${sdgLabel}`,
      `- Challenge: ${formData.challenge || '—'}`,
      '',
      '### 4-Sprint Outline (Preview)',
      '- Sprint 1: Understand & Empathize — Frame the challenge and stakeholders',
      '- Sprint 2: Define & Ideate — Generate and cluster solution directions',
      '- Sprint 3: Prototype & Test — Build quick prototypes and test with users',
      '- Sprint 4: Implement & Scale — Plan roadmap, owners, and next steps',
      '',
      '### Sample Methods (Locked)',
      '- Stakeholder Mapping — Identify key actors (details locked)',
      '- Crazy 8s — Fast ideation (details locked)',
      '',
      'This is a preview. Certified Hosts unlock full step-by-step guides, printable method cards, participant templates, and a detailed session plan.'
    ].join('\n')
  }

  // Robustly extract a JSON object from AI output that may include code fences or extra text
  function extractJsonObject(raw: string): any | null {
    if (!raw) return null
    let s = raw.trim()
    // strip markdown fences if present
    s = s.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim()
    // find first opening brace and last closing brace
    const start = s.indexOf('{')
    const end = s.lastIndexOf('}')
    if (start >= 0 && end > start) {
      const candidate = s.slice(start, end + 1)
      try {
        return JSON.parse(candidate)
      } catch (_) {
        try {
          const fixed = candidate.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']')
          return JSON.parse(fixed)
        } catch (_) { /* ignore */ }
      }
    }
    try { return JSON.parse(s) } catch (_) {}
    return null
  }

  const generateToolkit = async () => {
    if (!formData.challenge || !formData.sdgFocus || !formData.jamDuration || !formData.participants) {
      alert('Please fill in all required fields')
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

      // Build comprehensive prompt with strict JSON output
      const totalHours = parseInt(formData.jamDuration) * 8
      const prompt = `You are an expert facilitator creating a comprehensive Global Goals Jam toolkit. Tailor everything precisely to the inputs.

Return ONLY a single valid JSON object (no commentary, no markdown fences) with this exact shape:
{
  "overviewMarkdown": string, // 500-1200 words. Use headings and bullet lists.
  "sessionPlan": {
    "days": [
      {
        "day": number,
        "theme": string,
        "objective": string,
        "activities": [
          {
            "time": "HH:MM",
            "duration": "NN min",
            "title": string,
            "description": string,
            "materials": string[],
            "steps": string[],
            "facilitatorNotes": string[],
            "energyLevel": "low" | "medium" | "high"
          }
        ]
      }
    ]
  },
  "methodCards": [
    {
      "title": string,
      "description": string,
      "duration": string,
      "participants": string,
      "phase": "understand" | "define" | "prototype" | "implement",
      "difficulty": "easy" | "medium" | "hard",
      "materials": string[],
      "steps": string[],
      "tips": string[]
    }
  ],
  "templates": [
    {
      "title": string,
      "description": string,
      "phase": "understand" | "define" | "prototype" | "implement",
      "sections": [
        { "title": string, "type": "text" | "list" | "canvas" | "rating", "prompt": string, "options"?: string[] }
      ]
    }
  ]
}

Strict requirements:
- Build a complete hour-by-hour schedule that covers exactly ${totalHours} hours in total across ${formData.jamDuration} day(s), including breaks. Do not stop early.
- Start each day at 09:00 and end at 17:00 with contiguous activities.
- Methods must align with the 4 sprints and with SDG ${selectedSDG?.label || 'General'}.
- Include facilitator notes and concrete materials.
- Templates must match the methods you propose.

Context:
Challenge: ${formData.challenge}
SDG Focus: ${selectedSDG?.label || 'General SDG'}
Duration: ${formData.jamDuration} day(s) (${totalHours} hours total)
Participants: ${formData.participants}
Difficulty Level: ${formData.difficultyLevel}
Local Context: ${formData.localContext || 'No specific local context provided'}
Available Resources: ${formData.resources || 'Standard workshop materials (flip charts, markers, post-its)'}

Make it specific, actionable, and tailored. Output valid JSON only.`

      console.log('[ToolkitPage] 🚀 Starting AI generation with prompt length:', prompt.length)
      const startTime = Date.now()

      // Primary model using Blink AI (no external proxy) with graceful fallback
      const MODEL_PRIMARY = 'gpt-4.1-mini'
      const MODEL_FALLBACK = 'gpt-4.1'
      const MAX_TOKENS = 4000

      let text: string = ''
      try {
        const res = await blink.ai.generateText({
          prompt: `Return ONLY valid JSON answering the following. If you cannot, fix formatting and still return a single JSON object.\n\n${prompt}`,
          model: MODEL_PRIMARY,
          maxTokens: MAX_TOKENS
        })
        text = res.text || ''
      } catch (primaryErr) {
        console.warn('[ToolkitPage] Primary Blink AI call failed, attempting fallback...', primaryErr)
        try {
          const res2 = await blink.ai.generateText({
            prompt: `Return ONLY valid JSON answering the following. If you cannot, fix formatting and still return a single JSON object.\n\n${prompt}`,
            model: MODEL_FALLBACK,
            maxTokens: MAX_TOKENS
          })
          text = res2.text || ''
        } catch (fallbackErr) {
          console.error('[ToolkitPage] Fallback generation failed', fallbackErr)
          throw fallbackErr
        }
      }

      const duration = ((Date.now() - startTime) / 1000).toFixed(2)
      console.log(`[ToolkitPage] ✓ AI generation complete in ${duration}s, text length:`, text?.length)

      if (!text || text.length < 20) {
        throw new Error('AI generation returned invalid content')
      }

      // Try to parse structured JSON (robust extraction)
      let structured: any = extractJsonObject(text)
      const contentToStore = structured ? JSON.stringify(structured) : text

      // For logged-in users, ALWAYS use full generation
      setIsPreview(false)
      setGeneratedContent(contentToStore)

      // Do not auto-save. Show explicit Save button for users to add to their library.
      setSavedToolkitId(null)

    } catch (error: any) {
      console.error('[ToolkitPage] ✗ Generation failed:', error)
      
      // Detailed error message for users
      let userMessage = 'Failed to generate toolkit. '
      
      const status = error?.status || error?.response?.status
      const apiMsg = error?.details?.error?.message || error?.details?.message || error?.response?.data?.error?.message

      if (status === 401 || status === 403) {
        userMessage += 'OpenAI authentication failed. Please check API key configuration.'
      } else if (status === 429 || /rate limit/i.test(error?.message || '')) {
        userMessage += 'OpenAI rate limit reached. Please try again in a few minutes.'
      } else if (/api key|unauthorized/i.test(error?.message || '')) {
        userMessage += 'OpenAI API key is missing or invalid. Please contact support.'
      } else if (/network|fetch|timeout/i.test(error?.message || '')) {
        userMessage += 'Network error. Please check your connection and try again.'
      } else if (apiMsg) {
        userMessage += apiMsg
      } else if (error?.message) {
        userMessage += error.message
      } else {
        userMessage += 'Unknown error occurred. Please try again.'
      }

      if (status) userMessage += ` (HTTP ${status})`
      
      alert('⚠️ ' + userMessage)
    } finally {
      console.log('[ToolkitPage] 🏁 Generation process finished (success or error)')
      setGenerating(false)
    }
  }

  const downloadToolkit = async (toolkit: Toolkit) => {
    try {
      // Update download count optimistically
      await blink.db.toolkits.update(toolkit.id, {
        downloadCount: (toolkit.downloadCount || 0) + 1
      })

      // Fetch full content on-demand to avoid loading massive payloads in listings
      const fullRows = await safeDbCall(() => (blink.db as any).toolkits.list({ where: { id: toolkit.id }, limit: 1 }))
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

      const saved = await (blink.db as any).toolkits.create(newToolkit)
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

      alert('Toolkit saved to your library! It is now visible under "My Toolkits".')
    } catch (e: any) {
      console.error('[ToolkitPage] Save failed:', e)
      alert('Failed to save toolkit. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={`min-h-screen bg-background ${sdgThemeClass}`}>
      {/* Simple Header (removed duplicate/legacy generator) */}
      <div className="pt-10 pb-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge variant="secondary" className="mb-3 px-4 py-1.5 text-sm font-medium">
              <Wand2 className="w-4 h-4 mr-2" />
              AI-Powered Session Planning
            </Badge>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">Toolkit <span className="text-primary-solid">Generator</span></h1>
            {user && (
              <div className="mt-3 flex justify-center">
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
                  <UserIcon className="w-4 h-4" />
                  Signed in as {user.displayName || user.email}
                </div>
              </div>
            )}
            <p className="text-muted-foreground mt-4 max-w-3xl mx-auto">
              Create customized session plans with detailed guides, method cards, and templates tailored to your challenge and SDG focus.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
                  Answer a few questions about your session and we'll generate a comprehensive toolkit with facilitation guides, method cards, and templates.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
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
                          🤖 AI is generating your toolkit
                        </h3>
                        <p className="text-base text-muted-foreground leading-relaxed">
                          Creating a comprehensive session plan with detailed facilitation guides, method cards, and templates...
                        </p>
                        <p className="text-sm text-primary font-medium mt-4">
                          This usually takes 15-30 seconds
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
                          Generate Custom Toolkit
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {generatedContent && (
                  <>
                    <ToolkitDisplay
                      content={generatedContent}
                      sdgFocus={formData.sdgFocus}
                      jamDuration={formData.jamDuration}
                      participants={formData.participants}
                      challenge={formData.challenge}
                      onDownload={() => {
                        const selectedSDG = sdgOptions.find(sdg => sdg.value === formData.sdgFocus)
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
                        {saving ? 'Saving…' : 'Save to My Toolkits'}
                      </Button>
                      {savedToolkitId && (
                        <Button
                          variant="outline"
                          onClick={() => navigate(`/toolkit/${savedToolkitId}`)}
                        >
                          View Saved Toolkit
                        </Button>
                      )}
                    </div>

                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="library" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Toolkit Library</h2>
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
                    <Card className="hover:shadow-lg transition-all group-hover:-translate-y-0.5">
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
                                      await (blink.db as any).toolkits.update(toolkit.id, { isPublic: checked })
                                    } catch (err) {
                                      // revert
                                      setToolkits(prev => prev.map(t => t.id === toolkit.id ? { ...t, isPublic: !checked } : t))
                                      alert('Failed to update visibility. Please try again.')
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
