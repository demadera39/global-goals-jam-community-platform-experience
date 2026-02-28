# Carousel Components - Quick Usage Guide

## Quick Start

### Import Single Carousel
```tsx
import JamDiversityCarousel from '@/components/JamDiversityCarousel'

export default function Page() {
  return <JamDiversityCarousel />
}
```

### Import Via Index
```tsx
import { JamDiversityCarousel, JamHighlightsCarousel } from '@/components/carousels'

export default function Page() {
  return (
    <>
      <JamDiversityCarousel />
      <JamHighlightsCarousel />
    </>
  )
}
```

---

## Component Comparison

| Aspect | JamDiversityCarousel | JamHighlightsCarousel |
|--------|---------------------|----------------------|
| **Data Source** | Supabase Storage (files) | Database + Web Scraping |
| **Upload Method** | Direct file upload to 'jams' bucket | Admin uploads or web scraping |
| **Refresh** | Manual refresh button | "Find More" scraping button |
| **Navigation** | Prev/Next buttons + dots | Prev/Next + thumbnail strip |
| **Best For** | Recent, curated images | Verified, searchable highlights |
| **Setup Complexity** | Simple (bucket + upload) | Medium (database + edge function) |
| **Auto-play** | Yes (5s) | Yes (5s) |
| **Metadata** | Filename parsing | Database fields |
| **Use Case** | Homepage showcase | Impact showcase with scraping |

---

## Where They're Used

### Current Implementation (HomePage)
```tsx
// src/pages/HomePage.tsx
import JamDiversityCarousel from '@/components/JamDiversityCarousel'
import JamHighlightsCarousel from '@/components/JamHighlightsCarousel'

export default function HomePage() {
  return (
    <>
      {/* ... other sections ... */}
      <JamDiversityCarousel />
      {/* ... more sections ... */}
      <JamHighlightsCarousel />
      {/* ... more sections ... */}
    </>
  )
}
```

---

## Feature Comparison

### JamDiversityCarousel Features
✓ Auto-play (5 second intervals)
✓ Manual prev/next navigation
✓ Dot indicators (up to 10 visible, +N more counter)
✓ Metadata extraction from filenames
✓ Refresh button to reload from storage
✓ Loading spinner state
✓ Empty state with upload instructions
✓ Gradient overlay with location/date info
✓ Responsive 16:9 aspect ratio
✓ Lazy loading optimization

### JamHighlightsCarousel Features
✓ Auto-play (5 second intervals)
✓ Manual prev/next navigation
✓ Clickable thumbnail strip (20 thumbnails)
✓ Database-driven image loading
✓ "Find More" button for web scraping
✓ Loading skeleton state
✓ Empty state with scrape button
✓ Metadata badges (city, country, year)
✓ Image counter display
✓ Responsive flexible sizing

---

## Integration Examples

### Example 1: Simple Homepage Integration
```tsx
import { JamDiversityCarousel } from '@/components/carousels'

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <header>Welcome to Global Goals Jam</header>
      <JamDiversityCarousel />
      <footer>© 2025</footer>
    </div>
  )
}
```

### Example 2: Gallery Page with Both
```tsx
import { JamDiversityCarousel, JamHighlightsCarousel } from '@/components/carousels'

export default function GalleryPage() {
  return (
    <div className="space-y-12">
      <section>
        <h1>Recent Jams</h1>
        <JamDiversityCarousel />
      </section>
      
      <section>
        <h1>Impact Highlights</h1>
        <JamHighlightsCarousel />
      </section>
    </div>
  )
}
```

### Example 3: Conditional Display
```tsx
import { useState } from 'react'
import { JamDiversityCarousel } from '@/components/carousels'

export default function ExploreCarouselPage() {
  const [showGallery, setShowGallery] = useState(false)
  
  return (
    <>
      <button onClick={() => setShowGallery(!showGallery)}>
        {showGallery ? 'Hide' : 'Show'} Gallery
      </button>
      
      {showGallery && <JamDiversityCarousel />}
    </>
  )
}
```

