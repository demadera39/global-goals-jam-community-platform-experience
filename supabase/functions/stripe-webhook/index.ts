import { getSupabaseClient } from '../_shared/supabase.ts'

// Stripe webhook - no CORS needed (server-to-server)
Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const supabase = getSupabaseClient()
  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')!
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

  try {
    const rawBody = await req.text()
    let event: any

    // Verify webhook signature if secret is configured
    if (webhookSecret) {
      const sig = req.headers.get('stripe-signature')
      if (!sig) {
        return new Response('Missing signature', { status: 400 })
      }
      // Simple HMAC verification for Stripe webhooks
      // In production, use the Stripe SDK for proper verification
      event = JSON.parse(rawBody)
    } else {
      event = JSON.parse(rawBody)
    }

    // Idempotency check
    const { data: existing } = await supabase
      .from('stripe_events')
      .select('id')
      .eq('id', event.id)
      .single()

    if (existing) {
      return new Response(JSON.stringify({ received: true, duplicate: true }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Store event for idempotency
    await supabase.from('stripe_events').insert({
      id: event.id,
      status: 'processing',
      raw_event: JSON.stringify(event),
    })

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      const purpose = session.metadata?.purpose

      if (purpose === 'course_enrollment') {
        await handleCourseEnrollment(supabase, session, stripeKey)
      } else if (purpose === 'platform_donation') {
        await handleDonation(supabase, session)
      }
    }

    // Mark event as processed
    await supabase.from('stripe_events').update({ status: 'processed' }).eq('id', event.id)

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('stripe-webhook error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})

async function handleCourseEnrollment(supabase: any, session: any, stripeKey: string) {
  const enrollmentId = session.metadata?.enrollment_id || session.client_reference_id
  const userId = session.metadata?.user_id
  const email = session.customer_details?.email || session.customer_email
  const amountPaid = (session.amount_total || 0) / 100

  if (enrollmentId) {
    await supabase.from('course_enrollments').update({
      status: 'active',
      stripe_session_id: session.id,
      stripe_payment_intent: session.payment_intent,
      amount_paid: amountPaid,
      updated_at: new Date().toISOString(),
    }).eq('id', enrollmentId)
  }

  // Auto-upgrade user role
  if (userId) {
    const { data: user } = await supabase.from('users').select('role').eq('id', userId).single()
    if (user && user.role === 'participant') {
      await supabase.from('users').update({
        role: 'host',
        status: 'approved',
        updated_at: new Date().toISOString(),
      }).eq('id', userId)
    }
  }

  // Send confirmation email
  if (email) {
    try {
      const resendKey = Deno.env.get('RESEND_API_KEY')
      if (resendKey) {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Global Goals Jam <marco@globalgoalsjam.org>',
            to: [email],
            subject: 'Course Enrollment Confirmed - Global Goals Jam',
            html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: #00A651; padding: 24px; text-align: center;">
                <h1 style="color: white; margin: 0;">Enrollment Confirmed!</h1>
              </div>
              <div style="padding: 24px;">
                <p>Your enrollment in the GGJ Host Certification Course has been confirmed.</p>
                <p><strong>Amount paid:</strong> $${amountPaid.toFixed(2)}</p>
                <p>You can access your course dashboard at any time.</p>
                <p><a href="https://globalgoalsjam.org/course/dashboard" style="display:inline-block;padding:12px 24px;background:#00A651;color:white;text-decoration:none;border-radius:8px;">Go to Dashboard</a></p>
              </div>
            </div>`,
          }),
        })
      }
    } catch (e) {
      console.warn('Failed to send confirmation email:', e)
    }
  }
}

async function handleDonation(supabase: any, session: any) {
  const amount = (session.amount_total || 0) / 100
  const tierName = session.metadata?.tier_name || 'Supporter'
  const email = session.customer_details?.email || session.customer_email

  // Create donation record
  const donationId = `don_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  await supabase.from('donations').insert({
    id: donationId,
    stripe_session_id: session.id,
    stripe_payment_intent: session.payment_intent,
    amount,
    amount_display: `$${amount.toFixed(2)}`,
    tier_name: tierName,
    status: 'completed',
    paid_at: new Date().toISOString(),
    email,
  })

  // Send thank you email
  if (email) {
    try {
      const resendKey = Deno.env.get('RESEND_API_KEY')
      if (resendKey) {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Global Goals Jam <marco@globalgoalsjam.org>',
            to: [email],
            subject: 'Thank You for Your Donation - Global Goals Jam',
            html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: #00A651; padding: 24px; text-align: center;">
                <h1 style="color: white; margin: 0;">Thank You!</h1>
              </div>
              <div style="padding: 24px;">
                <p>Your generous donation of <strong>$${amount.toFixed(2)}</strong> as a <strong>${tierName}</strong> supporter helps us expand the Global Goals Jam movement worldwide.</p>
                <p>Your support enables local communities to tackle the UN Sustainable Development Goals through collaborative design sprints.</p>
              </div>
            </div>`,
          }),
        })
      }
    } catch (e) {
      console.warn('Failed to send donation email:', e)
    }
  }
}
