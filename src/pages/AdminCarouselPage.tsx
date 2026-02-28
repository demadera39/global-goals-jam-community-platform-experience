import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Upload, Trash2, RefreshCw, Image as ImageIcon } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { listImagesInFolder, deleteFileFromStorage } from '@/lib/storage'

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
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Manage Carousel Images</h1>
            <p className="text-muted-foreground mt-1">
              Upload and manage photos displayed in the homepage carousel
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={loadImages}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button asChild disabled={uploading}>
              <label className="cursor-pointer">
                <Upload className="w-4 h-4 mr-2" />
                {uploading ? 'Uploading...' : 'Upload Images'}
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
              </label>
            </Button>
          </div>
        </div>

        {bucketError && (
          <Card className="mb-6 border-destructive">
            <CardHeader>
              <CardTitle className="text-lg text-destructive">Storage Configuration Error</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-destructive">{bucketError}</p>
              <p className="text-sm text-muted-foreground mt-4">
                To fix this issue:
              </p>
              <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1">
                <li>Go to your Supabase project dashboard</li>
                <li>Navigate to Storage section</li>
                <li>Create a new bucket named "jams"</li>
                <li>Set it to public access</li>
                <li>Refresh this page</li>
              </ol>
            </CardContent>
          </Card>
        )}

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Upload Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• Upload high-quality photos from Global Goals Jam events</p>
            <p>• Recommended size: 1200x800px or larger</p>
            <p>• Accepted formats: JPG, PNG, WebP</p>
            <p>• Maximum file size: 10MB per image</p>
            <p>• Images will appear in the homepage carousel automatically</p>
          </CardContent>
        </Card>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : images.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <ImageIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">No carousel images yet</p>
              <Button asChild>
                <label className="cursor-pointer">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Your First Image
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </label>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mb-4 text-sm text-muted-foreground">
              {images.length} image{images.length !== 1 ? 's' : ''} in carousel
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {images.map((image) => (
                <Card key={image.path} className="overflow-hidden">
                  <div className="relative h-48 bg-black">
                    <img
                      src={image.url}
                      alt={image.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <CardHeader className="pb-3">
                    <p className="text-sm font-medium truncate" title={image.name}>
                      {image.name}
                    </p>
                  </CardHeader>
                  <CardContent className="pt-0 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      asChild
                    >
                      <a href={image.url} target="_blank" rel="noopener noreferrer">
                        View Full Size
                      </a>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(image.path, image.name)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
