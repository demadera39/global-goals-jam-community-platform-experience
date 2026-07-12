// Grant access on the learn platform (same Supabase project): entitlements
// gate learn.globalgoalsjam.org, keyed by the programme's product id
// ("verify-capability" — kept verbatim from the platform engine, see the
// ggj-learn repo's src/lib/data.ts).
//
// entitlements.user_id is a uuid FK to auth.users — legacy text ids are
// skipped, and a failure here must never block payment activation itself.
export async function grantLearnEntitlement(supabase: any, userId: string) {
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!userId || !UUID_RE.test(userId)) return
  try {
    const { error } = await supabase.from('entitlements').upsert(
      { user_id: userId, product: 'verify-capability', status: 'active' },
      { onConflict: 'user_id,product' }
    )
    if (error) console.warn('[ENTITLEMENT] upsert failed:', error.message)
  } catch (e) {
    console.warn('[ENTITLEMENT] upsert threw:', (e as Error).message)
  }
}
