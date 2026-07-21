import { corsHeaders } from '../_shared/cors.ts'
import { getSupabaseClient } from '../_shared/supabase.ts'

// Start a Mollie checkout for the official Host certification (€39).
// The course is free; this is the one payment moment in the model. The
// certifications row is keyed by email (the only join key shared between the
// main site's `users` and Learn's `profiles`). Creating a pending row for an
// arbitrary email is harmless — nothing is granted until Mollie confirms the
// payment (webhook or verify-certification-payment).

const MOLLIE_API_KEY = () => Deno.env.get('MOLLIE_API_KEY') as string
const MOLLIE_BASE = 'https://api.mollie.com/v2'
const CERTIFICATION_PRICE = '39.00'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const json = (b: unknown, status = 200) =>
    new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  try {
    const { email, learnUserId, successUrl, cancelUrl } = await req.json()
    if (!email || !successUrl) return json({ error: 'email and successUrl are required' }, 400)
    const normEmail = String(email).trim().toLowerCase()

    const supabase = getSupabaseClient()

    // Already certified — nothing to buy.
    const { data: existing } = await supabase
      .from('certifications')
      .select('id, status')
      .eq('email', normEmail)
      .maybeSingle()
    if (existing?.status === 'paid') return json({ alreadyCertified: true })

    let certificationId = existing?.id
    if (!certificationId) {
      const { data: created, error } = await supabase
        .from('certifications')
        .insert({ email: normEmail, learn_user_id: learnUserId || null, source: 'mollie', status: 'pending' })
        .select('id')
        .single()
      if (error || !created) return json({ error: error?.message || 'could not create certification record' }, 500)
      certificationId = created.id
    }

    const webhookUrl = Deno.env.get('SUPABASE_URL') + '/functions/v1/mollie-webhook'
    const res = await fetch(`${MOLLIE_BASE}/payments`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${MOLLIE_API_KEY()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: { currency: 'EUR', value: CERTIFICATION_PRICE },
        description: 'GGJ Official Host Certification',
        redirectUrl: successUrl,
        cancelUrl: cancelUrl || successUrl,
        webhookUrl,
        metadata: {
          purpose: 'host_certification',
          certification_id: certificationId,
          email: normEmail,
          learn_user_id: learnUserId || '',
        },
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      return json({ error: `Mollie error: ${errText}` }, res.status)
    }

    const payment = await res.json()
    await supabase.from('certifications').update({
      mollie_payment_id: payment.id,
      learn_user_id: learnUserId || null,
      updated_at: new Date().toISOString(),
    }).eq('id', certificationId)

    return json({ paymentId: payment.id, url: payment._links?.checkout?.href })
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unexpected error' }, 500)
  }
})
