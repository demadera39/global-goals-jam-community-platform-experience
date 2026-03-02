import { corsHeaders } from '../_shared/cors.ts'
import { getSupabaseClient } from '../_shared/supabase.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { sessionId, userId, enrollmentId } = await req.json()
    if (!sessionId) {
      return new Response(JSON.stringify({ error: 'sessionId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')!
    const supabase = getSupabaseClient()

    // 1. Retrieve Stripe session
    const stripeRes = await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${sessionId}?expand[]=payment_intent&expand[]=line_items`,
      { headers: { 'Authorization': `Bearer ${stripeKey}` } }
    )
    const session = await stripeRes.json()

    if (!stripeRes.ok) {
      return new Response(JSON.stringify({ error: 'Failed to retrieve Stripe session' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 2. Validate payment
    const isPaid = session.payment_status === 'paid' ||
      session.status === 'complete' ||
      session.payment_intent?.status === 'succeeded'

    if (!isPaid) {
      return new Response(JSON.stringify({ error: 'Payment not completed', status: session.payment_status }), {
        status: 202,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 3. Find user
    const email = session.customer_details?.email || session.customer_email
    const targetUserId = userId || session.metadata?.user_id
    let user = null

    if (targetUserId) {
      const { data } = await supabase.from('users').select('*').eq('id', targetUserId).single()
      user = data
    }
    if (!user && email) {
      const { data } = await supabase.from('users').select('*').ilike('email', email).single()
      user = data
    }

    // 4. Find or create enrollment
    const eid = enrollmentId || session.metadata?.enrollment_id || session.client_reference_id
    let enrollment = null

    if (eid) {
      const { data } = await supabase.from('courseEnrollments').select('*').eq('id', eid).single()
      enrollment = data
    }
    if (!enrollment && user) {
      const { data } = await supabase.from('courseEnrollments').select('*')
        .eq('userId', user.id)
        .order('updatedAt', { ascending: false })
        .limit(1)
        .single()
      enrollment = data
    }

    if (!enrollment && user) {
      const newId = `enr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
      const { data } = await supabase.from('courseEnrollments').insert({
        id: newId,
        userId: user.id,
        status: 'active',
        stripeSessionId: sessionId,
        amountPaid: (session.amount_total || 3999) / 100,
        enrolledAt: new Date().toISOString(),
      }).select().single()
      enrollment = data
    }

    if (!enrollment) {
      return new Response(JSON.stringify({ error: 'Could not find or create enrollment' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 5. Update enrollment to active
    const amountPaid = (session.amount_total || 3999) / 100
    const { data: updated } = await supabase.from('courseEnrollments').update({
      status: 'active',
      stripeSessionId: sessionId,
      stripePaymentIntent: session.payment_intent?.id || session.payment_intent,
      amountPaid,
      currentModule: enrollment.currentModule || 1,
      updatedAt: new Date().toISOString(),
    }).eq('id', enrollment.id).select().single()

    // 6. Schedule 8-day email sequence
    try {
      const now = new Date()
      const emails = Array.from({ length: 8 }, (_, i) => {
        const sendDate = new Date(now)
        sendDate.setDate(sendDate.getDate() + i)
        sendDate.setHours(9, 0, 0, 0)
        return {
          id: `sched_${enrollment.id}_m${i + 1}`,
          enrollmentId: enrollment.id,
          userId: user?.id || enrollment.userId,
          moduleNumber: i + 1,
          scheduledFor: sendDate.toISOString(),
          status: 'pending',
        }
      })
      await supabase.from('emailSchedule').upsert(emails, { onConflict: 'id' })
    } catch (e) {
      console.warn('Failed to schedule emails:', e)
    }

    // 7. Auto-upgrade user role
    if (user && user.role === 'participant') {
      await supabase.from('users').update({
        role: 'host',
        status: 'approved',
        updatedAt: new Date().toISOString(),
      }).eq('id', user.id)
    }

    return new Response(JSON.stringify({ ok: true, enrollment: updated }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('confirm-course-enrollment error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
