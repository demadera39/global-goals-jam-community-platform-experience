import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Separator } from './ui/separator'
import { Button } from './ui/button'
import { User, Target, Lightbulb, CheckSquare, Download } from 'lucide-react'
import { buildParticipantTemplateHtml } from '../lib/toolkitExport'

interface ParticipantTemplateProps {
  title: string
  description: string
  phase: 'understand' | 'define' | 'prototype' | 'implement'
  sections: {
    title: string
    type: 'text' | 'list' | 'canvas' | 'rating'
    prompt: string
    placeholder?: string
    options?: string[]
  }[]
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
    icon: CheckSquare, 
    color: 'bg-purple-500', 
    label: 'Prototype & Test',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-600'
  },
  implement: { 
    icon: Target, 
    color: 'bg-green-500', 
    label: 'Implement & Scale',
    bgColor: 'bg-green-50',
    textColor: 'text-green-600'
  }
}

export default function ParticipantTemplate({
  title,
  description,
  phase,
  sections,
  onDownload
}: ParticipantTemplateProps) {
  const phaseInfo = phaseConfig[phase]
  const IconComponent = phaseInfo.icon

  return (
    <Card className="">
      {/* Header */}
      <CardHeader className={`${phaseInfo.bgColor} p-6`}>
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 ${phaseInfo.color} rounded-xl flex items-center justify-center`}>
            <IconComponent className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <CardTitle className={`text-xl ${phaseInfo.textColor}`}>
              {title}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {description}
            </p>
          </div>
          <Badge className={`${phaseInfo.color} text-white`}>
            {phaseInfo.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        <div className="flex justify-end">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              if (onDownload) {
                onDownload()
                return
              }
              const html = buildParticipantTemplateHtml({
                title,
                description,
                phase,
                sections
              })
              const blob = new Blob([html], { type: 'text/html' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `template_${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html`
              document.body.appendChild(a)
              a.click()
              document.body.removeChild(a)
              URL.revokeObjectURL(url)
            }}
          >
            <Download className="w-4 h-4 mr-1" />
            Download Template
          </Button>
        </div>
        {/* Participant Info */}
        <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
          <User className="w-5 h-5 text-muted-foreground" />
          <div className="flex-1">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Name:</label>
                <div className="mt-1 h-8 border-b border-dashed border-muted-foreground/30" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Team:</label>
                <div className="mt-1 h-8 border-b border-dashed border-muted-foreground/30" />
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Template Sections */}
        {sections.map((section, index) => (
          <div key={index} className="space-y-3">
            <div>
              <h3 className="font-semibold text-foreground mb-1">
                {section.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {section.prompt}
              </p>
            </div>

            {/* Different input types */}
            {section.type === 'text' && (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, lineIndex) => (
                  <div key={lineIndex} className="h-6 border-b border-dashed border-muted-foreground/30" />
                ))}
              </div>
            )}

            {section.type === 'list' && (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, itemIndex) => (
                  <div key={itemIndex} className="flex items-center gap-3">
                    <div className="w-4 h-4 border border-muted-foreground/30 rounded" />
                    <div className="flex-1 h-6 border-b border-dashed border-muted-foreground/30" />
                  </div>
                ))}
              </div>
            )}

            {section.type === 'canvas' && (
              <div className="h-32 border-2 border-dashed border-muted-foreground/30 rounded-lg flex items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  {section.placeholder || 'Draw, sketch, or write your ideas here'}
                </p>
              </div>
            )}

            {section.type === 'rating' && section.options && (
              <div className="space-y-2">
                {section.options.map((option, optionIndex) => (
                  <div key={optionIndex} className="flex items-center justify-between">
                    <span className="text-sm">{option}</span>
                    <div className="flex gap-2">
                      {Array.from({ length: 5 }).map((_, ratingIndex) => (
                        <div key={ratingIndex} className="w-4 h-4 border border-muted-foreground/30 rounded-full" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {index < sections.length - 1 && <Separator className="mt-6" />}
          </div>
        ))}

        {/* Footer */}
        <div className="pt-4 border-t flex justify-between items-center">
          <div className="text-xs text-muted-foreground">
            Built with <a href="https://metodic.io" target="_blank" rel="noopener noreferrer" className="underline decoration-2">Metodic.io</a>
          </div>
          <div className="text-xs text-muted-foreground">
            Page {Math.floor(Math.random() * 10) + 1}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}