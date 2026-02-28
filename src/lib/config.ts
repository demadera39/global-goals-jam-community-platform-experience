/**
 * Configuration helper to manage environment variables
 * Centralizes access to environment configuration
 */

export const config = {
  // API endpoints
  api: {
    baseUrl: 'https://7uamgc2j--auth.functions.blink.new',
  },

  // Edge Functions
  functions: {
    // Confirm enrollment (Stripe success handler)
    // Use the stable Blink Functions domain for reliability across deployments
    confirmCourseEnrollmentUrl: 'https://7uamgc2j--confirm-course-enrollment.functions.blink.new',
    // Create Stripe Checkout session
    createCourseCheckoutUrl: 'https://7uamgc2j--create-course-checkout.functions.blink.new',
    // Admin-only impersonation endpoint
    impersonateUserUrl: 'https://7uamgc2j--impersonate-user.functions.blink.new',
  },
  
  // App configuration
  app: {
    projectId: import.meta.env.VITE_BLINK_PROJECT_ID || 'global-goals-jam-community-platform-7uamgc2j',
    environment: import.meta.env.MODE || 'development',
  },

  // Admin configuration
  admins: {
    // Allowlist of emails that should always have admin access
    emails: [
      'demadera@marcovanhout.com'
    ]
  },
  
  // Feature flags
  features: {
    enableEmailAuth: true, // Email authentication is always enabled
  }
}

// Validation function to check required config
export function validateConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // Basic validation on function URLs
  if (!config.functions.confirmCourseEnrollmentUrl?.startsWith('https://')) {
    errors.push('confirmCourseEnrollmentUrl is not configured')
  }
  if (!config.functions.createCourseCheckoutUrl?.startsWith('https://')) {
    errors.push('createCourseCheckoutUrl is not configured')
  }

  // Admin allowlist sanity check
  if (!Array.isArray(config.admins?.emails) || config.admins.emails.length === 0) {
    // Not fatal, but warn in console at runtime
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}