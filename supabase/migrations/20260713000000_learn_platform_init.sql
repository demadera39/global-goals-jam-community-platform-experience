-- ════════════════════════════════════════════════════════════════
-- AI Capability Academy — full schema setup (fresh Supabase project)
-- HOW TO RUN: open the Supabase dashboard → SQL Editor → New query,
-- copy-paste the WHOLE contents of this file, press Run. Run once.
-- (schema.sql already contains migrations v2–v16 consolidated;
--  v17 adds the academy tables: entitlements, capability_scans,
--  live_sessions, journal module_letter.)
-- ════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────
-- TDRA UX Lab — consolidated database schema
--
-- Run this once on a fresh Supabase Postgres database (SQL editor or
-- psql) to create every table, policy, and function the platform needs.
-- It is the 16 incremental migrations concatenated in order; running
-- it top to bottom is equivalent to applying them sequentially.
--
-- Individual migrations are kept in ./migrations/ for reference.
-- ─────────────────────────────────────────────────────────────────


-- ═══════════════════════════════════════════════════════════════
-- supabase-migration.sql
-- ═══════════════════════════════════════════════════════════════
-- ============================================================
-- TDRA UX Lab Learning Platform — Supabase Database Migration
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- ==========================================
-- 1. PROFILES (extends auth.users)
-- ==========================================
CREATE TABLE public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL DEFAULT '',
  email       TEXT NOT NULL DEFAULT '',
  avatar      TEXT NOT NULL DEFAULT '',
  role         TEXT NOT NULL DEFAULT 'participant'
               CHECK (role IN ('participant', 'facilitator', 'admin')),
  organization TEXT NOT NULL DEFAULT '',
  "function"   TEXT NOT NULL DEFAULT '',
  avatar_url   TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);


-- ==========================================
-- 2. LESSON PROGRESS
-- ==========================================
CREATE TABLE public.lesson_progress (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lesson_id    TEXT NOT NULL,
  completed    BOOLEAN NOT NULL DEFAULT false,
  notes        TEXT DEFAULT '',
  completed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own progress"
  ON public.lesson_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON public.lesson_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON public.lesson_progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);


-- ==========================================
-- 3. DISCUSSIONS
-- ==========================================
CREATE TABLE public.discussions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content       TEXT NOT NULL,
  tags          TEXT[] NOT NULL DEFAULT '{}',
  module_id     TEXT,
  likes_count   INT NOT NULL DEFAULT 0,
  replies_count INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.discussions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Discussions are viewable by authenticated users"
  ON public.discussions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create discussions"
  ON public.discussions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update own discussions"
  ON public.discussions FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id);

CREATE POLICY "Authors can delete own discussions"
  ON public.discussions FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);


-- ==========================================
-- 4. DISCUSSION REPLIES
-- ==========================================
CREATE TABLE public.discussion_replies (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id UUID NOT NULL REFERENCES public.discussions(id) ON DELETE CASCADE,
  author_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content       TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.discussion_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Replies are viewable by authenticated users"
  ON public.discussion_replies FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create replies"
  ON public.discussion_replies FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can delete own replies"
  ON public.discussion_replies FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);


-- ==========================================
-- 5. DISCUSSION LIKES
-- ==========================================
CREATE TABLE public.discussion_likes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id UUID NOT NULL REFERENCES public.discussions(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(discussion_id, user_id)
);

ALTER TABLE public.discussion_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Likes are viewable by authenticated users"
  ON public.discussion_likes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own likes"
  ON public.discussion_likes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes"
  ON public.discussion_likes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);


-- ==========================================
-- 6. INDEXES
-- ==========================================
CREATE INDEX idx_lesson_progress_user ON public.lesson_progress(user_id);
CREATE INDEX idx_discussions_created ON public.discussions(created_at DESC);
CREATE INDEX idx_discussions_tags ON public.discussions USING GIN(tags);
CREATE INDEX idx_discussion_replies_discussion ON public.discussion_replies(discussion_id);
CREATE INDEX idx_discussion_likes_discussion ON public.discussion_likes(discussion_id);
CREATE INDEX idx_discussion_likes_user ON public.discussion_likes(user_id);


-- ==========================================
-- 7. TRIGGERS
-- ==========================================

-- Auto-create profile when a new user signs up
CREATE OR REPLACE FUNCTION public.learn_handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, avatar, role, organization, "function", avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    NEW.email,
    UPPER(
      LEFT(COALESCE(NEW.raw_user_meta_data->>'name', NEW.email), 1) ||
      COALESCE(
        LEFT(SPLIT_PART(COALESCE(NEW.raw_user_meta_data->>'name', ''), ' ', 2), 1),
        ''
      )
    ),
    COALESCE(NEW.raw_user_meta_data->>'role', 'participant'),
    COALESCE(NEW.raw_user_meta_data->>'organization', ''),
    COALESCE(NEW.raw_user_meta_data->>'function', ''),
    ''
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created_learn
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.learn_handle_new_user();


-- Auto-update likes_count on discussions
CREATE OR REPLACE FUNCTION public.update_likes_count()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.discussions SET likes_count = likes_count + 1 WHERE id = NEW.discussion_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.discussions SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.discussion_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_like_change
  AFTER INSERT OR DELETE ON public.discussion_likes
  FOR EACH ROW EXECUTE FUNCTION public.update_likes_count();


-- Auto-update replies_count on discussions
CREATE OR REPLACE FUNCTION public.update_replies_count()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.discussions SET replies_count = replies_count + 1 WHERE id = NEW.discussion_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.discussions SET replies_count = GREATEST(replies_count - 1, 0) WHERE id = OLD.discussion_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_reply_change
  AFTER INSERT OR DELETE ON public.discussion_replies
  FOR EACH ROW EXECUTE FUNCTION public.update_replies_count();


-- ═══════════════════════════════════════════════════════════════
-- supabase-migration-v2.sql
-- ═══════════════════════════════════════════════════════════════
-- ============================================================
-- TDRA UX Lab Learning Platform — Supplementary Migration (v2)
-- Run this AFTER supabase-migration.sql in Supabase SQL Editor
-- ============================================================

-- ==========================================
-- 1. AVATAR URL on profiles
-- ==========================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT '';


-- ==========================================
-- 2. SUPABASE STORAGE: avatars bucket
-- ==========================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Anyone can view avatar images (public bucket)
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'avatars');

-- Users can upload their own avatar (path: avatars/{user_id}/...)
CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can overwrite their own avatar
CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can delete their own avatar
CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );


-- ==========================================
-- 3. COMMUNITY MODERATION: facilitator/admin delete powers
-- ==========================================

-- Replace author-only discussion delete with author + facilitator/admin
DROP POLICY IF EXISTS "Authors can delete own discussions" ON public.discussions;

CREATE POLICY "Authors and facilitators can delete discussions"
  ON public.discussions FOR DELETE
  TO authenticated
  USING (
    auth.uid() = author_id
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('facilitator', 'admin')
    )
  );

-- Replace author-only reply delete with author + facilitator/admin
DROP POLICY IF EXISTS "Authors can delete own replies" ON public.discussion_replies;

CREATE POLICY "Authors and facilitators can delete replies"
  ON public.discussion_replies FOR DELETE
  TO authenticated
  USING (
    auth.uid() = author_id
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('facilitator', 'admin')
    )
  );


-- ═══════════════════════════════════════════════════════════════
-- supabase-migration-v3.sql
-- ═══════════════════════════════════════════════════════════════
-- ============================================================
-- TDRA UX Lab Learning Platform — Migration v3
-- Replace "team" with "organization" + "function"
-- Run AFTER supabase-migration.sql and supabase-migration-v2.sql
-- ============================================================

-- ==========================================
-- 1. Add new columns
-- ==========================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS organization TEXT NOT NULL DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS "function" TEXT NOT NULL DEFAULT '';

-- ==========================================
-- 2. Drop team column
-- ==========================================
ALTER TABLE public.profiles DROP COLUMN IF EXISTS team;

-- ==========================================
-- 3. Update trigger to use organization + function
-- ==========================================
CREATE OR REPLACE FUNCTION public.learn_handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, avatar, role, organization, "function", avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    NEW.email,
    UPPER(
      LEFT(COALESCE(NEW.raw_user_meta_data->>'name', NEW.email), 1) ||
      COALESCE(
        LEFT(SPLIT_PART(COALESCE(NEW.raw_user_meta_data->>'name', ''), ' ', 2), 1),
        ''
      )
    ),
    COALESCE(NEW.raw_user_meta_data->>'role', 'participant'),
    COALESCE(NEW.raw_user_meta_data->>'organization', ''),
    COALESCE(NEW.raw_user_meta_data->>'function', ''),
    ''
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ═══════════════════════════════════════════════════════════════
-- supabase-migration-v4.sql
-- ═══════════════════════════════════════════════════════════════
-- ============================================================
-- TDRA UX Lab Learning Platform — Migration v4
-- Add Announcements + Announcement Replies
-- Run AFTER supabase-migration.sql, v2, and v3
-- ============================================================

-- ==========================================
-- 1. Helper: check facilitator / admin role
-- ==========================================
CREATE OR REPLACE FUNCTION public.is_facilitator_or_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('facilitator', 'admin')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;


-- ==========================================
-- 2. ANNOUNCEMENTS table
-- ==========================================
CREATE TABLE public.announcements (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  content       TEXT NOT NULL,
  replies_count INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Announcements are viewable by authenticated users"
  ON public.announcements FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Facilitators and admins can create announcements"
  ON public.announcements FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = author_id
    AND public.is_facilitator_or_admin()
  );

CREATE POLICY "Authors can update own announcements"
  ON public.announcements FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id);

CREATE POLICY "Authors and facilitators can delete announcements"
  ON public.announcements FOR DELETE
  TO authenticated
  USING (
    auth.uid() = author_id
    OR public.is_facilitator_or_admin()
  );


-- ==========================================
-- 3. ANNOUNCEMENT REPLIES table
-- ==========================================
CREATE TABLE public.announcement_replies (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  author_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content         TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.announcement_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Announcement replies are viewable by authenticated users"
  ON public.announcement_replies FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create announcement replies"
  ON public.announcement_replies FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors and facilitators can delete announcement replies"
  ON public.announcement_replies FOR DELETE
  TO authenticated
  USING (
    auth.uid() = author_id
    OR public.is_facilitator_or_admin()
  );


-- ==========================================
-- 4. INDEXES
-- ==========================================
CREATE INDEX idx_announcements_created ON public.announcements(created_at DESC);
CREATE INDEX idx_announcement_replies_announcement ON public.announcement_replies(announcement_id);


-- ==========================================
-- 5. TRIGGER: auto-update replies_count
-- ==========================================
CREATE OR REPLACE FUNCTION public.update_announcement_replies_count()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.announcements SET replies_count = replies_count + 1
    WHERE id = NEW.announcement_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.announcements SET replies_count = GREATEST(replies_count - 1, 0)
    WHERE id = OLD.announcement_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_announcement_reply_change
  AFTER INSERT OR DELETE ON public.announcement_replies
  FOR EACH ROW EXECUTE FUNCTION public.update_announcement_replies_count();


-- ═══════════════════════════════════════════════════════════════
-- supabase-migration-v5.sql
-- ═══════════════════════════════════════════════════════════════
-- =====================================================================
--  TDRA UX Lab – Migration V5: Learning Journal & Reflection System
-- =====================================================================
-- Run in Supabase SQL Editor after v4.

-- ── Journal Entries table ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.journal_entries (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lesson_id   TEXT NOT NULL,
  prompt_key  TEXT NOT NULL,          -- stable ID: block-id or lesson-id-pN
  prompt_text TEXT NOT NULL,          -- the reflection question
  response    TEXT NOT NULL DEFAULT '',
  is_shared   BOOLEAN NOT NULL DEFAULT false,  -- opt-in anonymous peer sharing
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, lesson_id, prompt_key)
);

ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

-- Users can read their own entries
DROP POLICY IF EXISTS "journal_select_own" ON public.journal_entries;
CREATE POLICY "journal_select_own" ON public.journal_entries
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own entries
DROP POLICY IF EXISTS "journal_insert_own" ON public.journal_entries;
CREATE POLICY "journal_insert_own" ON public.journal_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own entries
DROP POLICY IF EXISTS "journal_update_own" ON public.journal_entries;
CREATE POLICY "journal_update_own" ON public.journal_entries
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own entries
DROP POLICY IF EXISTS "journal_delete_own" ON public.journal_entries;
CREATE POLICY "journal_delete_own" ON public.journal_entries
  FOR DELETE USING (auth.uid() = user_id);

-- Facilitators/admins can read shared entries (for insights dashboard)
DROP POLICY IF EXISTS "journal_select_shared" ON public.journal_entries;
CREATE POLICY "journal_select_shared" ON public.journal_entries
  FOR SELECT USING (
    is_shared = true AND public.is_facilitator_or_admin()
  );

