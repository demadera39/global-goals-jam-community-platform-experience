import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// The GGJ Host Programme lives on the learning platform. Course
// confirmation emails point here, not at the legacy in-app dashboard.
export const LEARN_URL = Deno.env.get('LEARN_URL') || 'https://learn.globalgoalsjam.org'

// Best-effort one-click SSO link into the learn platform for a known,
// payment-verified email: the learn app's /login reads the tokens from the
// URL hash and establishes its own session (same mechanism as learn-sso and
// the admin invite links). Magic links are single-use and short-lived — an
// expired or already-used one simply lands the recipient on the learn login
// page, so this degrades safely to a normal sign-in. Falls back to the plain
// learn URL if the admin API is unavailable.
export async function learnMagicLinkForEmail(email: string): Promise<string> {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: { redirectTo: `${LEARN_URL}/login` },
    })
    if (error || !data?.properties?.action_link) return LEARN_URL
    return data.properties.action_link
  } catch {
    return LEARN_URL
  }
}
