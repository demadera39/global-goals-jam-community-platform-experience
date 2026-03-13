-- Allow admin users (not just service_role) to delete donations
DROP POLICY IF EXISTS "donations_delete" ON public.donations;
CREATE POLICY "donations_delete" ON public.donations
  FOR DELETE USING (auth.role() = 'service_role' OR is_admin());
