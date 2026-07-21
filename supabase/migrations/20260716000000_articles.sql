-- Articles: host-submitted stories + admin/AI-generated pieces, shown on the
-- public /articles section. Mirrors the Metodic news/articles architecture.
--
-- Lifecycle: hosts write from the host dashboard → status 'pending' →
-- admin reviews on /admin/articles → 'published' (or 'rejected').
-- Admins (and the AI generator) create drafts directly and publish.
create table if not exists public.articles (
  id text primary key default (gen_random_uuid())::text,
  slug text not null unique,
  title text not null,
  excerpt text,
  content text not null,                       -- markdown body
  cover_image_url text,
  category text not null default 'stories',    -- stories | methods | impact | news
  tags text,                                   -- comma-separated
  author_id text,
  author_name text,
  source text not null default 'host',         -- host | admin | ai
  status text not null default 'pending',      -- draft | pending | published | rejected
  review_note text,                            -- admin feedback on reject
  linkedin_post text,                          -- AI-drafted promo post (admin copy button)
  read_minutes integer,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists articles_status_published_idx
  on public.articles (status, published_at desc);
create index if not exists articles_author_idx on public.articles (author_id);

-- RLS: enabled with permissive policies, matching the app's architecture —
-- authentication and authorization live at the app layer (custom auth), so
-- API-role requests carry the anon key (same pattern as jam_highlights).
alter table public.articles enable row level security;
drop policy if exists articles_select on public.articles;
drop policy if exists articles_write on public.articles;
create policy articles_select on public.articles for select using (true);
create policy articles_write on public.articles for all using (true) with check (true);
