import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2'
import * as bcrypt from 'https://deno.land/x/bcrypt@v0.4.1/mod.ts'

// Admin-only endpoint that sets a new password for a user.
//
// Two backends are supported, depending on which kind of account the target is:
//   1. Supabase Auth user (id is a UUID, exists in auth.users)
//      -> use `auth.admin.updateUserById(id, { password })` so the actual login
//         password (auth.users.encrypted_password) is changed.
//   2. Legacy custom-auth user (non-UUID id, e.g. "user_<ts>_<rnd>")
//      -> bcrypt-hash and write to public.users.password_hash. This is the
//         path the original Blink-style flow used.
//
// Previously this function only did #2, which silently failed for Supabase
// Auth users — the admin saw a green toast but the user could never sign in
// with the new password. We always try #1 first when the id is a UUID and
// fall back to #2 if the row doesn't exist in auth.users.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
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

    const body = await req.json()
    const { userId, email, password } = body || {}

    if (!password || (!userId && !email)) {
      return new Response(JSON.stringify({ error: 'Missing userId/email or password' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    if (typeof password !== 'string' || password.length < 8) {
      return new Response(JSON.stringify({ error: 'Password must be at least 8 characters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Resolve target user id (public.users) — also gives us the email if not provided.
    let targetUserId = userId as string | undefined
    let targetEmail = (email as string | undefined)?.trim().toLowerCase()
    if (!targetUserId && targetEmail) {
      const { data: row } = await supabase
        .from('users')
        .select('id, email')
        .ilike('email', targetEmail)
        .limit(1)
        .maybeSingle()
      if (!row?.id) {
        return new Response(JSON.stringify({ error: 'User not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      targetUserId = row.id as string
      targetEmail = (row.email as string) || targetEmail
    } else if (targetUserId && !targetEmail) {
      const { data: row } = await supabase.from('users').select('email').eq('id', targetUserId).maybeSingle()
      targetEmail = (row?.email as string) || undefined
    }

    if (!targetUserId) {
      return new Response(JSON.stringify({ error: 'Could not resolve target user' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // (1) Supabase Auth path — id is a UUID → update auth.users via admin API.
    let usedSupabaseAuth = false
    if (UUID_RE.test(targetUserId)) {
      const { error: adminErr } = await supabase.auth.admin.updateUserById(targetUserId, { password })
      if (!adminErr) {
        usedSupabaseAuth = true
      } else if (!/user not found|404/i.test(adminErr.message || '')) {
        // Hard failure that isn't "no such auth user" — surface it.
        console.error('admin.updateUserById error:', adminErr)
        return new Response(JSON.stringify({ error: `Auth update failed: ${adminErr.message}` }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      // else: fall through to legacy path (no auth.users row for this UUID)
    }

    // (2) Legacy path — also write a bcrypt hash to public.users.password_hash so
    //     the legacy custom-auth login path still works for accounts that use it.
    //     For Supabase Auth users this is harmless extra storage.
    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(password, salt)
    const { error: updateError } = await supabase
      .from('users')
      .update({ password_hash: passwordHash, updated_at: new Date().toISOString() })
      .eq('id', targetUserId)
    if (updateError) {
      throw updateError
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Password updated successfully',
        backend: usedSupabaseAuth ? 'supabase_auth' : 'legacy_password_hash',
        userId: targetUserId,
        email: targetEmail || null,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error setting password:', error)
    return new Response(
      JSON.stringify({ error: (error as Error).message || 'Failed to set password' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
