import { supabase } from '@/lib/supabase'
import { config } from '@/lib/config'

// The GGJ Host Programme lives on its own learning platform, live at
// https://learn.globalgoalsjam.org (set via VITE_LEARN_URL in production).
// Locally that's the dev server on :3100. If the env var is ever missing,
// course entry points fall back to the in-app enrol page rather than
// pointing at a dead domain.
export const LEARN_URL =
  (import.meta.env.VITE_LEARN_URL as string | undefined) ||
  (import.meta.env.DEV ? 'http://localhost:3100' : '/course/enroll')

// Navigate to the learning platform with single-sign-on. Both apps share one
// Supabase project, so when the visitor has a session here we exchange it
// (via the learn-sso edge function) for a one-time magic link that signs them
// in on the learn domain — no second login. Signed-out visitors, or any
// failure along the way, fall back to a plain navigation; the learn platform's
// own login page still works as the safety net.
export async function goToLearn(): Promise<void> {
  try {
    if (LEARN_URL.startsWith('http')) {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.access_token) {
        const resp = await fetch(config.functions.learnSsoUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ learnOrigin: new URL(LEARN_URL).origin }),
        })
        const data = await resp.json().catch(() => null)
        if (data?.url) {
          window.location.assign(data.url)
          return
        }
      }
    }
  } catch {
    // fall through to the plain link
  }
  window.location.assign(LEARN_URL)
}
