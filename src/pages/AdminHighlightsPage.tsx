import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import { Label } from '../components/ui/label'

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

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Manage Jam Highlights</h1>
            <p className="text-muted-foreground mt-1">
              Review, verify, and manage Global Goals Jam photos
            </p>
          </div>
          <div className="flex gap-2">
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Manually
                </Button>
              </DialogTrigger>
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
                  <Button onClick={handleManualAdd} className="w-full">
                    Add Highlight
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button onClick={handleScrape} disabled={scraping}>
              {scraping ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Finding Photos...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Find Jam Photos
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={filterVerified === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterVerified('all')}
          >
            All ({highlights.length})
          </Button>
          <Button
            variant={filterVerified === 'verified' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterVerified('verified')}
          >
            Verified ({highlights.filter((h) => h.isVerified).length})
          </Button>
          <Button
            variant={filterVerified === 'unverified' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterVerified('unverified')}
          >
            Unverified ({highlights.filter((h) => !h.isVerified).length})
          </Button>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : filteredHighlights.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">No highlights found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredHighlights.map((highlight) => (
              <Card key={highlight.id} className="overflow-hidden">
                <div className="relative h-48 bg-black">
                  <img
                    src={highlight.imageUrl}
                    alt={highlight.description || 'Jam highlight'}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {highlight.isVerified && (
                    <Badge className="absolute top-2 right-2 bg-green-600 text-white">
                      <Check className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>
                <CardHeader className="pb-3">
                  {highlight.description && (
                    <p className="text-sm font-medium line-clamp-2">
                      {highlight.description}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {highlight.city && (
                      <Badge variant="secondary" className="text-xs">
                        <MapPin className="w-3 h-3 mr-1" />
                        {highlight.city}
                        {highlight.country && `, ${highlight.country}`}
                      </Badge>
                    )}
                    {highlight.year && (
                      <Badge variant="secondary" className="text-xs">
                        <Calendar className="w-3 h-3 mr-1" />
                        {highlight.year}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0 flex gap-2">
                  {!highlight.isVerified && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleVerify(highlight.id)}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Verify
                    </Button>
                  )}
                  {highlight.sourceUrl && (
                    <Button
                      size="sm"
                      variant="ghost"
                      asChild
                    >
                      <a href={highlight.sourceUrl} target="_blank" rel="noreferrer">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(highlight.id)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
