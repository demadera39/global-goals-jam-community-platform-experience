-- ============================================================================
-- Global Goals Jam Community Platform — Initial Database Schema
-- ============================================================================
-- All tables use camelCase column names to match the JS/TS client code.
-- Supabase automatically provides `auth.uid()` for RLS policies.
-- ============================================================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ============================================================================
-- 1. users
-- ============================================================================
create table if not exists "users" (
  id            text primary key,
  email         text not null,
  "displayName" text,
  role          text not null default 'participant'
                  check (role in ('participant', 'host', 'admin')),
  status        text not null default 'pending'
                  check (status in ('pending', 'approved', 'suspended')),
  bio           text,
  location      text,
  "profileImage" text,
  "createdAt"   timestamptz not null default now(),
  "updatedAt"   timestamptz not null default now()
);

create unique index if not exists users_email_idx on "users" (lower(email));

-- ============================================================================
-- 2. courseModules
-- ============================================================================
create table if not exists "courseModules" (
  id                text primary key default uuid_generate_v4()::text,
  "moduleNumber"    integer not null unique,
  title             text not null,
  description       text,
  "learningOutcomes" text,
  activities        text,
  "videoUrl"        text,
  "contentHtml"     text,
  templates         text,
  exercises         text,
  "checkOfLearning" text,
  "durationMinutes" integer
);

-- ============================================================================
-- 3. courseEnrollments
-- ============================================================================
create table if not exists "courseEnrollments" (
  id                    text primary key default uuid_generate_v4()::text,
  "userId"              text not null references "users" (id) on delete cascade,
  status                text not null default 'pending'
                          check (status in ('pending', 'active', 'completed', 'expired')),
  "stripeSessionId"     text,
  "stripePaymentIntent" text,
  "amountPaid"          numeric(10,2),
  "currentModule"       integer default 1,
  "completedModules"    text default '[]',
  "certificateIssuedAt" timestamptz,
  "certificateUrl"      text,
  "enrolledAt"          timestamptz not null default now(),
  "updatedAt"           timestamptz not null default now()
);

create index if not exists ce_user_idx on "courseEnrollments" ("userId");

-- ============================================================================
-- 4. courseProgress
-- ============================================================================
create table if not exists "courseProgress" (
  id                    text primary key default uuid_generate_v4()::text,
  "moduleId"            text not null references "courseModules" (id) on delete cascade,
  "userId"              text not null references "users" (id) on delete cascade,
  "enrollmentId"        text not null references "courseEnrollments" (id) on delete cascade,
  "startedAt"           timestamptz,
  "completedAt"         timestamptz,
  "quizScore"           numeric(5,2),
  "quizAnswers"         text,
  "videoWatchedPercent" numeric(5,2) default 0,
  "exercisesCompleted"  text default '[]',
  notes                 text
);

create index if not exists cp_user_idx on "courseProgress" ("userId");
create index if not exists cp_enrollment_idx on "courseProgress" ("enrollmentId");
create unique index if not exists cp_unique_idx on "courseProgress" ("userId", "moduleId", "enrollmentId");

-- ============================================================================
-- 5. courseRegistrations
-- ============================================================================
create table if not exists "courseRegistrations" (
  id          text primary key default uuid_generate_v4()::text,
  "userId"    text not null references "users" (id) on delete cascade,
  "fullName"  text,
  "createdAt" timestamptz not null default now()
);

-- ============================================================================
-- 6. donations
-- ============================================================================
create table if not exists donations (
  id                    text primary key default uuid_generate_v4()::text,
  "stripeSessionId"     text,
  "stripePaymentIntent" text,
  amount                numeric(10,2) not null,
  "amountDisplay"       text,
  "tierName"            text,
  status                text not null default 'pending'
                          check (status in ('pending', 'completed', 'refunded')),
  "donorName"           text,
  "donorOrganization"   text,
  "donorLogoUrl"        text,
  email                 text,
  "formCompletedAt"     timestamptz,
  "paidAt"              timestamptz,
  "createdAt"           timestamptz not null default now()
);

