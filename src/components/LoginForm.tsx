import { useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { LogIn, Mail, Lock } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { login, setAuthToken } from '@/lib/auth'

export default function LoginForm({ redirectUrl }: { redirectUrl?: string }) {
  const [email, setEmail] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      return params.get('email') || localStorage.getItem('ggj_last_email') || ''
    } catch {
      return ''
    }
  })
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()


  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) {
      toast({
        title: 'Missing information',
        description: 'Please enter both email and password.',
        variant: 'destructive'
      })
      return
    }

    setIsLoading(true)
    
    try {
      // Call our auth function for login
      const result = await login(email, password)

      if (result && result.success && result.token) {
        // Set the token in Blink client and wait for auth confirmation
        const authReady = await setAuthToken(result.token)
        
        if (authReady) {
          toast({
            title: "Welcome back!",
            description: "Successfully signed in."
          })
          
          // Redirect to the specified next URL or reload page
          if (redirectUrl) {
            window.location.href = redirectUrl
          } else {
            window.location.reload()
          }
        } else {
          console.warn('Auth state did not update after login')
          try { localStorage.setItem('ggj_last_email', email) } catch (e) { /* ignore */ }
          // Fallback redirect
          if (redirectUrl) {
            window.location.href = redirectUrl
          } else {
            window.location.reload()
          }
        }
      } else {
        toast({
          title: 'Sign-in failed',
          description: result?.error || 'Authentication failed.',
          variant: 'destructive'
        })
      }
      
    } catch (error: any) {
      console.error('Auth login error:', error)
      const errorMessage = error?.message || 'Invalid email or password'
      toast({
        title: 'Sign-in failed',
        description: errorMessage,
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="border bg-muted/30" aria-label="Sign in">
      <CardContent className="p-4">
        <form onSubmit={handleSignIn} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email Address
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                disabled={isLoading}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">
              Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                disabled={isLoading}
                required
              />
            </div>
          </div>

          <div className="text-right">
            <a href="/forgot-password" className="text-sm text-primary hover:underline">Forgot password?</a>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
          >
            <LogIn className="h-4 w-4 mr-2" />
            {isLoading ? 'Redirecting...' : 'Continue with Email'}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Secure authentication powered by our platform.
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
