// Admin-only diagnostic: returns the auth.users + public.users pair for an
// email, plus a "matches" flag. Used to find users whose Supabase Auth uid
// doesn't match their public.users.id — that mismatch silently breaks role
// resolution (getUserProfile looks up by id, gets nothing, falls back to
// participant default).
//
// POST { email: "user@example.com" }
// -> { authUser, publicUser, matches, recommendation }
//
// Requires an admin JWT (verify_jwt = true).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Verify caller is an admin
    const authHeader = req.headers.get('authorization') || ''
    const token = authHeader.replace(/^Bearer\s+/i, '')
    const { data: { user: caller } } = await supabase.auth.getUser(token)
    if (!caller) {
      return new Response(JSON.stringify({ error: 'Invalid session' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    const { data: callerProfile } = await supabase.from('users').select('role').eq('id', caller.id).maybeSingle()
    if (callerProfile?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Admin only' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = await req.json().catch(() => ({}))
    const email = (body?.email as string | undefined)?.trim().toLowerCase()
    if (!email) {
      return new Response(JSON.stringify({ error: 'email required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Public users row (case-insensitive)
    const { data: publicRows } = await supabase
      .from('users')
      .select('id, email, display_name, role, status, created_at, updated_at, password_hash')
      .ilike('email', email)
    const publicUsers = publicRows || []

    // auth.users — paginate to find by email
    let authUser: any = null
    let page = 1
    while (page < 20) {
      const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 })
      if (error || !data) break
      const found = data.users.find((u: any) => (u.email || '').toLowerCase() === email)
      if (found) {
        authUser = {
          id: found.id,
          email: found.email,
          email_confirmed_at: found.email_confirmed_at,
          last_sign_in_at: found.last_sign_in_at,
          created_at: found.created_at,
          has_encrypted_password: !!(found as any).encrypted_password,
        }
        break
      }
      if (!data.users.length || data.users.length < 200) break
      page += 1
    }

    const matchingPublic = publicUsers.find((u: any) => u.id === authUser?.id)
    const matches = !!matchingPublic
    let recommendation = ''
    if (!authUser) {
      recommendation = 'No auth.users row — user cannot sign in. Create the Supabase Auth account, or use set-user-password to provision.'
    } else if (publicUsers.length === 0) {
      recommendation = 'auth.users exists but no public.users row — first sign-in will auto-create as participant. To make them a host, INSERT a public.users row with id=auth.users.id and role=host.'
    } else if (!matches) {
      recommendation = `auth.users.id (${authUser.id}) does not match any public.users row for this email (${publicUsers.map((u: any) => u.id).join(', ')}). getUserProfile cannot resolve the role — user falls back to participant. Fix: update public.users.id to match auth.users.id, or insert a new matching row.`
    } else {
      recommendation = `OK — auth and public.users agree on id ${authUser.id}.`
    }

    return new Response(JSON.stringify({
      email,
      authUser,
      publicUsers,
      matches,
      recommendation,
    }, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    console.error('diag-user error:', e)
    return new Response(JSON.stringify({ error: (e as Error).message || 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
