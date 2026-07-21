-- Official Host Certification (€39). The course itself is free; this table
-- records who holds (or is buying) the official certification. Keyed by email
-- because the main site (users, text ids) and Learn (auth uuids) only share
-- email as a reliable join key.
create table if not exists public.certifications (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  learn_user_id uuid,
  source text not null default 'mollie', -- 'mollie' | 'legacy-course-payment' | 'granted'
  status text not null default 'pending', -- 'pending' | 'paid'
  mollie_payment_id text,
  amount_paid text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists certifications_email_idx on public.certifications (lower(email));

alter table public.certifications enable row level security;

-- Read-only for clients (badge display); all writes go through edge
-- functions / server routes with the service role.
create policy "certifications are readable" on public.certifications
  for select using (true);

-- Grandfather: everyone who paid for the course under the old model already
-- holds the certification.
insert into public.certifications (email, source, status, mollie_payment_id, amount_paid)
select distinct on (lower(u.email)) lower(u.email), 'legacy-course-payment', 'paid', e.mollie_payment_id, e.amount_paid
from course_enrollments e
join users u on u.id = e.user_id
where e.status in ('active','completed') and u.email is not null
order by lower(u.email), e.created_at desc
on conflict (email) do nothing;
