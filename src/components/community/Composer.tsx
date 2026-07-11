import { useEffect, useMemo, useRef, useState } from 'react'
import { Loader2, Send } from 'lucide-react'
import type { Space } from './communityData'
import { deriveTitle } from './communityData'

interface ComposerProps {
  spaces: Space[]
  /** Currently selected space in the page ('all' or a space id). */
  selectedSpaceId: string
  isHost: boolean
  posting: boolean
  displayName: string
  onPost: (content: string, spaceId: string) => Promise<boolean>
  /** Incremented by the page when a rail action wants the composer focused. */
  focusSignal?: number
}

export default function Composer({
  spaces,
  selectedSpaceId,
  isHost,
  posting,
  displayName,
  onPost,
  focusSignal,
}: ComposerProps) {
  const [content, setContent] = useState('')
  const [targetSpace, setTargetSpace] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const postableSpaces = useMemo(
    () => spaces.filter((s) => isHost || !s.isHostOnly),
    [spaces, isHost]
  )

  // Follow the sidebar selection when it points at a postable space.
  useEffect(() => {
    if (selectedSpaceId !== 'all' && postableSpaces.some((s) => s.id === selectedSpaceId)) {
      setTargetSpace(selectedSpaceId)
    }
  }, [selectedSpaceId, postableSpaces])

  // Keep the target valid once spaces load.
  useEffect(() => {
    if (!postableSpaces.length) return
    if (!targetSpace || !postableSpaces.some((s) => s.id === targetSpace)) {
      const preferred =
        (selectedSpaceId !== 'all' && postableSpaces.find((s) => s.id === selectedSpaceId)) ||
        postableSpaces.find((s) => s.id === 'start-here') ||
        postableSpaces[0]
      setTargetSpace(preferred.id)
    }
  }, [postableSpaces, targetSpace, selectedSpaceId])

  useEffect(() => {
    if (focusSignal) textareaRef.current?.focus()
  }, [focusSignal])

  const initial = (displayName || '?').charAt(0).toUpperCase()
  const trimmed = content.trim()
  const title = trimmed ? deriveTitle(trimmed) : ''

  const submit = async () => {
    if (!trimmed || !targetSpace || posting) return
    const ok = await onPost(trimmed, targetSpace)
    if (ok) setContent('')
  }

  return (
    <div className="rounded-2xl border border-[#dfe9e2] bg-white p-4 shadow-soft">
      <div className="flex gap-3">
        <div
          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#00A651]/10 font-display text-sm font-extrabold text-[#00713a]"
          aria-hidden="true"
        >
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share something with the network…"
            rows={content ? 4 : 2}
            className="w-full resize-y rounded-xl border border-transparent bg-[#F6FAF7] px-3.5 py-2.5 text-sm text-[#14201a] placeholder:text-[#7d8a83] transition-colors focus:border-[#00A651]/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00A651]/15"
          />
          {trimmed && (
            <p className="mt-1.5 truncate text-xs text-[#7d8a83]">
              Posting as <span className="font-semibold text-[#4c5a52]">“{title}”</span>
              {trimmed.includes('\n') ? ' — first line becomes the title' : ''}
            </p>
          )}
          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
            <label className="flex items-center gap-2 text-xs text-[#7d8a83]">
              <span>in</span>
              <select
                value={targetSpace}
                onChange={(e) => setTargetSpace(e.target.value)}
                className="rounded-full border border-[#dfe9e2] bg-white px-3 py-1.5 text-[13px] font-medium text-[#14201a] focus:border-[#00A651]/50 focus:outline-none"
                aria-label="Choose a space"
              >
                {postableSpaces.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={submit}
              disabled={posting || !trimmed || !targetSpace}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#00A651] px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#008a44] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {posting ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Send className="h-4 w-4" aria-hidden="true" />
              )}
              Post
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
