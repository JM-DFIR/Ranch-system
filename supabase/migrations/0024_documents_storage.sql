-- ---------------------------------------------------------------------
-- documents storage bucket — backs the animal profile's Documents tab
-- (session-pack.md, Session 4: "reads from attachments (entity_type =
-- 'animal'), upload/view/download, signed URLs only"). Private bucket,
-- no public read — every read goes through a signed URL generated
-- client-side against the caller's own session (CLAUDE.md §7).
--
-- Not part of the offline write queue: attachments/documents are not
-- one of the five whitelisted queue operations (CLAUDE.md §8), so this
-- is a plain online-only upload, unlike animals.photo_path which is
-- explicitly Session 5a/5b's camera + compression + offline pipeline.
-- A different column, a different table, a different session.
--
-- Path convention: {org_id}/{animal_id}/{uuid}-{filename} — the
-- animal_id segment is what has_animal_access() below checks against,
-- which already folds in org_id + current ranch access + "not a
-- soft-deleted animal" (0013_helpers_auth.sql). No DELETE policy: a
-- removed document is a soft-deleted `attachments` row, same as
-- everywhere else — the underlying object is left in place rather than
-- adding the one hard-delete path in the whole system for it.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

create policy documents_select on storage.objects for select
  to authenticated
  using (
    bucket_id = 'documents'
    and has_animal_access(((storage.foldername(name))[2])::uuid)
  );

create policy documents_insert on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'documents'
    and has_animal_access(((storage.foldername(name))[2])::uuid)
  );
