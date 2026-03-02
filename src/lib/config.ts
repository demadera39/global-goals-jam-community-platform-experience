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

  // Edge Functions
  functions: {
    confirmCourseEnrollmentUrl: `${supabaseUrl}/functions/v1/confirm-course-enrollment`,
    createCourseCheckoutUrl: `${supabaseUrl}/functions/v1/create-course-checkout`,
    impersonateUserUrl: `${supabaseUrl}/functions/v1/impersonate-user`,
    createDonationSessionUrl: `${supabaseUrl}/functions/v1/create-donation-session`,
    deleteUserUrl: `${supabaseUrl}/functions/v1/delete-user`,
    sendMessageUrl: `${supabaseUrl}/functions/v1/send-message`,
    stripeWebhookUrl: `${supabaseUrl}/functions/v1/stripe-webhook`,
    geminiAiUrl: `${supabaseUrl}/functions/v1/gemini-ai`,
    scrapeJamImagesUrl: `${supabaseUrl}/functions/v1/scrape-jam-images`,
    listBucketImagesUrl: `${supabaseUrl}/functions/v1/list-bucket-images`,
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
