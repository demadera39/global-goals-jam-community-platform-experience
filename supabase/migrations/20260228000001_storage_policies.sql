-- ============================================================================
-- Storage Bucket Creation & Policies
-- ============================================================================

-- Create public buckets
insert into storage.buckets (id, name, public)
values
  ('jams', 'jams', true),
  ('events', 'events', true),
  ('supporter-logos', 'supporter-logos', true),
  ('uploads', 'uploads', true)
on conflict (id) do nothing;

-- ============================================================================
-- jams bucket: public read, authenticated write
-- ============================================================================
create policy "jams_public_read"
  on storage.objects for select
  using (bucket_id = 'jams');

create policy "jams_auth_insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'jams');

create policy "jams_auth_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'jams');

create policy "jams_admin_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'jams'
    and exists (
      select 1 from "users"
      where id = auth.uid()::text and role in ('host', 'admin')
    )
  );

-- ============================================================================
-- events bucket: public read, host/admin write
-- ============================================================================
create policy "events_public_read"
  on storage.objects for select
  using (bucket_id = 'events');

create policy "events_host_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'events'
    and exists (
      select 1 from "users"
      where id = auth.uid()::text and role in ('host', 'admin')
    )
  );

create policy "events_host_update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'events'
    and exists (
      select 1 from "users"
      where id = auth.uid()::text and role in ('host', 'admin')
    )
  );

create policy "events_admin_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'events'
    and exists (
      select 1 from "users"
      where id = auth.uid()::text and role = 'admin'
    )
  );

-- ============================================================================
-- supporter-logos bucket: public read, admin write
-- ============================================================================
create policy "logos_public_read"
  on storage.objects for select
  using (bucket_id = 'supporter-logos');

create policy "logos_admin_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'supporter-logos'
    and exists (
      select 1 from "users"
      where id = auth.uid()::text and role = 'admin'
    )
  );

create policy "logos_admin_update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'supporter-logos'
    and exists (
      select 1 from "users"
      where id = auth.uid()::text and role = 'admin'
    )
  );

create policy "logos_admin_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'supporter-logos'
    and exists (
      select 1 from "users"
      where id = auth.uid()::text and role = 'admin'
    )
  );

-- ============================================================================
-- uploads bucket: public read, authenticated write
-- ============================================================================
create policy "uploads_public_read"
  on storage.objects for select
  using (bucket_id = 'uploads');

create policy "uploads_auth_insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'uploads');

create policy "uploads_auth_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'uploads');

create policy "uploads_admin_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'uploads'
    and exists (
      select 1 from "users"
      where id = auth.uid()::text and role = 'admin'
    )
  );