-- ── Indexes ──────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_journal_user    ON public.journal_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_journal_lesson  ON public.journal_entries(lesson_id);
CREATE INDEX IF NOT EXISTS idx_journal_shared  ON public.journal_entries(is_shared) WHERE is_shared = true;

-- ── Helper: set_updated_at() — create if not exists ────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── Updated-at trigger ───────────────────────────────────────────────
DROP TRIGGER IF EXISTS set_journal_entries_updated_at ON public.journal_entries;
CREATE TRIGGER set_journal_entries_updated_at
  BEFORE UPDATE ON public.journal_entries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Peer reflection counts view (for showing "X peers reflected") ───
CREATE OR REPLACE VIEW public.journal_peer_counts AS
SELECT
  lesson_id,
  prompt_key,
  COUNT(DISTINCT user_id) AS peer_count
FROM public.journal_entries
WHERE is_shared = true AND response <> ''
GROUP BY lesson_id, prompt_key;

-- Grant access to the view
GRANT SELECT ON public.journal_peer_counts TO authenticated;

-- =====================================================================
--  Done! Learning Journal system is ready.
-- =====================================================================


-- ═══════════════════════════════════════════════════════════════
-- supabase-migration-v6.sql
-- ═══════════════════════════════════════════════════════════════
-- ═══════════════════════════════════════════════════════════════════
-- Migration v6: Session Links (admin-managed Zoom & Miro URLs)
-- ═══════════════════════════════════════════════════════════════════
-- Run this in the Supabase SQL Editor after v5.

-- ── Table: session_links ─────────────────────────────────────────
-- Stores admin-managed links (Zoom, Miro boards, recordings) for live sessions.
-- session_id maps to the static LiveSession id in data.ts (e.g. "ls-bc-1").
CREATE TABLE IF NOT EXISTS public.session_links (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id    TEXT NOT NULL,               -- matches LiveSession.id in data.ts
  link_type     TEXT NOT NULL CHECK (link_type IN ('zoom', 'miro', 'recording', 'other')),
  label         TEXT NOT NULL DEFAULT '',     -- e.g. "Ecosystem Mapping Board", "Day 1 Zoom"
  url           TEXT NOT NULL,
  sort_order    INT NOT NULL DEFAULT 0,       -- for ordering multiple Miro boards
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now(),
  created_by    UUID REFERENCES auth.users(id)
);

-- ── Indexes ──────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_session_links_session
  ON public.session_links (session_id);

-- ── Updated-at trigger ──────────────────────────────────────────
-- Reuses the set_updated_at() function from v5.
CREATE TRIGGER session_links_updated_at
  BEFORE UPDATE ON public.session_links
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Row Level Security ──────────────────────────────────────────
ALTER TABLE public.session_links ENABLE ROW LEVEL SECURITY;

-- Everyone can read session links (participants need to see Zoom/Miro URLs)
CREATE POLICY "Anyone can read session links"
  ON public.session_links FOR SELECT
  USING (true);

-- Only facilitators/admins can insert
CREATE POLICY "Facilitators can insert session links"
  ON public.session_links FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('facilitator', 'admin')
    )
  );

-- Only facilitators/admins can update
CREATE POLICY "Facilitators can update session links"
  ON public.session_links FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('facilitator', 'admin')
    )
  );

-- Only facilitators/admins can delete
CREATE POLICY "Facilitators can delete session links"
  ON public.session_links FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('facilitator', 'admin')
    )
  );


-- ═══════════════════════════════════════════════════════════════
-- supabase-migration-v7.sql
-- ═══════════════════════════════════════════════════════════════
-- =====================================================================
--  TDRA UX Lab – Migration V7: Lesson Notes & Lesson Discussions
-- =====================================================================
-- Run in Supabase SQL Editor after v6.