-- ============================================================================
-- 7. events
-- ============================================================================
create table if not exists events (
  id                      text primary key default uuid_generate_v4()::text,
  title                   text not null,
  description             text,
  "hostId"                text references "users" (id) on delete set null,
  "hostName"              text,
  team                    text,
  location                text,
  latitude                double precision,
  longitude               double precision,
  "eventDate"             date,
  "endDate"               date,
  "startTime"             text,
  "endTime"               text,
  status                  text not null default 'draft'
                            check (status in ('draft', 'published', 'ongoing', 'completed', 'cancelled')),
  "maxParticipants"       integer,
  "registrationDeadline"  timestamptz,
  agenda                  text,
  requirements            text,
  "coverImage"            text,
  "createdAt"             timestamptz not null default now(),
  "updatedAt"             timestamptz not null default now()
);

create index if not exists events_host_idx on events ("hostId");
create index if not exists events_status_idx on events (status);
create index if not exists events_date_idx on events ("eventDate");

-- ============================================================================
-- 8. eventRegistrations
-- ============================================================================
create table if not exists "eventRegistrations" (
  id                  text primary key default uuid_generate_v4()::text,
  "eventId"           text not null references events (id) on delete cascade,
  "participantId"     text not null references "users" (id) on delete cascade,
  "registrationDate"  timestamptz not null default now(),
  status              text default 'registered',
  notes               text
);

create unique index if not exists er_unique_idx on "eventRegistrations" ("eventId", "participantId");

-- ============================================================================
-- 9. hostApplications
-- ============================================================================
create table if not exists "hostApplications" (
  id          text primary key default uuid_generate_v4()::text,
  "userId"    text references "users" (id) on delete cascade,
  email       text not null,
  location    text,
  motivation  text,
  status      text not null default 'pending_certification'
                check (status in ('pending_certification', 'approved', 'rejected')),
  "createdAt" timestamptz not null default now()
);

-- ============================================================================
-- 10. hostInvites
-- ============================================================================
create table if not exists "hostInvites" (
  id            text primary key default uuid_generate_v4()::text,
  email         text not null,
  role          text not null default 'host',
  status        text not null default 'pending'
                  check (status in ('pending', 'approved', 'rejected')),
  "fulfilledAt" timestamptz,
  "fulfilledBy" text references "users" (id) on delete set null,
  "createdAt"   timestamptz not null default now()
);

create index if not exists hi_email_idx on "hostInvites" (lower(email));

-- ============================================================================
-- 11. media
-- ============================================================================
create table if not exists media (
  id           text primary key default uuid_generate_v4()::text,
  "eventId"    text references events (id) on delete set null,
  "uploadedBy" text references "users" (id) on delete set null,
  title        text,
  description  text,
  "fileUrl"    text not null,
  "fileType"   text,
  "fileSize"   integer,
  "sdgTags"    text,
  "isFeatured" boolean default false,
  "createdAt"  timestamptz not null default now()
);

create index if not exists media_event_idx on media ("eventId");

-- ============================================================================
-- 12. certificates
-- ============================================================================
create table if not exists certificates (
  id                text primary key default uuid_generate_v4()::text,
  "eventId"         text references events (id) on delete set null,
  "recipientId"     text references "users" (id) on delete cascade,
  "recipientName"   text,
  "eventTitle"      text,
  "eventLocation"   text,
  "eventDate"       timestamptz,
  "certificateType" text not null default 'participation'
                      check ("certificateType" in ('participation', 'host')),
  "issuedBy"        text references "users" (id) on delete set null,
  "certificateUrl"  text,
  "createdAt"       timestamptz not null default now()
);

create index if not exists cert_recipient_idx on certificates ("recipientId");

-- ============================================================================
-- 13. emailSchedule
-- ============================================================================
create table if not exists "emailSchedule" (
  id              text primary key default uuid_generate_v4()::text,
  "enrollmentId"  text references "courseEnrollments" (id) on delete cascade,
  "userId"        text references "users" (id) on delete cascade,
  "moduleNumber"  integer not null,
  "scheduledFor"  timestamptz not null,
  status          text not null default 'pending'
                    check (status in ('pending', 'sent', 'failed')),
  "createdAt"     timestamptz not null default now()
);

