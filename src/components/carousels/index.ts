/**
 * Carousel Components Export Index
 * 
 * This file centralizes all carousel components for easy importing across the codebase.
 * Each carousel is designed as a self-contained, reusable module with its own state management
 * and styling.
 */

export { default as JamDiversityCarousel } from '../JamDiversityCarousel'
export { default as JamHighlightsCarousel } from '../JamHighlightsCarousel'

/**
 * CAROUSEL COMPONENT DOCUMENTATION
 * 
 * 1. JamDiversityCarousel
 *    - Purpose: Display jam photos from Supabase storage bucket ('jams')
 *    - Data Source: Supabase Storage (local files uploaded via admin)
 *    - Features:
 *      • Auto-plays image rotation (5s interval)
 *      • Manual navigation with prev/next buttons
 *      • Dot indicators for direct slide navigation
 *      • Metadata extraction from filenames (city, country, year, date)
 *      • Refresh button to reload images
 *      • Loading and empty states
 *    - Usage:
 *      import { JamDiversityCarousel } from '@/components/carousels'
 *      <JamDiversityCarousel />
 *    - Props: None (self-contained)
 *    - Data Flow: Storage bucket → listBucketFilesWithUrls() → State → Render
 * 
 * 2. JamHighlightsCarousel
 *    - Purpose: Display verified jam highlights from database with web scraping
 *    - Data Source: Database (jam_highlights table) + optional web scraping
 *    - Features:
 *      • Loads verified images from database
 *      • "Find More" button triggers web scraping edge function
 *      • Auto-plays image rotation (5s interval)
 *      • Thumbnail strip for direct navigation
 *      • Metadata display (city, country, year, description)
 *      • Image counter display
 *    - Usage:
 *      import { JamHighlightsCarousel } from '@/components/carousels'
 *      <JamHighlightsCarousel />
 *    - Props: None (self-contained)
 *    - Data Flow: Database → safeDbCall() → State → Render
 *                 Web Scraping Edge Function (on user action)
 * 
 * DESIGN PATTERNS
 * 
 * - Auto-play: Automatically rotates images, pauses on user interaction
 * - Manual Controls: Prev/Next buttons and dot indicators for manual control
 * - Loading States: Skeleton or spinner shown while data loads
 * - Empty States: User-friendly messages with actionable suggestions
 * - Error Handling: Toast notifications for errors with console logging
 * - Responsive: Full-width, aspect-ratio based sizing
 * 
 * REUSABILITY GUIDELINES
 * 
 * Both carousels are fully self-contained and can be:
 * - Imported independently
 * - Used multiple times on the same page
 * - Used on different pages
 * - Extended by creating wrapper components
 * 
 * Example: Creating a custom carousel wrapper:
 * 
 *   export default function CustomCarouselPage() {
 *     return (
 *       <>
 *         <JamDiversityCarousel />
 *         <JamHighlightsCarousel />
 *       </>
 *     )
 *   }
 */
