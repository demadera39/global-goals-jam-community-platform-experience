import { createClient } from '@blinkdotnew/sdk'
import { config } from './config'

export const blink = createClient({
  projectId: config.app.projectId,
  authRequired: false,
  auth: { mode: 'managed' }
})

// Proactively disable analytics to prevent noisy console errors if backend is unavailable
try {
  // Hard kill analytics at runtime to avoid HTTP 500 flush attempts
  blink.analytics.disable()
  // Double ensure toggle off
  if (typeof (blink as any).analytics?.isEnabled === 'function') {
    try { if ((blink as any).analytics.isEnabled()) (blink as any).analytics.disable() } catch {}
  }
  // Clear attribution to stop future auto-flush attempts
  try { (blink as any).analytics.clearAttribution && (blink as any).analytics.clearAttribution() } catch {}
  // No-op any logging/flush calls to prevent background network requests
  ;(blink as any).analytics.log = (..._args: any[]) => {}
  ;(blink as any).analytics.flush = async () => {}
} catch (_) {
  // ignore
}

export default blink

// Helper: sleep
function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms))
}

// Helper: perform DB calls with retry & exponential backoff on rate limits
export async function safeDbCall<T>(fn: () => Promise<T>, options?: { retries?: number; initialDelayMs?: number }): Promise<T> {
  const retries = options?.retries ?? 4
  const initialDelayMs = options?.initialDelayMs ?? 500

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn()
    } catch (err: any) {
      // If not a rate limit / network error, rethrow immediately
      const status = err?.status
      const details = err?.details
      const code = details?.code || err?.code

      const isRateLimit = status === 429 || code === 'RATE_LIMIT_EXCEEDED'

      if (!isRateLimit) {
        throw err
      }

      // If we've exhausted attempts, throw
      if (attempt === retries) {
        console.warn('safeDbCall: exhausted retries, throwing error')
        throw err
      }

      // Compute backoff: use server reset time if provided
      let backoff = initialDelayMs * Math.pow(2, attempt)

      if (details?.reset) {
        try {
          const resetTime = new Date(details.reset).getTime()
          const now = Date.now()
          const untilReset = Math.max(0, resetTime - now)
          // Wait at least until reset, or our exponential backoff, whichever is larger
          backoff = Math.max(backoff, untilReset + 200)
        } catch (e) {
          // ignore parse errors
        }
      }

      console.warn(`safeDbCall: rate limited (attempt=${attempt}). retrying in ${backoff}ms`)
      await sleep(backoff)
      // continue to next attempt
    }
  }

  // Should never reach here
  throw new Error('safeDbCall: unexpected exit')
}

