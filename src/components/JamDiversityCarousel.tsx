import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { ChevronLeft, ChevronRight, MapPin, Calendar, Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { listBucketFilesWithUrls } from '@/lib/supabase'
import { toast } from 'sonner'

interface JamImage {
  name: string
  url: string
  folder?: string
  city?: string
  country?: string
  year?: number
  date?: string
}

export default function JamDiversityCarousel() {
  const [highlights, setHighlights] = useState<JamImage[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  // Extract metadata from filename
  const parseFilename = (filename: string): { city?: string; country?: string; year?: number; date?: string } => {
    // Remove file extension
    const nameWithoutExt = filename.replace(/\.(jpg|jpeg|png|webp|gif)$/i, '')
    
    // Try to extract date patterns (e.g., 2024-03-15, 20240315, etc.)
    const dateMatch = nameWithoutExt.match(/(\d{4})[-_]?(\d{2})[-_]?(\d{2})/)
    const yearMatch = nameWithoutExt.match(/\b(20\d{2})\b/)
    
    // Try to extract location (often between underscores or dashes)
    const parts = nameWithoutExt.split(/[-_\s]+/)
    
    const metadata: { city?: string; country?: string; year?: number; date?: string } = {}
    
    if (dateMatch) {
      metadata.date = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`
      metadata.year = parseInt(dateMatch[1])
    } else if (yearMatch) {
      metadata.year = parseInt(yearMatch[1])
    }
    
    // Try to identify city/country from parts
    // This is heuristic - common patterns in filenames
    const locationParts = parts.filter(part => 
      part.length > 2 && 
      !/^\d+$/.test(part) && // not just numbers
      !/^(img|image|photo|ggj|jam|global|goals)$/i.test(part) // not common keywords
    )
    
    if (locationParts.length > 0) {
      metadata.city = locationParts[0]
      if (locationParts.length > 1) {
        metadata.country = locationParts[1]
      }
    }
    
    return metadata
  }

  // Load images from Supabase storage bucket
  useEffect(() => {
    let mounted = true
    
    async function loadImages() {
      try {
        console.log('[JamDiversityCarousel] Starting to load images from edge function...')
        console.log('[JamDiversityCarousel] Refresh key:', refreshKey)
        
        // Call edge function to list bucket files (bypasses RLS restrictions)
        const response = await fetch('https://7uamgc2j--list-bucket-images.functions.blink.new', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bucketName: 'jams', folder: '' }),
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const result = await response.json()
        const files = result.success && result.files ? result.files : []
        console.log('[JamDiversityCarousel] Total files found:', files.length)
        console.log('[JamDiversityCarousel] Raw files data:', files)
        
        if (files.length > 0) {
          console.log('[JamDiversityCarousel] Sample files:', files.slice(0, 5).map(f => ({ 
            name: f.name,
            url: f.url
          })))
        }
        
        if (mounted) {
          if (files.length > 0) {
            // Parse filenames and create highlight objects
            const images: JamImage[] = files.map(file => {
              const parsed = parseFilename(file.name)
              return {
                name: file.name,
                folder: file.folder || '',
                url: file.url, // Use URL directly without cache busting (causes issues)
                ...parsed
              }
            })
            
            console.log('[JamDiversityCarousel] Parsed images:', images.length)
            console.log('[JamDiversityCarousel] Image URLs:', images.map(img => ({ 
              name: img.name, 
              url: img.url
            })))
            
            // Shuffle for variety
            const shuffled = [...images].sort(() => Math.random() - 0.5)
            setHighlights(shuffled)
            setIsLoading(false)
            setIsRefreshing(false)
            
            console.log('[JamDiversityCarousel] Successfully loaded', shuffled.length, 'images')
            toast.success(`Loaded ${shuffled.length} jam photos from around the world`)
          } else {
            console.warn('[JamDiversityCarousel] No images found in bucket. Please upload images to the "jams" bucket in Supabase Storage.')
            setHighlights([])
            setIsLoading(false)
            setIsRefreshing(false)
            toast.error('No jam photos found. Please upload images to Supabase Storage.')
          }
        }
      } catch (error) {
        console.error('[JamDiversityCarousel] Failed to load images from storage:', error)
        toast.error('Failed to load jam photos. Check console for details.')
        if (mounted) {
          setIsLoading(false)
          setIsRefreshing(false)
        }
      }
    }

    loadImages()
    
    return () => {
      mounted = false
    }
  }, [refreshKey])

  // Auto-play carousel
  useEffect(() => {
    if (!isAutoPlaying || highlights.length === 0) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % highlights.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [isAutoPlaying, highlights.length])

  const goToNext = () => {
    setIsAutoPlaying(false)
    setCurrentIndex((prev) => (prev + 1) % highlights.length)
  }

  const goToPrev = () => {
    setIsAutoPlaying(false)
    setCurrentIndex((prev) => (prev - 1 + highlights.length) % highlights.length)
  }

  const goToSlide = (index: number) => {
    setIsAutoPlaying(false)
    setCurrentIndex(index)
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    toast.info('Refreshing jam photos...')
    setRefreshKey(prev => prev + 1)
  }

  // Helper to format location
  const formatLocation = (highlight: JamImage) => {
    const parts = []
    if (highlight.city) parts.push(highlight.city)
    if (highlight.country) parts.push(highlight.country)
    return parts.join(', ') || 'Global Goals Jam'
  }

  // Helper to format date
  const formatDate = (highlight: JamImage) => {
    if (highlight.date) {
      return new Date(highlight.date).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      })
    }
    if (highlight.year) {
      return highlight.year.toString()
    }
    return 'Past Event'
  }

  // Show loading state
  if (isLoading) {
    return (
      <section className="py-16 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Global Jam Diversity
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover the vibrant tapestry of Global Goals Jams happening around the world
            </p>
          </div>
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="ml-4 text-muted-foreground">Loading jam photos...</p>
          </div>
        </div>
      </section>
    )
  }

  // Show empty state
  if (highlights.length === 0) {
    return (
      <section className="py-16 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-4 mb-4">
              <h2 className="text-4xl font-bold text-foreground">
                Global Jam Diversity
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing || isLoading}
                className="gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover the vibrant tapestry of Global Goals Jams happening around the world
            </p>
          </div>
          <div className="text-center py-20">
            <p className="text-muted-foreground mb-4">No jam highlights available yet.</p>
            <p className="text-sm text-muted-foreground">
              Upload images to the <strong>jams</strong> bucket in Supabase Storage.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Use the naming format: <code className="bg-muted px-2 py-1 rounded">city-country-year.jpg</code> or <code className="bg-muted px-2 py-1 rounded">.png</code>
            </p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-4">
            <h2 className="text-4xl font-bold text-foreground">
              Global Jam Diversity
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing || isLoading}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover the vibrant tapestry of Global Goals Jams happening around the world
          </p>
        </div>

        <div className="relative max-w-5xl mx-auto">
          {/* Main Carousel */}
          <div className="relative overflow-hidden rounded-2xl shadow-2xl">
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {highlights.map((highlight, index) => (
                <div key={highlight.name} className="min-w-full relative">
                  <div className="aspect-[16/9] relative bg-muted">
                    <img
                      src={highlight.url}
                      alt={`Global Goals Jam ${formatLocation(highlight)}`}
                      className="w-full h-full object-cover"
                      loading={index === currentIndex ? 'eager' : 'lazy'}
                      crossOrigin="anonymous"
                      onError={(e) => {
                        console.error('[JamDiversityCarousel] Failed to load image:', highlight.url)
                        console.error('[JamDiversityCarousel] Image name:', highlight.name)
                        console.error('[JamDiversityCarousel] Image folder:', highlight.folder)
                        console.error('[JamDiversityCarousel] Network error details:', (e.target as any)?.error)
                        // Show placeholder gradient on error
                        const img = e.target as HTMLImageElement
                        img.style.display = 'none'
                      }}
                      onLoad={() => {
                        console.log('[JamDiversityCarousel] Successfully loaded image:', highlight.name)
                      }}
                    />
                    {/* Fallback placeholder if image fails */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent opacity-40" style={{
                      backgroundImage: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%)'
                    }} />
                    
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    
                    {/* Content Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                      <Card className="bg-white/10 backdrop-blur-md border-white/20 p-6">
                        <div className="flex flex-wrap items-center gap-4 mb-2">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-primary" />
                            <span className="text-xl font-semibold">{formatLocation(highlight)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-accent" />
                            <span className="text-lg">{formatDate(highlight)}</span>
                          </div>
                        </div>
                        <p className="text-sm text-white/80">
                          Changemakers collaborating to design solutions for the Global Goals
                        </p>
                      </Card>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Navigation Buttons */}
            <Button
              variant="outline"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white border-none shadow-lg"
              onClick={goToPrev}
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white border-none shadow-lg"
              onClick={goToNext}
            >
              <ChevronRight className="w-6 h-6" />
            </Button>
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-2 mt-6 flex-wrap">
            {highlights.slice(0, 10).map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`transition-all duration-300 rounded-full ${
                  index === currentIndex
                    ? 'w-8 h-3 bg-primary'
                    : 'w-3 h-3 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
            {highlights.length > 10 && (
              <span className="text-xs text-muted-foreground self-center ml-2">
                +{highlights.length - 10} more
              </span>
            )}
          </div>

          {/* Counter */}
          <div className="text-center mt-4 text-muted-foreground">
            <span className="text-sm">
              {currentIndex + 1} / {highlights.length}
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
