-- Jam Memories (/memories): the main site uses app-layer auth, so visitors
-- hit storage as anon. Allow public inserts into the uploads bucket, but only
-- under the memories/ prefix; everything else in the bucket keeps requiring
-- an authenticated session. Reads were already public (uploads_public_read).
create policy "uploads_memories_public_insert" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'uploads' and (storage.foldername(name))[1] = 'memories');
