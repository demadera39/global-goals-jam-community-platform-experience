import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Alert, AlertDescription } from './ui/alert'
import { Mail, Lock, UserPlus, LogIn, CheckCircle, Loader2 } from 'lucide-react'
import { appAuth, emailAuth } from '../lib/simpleAuth'
import { signup as authSignup } from '../lib/auth'

import { login as authLogin } from '../lib/auth'
import { config } from '../lib/config'

interface SimpleEmailSignInProps {
  redirectUrl?: string
  onClose?: () => void
}

export function SimpleEmailSignIn({ redirectUrl = '/host', onClose }: SimpleEmailSignInProps) {
  const [mode, setMode] = useState<'signup' | 'signin'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      const urlEmail = params.get('email')
      if (urlEmail) {
        setEmail(urlEmail)
        emailAuth.setLastEmail(urlEmail)
        return
      }
      const last = emailAuth.getLastEmail()
      if (last) setEmail(last)
    } catch (e) { void 0 }
  }, [])

  const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const norm = email.trim().toLowerCase()
    if (!isValidEmail(norm)) return setError('Please enter a valid email')
    if (password.length < 8) return setError('Password must be at least 8 characters')
    if (password !== confirm) return setError('Passwords do not match')

    setLoading(true)
    try {
      const result = await authSignup(norm, password, norm.split('@')[0])
      if (!result?.success || !result?.token || !result?.user) {
        throw new Error(result?.error || 'Failed to create account')
      }

      // Persist minimal user locally for UI
      appAuth.set({ id: result.user.id, email: result.user.email, displayName: result.user.displayName, role: result.user.role })

      // After signup, always send the user to profile with a welcome flag
      try { emailAuth.setLastEmail(norm) } catch (_) {}
      window.location.href = '/course/enroll?welcome=1'
    } catch (err: any) {
      const msg = err?.message || ''
      const code = (err as any)?.code
      const status = (err as any)?.status
      const exists = /already exists|email_exists/i.test(msg) || code === 'email_exists' || status === 409
      if (exists) {
        // Gracefully guide user to sign in instead of logging an error
        setMode('signin')
        setConfirm('')
        setError('An account with this email already exists — please sign in.')
        if (import.meta.env.MODE !== 'production') {
          console.debug('Handled existing-account case during signup; switched to sign-in.')
        }
      } else {
        console.error('Signup error:', err)
        setError(msg || 'Failed to create account')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSignin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const input = email.trim()
    const norm = input.toLowerCase()
    if (!isValidEmail(norm)) return setError('Please enter a valid email')
    if (!password) return setError('Enter your password')

    setLoading(true)
    try {
      const result = await authLogin(norm, password)
      if (!result?.success || !result?.token || !result?.user) {
        throw new Error(result?.error || 'Authentication failed')
      }

      appAuth.set({ id: result.user.id, email: result.user.email, displayName: result.user.displayName, role: result.user.role })
      window.location.href = redirectUrl
    } catch (err: any) {
      const msg = err?.message || ''
      const code = (err as any)?.code
      const status = (err as any)?.status
      if (code === 'password_not_set' || code === 'password_reset_required' || (status === 409 && (/password\s*not\s*set/i.test(msg) || /reset\s*required/i.test(msg)))) {
        setError('No password set for this account. Click "Forgot password?" to create one.')
        return
      }
      if (code === 'invalid_credentials' || (status === 401 && /invalid email or password/i.test(msg))) {
        setError('Invalid email or password. You can try "Forgot password?" to reset it.')
        return
      }
      console.debug('Sign in error:', err)
      setError(msg || 'Sign in failed')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    const norm = email.trim().toLowerCase()
    if (!isValidEmail(norm)) {
      setError('Please enter your email address first')
      return
    }
    
    setLoading(true)
    setError('')
    
    try {
      // Use the auth edge function for password reset
      const response = await fetch(config.api.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'forgot-password', 
          email: norm 
        })
      })
      
      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      
      if (result.success) {
        setSent(true)
      } else {
        console.error('Password reset failed:', result)
        // Always show success for security (prevent email enumeration)
        setSent(true)
      }
    } catch (err: any) {
      console.error('Password reset error:', err)
      // Still show success to prevent email enumeration attacks
      setSent(true)
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="text-center p-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Check Your Email</h3>
          <p className="text-gray-600 mb-6">We sent a password reset link to <strong>{email}</strong>.</p>
          <div className="space-y-3">
            <Button variant="outline" className="w-full" onClick={() => setSent(false)}>Back to Sign In</Button>
            {onClose && <Button variant="ghost" className="w-full" onClick={onClose}>Close</Button>}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Mail className="w-6 h-6 text-green-600" />
        </div>
        <CardTitle className="text-2xl font-bold text-gray-900">
          {mode === 'signup' ? 'Create your account' : 'Sign in'}
        </CardTitle>
        <p className="text-gray-600">Access the Global Goals Jam platform</p>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <Button 
            variant={mode === 'signup' ? 'default' : 'outline'} 
            className="flex-1" 
            onClick={() => setMode('signup')}
          >
            <UserPlus className="w-4 h-4 mr-2" /> Sign up
          </Button>
          <Button 
            variant={mode === 'signin' ? 'default' : 'outline'} 
            className="flex-1" 
            onClick={() => setMode('signin')}
          >
            <LogIn className="w-4 h-4 mr-2" /> Sign in
          </Button>
        </div>

        {mode === 'signup' ? (
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input 
                id="email" 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm Password</Label>
              <Input 
                id="confirm" 
                type="password" 
                value={confirm} 
                onChange={(e) => setConfirm(e.target.value)} 
                required 
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || !isValidEmail(email)}
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</>
              ) : (
                <><Lock className="w-4 h-4 mr-2" /> Create account</>
              )}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleSignin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email2">Email Address</Label>
              <Input 
                id="email2" 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password2">Password</Label>
              <Input 
                id="password2" 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
            </div>

            <div className="flex items-center justify-between text-xs">
              <span />
              <button 
                type="button" 
                className="underline text-green-600" 
                onClick={handleForgotPassword}
              >
                Forgot password?
              </button>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || !isValidEmail(email)}
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Signing in...</>
              ) : (
                <><LogIn className="w-4 h-4 mr-2" /> Sign in</>
              )}
            </Button>
            
            <div className="text-xs text-gray-500 text-center">
              No account? <button 
                type="button" 
                className="underline" 
                onClick={() => setMode('signup')}
              >
                Create one
              </button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  )
}