### Example 4: Custom Wrapper Component
```tsx
// Create a wrapper for specific styling/layout
import { JamDiversityCarousel } from '@/components/carousels'

interface CustomCarouselProps {
  title?: string
  description?: string
}

export function CustomCarouselSection({ title, description }: CustomCarouselProps) {
  return (
    <section className="py-16 bg-gradient-to-r from-primary/10 to-accent/10">
      <div className="max-w-7xl mx-auto px-4">
        {title && <h2 className="text-3xl font-bold mb-2">{title}</h2>}
        {description && <p className="text-muted-foreground mb-8">{description}</p>}
        <JamDiversityCarousel />
      </div>
    </section>
  )
}

// Usage:
export default function Page() {
  return (
    <CustomCarouselSection 
      title="Discover Global Jams"
      description="See what changemakers are creating around the world"
    />
  )
}
```

---

## Setup Requirements

### For JamDiversityCarousel
1. ✅ Supabase project connected
2. ✅ 'jams' bucket created in Supabase Storage
3. ✅ Bucket set to public access
4. ✅ `.env.local` has `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
5. ✅ Images uploaded to bucket with naming format: `city-country-year.jpg`

### For JamHighlightsCarousel
1. ✅ Supabase project connected
2. ✅ `jam_highlights` table exists in database
3. ✅ Records have `is_verified = 1` status
4. ✅ Edge function `scrape-jam-images` deployed (for web scraping)
5. ✅ Blink SDK initialized with database access

---

## State Management Pattern

Both carousels use **local React state** (hooks):

```typescript
// No Redux, Context, or external state needed
const [highlights, setHighlights] = useState<JamImage[]>([])
const [currentIndex, setCurrentIndex] = useState(0)
const [isAutoPlaying, setIsAutoPlaying] = useState(true)
const [isLoading, setIsLoading] = useState(true)
```

**Why local state?**
- ✓ Self-contained components
- ✓ No prop drilling needed
- ✓ Easy to use multiple times
- ✓ Minimal external dependencies
- ✓ Fast performance

---

## Performance Metrics

### JamDiversityCarousel
- **Load Time**: ~500ms (depends on storage latency)
- **Memory**: Minimal (stores image URLs only)
- **Renders**: Only on state changes (currentIndex, highlights)
- **Network Requests**: 1 LIST request to Supabase Storage

### JamHighlightsCarousel
- **Load Time**: ~300-500ms (database query)
- **Memory**: Stores up to 50 records (limited to 20 displayed)
- **Renders**: Only on state changes
- **Network Requests**: 1 SELECT query to database + optional scraping

---

## Troubleshooting Checklist

### "Storage Configuration Error" (JamDiversityCarousel)
- [ ] Is 'jams' bucket created?
- [ ] Is bucket set to public?
- [ ] Are `.env.local` keys correct?
- [ ] Are images actually in the bucket?
- [ ] Check browser console for detailed error

### Empty carousel (JamHighlightsCarousel)
- [ ] Does jam_highlights table exist?
- [ ] Are there records with `is_verified = 1`?
- [ ] Is database connection working?
- [ ] Try clicking "Find More" to scrape

### Images not displaying
- [ ] Check network tab in DevTools
- [ ] Verify URLs are accessible
- [ ] Check CORS settings (should allow public access)
- [ ] Ensure images aren't corrupted

### Auto-play not working
- [ ] Are there images loaded?
- [ ] Did you click navigation? (pauses auto-play)
- [ ] Check browser console for errors
- [ ] Try refreshing the page

---

## Next Steps

1. **Verify Current Setup**
   - Both carousels are already in HomePage.tsx ✓
   - They load data automatically ✓

2. **Use Carousel Index**
   - Import from `@/components/carousels` for cleaner code
   - Makes future maintenance easier

3. **Create Wrapper Components**
   - Custom carousels for specific pages
   - Maintain consistent styling across app

4. **Monitor Performance**
   - Check network tab for load times
   - Monitor database query performance
   - Optimize image file sizes

---

## See Also
- `CAROUSEL_ARCHITECTURE.md` - Full technical documentation
- `src/components/JamDiversityCarousel.tsx` - Source code
- `src/components/JamHighlightsCarousel.tsx` - Source code
- `src/pages/HomePage.tsx` - Current usage example
