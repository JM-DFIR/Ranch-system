-- ---------------------------------------------------------------------
-- Ranches module (blueprint.md §4.1 coverage matrix: "Ranch List ·
-- Create/Edit Ranch · Ranch Detail · Sections") — ranches.cover_image_path
-- has existed since 0004_ranches.sql, but nothing has ever written or
-- read it; this is that storage.
--
-- Path convention: {org_id}/{ranch_id}/cover.webp. Unlike animal-photos
-- (0025), the ranch row always exists BEFORE its cover is uploaded —
-- ranch creation is online-only (owner-only, never one of the five
-- offline queue operations), so there's no chicken-and-egg problem to
-- work around the way Enrollment Mode has. That means the policy can
-- use has_ranch_access()/is_owner() directly against a real ranch_id,
-- not fall back to org-only scoping the way animal-photos had to.
--
-- Read: anyone with access to the ranch (has_ranch_access — owner
-- always, a manager if assigned), matching ranches_select itself.
-- Write: owner-only, matching ranches_owner_update — editing a ranch's
-- cover is the same "structural, not operational" action as editing
-- any other ranch field (CLAUDE.md/0014_rls.sql's ranch_sections
-- comment draws this exact line between structural and operational).
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('ranch-covers', 'ranch-covers', false)
on conflict (id) do nothing;

create policy ranch_covers_select on storage.objects for select
  to authenticated
  using (bucket_id = 'ranch-covers' and has_ranch_access(((storage.foldername(name))[2])::uuid));

create policy ranch_covers_insert on storage.objects for insert
  to authenticated
  with check (bucket_id = 'ranch-covers' and is_owner() and (storage.foldername(name))[1] = auth_org_id()::text);

create policy ranch_covers_update on storage.objects for update
  to authenticated
  using (bucket_id = 'ranch-covers' and is_owner() and (storage.foldername(name))[1] = auth_org_id()::text)
  with check (bucket_id = 'ranch-covers' and is_owner() and (storage.foldername(name))[1] = auth_org_id()::text);
