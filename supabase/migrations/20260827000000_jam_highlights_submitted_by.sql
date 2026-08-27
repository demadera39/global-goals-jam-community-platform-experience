-- Jam Memories: community members submit their own photo + story from past
-- jams via /memories. Submissions land unverified in jam_highlights; this
-- records who sent them (free-text name, optionally with email in parens).
alter table public.jam_highlights add column if not exists submitted_by text;
