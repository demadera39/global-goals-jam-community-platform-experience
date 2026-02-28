import { useEffect, useRef, useState } from 'react'
import blink, { safeDbCall } from '../lib/blink'
import { getUserProfile, canAccessFeature, USER_ROLES } from '../lib/userStatus'
import type { UserProfile } from '../lib/userStatus'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Separator } from './ui/separator'
import { Image as ImageIcon, FileText, Link as LinkIcon, Upload, Trash2, Video } from 'lucide-react'
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

export default function EventMediaSection({ event, user }: { event: EventLike; user: User | null }) {
  const [items, setItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [addingLink, setAddingLink] = useState(false)
  const [linkTitle, setLinkTitle] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [linkDescription, setLinkDescription] = useState('')
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)

  // Permission checks: must have manage_events AND be event owner or admin
  const canManage = !!profile && canAccessFeature(profile, 'manage_events')
  const canEdit = !!user && canManage && (user.id === event.hostId || profile?.role === USER_ROLES.ADMIN)

  const loadMedia = async () => {
    setLoading(true)
    try {
      const rows = await safeDbCall(() => blink.db.media.list<MediaItem>({
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
      alert('Only the event host or an admin can upload media.')
      return
    }
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canEdit) {
      alert('You do not have permission to upload media for this event.')
      ;(e.target as HTMLInputElement).value = ''
      return
    }
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      // Upload to storage
      const { publicUrl } = await blink.storage.upload(
        file,
        `events/${event.id}/media/${Date.now()}.${file.name.split('.').pop()}`,
        { upsert: true }
      )
      const rec = await safeDbCall(() => blink.db.media.create<MediaItem>({
        eventId: event.id,
        uploadedBy: user?.id || 'unknown',
        title: file.name,
        description: '',
        fileUrl: publicUrl,
        fileType: file.type || 'file',
        fileSize: file.size
      }))
      setItems(prev => [rec, ...prev])
      ;(e.target as HTMLInputElement).value = ''
    } catch (err) {
      console.error('Upload failed:', err)
      alert('Failed to upload file. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const addExternalLink = async () => {
    if (!canEdit) {
      alert('You do not have permission to add links to this event.')
      return
    }
    if (!linkUrl.trim()) return
    setUploading(true)
    try {
      const rec = await safeDbCall(() => blink.db.media.create<MediaItem>({
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
      alert('Failed to add link. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const deleteItem = async (id: string) => {
    if (!confirm('Remove this item?')) return
    try {
      await safeDbCall(() => blink.db.media.delete(id))
      setItems(prev => prev.filter(i => i.id !== id))
    } catch (err) {
      console.error('Delete failed:', err)
      alert('Failed to delete item.')
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Results & Media</CardTitle>
        {canEdit && (
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
        {addingLink && canEdit && (
          <div className="mb-6 p-4 border rounded-lg space-y-3">
            <Input placeholder="Link title (optional)" value={linkTitle} onChange={(e) => setLinkTitle(e.target.value)} />
            <Input placeholder="https://example.com/file-or-board" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} />
            <Textarea placeholder="Short description (optional)" value={linkDescription} onChange={(e) => setLinkDescription(e.target.value)} />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setAddingLink(false)}>Cancel</Button>
              <Button onClick={addExternalLink} className="bg-primary-solid text-white hover:bg-primary/90" disabled={uploading}>Add</Button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="py-10 text-center text-muted-foreground">Loading…</div>
        ) : items.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground">No results yet. {canEdit && 'Upload files or add links to showcase your outcomes.'}</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map(item => (
              <div key={item.id} className="group relative border rounded-lg overflow-hidden bg-card">
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
                      <div className="w-full h-40 bg-muted flex items-center justify-center">
                        <LinkIcon className="w-8 h-8 text-muted-foreground" />
                      </div>
                    </a>
                  ) : (
                    <a href={item.fileUrl} target="_blank" rel="noreferrer" className="block">
                      <div className="w-full h-40 bg-muted flex items-center justify-center">
                        <FileText className="w-8 h-8 text-muted-foreground" />
                      </div>
                    </a>
                  )}

                  <div className="p-3">
                    <div className="text-sm font-medium truncate" title={item.title}>{item.title || 'Untitled'}</div>
                    {item.description && (
                      <div className="text-xs text-muted-foreground line-clamp-2 mt-1">{item.description}</div>
                    )}
                  </div>
                </div>
                {canEdit && (user?.id === item.uploadedBy || profile?.role === USER_ROLES.ADMIN) && (
                  <button
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center justify-center w-8 h-8 rounded-md bg-black/60 text-white"
                    onClick={(e) => { e.preventDefault(); deleteItem(item.id) }}
                    title="Delete"
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
