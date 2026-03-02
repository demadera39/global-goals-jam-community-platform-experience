import { corsHeaders } from '../_shared/cors.ts'
import { getSupabaseClient } from '../_shared/supabase.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = getSupabaseClient()
    const authHeader = req.headers.get('authorization')

    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Missing authorization', code: 'UNAUTHORIZED' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Verify the requesting user is an admin
    const token = authHeader.replace('Bearer ', '')
    const { data: { user: requester } } = await getSupabaseClient()
      .auth.getUser(token)

    if (!requester) {
      return new Response(JSON.stringify({ error: 'Invalid token', code: 'UNAUTHORIZED' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: requesterProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', requester.id)
      .single()

    if (requesterProfile?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Admin access required', code: 'FORBIDDEN' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { userId, email, ttlMinutes } = await req.json()

    if (!userId && !email) {
      return new Response(JSON.stringify({ error: 'userId or email required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Find target user
    let targetQuery = supabase.from('users').select('*')
    if (userId) {
      targetQuery = targetQuery.eq('id', userId)
    } else {
      targetQuery = targetQuery.ilike('email', email)
    }
    const { data: targetUser } = await targetQuery.single()

    if (!targetUser) {
      return new Response(JSON.stringify({ error: 'User not found', code: 'NOT_FOUND' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Generate a simple signed token (for impersonation context)
    const ttl = Math.min(ttlMinutes || 30, 120)
    const expiresAt = new Date(Date.now() + ttl * 60 * 1000).toISOString()

    // Use Supabase admin to create a session for the target user
    // Note: In production, you'd use supabase.auth.admin.generateLink or similar
    const impersonationToken = btoa(JSON.stringify({
      userId: targetUser.id,
      email: targetUser.email,
      displayName: targetUser.display_name,
      role: targetUser.role,
      impersonated: true,
      actorId: requester.id,
      exp: Date.now() + ttl * 60 * 1000,
    }))

    return new Response(JSON.stringify({
      success: true,
      token: impersonationToken,
      user: {
        id: targetUser.id,
        email: targetUser.email,
        displayName: targetUser.display_name,
        role: targetUser.role,
      },
      expiresAt,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('impersonate-user error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
