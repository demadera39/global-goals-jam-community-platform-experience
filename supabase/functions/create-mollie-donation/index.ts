import { corsHeaders } from '../_shared/cors.ts'

const MOLLIE_API_KEY = () => Deno.env.get('MOLLIE_API_KEY') as string
const MOLLIE_BASE = 'https://api.mollie.com/v2'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { amount, tierName, returnUrl } = await req.json()

    const amountCents = amount || 2500
    const amountEur = (amountCents / 100).toFixed(2)
    const tier = tierName || 'Supporter'

    const origin = req.headers.get('origin') || returnUrl || 'https://globalgoalsjam.org'
    const baseUrl = returnUrl || origin
    const webhookUrl = Deno.env.get('SUPABASE_URL') + '/functions/v1/mollie-webhook'

    const res = await fetch(`${MOLLIE_BASE}/payments`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${MOLLIE_API_KEY()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: { currency: 'EUR', value: amountEur },
        description: `Global Goals Jam Donation - ${tier}`,
        redirectUrl: `${baseUrl}/donate/success`,
        cancelUrl: `${baseUrl}/donate?canceled=true`,
        webhookUrl,
        metadata: {
          purpose: 'platform_donation',
          tier_name: tier,
        },
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      return new Response(JSON.stringify({ error: `Mollie error: ${errText}` }), {
        status: res.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const payment = await res.json()
    const checkoutUrl = payment._links?.checkout?.href

    console.log('[CREATE-MOLLIE-DONATION] Payment created:', payment.id, 'tier:', tier)

    return new Response(JSON.stringify({ paymentId: payment.id, url: checkoutUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('[CREATE-MOLLIE-DONATION] Error:', (error as Error).message)
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
