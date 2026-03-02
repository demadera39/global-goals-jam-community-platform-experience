import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', {
      status: 405,
      headers: { 'Access-Control-Allow-Origin': '*' },
    })
  }

  try {
    const {
      enrollmentId,
      userId,
      email = '',
      amount = 3999,
      successUrl,
      cancelUrl,
      returnUrl,
    } = await req.json()

    if (!enrollmentId || !userId) {
      return new Response(JSON.stringify({ error: 'Missing enrollmentId or userId' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeSecretKey) {
      return new Response(JSON.stringify({ error: 'Stripe secret key not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    // Base URL from client origin or fallback
    const origin = req.headers.get('origin') || returnUrl || 'https://globalgoalsjam.org'
    const success = successUrl || `${origin}/course/enroll?success=1&session_id={CHECKOUT_SESSION_ID}`
    const cancel = cancelUrl || `${origin}/course/enroll?canceled=1`

    // Build Stripe Checkout Session params
    const params = new URLSearchParams({
      'payment_method_types[0]': 'card',
      'mode': 'payment',
      'success_url': success,
      'cancel_url': cancel,
      'allow_promotion_codes': 'true',
      'client_reference_id': enrollmentId,
      'metadata[purpose]': 'course_enrollment',
      'metadata[enrollment_id]': enrollmentId,
      'metadata[user_id]': userId,
    })

    if (email) params.set('customer_email', email)

    // Inline price data (USD $39.99 by default)
    params.set('line_items[0][price_data][currency]', 'usd')
    params.set('line_items[0][price_data][unit_amount]', String(amount))
    params.set('line_items[0][price_data][product_data][name]', 'GGJ Certification Course Enrollment')
    params.set('line_items[0][quantity]', '1')

    const stripeResp = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })

    if (!stripeResp.ok) {
      const errText = await stripeResp.text().catch(() => '')
      console.error('Stripe create session failed:', stripeResp.status, errText)
      return new Response(JSON.stringify({ error: 'Stripe API error', status: stripeResp.status, details: errText }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    const session = await stripeResp.json()

    return new Response(JSON.stringify({ sessionId: session.id, url: session.url }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  } catch (err: any) {
    console.error('create-course-checkout error:', err?.message || err)
    return new Response(JSON.stringify({ error: 'Failed to create checkout session', details: err?.message || String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }
})
