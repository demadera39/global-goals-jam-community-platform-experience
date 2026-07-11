import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Loader2, Lock, Search } from 'lucide-react'
import { db, supabase, safeDbCall } from '../lib/supabase'
import { appAuth } from '../lib/simpleAuth'
import type { AppUser } from '../lib/simpleAuth'
import { getUserProfile } from '../lib/userStatus'
import { usePublishedEvents } from '../hooks/usePublishedEvents'
import SpacesSidebar from '../components/community/SpacesSidebar'
import Composer from '../components/community/Composer'
import RightRail from '../components/community/RightRail'
import ThreadView from '../components/community/ThreadView'
import { ActivityCardView, ThreadCard } from '../components/community/FeedCards'
import {
  buildActivityCards,
  deriveTitle,
  readChecklist,
  toDate,
  writeChecklist,
} from '../components/community/communityData'
import type {
  Author,
  ChecklistState,
  CommunityEvent,
  FeedItem,
  MediaRow,
  Post,
  Space,
  Thread,
} from '../components/community/communityData'

/**
 * Community — the network hub.
 *
 * A Circle-style three-column layout wrapped around the platform's real
 * activity: the centre feed interleaves member threads with activity cards
 * computed at render time from events, results and media. No cron jobs, no
 * stored bot posts — the feed stays alive because the platform is.
 */

/** Mirrors ProtectedRoute's fallback chain: appAuth first, then legacy `user` key. */
function storedUser(): AppUser | null {
  const fromAppAuth = appAuth.get()
  if (fromAppAuth?.id) return fromAppAuth
  try {
    const raw = localStorage.getItem('user')
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed?.id) return parsed
    }
  } catch {
    /* ignore */
  }
  return null
}

