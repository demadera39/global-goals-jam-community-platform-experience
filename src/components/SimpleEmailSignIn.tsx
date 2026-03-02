import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Alert, AlertDescription } from './ui/alert'
import { Mail, Lock, UserPlus, LogIn, CheckCircle, Loader2, CreditCard, ArrowRight } from 'lucide-react'
import { appAuth, emailAuth } from '../lib/simpleAuth'
import { signup as authSignup } from '../lib/auth'

import { login as authLogin } from '../lib/auth'
import { supabase } from '../lib/supabase'

interface SimpleEmailSignInProps {
  redirectUrl?: string
  onClose?: () => void
}

export function SimpleEmailSignIn({ redirectUrl = '/host', onClose }: SimpleEmailSignInProps) {
  const isCourseEnrollment = redirectUrl.includes('/course/enroll') && redirectUrl.includes('checkout=1')
  const [mode, setMode] = useState<'signup' | 'signin'>(isCourseEnrollment ? 'signup' : 'signin')
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

      try { emailAuth.setLastEmail(norm) } catch (_) {}
      // If coming from enrollment checkout, go straight to enrollment with checkout flag
      // so Stripe opens automatically. Otherwise go to a sensible default.
      if (isCourseEnrollment) {
        window.location.href = '/course/enroll?checkout=1'
      } else {
        window.location.href = redirectUrl
      }
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
      } else if (/database error saving new user/i.test(msg) || (status === 422 && /weak|pwned|breach/i.test(msg))) {
        // Supabase returns "Database error saving new user" when the password is
        // found in a data breach database (pwned) — surface a helpful message.
        setError('This password is too common or has appeared in a data breach. Please choose a different, stronger password.')
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
      // Use Supabase built-in password reset (sends magic link email)
      const redirectTo = `${window.location.origin}/reset-password`
      const { error } = await supabase.auth.resetPasswordForEmail(norm, { redirectTo })

      if (error) {
        console.error('Password reset error:', error)
      }
      // Always show success to prevent email enumeration attacks
      setSent(true)
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
      <Card variant="elevated" className="w-full max-w-md mx-auto">
        <CardContent className="text-center p-8">
          <div className="w-16 h-16 bg-pastel-green rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-xl font-semibold font-display text-foreground mb-2">Check Your Email</h3>
          <p className="text-muted-foreground mb-6">We sent a password reset link to <strong>{email}</strong>.</p>
          <div className="space-y-3">
            <Button variant="outline" className="w-full" onClick={() => setSent(false)}>Back to Sign In</Button>
            {onClose && <Button variant="ghost" className="w-full" onClick={onClose}>Close</Button>}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card variant="elevated" className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="w-12 h-12 bg-pastel-green rounded-full flex items-center justify-center mx-auto mb-4">
          {isCourseEnrollment ? <CreditCard className="w-6 h-6 text-primary" /> : <Mail className="w-6 h-6 text-primary" />}
        </div>
        <CardTitle className="text-2xl font-bold font-display text-foreground">
          {mode === 'signup' ? 'Create your account' : 'Sign in'}
        </CardTitle>
        <p className="text-muted-foreground">
          {isCourseEnrollment
            ? 'Create an account to enroll in the certification course'
            : 'Access the Global Goals Jam platform'}
        </p>
        {isCourseEnrollment && (
          <div className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 rounded-full bg-pastel-green px-2.5 py-1 font-medium text-primary">
              1. {mode === 'signup' ? 'Create account' : 'Sign in'}
            </span>
            <ArrowRight className="w-3 h-3" />
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
              2. Secure payment
            </span>
            <ArrowRight className="w-3 h-3" />
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
              3. Start learning
            </span>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <Button
            variant={mode === 'signup' ? 'pill' : 'pill-outline'}
            className="flex-1"
            onClick={() => setMode('signup')}
          >
            <UserPlus className="w-4 h-4 mr-2" /> Sign up
          </Button>
          <Button
            variant={mode === 'signin' ? 'pill' : 'pill-outline'}
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
              className="w-full rounded-xl"
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
                className="underline text-primary hover:text-primary/80"
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
              className="w-full rounded-xl"
              disabled={loading || !isValidEmail(email)}
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Signing in...</>
              ) : (
                <><LogIn className="w-4 h-4 mr-2" /> Sign in</>
              )}
            </Button>
            
            <div className="text-xs text-muted-foreground text-center">
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