import { Card, CardContent, CardHeader } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Clock, Users, Target, Lightbulb, Zap, TrendingUp, Download } from 'lucide-react'
import { buildMethodCardHtml } from '../lib/toolkitExport'

interface MethodCardProps {
  title: string
  description: string
  duration: string
  participants: string
  phase: 'understand' | 'define' | 'prototype' | 'implement'
  difficulty: 'easy' | 'medium' | 'hard'
  materials: string[]
  steps: string[]
  tips?: string[]
  isSelected?: boolean
  onClick?: () => void
  onDownload?: () => void
}

const phaseConfig = {
  understand: { 
    icon: Target, 
    color: 'bg-blue-500', 
    label: 'Understand & Empathize',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-600'
  },
  define: { 
    icon: Lightbulb, 
    color: 'bg-yellow-500', 
    label: 'Define & Ideate',
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-600'
  },
  prototype: { 
    icon: Zap, 
    color: 'bg-purple-500', 
    label: 'Prototype & Test',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-600'
  },
  implement: { 
    icon: TrendingUp, 
    color: 'bg-green-500', 
    label: 'Implement & Scale',
    bgColor: 'bg-green-50',
    textColor: 'text-green-600'
  }
}

const difficultyConfig = {
  easy: { color: 'bg-green-100 text-green-800', label: 'Easy' },
  medium: { color: 'bg-yellow-100 text-yellow-800', label: 'Medium' },
  hard: { color: 'bg-red-100 text-red-800', label: 'Hard' }
}

export default function MethodCard({
  title,
  description,
  duration,
  participants,
  phase,
  difficulty,
  materials,
  steps,
  tips,
  isSelected = false,
  onClick,
  onDownload
}: MethodCardProps) {
  const phaseInfo = phaseConfig[phase]
  const difficultyInfo = difficultyConfig[difficulty]
  const IconComponent = phaseInfo.icon

  return (
    <Card 
      className={`relative overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 ${
        isSelected ? 'ring-2 ring-primary shadow-lg' : ''
      }`}
      onClick={onClick}
    >
      {/* Phase Header */}
      <CardHeader className={`${phaseInfo.bgColor} p-4 pb-3`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 ${phaseInfo.color} rounded-lg flex items-center justify-center`}>
              <IconComponent className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className={`font-bold text-sm ${phaseInfo.textColor}`}>
                {title}
              </h3>
              <p className="text-xs text-muted-foreground">
                {phaseInfo.label}
              </p>
            </div>
          </div>
          <Badge className={`${difficultyInfo.color} text-xs`}>
            {difficultyInfo.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* Description */}
        <p className="text-sm text-muted-foreground">
          {description}
        </p>

        {/* Meta Info */}
        <div className="flex gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {duration}
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {participants}
          </div>
        </div>

        {/* Materials */}
        <div>
          <h4 className="font-semibold text-xs text-foreground mb-2">Materials Needed:</h4>
          <div className="flex flex-wrap gap-1">
            {materials.map((material, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {material}
              </Badge>
            ))}
          </div>
        </div>

        {/* Steps */}
        <div>
          <h4 className="font-semibold text-xs text-foreground mb-2">Steps:</h4>
          <ol className="text-xs text-muted-foreground space-y-1">
            {steps.map((step, index) => (
              <li key={index} className="flex gap-2">
                <span className="font-medium text-primary">{index + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Tips */}
        {tips && tips.length > 0 && (
          <div className="pt-2 border-t">
            <h4 className="font-semibold text-xs text-foreground mb-2">💡 Facilitator Tips:</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              {tips.map((tip, index) => (
                <li key={index} className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Footer */}
        <div className="pt-2 border-t flex justify-between items-center">
          <div className="text-xs text-muted-foreground">
            Built with <a href="https://metodic.io" target="_blank" rel="noopener noreferrer" className="underline decoration-2">Metodic.io</a>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation()
                if (onDownload) {
                  onDownload()
                  return
                }
                const html = buildMethodCardHtml({
                  title,
                  description,
                  duration,
                  participants,
                  phase,
                  difficulty,
                  materials,
                  steps,
                  tips
                })
                const blob = new Blob([html], { type: 'text/html' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `method_${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html`
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                URL.revokeObjectURL(url)
              }}
            >
              <Download className="w-4 h-4 mr-1" />
              Download
            </Button>
            <div className="w-4 h-4 bg-primary/10 rounded flex items-center justify-center">
              <div className="w-2 h-2 bg-primary rounded-full" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}