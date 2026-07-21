import { corsHeaders } from '../_shared/cors.ts'
import { getSupabaseClient } from '../_shared/supabase.ts'
import { grantLearnEntitlement } from '../_shared/entitlements.ts'
import { LEARN_URL, learnMagicLinkForEmail } from '../_shared/learn.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Free enrollment in the Host Programme. The course itself costs nothing —
// the €39 payment moment moved to the official certification, claimed on the
// learn platform after completing the capstone (see
// create-mollie-certification-checkout / verify-certification-payment).
//
// This function activates (or creates) the caller's enrollment, makes sure a
// learn-platform auth account exists for their email, and emails them a
// one-click sign-in link. The magic link is only ever emailed to the account
// owner — never returned to the caller — so this endpoint can't be used to
// sign in as someone else.

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const json = (b: unknown, status = 200) =>
    new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  try {
    const { userId } = await req.json()
    if (!userId) return json({ error: 'userId required' }, 400)

    const supabase = getSupabaseClient()

    const { data: user } = await supabase
      .from('users')
      .select('id, email, display_name')
      .eq('id', userId)
      .single()
    if (!user?.email) return json({ error: 'user not found' }, 404)

    // Activate the latest enrollment, or create one.
    const { data: existing } = await supabase
      .from('course_enrollments')
      .select('id, status')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    let enrollmentId = existing?.id
    if (existing && (existing.status === 'active' || existing.status === 'completed')) {
      // Already in — idempotent success.
    } else if (existing) {
      await supabase.from('course_enrollments').update({
        status: 'active',
        amount_paid: '0',
        updated_at: new Date().toISOString(),
      }).eq('id', existing.id)
    } else {
      enrollmentId = `enr_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
      await supabase.from('course_enrollments').insert({
        id: enrollmentId,
        user_id: user.id,
        status: 'active',
        amount_paid: '0',
        enrolled_at: new Date().toISOString(),
      })
    }

    // Make sure a learn-platform auth account exists for this email so the
    // magic link below works (generateLink does not create users).
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    try {
      await admin.auth.admin.createUser({
        email: user.email,
        email_confirm: true,
        user_metadata: { name: user.display_name || '' },
      })
    } catch (_) {
      // Already exists — fine.
    }
    await grantLearnEntitlement(supabase, userId)

    // Welcome email with a one-click sign-in link into the learn platform.
    let emailSent = false
    try {
      const resendKey = Deno.env.get('RESEND_API_KEY')
      if (resendKey) {
        const learnLink = await learnMagicLinkForEmail(user.email)
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: 'Global Goals Jam <marco@globalgoalsjam.org>',
            to: [user.email],
            subject: 'Welcome to the GGJ Host Programme',
            html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: #00A651; padding: 24px; text-align: center;">
                <h1 style="color: white; margin: 0;">You're in!</h1>
              </div>
              <div style="padding: 24px;">
                <p>Your enrollment in the GGJ Host Programme is confirmed — the course is free for everyone.</p>
                <p>Your course lives on the Global Goals Jam learning platform. The button below signs you straight in.</p>
                <p><a href="${learnLink}" style="display:inline-block;padding:12px 24px;background:#00A651;color:white;text-decoration:none;border-radius:8px;">Start the Host Programme</a></p>
                <p style="color:#6b7280;font-size:13px;">Or visit <a href="${LEARN_URL}" style="color:#00A651;">${LEARN_URL.replace(/^https?:\/\//, '')}</a> and sign in with this email address.</p>
                <p style="color:#6b7280;font-size:13px;">When you complete the programme, you can claim your official Host certification (€39) — your contribution directly supports the Global Goals Jam community and keeps this platform running.</p>
              </div>
            </div>`,
          }),
        })
        emailSent = res.ok
      }
    } catch (e) {
      console.warn('[ENROLL-FREE] welcome email failed:', e)
    }

    return json({ ok: true, enrollmentId, status: 'active', emailSent, learnUrl: LEARN_URL })
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unexpected error' }, 500)
  }
})
