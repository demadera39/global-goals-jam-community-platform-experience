import { useEffect, useState } from 'react'
import { Card, CardContent } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { ChevronLeft, ChevronRight, MapPin, Calendar, RefreshCw, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { blink, safeDbCall } from '../lib/blink'

interface JamHighlight {
  id: string
  imageUrl: string
  city?: string
  country?: string
  year?: number
  description?: string
  sourceUrl?: string
}

export default function JamHighlightsCarousel() {
  const [highlights, setHighlights] = useState<JamHighlight[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [scraping, setScraping] = useState(false)
  const [autoPlay, setAutoPlay] = useState(true)

  // Load highlights from database
  const loadHighlights = async () => {
    setLoading(true)
    try {
      // Check if database is available
      if (!blink?.database?.list) {
        console.warn('Blink database not initialized')
        setHighlights([])
        setLoading(false)
        return
      }

      const result = await safeDbCall(() => 
        blink.database.list('jam_highlights', {
          filter: { is_verified: '1' }, // Only show verified images
          limit: 50,
        })
      )

      if (result && result.length > 0) {
        // Shuffle for random display
        const shuffled = [...result].sort(() => Math.random() - 0.5)
        setHighlights(shuffled.slice(0, 20)) // Show up to 20 random images
      } else {
        // If no highlights exist, fetch some initially
        setHighlights([])
      }
    } catch (error) {
      console.error('Error loading highlights:', error)
      toast.error('Failed to load jam highlights')
      setHighlights([])
    } finally {
      setLoading(false)
    }
  }

  // Scrape new images from the internet
  const scrapeNewImages = async () => {
    setScraping(true)
    toast.loading('Searching for Global Goals Jam images...')
    
    try {
      const response = await fetch(
        'https://7uamgc2j--scrape-jam-images.functions.blink.new',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            searchQuery: 'Global Goals Jam event photos',
            maxResults: 15,
          }),
        }
      )

      const data = await response.json()

      if (data.success) {
        toast.success(`Found ${data.savedCount} new jam photos!`)
        // Reload highlights to include new images
        await loadHighlights()
      } else {
        toast.error(data.error || 'Failed to scrape images')
      }
    } catch (error) {
      console.error('Scraping error:', error)
      toast.error('Failed to fetch new images')
    } finally {
      setScraping(false)
    }
  }

  // Auto-advance carousel
  useEffect(() => {
    if (!autoPlay || highlights.length === 0) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % highlights.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [autoPlay, highlights.length])

  useEffect(() => {
    loadHighlights()
  }, [])

  const goToPrevious = () => {
    setAutoPlay(false)
    setCurrentIndex((prev) => (prev - 1 + highlights.length) % highlights.length)
  }

  const goToNext = () => {
    setAutoPlay(false)
    setCurrentIndex((prev) => (prev + 1) % highlights.length)
  }

  const currentHighlight = highlights[currentIndex]

  if (loading) {
    return (
      <section className="py-12 bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-96 rounded-2xl bg-card animate-pulse border" />
        </div>
      </section>
    )
  }

  if (highlights.length === 0) {
    return (
      <section className="py-12 bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="text-center p-8">
            <CardContent className="space-y-4">
              <Sparkles className="w-12 h-12 mx-auto text-primary" />
              <h3 className="text-xl font-bold">Discover Global Goals Jam Highlights</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                We'll automatically search the web for amazing Global Goals Jam moments from around the world!
              </p>
              <Button
                onClick={scrapeNewImages}
                disabled={scraping}
                className="bg-primary-solid text-white hover:bg-primary/90"
              >
                {scraping ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Find Jam Photos
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    )
  }

  return (
    <section className="py-12 bg-gradient-to-br from-primary/5 to-accent/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-end justify-between mb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">From around the world</p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Global Goals Jam Highlights
            </h2>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={scrapeNewImages}
            disabled={scraping}
          >
            {scraping ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Finding...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Find More
              </>
            )}
          </Button>
        </div>

        {/* Carousel */}
        <div className="relative">
          <Card className="overflow-hidden">
            <div className="relative h-[500px] bg-black">
              {currentHighlight && (
                <>
                  {/* Image */}
                  <img
                    src={currentHighlight.imageUrl}
                    alt={currentHighlight.description || 'Global Goals Jam event'}
                    className="w-full h-full object-contain"
                    loading="lazy"
                    crossOrigin="anonymous"
                    onError={(e) => {
                      console.error('[JamHighlightsCarousel] Failed to load image:', currentHighlight.imageUrl)
                      const img = e.target as HTMLImageElement
                      img.style.backgroundImage = 'linear-gradient(135deg, #00A651 0%, #F59E0B 100%)'
                      img.style.backgroundSize = 'cover'
                    }}
                  />

                  {/* Metadata overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6">
                    <div className="flex items-end justify-between gap-4">
                      <div className="space-y-2">
                        {currentHighlight.description && (
                          <p className="text-white text-lg font-medium line-clamp-2">
                            {currentHighlight.description}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2">
                          {currentHighlight.city && (
                            <Badge variant="secondary" className="bg-white/20 text-white border-0">
                              <MapPin className="w-3 h-3 mr-1" />
                              {currentHighlight.city}
                              {currentHighlight.country && `, ${currentHighlight.country}`}
                            </Badge>
                          )}
                          {currentHighlight.year && (
                            <Badge variant="secondary" className="bg-white/20 text-white border-0">
                              <Calendar className="w-3 h-3 mr-1" />
                              {currentHighlight.year}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Counter */}
                      <div className="text-white/70 text-sm font-medium">
                        {currentIndex + 1} / {highlights.length}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </Card>

          {/* Navigation buttons */}
          <Button
            variant="outline"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white"
            onClick={goToPrevious}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white"
            onClick={goToNext}
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        {/* Thumbnail strip */}
        <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
          {highlights.map((highlight, index) => (
            <button
              key={highlight.id}
              onClick={() => {
                setCurrentIndex(index)
                setAutoPlay(false)
              }}
              className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                index === currentIndex
                  ? 'border-primary ring-2 ring-primary/20'
                  : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              <img
                src={highlight.imageUrl}
                alt=""
                className="w-full h-full object-cover"
                loading="lazy"
                crossOrigin="anonymous"
                onError={(e) => {
                  const img = e.target as HTMLImageElement
                  img.style.backgroundImage = 'linear-gradient(135deg, #00A651 0%, #F59E0B 100%)'
                  img.style.backgroundSize = 'cover'
                }}
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
