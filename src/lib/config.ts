/**
 * Configuration helper — centralizes environment variables and app settings.
 * Centralizes environment variables and app settings.
 */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''

export const config = {
  // API endpoints — Supabase Edge Functions
  api: {
    baseUrl: `${supabaseUrl}/functions/v1/auth`,
  },

  // Edge Functions (checkout/AI calls go through callSupabaseFunction by name)
  functions: {
    verifyCoursePaymentUrl: `${supabaseUrl}/functions/v1/verify-course-payment`,
    impersonateUserUrl: `${supabaseUrl}/functions/v1/impersonate-user`,
    deleteUserUrl: `${supabaseUrl}/functions/v1/delete-user`,
    sendMessageUrl: `${supabaseUrl}/functions/v1/send-message`,
    scrapeJamImagesUrl: `${supabaseUrl}/functions/v1/scrape-jam-images`,
    listBucketImagesUrl: `${supabaseUrl}/functions/v1/list-bucket-images`,
    learnSsoUrl: `${supabaseUrl}/functions/v1/learn-sso`,
  },

  // App configuration
  app: {
    environment: import.meta.env.MODE || 'development',
  },

  // Admin configuration
  admins: {
    emails: [
      'demadera@marcovanhout.com',
    ],
  },

  // Feature flags
  features: {
    enableEmailAuth: true,
  },
}

// Validation function to check required config
export function validateConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!supabaseUrl) {
    errors.push('VITE_SUPABASE_URL is not configured')
  }

  if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
    errors.push('VITE_SUPABASE_ANON_KEY is not configured')
  }

  return { valid: errors.length === 0, errors }
}
