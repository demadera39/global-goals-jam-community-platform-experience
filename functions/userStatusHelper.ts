// Helper module to check and upgrade user role after course payment/completion
// This is a simplified version that works in Deno edge functions

import { createClient } from 'npm:@blinkdotnew/sdk'

const blink = createClient({ 
  projectId: 'global-goals-jam-community-platform-7uamgc2j', 
  authRequired: false 
})

const USER_ROLES = {
  PARTICIPANT: 'participant',
  HOST: 'host',
  ADMIN: 'admin'
} as const

const COURSE_STATUS = {
  NOT_ENROLLED: 'not_enrolled',
  PENDING: 'pending',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  EXPIRED: 'expired'
} as const

/**
 * Auto-upgrade user role when course is completed or active (paid enrollment)
 */
export async function checkAndUpgradeUser(userId: string): Promise<boolean> {
  try {
    // Get user record
    const users = await blink.db.users.list({
      where: { id: userId },
      limit: 1
    })
    
    const user = users?.[0]
    if (!user) {
      console.log(`User ${userId} not found`)
      return false
    }
    
    // Already host or admin - no upgrade needed
    if (user.role === 'host' || user.role === 'admin') {
      return false
    }
    
    // Get latest course enrollment
    const enrollments = await blink.db.courseEnrollments.list({
      where: { userId },
      orderBy: { enrolledAt: 'desc' },
      limit: 1
    })
    
    const enrollment = enrollments?.[0]
    if (!enrollment) {
      return false
    }
    
    // Determine course status and payment status
    const courseStatus = enrollment.status === 'completed' ? COURSE_STATUS.COMPLETED :
                        enrollment.status === 'active' ? COURSE_STATUS.ACTIVE :
                        enrollment.status === 'pending' ? COURSE_STATUS.PENDING :
                        COURSE_STATUS.NOT_ENROLLED
    
    // Treat ACTIVE/COMPLETED enrollment as paid even if amountPaid is missing
    const isPaid = !!(
      (enrollment.amountPaid && parseFloat(enrollment.amountPaid) > 0) ||
      enrollment.status === 'active' ||
      enrollment.status === 'completed'
    )
    
    // If user has paid enrollment (completed OR active) but is still participant, upgrade to host
    if (user.role === USER_ROLES.PARTICIPANT && 
        (courseStatus === COURSE_STATUS.COMPLETED || courseStatus === COURSE_STATUS.ACTIVE) &&
        isPaid) {
      
      console.log(`Upgrading user ${userId} to host (courseStatus: ${courseStatus}, isPaid: ${isPaid})`)
      
      // Update the user role
      await blink.db.users.update(userId, {
        role: USER_ROLES.HOST,
        status: 'approved',
        updatedAt: new Date().toISOString()
      })
      
      console.log(`Auto-upgraded user ${userId} to host after course enrollment/completion`)
      return true
    }
    
    return false
  } catch (error) {
    console.error('Error checking for user upgrade:', error)
    return false
  }
}
