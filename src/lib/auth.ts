import { supabase } from './supabase'
import { config } from './config'

interface User {
  id: string
  email: string
  displayName?: string
  role: string
}

// ---------------------------------------------------------------------------
// Token management (Supabase handles sessions, but we keep localStorage
// compat for legacy code that checks these values)
// ---------------------------------------------------------------------------
export async function getAuthToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token || localStorage.getItem('auth_token')
}

export async function setAuthToken(token: string): Promise<boolean> {
  localStorage.setItem('auth_token', token)
  return true
}

export async function clearAuthToken() {
  localStorage.removeItem('auth_token')
  localStorage.removeItem('user')
  localStorage.removeItem('ggj_app_user')
  await supabase.auth.signOut()
}

// ---------------------------------------------------------------------------
// Signup — uses Supabase Auth
// ---------------------------------------------------------------------------
export async function signup(email: string, password: string, fullName: string) {
  const normalizedEmail = email.trim().toLowerCase()

  const { data, error } = await supabase.auth.signUp({
    email: normalizedEmail,
    password,
    options: {
      data: { display_name: fullName },
    },
  })

  if (error) {
    const err: any = new Error(error.message)
    err.status = error.status
    throw err
  }

  const user = data.user
  if (user) {
    const userData: User = {
      id: user.id,
      email: user.email!,
      displayName: fullName,
      role: 'participant',
    }
    localStorage.setItem('user', JSON.stringify(userData))

    // Create profile row in users table (camelCase columns to match DB schema)
    try {
      await supabase.from('users').upsert({
        id: user.id,
        email: normalizedEmail,
        displayName: fullName,
        role: 'participant',
        status: 'approved',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    } catch (e) {
      console.warn('Failed to create user profile row:', e)
    }

    return { success: true, token: data.session?.access_token, user: userData }
  }

  return { success: false, token: null, user: null }
}

// ---------------------------------------------------------------------------
// Login — uses Supabase Auth
// ---------------------------------------------------------------------------
export async function login(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase()

  const { data, error } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password,
  })

  if (error) {
    const err: any = new Error(error.message)
    err.status = error.status
    throw err
  }

  const user = data.user
  if (user) {
    // Fetch profile using raw query (returns snake_case columns from DB)
    let { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    // If no profile found by Supabase Auth ID, check by email.
    // This handles migrated accounts (e.g. from Firebase) whose profile has
    // a legacy ID that doesn't match the new Supabase Auth UUID.
    if (!profile) {
      const { data: legacyProfile } = await supabase
        .from('users')
        .select('*')
        .eq('email', normalizedEmail)
        .limit(1)
        .single()

      if (legacyProfile) {
        const oldId = legacyProfile.id
        console.log(`[Auth] Migrating profile from legacy ID ${oldId} to Supabase ID ${user.id}`)

        // Update the profile row to the new Supabase Auth ID
        try {
          // Create new profile with Supabase Auth ID, copying all data
          await supabase.from('users').insert({
            id: user.id,
            email: legacyProfile.email,
            display_name: legacyProfile.display_name,
            role: legacyProfile.role,
            status: legacyProfile.status,
            location: legacyProfile.location,
            bio: legacyProfile.bio,
            avatar_url: legacyProfile.avatar_url,
            password_hash: legacyProfile.password_hash,
            created_at: legacyProfile.created_at,
            updated_at: new Date().toISOString(),
          })

          // Re-link all events from old ID to new ID
          await supabase.from('events').update({ host_id: user.id }).eq('host_id', oldId)

          // Re-link event registrations
          await supabase.from('event_registrations').update({ participant_id: user.id }).eq('participant_id', oldId)

          // Re-link certificates
          await supabase.from('certificates').update({ recipient_id: user.id }).eq('recipient_id', oldId)
          await supabase.from('certificates').update({ issued_by: user.id }).eq('issued_by', oldId)

          // Re-link media
          await supabase.from('media').update({ uploaded_by: user.id }).eq('uploaded_by', oldId)

          // Delete old profile row (now superseded)
          await supabase.from('users').delete().eq('id', oldId)

          console.log(`[Auth] Migration complete: ${oldId} → ${user.id}`)
        } catch (migrationErr) {
          console.warn('[Auth] Profile migration failed, falling back:', migrationErr)
        }

        // Re-fetch the (now migrated) profile
        const { data: migratedProfile } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single()
        profile = migratedProfile || legacyProfile
      }
    }

    // If still no profile, create a fresh one
    if (!profile) {
      try {
        await supabase.from('users').upsert({
          id: user.id,
          email: normalizedEmail,
          display_name: user.user_metadata?.display_name || normalizedEmail.split('@')[0],
          role: 'participant',
          status: 'approved',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      } catch (e) {
        console.warn('Failed to create user profile row on login:', e)
      }
    }

    // Handle snake_case DB column names
    const displayName = profile?.display_name || profile?.displayName || user.user_metadata?.display_name || user.email!
    let role = profile?.role || 'participant'

    // Check admin allowlist and auto-promote
    const adminEmails = Array.isArray(config.admins?.emails)
      ? config.admins.emails.map((e: string) => e.toLowerCase())
      : []
    if (adminEmails.includes(normalizedEmail) && role !== 'admin') {
      role = 'admin'
      try {
        await supabase.from('users').update({ role: 'admin', status: 'approved', updated_at: new Date().toISOString() }).eq('id', user.id)
      } catch (e) {
        console.warn('Failed to auto-promote admin on login:', e)
      }
    }

    const userData: User = {
      id: user.id,
      email: user.email!,
      displayName: displayName,
      role,
    }
    localStorage.setItem('user', JSON.stringify(userData))

    return { success: true, token: data.session?.access_token, user: userData }
  }

  return { success: false, token: null, user: null }
}

// ---------------------------------------------------------------------------
// Generic auth call (kept for backward compat with edge functions)
// ---------------------------------------------------------------------------
export async function callAuth(action: string, body: any) {
  const baseUrl = config.api.baseUrl
  const response = await fetch(baseUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...body }),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.error || 'Auth call failed')
  return data
}

// ---------------------------------------------------------------------------
// Stored user helpers
// ---------------------------------------------------------------------------
export async function getStoredUser(): Promise<User | null> {
  // First try localStorage (which has the correct role from login)
  try {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      const stored = JSON.parse(userStr)
      if (stored?.id && stored?.email) return stored
    }
  } catch {}

  // Fallback to Supabase session
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      return {
        id: user.id,
        email: user.email!,
        displayName: user.user_metadata?.display_name || user.email!,
        role: 'participant', // best guess without DB lookup
      }
    }
  } catch {}

  return null
}

// ---------------------------------------------------------------------------
// Verify & refresh auth
// ---------------------------------------------------------------------------
export async function verifyAndRefreshAuth(): Promise<User | null> {
  // Prefer localStorage first (has correct role from login)
  const stored = await getStoredUser()
  if (stored) return stored

  // Fallback to Supabase session
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      return {
        id: session.user.id,
        email: session.user.email!,
        displayName: session.user.user_metadata?.display_name || session.user.email!,
        role: 'participant',
      }
    }
  } catch {}
  return null
}

// ---------------------------------------------------------------------------
// Initialize auth on app load
// ---------------------------------------------------------------------------
export async function initializeAuth() {
  const user = await verifyAndRefreshAuth()
  if (user) {
    console.log('Auth initialized for user:', user.email)
  }
  return user
}
