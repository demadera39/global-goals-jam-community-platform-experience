import { corsHeaders } from '../_shared/cors.ts'
import { getSupabaseClient } from '../_shared/supabase.ts'
import { activateCertification } from '../_shared/certification.ts'

// Proactive payment verification for the official Host certification —
// the same pattern as verify-course-payment: the webhook is the primary
// activation path, but the certificate page also asks us directly so a slow
// webhook never strands a paying user. Activation only happens when Mollie
// reports the payment as `paid` AND the payment's metadata email matches the
// certification being verified.

const MOLLIE_API_KEY = () => Deno.env.get('MOLLIE_API_KEY') as string
const MOLLIE_BASE = 'https://api.mollie.com/v2'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const json = (b: unknown, status = 200) =>
    new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  try {
    const { email } = await req.json()
    if (!email) return json({ error: 'email required' }, 400)
    const normEmail = String(email).trim().toLowerCase()

    const supabase = getSupabaseClient()
    const { data: cert } = await supabase
      .from('certifications')
      .select('id, status, mollie_payment_id')
      .eq('email', normEmail)
      .maybeSingle()

    if (!cert) return json({ certified: false, reason: 'not_found' })
    if (cert.status === 'paid') return json({ certified: true })

    const pid = cert.mollie_payment_id
    if (!pid || !/^(tr_|ord_)/.test(pid)) {
      return json({ certified: false, reason: 'no_mollie_payment' })
    }

    let payment: any
    try {
      const res = await fetch(`${MOLLIE_BASE}/payments/${pid}`, {
        headers: { Authorization: `Bearer ${MOLLIE_API_KEY()}` },
      })
      if (!res.ok) throw new Error(`Mollie ${res.status}`)
      payment = await res.json()
    } catch (_) {
      return json({ certified: false, reason: 'mollie_unavailable' })
    }

    if (payment.status !== 'paid') {
      return json({ certified: false, mollieStatus: payment.status })
    }
    if ((payment.metadata?.email || '').toLowerCase() !== normEmail) {
      return json({ certified: false, reason: 'metadata_mismatch' })
    }

    await activateCertification(supabase, {
      certificationId: cert.id,
      email: normEmail,
      molliePaymentId: payment.id,
      amountPaid: parseFloat(payment.amount.value),
    })

    return json({ certified: true })
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unexpected error' }, 500)
  }
})
