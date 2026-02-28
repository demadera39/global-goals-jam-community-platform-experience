import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('[Supabase] Missing environment variables. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.')
}

export const supabase = createClient(SUPABASE_URL || '', SUPABASE_ANON_KEY || '')

/**
 * List all files in a storage bucket
 */
export async function listBucketFiles(bucketName: string, folder = '') {
  try {
    console.log(`[Supabase] Listing files from bucket: ${bucketName}, folder: ${folder || '(root)'}`)
    
    const { data, error } = await supabase
      .storage
      .from(bucketName)
      .list(folder, {
        limit: 100,
        sortBy: { column: 'name', order: 'asc' }
      })

    if (error) {
      console.error('[Supabase] Error listing files:', error)
      return []
    }

    console.log(`[Supabase] Found ${data?.length || 0} files`)
    return data || []
  } catch (error) {
    console.error('[Supabase] Failed to list bucket files:', error)
    return []
  }
}

/**
 * Get public URL for a file in storage
 */
export function getPublicUrl(bucketName: string, filePath: string) {
  const { data } = supabase
    .storage
    .from(bucketName)
    .getPublicUrl(filePath)

  return data.publicUrl
}

/**
 * List all files with their public URLs from all folders
 */
export async function listBucketFilesWithUrls(bucketName: string, folder = '') {
  let allImageFiles: any[] = []
  
  // First, try the specified folder
  const files = await listBucketFiles(bucketName, folder)
  
  // Filter for actual files vs folders
  const imageFiles = files.filter(file => {
    // Skip if it's a folder (no extension or has .emptyFolderPlaceholder)
    if (!file.name || file.name.includes('.emptyFolderPlaceholder')) return false
    
    // Filter for image files only
    const name = file.name.toLowerCase()
    return name.endsWith('.jpg') || 
           name.endsWith('.jpeg') || 
           name.endsWith('.png') || 
           name.endsWith('.webp') ||
           name.endsWith('.gif')
  })
  
  // Map to include folder path
  const mappedFiles = imageFiles.map(file => ({
    ...file,
    folder: folder
  }))
  
  allImageFiles.push(...mappedFiles)
  
  // If in root folder and no images found, check for subfolders
  if (folder === '' && imageFiles.length === 0) {
    console.log(`[Supabase] No images in root, checking for subfolders...`)
    
    // Get list of potential folders (items without file extensions are folders)
    const folders = files.filter(item => {
      const name = item.name || ''
      return !name.includes('.') && name !== '.emptyFolderPlaceholder'
    })
    
    console.log(`[Supabase] Found ${folders.length} subfolders:`, folders.map(f => f.name))
    
    // Recursively check each subfolder
    for (const subFolder of folders) {
      const subFolderPath = subFolder.name
      const subFiles = await listBucketFiles(bucketName, subFolderPath)
      
      const subImageFiles = subFiles.filter(file => {
        if (!file.name || file.name.includes('.emptyFolderPlaceholder')) return false
        const name = file.name.toLowerCase()
        return name.endsWith('.jpg') || 
               name.endsWith('.jpeg') || 
               name.endsWith('.png') || 
               name.endsWith('.webp') ||
               name.endsWith('.gif')
      })
      
      console.log(`[Supabase] Subfolder "${subFolderPath}" has ${subImageFiles.length} images`)
      
      const mappedSubFiles = subImageFiles.map(file => ({
        ...file,
        folder: subFolderPath
      }))
      
      allImageFiles.push(...mappedSubFiles)
    }
  }
  
  console.log(`[Supabase] Total images found across all folders: ${allImageFiles.length}`)
  
  // Generate URLs for all files
  const result = allImageFiles.map(file => {
    const filePath = file.folder ? `${file.folder}/${file.name}` : file.name
    const url = getPublicUrl(bucketName, filePath)
    
    console.log(`[Supabase] File: ${filePath} -> URL: ${url}`)
    
    return {
      name: file.name,
      folder: file.folder,
      url: url,
      createdAt: file.created_at,
      metadata: file.metadata
    }
  })
  
  console.log(`[Supabase] Generated URLs for ${result.length} images`)
  if (result.length > 0) {
    console.log(`[Supabase] Sample URLs:`, result.slice(0, 3).map(r => ({ folder: r.folder, name: r.name, url: r.url })))
  }
  
  return result
}
