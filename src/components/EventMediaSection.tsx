import { toast } from 'sonner'
import { useEffect, useRef, useState } from 'react'
import { db, storage, safeDbCall } from '../lib/supabase'
import { cn } from '../lib/utils'
import { getUserProfile, canAccessFeature, USER_ROLES } from '../lib/userStatus'
import type { UserProfile } from '../lib/userStatus'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Image as ImageIcon, FileText, Link as LinkIcon, Upload, Trash2, Loader2, Youtube } from 'lucide-react'
import AudioPlayer from './ui/AudioPlayer'

interface User {
  id: string
  email: string
  displayName?: string
  role: string
}

interface EventLike {
  id: string
  hostId: string
}

interface MediaItem {
  id: string
  eventId?: string
  uploadedBy: string
  title: string
  description?: string
  fileUrl: string
  fileType: string
  fileSize?: number
  sdgTags?: string
  createdAt: string
}

function isImage(item: MediaItem) {
  const t = (item.fileType || '').toLowerCase()
  const url = item.fileUrl.toLowerCase()
  return t.startsWith('image/') || /\.(png|jpg|jpeg|gif|webp)$/i.test(url)
}

function isVideo(item: MediaItem) {
  const t = (item.fileType || '').toLowerCase()
  const url = item.fileUrl.toLowerCase()
  return t.startsWith('video/') || /\.(mp4|webm|ogg)$/i.test(url)
}

function isAudio(item: MediaItem) {
  const t = (item.fileType || '').toLowerCase()
  const url = item.fileUrl.toLowerCase()
  return t.startsWith('audio/') || /\.(mp3|wav|ogg|m4a)$/i.test(url)
}

function isYouTubeUrl(url: string): boolean {
  const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/.+/i
  return youtubeRegex.test(url)
}

function toYouTubeEmbed(url: string): string {
  let videoId = ''
  const youtubeUrlRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/
  const match = url.match(youtubeUrlRegex)
  if (match && match[1]) {
    videoId = match[1]
  }
  return `https://www.youtube.com/embed/${videoId}`
}