-- ── Lesson Notes (timestamped notes on video/audio) ─────────────────
CREATE TABLE IF NOT EXISTS public.lesson_notes (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lesson_id          TEXT NOT NULL,
  timestamp_seconds  INTEGER,                        -- NULL = note without timestamp
  body               TEXT NOT NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.lesson_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lesson_notes_select_own" ON public.lesson_notes;
CREATE POLICY "lesson_notes_select_own" ON public.lesson_notes
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "lesson_notes_insert_own" ON public.lesson_notes;
CREATE POLICY "lesson_notes_insert_own" ON public.lesson_notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "lesson_notes_update_own" ON public.lesson_notes;
CREATE POLICY "lesson_notes_update_own" ON public.lesson_notes
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "lesson_notes_delete_own" ON public.lesson_notes;
CREATE POLICY "lesson_notes_delete_own" ON public.lesson_notes
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_lesson_notes_user_lesson
  ON public.lesson_notes(user_id, lesson_id);

DROP TRIGGER IF EXISTS set_lesson_notes_updated_at ON public.lesson_notes;
CREATE TRIGGER set_lesson_notes_updated_at
  BEFORE UPDATE ON public.lesson_notes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Lesson Discussions (per-lesson cohort threads) ──────────────────
CREATE TABLE IF NOT EXISTS public.lesson_discussions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id      TEXT NOT NULL,
  author_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content        TEXT NOT NULL,
  is_anonymous   BOOLEAN NOT NULL DEFAULT false,
  likes_count    INT NOT NULL DEFAULT 0,
  replies_count  INT NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.lesson_discussion_replies (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id  UUID NOT NULL REFERENCES public.lesson_discussions(id) ON DELETE CASCADE,
  author_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content        TEXT NOT NULL,
  is_anonymous   BOOLEAN NOT NULL DEFAULT false,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.lesson_discussion_likes (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id  UUID NOT NULL REFERENCES public.lesson_discussions(id) ON DELETE CASCADE,
  user_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (discussion_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_lesson_discussions_lesson ON public.lesson_discussions(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_discussions_author ON public.lesson_discussions(author_id);
CREATE INDEX IF NOT EXISTS idx_lesson_discussion_replies_discussion ON public.lesson_discussion_replies(discussion_id);
CREATE INDEX IF NOT EXISTS idx_lesson_discussion_likes_discussion ON public.lesson_discussion_likes(discussion_id);

ALTER TABLE public.lesson_discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_discussion_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_discussion_likes ENABLE ROW LEVEL SECURITY;

-- lesson_discussions policies
DROP POLICY IF EXISTS "lesson_discussions_select_all" ON public.lesson_discussions;
CREATE POLICY "lesson_discussions_select_all" ON public.lesson_discussions
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "lesson_discussions_insert_own" ON public.lesson_discussions;
CREATE POLICY "lesson_discussions_insert_own" ON public.lesson_discussions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "lesson_discussions_update_own" ON public.lesson_discussions;
CREATE POLICY "lesson_discussions_update_own" ON public.lesson_discussions
  FOR UPDATE TO authenticated USING (auth.uid() = author_id);

DROP POLICY IF EXISTS "lesson_discussions_delete_own" ON public.lesson_discussions;
CREATE POLICY "lesson_discussions_delete_own" ON public.lesson_discussions
  FOR DELETE TO authenticated USING (auth.uid() = author_id);

-- lesson_discussion_replies policies
DROP POLICY IF EXISTS "lesson_discussion_replies_select_all" ON public.lesson_discussion_replies;
CREATE POLICY "lesson_discussion_replies_select_all" ON public.lesson_discussion_replies
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "lesson_discussion_replies_insert_own" ON public.lesson_discussion_replies;
CREATE POLICY "lesson_discussion_replies_insert_own" ON public.lesson_discussion_replies
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "lesson_discussion_replies_delete_own" ON public.lesson_discussion_replies;
CREATE POLICY "lesson_discussion_replies_delete_own" ON public.lesson_discussion_replies
  FOR DELETE TO authenticated USING (auth.uid() = author_id);

-- lesson_discussion_likes policies
DROP POLICY IF EXISTS "lesson_discussion_likes_select_all" ON public.lesson_discussion_likes;
CREATE POLICY "lesson_discussion_likes_select_all" ON public.lesson_discussion_likes
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "lesson_discussion_likes_insert_own" ON public.lesson_discussion_likes;
CREATE POLICY "lesson_discussion_likes_insert_own" ON public.lesson_discussion_likes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "lesson_discussion_likes_delete_own" ON public.lesson_discussion_likes;
CREATE POLICY "lesson_discussion_likes_delete_own" ON public.lesson_discussion_likes
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ── Count triggers ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_lesson_discussion_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.lesson_discussions SET likes_count = likes_count + 1 WHERE id = NEW.discussion_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.lesson_discussions SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.discussion_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS lesson_discussion_likes_count_trigger ON public.lesson_discussion_likes;
CREATE TRIGGER lesson_discussion_likes_count_trigger
  AFTER INSERT OR DELETE ON public.lesson_discussion_likes
  FOR EACH ROW EXECUTE FUNCTION public.update_lesson_discussion_likes_count();

CREATE OR REPLACE FUNCTION public.update_lesson_discussion_replies_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.lesson_discussions SET replies_count = replies_count + 1 WHERE id = NEW.discussion_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.lesson_discussions SET replies_count = GREATEST(replies_count - 1, 0) WHERE id = OLD.discussion_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS lesson_discussion_replies_count_trigger ON public.lesson_discussion_replies;
CREATE TRIGGER lesson_discussion_replies_count_trigger
  AFTER INSERT OR DELETE ON public.lesson_discussion_replies
  FOR EACH ROW EXECUTE FUNCTION public.update_lesson_discussion_replies_count();

DROP TRIGGER IF EXISTS set_lesson_discussions_updated_at ON public.lesson_discussions;
CREATE TRIGGER set_lesson_discussions_updated_at
  BEFORE UPDATE ON public.lesson_discussions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =====================================================================
--  Done! Lesson-scoped notes + discussions are ready.
-- =====================================================================


-- ═══════════════════════════════════════════════════════════════
-- supabase-migration-v8.sql
-- ═══════════════════════════════════════════════════════════════
-- =====================================================================
--  TDRA UX Lab – Migration V8: Worksheets (lightweight)
-- =====================================================================
-- Adds a `kind` column to journal_entries so worksheet answers can be
-- stored in the same table without polluting reflection metrics.
--
-- Worksheet answers are stored as journal_entries rows with:
--   kind        = 'worksheet'
--   prompt_key  = 'ws:{worksheet_key}:{question_key}'
--   prompt_text = the question text
--   response    = the user's answer
--
-- Existing reflection code is unaffected — `kind` defaults to 'reflection'.
-- Run in Supabase SQL Editor after v7.

ALTER TABLE public.journal_entries
  ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'reflection';

CREATE INDEX IF NOT EXISTS idx_journal_kind
  ON public.journal_entries(kind);

-- Keep reflection-only peer counts: rebuild the view to filter out worksheets.
DROP VIEW IF EXISTS public.journal_peer_counts;
CREATE VIEW public.journal_peer_counts AS
SELECT
  lesson_id,
  prompt_key,
  COUNT(DISTINCT user_id) AS peer_count
FROM public.journal_entries
WHERE kind = 'reflection'
  AND is_shared = true
  AND response <> ''
GROUP BY lesson_id, prompt_key;

GRANT SELECT ON public.journal_peer_counts TO authenticated;

-- =====================================================================
--  Done! Worksheets live in journal_entries alongside reflections.
-- =====================================================================


-- ═══════════════════════════════════════════════════════════════
-- supabase-migration-v9.sql
-- ═══════════════════════════════════════════════════════════════
-- =====================================================================
--  TDRA UX Lab – Migration V9: Facilitator (AI Companion)
-- =====================================================================
-- Persists conversations with the AI Facilitator so learners can resume
-- threads across sessions. Each row is ONE message in a conversation.
--
-- A "conversation" is scoped by:
--   - user_id (always)
--   - surface ('lesson' | 'worksheet' | 'journal' | 'global')
--   - lesson_id (nullable for 'global' and 'journal' surfaces)
--
-- Run in Supabase SQL Editor after v8.

-- ── Table: facilitator_conversations ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.facilitator_conversations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  surface      TEXT NOT NULL DEFAULT 'lesson'
                CHECK (surface IN ('lesson', 'worksheet', 'journal', 'global')),
  lesson_id    TEXT,
  title        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_facilitator_conv_user
  ON public.facilitator_conversations(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_facilitator_conv_lesson
  ON public.facilitator_conversations(user_id, lesson_id, surface);

ALTER TABLE public.facilitator_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY facilitator_conv_select_own
  ON public.facilitator_conversations FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY facilitator_conv_insert_own
  ON public.facilitator_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY facilitator_conv_update_own
  ON public.facilitator_conversations FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY facilitator_conv_delete_own
  ON public.facilitator_conversations FOR DELETE
  USING (auth.uid() = user_id);

-- ── Table: facilitator_messages ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.facilitator_messages (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id  UUID NOT NULL REFERENCES public.facilitator_conversations(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role             TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content          TEXT NOT NULL,
  -- Structured metadata for special messages (e.g. worksheet review cards).
  -- For role='assistant' with a review, shape: { kind: 'review', strong: [...], thin: [...], question: '...', suggestion: '...' }
  metadata         JSONB,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_facilitator_msg_conv
  ON public.facilitator_messages(conversation_id, created_at ASC);

ALTER TABLE public.facilitator_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY facilitator_msg_select_own
  ON public.facilitator_messages FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY facilitator_msg_insert_own
  ON public.facilitator_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY facilitator_msg_update_own
  ON public.facilitator_messages FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY facilitator_msg_delete_own
  ON public.facilitator_messages FOR DELETE
  USING (auth.uid() = user_id);

-- ── Trigger: bump conversation updated_at on new message ──────────
CREATE OR REPLACE FUNCTION public.bump_facilitator_conv_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.facilitator_conversations
    SET updated_at = now()
    WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_facilitator_conv_bump ON public.facilitator_messages;
CREATE TRIGGER trg_facilitator_conv_bump
  AFTER INSERT ON public.facilitator_messages
  FOR EACH ROW EXECUTE FUNCTION public.bump_facilitator_conv_updated_at();

-- =====================================================================
--  Done! Facilitator conversations + messages ready.
-- =====================================================================


-- ═══════════════════════════════════════════════════════════════
-- supabase-migration-v10.sql
-- ═══════════════════════════════════════════════════════════════
-- ═══════════════════════════════════════════════════════════════════
-- Migration v10: Media Assets Library
-- ═══════════════════════════════════════════════════════════════════
-- A generic store for admin-uploaded or admin-linked media:
-- thumbnails, hero images, cover videos, lesson videos, audio.
-- Attached to modules, lessons, or bootcamp days.
--
-- Run in Supabase SQL Editor after v9.

CREATE TABLE IF NOT EXISTS public.media_assets (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind           TEXT NOT NULL CHECK (kind IN
                    ('thumbnail', 'hero', 'video', 'audio', 'image', 'document')),
  resource_type  TEXT NOT NULL CHECK (resource_type IN
                    ('module', 'lesson', 'bootcamp_day', 'global')),
  resource_id    TEXT NOT NULL,
  title          TEXT,
  description    TEXT,
  storage_path   TEXT,
  external_url   TEXT,
  mime_type      TEXT,
  file_size      BIGINT,
  sort_order     INT NOT NULL DEFAULT 0,
  is_primary     BOOLEAN NOT NULL DEFAULT false,
  uploaded_by    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_media_assets_resource
  ON public.media_assets(resource_type, resource_id, kind);
CREATE INDEX IF NOT EXISTS idx_media_assets_primary
  ON public.media_assets(resource_type, resource_id, kind, is_primary);

CREATE TRIGGER media_assets_updated_at
  BEFORE UPDATE ON public.media_assets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY media_assets_select_all
  ON public.media_assets FOR SELECT
  USING (true);

CREATE POLICY media_assets_insert_admin
  ON public.media_assets FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('facilitator', 'admin')
    )
  );

CREATE POLICY media_assets_update_admin
  ON public.media_assets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('facilitator', 'admin')
    )
  );

CREATE POLICY media_assets_delete_admin
  ON public.media_assets FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('facilitator', 'admin')
    )
  );

-- Public bucket for uploaded media
INSERT INTO storage.buckets (id, name, public)
VALUES ('media-library', 'media-library', true)
ON CONFLICT (id) DO UPDATE SET public = true;

CREATE POLICY "Anyone can read media library files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'media-library');

CREATE POLICY "Facilitators and admins can upload media library files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'media-library'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('facilitator', 'admin')
    )
  );

CREATE POLICY "Facilitators and admins can delete media library files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'media-library'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('facilitator', 'admin')
    )
  );

