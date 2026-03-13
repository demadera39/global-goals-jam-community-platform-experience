import { corsHeaders } from '../_shared/cors.ts'

const MOLLIE_API_KEY = () => Deno.env.get('MOLLIE_API_KEY') as string
const MOLLIE_BASE = 'https://api.mollie.com/v2'

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

    const baseUrl = returnUrl || successUrl?.replace(/\/[^/]*$/, '') || 'https://globalgoalsjam.org'
    const amountEur = amount ? (amount / 100).toFixed(2) : '39.99'

    const webhookUrl = Deno.env.get('SUPABASE_URL') + '/functions/v1/mollie-webhook'

    const res = await fetch(`${MOLLIE_BASE}/payments`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${MOLLIE_API_KEY()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: { currency: 'EUR', value: amountEur },
        description: 'GGJ Certification Course Enrollment',
        redirectUrl: successUrl || `${baseUrl}/course/dashboard?payment=success`,
        cancelUrl: cancelUrl || `${baseUrl}/course/enroll?canceled=true`,
        webhookUrl,
        metadata: {
          purpose: 'course_enrollment',
          enrollment_id: enrollmentId,
          user_id: userId,
          email: email || '',
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

    console.log('[CREATE-MOLLIE-COURSE] Payment created:', payment.id)

    return new Response(JSON.stringify({ paymentId: payment.id, url: checkoutUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('[CREATE-MOLLIE-COURSE] Error:', (error as Error).message)
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