-- ============================================================================
-- 14. passwordResets
-- ============================================================================
create table if not exists "passwordResets" (
  id          text primary key default uuid_generate_v4()::text,
  email       text not null,
  token       text not null unique,
  "expiresAt" timestamptz not null,
  "createdAt" timestamptz not null default now()
);

create index if not exists pr_token_idx on "passwordResets" (token);

-- ============================================================================
-- 15. userAchievements
-- ============================================================================
create table if not exists "userAchievements" (
  id                text primary key default uuid_generate_v4()::text,
  "userId"          text not null references "users" (id) on delete cascade,
  "achievementType" text not null,
  title             text,
  description       text,
  "awardedAt"       timestamptz not null default now()
);

create index if not exists ua_user_idx on "userAchievements" ("userId");

-- ============================================================================
-- 16. stripeEvents (idempotency table for webhook processing)
-- ============================================================================
create table if not exists "stripeEvents" (
  id         text primary key,
  status     text not null default 'processing',
  "rawEvent" text,
  "createdAt" timestamptz not null default now()
);

-- ============================================================================
-- 17. toolkits
-- ============================================================================
create table if not exists toolkits (
  id                text primary key default uuid_generate_v4()::text,
  title             text not null,
  description       text,
  content           text,
  "createdBy"       text references "users" (id) on delete set null,
  "isPublic"        boolean default false,
  "sdgFocus"        text,
  "durationMinutes" integer,
  "participantCount" text,
  "difficultyLevel" text check ("difficultyLevel" in ('beginner', 'intermediate', 'advanced')),
  "downloadCount"   integer default 0,
  "createdAt"       timestamptz not null default now()
);

-- ============================================================================
-- 18. forumCategories
-- ============================================================================
create table if not exists "forumCategories" (
  id            text primary key default uuid_generate_v4()::text,
  name          text not null,
  description   text,
  "isHostOnly"  boolean default false,
  "sortOrder"   integer default 0,
  "createdAt"   timestamptz not null default now()
);

-- ============================================================================
-- 19. forumThreads
-- ============================================================================
create table if not exists "forumThreads" (
  id            text primary key default uuid_generate_v4()::text,
  "categoryId"  text not null references "forumCategories" (id) on delete cascade,
  title         text not null,
  "authorId"    text not null references "users" (id) on delete cascade,
  "isPinned"    boolean default false,
  "isLocked"    boolean default false,
  "replyCount"  integer default 0,
  "lastReplyAt" timestamptz,
  "createdAt"   timestamptz not null default now()
);

create index if not exists ft_category_idx on "forumThreads" ("categoryId");
create index if not exists ft_author_idx on "forumThreads" ("authorId");

-- ============================================================================
-- 20. forumPosts
-- ============================================================================
create table if not exists "forumPosts" (
  id            text primary key default uuid_generate_v4()::text,
  "threadId"    text not null references "forumThreads" (id) on delete cascade,
  "authorId"    text not null references "users" (id) on delete cascade,
  content       text not null,
  "isFirstPost" boolean default false,
  "createdAt"   timestamptz not null default now(),
  "updatedAt"   timestamptz not null default now()
);

create index if not exists fp_thread_idx on "forumPosts" ("threadId");

-- ============================================================================
-- 21. jamHighlights
-- ============================================================================
create table if not exists "jamHighlights" (
  id            text primary key default uuid_generate_v4()::text,
  "imageUrl"    text not null,
  city          text,
  country       text,
  year          integer,
  description   text,
  "sourceUrl"   text,
  "isVerified"  boolean default false,
  "createdAt"   timestamptz not null default now()
);


-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================

