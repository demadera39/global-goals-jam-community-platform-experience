// Activation for the official Host certification (€39): shared between
// mollie-webhook and verify-certification-payment so both paths behave
// identically and stay idempotent.
//
// Becoming a certified host is ALSO the moment the host role is granted on
// the main site (it used to be granted at course payment; the course is free
// now). Main-site users are matched by email — `users` ids and Learn auth
// uuids don't line up.

export async function activateCertification(
  supabase: any,
  opts: { certificationId?: string; email: string; molliePaymentId: string; amountPaid: number }
) {
  const normEmail = opts.email.trim().toLowerCase()
  const now = new Date().toISOString()

  const patch = {
    status: 'paid',
    mollie_payment_id: opts.molliePaymentId,
    amount_paid: String(opts.amountPaid),
    updated_at: now,
  }
  if (opts.certificationId) {
    await supabase.from('certifications').update(patch).eq('id', opts.certificationId)
  } else {
    await supabase.from('certifications').upsert({ email: normEmail, source: 'mollie', ...patch }, { onConflict: 'email' })
  }

  // Grant the host role on the main site. Someone who only ever used the
  // learn platform has no `users` row yet — create one (passwordless; the
  // forgot-password flow lets them set a password) so the host dashboard is
  // genuinely unlocked the moment they certify.
  const { data: siteUser } = await supabase
    .from('users')
    .select('id, role')
    .ilike('email', normEmail)
    .maybeSingle()
  if (siteUser) {
    if (siteUser.role === 'participant') {
      await supabase.from('users').update({
        role: 'host', status: 'approved', updated_at: now,
      }).eq('id', siteUser.id)
    }
  } else {
    const { data: learnProfile } = await supabase
      .from('profiles')
      .select('name')
      .ilike('email', normEmail)
      .maybeSingle()
    await supabase.from('users').insert({
      id: `user_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      email: normEmail,
      display_name: learnProfile?.name || normEmail.split('@')[0],
      role: 'host',
      status: 'approved',
      email_verified: 1,
      created_at: now,
      updated_at: now,
    })
  }

  // Thank-you email (best effort).
  try {
    const resendKey = Deno.env.get('RESEND_API_KEY')
    if (resendKey) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'Global Goals Jam <marco@globalgoalsjam.org>',
          to: [normEmail],
          subject: 'You are an Official Certified GGJ Host',
          html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #00A651; padding: 24px; text-align: center;">
              <h1 style="color: white; margin: 0;">Congratulations!</h1>
            </div>
            <div style="padding: 24px;">
              <p>You are now an <strong>Official Certified Global Goals Jam Host</strong>.</p>
              <p>Your certificate is ready on the learning platform, and your host status is active: the host dashboard on globalgoalsjam.org is now unlocked — organise events, manage participants, and publish articles.</p>
              <p>Thank you — your €${opts.amountPaid.toFixed(2)} contribution directly supports the Global Goals Jam community and keeps this platform running.</p>
              <p><a href="https://learn.globalgoalsjam.org/certificate" style="display:inline-block;padding:12px 24px;background:#00A651;color:white;text-decoration:none;border-radius:8px;">View your certificate</a></p>
            </div>
          </div>`,
        }),
      })
    }
  } catch (e) {
    console.warn('[CERTIFICATION] thank-you email failed:', e)
  }
}
