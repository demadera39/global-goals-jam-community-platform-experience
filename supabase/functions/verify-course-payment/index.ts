import { corsHeaders } from '../_shared/cors.ts'
import { getSupabaseClient } from '../_shared/supabase.ts'
import { grantLearnEntitlement } from '../_shared/entitlements.ts'

// Proactive payment verification for course enrollment.
//
// The webhook (mollie-webhook) is the primary activation path, but if Mollie
// is slow or the webhook misses, a paying user gets stranded on "pending".
// This function is called automatically by the enrol page: it asks Mollie for
// the real payment status and, if paid, performs the SAME activation as the
// webhook — idempotently. Users never verify anything by hand.
//
// Security: activation only happens when Mollie reports the payment as `paid`
// AND the payment's metadata.enrollment_id matches the enrollment being
// verified — a caller cannot activate an enrollment that wasn't truly paid.

const MOLLIE_API_KEY = () => Deno.env.get('MOLLIE_API_KEY') as string
const MOLLIE_BASE = 'https://api.mollie.com/v2'

async function mollieGet(path: string) {
  const res = await fetch(`${MOLLIE_BASE}${path}`, {
    headers: { Authorization: `Bearer ${MOLLIE_API_KEY()}` },
  })
  if (!res.ok) throw new Error(`Mollie GET ${path} (${res.status})`)
  return res.json()
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const json = (b: unknown, status = 200) =>
    new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  try {
    const { enrollmentId, paymentId } = await req.json()
    if (!enrollmentId) return json({ error: 'enrollmentId required' }, 400)

    const supabase = getSupabaseClient()

    // Load the enrollment.
    const { data: enr } = await supabase
      .from('course_enrollments')
      .select('id, user_id, status, mollie_payment_id')
      .eq('id', enrollmentId)
      .single()

    if (!enr) return json({ error: 'enrollment not found' }, 404)

    // Already done — idempotent success.
    if (enr.status === 'active' || enr.status === 'completed') {
      return json({ status: enr.status, paid: true })
    }

    // Find the Mollie payment id to check (prefer the one passed in, else the
    // stored one). Only genuine Mollie ids (tr_/ord_) can be verified here.
    const pid = paymentId || enr.mollie_payment_id
    if (!pid || !/^(tr_|ord_)/.test(pid)) {
      return json({ status: enr.status, paid: false, reason: 'no_mollie_payment' })
    }

    let payment: any
    try {
      payment = await mollieGet(`/payments/${pid}`)
    } catch (_) {
      return json({ status: enr.status, paid: false, reason: 'mollie_unavailable' })
    }

    if (payment.status !== 'paid') {
      return json({ status: enr.status, paid: false, mollieStatus: payment.status })
    }

    // Guard: the paid payment must belong to this enrollment.
    if ((payment.metadata?.enrollment_id || '') !== enrollmentId) {
      return json({ status: enr.status, paid: false, reason: 'metadata_mismatch' }, 200)
    }

    // Activate — same shape as the webhook.
    const amountPaid = parseFloat(payment.amount.value)
    await supabase.from('course_enrollments').update({
      status: 'active',
      mollie_payment_id: payment.id,
      amount_paid: amountPaid,
      updated_at: new Date().toISOString(),
    }).eq('id', enrollmentId)

    if (enr.user_id) {
      const { data: u } = await supabase.from('users').select('role').eq('id', enr.user_id).single()
      if (u && u.role === 'participant') {
        await supabase.from('users').update({
          role: 'host', status: 'approved', updated_at: new Date().toISOString(),
        }).eq('id', enr.user_id)
      }
      await grantLearnEntitlement(supabase, enr.user_id)
    }

    return json({ status: 'active', paid: true, amountPaid })
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unexpected error' }, 500)
  }
})
