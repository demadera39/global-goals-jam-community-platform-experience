import blink, { safeDbCall } from './blink'
import { config } from './config'

// Simple timeout helper to avoid indefinite hangs
async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return await Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))
  ])
}

// Define clear user status hierarchy
export const USER_ROLES = {
  PARTICIPANT: 'participant',
  HOST: 'host', 
  ADMIN: 'admin'
} as const

export const USER_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  SUSPENDED: 'suspended'
} as const

export const COURSE_STATUS = {
  NOT_ENROLLED: 'not_enrolled',
  PENDING: 'pending',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  EXPIRED: 'expired'
} as const

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES]
export type UserStatus = typeof USER_STATUS[keyof typeof USER_STATUS]
export type CourseStatus = typeof COURSE_STATUS[keyof typeof COURSE_STATUS]

export interface UserProfile {
  id: string
  email: string
  displayName?: string
  role: UserRole
  status: UserStatus
  courseStatus: CourseStatus
  isPaid: boolean
  hostEligible: boolean
  createdAt: string
  updatedAt: string
}

/**
 * Get comprehensive user profile with course enrollment status
 */
export async function getUserProfile(userId?: string): Promise<UserProfile | null> {
  try {
    let targetUserId = userId
    
    // If no userId provided, try to get from Blink auth; if that fails, fall back to our local JWT/user
    if (!targetUserId) {
      try {
        const authUser = await withTimeout(blink.auth.me(), 1500).catch(() => null)
        targetUserId = authUser?.id
      } catch (authError) {
        // Try to extract user ID from stored JWT
        let token = localStorage.getItem('blink-token') || sessionStorage.getItem('blink-token')
        if (!token) {
          token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token') || ''
        }
        if (token) {
          try {
            const part = token.split('.')[1] || ''
            // Decode base64url safely: replace -/_ and pad to length % 4 === 0
            const b64 = part.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((part.length + 3) % 4)
            const payload = JSON.parse(atob(b64))
            targetUserId = payload.userId || payload.sub || payload.id
          } catch (tokenError) {
            console.warn('Failed to parse custom JWT token:', tokenError)
          }
        }
      }
    }

    // If we still don't have a userId, try our stored user and return a minimal approved profile so basic pages (e.g., profile) work
    if (!targetUserId) {
      return null
    }

    // Proceed with DB calls; custom auth does not rely on Blink auth state
    
    // Get user record
    const users = await safeDbCall(() => blink.db.users.list({
      where: { id: targetUserId },
      limit: 1
    }))
    
    let user = users?.[0]
    
    // If DB lookup fails to find a user, fall back to stored user (minimal profile)
    if (!user) {
      return null
    }

    // Admin allowlist: auto-promote when email matches
    try {
      const emailLc = String(user.email || '').toLowerCase()
      const allow = Array.isArray(config.admins?.emails) ? config.admins.emails.map((e: string) => e.toLowerCase()) : []
      if (emailLc && allow.includes(emailLc) && user.role !== 'admin') {
        await safeDbCall(() => (blink.db as any).users.update(user.id, { role: 'admin', status: 'approved', updatedAt: new Date().toISOString() }))
        const refreshed = await safeDbCall(() => (blink.db as any).users.list({ where: { id: user.id }, limit: 1 }))
        user = refreshed?.[0] ?? user
      }
    } catch (e) {
      console.warn('getUserProfile: allowlist promotion failed', e)
    }
    
    // Get latest course enrollment
    const enrollments = await safeDbCall(() => blink.db.courseEnrollments.list({
      where: { userId: targetUserId },
      orderBy: { enrolledAt: 'desc' },
      limit: 1
    }))
    
    const enrollment = enrollments?.[0]
    
    // Determine course status and payment status
    let courseStatus: CourseStatus = COURSE_STATUS.NOT_ENROLLED
    let isPaid = false
    
    if (enrollment) {
      courseStatus = enrollment.status === 'completed' ? COURSE_STATUS.COMPLETED :
                    enrollment.status === 'active' ? COURSE_STATUS.ACTIVE :
                    enrollment.status === 'pending' ? COURSE_STATUS.PENDING :
                    COURSE_STATUS.NOT_ENROLLED
      
      // Treat ACTIVE/COMPLETED enrollment as paid even if amountPaid is missing
      isPaid = !!(
        (enrollment.amountPaid && parseFloat(enrollment.amountPaid) > 0) ||
        enrollment.status === 'active' ||
        enrollment.status === 'completed'
      )
    }
    
    // ROLE-ONLY host eligibility
    const hostEligible = user.role === 'host' || user.role === 'admin'
    
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role as UserRole,
      status: user.status as UserStatus,
      courseStatus,
      isPaid,
      hostEligible,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }
  } catch (error: any) {
    const isNetwork = error?.name === 'BlinkNetworkError' || error?.status === 0 || error?.code === 'NETWORK_ERROR'

    if (isNetwork) {
      console.warn('Network unavailable while getting user profile. Returning null.')
    } else {
      console.error('Error getting user profile:', error)
    }
    return null
  }
}