CREATE POLICY "Facilitators and admins can update media library files"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'media-library'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('facilitator', 'admin')
    )
  );


-- ═══════════════════════════════════════════════════════════════
-- supabase-migration-v11.sql
-- ═══════════════════════════════════════════════════════════════
-- ═══════════════════════════════════════════════════════════════════════
-- v11 — Community forum structure
-- ═══════════════════════════════════════════════════════════════════════
-- Turns the flat discussions feed into a channel-organised forum:
--   - discussions.title  — makes a post a thread-starter (nullable for
--                          backward compatibility with existing posts).
--   - discussions.channel — which channel the thread lives in. Replaces
--                           the ad-hoc tag filter with a real taxonomy.
--   - discussions.lesson_id — optional link back to a specific lesson
--                             so threads can be anchored to context.
--
-- The existing `module_id` column stays untouched; we're moving to a
-- cleaner `channel` enum-like text so the UI doesn't have to juggle two
-- concepts. A trigger backfills channel from tags for existing rows.
-- ═══════════════════════════════════════════════════════════════════════

-- ── Columns ────────────────────────────────────────────────────────────
ALTER TABLE public.discussions
  ADD COLUMN IF NOT EXISTS title     TEXT,
  ADD COLUMN IF NOT EXISTS channel   TEXT NOT NULL DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS lesson_id TEXT;

-- ── Valid channels — enforced with a CHECK so bad values never land ───
ALTER TABLE public.discussions
  DROP CONSTRAINT IF EXISTS discussions_channel_valid;

ALTER TABLE public.discussions
  ADD CONSTRAINT discussions_channel_valid
  CHECK (channel IN (
    'general',
    'bootcamp',
    'module-1',
    'module-2',
    'module-3',
    'module-4'
  ));

-- ── Backfill channel from existing tags for historic rows ─────────────
UPDATE public.discussions
SET channel = CASE
  WHEN 'module-1' = ANY(tags) THEN 'module-1'
  WHEN 'module-2' = ANY(tags) THEN 'module-2'
  WHEN 'module-3' = ANY(tags) THEN 'module-3'
  WHEN 'module-4' = ANY(tags) THEN 'module-4'
  WHEN 'bootcamp' = ANY(tags) THEN 'bootcamp'
  ELSE 'general'
END
WHERE channel = 'general';

