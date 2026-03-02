/**
 * User profile enrichment — fetches full user profile from auth + DB.
 * Handles auto-upgrades (host invites, admin allowlist, course completion).
 */
import { supabase, db, safeDbCall } from './supabase'
import { config } from './config'

export interface FullUser {
  id: string
  email: string
  displayName: string
  role: string
  profileImage: string | null
}

/**
 * Fetch the current authenticated user with full DB profile enrichment.
 */
export async function getFullUser(): Promise<FullUser | null> {
  try {
    // 1) Get authenticated user from Supabase Auth
    const { data: { user: authUser } } = await supabase.auth.getUser()

    // If no Supabase auth session, try stored user from custom auth
    if (!authUser) {
      const { getStoredUser } = await import('./auth')
      const storedUser = await getStoredUser()
      if (!storedUser) return null

      // Enrich stored user with DB profile
      try {
        let profiles = await safeDbCall(() => db.users.list({ where: { id: storedUser.id }, limit: 1 }))
        let profile = profiles?.[0] || null

        if (!profile) {
          await safeDbCall(() => db.users.create({
            id: storedUser.id,
            email: storedUser.email,
            displayName: storedUser.displayName || storedUser.email,
            role: storedUser.role || 'participant',
            status: 'approved',
          }))
          profiles = await safeDbCall(() => db.users.list({ where: { id: storedUser.id }, limit: 1 }))
          profile = profiles?.[0] || null
        }

        // Host invite auto-upgrade
        profile = await tryHostInviteUpgrade(storedUser.id, storedUser.email, profile)
        // Admin allowlist
        profile = await tryAdminAllowlistPromotion(storedUser.id, storedUser.email, profile)
        // Course completion upgrade
        profile = await tryCourseUpgrade(storedUser.id, profile)

        return {
          id: storedUser.id,
          email: storedUser.email,
          displayName: profile?.displayName || storedUser.displayName || storedUser.email,
          role: profile?.role || storedUser.role || 'participant',
          profileImage: profile?.profileImage || null,
        }
      } catch {
        return {
          id: storedUser.id,
          email: storedUser.email,
          displayName: storedUser.displayName || storedUser.email,
          role: storedUser.role || 'participant',
          profileImage: null,
        }
      }
    }

    // 2) User is authenticated via Supabase Auth — look up DB profile
    let profiles = await safeDbCall(() => db.users.list({ where: { id: authUser.id }, limit: 1 }))
    let profile = profiles?.[0] || null

    if (!profile) {
      await safeDbCall(() => db.users.create({
        id: authUser.id,
        email: authUser.email,
        displayName: authUser.user_metadata?.display_name || authUser.email,
        role: 'participant',
        status: 'approved',
      }))
      profiles = await safeDbCall(() => db.users.list({ where: { id: authUser.id }, limit: 1 }))
      profile = profiles?.[0] || null
    }

    // Auto-upgrades
    profile = await tryHostInviteUpgrade(authUser.id, authUser.email!, profile)
    profile = await tryAdminAllowlistPromotion(authUser.id, authUser.email!, profile)
    profile = await tryCourseUpgrade(authUser.id, profile)

    return {
      id: authUser.id,
      email: authUser.email!,
      displayName: profile?.displayName || authUser.user_metadata?.display_name || authUser.email,
      role: profile?.role || 'participant',
      profileImage: profile?.profileImage || authUser.user_metadata?.avatar_url || null,
    }
  } catch (error: any) {
    // Auth errors — try stored fallback
    if (error?.status === 401 || error?.message?.includes('JWT')) {
      try {
        const { getStoredUser } = await import('./auth')
        const stored = await getStoredUser()
        if (stored) {
          return {
            id: stored.id,
            email: stored.email,
            displayName: stored.displayName || stored.email,
            role: (stored as any).role || 'participant',
            profileImage: (stored as any).profileImage || null,
          }
        }
      } catch {}
      return null
    }
    console.error('getFullUser error:', error)
    return null
  }
}

/**
 * Check if a user has host or admin role.
 */
export async function isCertifiedHost(userId: string): Promise<boolean> {
  try {
    if (!userId) return false
    const rows = await safeDbCall(() => db.users.list({ where: { id: userId }, limit: 1 }))
    const user = rows?.[0]
    return user?.role === 'host' || user?.role === 'admin'
  } catch {
    return false
  }
}

// ---------------------------------------------------------------------------
// Auto-upgrade helpers
// ---------------------------------------------------------------------------
async function tryHostInviteUpgrade(userId: string, email: string, profile: any) {
  try {
    const invites = await safeDbCall(() =>
      db.hostInvites.list({ where: { email, status: 'approved' }, orderBy: { createdAt: 'desc' }, limit: 1 })
    )
    const invite = invites?.[0]
    if (invite && !invite.fulfilledAt) {
      const nextRole = (invite.role as string) || 'host'
      await safeDbCall(() => db.users.update(userId, { role: nextRole, status: 'approved' }))
      await safeDbCall(() => db.hostInvites.update(invite.id, { fulfilledAt: new Date().toISOString(), fulfilledBy: userId }))
      const refreshed = await safeDbCall(() => db.users.list({ where: { id: userId }, limit: 1 }))
      return refreshed?.[0] ?? profile
    }
  } catch {}
  return profile
}

async function tryAdminAllowlistPromotion(userId: string, email: string, profile: any) {
  try {
    const emailLc = (email || '').toLowerCase()
    const allow = Array.isArray(config.admins?.emails)
      ? config.admins.emails.map((e: string) => e.toLowerCase())
      : []
    if (emailLc && allow.includes(emailLc) && profile?.role !== 'admin') {
      await safeDbCall(() => db.users.update(userId, { role: 'admin', status: 'approved' }))
      const refreshed = await safeDbCall(() => db.users.list({ where: { id: userId }, limit: 1 }))
      return refreshed?.[0] ?? profile
    }
  } catch {}
  return profile
}

async function tryCourseUpgrade(userId: string, profile: any) {
  try {
    const { checkAndUpgradeUser } = await import('./userStatus')
    await checkAndUpgradeUser(userId)
    const refreshed = await safeDbCall(() => db.users.list({ where: { id: userId }, limit: 1 }))
    return refreshed?.[0] ?? profile
  } catch {}
  return profile
}
