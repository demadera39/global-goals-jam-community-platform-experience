-- Restore a working default for event_registrations.id.
--
-- Adding participants (manual or CSV) from the Host Dashboard failed with:
--   23502: null value in column "id" of relation "event_registrations"
--          violates not-null constraint
-- because the deployed table lost the default it was originally created with
-- (same Blink-migration regression that hit public.events). The client now also
-- generates an id, but we restore a server-side default so every insert path —
-- host-added participants AND public self-registration — is safe.
--
-- gen_random_uuid() ships with pgcrypto/pg13+ core and needs no extension.
-- Strip hyphens to match the existing 32-char hex id format in this table.

ALTER TABLE public.event_registrations
  ALTER COLUMN id SET DEFAULT replace(gen_random_uuid()::text, '-', '');