-- Enable RLS on all tables
alter table "users" enable row level security;
alter table "courseModules" enable row level security;
alter table "courseEnrollments" enable row level security;
alter table "courseProgress" enable row level security;
alter table "courseRegistrations" enable row level security;
alter table donations enable row level security;
alter table events enable row level security;
alter table "eventRegistrations" enable row level security;
alter table "hostApplications" enable row level security;
alter table "hostInvites" enable row level security;
alter table media enable row level security;
alter table certificates enable row level security;
alter table "emailSchedule" enable row level security;
alter table "passwordResets" enable row level security;
alter table "userAchievements" enable row level security;
alter table "stripeEvents" enable row level security;
alter table toolkits enable row level security;
alter table "forumCategories" enable row level security;
alter table "forumThreads" enable row level security;
alter table "forumPosts" enable row level security;
alter table "jamHighlights" enable row level security;


-- ============================================================================
-- Helper: check if current user has admin role
-- ============================================================================
create or replace function is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from "users"
    where id = auth.uid()::text
      and role = 'admin'
  );
$$;

-- ============================================================================
-- Helper: check if current user has host or admin role
-- ============================================================================
create or replace function is_host_or_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from "users"
    where id = auth.uid()::text
      and role in ('host', 'admin')
  );
$$;


-- ============================================================================
-- RLS Policies: users
-- ============================================================================
-- Anyone authenticated can read user profiles (needed for forum, events, etc.)
create policy "users_select_authenticated"
  on "users" for select
  to authenticated
  using (true);

-- Users can update their own profile
create policy "users_update_own"
  on "users" for update
  to authenticated
  using (id = auth.uid()::text)
  with check (id = auth.uid()::text);

-- Admins can update any user
create policy "users_update_admin"
  on "users" for update
  to authenticated
  using (is_admin());

-- Admins can insert users
create policy "users_insert_admin"
  on "users" for insert
  to authenticated
  with check (is_admin() or id = auth.uid()::text);

-- Admins can delete users
create policy "users_delete_admin"
  on "users" for delete
  to authenticated
  using (is_admin());

-- Service role can do anything (edge functions)
create policy "users_service_all"
  on "users" for all
  to service_role
  using (true);


-- ============================================================================
-- RLS Policies: courseModules (publicly readable)
-- ============================================================================
create policy "courseModules_select_all"
  on "courseModules" for select
  to authenticated
  using (true);

create policy "courseModules_admin_all"
  on "courseModules" for all
  to authenticated
  using (is_admin());

create policy "courseModules_service"
  on "courseModules" for all
  to service_role
  using (true);


-- ============================================================================
-- RLS Policies: courseEnrollments
-- ============================================================================
create policy "ce_select_own"
  on "courseEnrollments" for select
  to authenticated
  using ("userId" = auth.uid()::text or is_admin());

create policy "ce_insert_own"
  on "courseEnrollments" for insert
  to authenticated
  with check ("userId" = auth.uid()::text or is_admin());

create policy "ce_update_own"
  on "courseEnrollments" for update
  to authenticated
  using ("userId" = auth.uid()::text or is_admin());

create policy "ce_delete_admin"
  on "courseEnrollments" for delete
  to authenticated
  using (is_admin());

create policy "ce_service"
  on "courseEnrollments" for all
  to service_role
  using (true);


-- ============================================================================
-- RLS Policies: courseProgress
-- ============================================================================
create policy "cp_select_own"
  on "courseProgress" for select
  to authenticated
  using ("userId" = auth.uid()::text or is_admin());

create policy "cp_insert_own"
  on "courseProgress" for insert
  to authenticated
  with check ("userId" = auth.uid()::text);

create policy "cp_update_own"
  on "courseProgress" for update
  to authenticated
  using ("userId" = auth.uid()::text);

create policy "cp_service"
  on "courseProgress" for all
  to service_role
  using (true);


-- ============================================================================
-- RLS Policies: courseRegistrations
-- ============================================================================
create policy "cr_select"
  on "courseRegistrations" for select
  to authenticated
  using ("userId" = auth.uid()::text or is_admin());

create policy "cr_insert_own"
  on "courseRegistrations" for insert
  to authenticated
  with check ("userId" = auth.uid()::text);

