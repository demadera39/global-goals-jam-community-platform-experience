import { useState, useEffect, useRef } from 'react'
import { Card, CardContent } from './ui/card'
import { Button } from './ui/button'
import { Loader2, Shield, AlertCircle } from 'lucide-react'
import blink from '../lib/blink'
import { getUserProfile, canAccessFeature, UserProfile } from '../lib/userStatus'
import { appAuth } from '../lib/simpleAuth'
import { getStoredUser } from '@/lib/auth'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredFeature?: string
  requiredRole?: 'host' | 'admin' | 'participant'
  allowedRoles?: string[]
  redirectMessage?: string
}

export default function ProtectedRoute({ 
  children, 
  requiredFeature,
  requiredRole = 'host',
  allowedRoles = ['participant', 'host', 'admin'],
  redirectMessage = 'You need appropriate permissions to access this page.'
}: ProtectedRouteProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const lastUserIdRef = useRef<string | null>(null)
  const isLoadingRef = useRef(false)

  useEffect(() => {
    const load = async (u = appAuth.get()) => {
      if (isLoadingRef.current && (u?.id === lastUserIdRef.current)) {
        return
      }
      isLoadingRef.current = true
      setLoading(true)
      let prof: UserProfile | null = null
      let finished = false

      // Safety timeout to avoid infinite loading states
      const timeout = window.setTimeout(async () => {
        if (!finished) {
          try {
            const stored = await getStoredUser()
            if (stored?.id) {
              prof = {
                id: stored.id,
                email: stored.email,
                displayName: stored.displayName,
                role: (stored.role as any) || 'participant',
                status: 'approved' as any,
                courseStatus: 'not_enrolled' as any,
                isPaid: false,
                hostEligible: stored.role === 'host' || stored.role === 'admin',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              }
            }
          } catch {}
          setProfile(prof)
          setLoading(false)
        }
      }, 4000)

      try {
        if (u?.id) {
          prof = await getUserProfile(u.id)
        } else {
          prof = await getUserProfile()
        }
      } catch (e) {
        prof = null
      } finally {
        finished = true
        window.clearTimeout(timeout)
        lastUserIdRef.current = (u as any)?.id || null
        isLoadingRef.current = false
      }

      setProfile(prof)
      setLoading(false)
    }

    const unsubscribe = appAuth.onChange((u) => {
      if (u?.id !== lastUserIdRef.current) {
        load(u).catch(console.error)
      }
    })

    load().catch(console.error)

    return unsubscribe
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="text-center py-12">
            <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
            <p className="text-muted-foreground mb-4">
              Please sign in to access this page.
            </p>
            <Button 
              onClick={() => {
                const redirectUrl = window.location.href
                window.location.href = `/sign-in?redirect=${encodeURIComponent(redirectUrl)}`
              }}
              className="bg-primary-solid text-white hover:bg-primary/90"
            >
              Continue to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Check feature-based access if specified (role-only gating)
  if (requiredFeature && !canAccessFeature(profile, requiredFeature)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
            <p className="text-muted-foreground mb-4">
              {redirectMessage}
            </p>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Current role: <span className="font-medium">{profile.role}</span>
              </p>
            </div>
            <div className="mt-6 space-y-2">
              <Button 
                onClick={() => window.history.back()}
                variant="outline"
                className="w-full"
              >
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Fallback to role-based access
  if (!allowedRoles.includes(profile.role)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">
              {redirectMessage}
            </p>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Current role: <span className="font-medium">{profile.role}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Required role: <span className="font-medium">{allowedRoles.join(' or ')}</span>
              </p>
            </div>
            <div className="mt-6 space-y-2">
              <Button 
                onClick={() => window.history.back()}
                variant="outline"
                className="w-full"
              >
                Go Back
              </Button>
              <Button 
                onClick={() => { try { localStorage.removeItem('auth_token'); localStorage.removeItem('user') } catch {}; appAuth.clear(); window.location.href = '/sign-in' }}
                variant="ghost"
                className="w-full"
              >
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}