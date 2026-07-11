import { Lock, Newspaper } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Space } from './communityData'

interface SpacesSidebarProps {
  spaces: Space[]
  threadCounts: Record<string, number>
  selectedId: string // 'all' or a space id
  onSelect: (id: string) => void
  /** 'rail' = vertical sidebar (desktop), 'chips' = horizontal scroller (mobile) */
  variant?: 'rail' | 'chips'
}

export default function SpacesSidebar({
  spaces,
  threadCounts,
  selectedId,
  onSelect,
  variant = 'rail',
}: SpacesSidebarProps) {
  if (variant === 'chips') {
    return (
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1" role="tablist" aria-label="Spaces">
        <button
          type="button"
          onClick={() => onSelect('all')}
          className={cn(
            'shrink-0 rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors',
            selectedId === 'all'
              ? 'border-transparent bg-[#00A651] text-white'
              : 'border-[#dfe9e2] bg-white text-[#4c5a52] hover:text-[#14201a]'
          )}
        >
          All activity
        </button>
        {spaces.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onSelect(s.id)}
            className={cn(
              'shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors',
              selectedId === s.id
                ? 'border-transparent bg-[#00A651] text-white'
                : 'border-[#dfe9e2] bg-white text-[#4c5a52] hover:text-[#14201a]'
            )}
          >
            {s.name}
            {s.isHostOnly && <Lock className="w-3 h-3 opacity-70" aria-label="Hosts only" />}
          </button>
        ))}
      </div>
    )
  }

  return (
    <nav aria-label="Spaces" className="rounded-2xl border border-[#dfe9e2] bg-white p-3">
      <p className="px-2.5 pt-1 pb-2 text-[11px] font-bold uppercase tracking-[0.28em] text-[#00713a]">
        Spaces
      </p>
      <ul className="space-y-0.5">
        <li>
          <button
            type="button"
            onClick={() => onSelect('all')}
            className={cn(
              'w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm transition-colors',
              selectedId === 'all'
                ? 'bg-[#00A651]/10 font-semibold text-[#00713a]'
                : 'text-[#4c5a52] hover:bg-[#14201a]/5 hover:text-[#14201a]'
            )}
          >
            <Newspaper className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span className="flex-1 truncate">All activity</span>
          </button>
        </li>
        {spaces.map((s) => {
          const count = threadCounts[s.id] ?? 0
          const active = selectedId === s.id
          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => onSelect(s.id)}
                className={cn(
                  'w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm transition-colors',
                  active
                    ? 'bg-[#00A651]/10 font-semibold text-[#00713a]'
                    : 'text-[#4c5a52] hover:bg-[#14201a]/5 hover:text-[#14201a]'
                )}
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ background: active ? '#00A651' : '#dfe9e2' }}
                  aria-hidden="true"
                />
                <span className="flex-1 truncate">{s.name}</span>
                {s.isHostOnly && (
                  <Lock className="w-3.5 h-3.5 shrink-0 text-[#7d8a83]" aria-label="Hosts only" />
                )}
                {count > 0 && (
                  <span className="shrink-0 font-mono text-[11px] tabular-nums text-[#7d8a83]">
                    {count}
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