create policy "cr_service"
  on "courseRegistrations" for all
  to service_role
  using (true);


-- ============================================================================
-- RLS Policies: donations
-- ============================================================================
create policy "donations_select_admin"
  on donations for select
  to authenticated
  using (is_admin());

create policy "donations_insert_auth"
  on donations for insert
  to authenticated
  with check (true);

create policy "donations_service"
  on donations for all
  to service_role
  using (true);


-- ============================================================================
-- RLS Policies: events (publicly readable)
-- ============================================================================
create policy "events_select_all"
  on events for select
  to authenticated
  using (true);

-- Allow anon access for public event listings
create policy "events_select_anon"
  on events for select
  to anon
  using (status = 'published' or status = 'completed');

create policy "events_insert_host"
  on events for insert
  to authenticated
  with check (is_host_or_admin());

create policy "events_update_own"
  on events for update
  to authenticated
  using ("hostId" = auth.uid()::text or is_admin());

create policy "events_delete_admin"
  on events for delete
  to authenticated
  using (is_admin());

create policy "events_service"
  on events for all
  to service_role
  using (true);


-- ============================================================================
-- RLS Policies: eventRegistrations
-- ============================================================================
create policy "er_select"
  on "eventRegistrations" for select
  to authenticated
  using (
    "participantId" = auth.uid()::text
    or is_host_or_admin()
  );

create policy "er_insert_own"
  on "eventRegistrations" for insert
  to authenticated
  with check ("participantId" = auth.uid()::text);

create policy "er_delete_own"
  on "eventRegistrations" for delete
  to authenticated
  using ("participantId" = auth.uid()::text or is_admin());

create policy "er_service"
  on "eventRegistrations" for all
  to service_role
  using (true);


-- ============================================================================
-- RLS Policies: hostApplications
-- ============================================================================
create policy "ha_select"
  on "hostApplications" for select
  to authenticated
  using ("userId" = auth.uid()::text or is_admin());

create policy "ha_insert_own"
  on "hostApplications" for insert
  to authenticated
  with check ("userId" = auth.uid()::text or "userId" is null);

create policy "ha_update_admin"
  on "hostApplications" for update
  to authenticated
  using (is_admin());

create policy "ha_service"
  on "hostApplications" for all
  to service_role
  using (true);


-- ============================================================================
-- RLS Policies: hostInvites
-- ============================================================================
create policy "hi_select"
  on "hostInvites" for select
  to authenticated
  using (true);

create policy "hi_insert_admin"
  on "hostInvites" for insert
  to authenticated
  with check (is_admin());

create policy "hi_update"
  on "hostInvites" for update
  to authenticated
  using (true);

create policy "hi_service"
  on "hostInvites" for all
  to service_role
  using (true);


-- ============================================================================
-- RLS Policies: media
-- ============================================================================
create policy "media_select_all"
  on media for select
  to authenticated
  using (true);

create policy "media_select_anon"
  on media for select
  to anon
  using (true);

create policy "media_insert_auth"
  on media for insert
  to authenticated
  with check (true);

create policy "media_update_own"
  on media for update
  to authenticated
  using ("uploadedBy" = auth.uid()::text or is_admin());

create policy "media_delete_admin"
  on media for delete
  to authenticated
  using (is_admin());

create policy "media_service"
  on media for all
  to service_role
  using (true);


-- ============================================================================
-- RLS Policies: certificates
-- ============================================================================
create policy "cert_select"
  on certificates for select
  to authenticated
  using ("recipientId" = auth.uid()::text or is_admin());

create policy "cert_insert_host"
  on certificates for insert
  to authenticated
  with check (is_host_or_admin());

create policy "cert_service"
  on certificates for all
  to service_role
  using (true);


-- ============================================================================
-- RLS Policies: emailSchedule
-- ============================================================================
create policy "es_select_admin"
  on "emailSchedule" for select
  to authenticated
  using (is_admin());

create policy "es_service"
  on "emailSchedule" for all
  to service_role
  using (true);


