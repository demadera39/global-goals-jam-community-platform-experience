import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { enrollmentId, userId, email, amount, successUrl, cancelUrl, returnUrl } = await req.json()

    if (!enrollmentId || !userId) {
      return new Response(JSON.stringify({ error: 'enrollmentId and userId are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeKey) {
      return new Response(JSON.stringify({ error: 'Stripe not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const baseUrl = returnUrl || successUrl?.replace(/\/[^/]*$/, '') || 'https://globalgoalsjam.org'
    const unitAmount = amount || 3999

    const params = new URLSearchParams()
    params.append('payment_method_types[]', 'card')
    params.append('mode', 'payment')
    params.append('allow_promotion_codes', 'true')
    params.append('client_reference_id', enrollmentId)
    params.append('metadata[purpose]', 'course_enrollment')
    params.append('metadata[enrollment_id]', enrollmentId)
    params.append('metadata[user_id]', userId)
    params.append('line_items[0][price_data][currency]', 'usd')
    params.append('line_items[0][price_data][unit_amount]', String(unitAmount))
    params.append('line_items[0][price_data][product_data][name]', 'GGJ Certification Course Enrollment')
    params.append('line_items[0][quantity]', '1')
    params.append('success_url', successUrl || `${baseUrl}/course/dashboard?session_id={CHECKOUT_SESSION_ID}`)
    params.append('cancel_url', cancelUrl || `${baseUrl}/course/enroll?canceled=true`)
    if (email) params.append('customer_email', email)

    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })

    const session = await response.json()

    if (!response.ok) {
      return new Response(JSON.stringify({ error: session.error?.message || 'Failed to create checkout' }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ sessionId: session.id, url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('create-course-checkout error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