-- ── Indexes for channel filtering + lesson lookups ─────────────────────
CREATE INDEX IF NOT EXISTS idx_discussions_channel
  ON public.discussions(channel, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_discussions_lesson
  ON public.discussions(lesson_id)
  WHERE lesson_id IS NOT NULL;


-- ═══════════════════════════════════════════════════════════════
-- supabase-migration-v12.sql
-- ═══════════════════════════════════════════════════════════════
-- ═══════════════════════════════════════════════════════════════════════
-- v12 — Community image attachments + storage guardrails
-- ═══════════════════════════════════════════════════════════════════════
-- Lets participants attach images to community discussions and replies.
-- Storage is bounded by six layers of defence:
--   1. Client-side resize + PNG→JPEG conversion (in TS, not enforced here)
--   2. Bucket file_size_limit = 3 MB
--   3. MIME allowlist: jpeg, png, webp
--   4. Per-post cap of 4 attachments (enforced by trigger)
--   5. Per-user quota of 100 MB (enforced by trigger)
--   6. Cascade-delete on discussion/reply removal (+ app-side storage sweep)
-- ═══════════════════════════════════════════════════════════════════════

-- ── Bucket: community-uploads ──────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'community-uploads',
  'community-uploads',
  true,
  3145728, -- 3 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Bucket RLS — public read, authenticated users can write to their own folder only.
-- Storage path must start with {auth.uid()}/...
DROP POLICY IF EXISTS "community_uploads_select_public" ON storage.objects;
CREATE POLICY "community_uploads_select_public" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'community-uploads');

DROP POLICY IF EXISTS "community_uploads_insert_own" ON storage.objects;
CREATE POLICY "community_uploads_insert_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'community-uploads'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "community_uploads_delete_own" ON storage.objects;
CREATE POLICY "community_uploads_delete_own" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'community-uploads'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('facilitator', 'admin')
      )
    )
  );

-- ── Table: discussion_attachments ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.discussion_attachments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id UUID REFERENCES public.discussions(id) ON DELETE CASCADE,
  reply_id      UUID REFERENCES public.discussion_replies(id) ON DELETE CASCADE,
  kind          TEXT NOT NULL CHECK (kind IN ('image', 'file', 'link')),
  storage_path  TEXT,
  url           TEXT,
  title         TEXT,
  mime_type     TEXT,
  width         INTEGER,
  height        INTEGER,
  size_bytes    BIGINT NOT NULL DEFAULT 0,
  uploaded_by   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Exactly one parent (discussion OR reply, not both, not neither).
  CONSTRAINT discussion_attachment_has_one_parent
    CHECK ((discussion_id IS NOT NULL)::int + (reply_id IS NOT NULL)::int = 1),

  -- Source matches kind: image/file needs storage_path, link needs url.
  CONSTRAINT discussion_attachment_source_matches_kind
    CHECK (
      (kind IN ('image', 'file') AND storage_path IS NOT NULL)
      OR (kind = 'link' AND url IS NOT NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_discussion_attachments_discussion
  ON public.discussion_attachments(discussion_id)
  WHERE discussion_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_discussion_attachments_reply
  ON public.discussion_attachments(reply_id)
  WHERE reply_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_discussion_attachments_uploader
  ON public.discussion_attachments(uploaded_by);

ALTER TABLE public.discussion_attachments ENABLE ROW LEVEL SECURITY;

-- RLS: any authenticated user can SELECT; authors insert their own;
-- author or moderator can DELETE.
DROP POLICY IF EXISTS "discussion_attachments_select_all" ON public.discussion_attachments;
CREATE POLICY "discussion_attachments_select_all" ON public.discussion_attachments
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "discussion_attachments_insert_own" ON public.discussion_attachments;
CREATE POLICY "discussion_attachments_insert_own" ON public.discussion_attachments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = uploaded_by);

DROP POLICY IF EXISTS "discussion_attachments_delete" ON public.discussion_attachments;
CREATE POLICY "discussion_attachments_delete" ON public.discussion_attachments
  FOR DELETE TO authenticated USING (
    auth.uid() = uploaded_by
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('facilitator', 'admin')
    )
  );

-- ── Trigger: cap per-post attachment count at 4 ───────────────────────
CREATE OR REPLACE FUNCTION public.check_attachment_count()
RETURNS TRIGGER AS $$
DECLARE
  c INT;
BEGIN
  IF NEW.discussion_id IS NOT NULL THEN
    SELECT COUNT(*) INTO c
      FROM public.discussion_attachments
      WHERE discussion_id = NEW.discussion_id;
  ELSE
    SELECT COUNT(*) INTO c
      FROM public.discussion_attachments
      WHERE reply_id = NEW.reply_id;
  END IF;
  IF c >= 4 THEN
    RAISE EXCEPTION 'Maximum 4 attachments per post';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS discussion_attachments_count_cap
  ON public.discussion_attachments;

CREATE TRIGGER discussion_attachments_count_cap
  BEFORE INSERT ON public.discussion_attachments
  FOR EACH ROW EXECUTE FUNCTION public.check_attachment_count();

-- ── Table: community_storage_usage (per-user aggregate) ───────────────
CREATE TABLE IF NOT EXISTS public.community_storage_usage (
  user_id    UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  bytes_used BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.community_storage_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "community_storage_usage_select_own_or_mod"
  ON public.community_storage_usage;
CREATE POLICY "community_storage_usage_select_own_or_mod"
  ON public.community_storage_usage
  FOR SELECT TO authenticated USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('facilitator', 'admin')
    )
  );

-- Trigger: keep aggregate in sync with discussion_attachments.
CREATE OR REPLACE FUNCTION public.update_community_storage_usage()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.community_storage_usage (user_id, bytes_used, updated_at)
    VALUES (NEW.uploaded_by, NEW.size_bytes, now())
    ON CONFLICT (user_id) DO UPDATE
      SET bytes_used = public.community_storage_usage.bytes_used + EXCLUDED.bytes_used,
          updated_at = now();
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.community_storage_usage
      SET bytes_used = GREATEST(0, bytes_used - OLD.size_bytes),
          updated_at = now()
      WHERE user_id = OLD.uploaded_by;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS discussion_attachments_usage_sync
  ON public.discussion_attachments;

CREATE TRIGGER discussion_attachments_usage_sync
  AFTER INSERT OR DELETE ON public.discussion_attachments
  FOR EACH ROW EXECUTE FUNCTION public.update_community_storage_usage();

-- ── Trigger: enforce 100 MB per-user quota on insert ──────────────────
CREATE OR REPLACE FUNCTION public.check_community_storage_quota()
RETURNS TRIGGER AS $$
DECLARE
  current_bytes BIGINT;
  quota_bytes   BIGINT := 104857600; -- 100 MB
