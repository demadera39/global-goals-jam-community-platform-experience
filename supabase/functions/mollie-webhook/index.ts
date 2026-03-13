import { getSupabaseClient } from '../_shared/supabase.ts'

const MOLLIE_API_KEY = () => Deno.env.get('MOLLIE_API_KEY') as string
const MOLLIE_BASE = 'https://api.mollie.com/v2'

async function mollieGet(path: string) {
  const res = await fetch(`${MOLLIE_BASE}${path}`, {
    headers: { Authorization: `Bearer ${MOLLIE_API_KEY()}` },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Mollie GET ${path} failed (${res.status}): ${text}`)
  }
  return res.json()
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const supabase = getSupabaseClient()

  try {
    const rawBody = await req.text()
    let paymentId: string | null = null

    const params = new URLSearchParams(rawBody)
    paymentId = params.get('id')

    if (!paymentId) {
      try {
        const jsonBody = JSON.parse(rawBody)
        paymentId = jsonBody.id || jsonBody.resource?.id || null
      } catch { /* not JSON */ }
    }

    if (!paymentId) {
      console.log('[MOLLIE-WEBHOOK] No payment ID, returning 200 for test')
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    console.log('[MOLLIE-WEBHOOK] Received:', paymentId)

    let payment
    try {
      payment = await mollieGet(`/payments/${paymentId}`)
    } catch (fetchError) {
      console.log('[MOLLIE-WEBHOOK] Could not fetch payment (likely test):', (fetchError as Error).message)
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    console.log('[MOLLIE-WEBHOOK] Status:', payment.status, 'metadata:', payment.metadata)

    if (payment.status !== 'paid') {
      console.log(`[MOLLIE-WEBHOOK] Payment ${paymentId} status is ${payment.status}, skipping`)
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const metadata = payment.metadata || {}
    const purpose = metadata.purpose

    if (purpose === 'course_enrollment') {
      await handleCourseEnrollment(supabase, payment, metadata)
    } else if (purpose === 'platform_donation') {
      await handleDonation(supabase, payment, metadata)
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('[MOLLIE-WEBHOOK] Error:', (error as Error).message)
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})

async function handleCourseEnrollment(supabase: any, payment: any, metadata: any) {
  const enrollmentId = metadata.enrollment_id
  const userId = metadata.user_id
  const email = metadata.email
  const amountPaid = parseFloat(payment.amount.value)

  console.log('[MOLLIE-WEBHOOK] Processing course enrollment:', { enrollmentId, userId, amountPaid })

  if (enrollmentId) {
    await supabase.from('course_enrollments').update({
      status: 'active',
      mollie_payment_id: payment.id,
      amount_paid: amountPaid,
      updated_at: new Date().toISOString(),
    }).eq('id', enrollmentId)
  }

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
                <p><strong>Amount paid:</strong> €${amountPaid.toFixed(2)}</p>
                <p>You can access your course dashboard at any time.</p>
                <p><a href="https://globalgoalsjam.org/course/dashboard" style="display:inline-block;padding:12px 24px;background:#00A651;color:white;text-decoration:none;border-radius:8px;">Go to Dashboard</a></p>
              </div>
            </div>`,
          }),
        })
      }
    } catch (e) {
      console.warn('[MOLLIE-WEBHOOK] Failed to send confirmation email:', e)
    }
  }
}

async function handleDonation(supabase: any, payment: any, metadata: any) {
  const amount = parseFloat(payment.amount.value)
  const tierName = metadata.tier_name || 'Supporter'
  const email = metadata.email

  console.log('[MOLLIE-WEBHOOK] Processing donation:', { amount, tierName, email })

  const donationId = `don_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  await supabase.from('donations').insert({
    id: donationId,
    mollie_payment_id: payment.id,
    amount,
    amount_display: `€${amount.toFixed(2)}`,
    tier_name: tierName,
    status: 'completed',
    paid_at: new Date().toISOString(),
    email,
  })

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
                <p>Your generous donation of <strong>€${amount.toFixed(2)}</strong> as a <strong>${tierName}</strong> supporter helps us expand the Global Goals Jam movement worldwide.</p>
                <p>Your support enables local communities to tackle the UN Sustainable Development Goals through collaborative design sprints.</p>
              </div>
            </div>`,
          }),
        })
      }
    } catch (e) {
      console.warn('[MOLLIE-WEBHOOK] Failed to send donation email:', e)
    }
  }
}
