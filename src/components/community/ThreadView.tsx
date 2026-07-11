import { useState } from 'react'
import { ArrowLeft, Loader2, Lock, MessageCircle, Send } from 'lucide-react'
import type { Author, Post, Space, Thread } from './communityData'
import { relTime } from './communityData'
import { AuthorAvatar, RoleChip } from './FeedCards'

interface ThreadViewProps {
  thread: Thread
  space?: Space
  posts: Post[]
  authors: Record<string, Author>
  loadingPosts: boolean
  submitting: boolean
  onBack: () => void
  onReply: (content: string) => Promise<boolean>
}

export default function ThreadView({
  thread,
  space,
  posts,
  authors,
  loadingPosts,
  submitting,
  onBack,
  onReply,
}: ThreadViewProps) {
  const [reply, setReply] = useState('')
  const replies = thread.replyCount ?? Math.max(posts.length - 1, 0)

  const submit = async () => {
    const trimmed = reply.trim()
    if (!trimmed || submitting) return
    const ok = await onReply(trimmed)
    if (ok) setReply('')
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#dfe9e2] bg-white px-3.5 py-1.5 text-[13px] font-semibold text-[#4c5a52] transition-colors hover:border-[#00A651]/40 hover:text-[#00713a]"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Back to feed
        </button>
        <h2 className="mt-3 font-display text-2xl font-extrabold tracking-tight text-[#14201a] [text-wrap:balance]">
          {thread.title}
        </h2>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-[#7d8a83]">
          {space && (
            <span className="rounded-full border border-[#dfe9e2] bg-white px-2 py-0.5 text-[11px] font-medium text-[#4c5a52]">
              {space.name}
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="tabular-nums">{replies} {replies === 1 ? 'reply' : 'replies'}</span>
          </span>
          <span aria-hidden="true">·</span>
          <span>started {relTime(thread.createdAt)}</span>
          {thread.isLocked && (
            <span className="inline-flex items-center gap-1 text-[#4c5a52]">
              <Lock className="h-3.5 w-3.5" aria-hidden="true" /> locked
            </span>
          )}
        </div>
      </div>

      {/* Posts */}
      {loadingPosts ? (
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl border border-[#dfe9e2] bg-white" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => {
            const author = authors[post.authorId]
            return (
              <article key={post.id} className="rounded-2xl border border-[#dfe9e2] bg-white p-4 shadow-soft">
                <div className="flex items-start gap-3">
                  <AuthorAvatar author={author} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px]">
                      <span className="font-semibold text-[#14201a]">
                        {author?.displayName || 'A community member'}
                      </span>
                      <RoleChip role={author?.role} />
                      {post.isFirstPost && (
                        <span className="text-[11px] font-medium uppercase tracking-wide text-[#7d8a83]">
                          Original post
                        </span>
                      )}
                      <span className="ml-auto shrink-0 font-mono text-[11px] tabular-nums text-[#7d8a83]">
                        {relTime(post.createdAt)}
                      </span>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[#14201a]">
                      {post.content}
                    </p>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {/* Reply */}
      {thread.isLocked ? (
        <div className="rounded-2xl border border-[#dfe9e2] bg-white/60 p-4 text-center text-sm text-[#7d8a83]">
          <Lock className="mx-auto mb-1.5 h-4 w-4" aria-hidden="true" />
          This thread is locked — new replies are closed.
        </div>
      ) : (
        <div className="rounded-2xl border border-[#dfe9e2] bg-white p-4 shadow-soft">
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Write a reply…"
            rows={3}
            className="w-full resize-y rounded-xl border border-transparent bg-[#F6FAF7] px-3.5 py-2.5 text-sm text-[#14201a] placeholder:text-[#7d8a83] transition-colors focus:border-[#00A651]/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00A651]/15"
          />
          <div className="mt-2.5 flex justify-end">
            <button
              type="button"
              onClick={submit}
              disabled={submitting || !reply.trim()}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#00A651] px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#008a44] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Send className="h-4 w-4" aria-hidden="true" />
              )}
              Reply
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