BEGIN
  SELECT COALESCE(bytes_used, 0) INTO current_bytes
    FROM public.community_storage_usage
    WHERE user_id = NEW.uploaded_by;

  IF COALESCE(current_bytes, 0) + NEW.size_bytes > quota_bytes THEN
    RAISE EXCEPTION 'Storage quota exceeded — 100 MB per user. Delete some older attachments and try again.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS discussion_attachments_quota_check
  ON public.discussion_attachments;

CREATE TRIGGER discussion_attachments_quota_check
  BEFORE INSERT ON public.discussion_attachments
  FOR EACH ROW EXECUTE FUNCTION public.check_community_storage_quota();


-- ═══════════════════════════════════════════════════════════════
-- supabase-migration-v13.sql
-- ═══════════════════════════════════════════════════════════════
-- ═══════════════════════════════════════════════════════════════════════
-- v13 — Community files (Phase 2) + link previews (Phase 3)
-- ═══════════════════════════════════════════════════════════════════════
-- Extends the v12 attachments infrastructure to support:
--   • files (PDF, Office, text) via a new `community-files` bucket
--   • links with Open Graph previews via a shared `link_preview_cache`
-- Reuses the existing discussion_attachments table (kind IN
-- ('image','file','link')), the per-post cap of 4 attachments, and the
-- per-user 100 MB storage quota — files count toward the same quota.
-- ═══════════════════════════════════════════════════════════════════════

-- ── Bucket: community-files ────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'community-files',
  'community-files',
  true,
  10485760, -- 10 MB per file
  ARRAY[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/msword',
    'application/vnd.ms-powerpoint',
    'application/vnd.ms-excel',
    'text/plain',
    'text/markdown',
    'text/csv'
  ]
)
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "community_files_select_public" ON storage.objects;
CREATE POLICY "community_files_select_public" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'community-files');

DROP POLICY IF EXISTS "community_files_insert_own" ON storage.objects;
CREATE POLICY "community_files_insert_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'community-files'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "community_files_delete_own" ON storage.objects;
CREATE POLICY "community_files_delete_own" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'community-files'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('facilitator', 'admin')
      )
    )
  );

-- New column on attachments: which storage bucket a file lives in.
-- Default 'community-uploads' so existing image rows stay valid.
ALTER TABLE public.discussion_attachments
  ADD COLUMN IF NOT EXISTS storage_bucket TEXT NOT NULL DEFAULT 'community-uploads';

-- ── Table: link_preview_cache ──────────────────────────────────────────
-- Shared OG-metadata cache so if two learners post the same URL we only
-- scrape it once. Keyed by sha256(normalised url).
CREATE TABLE IF NOT EXISTS public.link_preview_cache (
  url_hash     TEXT PRIMARY KEY,
  url          TEXT NOT NULL,
  title        TEXT,
  description  TEXT,
  image_url    TEXT,
  site_name    TEXT,
  fetched_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  fetched_by   UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_link_preview_cache_fetched_at
  ON public.link_preview_cache(fetched_at DESC);

ALTER TABLE public.link_preview_cache ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can read the cache; server-side API route
-- (using service role) writes to it.
DROP POLICY IF EXISTS "link_preview_cache_select_all" ON public.link_preview_cache;
CREATE POLICY "link_preview_cache_select_all" ON public.link_preview_cache
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "link_preview_cache_insert_self" ON public.link_preview_cache;
CREATE POLICY "link_preview_cache_insert_self" ON public.link_preview_cache
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = fetched_by);

DROP POLICY IF EXISTS "link_preview_cache_update_self" ON public.link_preview_cache;
CREATE POLICY "link_preview_cache_update_self" ON public.link_preview_cache
  FOR UPDATE TO authenticated
  USING (auth.uid() = fetched_by)
  WITH CHECK (auth.uid() = fetched_by);


-- ═══════════════════════════════════════════════════════════════
-- supabase-migration-v14.sql
-- ═══════════════════════════════════════════════════════════════
-- ═══════════════════════════════════════════════════════════════════════
-- v14 — Freeze link-preview snapshots on the attachment row itself
-- ═══════════════════════════════════════════════════════════════════════
-- link_preview_cache is a scraper accelerator (7-day TTL). But the OG
-- data we show for a link attachment should be whatever the poster saw
-- at post time — not whatever the cache might later evict or refresh.
-- Add description / image_url / site_name to discussion_attachments so
-- every link row carries its own preview snapshot.
-- ═══════════════════════════════════════════════════════════════════════

ALTER TABLE public.discussion_attachments
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS image_url   TEXT,
  ADD COLUMN IF NOT EXISTS site_name   TEXT;


-- ═══════════════════════════════════════════════════════════════
-- supabase-migration-v15.sql
-- ═══════════════════════════════════════════════════════════════
-- ═══════════════════════════════════════════════════════════════════════
-- v15 — Platform-wide settings (single-row config table)
-- ═══════════════════════════════════════════════════════════════════════
-- A tiny key/value-style table for app-wide knobs an admin flips once
-- and everyone sees. First and currently only setting: design_theme,
-- which controls whether the UI renders under the default Metodic
-- palette or the UAE Government Design System palette.
--
-- Row-level security:
--   - SELECT : any authenticated user (so the ThemeProvider can read
--              the chosen theme when the user signs in)
--   - UPDATE : admins only
--   - INSERT / DELETE : nobody via client (seeded here, managed by
--              migrations + service-role key only)
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.platform_settings (
  id             INTEGER PRIMARY KEY DEFAULT 1,
  design_theme   TEXT NOT NULL DEFAULT 'metodic'
                   CHECK (design_theme IN ('metodic', 'uae')),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  -- Lock the table to a single row forever.
  CONSTRAINT platform_settings_singleton CHECK (id = 1)
);

-- Seed the single row. Safe to re-run — ON CONFLICT guards against
-- duplicate-insert errors on replays.
INSERT INTO public.platform_settings (id, design_theme)
VALUES (1, 'metodic')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Any logged-in user can read the current theme (so their browser can
-- apply it on first render).
DROP POLICY IF EXISTS "platform_settings_select_all" ON public.platform_settings;
CREATE POLICY "platform_settings_select_all"
  ON public.platform_settings
  FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can flip the toggle.
DROP POLICY IF EXISTS "platform_settings_update_admin" ON public.platform_settings;
CREATE POLICY "platform_settings_update_admin"
  ON public.platform_settings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Keep updated_at in sync on every UPDATE.
