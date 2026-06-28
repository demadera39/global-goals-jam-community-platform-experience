-- Allow hosts to remove participants from the Host Dashboard.
--
-- The er_delete policy only allowed auth.role() = 'service_role', so a host's
-- authenticated client DELETE was silently filtered by RLS: PostgREST returned
-- 200 with 0 rows removed and the participant reappeared on refresh.
--
-- The rest of this table's policies are permissive (select/insert/update USING
-- true); align delete with that posture (access is gated in the app layer).

DROP POLICY IF EXISTS "er_delete" ON public.event_registrations;
CREATE POLICY "er_delete" ON public.event_registrations
  FOR DELETE USING (true);
