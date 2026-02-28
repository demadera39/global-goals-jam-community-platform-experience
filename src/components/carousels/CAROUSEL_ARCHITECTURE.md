# Carousel Components Architecture

## Overview

The Global Goals Jam platform includes two fully modularized carousel components that showcase jam photos and highlights across the platform. Both are designed for reusability, independent operation, and seamless integration.

---

## Component Directory Structure

```
src/
├── components/
│   ├── JamDiversityCarousel.tsx      # Carousel #1
│   ├── JamHighlightsCarousel.tsx     # Carousel #2
│   └── carousels/
│       ├── index.ts                  # Export index (this file)
│       └── CAROUSEL_ARCHITECTURE.md  # Documentation
```

---

## Component #1: JamDiversityCarousel

### Purpose
Display jam photos uploaded to Supabase Storage bucket ('jams'). Ideal for showing recent, directly-managed images.

### Data Source
**Supabase Storage** (`jams` bucket) → Files uploaded via Admin Carousel Management

### Key Features
| Feature | Details |
|---------|---------|
| **Auto-play** | Rotates images every 5 seconds, pauses on user interaction |
| **Navigation** | Prev/Next buttons + dot indicators for direct slide access |
| **Metadata** | Extracted from filename (city, country, year, date) |
| **Refresh** | Manual refresh button to reload storage images |
| **States** | Loading state with spinner, empty state with upload instructions |
| **Responsive** | Full-width, 16:9 aspect ratio with overlay text |
| **Accessibility** | Keyboard navigation, ARIA labels, semantic HTML |

### Component Props
```typescript
// JamDiversityCarousel is self-contained with no required props
<JamDiversityCarousel />
```

### Data Flow
```
1. Component mounts
2. useEffect triggers listBucketFilesWithUrls('jams', '')
3. Supabase Storage returns file list with signed URLs
4. Filenames parsed for metadata (city, country, year)
5. Images shuffled for variety
6. State updated with highlights array
7. Carousel renders with auto-play enabled
```

### File Naming Convention
For best metadata extraction, use format:
```
city-country-year.jpg
paris-france-2024.jpg
tokyo-japan-2023.png
```

### Console Logging
Detailed logging on `[JamDiversityCarousel]` prefix:
- Loading start
- File count and sample files
- Image URLs
- Parse results
- Load success/failure

### Usage Examples

**Basic usage (HomePage):**
```tsx
import JamDiversityCarousel from '@/components/JamDiversityCarousel'

export default function HomePage() {
  return (
    <div>
      <JamDiversityCarousel />
    </div>
  )
}
```

**With import index:**
```tsx
import { JamDiversityCarousel } from '@/components/carousels'
```

---

## Component #2: JamHighlightsCarousel

### Purpose
Display verified jam highlights from database, with ability to scrape web for new images. More flexible than JamDiversity.

### Data Source
**Database** (`jam_highlights` table) + Optional web scraping via edge function

### Key Features
| Feature | Details |
|---------|---------|
| **Database-driven** | Loads verified images (is_verified = 1) from jam_highlights table |
| **Web Scraping** | "Find More" button triggers scrape-jam-images edge function |
| **Auto-play** | 5-second rotation, pauses on user interaction |
| **Thumbnails** | Clickable thumbnail strip for direct navigation |
| **Metadata** | City, country, year, description badges |
| **States** | Loading skeleton, empty state with scrape button |
| **Error Handling** | Toast notifications for load/scrape failures |

### Component Props
```typescript
// JamHighlightsCarousel is self-contained with no required props
<JamHighlightsCarousel />
```

### Data Flow
```
1. Component mounts
2. useEffect → loadHighlights()
3. blink.database.list('jam_highlights', { filter: { is_verified: '1' } })
4. Results shuffled, limited to 20
5. State updated with highlights array
6. Carousel renders with auto-play enabled

User clicks "Find More":
7. scrapeNewImages() called
8. POST to scrape-jam-images edge function
9. Function searches web + saves to jam_highlights table
10. loadHighlights() called to refresh UI
```

### Database Schema
```typescript
jam_highlights: {
  id: TEXT (PK)
  image_url: TEXT (NOT NULL)
  city: TEXT
  country: TEXT
  year: NUMBER
  description: TEXT
  source_url: TEXT
  is_verified: INTEGER (0 or 1)
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
}
```