export default function CommunityPage() {
  const navigate = useNavigate()
  const { events } = usePublishedEvents({ maxAgeMs: 60_000 })
  const communityEvents = events as CommunityEvent[]

  const [user, setUser] = useState<AppUser | null>(() => storedUser())
  const [role, setRole] = useState<string>(() => storedUser()?.role || 'participant')

  const [loading, setLoading] = useState(true)
  const [spaces, setSpaces] = useState<Space[]>([])
  const [threads, setThreads] = useState<Thread[]>([])
  const [snippets, setSnippets] = useState<Record<string, string>>({})
  const [authors, setAuthors] = useState<Record<string, Author>>({})
  const [media, setMedia] = useState<MediaRow[]>([])
  const [hostsCount, setHostsCount] = useState<number | null>(null)

  const [selectedSpaceId, setSelectedSpaceId] = useState<string>('all')
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null)
  const [threadPosts, setThreadPosts] = useState<Post[]>([])
  const [loadingPosts, setLoadingPosts] = useState(false)

  const [posting, setPosting] = useState(false)
  const [replying, setReplying] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [checklist, setChecklist] = useState<ChecklistState>(() => readChecklist())
  const [composerFocusSignal, setComposerFocusSignal] = useState(0)

  const isHost = role === 'host' || role === 'admin'

  // -------------------------------------------------------------------------
  // Auth: track the app session and resolve the role from the profile.
  // -------------------------------------------------------------------------
  useEffect(() => {
    const sync = () => {
      const u = storedUser()
      setUser(u)
      if (u?.role) setRole(u.role)
      if (u?.id) {
        getUserProfile(u.id)
          .then((profile) => {
            if (profile?.role) setRole(profile.role)
          })
          .catch(() => {})
      }
    }
    const unsubscribe = appAuth.onChange(sync)
    sync()
    return unsubscribe
  }, [])

  // -------------------------------------------------------------------------
  // Data loading
  // -------------------------------------------------------------------------
  const mergeAuthors = useCallback(async (ids: string[]) => {
    const unique = Array.from(new Set(ids.filter(Boolean))).slice(0, 200)
    if (!unique.length) return
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, display_name, role, profile_image')
        .in('id', unique)
      if (error || !data) return
      const map: Record<string, Author> = {}
      for (const u of data) {
        map[u.id] = {
          id: u.id,
          displayName: u.display_name ?? undefined,
          role: u.role ?? undefined,
          profileImage: u.profile_image ?? undefined,
        }
      }
      setAuthors((prev) => ({ ...prev, ...map }))
    } catch {
      /* author names are progressive enhancement */
    }
  }, [])

  const loadCommunity = useCallback(async () => {
    try {
      const [spaceRows, threadRows, firstPostRows, mediaRows] = await Promise.all([
        safeDbCall(() => db.forumCategories.list({ orderBy: { sortOrder: 'asc' } })) as Promise<Space[]>,
        safeDbCall(() =>
          db.forumThreads.list({ orderBy: { createdAt: 'desc' }, limit: 300 })
        ) as Promise<Thread[]>,
        safeDbCall(() =>
          db.forumPosts.list({ where: { isFirstPost: true }, orderBy: { createdAt: 'desc' }, limit: 300 })
        ) as Promise<Post[]>,
        (safeDbCall(() => db.media.list({ orderBy: { createdAt: 'desc' }, limit: 24 })) as Promise<MediaRow[]>).catch(
          () => [] as MediaRow[]
        ),
      ])

      setSpaces(spaceRows)
      setThreads(threadRows)
      setMedia(mediaRows)

      const snippetMap: Record<string, string> = {}
      for (const post of firstPostRows) {
        if (post.threadId && !snippetMap[post.threadId]) snippetMap[post.threadId] = post.content
      }
      setSnippets(snippetMap)

      void mergeAuthors(threadRows.map((t) => t.authorId))
    } catch (error) {
      console.error('Failed to load community:', error)
      toast.error('Could not load the community feed. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [mergeAuthors])

  useEffect(() => {
    loadCommunity()
  }, [loadCommunity])

  useEffect(() => {
    // Hosts count for the right rail — readable by design (users_select is public).
    supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'host')
      .then(({ count, error }) => {
        if (!error && typeof count === 'number') setHostsCount(count)
      })
  }, [])

  // -------------------------------------------------------------------------
  // Derived data
  // -------------------------------------------------------------------------
  const spaceById = useMemo(() => {
    const map: Record<string, Space> = {}
    for (const s of spaces) map[s.id] = s
    return map
  }, [spaces])

  const threadCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const t of threads) counts[t.categoryId] = (counts[t.categoryId] ?? 0) + 1
    return counts
  }, [threads])

  /** Threads the current viewer may see (host-only spaces stay host-only). */
  const visibleThreads = useMemo(
    () =>
      threads.filter((t) => {
        const space = spaceById[t.categoryId]
        if (!space) return true
        return isHost || !space.isHostOnly
      }),
    [threads, spaceById, isHost]
  )

  const activityCards = useMemo(
    () => buildActivityCards(communityEvents, media),
    [communityEvents, media]
  )

  const selectedSpace = selectedSpaceId === 'all' ? undefined : spaceById[selectedSpaceId]
  const spaceIsLockedForViewer = !!selectedSpace?.isHostOnly && !isHost

  const feedItems: FeedItem[] = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    const matchesThread = (t: Thread) =>
      !term ||
      t.title.toLowerCase().includes(term) ||
      (snippets[t.id] ?? '').toLowerCase().includes(term)

    let items: FeedItem[]
    if (selectedSpaceId === 'all') {
      items = [
        ...visibleThreads.filter(matchesThread).map<FeedItem>((t) => ({
          type: 'thread',
          date: toDate(t.lastReplyAt || t.createdAt) ?? new Date(0),
          thread: t,
        })),
        ...activityCards
          .filter((c) => !term || c.headline.toLowerCase().includes(term))
          .map<FeedItem>((c) => ({ type: 'activity', date: c.date, card: c })),
      ]
      items.sort((a, b) => b.date.getTime() - a.date.getTime())
    } else {
      const spaceThreads = spaceIsLockedForViewer
        ? []
        : threads.filter((t) => t.categoryId === selectedSpaceId && matchesThread(t))
      items = spaceThreads.map<FeedItem>((t) => ({
        type: 'thread',
        date: toDate(t.lastReplyAt || t.createdAt) ?? new Date(0),
        thread: t,
      }))
      // Pinned threads float to the top inside a space.
      items.sort((a, b) => {
        const pinA = a.type === 'thread' && a.thread.isPinned ? 1 : 0
        const pinB = b.type === 'thread' && b.thread.isPinned ? 1 : 0
        if (pinA !== pinB) return pinB - pinA
        return b.date.getTime() - a.date.getTime()
      })
    }
    return items.slice(0, 60)
  }, [selectedSpaceId, visibleThreads, threads, activityCards, searchTerm, snippets, spaceIsLockedForViewer])

  // -------------------------------------------------------------------------
  // Actions
  // -------------------------------------------------------------------------
  const updateChecklist = useCallback((patch: Partial<ChecklistState>) => {
    setChecklist((prev) => {
      const next = { ...prev, ...patch }
      writeChecklist(next)
      return next
    })
  }, [])

  const openThread = useCallback(
    async (thread: Thread) => {
      setSelectedThread(thread)
      setThreadPosts([])
      setLoadingPosts(true)
      try {
        const posts = (await safeDbCall(() =>
          db.forumPosts.list({ where: { threadId: thread.id }, orderBy: { createdAt: 'asc' } })
        )) as Post[]
        setThreadPosts(posts)
        void mergeAuthors(posts.map((p) => p.authorId))
      } catch (error) {
        console.error('Failed to load posts:', error)
        toast.error('Could not load this thread.')
      } finally {
        setLoadingPosts(false)
      }
    },
    [mergeAuthors]
  )

  const handlePost = useCallback(
    async (content: string, spaceId: string): Promise<boolean> => {
      if (!user?.id) {
        toast.error('Please sign in to post.')
        return false
      }
      const space = spaceById[spaceId]
      if (!space) {
        toast.error('Please choose a space first.')
        return false
      }
      if (space.isHostOnly && !isHost) {
        toast.error(`${space.name} is a host-only space.`)
        return false
      }
      setPosting(true)
      try {
        const thread = (await safeDbCall(() =>
          db.forumThreads.create({
            categoryId: spaceId,
            title: deriveTitle(content),
            authorId: user.id,
            isPinned: false,
            isLocked: false,
            replyCount: 0,
          })
        )) as Thread
        await safeDbCall(() =>
          db.forumPosts.create({
            threadId: thread.id,
            authorId: user.id,
            content,
            isFirstPost: true,
          })
        )
        toast.success(`Posted to ${space.name}`)
        updateChecklist({ post: true, ...(spaceId === 'introductions' ? { intro: true } : {}) })
        await loadCommunity()
        return true
      } catch (error) {
        console.error('Failed to create thread:', error)
        toast.error((error as { message?: string })?.message || 'Failed to post. Please try again.')
        return false
      } finally {
        setPosting(false)
      }
    },
    [user, spaceById, isHost, loadCommunity, updateChecklist]
  )

  const handleReply = useCallback(
    async (content: string): Promise<boolean> => {
      if (!user?.id || !selectedThread) return false
      setReplying(true)
      try {
        await safeDbCall(() =>
          db.forumPosts.create({
            threadId: selectedThread.id,
            authorId: user.id,
            content,
            isFirstPost: false,
          })
        )
        const updated = {
          replyCount: (selectedThread.replyCount ?? 0) + 1,
          lastReplyAt: new Date().toISOString(),
        }
        await safeDbCall(() => db.forumThreads.update(selectedThread.id, updated)).catch(() => {})
        setSelectedThread({ ...selectedThread, ...updated })
        await openThread({ ...selectedThread, ...updated })
        void loadCommunity()
        return true
      } catch (error) {
        console.error('Failed to reply:', error)
        toast.error('Failed to post your reply. Please try again.')
        return false
      } finally {
        setReplying(false)
      }
    },
    [user, selectedThread, openThread, loadCommunity]
  )

  const handleChecklistAction = useCallback(
    (item: keyof ChecklistState) => {
      if (item === 'follow') {
        updateChecklist({ follow: true })
        navigate('/events')
        return
      }
      // intro + post focus the composer; they complete when a real post lands.
      setSelectedThread(null)
      if (item === 'intro' && spaceById['introductions']) setSelectedSpaceId('introductions')
      setComposerFocusSignal((n) => n + 1)
    },
    [navigate, spaceById, updateChecklist]
  )

  const selectSpace = useCallback((id: string) => {
    setSelectedSpaceId(id)
    setSelectedThread(null)
    setSearchTerm('')
  }, [])

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F6FAF7]">
        <Loader2 className="h-8 w-8 animate-spin text-[#00A651]" aria-label="Loading community" />
      </div>
    )
  }

  const displayName = user?.displayName || user?.email || 'Member'

  return (
    <div className="min-h-screen bg-[#F6FAF7] text-[#14201a]">
      {/* Compact header band */}
      <header className="border-b border-[#dfe9e2] bg-white/70">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#00713a]">The network</p>
          <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            Community
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#4c5a52] sm:text-[15px]">
            One feed for the whole jam network — what members share, plus what is happening
            across jams, hosts and results worldwide.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[230px_minmax(0,1fr)_280px]">
          {/* LEFT: spaces */}
          <aside className="sticky top-24 hidden lg:block">
            <SpacesSidebar
              spaces={spaces}
              threadCounts={threadCounts}
              selectedId={selectedSpaceId}
              onSelect={selectSpace}
            />
          </aside>

          {/* CENTER: composer + feed / thread view */}
          <main className="min-w-0 space-y-4">
            <div className="lg:hidden">
              <SpacesSidebar
                spaces={spaces}
                threadCounts={threadCounts}
                selectedId={selectedSpaceId}
                onSelect={selectSpace}
                variant="chips"
              />
            </div>

            {selectedThread ? (
              <ThreadView
                thread={selectedThread}
                space={spaceById[selectedThread.categoryId]}
                posts={threadPosts}
                authors={authors}
                loadingPosts={loadingPosts}
                submitting={replying}
                onBack={() => setSelectedThread(null)}
                onReply={handleReply}
              />
            ) : spaceIsLockedForViewer ? (
              <>
                <SpaceHeading space={selectedSpace} />
                <div className="rounded-2xl border border-[#dfe9e2] bg-white p-8 text-center">
                  <Lock className="mx-auto mb-3 h-8 w-8 text-[#7d8a83]" aria-hidden="true" />
                  <h3 className="font-display text-lg font-extrabold">A space for jam hosts</h3>
                  <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-[#4c5a52]">
                    {selectedSpace?.name} is reserved for certified hosts planning their jams.
                    Become a host to unlock it.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate('/course/enroll')}
                    className="mt-4 inline-flex items-center rounded-full bg-[#00A651] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#008a44]"
                  >
                    Explore the host course
                  </button>
                </div>
              </>
            ) : (
              <>
                {user && (
                  <Composer
                    spaces={spaces}
                    selectedSpaceId={selectedSpaceId}
                    isHost={isHost}
                    posting={posting}
                    displayName={displayName}
                    onPost={handlePost}
                    focusSignal={composerFocusSignal}
                  />
                )}

                {/* Feed heading + search */}
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <SpaceHeading space={selectedSpace} />
                  <label className="relative block">
                    <Search
                      className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#7d8a83]"
                      aria-hidden="true"
                    />
                    <input
                      type="search"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search the feed…"
                      className="w-48 rounded-full border border-[#dfe9e2] bg-white py-1.5 pl-8 pr-3 text-[13px] text-[#14201a] placeholder:text-[#7d8a83] focus:border-[#00A651]/50 focus:outline-none sm:w-56"
                      aria-label="Search the feed"
                    />
                  </label>
                </div>

                {/* Unified feed */}
                {feedItems.length === 0 ? (
                  <div className="rounded-2xl border border-[#dfe9e2] bg-white p-8 text-center">
                    <p className="font-display text-lg font-extrabold">
                      {searchTerm ? 'Nothing matches that search' : 'Quiet in here — for now'}
                    </p>
                    <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-[#4c5a52]">
                      {searchTerm
                        ? 'Try different words, or clear the search to see the full feed.'
                        : 'Be the first to say hello. Your post kicks off this space.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {feedItems.map((item, i) =>
                      item.type === 'thread' ? (
                        <div key={item.thread.id} className="ggj-rise" style={{ animationDelay: `${Math.min(i, 8) * 45}ms` }}>
                          <ThreadCard
                            thread={item.thread}
                            space={spaceById[item.thread.categoryId]}
                            author={authors[item.thread.authorId]}
                            snippet={snippets[item.thread.id]}
                            onOpen={openThread}
                          />
                        </div>
                      ) : (
                        <div key={item.card.key} className="ggj-rise" style={{ animationDelay: `${Math.min(i, 8) * 45}ms` }}>
                          <ActivityCardView card={item.card} />
                        </div>
                      )
                    )}
                  </div>
                )}
              </>
            )}
          </main>

          {/* RIGHT: rail */}
          <aside className="lg:sticky lg:top-24">
            <RightRail
              events={communityEvents}
              hostsCount={hostsCount}
              checklist={checklist}
              onChecklistAction={handleChecklistAction}
            />
          </aside>
        </div>
      </div>
    </div>
  )
}

function SpaceHeading({ space }: { space?: Space }) {
  return (
    <div className="min-w-0">
      <h2 className="font-display text-lg font-extrabold tracking-tight">
        {space ? space.name : 'All activity'}
      </h2>
      <p className="mt-0.5 text-[13px] text-[#7d8a83]">
        {space
          ? space.description || 'Conversations in this space.'
          : 'Member posts, interleaved with live activity from the jam network.'}
      </p>
    </div>
  )
}
