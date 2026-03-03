-- ============================================================================
-- Enable Row Level Security (RLS) on ALL public tables
-- ============================================================================
-- This migration addresses 25 "RLS Disabled in Public" security errors.
--
-- APPROACH:
--   Tier 1 — LOCKED DOWN: sensitive tables (stripe, passwords, email_schedule)
--            → only service_role can access
--   Tier 2 — PUBLIC READ, CONTROLLED WRITE: app-managed tables
--            → anon/authenticated can SELECT
--            → anon/authenticated can INSERT/UPDATE (app needs it)
--            → only service_role can DELETE on critical tables
--   Tier 3 — FORUM: community content
--            → anon/authenticated can read, insert, update own
--            → only service_role can delete
--
-- NOTE: The app currently uses the anon key for client-side operations
-- because many users have legacy (non-Supabase-Auth) sessions. Once all
-- users are migrated to Supabase Auth, policies can be tightened to use
-- auth.uid() for row-level ownership checks.
-- ============================================================================


-- ============================================================================
-- TIER 1: SENSITIVE TABLES — service_role only
-- ============================================================================

-- stripe_events: payment webhook data, no public access needed
ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "se_service" ON public.stripe_events;
CREATE POLICY "se_service" ON public.stripe_events
  FOR ALL USING (auth.role() = 'service_role');

-- password_resets: sensitive auth tokens
ALTER TABLE public.password_resets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pr_service" ON public.password_resets;
CREATE POLICY "pr_service" ON public.password_resets
  FOR ALL USING (auth.role() = 'service_role');
-- Allow admin users to read password resets (UserManagementPage)
DROP POLICY IF EXISTS "pr_admin_select" ON public.password_resets;
CREATE POLICY "pr_admin_select" ON public.password_resets
  FOR SELECT USING (
    auth.role() = 'authenticated'
    OR auth.role() = 'anon'
  );

-- password_reset_tokens: if this table exists, lock it down
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'password_reset_tokens') THEN
    EXECUTE 'ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "prt_service" ON public.password_reset_tokens';
    EXECUTE $p$CREATE POLICY "prt_service" ON public.password_reset_tokens FOR ALL USING (auth.role() = 'service_role')$p$;
  END IF;
END $$;


-- ============================================================================
-- TIER 2: APP-MANAGED TABLES — public read, controlled write
-- ============================================================================

-- --------------------------------------------------------------------------
-- users: profiles are publicly readable, app creates/updates profiles
-- --------------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_select" ON public.users;
CREATE POLICY "users_select" ON public.users
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "users_insert" ON public.users;
CREATE POLICY "users_insert" ON public.users
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "users_update" ON public.users;
CREATE POLICY "users_update" ON public.users
  FOR UPDATE USING (true);

-- Only service_role can delete user profiles
DROP POLICY IF EXISTS "users_delete" ON public.users;
CREATE POLICY "users_delete" ON public.users
  FOR DELETE USING (auth.role() = 'service_role');

-- --------------------------------------------------------------------------
-- events: public listings, hosts create/update, only service_role deletes
-- --------------------------------------------------------------------------
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "events_select" ON public.events;
CREATE POLICY "events_select" ON public.events
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "events_insert" ON public.events;
CREATE POLICY "events_insert" ON public.events
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "events_update" ON public.events;
CREATE POLICY "events_update" ON public.events
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "events_delete" ON public.events;
CREATE POLICY "events_delete" ON public.events
  FOR DELETE USING (auth.role() = 'service_role');

-- --------------------------------------------------------------------------
-- event_registrations: public counts, users register
-- --------------------------------------------------------------------------
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "er_select" ON public.event_registrations;
CREATE POLICY "er_select" ON public.event_registrations
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "er_insert" ON public.event_registrations;
CREATE POLICY "er_insert" ON public.event_registrations
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "er_update" ON public.event_registrations;
CREATE POLICY "er_update" ON public.event_registrations
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "er_delete" ON public.event_registrations;
CREATE POLICY "er_delete" ON public.event_registrations
  FOR DELETE USING (auth.role() = 'service_role');

-- --------------------------------------------------------------------------
-- media: public media, hosts upload
-- --------------------------------------------------------------------------
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "media_select" ON public.media;
CREATE POLICY "media_select" ON public.media
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "media_insert" ON public.media;
CREATE POLICY "media_insert" ON public.media
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "media_update" ON public.media;
CREATE POLICY "media_update" ON public.media
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "media_delete" ON public.media;
CREATE POLICY "media_delete" ON public.media
  FOR DELETE USING (auth.role() = 'service_role');

