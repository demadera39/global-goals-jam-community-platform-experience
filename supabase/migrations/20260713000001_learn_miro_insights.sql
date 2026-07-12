-- ── Miro Insights table for the Right Panel ──────────────────────
-- Stores board screenshots and text summaries per lesson,
-- uploaded by facilitators/admins.

CREATE TABLE IF NOT EXISTS miro_insights (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id   text NOT NULL,
  type        text NOT NULL CHECK (type IN ('image', 'text')),
  content     text NOT NULL,
  caption     text,
  added_by    uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Index for fast per-lesson lookups
CREATE INDEX idx_miro_insights_lesson ON miro_insights(lesson_id);

-- RLS: anyone authenticated can read; facilitators/admins can write
ALTER TABLE miro_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read miro insights"
  ON miro_insights FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Facilitators and admins can insert miro insights"
  ON miro_insights FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('facilitator', 'admin')
    )
  );

CREATE POLICY "Facilitators and admins can delete miro insights"
  ON miro_insights FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('facilitator', 'admin')
    )
  );

-- ── Storage bucket for Miro board images ─────────────────────────
-- IMPORTANT: Bucket must be PRIVATE (confidential content).
-- Run this in the Supabase dashboard > SQL Editor:
--
--   INSERT INTO storage.buckets (id, name, public)
--   VALUES ('miro-boards', 'miro-boards', false)
--   ON CONFLICT (id) DO UPDATE SET public = false;
--
-- Then add these storage policies:
--   1. Authenticated users can SELECT (for signed URL access)
--   2. Facilitator/admin role can INSERT (upload)
--   3. Facilitator/admin role can DELETE
--
-- See supabase/RUN_THIS_IN_SUPABASE.sql for the complete SQL.
