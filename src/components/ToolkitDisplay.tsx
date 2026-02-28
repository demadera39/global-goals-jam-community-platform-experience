import { useMemo, useRef, useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Separator } from './ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import {
  Download,
  Clock,
  Users,
  Target,
  CheckCircle,
  ArrowRight,
  Lightbulb,
  Zap,
  TrendingUp,
  FileText,
  Printer,
  Layout,
  BookOpen,
  ClipboardList,
  Calendar,
  Loader2
} from 'lucide-react'
import SDGCard from './SDGCard'
import MethodCard from './MethodCard'
import ParticipantTemplate from './ParticipantTemplate'
import SessionPlan from './SessionPlan'
import { buildToolkitHtml, markdownToBasicHtml, buildMethodCardHtml, buildParticipantTemplateHtml, buildSessionPlanHtml } from '../lib/toolkitExport'

interface ToolkitDisplayProps {
  content: string
  sdgFocus: string
  jamDuration: string
  participants: string
  challenge: string
  onDownload: () => void
  locked?: boolean
  onUnlock?: () => void
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

const sprintIcons = [
  { icon: Target, color: 'text-blue-500', bg: 'bg-blue-50' },
  { icon: Lightbulb, color: 'text-yellow-500', bg: 'bg-yellow-50' },
  { icon: Zap, color: 'text-purple-500', bg: 'bg-purple-50' },
  { icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-50' }
]

export default function ToolkitDisplay({
  content,
  sdgFocus,
  jamDuration,
  participants,
  challenge,
  onDownload,
  locked = false,
  onUnlock
}: ToolkitDisplayProps) {
  const selectedSDG = sdgOptions.find(sdg => sdg.value === sdgFocus)

  // Try parse structured JSON content (robust)
  const parseMaybeJson = (raw: string): any | null => {
    if (!raw) return null
    let s = raw.trim()
    s = s.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim()
    const start = s.indexOf('{')
    const end = s.lastIndexOf('}')
    if (start >= 0 && end > start) {
      const candidate = s.slice(start, end + 1)
      try {
        const obj = JSON.parse(candidate)
        if (typeof obj === 'string' && obj.trim().startsWith('{')) {
          try { return JSON.parse(obj) } catch (_) { /* ignore */ }
        }
        return obj
      } catch (_) {
        try {
          const fixed = candidate.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']')
          const obj2 = JSON.parse(fixed)
          if (typeof obj2 === 'string' && obj2.trim().startsWith('{')) {
            try { return JSON.parse(obj2) } catch (_) { /* ignore */ }
          }
          return obj2
        } catch (_) {}
      }
    }
    try {
      const direct = JSON.parse(s)
      if (typeof direct === 'string' && direct.trim().startsWith('{')) {
        try { return JSON.parse(direct) } catch (_) { /* ignore */ }
      }
      return direct
    } catch (_) {}
    return null
  }
  const structured: any = parseMaybeJson(content)

  // Extra-resilient overview extraction when JSON parsing fails or key differs
  const extractOverviewMarkdown = (raw: string, obj: any | null): string | null => {
    if (obj && (obj.overviewMarkdown || obj.overview || obj.introductionMarkdown)) {
      return obj.overviewMarkdown || obj.overview || obj.introductionMarkdown
    }
    const s = (raw || '').trim()
    if (!s) return null
    // If raw looks like JSON, try regex extraction of overviewMarkdown
    if (s.startsWith('{') || s.includes('\"overviewMarkdown\"')) {
      const m = s.match(/\"overviewMarkdown\"\s*:\s*\"([\s\S]*?)\"/)
      if (m && m[1]) {
        try {
          // Unescape common sequences
          const unescaped = m[1]
            .replace(/\\n/g, '\n')
            .replace(/\\t/g, '\t')
            .replace(/\\r/g, '')
            .replace(/\\"/g, '"')
          return unescaped
        } catch (_) { /* ignore */ }
      }
    }
    return null
  }

  const overviewMarkdown = extractOverviewMarkdown(content, structured)
  const overviewHtml = overviewMarkdown ? markdownToBasicHtml(overviewMarkdown) : null

  // Parse content (fallback)
  const sections = content.split('###').filter(section => section.trim())

  // Default method cards (fallback)
  const defaultMethodCards = [
    {
      title: 'Stakeholder Mapping',
      description: 'Identify and understand all stakeholders affected by your challenge',
      duration: '45 min',
      participants: '3-6 people',
      phase: 'understand' as const,
      difficulty: 'easy' as const,
      materials: ['Sticky notes', 'Markers', 'Large paper', 'Dot stickers'],
      steps: [
        'List all people affected by the challenge',
        'Map their relationships and influence levels',
        'Identify key stakeholders to interview',
        'Prioritize stakeholders by impact and accessibility'
      ],
      tips: [
        'Include unexpected stakeholders',
        'Consider both direct and indirect impacts',
        'Use different colors for different stakeholder types'
      ]
    },
    {
      title: 'Problem Definition Canvas',
      description: 'Define the core problem using a structured approach',
      duration: '60 min',
      participants: '4-8 people',
      phase: 'define' as const,
      difficulty: 'medium' as const,
      materials: ['Canvas template', 'Sticky notes', 'Markers', 'Timer'],
      steps: [
        'Write the problem statement',
        'Identify root causes',
        'Define success criteria',
        'Set constraints and assumptions'
      ],
      tips: [
        'Keep the problem statement specific',
        "Use 'How might we...' questions",
        'Validate with stakeholder insights'
      ]
    },
    {
      title: 'Rapid Prototyping',
      description: 'Build quick, testable versions of your solution ideas',
      duration: '90 min',
      participants: '2-4 people',
      phase: 'prototype' as const,
      difficulty: 'medium' as const,
      materials: ['Cardboard', 'Tape', 'Scissors', 'Markers', 'Digital tools'],
      steps: [
        'Choose 2-3 top ideas to prototype',
        'Build low-fidelity versions quickly',
        'Test with potential users',
        'Iterate based on feedback'
      ],
      tips: [
        'Focus on core functionality first',
        "Don't make it too polished",
        'Test early and often'
      ]
    },
    {
      title: 'Implementation Roadmap',
      description: 'Create a realistic plan for bringing your solution to life',
      duration: '75 min',
      participants: '4-6 people',
      phase: 'implement' as const,
      difficulty: 'hard' as const,
      materials: ['Timeline template', 'Resource cards', 'Sticky notes', 'Markers'],
      steps: [
        'Break solution into phases',
        'Identify required resources',
        'Map dependencies and risks',
        'Create actionable next steps'
      ],
      tips: [
        'Start with a pilot or MVP',
        'Consider sustainability from day one',
        'Plan for measuring impact'
      ]
    }
  ]

  // Participant templates (fallback demo)
  const defaultParticipantTemplates = [
    {
      title: 'Stakeholder Empathy Map',
      description: "Understand your stakeholders' thoughts, feelings, and experiences",
      phase: 'understand' as const,
      sections: [
        { title: 'What do they THINK?', type: 'text' as const, prompt: 'What thoughts might be going through their mind? What are their beliefs and assumptions?' },
        { title: 'What do they FEEL?', type: 'text' as const, prompt: 'What emotions do they experience? What are their fears and aspirations?' },
        { title: 'What do they SEE?', type: 'list' as const, prompt: 'What do they see in their environment? What influences them?' },
        { title: 'What do they SAY & DO?', type: 'text' as const, prompt: 'What are their behaviors and actions? What do they say publicly?' }
      ]
    },
    {
      title: 'Idea Evaluation Matrix',
      description: 'Systematically evaluate and prioritize your solution ideas',
      phase: 'define' as const,
      sections: [
        { title: 'List Your Ideas', type: 'list' as const, prompt: 'Write down all the solution ideas your team generated' },
        { title: 'Evaluation Criteria', type: 'rating' as const, prompt: 'Rate each idea on these criteria (1-5 scale):', options: ['Impact on SDG', 'Feasibility', 'Innovation', 'Sustainability', 'User Desirability'] }
      ]
    }
  ]

  // Use structured data when available
  const methodCardsToShow = Array.isArray(structured?.methodCards) && structured.methodCards.length ? structured.methodCards : defaultMethodCards
  const participantTemplatesToShow = Array.isArray(structured?.templates) && structured.templates.length ? structured.templates : defaultParticipantTemplates

  // Official guide URL
  const GUIDE_URL = 'https://firebasestorage.googleapis.com/v0/b/blink-451505.firebasestorage.app/o/user-uploads%2Fz9Up8fyufsOU2ncxMU2r2iGBON23%2FGGJ_guidelines21__27aa0b11.pdf?alt=media&token=5d7aa585-3b39-433e-8155-1b3b9b8e1eea'

  // Session plan (baseline demo). In a full flow this may be enriched by AI.
  const basePlan = useMemo(() => {
    type Act = {
      time: string
      duration: string
      title: string
      description: string
      materials: string[]
      steps?: string[]
      facilitatorNotes: string[]
      energyLevel: 'low' | 'medium' | 'high'
    }
    const day1: Act[] = [
      {
        time: '09:00', duration: '30 min', title: 'Welcome & Energizer',
        description: 'Welcome, objectives, and a quick energizer to kickstart collaboration.',
        materials: ['Name tags', 'Markers', 'Music'],
        steps: [
          'Introduce facilitators and agenda',
          'Share the challenge and SDG focus',
          'Run a 5-minute icebreaker'
        ],
        facilitatorNotes: ['Set inclusive tone', 'Clarify logistics (wifi, restrooms)', 'Establish code of conduct'],
        energyLevel: 'high'
      },
      {
        time: '09:30', duration: '30 min', title: 'Challenge Brief + SDG Context',
        description: 'Ground everyone in the local context and SDG targets.',
        materials: ['Slides', 'Projector'],
        steps: ['Present challenge statement', 'Connect to specific SDG targets', 'Q&A for clarifications'],
        facilitatorNotes: ['Keep it crisp', 'Highlight impact stories'],
        energyLevel: 'medium'
      }
    ]
    const daysArr = Array.from({ length: parseInt(jamDuration || '1') }, (_, index) => ({
      day: index + 1,
      theme: index === 0 ? 'Understand & Define' : index === 1 ? 'Ideate & Prototype' : 'Test & Implement',
      objective: index === 0 ? 'Deep dive into the challenge and define the problem' : index === 1 ? 'Generate solutions and build prototypes' : 'Test solutions and plan implementation',
      activities: day1
    }))
    return {
      title: `${selectedSDG?.label} Global Goals Jam`,
      duration: `${jamDuration} day(s)`,
      participants,
      sdgFocus: selectedSDG?.label || '',
      challenge,
      days: daysArr
    }
  }, [selectedSDG?.label, jamDuration, participants, challenge])

  const sessionPlan = useMemo(() => {
    if (structured?.sessionPlan?.days && Array.isArray(structured.sessionPlan.days)) {
      try {
        return {
          title: `${selectedSDG?.label} Global Goals Jam`,
          duration: `${jamDuration} day(s)`,
          participants,
          sdgFocus: selectedSDG?.label || '',
          challenge,
          days: structured.sessionPlan.days.map((d: any, idx: number) => ({
            day: Number(d.day) || (idx + 1),
            theme: d.theme || '',
            objective: d.objective || '',
            activities: (d.activities || []).map((a: any) => ({
              time: a.time || '09:00',
              duration: a.duration || (a.minutes ? `${a.minutes} min` : '30 min'),
              title: a.title || 'Activity',
              description: a.description || '',
              materials: Array.isArray(a.materials) ? a.materials : [],
              steps: Array.isArray(a.steps) ? a.steps : [],
              facilitatorNotes: Array.isArray(a.facilitatorNotes) ? a.facilitatorNotes : [],
              energyLevel: a.energyLevel === 'low' || a.energyLevel === 'high' ? a.energyLevel : 'medium'
            }))
          }))
        }
      } catch (_) {
        // fall back below
      }
    }
    return basePlan
  }, [structured, selectedSDG?.label, jamDuration, participants, challenge, basePlan])

  const handlePrintPDF = () => {
    if (locked) {
      onUnlock?.()
      return
    }
    const html = buildToolkitHtml({
      title: `Toolkit — ${selectedSDG?.label || ''}: ${challenge}`,
      sdgLabel: selectedSDG?.label,
      jamDuration,
      participants,
      challenge,
      contentHtml: markdownToBasicHtml(content)
    })
    const w = window.open('', '_blank')
    if (!w) return
    w.document.write(html)
    w.document.close()
    w.focus()
    setTimeout(() => {
      w.print()
      w.close()
    }, 250)
  }

  return (
    <Card className="mt-8 overflow-hidden">
      {/* Header with GGJ Branding */}
      <CardHeader className="bg-gradient-to-r from-primary to-primary/80 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
              <div className="text-white font-bold text-xl">GGJ</div>
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-white">Toolkit</CardTitle>
              <p className="text-white/90 mt-1">{selectedSDG?.label}: {challenge}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 mb-2">
              {selectedSDG && (<div className={`w-6 h-6 rounded-full ${selectedSDG.color}`} />)}
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">SDG {sdgFocus.replace('sdg', '')}</Badge>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="bg-white/10 text-white border-white/30"><Clock className="w-3 h-3 mr-1" />{jamDuration} day{jamDuration !== '1' ? 's' : ''}</Badge>
              <Badge variant="outline" className="bg-white/10 text-white border-white/30"><Users className="w-3 h-3 mr-1" />{participants}</Badge>
            </div>
          </div>
        </div>
      </CardHeader>

      {locked && (
        <div className="bg-amber-50 text-amber-900 px-6 py-3 text-sm">Preview mode — details are partially hidden. Unlock to get the full plan, method cards and templates.</div>
      )}

      <CardContent className="p-0">
        {/* 4-Sprint Overview */}
        <div className="p-6 bg-gradient-to-br from-muted/10 to-muted/30">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><CheckCircle className="w-5 h-5 text-primary" />The 4-Sprint Structure</h3>
          <div className="grid md:grid-cols-4 gap-4">
            {['Understand & Empathize', 'Define & Ideate', 'Prototype & Test', 'Implement & Scale'].map((sprint, index) => {
              const IconComponent = sprintIcons[index].icon
              return (
                <div key={index} className="text-center">
                  <div className={`w-16 h-16 rounded-full ${sprintIcons[index].bg} flex items-center justify-center mx-auto mb-3`}>
                    <IconComponent className={`w-8 h-8 ${sprintIcons[index].color}`} />
                  </div>
                  <div className="font-semibold text-sm mb-1">Sprint {index + 1}</div>
                  <div className="text-xs text-muted-foreground">{sprint}</div>
                </div>
              )
            })}
          </div>
        </div>

        <Separator />

        {/* Tabbed Content */}
        <div className="p-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview" className="flex items-center gap-2"><BookOpen className="w-4 h-4" />Overview</TabsTrigger>
              <TabsTrigger value="sdg-cards" className="flex items-center gap-2"><Target className="w-4 h-4" />SDG Cards</TabsTrigger>
              <TabsTrigger value="method-cards" className="flex items-center gap-2"><Layout className="w-4 h-4" />Method Cards</TabsTrigger>
              <TabsTrigger value="templates" className="flex items-center gap-2"><ClipboardList className="w-4 h-4" />Templates</TabsTrigger>
              <TabsTrigger value="session-plan" className="flex items-center gap-2"><Calendar className="w-4 h-4" />Session Plan</TabsTrigger>
              <TabsTrigger value="enrich" className="flex items-center gap-2"><Loader2 className={`w-4 h-4`} />Enrich</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6 space-y-6">
              {overviewHtml ? (
                <div className="richtext text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: overviewHtml }} />
              ) : (
                sections.map((section, index) => {
                  const lines = section.trim().split('\n')
                  const title = lines[0]?.trim()
                  const body = lines.slice(1).join('\n').trim()
                  if (!title || !body) return null
                  const bodyHtml = markdownToBasicHtml(body)
                  return (
                    <div key={index} className="space-y-3">
                      <h4 className="text-lg font-semibold text-foreground flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-primary" />{title}</h4>
                      <div className="pl-4 border-l-2 border-primary/20">
                        <div className="richtext text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
                      </div>
                    </div>
                  )
                })
              )}
            </TabsContent>

            <TabsContent value="sdg-cards" className="mt-6">
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-foreground mb-2">SDG Focus Card</h3>
                  <p className="text-sm text-muted-foreground mb-6">Print and use this card to keep your team focused on the selected Sustainable Development Goal</p>
                </div>
                <div className="flex justify-center">
                  <div className={`w-80 ${locked ? 'relative' : ''}}`}
                  >
                    {locked && (
                      <div className="absolute inset-0 z-10 bg-background/70 backdrop-blur-sm border border-dashed border-primary/30 rounded-md flex items-center justify-center text-sm">
                        <div className="text-center">
                          <div className="font-semibold mb-1">Locked preview</div>
                          <Button size="sm" onClick={() => onUnlock?.()} className="bg-primary-solid text-white hover:bg-primary/90">Unlock</Button>
                        </div>
                      </div>
                    )}
                    <div className={locked ? 'pointer-events-none blur-[1px]' : ''}>
                      <SDGCard
                        sdgNumber={parseInt(sdgFocus.replace('sdg', ''))}
                        title={selectedSDG?.label || ''}
                        description="This SDG focuses on creating sustainable solutions for global challenges through collaborative innovation and community engagement."
                        colorClass={selectedSDG?.color || 'bg-primary'}
                        challenge={challenge}
                        isSelected={true}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="method-cards" className="mt-6">
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-foreground mb-2">Method Cards</h3>
                  <p className="text-sm text-muted-foreground mb-6">Print these cards and use them during your jam session. Each card provides step-by-step instructions for key activities.</p>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  {methodCardsToShow.map((card, index) => (
                    <div key={index} className="relative">
                      {locked && (
                        <div className="absolute inset-0 z-10 bg-background/70 backdrop-blur-sm rounded-md flex items-center justify-center">
                          <div className="text-center">
                            <div className="font-semibold mb-2">Locked preview</div>
                            <Button size="sm" onClick={() => onUnlock?.()} className="bg-primary-solid text-white hover:bg-primary/90">Unlock</Button>
                          </div>
                        </div>
                      )}
                      <div className={locked ? 'pointer-events-none blur-[1px]' : ''}>
                        <MethodCard
                          {...card}
                          onDownload={() => {
                            if (locked) { onUnlock?.(); return }
                            const html = buildMethodCardHtml(card)
                            const blob = new Blob([html], { type: 'text/html' })
                            const url = URL.createObjectURL(blob)
                            const a = document.createElement('a')
                            a.href = url
                            a.download = `method_${card.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html`
                            document.body.appendChild(a)
                            a.click()
                            document.body.removeChild(a)
                            URL.revokeObjectURL(url)
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="templates" className="mt-6">
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-foreground mb-2">Participant Templates</h3>
                  <p className="text-sm text-muted-foreground mb-6">Print these templates for participants to fill out during activities. They provide structured guidance for key exercises.</p>
                </div>
                {participantTemplatesToShow.map((template, index) => (
                  <div key={index} className="relative">
                    {locked && (
                      <div className="absolute inset-0 z-10 bg-background/70 backdrop-blur-sm rounded-md flex items-center justify-center">
                        <div className="text-center">
                          <div className="font-semibold mb-2">Locked preview</div>
                          <Button size="sm" onClick={() => onUnlock?.()} className="bg-primary-solid text-white hover:bg-primary/90">Unlock</Button>
                        </div>
                      </div>
                    )}
                    <div className={locked ? 'pointer-events-none blur-[1px]' : ''}>
                      <ParticipantTemplate
                        {...template}
                        onDownload={() => {
                          if (locked) { onUnlock?.(); return }
                          const html = buildParticipantTemplateHtml(template)
                          const blob = new Blob([html], { type: 'text/html' })
                          const url = URL.createObjectURL(blob)
                          const a = document.createElement('a')
                          a.href = url
                          a.download = `template_${template.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html`
                          document.body.appendChild(a)
                          a.click()
                          document.body.removeChild(a)
                          URL.revokeObjectURL(url)
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="session-plan" className="mt-6">
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-foreground mb-2">Facilitator Session Plan</h3>
                  <p className="text-sm text-muted-foreground mb-6">A detailed timeline and guide for facilitators to run the Global Goals Jam session effectively.</p>
                </div>
                <SessionPlan {...sessionPlan} />
                <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
                  <div className="text-xs text-muted-foreground">Source: GGJ Guidelines (auto-summarized). <a href={GUIDE_URL} target="_blank" rel="noopener noreferrer" className="underline">Open PDF</a></div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handlePrintPDF}><Printer className="w-4 h-4 mr-2" />Print All</Button>
                    <Button onClick={() => {
                      if (locked) { onUnlock?.(); return }
                      let contentHtml = ''
                      try {
                        const data = JSON.parse(content)
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
                        const enhancedContent = `# GLOBAL GOALS JAM COMPLETE TOOLKIT\n## ${selectedSDG?.label}: ${challenge}\n\n**Duration:** ${jamDuration} day(s)  \n**Participants:** ${participants}  \n**SDG Focus:** ${selectedSDG?.label}\n\n---\n\n${content}`
                        contentHtml = markdownToBasicHtml(enhancedContent)
                      }

                      const html = buildToolkitHtml({
                        title: `${selectedSDG?.label || ''}: ${challenge}`,
                        sdgLabel: selectedSDG?.label,
                        jamDuration,
                        participants,
                        challenge,
                        contentHtml
                      })
                      const blob = new Blob([html], { type: 'text/html' })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = `complete_toolkit_${selectedSDG?.label?.replace(/[^a-z0-9]/gi, '_')}.html`
                      document.body.appendChild(a)
                      a.click()
                      document.body.removeChild(a)
                      URL.revokeObjectURL(url)
                    }} className="bg-primary-solid text-white hover:bg-primary/90">
                      <FileText className="w-4 h-4 mr-2" />Download Complete Toolkit<ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <Separator />

        {/* Footer with Download */}
        <div className="p-6 bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">Built with <a href="https://metodic.io" target="_blank" rel="noopener noreferrer" className="underline decoration-2 text-foreground">Metodic.io</a></div>
              <Badge variant="outline" className="text-xs">metodic.io</Badge>
            </div>
            <div className="flex gap-2">
              <Button onClick={handlePrintPDF} variant="outline" className="border-primary text-primary hover:bg-primary/10"><Printer className="w-4 h-4 mr-2" />Print All</Button>
              <Button onClick={() => { if (locked) { onUnlock?.(); return } onDownload() }} className="bg-primary-solid text-white hover:bg-primary/90"><Download className="w-4 h-4 mr-2" />Download</Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