### Usage Examples

**Basic usage:**
```tsx
import JamHighlightsCarousel from '@/components/JamHighlightsCarousel'

export default function HomePage() {
  return <JamHighlightsCarousel />
}
```

**With import index:**
```tsx
import { JamHighlightsCarousel } from '@/components/carousels'
```

---

## Common Patterns & Best Practices

### Auto-play Behavior
Both carousels implement the same pattern:
```typescript
useEffect(() => {
  if (!isAutoPlaying || highlights.length === 0) return
  
  const interval = setInterval(() => {
    setCurrentIndex((prev) => (prev + 1) % highlights.length)
  }, 5000) // 5 second interval
  
  return () => clearInterval(interval)
}, [isAutoPlaying, highlights.length])
```

### Error Handling
```typescript
try {
  // Load data
  const data = await loadData()
  setHighlights(data)
} catch (error) {
  console.error('Error loading highlights:', error)
  toast.error('Failed to load highlights')
  setHighlights([])
} finally {
  setLoading(false)
}
```

### Loading States
- **JamDiversityCarousel**: Spinner with "Global Jam Diversity" text
- **JamHighlightsCarousel**: Skeleton card with loading animation

### Empty States
- **JamDiversityCarousel**: Upload instructions with naming format
- **JamHighlightsCarousel**: Empty message with "Find More" button

---

## Reusability Guide

### Using Both Carousels Together
```tsx
import { JamDiversityCarousel, JamHighlightsCarousel } from '@/components/carousels'

export default function GalleryPage() {
  return (
    <>
      <JamDiversityCarousel />
      <JamHighlightsCarousel />
    </>
  )
}
```

### Creating Custom Carousel Wrappers
```tsx
// Example: Custom carousel with additional controls
import { JamDiversityCarousel } from '@/components/carousels'

export default function CustomCarouselPage() {
  return (
    <div>
      <h1>Featured Jams</h1>
      <JamDiversityCarousel />
      <p>Click to explore more...</p>
    </div>
  )
}
```

### Conditional Rendering
```tsx
const [showCarousels, setShowCarousels] = useState(false)

return (
  <>
    {showCarousels && <JamDiversityCarousel />}
    {showCarousels && <JamHighlightsCarousel />}
  </>
)
```

---

## State Management

Both carousels use local React state (no Redux/Context needed):

### JamDiversityCarousel State
```typescript
const [highlights, setHighlights] = useState<JamImage[]>([])
const [currentIndex, setCurrentIndex] = useState(0)
const [isAutoPlaying, setIsAutoPlaying] = useState(true)
const [isLoading, setIsLoading] = useState(true)
const [isRefreshing, setIsRefreshing] = useState(false)
const [refreshKey, setRefreshKey] = useState(0)
```

### JamHighlightsCarousel State
```typescript
const [highlights, setHighlights] = useState<JamHighlight[]>([])
const [currentIndex, setCurrentIndex] = useState(0)
const [loading, setLoading] = useState(true)
const [scraping, setScraping] = useState(false)
const [autoPlay, setAutoPlay] = useState(true)
```

---

## Styling & Design System

Both carousels use:
- **Tailwind CSS** for responsive layout
- **ShadCN UI** components (Button, Card, Badge)
- **Lucide React** for icons
- **Design tokens** for colors (primary, secondary, accent, muted)

Key classes:
```css
/* JamDiversityCarousel */
.aspect-[16/9]           /* Maintain 16:9 aspect ratio */
.bg-secondary/30         /* Background section */
.shadow-2xl              /* Card shadow */
.bg-gradient-to-t        /* Gradient overlay */

/* JamHighlightsCarousel */
.h-[500px]              /* Fixed height carousel */
.bg-gradient-to-br      /* Background gradient */
```

---

## Performance Considerations

### Image Loading
- **Lazy loading**: Images only load when needed
- **Current image eager**: Current slide uses eager loading
- **Cache busting**: Supabase URLs include signed tokens
- **CORS**: Images configured with crossOrigin="anonymous"

