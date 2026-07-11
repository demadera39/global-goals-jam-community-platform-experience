import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Upload, Trash2, RefreshCw, Image as ImageIcon } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { listImagesInFolder, deleteFileFromStorage } from '@/lib/storage'
import AdminShell, { adminCardClass, quietButtonClass, primaryButtonClass } from '@/components/admin/AdminShell'

interface CarouselImage {
  name: string
  url: string
  path: string
}

export default function AdminCarouselPage() {
  const [images, setImages] = useState<CarouselImage[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [bucketError, setBucketError] = useState<string | null>(null)

  const loadImages = async () => {
    setLoading(true)
    setBucketError(null)
    try {
      console.log('[AdminCarousel] Starting to load images...')
      
      // Attempt to list images directly from jams bucket
      const imageList = await listImagesInFolder('jams')
      console.log('[AdminCarousel] Loaded images:', imageList)
      setImages(imageList)
      
      // If we successfully loaded images, no error
      if (imageList && imageList.length >= 0) {
        console.log('[AdminCarousel] Bucket verification successful')
      }
    } catch (error) {
      console.error('[AdminCarousel] Error loading carousel images:', error)
      setBucketError('Failed to load images. The jams bucket may not exist or may not be accessible. See console for details.')
      toast.error('Failed to load images')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadImages()
  }, [])

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    let successCount = 0
    let errorCount = 0

    for (const file of Array.from(files)) {
      try {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} is not an image file`)
          errorCount++
          continue
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name} is too large (max 10MB)`)
          errorCount++
          continue
        }

        // Create unique filename
        const timestamp = Date.now()
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
        const fileName = `${timestamp}_${sanitizedName}`

        console.log('Uploading file:', fileName, 'to bucket: jams')

        // Upload to Supabase storage
        const { data, error } = await supabase.storage
          .from('jams')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
            contentType: file.type
          })

        if (error) {
          console.error(`Error uploading ${file.name}:`, error)
          toast.error(`Failed to upload ${file.name}: ${error.message}`)
          errorCount++
          continue
        }

        console.log('Successfully uploaded:', data)
        successCount++
      } catch (error) {
        console.error(`Error processing ${file.name}:`, error)
        toast.error(`Error processing ${file.name}`)
        errorCount++
      }
    }

    setUploading(false)

    if (successCount > 0) {
      toast.success(`Successfully uploaded ${successCount} image${successCount > 1 ? 's' : ''}`)
      await loadImages()
    }

    if (errorCount > 0) {
      toast.error(`Failed to upload ${errorCount} image${errorCount > 1 ? 's' : ''}`)
    }

    // Reset the input
    event.target.value = ''
  }

  const handleDelete = async (imagePath: string, imageName: string) => {
    if (!confirm(`Delete ${imageName}?`)) return

    try {
      const success = await deleteFileFromStorage('jams', imageName)
      
      if (success) {
        toast.success('Image deleted')
        setImages(prev => prev.filter(img => img.path !== imagePath))
      } else {
        toast.error('Failed to delete image')
      }
    } catch (error) {
      console.error('Error deleting image:', error)
      toast.error('Failed to delete image')
    }
  }

  return (
    <AdminShell
      title="Carousel"
      description="Upload and manage photos displayed in the homepage carousel."
      actions={
        <>
          <button type="button" onClick={loadImages} disabled={loading} className={quietButtonClass}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <label className={`${primaryButtonClass} cursor-pointer ${uploading ? 'pointer-events-none opacity-50' : ''}`}>
            <Upload className="w-4 h-4" />
            {uploading ? 'Uploading…' : 'Upload images'}
            <Input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileUpload}
              disabled={uploading}
            />
          </label>
        </>
      }
    >
      {bucketError && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
          <h2 className="font-display text-lg font-extrabold text-red-700">Storage configuration error</h2>
          <p className="mt-2 text-sm text-red-700">{bucketError}</p>
          <p className="mt-4 text-sm font-semibold text-[#14201a]">To fix this issue:</p>
          <ol className="mt-1 list-inside list-decimal space-y-1 text-sm text-[#4c5a52]">
            <li>Go to your Supabase project dashboard</li>
            <li>Navigate to Storage section</li>
            <li>Create a new bucket named "jams"</li>
            <li>Set it to public access</li>
            <li>Refresh this page</li>
          </ol>
        </div>
      )}

      <div className={`${adminCardClass} mb-6 p-6`}>
        <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#00713a]">Upload guidelines</p>
        <ul className="mt-4 grid gap-x-8 gap-y-2 text-sm text-[#4c5a52] sm:grid-cols-2">
          {[
            'Upload high-quality photos from Global Goals Jam events',
            'Recommended size: 1200x800px or larger',
            'Accepted formats: JPG, PNG, WebP',
            'Maximum file size: 10MB per image',
            'Images will appear in the homepage carousel automatically',
          ].map((tip) => (
            <li key={tip} className="flex items-start gap-2.5">
              <span className="mt-[7px] h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#00A651]" aria-hidden="true" />
              <span className="leading-relaxed">{tip}</span>
            </li>
          ))}
        </ul>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 rounded-2xl border border-[#dfe9e2] bg-white animate-pulse" />
          ))}
        </div>
      ) : images.length === 0 ? (
        <div className={`${adminCardClass} p-12 text-center`}>
          <ImageIcon className="mx-auto mb-4 h-10 w-10 text-[#7d8a83]" />
          <p className="mb-5 text-sm text-[#7d8a83]">No carousel images yet</p>
          <label className={`${primaryButtonClass} cursor-pointer`}>
            <Upload className="w-4 h-4" />
            Upload your first image
            <Input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>
        </div>
      ) : (
        <>
          <div className="mb-4 text-sm text-[#7d8a83]">
            <span className="font-mono tabular-nums">{images.length}</span> image{images.length !== 1 ? 's' : ''} in carousel
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {images.map((image) => (
              <div key={image.path} className={`${adminCardClass} overflow-hidden`}>
                <div className="relative h-48 bg-[#14201a]">
                  <img
                    src={image.url}
                    alt={image.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="p-4">
                  <p className="truncate font-mono text-xs text-[#4c5a52]" title={image.name}>
                    {image.name}
                  </p>
                  <div className="mt-3 flex items-center gap-2 border-t border-[#dfe9e2] pt-3">
                    <a
                      href={image.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex flex-1 items-center justify-center rounded-full border border-[#dfe9e2] bg-white px-3.5 py-1.5 text-[13px] font-semibold text-[#4c5a52] transition-colors hover:border-[#00A651]/50 hover:text-[#00713a]"
                    >
                      View full size
                    </a>
                    <button
                      type="button"
                      onClick={() => handleDelete(image.path, image.name)}
                      title="Delete image"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#dfe9e2] bg-white text-[#7d8a83] transition-colors hover:border-red-300 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </AdminShell>
  )
}
