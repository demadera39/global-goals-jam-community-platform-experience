import { supabase } from './supabase'

class SupabaseStorage {
  async upload(path: string, file: File | Blob, options?: any) {
    // Determine bucket from path if possible, or use a default 'public' bucket
    // Blink paths are usually like 'events/ID/image.jpg'
    // I'll assume 'jams' bucket for now as it seems to be used in scrape-jam-images
    const bucket = options?.bucket || 'jams'
    
    const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
      upsert: true,
      ...options
    })

    if (error) throw error

    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path)
    
    return { publicUrl, path: data.path }
  }

  async download(path: string, options?: any) {
    const bucket = options?.bucket || 'jams'
    const { data, error } = await supabase.storage.from(bucket).download(path)
    if (error) throw error
    return data
  }

  async remove(paths: string[], options?: any) {
    const bucket = options?.bucket || 'jams'
    const { data, error } = await supabase.storage.from(bucket).remove(paths)
    if (error) throw error
    return data
  }

  async list(path: string, options?: any) {
    const bucket = options?.bucket || 'jams'
    const { data, error } = await supabase.storage.from(bucket).list(path, options)
    if (error) throw error
    return data
  }
}

export const storage = new SupabaseStorage()
