import { useEffect, useState } from 'react'
import { Input } from '../components/ui/input'
import { toast } from 'sonner'
import {
  getAllHighlights,
  verifyHighlight,
  deleteHighlight,
  addHighlight,
  scrapeNewHighlights,
  type JamHighlight,
} from '../lib/jamHighlights'
import {
  Check,
  Trash2,
  RefreshCw,
  Plus,
  MapPin,
  Calendar,
  ExternalLink,
  Sparkles,
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { Label } from '../components/ui/label'
import AdminShell, {
  Pill,
  adminCardClass,
  quietButtonClass,
  primaryButtonClass,
} from '../components/admin/AdminShell'

export default function AdminHighlightsPage() {
  const [highlights, setHighlights] = useState<JamHighlight[]>([])
  const [loading, setLoading] = useState(true)
  const [scraping, setScraping] = useState(false)
  const [filterVerified, setFilterVerified] = useState<'all' | 'verified' | 'unverified'>('all')

  // Manual add form
  const [newImageUrl, setNewImageUrl] = useState('')
  const [newCity, setNewCity] = useState('')
  const [newCountry, setNewCountry] = useState('')
  const [newYear, setNewYear] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [addDialogOpen, setAddDialogOpen] = useState(false)

  const loadHighlights = async () => {
    setLoading(true)
    const data = await getAllHighlights()
    setHighlights(data)
    setLoading(false)
  }

  useEffect(() => {
    loadHighlights()
  }, [])

  const handleVerify = async (id: string) => {
    const success = await verifyHighlight(id)
    if (success) {
      toast.success('Highlight verified')
      setHighlights((prev) =>
        prev.map((h) => (h.id === id ? { ...h, isVerified: true } : h))
      )
    } else {
      toast.error('Failed to verify')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this highlight?')) return
    
    const success = await deleteHighlight(id)
    if (success) {
      toast.success('Highlight deleted')
      setHighlights((prev) => prev.filter((h) => h.id !== id))
    } else {
      toast.error('Failed to delete')
    }
  }

  const handleScrape = async () => {
    setScraping(true)
    const result = await scrapeNewHighlights('community workshop people collaboration teamwork', 20)
    setScraping(false)
    
    if (result.success) {
      toast.success(`Found ${result.savedCount} new images from Unsplash!`)
      await loadHighlights()
    } else {
      toast.error(result.error || 'Scraping failed. Make sure UNSPLASH_ACCESS_KEY is configured.')
    }
  }

  const handleManualAdd = async () => {
    if (!newImageUrl) {
      toast.error('Image URL is required')
      return
    }

    const id = await addHighlight({
      imageUrl: newImageUrl,
      city: newCity || undefined,
      country: newCountry || undefined,
      year: newYear ? Number(newYear) : undefined,
      description: newDescription || undefined,
      isVerified: false,
    })

    if (id) {
      toast.success('Highlight added')
      setAddDialogOpen(false)
      setNewImageUrl('')
      setNewCity('')
      setNewCountry('')
      setNewYear('')
      setNewDescription('')
      await loadHighlights()
    } else {
      toast.error('Failed to add highlight')
    }
  }

  const filteredHighlights = highlights.filter((h) => {
    if (filterVerified === 'verified') return h.isVerified
    if (filterVerified === 'unverified') return !h.isVerified
    return true
  })

  const filterPills: { key: 'all' | 'verified' | 'unverified'; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: highlights.length },
    { key: 'verified', label: 'Verified', count: highlights.filter((h) => h.isVerified).length },
    { key: 'unverified', label: 'Unverified', count: highlights.filter((h) => !h.isVerified).length },
  ]

  return (
    <AdminShell
      title="Highlights"
      description="Review, verify and manage the jam photos shown across the site."
      actions={
        <>
          <button type="button" onClick={() => setAddDialogOpen(true)} className={quietButtonClass}>
            <Plus className="w-4 h-4" />
            Add manually
          </button>
          <button type="button" onClick={handleScrape} disabled={scraping} className={primaryButtonClass}>
            {scraping ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Finding photos…
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Find jam photos
              </>
            )}
          </button>
        </>
      }
    >
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Highlight Manually</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Image URL *</Label>
              <Input
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>City</Label>
                <Input
                  value={newCity}
                  onChange={(e) => setNewCity(e.target.value)}
                  placeholder="Amsterdam"
                />
              </div>
              <div>
                <Label>Country</Label>
                <Input
                  value={newCountry}
                  onChange={(e) => setNewCountry(e.target.value)}
                  placeholder="Netherlands"
                />
              </div>
            </div>
            <div>
              <Label>Year</Label>
              <Input
                type="number"
                value={newYear}
                onChange={(e) => setNewYear(e.target.value)}
                placeholder="2024"
                min="2016"
                max="2030"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Global Goals Jam in..."
              />
            </div>
            <button type="button" onClick={handleManualAdd} className={`${primaryButtonClass} w-full`}>
              Add Highlight
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Filter pills */}
      <div className="mb-6 flex flex-wrap gap-2">
        {filterPills.map((f) => {
          const active = filterVerified === f.key
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilterVerified(f.key)}
              aria-pressed={active}
              className={
                active
                  ? 'inline-flex items-center gap-1.5 rounded-full border border-[#14201a] bg-[#14201a] px-3.5 py-1.5 text-[13px] font-semibold text-white'
                  : 'inline-flex items-center gap-1.5 rounded-full border border-[#dfe9e2] bg-white px-3.5 py-1.5 text-[13px] font-semibold text-[#4c5a52] transition-colors hover:border-[#00A651]/50 hover:text-[#00713a]'
              }
            >
              {f.label}
              <span className={`font-mono text-xs tabular-nums ${active ? 'text-white/70' : 'text-[#7d8a83]'}`}>{f.count}</span>
            </button>
          )
        })}
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 rounded-2xl border border-[#dfe9e2] bg-white animate-pulse" />
          ))}
        </div>
      ) : filteredHighlights.length === 0 ? (
        <div className={`${adminCardClass} p-12 text-center`}>
          <p className="text-sm text-[#7d8a83]">No highlights found</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredHighlights.map((highlight) => (
            <div key={highlight.id} className={`${adminCardClass} overflow-hidden`}>
              <div className="relative h-48 bg-[#14201a]">
                <img
                  src={highlight.imageUrl}
                  alt={highlight.description || 'Jam highlight'}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {highlight.isVerified && (
                  <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-[#00A651] px-2.5 py-0.5 text-[11px] font-semibold text-white shadow-sm">
                    <Check className="w-3 h-3" />
                    verified
                  </span>
                )}
              </div>
              <div className="p-4">
                {highlight.description && (
                  <p className="line-clamp-2 text-sm font-semibold text-[#14201a]">
                    {highlight.description}
                  </p>
                )}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {highlight.city && (
                    <Pill tone="grey">
                      <MapPin className="w-3 h-3" />
                      {highlight.city}
                      {highlight.country && `, ${highlight.country}`}
                    </Pill>
                  )}
                  {highlight.year && (
                    <Pill tone="grey">
                      <Calendar className="w-3 h-3" />
                      {highlight.year}
                    </Pill>
                  )}
                </div>
                <div className="mt-4 flex items-center gap-2 border-t border-[#dfe9e2] pt-3">
                  {!highlight.isVerified && (
                    <button
                      type="button"
                      onClick={() => handleVerify(highlight.id)}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-[#00A651]/40 bg-[#00A651]/5 px-3.5 py-1.5 text-[13px] font-semibold text-[#00713a] transition-colors hover:bg-[#00A651]/10"
                    >
                      <Check className="w-4 h-4" />
                      Verify
                    </button>
                  )}
                  {highlight.sourceUrl && (
                    <a
                      href={highlight.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      title="Open source"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#dfe9e2] bg-white text-[#7d8a83] transition-colors hover:border-[#00A651]/50 hover:text-[#00713a]"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(highlight.id)}
                    title="Delete highlight"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#dfe9e2] bg-white text-[#7d8a83] transition-colors hover:border-red-300 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminShell>
  )
}
