import { corsHeaders } from '../_shared/cors.ts'
import { getSupabaseClient } from '../_shared/supabase.ts'

// One-off reconciliation for historical stuck enrollments.
//
// Background: before the Mollie migration the course used Stripe, so old
// enrollments carry Stripe Checkout Session ids (cs_...). The everyday
// verify-course-payment function only understands Mollie ids and deliberately
// ignores anything else, so it can't confirm these legacy rows. This function
// asks the REAL processor for each stuck enrollment:
//   - cs_...  -> Stripe Checkout Session (payment_status)
//   - tr_/ord_ or none -> Mollie (direct GET, or a bounded scan of recent
//     payments matched on metadata.enrollment_id for rows with no stored id)
//
// Safety:
//   - Gated on the service-role key (Authorization: Bearer <service_role>);
//     nobody without it can call this.
//   - dryRun defaults to TRUE — it only reports. Activation happens solely for
//     rows the processor confirms as PAID and whose payment metadata maps back
//     to that same enrollment. Nothing else is ever touched.

const MOLLIE = () => Deno.env.get('MOLLIE_API_KEY') as string | undefined
const STRIPE = () => Deno.env.get('STRIPE_SECRET_KEY') as string | undefined
const SERVICE_ROLE = () => Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string | undefined

async function stripeGetSession(id: string) {
  const key = STRIPE()
  if (!key) return { _err: 'stripe_key_missing' as const }
  const res = await fetch(`https://api.stripe.com/v1/checkout/sessions/${id}`, {
    headers: { Authorization: `Bearer ${key}` },
  })
  if (!res.ok) return { _err: `stripe_${res.status}` as const }
  return res.json()
}

async function mollieGet(path: string) {
  const key = MOLLIE()
  if (!key) return { _err: 'mollie_key_missing' as const }
  const res = await fetch(`https://api.mollie.com/v2${path}`, {
    headers: { Authorization: `Bearer ${key}` },
  })
  if (!res.ok) return { _err: `mollie_${res.status}` as const }
  return res.json()
}

// Scan recent Mollie payments and index them by metadata.enrollment_id so we
// can find the payment for a stuck enrollment that never stored its id. Bounded
// to keep it cheap — 2026 rows sit near the front of the (newest-first) list.
async function buildMollieMetadataIndex(maxPages = 8): Promise<Record<string, any>> {
  const index: Record<string, any> = {}
  let url = '/payments?limit=250'
  for (let page = 0; page < maxPages && url; page++) {
    const data: any = await mollieGet(url)
    if (data?._err) break
    for (const p of data?._embedded?.payments || []) {
      const enrId = p?.metadata?.enrollment_id
      if (enrId && !index[enrId]) index[enrId] = p
    }
    const next: string | undefined = data?._links?.next?.href
    url = next ? next.replace('https://api.mollie.com/v2', '') : ''
  }
  return index
}

