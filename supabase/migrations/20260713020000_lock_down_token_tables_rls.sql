-- Security sweep: three public tables had RLS disabled (Supabase advisor ERRORs).
--
-- 1) email_verification_tokens / magic_link_tokens — legacy tables from an old
--    auth experiment, referenced NOWHERE in the main site, Learn platform, or
--    any edge function. With RLS off and full anon grants, anyone holding the
--    public anon key could read or forge auth tokens via PostgREST. Lock them
--    down completely: enable RLS with no policies and revoke API-role access.
--    (service_role bypasses RLS, so nothing legitimate breaks.)
ALTER TABLE public.email_verification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.magic_link_tokens ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.email_verification_tokens FROM anon, authenticated;
REVOKE ALL ON public.magic_link_tokens FROM anon, authenticated;

-- 2) jam_highlights — read by the public homepage carousel and written from
--    the admin highlights page, which authenticates at the app layer (the
--    site's custom auth), not via Supabase Auth. Enable RLS with permissive
--    policies to match the architecture used across the rest of this schema.
ALTER TABLE public.jam_highlights ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS jam_highlights_select ON public.jam_highlights;
DROP POLICY IF EXISTS jam_highlights_write ON public.jam_highlights;
CREATE POLICY jam_highlights_select ON public.jam_highlights FOR SELECT USING (true);
CREATE POLICY jam_highlights_write ON public.jam_highlights FOR ALL USING (true) WITH CHECK (true);
