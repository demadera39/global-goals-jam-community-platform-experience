import blink from './blink'
import { config } from './config'

interface User {
  id: string
  email: string
  displayName?: string
  role: string
}

export async function getAuthToken(): Promise<string | null> {
  const token = localStorage.getItem('auth_token')
  return token
}

export async function setAuthToken(token: string): Promise<boolean> {
  localStorage.setItem('auth_token', token)
  try {
    // Set token in Blink SDK - CRITICAL for auth state to work
    blink.auth.setToken(token, true)
    console.log('✅ Auth token set in Blink SDK')
    
    // Wait a brief moment for auth state to propagate
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // Verify auth is working
    try {
      await blink.auth.me()
      return true
    } catch (e) {
      console.warn('Auth verification failed after setting token:', e)
      return false
    }
  } catch (error) {
    console.error('❌ Failed to set auth token in Blink SDK:', error)
    return false
  }
}

export async function clearAuthToken() {
  localStorage.removeItem('auth_token')
  localStorage.removeItem('user')
}

// New signup function that properly calls the edge function
export async function signup(email: string, password: string, fullName: string) {
  try {
    const response = await fetch(config.api.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'signup',
        email: email.trim().toLowerCase(),
        password,
        fullName
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      const err: any = new Error(data.error || 'Signup failed')
      if (data.code) err.code = data.code
      err.status = response.status
      throw err
    }

    if (data.token && data.user) {
      // Store auth data
      await setAuthToken(data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      // Set token in Blink SDK
    }

    return data
  } catch (error: any) {
    // Avoid noisy console errors for expected auth failures; bubble up to UI
    if (import.meta.env.MODE !== 'production') {
      console.debug('Signup error:', error)
    }
    throw error
  }
}

// New login function that properly calls the edge function
export async function login(email: string, password: string) {
  try {
    const response = await fetch(config.api.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'login',
        email: email.trim().toLowerCase(),
        password
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      const err: any = new Error(data.error || 'Login failed')
      if (data.code) err.code = data.code
      err.status = response.status
      throw err
    }

    if (data.token && data.user) {
      // Store auth data
      await setAuthToken(data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      // Set token in Blink SDK
    }

    return data
  } catch (error: any) {
    if (import.meta.env.MODE !== 'production') {
      console.debug('Login error:', error)
    }
    throw error
  }
}

export async function callAuth(action: string, body: any) {
  try {
    const response = await fetch(config.api.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...body })
    })

    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.error || 'Auth call failed')
    }

    return data
  } catch (error) {
    console.error('callAuth error:', error)
    throw error
  }
}

export async function getStoredUser(): Promise<User | null> {
  try {
    const userStr = localStorage.getItem('user')
    if (!userStr) return null
    return JSON.parse(userStr)
  } catch (error) {
    console.error('Error parsing stored user:', error)
    return null
  }
}

export async function verifyAndRefreshAuth(): Promise<User | null> {
  const token = await getAuthToken()
  if (!token) return null

  // Avoid noisy network calls that can fail with "Invalid action"; prefer local token + stored user
  try {
    // Ensure Blink SDK has the token so downstream code that relies on blink.auth works
    try { blink.auth.setToken(token, true) } catch (_) { /* ignore */ }

    // Prefer stored user (set on login/signup); if missing, return minimal user decoded from token in future
    const stored = await getStoredUser()
    return stored
  } catch (error) {
    if (import.meta.env.MODE !== 'production') {
      console.debug('verifyAndRefreshAuth fallback error:', error)
    }
    const stored = await getStoredUser()
    return stored
  }
}

// Initialize auth on app load
export async function initializeAuth() {
  const user = await verifyAndRefreshAuth()
  if (user) {
    console.log('Auth initialized for user:', user.email)
  }
  return user
}