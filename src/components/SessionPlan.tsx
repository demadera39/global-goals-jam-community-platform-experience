import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Separator } from './ui/separator'
import { Button } from './ui/button'
import { Clock, Users, Target, AlertCircle, CheckCircle, Lightbulb, Zap, TrendingUp, Download } from 'lucide-react'
import { buildSessionPlanHtml } from '../lib/toolkitExport'
import { normalizeDayActivities } from '../lib/schedule'

interface SessionActivity {
  time: string
  duration: string
  title: string
  description: string
  materials: string[]
  steps?: string[]
  facilitatorNotes: string[]
  energyLevel: 'low' | 'medium' | 'high'
}

interface GuideSections {
  principles?: string[]
  facilitationTips?: string[]
  inclusionTips?: string[]
  openingScript?: string
  closingScript?: string
}

interface SessionPlanProps {
  title: string
  duration: string
  participants: string
  sdgFocus: string
  challenge: string
  guideSections?: GuideSections
  days: {
    day: number
    theme: string
    objective: string
    activities: SessionActivity[]
  }[]
}

const energyConfig = {
  low: { color: 'bg-blue-100 text-blue-800', icon: '🧘' },
  medium: { color: 'bg-yellow-100 text-yellow-800', icon: '⚡' },
  high: { color: 'bg-red-100 text-red-800', icon: '🔥' }
}

const phaseIcons = {
  1: Target,
  2: Lightbulb,
  3: Zap,
  4: TrendingUp
}