### State Updates
- **Conditional updates**: Check `mounted` flag before state updates
- **Cleanup functions**: Intervals cleared on unmount
- **Dependency arrays**: Optimized to prevent unnecessary re-renders

### Network Requests
- **Minimal requests**: Load once on mount, refresh only on user action
- **Error recovery**: Graceful fallbacks on network errors
- **User feedback**: Toast notifications for all async operations

---

## Extending the Carousels

### Creating a New Carousel Variant
```tsx
// Example: Create a minimal carousel wrapper
import { useState, useEffect } from 'react'
import { JamDiversityCarousel } from '@/components/carousels'

export default function MinimalCarousel() {
  const [autoPlay, setAutoPlay] = useState(true)
  
  return (
    <div onMouseEnter={() => setAutoPlay(false)} onMouseLeave={() => setAutoPlay(true)}>
      <JamDiversityCarousel />
    </div>
  )
}
```

### Adding Custom Controls
```tsx
// Example: Add playback controls
import { Button } from '@/components/ui/button'
import { JamHighlightsCarousel } from '@/components/carousels'

export default function ControlledCarousel() {
  return (
    <div>
      <div className="flex gap-2 mb-4">
        <Button onClick={() => /* prev */}>Previous</Button>
        <Button onClick={() => /* play */}>Play</Button>
        <Button onClick={() => /* next */}>Next</Button>
      </div>
      <JamHighlightsCarousel />
    </div>
  )
}
```

---

## Troubleshooting

### JamDiversityCarousel shows "Storage Configuration Error"
1. Check Supabase project settings
2. Verify 'jams' bucket exists and is public
3. Check `.env.local` has correct Supabase keys
4. Ensure images are uploaded to the bucket
5. Check browser console for detailed error logs

### JamHighlightsCarousel shows empty state
1. Check jam_highlights table exists and has data
2. Verify records have `is_verified = 1`
3. Try clicking "Find More" to scrape new images
4. Check database connection and permissions

### Images not loading
1. Verify URLs are accessible and not expired
2. Check browser network tab for CORS errors
3. Ensure images are in correct format (jpg, png, webp)
4. Check image file sizes (very large files may timeout)

### Carousel not auto-playing
1. Check `isAutoPlaying` or `autoPlay` state
2. Verify carousel has images loaded
3. Check browser console for JavaScript errors
4. Ensure no event handlers are accidentally pausing

---

## Integration Timeline

| Phase | Task | Components |
|-------|------|-----------|
| **Complete** | Extract JamDiversityCarousel | JamDiversityCarousel ✓ |
| **Complete** | Extract JamHighlightsCarousel | JamHighlightsCarousel ✓ |
| **Complete** | Create carousel index | index.ts ✓ |
| **Current** | Document architecture | CAROUSEL_ARCHITECTURE.md ✓ |
| **Next** | Use in HomePage | HomePage.tsx |
| **Future** | Create admin carousel manager | AdminCarouselPage.tsx |
| **Future** | Add more carousel variants | New components |

---

## Future Enhancements

1. **Carousel Manager Component**: Wrapper with preset configurations
2. **Keyboard Navigation**: Arrow keys for prev/next
3. **Swipe Support**: Mobile-friendly swipe gestures
4. **Infinite Scroll**: Carousel scrolls continuously without stopping
5. **Dynamic Aspect Ratios**: Support different image dimensions
6. **Video Support**: Embed videos in carousel
7. **Analytics**: Track carousel interactions
8. **A/B Testing**: Test different layouts/transitions

---

## Files Reference

- `src/components/JamDiversityCarousel.tsx` - Component implementation
- `src/components/JamHighlightsCarousel.tsx` - Component implementation
- `src/components/carousels/index.ts` - Export index
- `src/components/carousels/CAROUSEL_ARCHITECTURE.md` - This file
- `src/pages/HomePage.tsx` - Current usage
- `src/lib/supabase.ts` - Storage helper functions

---

## Summary

The Global Goals Jam platform now has **two fully modularized, reusable carousel components** that can be:
- ✅ Used independently or together
- ✅ Imported easily via the carousel index
- ✅ Extended with custom wrappers
- ✅ Used multiple times on the same page
- ✅ Managed with local state (no external dependencies)

Both follow the same design patterns and best practices, making them maintainable and easy to extend.
