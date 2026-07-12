import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Single-sign-on handoff to the learning platform (learn.globalgoalsjam.org).
//
// The main site and the learn platform share one Supabase project, so the
// caller's account already exists on both sides — only the browser session
// doesn't cross the domain boundary. This function exchanges the caller's
// current main-site session for a one-time magic action link on the learn
// domain:
//
//   1. The frontend sends the user's own access token (Authorization: Bearer).
//   2. We resolve that token to a user and generate a single-use magiclink for
//      that user's OWN email — a caller can never mint a link for someone else.
//   3. The browser follows the returned action_link: Supabase verifies the
//      one-time token and redirects to <learn>/login with session tokens in
//      the URL hash, which the learn app exchanges for its own cookie session
//      (the same mechanism its admin invite/impersonation links already use).
//
// The link is single-use and short-lived; no password is ever involved.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Only ever redirect to the learn platform (plus local dev). The origin must
// also be in the Supabase Auth redirect allowlist for the link to work.
const ALLOWED_LEARN_ORIGINS = [
  'https://learn.globalgoalsjam.org',
  'http://localhost:3100',
]

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const json = (b: unknown, status = 200) =>
    new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  try {
    const jwt = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '')
    if (!jwt) return json({ error: 'missing token' }, 401)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: userData, error: userErr } = await supabase.auth.getUser(jwt)
    const email = userData?.user?.email
    if (userErr || !email) return json({ error: 'invalid session' }, 401)

    let learnOrigin = ALLOWED_LEARN_ORIGINS[0]
    try {
      const body = await req.json()
      if (body?.learnOrigin && ALLOWED_LEARN_ORIGINS.includes(body.learnOrigin)) {
        learnOrigin = body.learnOrigin
      }
    } catch (_) {
      // no/invalid body — use the production learn origin
    }

    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: { redirectTo: `${learnOrigin}/login` },
    })

    if (error || !data?.properties?.action_link) {
      return json({ error: error?.message || 'could not create link' }, 500)
    }

    return json({ url: data.properties.action_link })
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unexpected error' }, 500)
  }
})
