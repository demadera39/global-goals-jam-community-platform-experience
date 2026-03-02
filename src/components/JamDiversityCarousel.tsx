import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, MapPin, Calendar, Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { listBucketFilesWithUrls } from '@/lib/supabase'
import { config } from '@/lib/config'
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
        const response = await fetch(config.functions.listBucketImagesUrl, {
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
        console.warn('[JamDiversityCarousel] Edge function unavailable, falling back to storage API:', error)

        // Fallback: use Supabase Storage API directly
        try {
          const files = await listBucketFilesWithUrls('jams', '')
          if (mounted && files.length > 0) {
            const images: JamImage[] = files.map(file => {
              const parsed = parseFilename(file.name)
              return {
                name: file.name,
                folder: file.folder || '',
                url: file.url,
                ...parsed
              }
            })
            const shuffled = [...images].sort(() => Math.random() - 0.5)
            setHighlights(shuffled)
            console.log('[JamDiversityCarousel] Loaded', shuffled.length, 'images via storage fallback')
          } else if (mounted) {
            setHighlights([])
          }
        } catch (fallbackErr) {
          console.error('[JamDiversityCarousel] Storage fallback also failed:', fallbackErr)
        }

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
    <section className="py-20 bg-section-alt">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-[0.2em] font-semibold text-primary/60 mb-2">Around the World</p>
          <div className="flex items-center justify-center gap-4 mb-4">
            <h2 className="font-display text-4xl font-bold text-foreground">
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
                  <div className="aspect-[16/9] relative bg-muted overflow-hidden group">
                    {/* Fallback gradient - behind the image */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-accent/30" />
                    <img
                      src={highlight.url}
                      alt={`Global Goals Jam ${formatLocation(highlight)}`}
                      className="w-full h-full object-cover relative z-[1] transition-transform duration-700 group-hover:scale-105"
                      loading={index === currentIndex ? 'eager' : 'lazy'}
                      crossOrigin="anonymous"
                      onError={(e) => {
                        const img = e.target as HTMLImageElement
                        img.style.display = 'none'
                      }}
                    />

                    {/* Bottom gradient for text readability */}
                    <div className="absolute inset-0 z-[2] bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                    {/* Content Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 z-[3] p-6 sm:p-8 lg:p-10">
                      <div className="max-w-3xl">
                        {/* Location badge */}
                        <div className="flex flex-wrap items-center gap-3 mb-3">
                          <span className="inline-flex items-center gap-2 bg-primary/90 text-white px-4 py-1.5 rounded-full text-sm font-semibold shadow-lg">
                            <MapPin className="w-4 h-4" />
                            {formatLocation(highlight)}
                          </span>
                          <span className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-sm font-medium">
                            <Calendar className="w-4 h-4 text-amber-300" />
                            {formatDate(highlight)}
                          </span>
                        </div>
                        {/* Description */}
                        <p className="text-white/90 text-base sm:text-lg font-medium leading-relaxed drop-shadow-lg">
                          Changemakers collaborating to design solutions for the Global Goals
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Navigation Buttons */}
            <Button
              variant="outline"
              size="icon"
              className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 bg-white/95 hover:bg-white border-none shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-200 w-10 h-10 sm:w-12 sm:h-12 rounded-full"
              onClick={goToPrev}
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 bg-white/95 hover:bg-white border-none shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-200 w-10 h-10 sm:w-12 sm:h-12 rounded-full"
              onClick={goToNext}
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
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