CREATE OR REPLACE FUNCTION public.platform_settings_touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_platform_settings_touch_updated_at
  ON public.platform_settings;
CREATE TRIGGER trg_platform_settings_touch_updated_at
  BEFORE UPDATE ON public.platform_settings
  FOR EACH ROW EXECUTE FUNCTION public.platform_settings_touch_updated_at();

-- Broadcast row changes over Supabase Realtime so every open tab can
-- pick up a theme flip without a refresh.
ALTER PUBLICATION supabase_realtime ADD TABLE public.platform_settings;


-- ═══════════════════════════════════════════════════════════════
-- supabase-migration-v16.sql
-- ═══════════════════════════════════════════════════════════════
-- ═══════════════════════════════════════════════════════════════════════
-- v16 — Impersonation audit log
-- ═══════════════════════════════════════════════════════════════════════
-- Records every time an admin uses "Login as user" on the Manage Users
-- page. The application enforces the admin-only gate at the API layer;
-- this table exists so the platform can show a log later and so a
-- curious admin can always trace back who impersonated whom and when.
--
-- RLS: admins can SELECT everything, everyone else gets nothing.
-- INSERTs come from the service-role API route, which bypasses RLS.
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.impersonation_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_user_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_email    TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_impersonation_log_admin
  ON public.impersonation_log(admin_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_impersonation_log_target
  ON public.impersonation_log(target_user_id, created_at DESC);

ALTER TABLE public.impersonation_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "impersonation_log_select_admin" ON public.impersonation_log;
CREATE POLICY "impersonation_log_select_admin"
  ON public.impersonation_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );


-- ── v17: AI Capability Academy additions ──
-- ── v17 — AI Capability Academy additions ──────────────────────────
-- Run AFTER the base TDRA schema (schema.sql + v2..v16) on the fresh
-- aicapability Supabase project. Covers BUILD spec §3.4, §3.6, §4.1, §4.2
-- plus the umbrella program layer.


-- ── Schema drift fix: column existed in TDRA prod but in no migration ──
alter table profiles add column if not exists onboarded_at timestamptz;

-- ── §3.4 Journal extensions ─────────────────────────────────────────
-- Letter tab for the journal view (0,1,2,V,E,R,I,F,Y,9).
alter table journal_entries
  add column if not exists module_letter text;

-- Weekly pulse + honest sentence reuse journal_entries via kind/prompt_key.
-- (kind: 'reflection' | 'worksheet' | 'pulse'; prompt_key:
--  'honest-sentence' | 'honest-sentence-rewrite' | pulse fields in payload.)
-- No structural change needed beyond module_letter; documented here for intent.

-- ── Umbrella + §3.6 Entitlements (checkout) ─────────────────────────
-- `product` is the Program id from src/lib/data.ts (e.g. 'verify-capability').
-- One row per purchased program per user; the middleware gates (app) routes
-- on an active entitlement for the program being accessed.
create table if not exists entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  product text not null default 'verify-capability',
  price_id text,
  stripe_customer text,
  status text not null default 'active' check (status in ('active','revoked','refunded')),
  created_at timestamptz not null default now(),
  unique (user_id, product)
);
alter table entitlements enable row level security;
create policy "entitlements: own rows" on entitlements
  for select using (auth.uid() = user_id);
-- inserts/updates happen via service role (Stripe webhook / admin) only.

-- ── §4.1 Competency scan (GGJ host competencies) ────────────────────
-- S Systems & SDG framing · D Jam design (4-sprint) · F Facilitation &
-- energy · I Inclusion & safety · P Partnerships & logistics · C Impact
-- & continuation. See 20260711100000_ggj_competency_scan.sql (which
-- remaps legacy VERIFY rows and is a no-op on this fresh shape).
create table if not exists capability_scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  program text not null default 'verify-capability',
  taken_at timestamptz not null default now(),
  phase text not null check (phase in ('baseline','day90')),
  -- {"S":0..3,"D":0..3,"F":0..3,"I":0..3,"P":0..3,"C":0..3}
  scores jsonb not null,
  total int generated always as (
    coalesce((scores->>'S')::int,0) + coalesce((scores->>'D')::int,0) +
    coalesce((scores->>'F')::int,0) + coalesce((scores->>'I')::int,0) +
    coalesce((scores->>'P')::int,0) + coalesce((scores->>'C')::int,0)
  ) stored,
  constraint capability_scans_scores_0_3 check (
    coalesce((scores->>'S')::int,0) between 0 and 3 and
    coalesce((scores->>'D')::int,0) between 0 and 3 and
    coalesce((scores->>'F')::int,0) between 0 and 3 and
    coalesce((scores->>'I')::int,0) between 0 and 3 and
    coalesce((scores->>'P')::int,0) between 0 and 3 and
    coalesce((scores->>'C')::int,0) between 0 and 3
  ),
  unique (user_id, program, phase)
);
alter table capability_scans enable row level security;
create policy "capability_scans: own rows" on capability_scans
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── §4.2 Live sessions ("The Room") ─────────────────────────────────
create table if not exists live_sessions (
  id uuid primary key default gen_random_uuid(),
  program text not null default 'verify-capability',
  title text not null default 'The Room',
  starts_at timestamptz not null,
  duration_min int not null default 60,
  capacity int not null default 24,
  join_url text,
  brief_note text,
  status text not null default 'scheduled' check (status in ('scheduled','done','cancelled')),
  created_at timestamptz not null default now()
);
alter table live_sessions enable row level security;
create policy "live_sessions: readable by authenticated" on live_sessions
  for select using (auth.role() = 'authenticated');
-- writes via service role / admin only.

create table if not exists live_session_registrations (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references live_sessions(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  letter text,
  artefact text,
  question text,
  waitlisted boolean not null default false,
  created_at timestamptz not null default now(),
  unique (session_id, user_id)
);
alter table live_session_registrations enable row level security;
create policy "registrations: own rows" on live_session_registrations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "registrations: facilitators read all" on live_session_registrations
  for select using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('facilitator','admin'))
  );

-- ── Community channels for the 10-module track ──────────────────────
-- Trim to the BUILD §1 channel set + general. Adjust the CHECK constraint
-- if the base schema enforces one (v1 channels: announcements, general,
-- peer-exchange, wins).
-- Example (uncomment after confirming constraint name):
-- alter table discussions drop constraint if exists discussions_channel_check;
-- alter table discussions add constraint discussions_channel_check
--   check (channel in ('announcements','general','peer-exchange','wins'));
