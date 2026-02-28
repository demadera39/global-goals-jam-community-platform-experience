/**
 * Utility for calling Supabase Edge Functions
 */

// Get the Supabase URL from environment variable
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

if (!SUPABASE_URL) {
  console.warn('VITE_SUPABASE_URL is not set. Supabase functions will not work.')
}

/**
 * Constructs the full URL for a Supabase Edge Function
 */
export function getSupabaseFunctionUrl(functionName: string): string {
  if (!SUPABASE_URL) {
    throw new Error('Supabase URL is not configured')
  }
  // Remove any trailing slash from SUPABASE_URL
  const baseUrl = SUPABASE_URL.replace(/\/$/, '')
  return `${baseUrl}/functions/v1/${functionName}`
}

/**
 * Makes a request to a Supabase Edge Function
 */
export async function callSupabaseFunction<T = any>(
  functionName: string,
  data?: any,
  options?: RequestInit
): Promise<T> {
  const url = getSupabaseFunctionUrl(functionName)
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options?.headers
  }

  // Add the anon key if available
  if (SUPABASE_ANON_KEY) {
    headers['Authorization'] = `Bearer ${SUPABASE_ANON_KEY}`
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: data ? JSON.stringify(data) : undefined,
    ...options
  })

  if (!response.ok) {
    // Try to parse error message
    let errorMessage = `Request failed with status ${response.status}`
    try {
      const errorData = await response.json()
      errorMessage = errorData.error || errorData.message || errorMessage
    } catch {
      // If response is not JSON, use status text
      errorMessage = response.statusText || errorMessage
    }
    throw new Error(errorMessage)
  }

  return response.json()
}