export default function EventMediaSection({
  event,
  user,
  variant = 'display',
}: {
  event: EventLike
  user: User | null
  /** 'editor' shows the drag-and-drop dropzone (results editor); 'display' keeps
   *  the compact header buttons used on the public event page (default). */
  variant?: 'editor' | 'display'
}) {
  const [items, setItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [addingLink, setAddingLink] = useState(false)
  const [linkTitle, setLinkTitle] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [linkDescription, setLinkDescription] = useState('')
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)

  const isEditor = variant === 'editor'

  // Permission checks: must have manage_events AND be event owner or admin
  const canManage = !!profile && canAccessFeature(profile, 'manage_events')
  const canEdit = !!user && canManage && (user.id === event.hostId || profile?.role === USER_ROLES.ADMIN)

  const loadMedia = async () => {
    setLoading(true)
    try {
      const rows = await safeDbCall(() => db.media.list<MediaItem>({
        where: { eventId: event.id },
        orderBy: { createdAt: 'desc' },
        limit: 100
      }))
      setItems(rows)
    } catch (e) {
      console.error('Failed to load media:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (event?.id) {
      loadMedia().catch(console.error)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event?.id])

  // Load user profile for permission checks
  useEffect(() => {
    let active = true
    if (user?.id) {
      getUserProfile(user.id).then(p => { if (active) setProfile(p) }).catch(() => setProfile(null))
    } else {
      setProfile(null)
    }
    return () => { active = false }
  }, [user?.id])

  const handleChooseFile = () => {
    if (!canEdit) {
      toast.error('Only the event host or an admin can upload media.')
      return
    }
    fileInputRef.current?.click()
  }

  // Shared upload path — used by the file picker and the drag-and-drop zone.
  // Storage + db.media.create logic is unchanged from the original.
  const uploadFile = async (file: File) => {
    setUploading(true)
    try {
      const { publicUrl } = await storage.upload(
        file,
        `events/${event.id}/media/${Date.now()}.${file.name.split('.').pop()}`,
        { upsert: true }
      )
      const rec = await safeDbCall(() => db.media.create<MediaItem>({
        eventId: event.id,
        uploadedBy: user?.id || 'unknown',
        title: file.name,
        description: '',
        fileUrl: publicUrl,
        fileType: file.type || 'file',
        fileSize: file.size
      }))
      setItems(prev => [rec, ...prev])
    } catch (err) {
      console.error('Upload failed:', err)
      toast.error('Failed to upload file. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canEdit) {
      toast.error('You do not have permission to upload media for this event.')
      ;(e.target as HTMLInputElement).value = ''
      return
    }
    const file = e.target.files?.[0]
    if (!file) return
    await uploadFile(file)
    ;(e.target as HTMLInputElement).value = ''
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    if (!canEdit) {
      toast.error('Only the event host or an admin can upload media.')
      return
    }
    if (uploading) return
    const file = e.dataTransfer.files?.[0]
    if (file) await uploadFile(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (canEdit && !uploading) setDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
  }

  const addExternalLink = async () => {
    if (!canEdit) {
      toast.error('You do not have permission to add links to this event.')
      return
    }
    if (!linkUrl.trim()) return
    setUploading(true)
    try {
      const rec = await safeDbCall(() => db.media.create<MediaItem>({
        eventId: event.id,
        uploadedBy: user?.id || 'unknown',
        title: linkTitle.trim() || linkUrl.trim(),
        description: linkDescription.trim() || undefined,
        fileUrl: linkUrl.trim(),
        fileType: 'link'
      }))
      setItems(prev => [rec, ...prev])
      setLinkTitle(''); setLinkUrl(''); setLinkDescription(''); setAddingLink(false)
    } catch (err) {
      console.error('Add link failed:', err)
      toast.error('Failed to add link. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const deleteItem = async (id: string) => {
    if (!confirm('Remove this item?')) return
    try {
      await safeDbCall(() => db.media.delete(id))
      setItems(prev => prev.filter(i => i.id !== id))
    } catch (err) {
      console.error('Delete failed:', err)
      toast.error('Failed to delete item.')
    }
  }

  const gridCls = isEditor
    ? 'grid grid-cols-2 gap-3'
    : 'grid sm:grid-cols-2 lg:grid-cols-3 gap-4'

  return (
    <Card className={isEditor ? 'rounded-2xl border border-[#dfe9e2] bg-white shadow-soft' : undefined}>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {isEditor && (
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#7d8a83]">
              Photos, video &amp; links
            </p>
          )}
          <CardTitle className={isEditor ? 'mt-1 font-display text-xl font-extrabold' : undefined}>
            Results &amp; Media
          </CardTitle>
        </div>
        {/* Display variant keeps the original compact header buttons (backward compatible). */}
        {!isEditor && canEdit && (
          <div className="flex gap-2">
            <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
            <Button onClick={handleChooseFile} disabled={uploading} className="bg-primary-solid text-white hover:bg-primary/90">
              <Upload className="w-4 h-4 mr-2" />
              {uploading ? 'Uploading…' : 'Upload File'}
            </Button>
            <Button variant="outline" onClick={() => setAddingLink(v => !v)}>
              <LinkIcon className="w-4 h-4 mr-2" /> Add Link
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {/* Editor variant: drag-and-drop dropzone + clearer link affordance. */}
        {isEditor && canEdit && (
          <div className="mb-5 space-y-3">
            <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
            <button
              type="button"
              onClick={handleChooseFile}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              disabled={uploading}
              aria-label="Upload a file by clicking or dropping it here"
              className={cn(
                'flex w-full flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed px-6 py-9 text-center transition-colors',
                dragging
                  ? 'border-[#00A651] bg-[#00A651]/5'
                  : 'border-[#dfe9e2] hover:border-[#00A651]/50 hover:bg-[#F6FAF7]',
                uploading && 'pointer-events-none opacity-60',
              )}
            >
              {uploading ? (
                <Loader2 className="h-6 w-6 animate-spin text-[#00A651]" aria-hidden="true" />
              ) : (
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#00A651]/10 text-[#00A651]">
                  <Upload className="h-5 w-5" aria-hidden="true" />
                </span>
              )}
              <span className="mt-1 text-sm font-semibold text-[#14201a]">
                {uploading ? 'Uploading…' : (
                  <>Drag &amp; drop, or <span className="text-[#00713a] underline decoration-[#00A651]/40 underline-offset-2">click to upload</span></>
                )}
              </span>
              <span className="text-xs text-[#7d8a83]">Images, video, audio or documents</span>
            </button>

            <button
              type="button"
              onClick={() => setAddingLink(v => !v)}
              className="inline-flex items-center gap-2 rounded-full border border-[#dfe9e2] bg-white px-4 py-2 text-sm font-semibold text-[#14201a] transition-colors hover:border-[#00A651]/50 hover:text-[#00713a]"
            >
              <Youtube className="h-4 w-4 text-[#00A651]" /> Add a YouTube or resource link
            </button>
          </div>
        )}

        {addingLink && canEdit && (
          <div className="mb-6 space-y-3 rounded-xl border border-[#dfe9e2] bg-[#F6FAF7] p-4">
            <Input placeholder="Link title (optional)" value={linkTitle} onChange={(e) => setLinkTitle(e.target.value)} />
            <Input placeholder="Paste a YouTube, Miro, Figma or Drive link…" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} />
            <Textarea placeholder="Short description (optional)" value={linkDescription} onChange={(e) => setLinkDescription(e.target.value)} />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => { setAddingLink(false); setLinkTitle(''); setLinkUrl(''); setLinkDescription('') }}>Cancel</Button>
              <Button onClick={addExternalLink} className="bg-primary-solid text-white hover:bg-primary/90" disabled={uploading || !linkUrl.trim()}>Add link</Button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="py-10 text-center text-sm text-[#7d8a83]">Loading…</div>
        ) : items.length === 0 ? (
          <div className={cn(
            'rounded-xl border border-dashed border-[#dfe9e2] py-10 text-center text-sm text-[#7d8a83]',
            isEditor ? '' : 'bg-transparent',
          )}>
            <ImageIcon className="mx-auto mb-2 h-6 w-6 text-[#c3d3ca]" aria-hidden="true" />
            {isEditor
              ? 'Nothing uploaded yet — add your first photo, video or link above.'
              : <>No results yet. {canEdit && 'Upload files or add links to showcase your outcomes.'}</>}
          </div>
        ) : (
          <div className={gridCls}>
            {items.map(item => (
              <div key={item.id} className="group relative overflow-hidden rounded-xl border border-[#dfe9e2] bg-white transition-shadow hover:shadow-card">
                <div className="block">
                  {isImage(item) ? (
                    <a href={item.fileUrl} target="_blank" rel="noreferrer">
                      <img src={item.fileUrl} alt={item.title} className="w-full h-40 object-cover" loading="lazy" />
                    </a>
                  ) : isVideo(item) ? (
                    isYouTubeUrl(item.fileUrl) ? (
                      <div className="w-full h-40 bg-black">
                        <iframe
                          title={item.title || 'Video'}
                          src={toYouTubeEmbed(item.fileUrl)}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="w-full h-40"
                        />
                      </div>
                    ) : (
                      <video controls className="w-full h-40 object-cover bg-black">
                        <source src={item.fileUrl} />
                        Your browser does not support the video tag.
                      </video>
                    )
                  ) : isAudio(item) ? (
                    <div className="p-3">
                      <AudioPlayer src={item.fileUrl} title={item.title} />
                    </div>
                  ) : item.fileType === 'link' ? (
                    <a href={item.fileUrl} target="_blank" rel="noreferrer" className="block">
                      <div className="w-full h-40 bg-[#F6FAF7] flex items-center justify-center">
                        <LinkIcon className="w-8 h-8 text-[#00A651]" />
                      </div>
                    </a>
                  ) : (
                    <a href={item.fileUrl} target="_blank" rel="noreferrer" className="block">
                      <div className="w-full h-40 bg-[#F6FAF7] flex items-center justify-center">
                        <FileText className="w-8 h-8 text-[#7d8a83]" />
                      </div>
                    </a>
                  )}

                  <div className="p-3">
                    <div className="text-sm font-medium truncate text-[#14201a]" title={item.title}>{item.title || 'Untitled'}</div>
                    {item.description && (
                      <div className="text-xs text-[#7d8a83] line-clamp-2 mt-1">{item.description}</div>
                    )}
                  </div>
                </div>
                {canEdit && (user?.id === item.uploadedBy || profile?.role === USER_ROLES.ADMIN) && (
                  <button
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white/90 text-[#c0392b] shadow-sm ring-1 ring-black/5 hover:bg-white"
                    onClick={(e) => { e.preventDefault(); deleteItem(item.id) }}
                    title="Delete"
                    aria-label="Delete this item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