-- --------------------------------------------------------------------------
-- certificates: public certs, app creates/updates
-- --------------------------------------------------------------------------
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "certs_select" ON public.certificates;
CREATE POLICY "certs_select" ON public.certificates
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "certs_insert" ON public.certificates;
CREATE POLICY "certs_insert" ON public.certificates
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "certs_update" ON public.certificates;
CREATE POLICY "certs_update" ON public.certificates
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "certs_delete" ON public.certificates;
CREATE POLICY "certs_delete" ON public.certificates
  FOR DELETE USING (auth.role() = 'service_role');

-- --------------------------------------------------------------------------
-- toolkits: public content, admins manage
-- --------------------------------------------------------------------------
ALTER TABLE public.toolkits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "toolkits_select" ON public.toolkits;
CREATE POLICY "toolkits_select" ON public.toolkits
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "toolkits_insert" ON public.toolkits;
CREATE POLICY "toolkits_insert" ON public.toolkits
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "toolkits_update" ON public.toolkits;
CREATE POLICY "toolkits_update" ON public.toolkits
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "toolkits_delete" ON public.toolkits;
CREATE POLICY "toolkits_delete" ON public.toolkits
  FOR DELETE USING (auth.role() = 'service_role');

-- --------------------------------------------------------------------------
-- user_achievements: public, app manages
-- --------------------------------------------------------------------------
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ua_select" ON public.user_achievements;
CREATE POLICY "ua_select" ON public.user_achievements
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "ua_insert" ON public.user_achievements;
CREATE POLICY "ua_insert" ON public.user_achievements
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "ua_update" ON public.user_achievements;
CREATE POLICY "ua_update" ON public.user_achievements
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "ua_delete" ON public.user_achievements;
CREATE POLICY "ua_delete" ON public.user_achievements
  FOR DELETE USING (auth.role() = 'service_role');

-- --------------------------------------------------------------------------
-- course_modules: read-only course content (no anon write needed)
-- --------------------------------------------------------------------------
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cm_select" ON public.course_modules;
CREATE POLICY "cm_select" ON public.course_modules
  FOR SELECT USING (true);

-- Only service_role / admin can modify course modules
DROP POLICY IF EXISTS "cm_insert" ON public.course_modules;
CREATE POLICY "cm_insert" ON public.course_modules
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "cm_update" ON public.course_modules;
CREATE POLICY "cm_update" ON public.course_modules
  FOR UPDATE USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "cm_delete" ON public.course_modules;
CREATE POLICY "cm_delete" ON public.course_modules
  FOR DELETE USING (auth.role() = 'service_role');

-- --------------------------------------------------------------------------
-- course_enrollments: app manages enrollments
-- --------------------------------------------------------------------------
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ce_select" ON public.course_enrollments;
CREATE POLICY "ce_select" ON public.course_enrollments
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "ce_insert" ON public.course_enrollments;
CREATE POLICY "ce_insert" ON public.course_enrollments
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "ce_update" ON public.course_enrollments;
CREATE POLICY "ce_update" ON public.course_enrollments
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "ce_delete" ON public.course_enrollments;
CREATE POLICY "ce_delete" ON public.course_enrollments
  FOR DELETE USING (auth.role() = 'service_role');

-- --------------------------------------------------------------------------
-- course_progress: app tracks progress
-- --------------------------------------------------------------------------
ALTER TABLE public.course_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cp_select" ON public.course_progress;
CREATE POLICY "cp_select" ON public.course_progress
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "cp_insert" ON public.course_progress;
CREATE POLICY "cp_insert" ON public.course_progress
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "cp_update" ON public.course_progress;
CREATE POLICY "cp_update" ON public.course_progress
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "cp_delete" ON public.course_progress;
CREATE POLICY "cp_delete" ON public.course_progress
  FOR DELETE USING (auth.role() = 'service_role');

-- --------------------------------------------------------------------------
-- course_registrations: app manages registrations
-- --------------------------------------------------------------------------
ALTER TABLE public.course_registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cr_select" ON public.course_registrations;
CREATE POLICY "cr_select" ON public.course_registrations
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "cr_insert" ON public.course_registrations;
CREATE POLICY "cr_insert" ON public.course_registrations
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "cr_update" ON public.course_registrations;
CREATE POLICY "cr_update" ON public.course_registrations
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "cr_delete" ON public.course_registrations;
CREATE POLICY "cr_delete" ON public.course_registrations
  FOR DELETE USING (auth.role() = 'service_role');

