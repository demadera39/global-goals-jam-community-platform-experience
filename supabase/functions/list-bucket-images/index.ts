import { corsHeaders } from '../_shared/cors.ts'
import { getSupabaseClient } from '../_shared/supabase.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { bucketName, folder } = await req.json()
    const bucket = bucketName || 'jams'
    const path = folder || ''

    const supabase = getSupabaseClient()

    const { data: files, error } = await supabase.storage
      .from(bucket)
      .list(path, { limit: 200, sortBy: { column: 'created_at', order: 'desc' } })

    if (error) {
      return new Response(JSON.stringify({ success: false, error: error.message, files: [] }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const imageExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif']
    const imageFiles = (files || [])
      .filter((f: any) => {
        const name = (f.name || '').toLowerCase()
        return imageExts.some(ext => name.endsWith(ext)) && !name.includes('.emptyFolderPlaceholder')
      })
      .map((f: any) => {
        const filePath = path ? `${path}/${f.name}` : f.name
        const { data } = supabase.storage.from(bucket).getPublicUrl(filePath)
        return {
          name: f.name,
          folder: path,
          url: data.publicUrl,
          createdAt: f.created_at,
          metadata: f.metadata,
        }
      })

    return new Response(JSON.stringify({ success: true, files: imageFiles }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('list-bucket-images error:', error)
    return new Response(JSON.stringify({ success: false, error: error.message, files: [] }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
