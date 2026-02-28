import { supabase, getPublicUrl } from './supabase'

export interface ImageFile {
  name: string
  url: string
  path: string
}

/**
 * List all images in a specific folder/bucket
 * Treats folderPath='jams' as the bucket name, not a folder path
 */
export async function listImagesInFolder(folderPath: string): Promise<ImageFile[]> {
  try {
    console.log(`[Storage] Listing images from: ${folderPath}`)
    
    // folderPath is the bucket name (e.g., 'jams')
    // To list the root, we pass an empty string as the second parameter
    const { data, error } = await supabase.storage
      .from(folderPath)
      .list('', {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' }
      })

    if (error) {
      console.error(`[Storage] Error listing bucket "${folderPath}":`, error)
      throw new Error(`Failed to list bucket: ${error.message}`)
    }

    if (!data) {
      console.warn('[Storage] No data returned from list')
      return []
    }

    console.log(`[Storage] Found ${data.length} items in ${folderPath} bucket`)

    // Filter only image files and map to ImageFile format
    const imageFiles = data
      .filter(file => {
        const name = file.name?.toLowerCase() || ''
        // Skip folders and placeholder files
        if (!file.name || file.name.includes('.emptyFolderPlaceholder')) {
          return false
        }
        return name.endsWith('.jpg') || 
               name.endsWith('.jpeg') || 
               name.endsWith('.png') || 
               name.endsWith('.webp') || 
               name.endsWith('.gif')
      })
      .map(file => {
        const publicUrl = getPublicUrl(folderPath, file.name)
        console.log(`[Storage] Image: ${file.name} -> ${publicUrl}`)
        return {
          name: file.name,
          url: publicUrl,
          path: file.name
        }
      })

    console.log(`[Storage] Total images after filtering: ${imageFiles.length}`)
    return imageFiles
  } catch (error) {
    console.error('[Storage] Error in listImagesInFolder:', error)
    throw error
  }
}

/**
 * Delete a file from storage
 */
export async function deleteFileFromStorage(bucket: string, filePath: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath])

    if (error) {
      console.error('Error deleting file:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in deleteFileFromStorage:', error)
    return false
  }
}

/**
 * Upload a file to storage
 */
export async function uploadFileToStorage(
  bucket: string,
  filePath: string,
  file: File
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Error uploading file:', error)
      return { success: false, error: error.message }
    }

    const url = getPublicUrl(bucket, filePath)
    return { success: true, url }
  } catch (error) {
    console.error('Error in uploadFileToStorage:', error)
    return { success: false, error: String(error) }
  }
}