export default function SessionPlan({
  title,
  duration,
  participants,
  sdgFocus,
  challenge,
  guideSections,
  days
}: SessionPlanProps) {
  const principlesList: string[] = Array.isArray(guideSections && guideSections.principles)
    ? (guideSections as any).principles
    : [
        'People-centered: start from lived experiences',
        'SDG-aligned: trace each activity to SDG targets',
        'Open & collaborative: co-create with stakeholders',
        'Action-oriented: move from ideas to prototypes'
      ]
  const facilitationTipsList: string[] = Array.isArray(guideSections && guideSections.facilitationTips)
    ? (guideSections as any).facilitationTips
    : [
        'Timebox strictly; announce checkpoints',
        'Use visual timers and music for transitions',
        'Capture insights visibly on walls or shared docs',
        'Rotate roles: facilitator, scribe, presenter'
      ]
  const inclusionTipsList: string[] = Array.isArray(guideSections && guideSections.inclusionTips)
    ? (guideSections as any).inclusionTips
    : [
        'Establish a code of conduct upfront',
        'Use inclusive language and accessible formats',
        'Ensure speaking turns and quiet reflection time',
        'Provide options for anonymous input'
      ]

  // Strict normalization: 09:00–17:00 contiguous, exact 480 min per day
  const normalizedDays = days.map((day) => {
    const res = normalizeDayActivities(day.activities)
    return { ...day, activities: res.activities, _adjusted: res.adjusted, _notes: res.notes as string[] }
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="">
        <CardHeader className="bg-gradient-to-r from-primary to-primary/80 text-white">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">
                Facilitator Session Plan
              </CardTitle>
              <p className="text-white/90 mt-1">
                {title}
              </p>
            </div>
            <div className="text-right">
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30 mb-2">
                {sdgFocus}
              </Badge>
              <div className="flex gap-2">
                <Badge variant="outline" className="bg-white/10 text-white border-white/30">
                  <Clock className="w-3 h-3 mr-1" />
                  {duration}
                </Badge>
                <Badge variant="outline" className="bg-white/10 text-white border-white/30">
                  <Users className="w-3 h-3 mr-1" />
                  {participants}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <div className="flex justify-end mb-4">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const html = buildSessionPlanHtml({
                  title,
                  duration,
                  participants,
                  sdgFocus,
                  challenge,
                  days
                })
                const blob = new Blob([html], { type: 'text/html' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `session_plan_${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html`
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                URL.revokeObjectURL(url)
              }}
            >
              <Download className="w-4 h-4 mr-1" />
              Download Session Plan
            </Button>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-foreground mb-2">Challenge Focus</h3>
              <p className="text-sm text-muted-foreground">{challenge}</p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">Pre-Session Checklist</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Room setup with moveable furniture
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Materials and supplies ready
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Digital tools tested and accessible
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Participant list and name tags
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Daily Plans */}
      {normalizedDays.map((day: any, dayIndex: number) => {
        const PhaseIcon = phaseIcons[day.day as keyof typeof phaseIcons] || Target
        const totalMin = day.activities.reduce((sum: number, a: any) => sum + (parseInt(String(a.duration)) || 0), 0)
        
        return (
          <Card key={dayIndex} className="">
            <CardHeader className="bg-muted/30">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                  <PhaseIcon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-xl text-foreground">
                    Day {day.day}: {day.theme}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {day.objective}
                  </p>
                </div>
                {day._adjusted ? (
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-900 border-yellow-300">
                    Schedule normalized to 09:00–17:00
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-green-100 text-green-900 border-green-300">
                    Schedule valid (480 min)
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {day._notes && day._notes.length > 0 && (
                <div className="px-6 pt-4 text-xs text-muted-foreground">
                  <ul className="list-disc list-inside space-y-1">
                    {day._notes.map((n: string, i: number) => (
                      <li key={i}>{n}</li>
                    ))}
                  </ul>
                </div>
              )}

              {day.activities.map((activity: any, activityIndex: number) => {
                const energyInfo = energyConfig[activity.energyLevel]
                
                return (
                  <div key={activityIndex} className="p-6 border-b last:border-b-0">
                    <div className="flex items-start gap-4">
                      {/* Time Column */}
                      <div className="w-24 flex-shrink-0">
                        <div className="text-sm font-semibold text-foreground">
                          {activity.time}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {activity.duration}
                        </div>
                        <Badge className={`${energyInfo.color} text-xs mt-1`}>
                          {energyInfo.icon}
                        </Badge>
                      </div>

                      {/* Content Column */}
                      <div className="flex-1 space-y-3">
                        <div>
                          <h4 className="font-semibold text-foreground">
                            {activity.title}
                          </h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {activity.description}
                          </p>
                        </div>

                        {/* Materials */}
                        {activity.materials.length > 0 && (
                          <div>
                            <h5 className="text-xs font-semibold text-foreground mb-1">
                              Materials:
                            </h5>
                            <div className="flex flex-wrap gap-1">
                              {activity.materials.map((material: string, materialIndex: number) => (
                                <Badge key={materialIndex} variant="outline" className="text-xs">
                                  {material}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Step-by-step Instructions */}
                        {activity.steps && activity.steps.length > 0 && (
                          <div>
                            <h5 className="text-xs font-semibold text-foreground mb-1">
                              Steps:
                            </h5>
                            <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
                              {activity.steps.map((step: string, stepIndex: number) => (
                                <li key={stepIndex}>{step}</li>
                              ))}
                            </ol>
                          </div>
                        )}

                        {/* Facilitator Notes */}
                        {activity.facilitatorNotes.length > 0 && (
                          <div className="bg-yellow-50 p-3 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <AlertCircle className="w-4 h-4 text-yellow-600" />
                              <h5 className="text-xs font-semibold text-yellow-800">
                                Facilitator Notes:
                              </h5>
                            </div>
                            <ul className="text-xs text-yellow-700 space-y-1">
                              {activity.facilitatorNotes.map((note: string, noteIndex: number) => (
                                <li key={noteIndex} className="flex gap-2">
                                  <span>•</span>
                                  <span>{note}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        )
      })}

      {/* Guide Sections (from GGJ guide) */}
      {/** Optional blocks with more guidance. Populate via props.guideSections */}
      <Card className="">
        <CardContent className="p-6">
          <div className="grid md:grid-cols-3 gap-6">
            {/* Principles */}
            <div>
              <h4 className="font-semibold text-foreground mb-2">Core Principles</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                {principlesList.map((p: string, i: number) => (
                  <li key={i} className="flex gap-2"><span>•</span><span>{p}</span></li>
                ))}
              </ul>
            </div>

            {/* Facilitation Tips */}
            <div>
              <h4 className="font-semibold text-foreground mb-2">Facilitation Tips</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                {facilitationTipsList.map((p: string, i: number) => (
                  <li key={i} className="flex gap-2"><span>•</span><span>{p}</span></li>
                ))}
              </ul>
            </div>

            {/* Inclusion */}
            <div>
              <h4 className="font-semibold text-foreground mb-2">Inclusion & Safety</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                {inclusionTipsList.map((p: string, i: number) => (
                  <li key={i} className="flex gap-2"><span>•</span><span>{p}</span></li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <Card className="">
        <CardContent className="p-6 text-center">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground">
              Facilitator Guide
            </p>
            <p className="text-xs text-muted-foreground">
              Built with <a href="https://metodic.io" target="_blank" rel="noopener noreferrer" className="underline decoration-2">Metodic.io</a>
            </p>
            <div className="flex justify-center gap-4 text-xs text-muted-foreground">
              <span>AI-generated session plan</span>
              <span>•</span>
              <span>{new Date().getFullYear()}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}