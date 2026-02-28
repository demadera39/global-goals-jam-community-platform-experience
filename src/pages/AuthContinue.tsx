import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import blink, { getFullUser } from '@/lib/blink'

export default function AuthContinue() {
  const navigate = useNavigate()
  const location = useLocation()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const run = async () => {
      try {
        const params = new URLSearchParams(location.search)
        const next = params.get('next') || ''
        const target = next === 'course_checkout' ? '/course/enroll' : '/profile'

        // If not authenticated, redirect to our sign-in with redirect back to target
        try {
          const me = await blink.auth.me()
          if (!me) {
            window.location.href = `/sign-in?redirect=${encodeURIComponent(target)}`
            return
          }
        } catch (_) {
          window.location.href = `/sign-in?redirect=${encodeURIComponent(target)}`
          return
        }

        // Ensure user profile exists
        await getFullUser()

        // Navigate to destination
        navigate(target, { replace: true })
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [location, navigate])

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-center text-muted-foreground">
              Checking your sign-in status...
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}