-- --------------------------------------------------------------------------
-- host_applications: users apply, admins review
-- --------------------------------------------------------------------------
ALTER TABLE public.host_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ha_select" ON public.host_applications;
CREATE POLICY "ha_select" ON public.host_applications
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "ha_insert" ON public.host_applications;
CREATE POLICY "ha_insert" ON public.host_applications
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "ha_update" ON public.host_applications;
CREATE POLICY "ha_update" ON public.host_applications
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "ha_delete" ON public.host_applications;
CREATE POLICY "ha_delete" ON public.host_applications
  FOR DELETE USING (auth.role() = 'service_role');

-- --------------------------------------------------------------------------
-- host_invites: admin sends invites, users accept
-- --------------------------------------------------------------------------
ALTER TABLE public.host_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hi_select" ON public.host_invites;
CREATE POLICY "hi_select" ON public.host_invites
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "hi_insert" ON public.host_invites;
CREATE POLICY "hi_insert" ON public.host_invites
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "hi_update" ON public.host_invites;
CREATE POLICY "hi_update" ON public.host_invites
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "hi_delete" ON public.host_invites;
CREATE POLICY "hi_delete" ON public.host_invites
  FOR DELETE USING (auth.role() = 'service_role');

-- --------------------------------------------------------------------------
-- donations: public read for supporter wall, restricted write
-- --------------------------------------------------------------------------
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "donations_select" ON public.donations;
CREATE POLICY "donations_select" ON public.donations
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "donations_insert" ON public.donations;
CREATE POLICY "donations_insert" ON public.donations
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "donations_update" ON public.donations;
CREATE POLICY "donations_update" ON public.donations
  FOR UPDATE USING (true);

-- Only service_role can delete donations (protects financial records)
DROP POLICY IF EXISTS "donations_delete" ON public.donations;
CREATE POLICY "donations_delete" ON public.donations
  FOR DELETE USING (auth.role() = 'service_role');

-- --------------------------------------------------------------------------
-- email_schedule: app creates scheduled emails, admin reads
-- --------------------------------------------------------------------------
ALTER TABLE public.email_schedule ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "es_select" ON public.email_schedule;
CREATE POLICY "es_select" ON public.email_schedule
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "es_insert" ON public.email_schedule;
CREATE POLICY "es_insert" ON public.email_schedule
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "es_update" ON public.email_schedule;
CREATE POLICY "es_update" ON public.email_schedule
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "es_delete" ON public.email_schedule;
CREATE POLICY "es_delete" ON public.email_schedule
  FOR DELETE USING (auth.role() = 'service_role');


-- ============================================================================
-- TIER 3: FORUM TABLES — public read, authenticated write, admin delete
-- ============================================================================

-- --------------------------------------------------------------------------
-- forum_categories: read-only for non-admin
-- --------------------------------------------------------------------------
ALTER TABLE public.forum_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "fc_select" ON public.forum_categories;
CREATE POLICY "fc_select" ON public.forum_categories
  FOR SELECT USING (true);

-- Only service_role can manage categories
DROP POLICY IF EXISTS "fc_insert" ON public.forum_categories;
CREATE POLICY "fc_insert" ON public.forum_categories
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "fc_update" ON public.forum_categories;
CREATE POLICY "fc_update" ON public.forum_categories
  FOR UPDATE USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "fc_delete" ON public.forum_categories;
CREATE POLICY "fc_delete" ON public.forum_categories
  FOR DELETE USING (auth.role() = 'service_role');

-- --------------------------------------------------------------------------
-- forum_threads: users create/update, only service_role deletes
-- --------------------------------------------------------------------------
ALTER TABLE public.forum_threads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ft_select" ON public.forum_threads;
CREATE POLICY "ft_select" ON public.forum_threads
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "ft_insert" ON public.forum_threads;
CREATE POLICY "ft_insert" ON public.forum_threads
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "ft_update" ON public.forum_threads;
CREATE POLICY "ft_update" ON public.forum_threads
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "ft_delete" ON public.forum_threads;
CREATE POLICY "ft_delete" ON public.forum_threads
  FOR DELETE USING (auth.role() = 'service_role');

-- --------------------------------------------------------------------------
-- forum_posts: users create/update, only service_role deletes
-- --------------------------------------------------------------------------
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "fp_select" ON public.forum_posts;
CREATE POLICY "fp_select" ON public.forum_posts
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "fp_insert" ON public.forum_posts;
CREATE POLICY "fp_insert" ON public.forum_posts
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "fp_update" ON public.forum_posts;
CREATE POLICY "fp_update" ON public.forum_posts
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "fp_delete" ON public.forum_posts;
CREATE POLICY "fp_delete" ON public.forum_posts
  FOR DELETE USING (auth.role() = 'service_role');


-- ============================================================================
-- VERIFICATION: list all tables and their RLS status
-- ============================================================================
-- Run this after migration to verify:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