// Helper: fetch full user profile (auth + DB row)
export async function getFullUser() {
  try {
    // CRITICAL: Ensure custom auth token is loaded into Blink SDK on app start
    const { getAuthToken, setAuthToken, getStoredUser } = await import('./auth')
    const customToken = await getAuthToken()
    if (customToken) {
      // Ensure Blink SDK has the token before calling .me()
      try {
        blink.auth.setToken(customToken, true)
      } catch (e) {
        console.warn('getFullUser: Failed to set custom token in SDK', e)
      }
    }

    const authUser = await blink.auth.me()
    if (!authUser) {
      // Fallback to stored user from our custom auth
      const storedUser = await getStoredUser()
      if (!storedUser) {
        console.log('getFullUser: No authenticated user found')
        return null
      }
      // Enrich stored user with latest DB profile, admin allowlist, and auto-upgrades
      try {
        // Look up DB profile by stored user id
        let profileList = await safeDbCall(() => (blink.db as any).users.list({ where: { id: storedUser.id }, limit: 1 }))
        let profile = profileList?.[0] || null

        // Create profile if missing
        if (!profile) {
          await safeDbCall(() => (blink.db as any).users.create({
            id: storedUser.id,
            email: storedUser.email,
            displayName: storedUser.displayName || storedUser.email,
            role: storedUser.role || 'participant',
            status: 'approved'
          }))
          profileList = await safeDbCall(() => (blink.db as any).users.list({ where: { id: storedUser.id }, limit: 1 }))
          profile = profileList?.[0] || null
        }

        // Host invite auto-upgrade
        try {
          const invites = await safeDbCall(() => (blink.db as any).hostInvites.list({
            where: { email: storedUser.email, status: 'approved' },
            orderBy: { createdAt: 'desc' },
            limit: 1
          }))
          const invite = invites?.[0]
          if (invite && !invite.fulfilledAt) {
            const nextRole = (invite.role as string) || 'host'
            await safeDbCall(() => (blink.db as any).users.update(storedUser.id, { role: nextRole, status: 'approved' }))
            await safeDbCall(() => (blink.db as any).hostInvites.update(invite.id, { fulfilledAt: new Date().toISOString(), fulfilledBy: storedUser.id }))
            const refreshed = await safeDbCall(() => (blink.db as any).users.list({ where: { id: storedUser.id }, limit: 1 }))
            profile = refreshed?.[0] ?? profile
          }
        } catch (_) { /* non-fatal */ }

        // Admin allowlist promotion
        try {
          const emailLc = (storedUser.email || '').toLowerCase()
          const allow = Array.isArray(config.admins?.emails) ? config.admins.emails.map((e: string) => e.toLowerCase()) : []
          if (emailLc && allow.includes(emailLc) && profile?.role !== 'admin') {
            await safeDbCall(() => (blink.db as any).users.update(storedUser.id, { role: 'admin', status: 'approved' }))
            const refreshed = await safeDbCall(() => (blink.db as any).users.list({ where: { id: storedUser.id }, limit: 1 }))
            profile = refreshed?.[0] ?? profile
          }
        } catch (_) { /* non-fatal */ }

        // Auto-upgrade via course completion
        try {
          const { checkAndUpgradeUser } = await import('./userStatus')
          await checkAndUpgradeUser(storedUser.id)
          const refreshed = await safeDbCall(() => (blink.db as any).users.list({ where: { id: storedUser.id }, limit: 1 }))
          profile = refreshed?.[0] ?? profile
        } catch (_) { /* non-fatal */ }

        return {
          id: storedUser.id,
          email: storedUser.email,
          displayName: profile?.displayName || storedUser.displayName || storedUser.email,
          role: profile?.role || storedUser.role || 'participant',
          profileImage: profile?.profileImage || null
        }
      } catch (e) {
        // If enrichment fails, return stored user as-is
        return storedUser
      }
    }

    console.log('getFullUser: Auth user found:', authUser.id, authUser.email)

    // 1) Ensure a users row exists for this auth user
    let profileList
    try {
      profileList = await safeDbCall(() => (blink.db as any).users.list({
        where: { id: authUser.id },
        limit: 1
      }))
      console.log('getFullUser: Profile lookup result:', profileList?.length || 0, 'profiles found')
    } catch (error) {
      console.error('getFullUser: Error fetching user profile:', error)
      // Return basic auth user info if DB fails
      return {
        id: authUser.id,
        email: authUser.email,
        displayName: authUser.displayName || authUser.email,
        role: 'participant',
        profileImage: authUser.avatar || null
      }
    }

    let profile = profileList && profileList.length > 0 ? profileList[0] : null

    if (!profile) {
      console.log('getFullUser: No profile found, creating new one...')
      try {
        // Create a participant profile with approved status by default
        await safeDbCall(() => (blink.db as any).users.create({
          id: authUser.id,
          email: authUser.email,
          displayName: authUser.displayName || authUser.email,
          role: 'participant',
          status: 'approved'
        }))
        
        profileList = await safeDbCall(() => (blink.db as any).users.list({
          where: { id: authUser.id },
          limit: 1
        }))
        profile = profileList && profileList.length > 0 ? profileList[0] : null
        console.log('getFullUser: New profile created successfully')
      } catch (createError) {
        console.error('getFullUser: Error creating profile:', createError)
        // Return basic auth user info if DB create fails
        return {
          id: authUser.id,
          email: authUser.email,
          displayName: authUser.displayName || authUser.email,
          role: 'participant',
          profileImage: authUser.avatar || null
        }
      }
    }

    // 2) If there's an approved host invite for this email not yet fulfilled, auto-upgrade
    try {
      const invites = await safeDbCall(() => (blink.db as any).hostInvites.list({
        where: {
          email: authUser.email,
          status: 'approved'
        },
        orderBy: { createdAt: 'desc' },
        limit: 1
      }))

      const invite = invites?.[0]
      // Fulfill if not fulfilled_at yet (fulfilledAt will be undefined in camelCase when null)
      if (invite && !invite.fulfilledAt) {
        console.log('getFullUser: Found host invite, upgrading user role...')
        const nextRole = (invite.role as string) || 'host'
        await safeDbCall(() => (blink.db as any).users.update(authUser.id, {
          role: nextRole,
          status: 'approved'
        }))
        await safeDbCall(() => (blink.db as any).hostInvites.update(invite.id, {
          fulfilledAt: new Date().toISOString(),
          fulfilledBy: authUser.id
        }))
        // Refresh profile
        const refreshed = await safeDbCall(() => (blink.db as any).users.list({ where: { id: authUser.id }, limit: 1 }))
        profile = refreshed?.[0] ?? profile
      }
    } catch (e) {
      // Non-fatal
      console.warn('getFullUser: Invite check failed', e)
    }

    // 2b) Admin allowlist: auto-promote allowlisted emails to admin
    try {
      const emailLc = (authUser.email || '').toLowerCase()
      const allow = Array.isArray(config.admins?.emails) ? config.admins.emails.map((e: string) => e.toLowerCase()) : []
      if (emailLc && allow.includes(emailLc) && profile?.role !== 'admin') {
        console.log('getFullUser: Admin allowlist match, promoting to admin')
        await safeDbCall(() => (blink.db as any).users.update(authUser.id, {
          role: 'admin',
          status: 'approved'
        }))
        const refreshed = await safeDbCall(() => (blink.db as any).users.list({ where: { id: authUser.id }, limit: 1 }))
        profile = refreshed?.[0] ?? profile
      }
    } catch (e) {
      console.warn('getFullUser: admin allowlist promotion failed', e)
    }

    // 3) Check for auto-upgrade based on course completion
    try {
      const { checkAndUpgradeUser } = await import('./userStatus')
      await checkAndUpgradeUser(authUser.id)
      
      // Refresh profile after potential upgrade
      const refreshed = await safeDbCall(() => (blink.db as any).users.list({ where: { id: authUser.id }, limit: 1 }))
      profile = refreshed?.[0] ?? profile
    } catch (e) {
      // Non-fatal
      console.warn('getFullUser: Auto-upgrade check failed', e)
    }

    const result = {
      id: authUser.id,
      email: authUser.email,
      displayName: profile?.displayName || authUser.displayName || authUser.email,
      role: profile?.role || 'participant',
      profileImage: profile?.profileImage || authUser.avatar || null
    }

    console.log('getFullUser: Returning user profile:', result)
    return result
  } catch (error: any) {
    // Silently handle unauthenticated errors to avoid noisy console logs on public pages
    if (error?.name === 'BlinkAuthError' || error?.code === 'AUTH_ERROR' || error?.status === 401) {
      console.log('getFullUser: Auth error - attempting local fallback and silent refresh')
      try {
        const { verifyAndRefreshAuth, getStoredUser } = await import('./auth')
        // Try to silently refresh the token (also sets SDK token internally)
        const refreshed = await verifyAndRefreshAuth()
        if (refreshed) {
          return {
            id: refreshed.id,
            email: refreshed.email,
            displayName: (refreshed as any).displayName || refreshed.email,
            role: (refreshed as any).role || 'participant',
            profileImage: (refreshed as any).profileImage || null
          }
        }
        // Fallback to any locally stored user (may still be valid)
        const stored = await getStoredUser()
        if (stored) {
          return {
            id: stored.id,
            email: stored.email,
            displayName: stored.displayName || stored.email,
            role: (stored as any).role || 'participant',
            profileImage: (stored as any).profileImage || null
          }
        }
      } catch (e) {
        console.warn('getFullUser: silent refresh/stored-user fallback failed', e)
      }
      return null
    }

    // For other unexpected errors, log so developers can inspect
    console.error('getFullUser error:', error)
    
    // Try to return basic auth info if available
    try {
      const authUser = await blink.auth.me()
      if (authUser) {
        return {
          id: authUser.id,
          email: authUser.email,
          displayName: authUser.displayName || authUser.email,
          role: 'participant',
          profileImage: authUser.avatar || null
        }
      }
    } catch (e) {
      // ignore
    }
    
    return null
  }
}

// Determine if a user has completed the host certification course
export async function isCertifiedHost(userId: string): Promise<boolean> {
  try {
    if (!userId) return false
    const rows = await safeDbCall(() => (blink.db as any).users.list({ where: { id: userId }, limit: 1 }))
    const user = rows?.[0]
    return user?.role === 'host' || user?.role === 'admin'
  } catch (err) {
    console.warn('isCertifiedHost failed', err)
    return false
  }
}