// Scan Stripe Checkout Sessions (the pre-Mollie processor) and index them by
// metadata.enrollment_id and, secondarily, by customer email. Lets us confirm
// legacy Stripe payments for enrollments that never stored their session id.
async function buildStripeIndex(maxPages = 15): Promise<{ byEnrollment: Record<string, any>; byEmail: Record<string, any[]> }> {
  const byEnrollment: Record<string, any> = {}
  const byEmail: Record<string, any[]> = {}
  const key = STRIPE()
  if (!key) return { byEnrollment, byEmail }
  let url = 'https://api.stripe.com/v1/checkout/sessions?limit=100'
  for (let page = 0; page < maxPages; page++) {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${key}` } })
    if (!res.ok) break
    const data: any = await res.json()
    for (const s of data?.data || []) {
      const enrId = s?.metadata?.enrollment_id || s?.client_reference_id
      if (enrId && !byEnrollment[enrId]) byEnrollment[enrId] = s
      const email = (s?.customer_details?.email || s?.customer_email || '').toLowerCase()
      if (email && s?.payment_status === 'paid') (byEmail[email] ||= []).push(s)
    }
    if (!data?.has_more || !data?.data?.length) break
    url = `https://api.stripe.com/v1/checkout/sessions?limit=100&starting_after=${data.data[data.data.length - 1].id}`
  }
  return { byEnrollment, byEmail }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const json = (b: unknown, status = 200) =>
    new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  try {
    // Gate: must present the service-role key.
    const auth = req.headers.get('Authorization') || ''
    const token = auth.replace(/^Bearer\s+/i, '')
    if (!SERVICE_ROLE() || token !== SERVICE_ROLE()) return json({ error: 'unauthorized' }, 401)

    const body = await req.json().catch(() => ({})) as { dryRun?: boolean }
    const dryRun = body.dryRun !== false // default TRUE

    const supabase = getSupabaseClient()
    const { data: rows, error } = await supabase
      .from('course_enrollments')
      .select('id, user_id, status, amount_paid, mollie_payment_id, enrolled_at')
      .not('status', 'in', '(active,completed)')
      .order('enrolled_at', { ascending: false })

    if (error) return json({ error: error.message }, 500)

    // Look up emails for these users (for email-based legacy/manual matching).
    const userIds = [...new Set((rows || []).map(r => r.user_id).filter(Boolean))]
    const emailByUser: Record<string, string> = {}
    if (userIds.length) {
      const { data: us } = await supabase.from('users').select('id, email').in('id', userIds)
      for (const u of us || []) if (u.email) emailByUser[u.id] = String(u.email).toLowerCase()
    }
    // Users who ALREADY have access — so an email-matched paid session that was
    // already applied elsewhere isn't double-counted onto a pending row.
    const { data: settled } = await supabase
      .from('course_enrollments').select('user_id').in('status', ['active', 'completed'])
    const usersWithAccess = new Set((settled || []).map(s => s.user_id).filter(Boolean))

    // Only scan Mollie if some row actually needs it (no id / mollie id).
    const needsMollieScan = (rows || []).some(r => !r.mollie_payment_id || /^(tr_|ord_)/.test(r.mollie_payment_id || ''))
    const mollieIndex = needsMollieScan ? await buildMollieMetadataIndex() : {}
    // Scan Stripe for id-less rows (legacy pre-Mollie payments not stored on the row).
    const needsStripeScan = (rows || []).some(r => !r.mollie_payment_id)
    const stripeIndex = needsStripeScan ? await buildStripeIndex() : { byEnrollment: {}, byEmail: {} }

    const report: any[] = []
    let activated = 0

    for (const r of rows || []) {
      const pid: string = r.mollie_payment_id || ''
      let processor = 'unknown'
      let paid = false
      let processorStatus = 'no_payment_found'
      let amount: number | null = null
      let confirmedPaymentId: string | null = null
      let metaEnrollmentId: string | null = null

      if (/^cs_/.test(pid)) {
        // Stripe Checkout Session.
        processor = 'stripe'
        const s: any = await stripeGetSession(pid)
        if (s?._err) {
          processorStatus = s._err
        } else {
          processorStatus = s.payment_status || s.status || 'unknown'
          amount = typeof s.amount_total === 'number' ? s.amount_total / 100 : null
          metaEnrollmentId = s?.metadata?.enrollment_id || s?.client_reference_id || null
          paid = s.payment_status === 'paid'
          confirmedPaymentId = pid
        }
      } else if (/^(tr_|ord_)/.test(pid)) {
        // Mollie payment with a stored id.
        processor = 'mollie'
        const p: any = await mollieGet(`/payments/${pid}`)
        if (p?._err) {
          processorStatus = p._err
        } else {
          processorStatus = p.status || 'unknown'
          amount = p?.amount?.value ? parseFloat(p.amount.value) : null
          metaEnrollmentId = p?.metadata?.enrollment_id || null
          paid = p.status === 'paid'
          confirmedPaymentId = p.id
        }
      } else {
        // No stored id — search the metadata indexes: Mollie first, then the
        // legacy Stripe sessions, matching on metadata.enrollment_id.
        processor = 'none?'
        const mp: any = mollieIndex[r.id]
        const sp: any = stripeIndex.byEnrollment[r.id]
        if (mp) {
          processor = 'mollie'
          processorStatus = mp.status || 'unknown'
          amount = mp?.amount?.value ? parseFloat(mp.amount.value) : null
          metaEnrollmentId = mp?.metadata?.enrollment_id || null
          paid = mp.status === 'paid'
          confirmedPaymentId = mp.id
        } else if (sp) {
          processor = 'stripe'
          processorStatus = sp.payment_status || sp.status || 'unknown'
          amount = typeof sp.amount_total === 'number' ? sp.amount_total / 100 : null
          metaEnrollmentId = sp?.metadata?.enrollment_id || sp?.client_reference_id || null
          paid = sp.payment_status === 'paid'
          confirmedPaymentId = sp.id
        } else {
          processorStatus = 'no_payment_found'
        }
      }

      // Secondary signal (report-only, never auto-activates): a PAID Stripe
      // session under this user's email that we couldn't tie to this exact
      // enrollment by metadata. Surfaces legacy/manual payments for review,
      // unless the user already has access elsewhere.
      let emailMatch: any = null
      if (!(paid && metaEnrollmentId === r.id)) {
        const email = r.user_id ? emailByUser[r.user_id] : undefined
        const hits = email ? (stripeIndex.byEmail[email] || []) : []
        const realHit = hits.find(h => typeof h.amount_total === 'number' && h.amount_total > 0)
        if (realHit && !usersWithAccess.has(r.user_id)) {
          emailMatch = {
            email,
            sessionId: realHit.id,
            amount: realHit.amount_total / 100,
            metadataEnrollmentId: realHit?.metadata?.enrollment_id || realHit?.client_reference_id || null,
          }
        }
      }

      // Activation is only ever for a confirmed-paid payment that maps back to
      // this exact enrollment AND involved real money. €0 sessions (test /
      // comped / 100%-discount) are reported but never auto-activated, so
      // internal test checkouts don't silently grant free access.
      const mapsToThisEnrollment = metaEnrollmentId === r.id
      const isRealMoney = amount != null && amount > 0
      const willActivate = paid && mapsToThisEnrollment && isRealMoney && !dryRun

      if (willActivate) {
        await supabase.from('course_enrollments').update({
          status: 'active',
          mollie_payment_id: confirmedPaymentId || pid,
          amount_paid: amount != null ? String(amount) : r.amount_paid,
          updated_at: new Date().toISOString(),
        }).eq('id', r.id)
        if (r.user_id) {
          const { data: u } = await supabase.from('users').select('role').eq('id', r.user_id).single()
          if (u && u.role === 'participant') {
            await supabase.from('users').update({
              role: 'host', status: 'approved', updated_at: new Date().toISOString(),
            }).eq('id', r.user_id)
          }
        }
        activated++
      }

      const eligible = paid && mapsToThisEnrollment && isRealMoney
      report.push({
        enrollmentId: r.id,
        userId: r.user_id,
        email: r.user_id ? emailByUser[r.user_id] : undefined,
        processor,
        processorStatus,
        paid,
        mapsToThisEnrollment,
        amount,
        isRealMoney,
        confirmedPaymentId,
        emailMatch, // report-only signal for legacy/manual review
        action: willActivate ? 'ACTIVATED' : (eligible ? 'WOULD_ACTIVATE' : (paid && !isRealMoney ? 'zero_amount_skipped' : 'left_pending')),
      })
    }

    const paidRealMoney = report.filter(x => x.paid && x.mapsToThisEnrollment && x.isRealMoney).length
    const paidZeroAmount = report.filter(x => x.paid && !x.isRealMoney).length
    const needsReview = report.filter(x => x.emailMatch).length
    return json({
      dryRun,
      totalStuck: report.length,
      confirmedPaidRealMoney: paidRealMoney,
      confirmedPaidZeroAmount: paidZeroAmount,
      needsReviewEmailMatch: needsReview,
      activated,
      stripeKeyPresent: !!STRIPE(),
      mollieKeyPresent: !!MOLLIE(),
      report,
    })
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'unexpected' }, 500)
  }
})
