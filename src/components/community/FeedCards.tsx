import { Link } from 'react-router-dom'
import { ArrowUpRight, Lock, MessageCircle, Pin } from 'lucide-react'
import type { ActivityCard, Author, Space, Thread } from './communityData'
import { monoDate, relTime, sdgDot } from './communityData'

// ---------------------------------------------------------------------------
// Shared bits
// ---------------------------------------------------------------------------

export function RoleChip({ role }: { role?: string }) {
  if (role !== 'host' && role !== 'admin') return null
  return (
    <span
      className={
        role === 'admin'
          ? 'rounded-full bg-[#14201a] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white'
          : 'rounded-full border border-[#00A651]/40 bg-[#00A651]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#00713a]'
      }
    >
      {role === 'admin' ? 'Team' : 'Host'}
    </span>
  )
}

export function AuthorAvatar({ author, size = 9 }: { author?: Author; size?: 8 | 9 | 10 }) {
  const name = author?.displayName || 'Member'
  const sizeCls = size === 8 ? 'h-8 w-8 text-[13px]' : size === 10 ? 'h-10 w-10 text-base' : 'h-9 w-9 text-sm'
  if (author?.profileImage) {
    return (
      <img
        src={author.profileImage}
        alt={name}
        className={`${sizeCls} shrink-0 rounded-full object-cover`}
        loading="lazy"
      />
    )
  }
  return (
    <div
      className={`${sizeCls} flex shrink-0 items-center justify-center rounded-full font-display font-extrabold text-white`}
      style={{ background: sdgDot(author?.id || name) }}
      aria-hidden="true"
    >
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Member thread card
// ---------------------------------------------------------------------------

interface ThreadCardProps {
  thread: Thread
  space?: Space
  author?: Author
  snippet?: string
  onOpen: (thread: Thread) => void
}

export function ThreadCard({ thread, space, author, snippet, onOpen }: ThreadCardProps) {
  const name = author?.displayName || 'A community member'
  const replies = thread.replyCount ?? 0
  return (
    <article
      className="group cursor-pointer rounded-2xl border border-[#dfe9e2] bg-white p-4 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
      onClick={() => onOpen(thread)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen(thread)
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Open thread: ${thread.title}`}
    >
      <div className="flex items-start gap-3">
        <AuthorAvatar author={author} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px]">
            <span className="font-semibold text-[#14201a]">{name}</span>
            <RoleChip role={author?.role} />
            {space && (
              <span className="rounded-full border border-[#dfe9e2] px-2 py-0.5 text-[11px] font-medium text-[#4c5a52]">
                {space.name}
              </span>
            )}
            <span className="ml-auto shrink-0 font-mono text-[11px] tabular-nums text-[#7d8a83]">
              {relTime(thread.lastReplyAt || thread.createdAt)}
            </span>
          </div>
          <h3 className="mt-1.5 flex items-start gap-1.5 font-display text-[15px] font-bold leading-snug text-[#14201a] transition-colors group-hover:text-[#00713a]">
            {thread.isPinned && <Pin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#00A651]" aria-label="Pinned" />}
            {thread.isLocked && <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#7d8a83]" aria-label="Locked" />}
            <span className="min-w-0 break-words">{thread.title}</span>
          </h3>
          {snippet && (
            <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-[#4c5a52]">{snippet}</p>
          )}
          <div className="mt-2.5 flex items-center gap-1.5 text-[12px] text-[#7d8a83]">
            <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="tabular-nums">
              {replies === 0 ? 'No replies yet — be the first' : `${replies} ${replies === 1 ? 'reply' : 'replies'}`}
            </span>
          </div>
        </div>
      </div>
    </article>
  )
}

// ---------------------------------------------------------------------------
// Computed activity card — visually distinct: hairline card on the ground
// colour, SDG dot, mono date, "from the jam network" label.
// ---------------------------------------------------------------------------

export function ActivityCardView({ card }: { card: ActivityCard }) {
  return (
    <Link
      to={card.href}
      className="group block rounded-2xl border border-[#dfe9e2] bg-white/60 p-4 transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-card-hover"
    >
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: card.dot }} aria-hidden="true" />
        <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#7d8a83]">
          From the jam network
        </span>
        <span className="ml-auto shrink-0 font-mono text-[11px] tabular-nums text-[#7d8a83]">
          {monoDate(card.date)}
        </span>
      </div>
      <div className="mt-2.5 flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-display text-[15px] font-bold leading-snug text-[#14201a] transition-colors group-hover:text-[#00713a]">
            <span className="mr-1.5" aria-hidden="true">{card.emoji}</span>
            {card.headline}
          </p>
          {card.excerpt ? (
            <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-[#4c5a52]">{card.excerpt}</p>
          ) : (
            card.sub && <p className="mt-0.5 truncate text-[13px] text-[#4c5a52]">{card.sub}</p>
          )}
          <span className="mt-1.5 inline-flex items-center gap-1 text-[12px] font-semibold text-[#00713a]">
            {card.kind === 'results' ? 'See the results' : card.kind === 'media' ? 'Take a look' : 'View the jam'}
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
          </span>
        </div>
        {card.image && (
          <img
            src={card.image}
            alt=""
            loading="lazy"
            className="h-16 w-24 shrink-0 rounded-xl border border-[#dfe9e2] object-cover"
            onError={(e) => {
              ;(e.currentTarget as HTMLImageElement).style.display = 'none'
            }}
          />
        )}
      </div>
    </Link>
  )
}
