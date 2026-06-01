-- Restore a working default for events.id.
--
-- Event creation was failing with:
--   23502: null value in column "id" of relation "events" violates not-null constraint
-- because the deployed events table lost the `default uuid_generate_v4()::text`
-- it was originally created with (the uuid-ossp dependency / table recreation
-- during the Blink migration dropped it). The client now generates an id, but
-- we also restore a server-side default so any insert path is safe.
--
-- gen_random_uuid() ships with pgcrypto/pg13+ core and needs no extension.

ALTER TABLE public.events
  ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
