-- Deduplicate leftover legacy user accounts from the Blink → Supabase migration.
--
-- Some people ended up with TWO public.users rows for the same email:
--   * a legacy row with a non-UUID id (e.g. "user_1772..." or a Firebase-style id)
--   * a current Supabase-auth row with a UUID id (the identity they actually log in as)
--
-- Because the app resolves the signed-in profile strictly by auth.uid() (always a
-- UUID), the legacy row can never be the active login — it is dead weight that only
-- causes email-collision problems (e.g. j.woelm@hamburg.de appearing as both a
-- "participant" and a "host", and blocking unique-email operations).
--
-- This migration removes ONLY legacy duplicate rows that are completely safe to drop:
--   (a) the id is NOT a UUID (legacy format), AND
--   (b) a UUID-id row exists for the same email (the real auth account), AND
--   (c) the legacy row owns no related data (enrollments, registrations, events,
--       certificates, course progress, achievements, uploaded media).
--
-- Rows that own data are intentionally preserved so nothing is lost; those need a
-- manual merge instead. As of writing, only the empty j.woelm@hamburg.de legacy
-- row matches all conditions.

DELETE FROM public.users legacy
WHERE
  -- (a) legacy (non-UUID) id
  legacy.id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  -- (b) a real Supabase-auth (UUID) row exists for the same email
  AND EXISTS (
    SELECT 1 FROM public.users canon
    WHERE lower(canon.email) = lower(legacy.email)
      AND canon.id <> legacy.id
      AND canon.id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  )
  -- (c) the legacy row owns no data
  AND NOT EXISTS (SELECT 1 FROM public.course_enrollments  e  WHERE e.user_id        = legacy.id)
  AND NOT EXISTS (SELECT 1 FROM public.event_registrations r  WHERE r.participant_id  = legacy.id)
  AND NOT EXISTS (SELECT 1 FROM public.events             ev WHERE ev.host_id        = legacy.id)
  AND NOT EXISTS (SELECT 1 FROM public.certificates       c  WHERE c.recipient_id     = legacy.id)
  AND NOT EXISTS (SELECT 1 FROM public.course_progress    cp WHERE cp.user_id         = legacy.id)
  AND NOT EXISTS (SELECT 1 FROM public.user_achievements  ua WHERE ua.user_id         = legacy.id)
  AND NOT EXISTS (SELECT 1 FROM public.media              m  WHERE m.uploaded_by      = legacy.id);