/**
 * Update user role based on course completion or admin action
 */
export async function updateUserRole(userId: string, newRole: UserRole, updatedBy?: string): Promise<boolean> {
  try {
    console.log(`Attempting to update user ${userId} role to ${newRole}`)
    
    // First, check if user exists
    const existingUsers = await safeDbCall(() => blink.db.users.list({
      where: { id: userId },
      limit: 1
    }))
    
    if (!existingUsers || existingUsers.length === 0) {
      console.error(`User ${userId} not found`)
      return false
    }
    
    console.log(`User ${userId} found, current role: ${existingUsers[0].role}`)
    
    // Update the user
    const result = await safeDbCall(() => blink.db.users.update(userId, {
      role: newRole,
      status: USER_STATUS.APPROVED,
      updatedAt: new Date().toISOString()
    }))
    
    console.log(`Update result:`, result)
    
    // Log role change
    console.log(`User ${userId} role updated to ${newRole} by ${updatedBy || 'system'}`)
    return true
  } catch (error) {
    console.error('Error updating user role:', error)
    return false
  }
}

/**
 * Check if user can access specific features
 */
export function canAccessFeature(profile: UserProfile | null, feature: string): boolean {
  if (!profile) return false
  
  switch (feature) {
    case 'forum':
    case 'profile':
      // Basic features - available to all approved users
      return profile.status === USER_STATUS.APPROVED
    
    case 'host_dashboard':
      // ROLE-ONLY gating: host or admin immediately get access
      return profile.role === USER_ROLES.HOST || profile.role === USER_ROLES.ADMIN
    case 'create_events':
    case 'manage_events':
      // ROLE-ONLY gating: host or admin can create/manage regardless of status
      return (profile.role === USER_ROLES.HOST || profile.role === USER_ROLES.ADMIN)
    
    case 'admin_dashboard':
    case 'approve_hosts':
    case 'manage_users':
      // Admin features - admin only
      return profile.role === USER_ROLES.ADMIN && profile.status === USER_STATUS.APPROVED
    
    case 'course_content':
      // Course access - allow admins, or any user with an active/completed enrollment
      if (profile.role === USER_ROLES.ADMIN) return true
      return (profile.courseStatus === COURSE_STATUS.ACTIVE || profile.courseStatus === COURSE_STATUS.COMPLETED)
    
    default:
      return false
  }
}

/**
 * Get user status summary for display
 */
