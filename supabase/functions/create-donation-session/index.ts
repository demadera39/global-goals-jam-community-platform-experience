import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { priceId, amount, tierName, requiresForm, returnUrl } = await req.json()

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeKey) {
      return new Response(JSON.stringify({ error: 'Stripe not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const origin = req.headers.get('origin') || returnUrl || 'https://globalgoalsjam.org'
    const baseUrl = returnUrl || origin

    const params = new URLSearchParams()
    params.append('payment_method_types[]', 'card')
    params.append('mode', 'payment')
    params.append('allow_promotion_codes', 'true')
    params.append('metadata[purpose]', 'platform_donation')
    params.append('metadata[tier_name]', tierName || 'Supporter')
    params.append('metadata[requires_form]', String(requiresForm || false))
    params.append('success_url', `${baseUrl}/donate/success?session_id={CHECKOUT_SESSION_ID}`)
    params.append('cancel_url', `${baseUrl}/donate?canceled=true`)

    if (priceId) {
      params.append('line_items[0][price]', priceId)
      params.append('line_items[0][quantity]', '1')
    } else {
      const unitAmount = amount || 2500
      params.append('line_items[0][price_data][currency]', 'usd')
      params.append('line_items[0][price_data][unit_amount]', String(unitAmount))
      params.append('line_items[0][price_data][product_data][name]', 'Global Goals Jam Platform Donation')
      params.append('line_items[0][quantity]', '1')
    }

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
      return new Response(JSON.stringify({ error: session.error?.message || 'Failed to create session' }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ sessionId: session.id, url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('create-donation-session error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
