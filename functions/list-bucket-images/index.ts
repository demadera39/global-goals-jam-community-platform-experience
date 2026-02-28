import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

serve(async (req: Request) => {
  // Enable CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  }

  try {
    const { bucketName = 'jams', folder = '' } = await req.json().catch(() => ({}))

    console.log(`[Edge] Listing files from bucket: ${bucketName}, folder: ${folder || '(root)'}`)

    const { data: files, error } = await supabase
      .storage
      .from(bucketName)
      .list(folder, {
        limit: 100,
        sortBy: { column: 'name', order: 'asc' },
      })

    if (error) {
      console.error('[Edge] Error listing files:', error)
      return new Response(JSON.stringify({ error: error.message, files: [] }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      })
    }

    // Filter for image files only
    const imageFiles = (files || []).filter((file: any) => {
      if (!file.name || file.name.includes('.emptyFolderPlaceholder')) return false
      const name = file.name.toLowerCase()
      return (
        name.endsWith('.jpg') ||
        name.endsWith('.jpeg') ||
        name.endsWith('.png') ||
        name.endsWith('.webp') ||
        name.endsWith('.gif')
      )
    })

    console.log(`[Edge] Found ${imageFiles.length} image files`)

    // Generate public URLs for all images
    const result = imageFiles.map((file: any) => {
      const filePath = folder ? `${folder}/${file.name}` : file.name
      const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath)
      
      return {
        name: file.name,
        folder: folder,
        url: data.publicUrl,
        createdAt: file.created_at,
        metadata: file.metadata,
      }
    })

    console.log(`[Edge] Generated URLs for ${result.length} images`)

    return new Response(JSON.stringify({ success: true, files: result }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    console.error('[Edge] Error:', error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
        files: [],
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  }
})
