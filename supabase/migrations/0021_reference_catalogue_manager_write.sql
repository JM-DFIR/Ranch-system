-- ---------------------------------------------------------------------
-- Reference/lookup tables — relax insert/update from owner-only to any
-- org member (owner or ranch manager). Policy decision made explicitly
-- with the client, 2026-08-11, superseding the original "owner extends
-- the catalogue" design in 0014_rls.sql: species, breeds, animal_statuses,
-- veterinarians, vaccines, medications, illness_types, feed_items and
-- care_activity_types can now be extended and soft-deleted by any
-- authenticated member of the org, not just is_owner().
--
-- These tables have no ranch_id — a manager assigned to a single ranch
-- can still add/deactivate a breed used org-wide, same as the owner
-- already could. That's accepted as correct, not an oversight: it
-- mirrors how the catalogue already behaves for the owner (one shared
-- list, not per-ranch), confirmed with the client rather than assumed.
--
-- "Delete" is soft delete only, same as everywhere else in this system
-- (CLAUDE.md §6/§11) — this migration does not add any hard DELETE
-- policy, and none exists. A manager sets deleted_at via the same
-- update policy relaxed here; rows already referenced by an animal
-- stay in history regardless of deleted_at.
--
-- user management, org settings and the audit log remain untouched —
-- this migration only concerns the nine reference/lookup tables the
-- original 0014_rls.sql loop covered, not `invitations`,
-- `organizations`, `organization_settings`, or anything else gated by
-- is_owner() elsewhere.
-- ---------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'species', 'breeds', 'animal_statuses', 'veterinarians',
    'vaccines', 'medications', 'illness_types', 'feed_items', 'care_activity_types'
  ]
  loop
    execute format('drop policy if exists %I on %I', t || '_owner_insert', t);
    execute format('drop policy if exists %I on %I', t || '_owner_update', t);
    execute format(
      'create policy %I on %I for insert with check (org_id = auth_org_id())',
      t || '_member_insert', t
    );
    execute format(
      'create policy %I on %I for update using (org_id = auth_org_id()) with check (org_id = auth_org_id())',
      t || '_member_update', t
    );
  end loop;
end $$;
