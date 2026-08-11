-- ---------------------------------------------------------------------
-- animal-photos storage bucket — backs Enrollment Mode's attach_photo
-- offline queue operation (session-pack.md, Session 5a). Private
-- bucket, signed URLs only on read (CLAUDE.md §7), same as "documents"
-- (0024_documents_storage.sql).
--
-- Deliberately scoped by org_id ALONE, not has_animal_access() the way
-- documents is: a photo captured offline needs to upload to Storage
-- BEFORE its animal row has synced (the row is created by a separate
-- create_animal queue entry that may not have landed yet), and
-- has_animal_access() would reject the upload since it checks for an
-- existing animals row. Org membership is all that's actually needed
-- to know the upload is legitimate — the eventual
-- `update animals set photo_path = ...` step is still protected by
-- animals' own RLS (has_ranch_access), which is the check that
-- actually matters once the row exists.
--
-- Path convention: {org_id}/{animal_id}/photo.webp (+ thumb.webp) —
-- animal_id is client-generated (UUIDv7, lib/offline/queue.ts), shared
-- between the create_animal and attach_photo queue entries for the
-- same enrollment.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('animal-photos', 'animal-photos', false)
on conflict (id) do nothing;

create policy animal_photos_select on storage.objects for select
  to authenticated
  using (bucket_id = 'animal-photos' and (storage.foldername(name))[1] = auth_org_id()::text);

create policy animal_photos_insert on storage.objects for insert
  to authenticated
  with check (bucket_id = 'animal-photos' and (storage.foldername(name))[1] = auth_org_id()::text);

create policy animal_photos_update on storage.objects for update
  to authenticated
  using (bucket_id = 'animal-photos' and (storage.foldername(name))[1] = auth_org_id()::text)
  with check (bucket_id = 'animal-photos' and (storage.foldername(name))[1] = auth_org_id()::text);
