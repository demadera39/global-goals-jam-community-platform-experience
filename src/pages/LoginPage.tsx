import { useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { login } from '@/lib/auth'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation() as any
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const next = location.state?.next || '/profile'

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Client-side validation
    if (!formData.email) {
      setError('Please enter your email address')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address')
      return
    }

    if (!formData.password) {
      setError('Please enter your password')
      return
    }

    setIsLoading(true)

    try {
      const result = await login(formData.email, formData.password)

      if (result.success && result.token) {
        toast({
          title: "Welcome back!",
          description: "You have successfully signed in."
        })

        // Small delay to ensure state is updated
        setTimeout(() => {
          navigate(next, { replace: true })
        }, 100)
      } else {
        setError(result.error || 'Login failed. Please try again.')
      }

    } catch (error: any) {
      console.error('Login error:', error)
      
      if (error?.message) {
        setError(error.message)
      } else {
        setError('Network error. Please check your connection and try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/10 flex flex-col items-center justify-center p-4">
      {/* Logo */}
      <div className="mb-8">
        <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
          <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="3" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
        </div>
      </div>

      {/* Welcome Text */}
      <h1 className="text-2xl font-semibold text-center mb-2">Welcome back</h1>
      <p className="text-muted-foreground text-center mb-8">Sign in to your Global Goals Jam account</p>

      {/* Login Card */}
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-center text-xl">Sign In</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={isLoading}
                autoComplete="email"
                className="h-11"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  disabled={isLoading}
                  autoComplete="current-password"
                  className="h-11 pr-10"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-11 w-11 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            <div className="text-right">
              <Button
                type="button"
                variant="link"
                className="text-primary p-0 h-auto text-sm"
                onClick={() => navigate('/forgot-password')}
              >
                Forgot password?
              </Button>
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-primary hover:bg-primary/90"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>

            <div className="text-center pt-2">
              <span className="text-sm text-muted-foreground">
                Don't have an account?{' '}
                <Button
                  type="button"
                  variant="link"
                  className="text-primary p-0 h-auto font-semibold text-sm"
                  onClick={() => navigate(`/signup?email=${encodeURIComponent(formData.email)}`)}
                >
                  Create account
                </Button>
              </span>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Back to Home */}
      <Button
        variant="ghost"
        onClick={() => navigate('/')}
        className="mt-8 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Home
      </Button>
    </div>
  )
}