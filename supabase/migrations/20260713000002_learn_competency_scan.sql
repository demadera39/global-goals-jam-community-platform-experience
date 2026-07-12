-- ── GGJ Host Programme — competency scan swap ──────────────────────
-- The engine's capability scan scored the six VERIFY moves
-- (V,E,R,I,F,Y). The GGJ Host Programme scores the six host
-- competencies instead:
--   S  Systems & SDG framing
--   D  Jam design (4-sprint)
--   F  Facilitation & energy
--   I  Inclusion & safety
--   P  Partnerships & logistics
--   C  Impact & continuation
--
-- `capability_scans.scores` is a jsonb keyed by competency (0–3 each)
-- and `total` is a generated column over the six keys (0–18). This
-- migration:
--   1. remaps any existing rows positionally (V→S, E→D, R→F, I→I,
--      F→P, Y→C) so totals stay comparable,
--   2. regenerates `total` over the new keys,
--   3. adds the 0–3 range check the UI enforces.
-- Idempotent: safe to run on a database whose init migration already
-- creates the new shape (fresh `supabase db reset`).

begin;

alter table public.capability_scans drop column if exists total;

-- Remap legacy rows, identified by any VERIFY-only key (V, E, R, Y —
-- F and I exist in both schemes, so they cannot identify a legacy row).
-- Single-expression rebuild avoids rename collisions (old R→new F while
-- old F→new P). Missing keys become nulls and are stripped.
update public.capability_scans
set scores = jsonb_strip_nulls(jsonb_build_object(
  'S', scores->'V',
  'D', scores->'E',
  'F', scores->'R',
  'I', scores->'I',
  'P', scores->'F',
  'C', scores->'Y'
))
where scores ?| array['V','E','R','Y'];

alter table public.capability_scans
  add column total int generated always as (
    coalesce((scores->>'S')::int,0) + coalesce((scores->>'D')::int,0) +
    coalesce((scores->>'F')::int,0) + coalesce((scores->>'I')::int,0) +
    coalesce((scores->>'P')::int,0) + coalesce((scores->>'C')::int,0)
  ) stored;

-- Same 0–3 bounds the UI enforces, now checked in the database.
-- (NULL/missing keys pass — the unique(user,program,phase) row is only
-- meaningful once the UI saves all six.)
alter table public.capability_scans
  drop constraint if exists capability_scans_scores_0_3;
alter table public.capability_scans
  add constraint capability_scans_scores_0_3 check (
    coalesce((scores->>'S')::int,0) between 0 and 3 and
    coalesce((scores->>'D')::int,0) between 0 and 3 and
    coalesce((scores->>'F')::int,0) between 0 and 3 and
    coalesce((scores->>'I')::int,0) between 0 and 3 and
    coalesce((scores->>'P')::int,0) between 0 and 3 and
    coalesce((scores->>'C')::int,0) between 0 and 3
  );

comment on column public.capability_scans.scores is
  'GGJ host competency self-scores, 0-3 each: {"S","D","F","I","P","C"} = Systems & SDG framing, Jam design (4-sprint), Facilitation & energy, Inclusion & safety, Partnerships & logistics, Impact & continuation.';

commit;
