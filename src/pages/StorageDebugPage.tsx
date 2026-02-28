import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { listBucketFilesWithUrls, supabase } from '@/lib/supabase'
import { RefreshCw, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

export default function StorageDebugPage() {
  const [files, setFiles] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [bucketInfo, setBucketInfo] = useState<any>(null)
  const [testResults, setTestResults] = useState<Record<string, boolean>>({})

  const loadFiles = async () => {
    setLoading(true)
    try {
      console.log('=== STORAGE DEBUG START ===')
      
      // 1. List buckets
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
      console.log('Available buckets:', buckets)
      if (bucketsError) console.error('Buckets error:', bucketsError)
      
      // 2. Check if jams bucket exists
      const jamsBucket = buckets?.find(b => b.name === 'jams')
      console.log('Jams bucket:', jamsBucket)
      setBucketInfo(jamsBucket)
      
      if (!jamsBucket) {
        toast.error('Jams bucket not found! Please create it in Supabase Storage.')
        setLoading(false)
        return
      }
      
      // 3. List all files in jams bucket
      const { data: allFiles, error: listError } = await supabase.storage.from('jams').list()
      console.log('All files in jams bucket:', allFiles)
      if (listError) console.error('List error:', listError)
      
      // 4. Get files with URLs using our helper
      const filesWithUrls = await listBucketFilesWithUrls('jams', '')
      console.log('Files with URLs:', filesWithUrls)
      setFiles(filesWithUrls)
      
      // 5. Test each image URL
      const results: Record<string, boolean> = {}
      for (const file of filesWithUrls) {
        try {
          const response = await fetch(file.url, { method: 'HEAD' })
          results[file.name] = response.ok
          console.log(`Image test - ${file.name}:`, response.ok ? 'OK' : 'FAILED', response.status)
        } catch (error) {
          results[file.name] = false
          console.error(`Image test failed - ${file.name}:`, error)
        }
      }
      setTestResults(results)
      
      console.log('=== STORAGE DEBUG END ===')
      toast.success(`Found ${filesWithUrls.length} images`)
    } catch (error) {
      console.error('Debug error:', error)
      toast.error('Failed to load storage info')
    } finally {
      setLoading(false)
    }
  }

  const createJamsBucket = async () => {
    try {
      const { data, error } = await supabase.storage.createBucket('jams', {
        public: true,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']
      })
      
      if (error) {
        console.error('Failed to create bucket:', error)
        toast.error(`Failed to create bucket: ${error.message}`)
      } else {
        console.log('Bucket created:', data)
        toast.success('Jams bucket created successfully!')
        await loadFiles()
      }
    } catch (error) {
      console.error('Create bucket error:', error)
      toast.error('Failed to create bucket')
    }
  }

  useEffect(() => {
    loadFiles()
  }, [])

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Storage Debug Console</h1>
            <p className="text-muted-foreground">
              Diagnose Supabase storage issues with the jams bucket
            </p>
          </div>
          <Button onClick={loadFiles} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Bucket Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Bucket Status</CardTitle>
          </CardHeader>
          <CardContent>
            {bucketInfo ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span>Bucket <strong>jams</strong> exists</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  <div>ID: {bucketInfo.id}</div>
                  <div>Public: {bucketInfo.public ? 'Yes ✓' : 'No ✗'}</div>
                  <div>Created: {new Date(bucketInfo.created_at).toLocaleString()}</div>
                </div>
                {!bucketInfo.public && (
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                      <div>
                        <div className="font-medium text-yellow-900">Bucket is private</div>
                        <div className="text-sm text-yellow-700 mt-1">
                          Images won't be publicly accessible. You need to make the bucket public in Supabase dashboard:
                          <ol className="list-decimal ml-5 mt-2 space-y-1">
                            <li>Go to Storage → jams bucket</li>
                            <li>Click "Configuration"</li>
                            <li>Enable "Public bucket"</li>
                          </ol>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-500" />
                  <span>Bucket <strong>jams</strong> not found</span>
                </div>
                <Button onClick={createJamsBucket} className="bg-primary-solid text-white">
                  Create Jams Bucket
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Files List */}
        <Card>
          <CardHeader>
            <CardTitle>
              Files in Bucket ({files.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {files.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No images found in the jams bucket.</p>
                <p className="text-sm mt-2">
                  Upload images via Supabase Dashboard → Storage → jams bucket
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {files.map((file) => (
                  <div key={file.name} className="border rounded-lg p-4">
                    <div className="flex items-start gap-4">
                      {/* Image Preview */}
                      <div className="flex-shrink-0 w-32 h-32 bg-muted rounded-md overflow-hidden">
                        <img
                          src={file.url}
                          alt={file.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="128" height="128"%3E%3Crect fill="%23ddd" width="128" height="128"/%3E%3Ctext fill="%23999" font-size="12" dy="64" dx="20"%3EERROR%3C/text%3E%3C/svg%3E'
                          }}
                        />
                      </div>

                      {/* File Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="font-medium truncate">{file.name}</div>
                            <div className="text-sm text-muted-foreground mt-1 break-all">
                              {file.url}
                            </div>
                          </div>
                          <div className="flex-shrink-0">
                            {testResults[file.name] === true ? (
                              <div className="flex items-center gap-1 text-green-600 text-sm">
                                <CheckCircle2 className="w-4 h-4" />
                                Accessible
                              </div>
                            ) : testResults[file.name] === false ? (
                              <div className="flex items-center gap-1 text-red-600 text-sm">
                                <XCircle className="w-4 h-4" />
                                Failed
                              </div>
                            ) : (
                              <div className="text-sm text-muted-foreground">
                                Testing...
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Test buttons */}
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(file.url, '_blank')}
                          >
                            Open in new tab
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              navigator.clipboard.writeText(file.url)
                              toast.success('URL copied to clipboard')
                            }}
                          >
                            Copy URL
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">Troubleshooting Steps</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2 text-blue-800">
            <p><strong>If images don't load:</strong></p>
            <ol className="list-decimal ml-5 space-y-2">
              <li>
                <strong>Check bucket is public:</strong> Go to Supabase Dashboard → Storage → jams → Configuration → Enable "Public bucket"
              </li>
              <li>
                <strong>Check RLS policies:</strong> Storage policies might be blocking access. Go to Storage → Policies and ensure there's a policy allowing public SELECT
              </li>
              <li>
                <strong>Check CORS:</strong> If you see CORS errors in console, add your domain to allowed origins in Supabase
              </li>
              <li>
                <strong>Verify upload:</strong> Make sure the file actually uploaded successfully and isn't corrupted
              </li>
              <li>
                <strong>Check file format:</strong> Only .jpg, .jpeg, .png, .webp, .gif are supported
              </li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
