import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface JamImageResult {
  imageUrl: string
  sourceUrl: string
  city?: string
  country?: string
  year?: number
  description?: string
  metadata?: Record<string, any>
}

/**
 * Scrape Global Goals Jam images from Google Image Search
 * Uses Google Custom Search API to find relevant images
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const googleApiKey = Deno.env.get('GOOGLE_CUSTOM_SEARCH_API_KEY')
    const googleSearchEngineId = Deno.env.get('GOOGLE_SEARCH_ENGINE_ID')

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables')
    }

    if (!googleApiKey || !googleSearchEngineId) {
      throw new Error('Missing Google Custom Search credentials - please add GOOGLE_CUSTOM_SEARCH_API_KEY and GOOGLE_SEARCH_ENGINE_ID in project secrets')
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    const { searchQuery, maxResults = 20 } = await req.json()

    // Default search query for Global Goals Jam
    const query = searchQuery || 'Global Goals Jam community workshop'

    console.log('Searching Google Images for:', query)

    // Use Google Custom Search API to search for images
    // The searchType=image parameter tells Google to search specifically for images
    const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${googleApiKey}&cx=${googleSearchEngineId}&q=${encodeURIComponent(query)}&searchType=image&num=${Math.min(maxResults, 10)}&imgSize=large`
    
    const searchResponse = await fetch(searchUrl)

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text()
      throw new Error(`Google Image Search failed: ${searchResponse.statusText} - ${errorText}`)
    }

    const searchData = await searchResponse.json()
    const imageResults = searchData.items || []

    console.log(`Found ${imageResults.length} images from Google Image Search`)

    // Process each image from Google results
    const processedImages: JamImageResult[] = []

    for (const img of imageResults) {
      try {
        // Extract potential location and year from title, snippet, or context
        const fullText = `${img.title || ''} ${img.snippet || ''} ${img.image?.contextLink || ''}`
        
        // Simple regex patterns to extract city/year
        const yearMatch = fullText.match(/\b(20\d{2})\b/)
        const year = yearMatch ? parseInt(yearMatch[1]) : undefined

        processedImages.push({
          imageUrl: img.link,
          sourceUrl: img.image?.contextLink || img.link,
          description: img.snippet || img.title || 'Global Goals Jam event',
          year,
          metadata: {
            title: img.title,
            snippet: img.snippet,
            width: img.image?.width,
            height: img.image?.height,
            thumbnailUrl: img.image?.thumbnailLink,
            pageUrl: img.image?.contextLink,
          },
        })
      } catch (error) {
        console.error('Error processing image:', error)
      }
    }

    // Save to database
    const saved: string[] = []
    for (const img of processedImages) {
      const id = `jam_img_${Date.now()}_${Math.random().toString(36).substring(7)}`
      
      const { error } = await supabase.from('jam_highlights').insert({
        id,
        image_url: img.imageUrl,
        source_url: img.sourceUrl,
        city: img.city,
        country: img.country,
        year: img.year,
        description: img.description,
        extracted_metadata: JSON.stringify(img.metadata),
        is_verified: 0,
      })

      if (!error) {
        saved.push(id)
      } else {
        console.error('Database insert error:', error)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Scraped and saved ${saved.length} images`,
        savedCount: saved.length,
        totalFound: imageResults.length,
        images: processedImages,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