export function getUserStatusSummary(profile: UserProfile | null): {
  status: string
  message: string
  nextSteps: string[]
  variant: 'default' | 'secondary' | 'destructive'
} {
  if (!profile) {
    return {
      status: 'Not logged in',
      message: 'Please sign in to access features',
      nextSteps: ['Sign in with email'],
      variant: 'secondary'
    }
  }
  
  // Admin users
  if (profile.role === USER_ROLES.ADMIN) {
    return {
      status: 'Administrator',
      message: 'Full platform access',
      nextSteps: [],
      variant: 'default'
    }
  }
  
  // Host users
  if (profile.role === USER_ROLES.HOST && profile.hostEligible) {
    return {
      status: 'Certified Host',
      message: 'Can create and manage events',
      nextSteps: profile.courseStatus !== COURSE_STATUS.COMPLETED ? ['Complete certification course'] : [],
      variant: 'default'
    }
  }
  
  // Users with completed course but not host role yet
  if (profile.courseStatus === COURSE_STATUS.COMPLETED && profile.role === USER_ROLES.PARTICIPANT) {
    return {
      status: 'Course Complete',
      message: 'Ready for host privileges',
      nextSteps: ['Apply to become a host'],
      variant: 'default'
    }
  }
  
  // Users with active course enrollment
  if (profile.courseStatus === COURSE_STATUS.ACTIVE) {
    return {
      status: 'Course In Progress',
      message: 'Continue your certification',
      nextSteps: ['Complete remaining modules'],
      variant: 'secondary'
    }
  }
  
  // Users with pending payment
  if (profile.courseStatus === COURSE_STATUS.PENDING) {
    return {
      status: 'Payment Pending',
      message: 'Waiting for payment confirmation',
      nextSteps: ['Check email for payment confirmation'],
      variant: 'secondary'
    }
  }
  
  // Regular participants
  if (profile.role === USER_ROLES.PARTICIPANT) {
    return {
      status: 'Community Member',
      message: 'Can participate in events and access forum',
      nextSteps: [
        'Join local events',
        'Participate in community forum',
        'Consider becoming a host'
      ],
      variant: 'secondary'
    }
  }
  
  // Fallback
  return {
    status: 'Pending Approval',
    message: 'Account under review',
    nextSteps: ['Wait for approval'],
    variant: 'secondary'
  }
}

/**
 * Auto-upgrade user role when course is completed or active (paid enrollment)
 */
export async function checkAndUpgradeUser(userId: string): Promise<boolean> {
  try {
    const profile = await getUserProfile(userId)
    if (!profile) return false
    
    // If user has paid enrollment (completed OR active) but is still participant, upgrade to host
    // Active status means they've paid and started the course, which qualifies them for host privileges
    if (profile.role === USER_ROLES.PARTICIPANT && 
        (profile.courseStatus === COURSE_STATUS.COMPLETED || profile.courseStatus === COURSE_STATUS.ACTIVE) &&
        profile.isPaid) {
      
      const success = await updateUserRole(userId, USER_ROLES.HOST, 'auto-upgrade')
      if (success) {
        console.log(`Auto-upgraded user ${userId} to host after course enrollment/completion`)
      }
      return success
    }
    
    return false
  } catch (error) {
    console.error('Error checking for user upgrade:', error)
    return false
  }
}

/**
 * Get all users with filtering and status information
 */
export async function getAllUsersWithStatus(filters?: {
  role?: UserRole
  status?: UserStatus
  courseStatus?: CourseStatus
  limit?: number
}): Promise<UserProfile[]> {
  try {
    const users = await safeDbCall(() => blink.db.users.list({
      orderBy: { createdAt: 'desc' },
      limit: filters?.limit || 100
    }))
    
    if (!users?.length) return []
    
    const profiles: UserProfile[] = []
    
    for (const user of users) {
      const profile = await getUserProfile(user.id)
      if (profile) {
        // Apply filters
        if (filters?.role && profile.role !== filters.role) continue
        if (filters?.status && profile.status !== filters.status) continue
        if (filters?.courseStatus && profile.courseStatus !== filters.courseStatus) continue
        
        profiles.push(profile)
      }
    }
    
    return profiles
  } catch (error) {
    console.error('Error getting users with status:', error)
    return []
  }
}