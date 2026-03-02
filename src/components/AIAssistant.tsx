import { useState } from 'react'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Loader2, Sparkles, Copy, Check } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface AIAssistantProps {
  action: 'event_description' | 'sdg_match' | 'impact_summary' | 'course_qa' | 'general'
  placeholder?: string
  title?: string
  context?: string
  onResult?: (text: string) => void
  className?: string
}

export default function AIAssistant({
  action,
  placeholder,
  title,
  context,
  onResult,
  className,
}: AIAssistantProps) {
  const [prompt, setPrompt] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const defaultPlaceholders: Record<string, string> = {
    event_description: 'Describe your event theme, location, and target audience...',
    sdg_match: 'Describe your event or project focus area...',
    impact_summary: 'Paste your event outcomes, participant feedback, or results data...',
    course_qa: 'Ask a question about the GGJ Host Certification Course...',
    general: 'Ask anything about Global Goals Jams...',
  }

  const defaultTitles: Record<string, string> = {
    event_description: 'Event Description Assistant',
    sdg_match: 'SDG Matcher',
    impact_summary: 'Impact Summary Generator',
    course_qa: 'Course Q&A',
    general: 'AI Assistant',
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt')
      return
    }

    setLoading(true)
    setResult('')

    try {
      const { data, error } = await supabase.functions.invoke('gemini-ai', {
        body: { prompt: prompt.trim(), action, context },
      })

      if (error) throw error

      const text = data?.text || ''
      if (!text) throw new Error('AI returned empty response')

      setResult(text)
      onResult?.(text)
    } catch (err: any) {
      const message = err?.message || 'AI generation failed'
      if (message.includes('Rate limit')) {
        toast.error('Please wait a moment before trying again')
      } else {
        toast.error(message)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(result)
    setCopied(true)
    toast.success('Copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className={cn('border bg-card', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="w-5 h-5 text-primary" />
          {title || defaultTitles[action]}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={placeholder || defaultPlaceholders[action]}
          rows={3}
          disabled={loading}
        />
        <Button onClick={handleGenerate} disabled={loading || !prompt.trim()} className="w-full">
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate
            </>
          )}
        </Button>

        {result && (
          <div className="relative mt-4 rounded-lg border bg-muted/40 p-4">
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2"
              onClick={handleCopy}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
            <div className="prose prose-sm max-w-none whitespace-pre-wrap text-sm">
              {result}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
