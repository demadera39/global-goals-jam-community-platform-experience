import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
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
      headers: {
        'Access-Control-Allow-Origin': '*',
      }
    })
  }

  try {
    const { 
      priceId, 
      amount = 2500, 
      tierName = 'Supporter',
      requiresForm = false,
      returnUrl 
    } = await req.json()
    
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeSecretKey) {
      throw new Error('Stripe secret key not found')
    }

    const baseUrl = returnUrl || req.headers.get('origin') || 'https://globalgoalsjam.org'
    const successUrl = requiresForm 
      ? `${baseUrl}/donation-success?session_id={CHECKOUT_SESSION_ID}` 
      : `${baseUrl}/donate?success=true`

    // Create checkout session with specific price
    const checkoutParams = new URLSearchParams({
      'payment_method_types[0]': 'card',
      'mode': 'payment',
      'success_url': successUrl,
      'cancel_url': `${baseUrl}/donate?canceled=true`,
      'allow_promotion_codes': 'true',
      'metadata[purpose]': 'platform_donation',
      'metadata[tier_name]': tierName,
      'metadata[requires_form]': requiresForm.toString(),
    })

    if (priceId) {
      checkoutParams.append('line_items[0][price]', priceId)
      checkoutParams.append('line_items[0][quantity]', '1')
    } else {
      // Fallback to custom amount
      checkoutParams.append('line_items[0][price_data][currency]', 'usd')
      checkoutParams.append('line_items[0][price_data][product_data][name]', 'Global Goals Jam Platform Donation')
      checkoutParams.append('line_items[0][price_data][product_data][description]', 'Supporting platform costs, development, coordination, hosting, and training course development')
      checkoutParams.append('line_items[0][price_data][unit_amount]', amount.toString())
      checkoutParams.append('line_items[0][quantity]', '1')
    }

    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: checkoutParams.toString(),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Stripe API Error:', error)
      throw new Error(`Stripe API error: ${response.status}`)
    }

    const session = await response.json()

    return new Response(
      JSON.stringify({ 
        sessionId: session.id,
        url: session.url 
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  } catch (error) {
    console.error('Error creating donation session:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to create donation session',
        details: error.message 
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  }
})
