import { corsHeaders } from '../_shared/cors.ts'
import { getSupabaseClient } from '../_shared/supabase.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { searchQuery, maxResults } = await req.json()
    const query = searchQuery || 'Global Goals Jam community workshop'
    const limit = Math.min(maxResults || 20, 10)

    const apiKey = Deno.env.get('GOOGLE_CUSTOM_SEARCH_API_KEY')
    const searchEngineId = Deno.env.get('GOOGLE_SEARCH_ENGINE_ID')

    if (!apiKey || !searchEngineId) {
      return new Response(JSON.stringify({ success: false, error: 'Google Search API not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const params = new URLSearchParams({
      key: apiKey,
      cx: searchEngineId,
      q: query,
      searchType: 'image',
      num: String(limit),
      imgSize: 'large',
      safe: 'active',
    })

    const response = await fetch(`https://www.googleapis.com/customsearch/v1?${params}`)
    const data = await response.json()

    if (!response.ok) {
      return new Response(JSON.stringify({ success: false, error: data.error?.message || 'Search failed' }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const items = data.items || []
    const supabase = getSupabaseClient()
    let savedCount = 0

    const images = items.map((item: any) => {
      const yearMatch = item.title?.match(/\b(20\d{2})\b/)
      return {
        imageUrl: item.link,
        sourceUrl: item.image?.contextLink || '',
        description: item.snippet || item.title || '',
        year: yearMatch ? parseInt(yearMatch[1]) : undefined,
        metadata: {
          title: item.title,
          snippet: item.snippet,
          width: item.image?.width,
          height: item.image?.height,
          thumbnailUrl: item.image?.thumbnailLink,
          pageUrl: item.image?.contextLink,
        },
      }
    })

    // Save to database
    for (const img of images) {
      try {
        const id = `jam_img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
        await supabase.from('jamHighlights').insert({
          id,
          imageUrl: img.imageUrl,
          sourceUrl: img.sourceUrl,
          description: img.description,
          year: img.year ? String(img.year) : null,
          extractedMetadata: JSON.stringify(img.metadata),
          isVerified: false,
        })
        savedCount++
      } catch (e) {
        console.warn('Failed to save image:', e)
      }
    }

    return new Response(JSON.stringify({ success: true, images, savedCount, totalFound: items.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('scrape-jam-images error:', error)
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
