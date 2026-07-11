-- ============================================================================
-- Community spaces — re-imagine the forum as the network hub
-- ============================================================================
-- The forum tables exist but the community is dead: zero threads, zero posts,
-- and a duplicated category list (two "General Discussion", two "Q&A", ...).
-- This migration:
--   1. Restores server-side id defaults on forum_threads / forum_posts.
--      Like events.id (20260521120000) and event_registrations.id
--      (20260629000000), these text PKs lost their uuid default during the
--      Blink migration, so any insert that omits `id` fails with 23502.
--   2. Removes the duplicate seed categories (only when they hold no threads).
--   3. Seeds five stable "spaces" with human-readable text ids (the id acts
--      as the slug — the table's PK is text, so no new column is needed):
--        start-here, introductions, jam-planning (host-only), show-your-jam,
--        methods-facilitation
--      and re-orders the surviving legacy categories after them.
--   4. Re-asserts the permissive RLS posture on threads/posts (same pattern
--      as er_insert etc.): the app signs requests with the anon key even for
--      logged-in users (legacy localStorage sessions), so SELECT/INSERT/UPDATE
--      must stay `true` — access is gated in the app layer (route guard +
--      is_host_only checks). DELETE stays service_role-only.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. id defaults (gen_random_uuid() is core pg13+, no extension needed)
-- ----------------------------------------------------------------------------
ALTER TABLE public.forum_threads
  ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;

ALTER TABLE public.forum_posts
  ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;

-- New threads should sort sensibly by activity even before their first reply.
ALTER TABLE public.forum_threads
  ALTER COLUMN last_reply_at SET DEFAULT now();

-- ----------------------------------------------------------------------------
-- 2. Drop the duplicated 2025-08-14 seed batch (cat_*) — defensively: only
--    when no thread references them. The first batch (general, qa, ...) stays.
-- ----------------------------------------------------------------------------
DELETE FROM public.forum_categories c
WHERE c.id IN ('cat_general', 'cat_best_practices', 'cat_host_only', 'cat_qa')
  AND NOT EXISTS (
    SELECT 1 FROM public.forum_threads t WHERE t.category_id = c.id
  );

-- ----------------------------------------------------------------------------
-- 3. Seed the community spaces (idempotent upsert by stable id)
-- ----------------------------------------------------------------------------
INSERT INTO public.forum_categories (id, name, description, is_host_only, sort_order)
VALUES
  ('start-here',           'Start here',             'New to the network? How this space works, and your first steps.',            false, 1),
  ('introductions',        'Introductions',          'Who you are, where you jam, and what you care about.',                       false, 2),
  ('jam-planning',         'Jam planning',           'Host-only: plan, prepare and troubleshoot your upcoming jam.',               true,  3),
  ('show-your-jam',        'Show your jam',          'Photos, prototypes and results from jams around the world.',                 false, 4),
  ('methods-facilitation', 'Methods & facilitation', 'Swap methods, agendas and facilitation techniques that worked.',             false, 5)
ON CONFLICT (id) DO UPDATE SET
  name         = EXCLUDED.name,
  description  = EXCLUDED.description,
  is_host_only = EXCLUDED.is_host_only,
  sort_order   = EXCLUDED.sort_order;

-- Legacy categories keep working but move below the new spaces.
UPDATE public.forum_categories AS c
SET sort_order = v.new_order
FROM (VALUES
  ('general',        10),
  ('qa',             11),
  ('best-practices', 12),
  ('collaboration',  13),
  ('host-only',      14)
) AS v(id, new_order)
WHERE c.id = v.id;

-- ----------------------------------------------------------------------------
-- 4. RLS posture (re-asserted so intent is documented in-migration).
--    Matches the permissive pattern of er_insert / er_select: the client uses
--    the anon key for signed-in legacy sessions, so these cannot require
--    auth.uid(). Deletes remain service_role-only (no delete UI exists).
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "ft_select" ON public.forum_threads;
CREATE POLICY "ft_select" ON public.forum_threads
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "ft_insert" ON public.forum_threads;
CREATE POLICY "ft_insert" ON public.forum_threads
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "ft_update" ON public.forum_threads;
CREATE POLICY "ft_update" ON public.forum_threads
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "fp_select" ON public.forum_posts;
CREATE POLICY "fp_select" ON public.forum_posts
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "fp_insert" ON public.forum_posts;
CREATE POLICY "fp_insert" ON public.forum_posts
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "fp_update" ON public.forum_posts;
CREATE POLICY "fp_update" ON public.forum_posts
  FOR UPDATE USING (true);