-- ============================================================================
-- RLS Policies: passwordResets
-- ============================================================================
create policy "pr_service"
  on "passwordResets" for all
  to service_role
  using (true);


-- ============================================================================
-- RLS Policies: userAchievements
-- ============================================================================
create policy "ua_select"
  on "userAchievements" for select
  to authenticated
  using ("userId" = auth.uid()::text or is_admin());

create policy "ua_insert_admin"
  on "userAchievements" for insert
  to authenticated
  with check (is_admin());

create policy "ua_service"
  on "userAchievements" for all
  to service_role
  using (true);


-- ============================================================================
-- RLS Policies: stripeEvents
-- ============================================================================
create policy "se_service"
  on "stripeEvents" for all
  to service_role
  using (true);


-- ============================================================================
-- RLS Policies: toolkits
-- ============================================================================
create policy "toolkits_select_all"
  on toolkits for select
  to authenticated
  using (true);

create policy "toolkits_select_anon"
  on toolkits for select
  to anon
  using ("isPublic" = true);

create policy "toolkits_insert_host"
  on toolkits for insert
  to authenticated
  with check (is_host_or_admin());

create policy "toolkits_update_own"
  on toolkits for update
  to authenticated
  using ("createdBy" = auth.uid()::text or is_admin());

create policy "toolkits_service"
  on toolkits for all
  to service_role
  using (true);


-- ============================================================================
-- RLS Policies: forumCategories
-- ============================================================================
create policy "fc_select_all"
  on "forumCategories" for select
  to authenticated
  using (true);

create policy "fc_admin_all"
  on "forumCategories" for all
  to authenticated
  using (is_admin());

create policy "fc_service"
  on "forumCategories" for all
  to service_role
  using (true);


-- ============================================================================
-- RLS Policies: forumThreads
-- ============================================================================
create policy "fthread_select_all"
  on "forumThreads" for select
  to authenticated
  using (true);

create policy "fthread_insert_auth"
  on "forumThreads" for insert
  to authenticated
  with check (true);

create policy "fthread_update_own"
  on "forumThreads" for update
  to authenticated
  using ("authorId" = auth.uid()::text or is_admin());

create policy "fthread_delete_admin"
  on "forumThreads" for delete
  to authenticated
  using (is_admin());

create policy "fthread_service"
  on "forumThreads" for all
  to service_role
  using (true);


-- ============================================================================
-- RLS Policies: forumPosts
-- ============================================================================
create policy "fpost_select_all"
  on "forumPosts" for select
  to authenticated
  using (true);

create policy "fpost_insert_auth"
  on "forumPosts" for insert
  to authenticated
  with check (true);

create policy "fpost_update_own"
  on "forumPosts" for update
  to authenticated
  using ("authorId" = auth.uid()::text or is_admin());

create policy "fpost_delete_admin"
  on "forumPosts" for delete
  to authenticated
  using (is_admin());

create policy "fpost_service"
  on "forumPosts" for all
  to service_role
  using (true);


-- ============================================================================
-- RLS Policies: jamHighlights
-- ============================================================================
create policy "jh_select_all"
  on "jamHighlights" for select
  to authenticated
  using (true);

create policy "jh_select_anon"
  on "jamHighlights" for select
  to anon
  using ("isVerified" = true);

create policy "jh_insert_admin"
  on "jamHighlights" for insert
  to authenticated
  with check (is_admin());

create policy "jh_update_admin"
  on "jamHighlights" for update
  to authenticated
  using (is_admin());

create policy "jh_service"
  on "jamHighlights" for all
  to service_role
  using (true);


-- ============================================================================
-- Storage Buckets
-- ============================================================================
-- These need to be created via the Supabase dashboard or supabase CLI:
--   supabase storage create jams --public
--   supabase storage create events --public
--   supabase storage create supporter-logos --public
--   supabase storage create uploads --public

-- Storage policies (applied via dashboard or SQL):
-- jams: public read, authenticated write
-- events: public read, host/admin write
-- supporter-logos: public read, admin write
-- uploads: public read, authenticated write
