import { useEffect, useRef, useState } from 'react'
import { Bold, Italic, Underline, List, ListOrdered, Link2, Unlink, Heading2, Quote, RemoveFormatting } from 'lucide-react'

// Lightweight WYSIWYG for the admin message composer: a contentEditable
// surface with a small formatting toolbar. Deliberately dependency-free —
// the emails are simple, and this keeps the bundle light. The full HTML
// (including the template's inline-styled wrapper) is preserved: we edit the
// DOM in place and read innerHTML back, so header/signature markup survives.

type Props = {
  value: string
  onChange: (html: string) => void
  className?: string
  minHeight?: number
}

function exec(cmd: string, arg?: string) {
  document.execCommand(cmd, false, arg)
}

export default function RichHtmlEditor({ value, onChange, className = '', minHeight = 320 }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  // Track the last HTML we emitted so an external value change (template
  // switch, HTML-tab edit) repaints the surface, while our own keystrokes
  // never clobber the caret.
  const lastEmitted = useRef<string>('')
  const [, force] = useState(0)

  useEffect(() => {
    if (!ref.current) return
    if (value !== lastEmitted.current) {
      ref.current.innerHTML = value || ''
      lastEmitted.current = value || ''
      // Move the caret to the first empty paragraph / placeholder comment
      // spot if there is one, so the writer can start typing straight away.
      const p = ref.current.querySelector('p:empty, p > br:only-child')
      if (p) {
        const target = p.tagName === 'BR' ? p.parentElement! : p
        const range = document.createRange()
        range.selectNodeContents(target)
        range.collapse(true)
        const sel = window.getSelection()
        sel?.removeAllRanges()
        sel?.addRange(range)
      }
    }
  }, [value])

  const emit = () => {
    if (!ref.current) return
    const html = ref.current.innerHTML
    lastEmitted.current = html
    onChange(html)
    force((n) => n + 1) // refresh active-state highlights
  }

  const run = (cmd: string, arg?: string) => (e: React.MouseEvent) => {
    e.preventDefault() // keep focus + selection in the editor
    ref.current?.focus()
    exec(cmd, arg)
    emit()
  }

  const addLink = (e: React.MouseEvent) => {
    e.preventDefault()
    ref.current?.focus()
    const url = window.prompt('Link URL', 'https://')
    if (!url) return
    exec('createLink', url)
    // Open in new tab and inherit brand green
    ref.current?.querySelectorAll(`a[href="${url}"]`).forEach((a) => {
      a.setAttribute('target', '_blank')
      a.setAttribute('rel', 'noopener')
      if (!(a as HTMLElement).style.color) (a as HTMLElement).style.color = '#00A651'
    })
    emit()
  }

  const isActive = (cmd: string) => {
    try { return document.queryCommandState(cmd) } catch { return false }
  }

  const btn = (label: string, Icon: any, onClick: (e: React.MouseEvent) => void, active = false) => (
    <button
      type="button"
      title={label}
      aria-label={label}
      onMouseDown={onClick}
      className={`inline-flex h-7 w-7 items-center justify-center rounded transition-colors ${active ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  )

  return (
    <div className={`overflow-hidden rounded-md border bg-background ${className}`}>
      <div className="flex flex-wrap items-center gap-0.5 border-b bg-muted/40 px-1.5 py-1">
        {btn('Bold', Bold, run('bold'), isActive('bold'))}
        {btn('Italic', Italic, run('italic'), isActive('italic'))}
        {btn('Underline', Underline, run('underline'), isActive('underline'))}
        <span className="mx-1 h-4 w-px bg-border" />
        {btn('Heading', Heading2, run('formatBlock', 'h2'))}
        {btn('Paragraph / quote', Quote, run('formatBlock', 'blockquote'))}
        <span className="mx-1 h-4 w-px bg-border" />
        {btn('Bulleted list', List, run('insertUnorderedList'), isActive('insertUnorderedList'))}
        {btn('Numbered list', ListOrdered, run('insertOrderedList'), isActive('insertOrderedList'))}
        <span className="mx-1 h-4 w-px bg-border" />
        {btn('Insert link', Link2, addLink)}
        {btn('Remove link', Unlink, run('unlink'))}
        <span className="mx-1 h-4 w-px bg-border" />
        {btn('Clear formatting', RemoveFormatting, run('removeFormat'))}
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={emit}
        onBlur={emit}
        onKeyUp={() => force((n) => n + 1)}
        onMouseUp={() => force((n) => n + 1)}
        onPaste={(e) => {
          // Paste as plain text so foreign styles (Word, Gmail) don't leak in.
          e.preventDefault()
          const text = e.clipboardData.getData('text/plain')
          exec('insertText', text)
          emit()
        }}
        className="rich-email-surface max-h-[440px] overflow-y-auto p-3 text-sm leading-relaxed outline-none focus:ring-1 focus:ring-primary/40 [&_a]:underline [&_h1]:text-xl [&_h1]:font-bold [&_h2]:text-lg [&_h2]:font-semibold [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_blockquote]:border-l-2 [&_blockquote]:border-primary/40 [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground"
        style={{ minHeight }}
      />
    </div>
  )
}
