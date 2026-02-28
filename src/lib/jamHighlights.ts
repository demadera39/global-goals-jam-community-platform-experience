import { blink, safeDbCall } from './blink'

export interface JamHighlight {
  id: string
  imageUrl: string
  city?: string
  country?: string
  year?: number
  description?: string
  sourceUrl?: string
  isVerified: boolean
  createdAt: string
}

/**
 * Get random verified jam highlights
 */
export async function getRandomHighlights(limit: number = 20): Promise<JamHighlight[]> {
  try {
    if (!blink?.database?.list) {
      console.warn('Blink database not initialized')
      return []
    }

    const result = await safeDbCall(() =>
      blink.database.list('jam_highlights', {
        filter: { is_verified: '1' },
        limit: 100, // Get more to shuffle from
      })
    )

    if (!result || !Array.isArray(result)) {
      return []
    }

    // Shuffle and limit
    const shuffled = [...result].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, limit).map(formatHighlight)
  } catch (error) {
    console.error('Error getting highlights:', error)
    return []
  }
}

/**
 * Get all highlights (for admin review)
 */
export async function getAllHighlights(): Promise<JamHighlight[]> {
  try {
    if (!blink?.database?.list) {
      console.warn('Blink database not initialized')
      return []
    }

    const result = await safeDbCall(() =>
      blink.database.list('jam_highlights', {
        limit: 1000,
      })
    )

    if (!result || !Array.isArray(result)) {
      return []
    }

    return result.map(formatHighlight)
  } catch (error) {
    console.error('Error getting all highlights:', error)
    return []
  }
}

/**
 * Verify/approve a highlight
 */
export async function verifyHighlight(id: string): Promise<boolean> {
  try {
    if (!blink?.database?.update) {
      console.warn('Blink database not initialized')
      return false
    }

    await safeDbCall(() =>
      blink.database.update('jam_highlights', id, {
        isVerified: 1,
      })
    )
    return true
  } catch (error) {
    console.error('Error verifying highlight:', error)
    return false
  }
}

/**
 * Delete a highlight
 */
export async function deleteHighlight(id: string): Promise<boolean> {
  try {
    if (!blink?.database?.delete) {
      console.warn('Blink database not initialized')
      return false
    }

    await safeDbCall(() =>
      blink.database.delete('jam_highlights', id)
    )
    return true
  } catch (error) {
    console.error('Error deleting highlight:', error)
    return false
  }
}

/**
 * Manually add a highlight
 */
export async function addHighlight(data: {
  imageUrl: string
  city?: string
  country?: string
  year?: number
  description?: string
  sourceUrl?: string
  isVerified?: boolean
}): Promise<string | null> {
  try {
    if (!blink?.database?.create) {
      console.warn('Blink database not initialized')
      return null
    }

    const id = `jam_img_${Date.now()}_${Math.random().toString(36).substring(7)}`
    
    await safeDbCall(() =>
      blink.database.create('jam_highlights', {
        id,
        imageUrl: data.imageUrl,
        city: data.city,
        country: data.country,
        year: data.year ? String(data.year) : undefined,
        description: data.description,
        sourceUrl: data.sourceUrl,
        isVerified: data.isVerified ? 1 : 0,
      })
    )
    
    return id
  } catch (error) {
    console.error('Error adding highlight:', error)
    return null
  }
}

/**
 * Trigger automated scraping from Unsplash
 */
export async function scrapeNewHighlights(
  searchQuery?: string,
  maxResults: number = 15
): Promise<{ success: boolean; savedCount?: number; error?: string }> {
  try {
    const response = await fetch(
      'https://7uamgc2j--scrape-jam-images.functions.blink.new',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          searchQuery: searchQuery || 'community workshop collaboration',
          maxResults,
        }),
      }
    )

    const data = await response.json()
    
    if (!response.ok) {
      return {
        success: false,
        error: data.error || `Request failed with status ${response.status}`,
      }
    }
    
    return data
  } catch (error) {
    console.error('Scraping error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    }
  }
}

// Helper to format database record to interface
function formatHighlight(record: any): JamHighlight {
  return {
    id: record.id,
    imageUrl: record.imageUrl || record.image_url,
    city: record.city,
    country: record.country,
    year: record.year ? Number(record.year) : undefined,
    description: record.description,
    sourceUrl: record.sourceUrl || record.source_url,
    isVerified: record.isVerified === 1 || record.is_verified === '1',
    createdAt: record.createdAt || record.created_at,
  }
}
