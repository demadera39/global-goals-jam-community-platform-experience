import { useEffect, useState } from 'react'

interface ImageTextAnalyzerProps {
  imageUrl: string
  onExtract?: (text: string) => void
  className?: string
}

export default function ImageTextAnalyzer({ imageUrl, onExtract, className }: ImageTextAnalyzerProps) {
  const [text, setText] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    const run = async () => {
      try {
        setLoading(true)
        setError(null)
        // Dynamically import to avoid SSR issues
        const Tesseract = await import('tesseract.js')
        const { data } = await Tesseract.recognize(imageUrl, 'eng', {
          logger: () => {},
          // fallback to default options if PSM not available
        })
        if (!mounted) return
        const out = (data?.text || '').replace(/\n{2,}/g, '\n').trim()
        setText(out)
        if (onExtract) onExtract(out)
      } catch (e: any) {
        if (!mounted) return
        setError(e?.message || 'OCR failed')
        setText('')
        if (onExtract) onExtract('')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    run()
    return () => {
      mounted = false
    }
  }, [imageUrl, onExtract])

  return (
    <div className={className}>
      <div className="text-sm text-muted-foreground mb-2">Image OCR</div>
      {loading && <div className="text-xs text-muted-foreground">Extracting text…</div>}
      {error && <div className="text-xs text-destructive">{error}</div>}
      {!loading && !error && (
        <pre className="whitespace-pre-wrap text-sm text-foreground bg-muted/10 rounded-md p-2 min-h-[56px]">{text || 'No text found'}</pre>
      )}
    </div>
  )
}
