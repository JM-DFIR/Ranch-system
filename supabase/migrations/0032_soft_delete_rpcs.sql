-- ---------------------------------------------------------------------
-- Soft-delete RPCs — a real bug found running the pgTAP suite for the
-- first time (never possible before now: this environment has no
-- Docker, so `supabase test db` has never actually executed until the
-- client ran it against his own machine).
--
-- Postgres RLS, for an UPDATE, requires the RESULTING row to satisfy
-- not just the UPDATE policy's own WITH CHECK, but also the table's
-- SELECT policy — confirmed directly against a real local instance,
-- policy-by-policy, not assumed. Every table in this schema whose
-- SELECT policy filters `deleted_at is null` (CLAUDE.md §6: a
-- soft-deleted row must be invisible even on a direct SELECT) rejects
-- a plain `update ... set deleted_at = now()` with 42501, because the
-- row being written can no longer see itself once deleted_at is set —
-- even though the UPDATE policy's own with_check (just `org_id =
-- auth_org_id()`, unrelated to deleted_at) would have allowed it.
--
-- This affects every soft-delete built as a plain client-side
-- `.update({ deleted_at })` against such a table: the nine reference
-- catalogues (species, breeds, animal_statuses, veterinarians,
-- vaccines, medications, illness_types, feed_items, care_activity_types
-- — veterinarians' "Remove" button has been broken since Session 8),
-- ranch_assignments (unassign), ranch_sections, and invitations
-- (revoke). It does NOT affect updates that leave deleted_at alone
-- (organization_settings has no deleted_at column at all; ranches'
-- structural edits don't touch deleted_at or id).
--
-- The fix follows this project's own existing precedent
-- (record_movement, record_death, next_tag_number, 0017_rpc.sql):
-- when plain client-RLS can't express a write, it goes through a
-- SECURITY DEFINER RPC that re-implements the same authorization check
-- manually and then writes with the function owner's privileges,
-- bypassing RLS (and therefore this SELECT-policy-on-UPDATE
-- interaction) entirely. Grouped into four functions by authorization
-- shape, not one per table — the nine reference catalogues share
-- identical authorization (any org member), so they share one
-- function with an allowlisted table-name parameter rather than nine
-- near-identical bodies.
-- ---------------------------------------------------------------------

-- Any org member (owner or manager) — matches
-- 0021_reference_catalogue_manager_write.sql exactly, the same check
-- that table's own RLS policy already makes.
create or replace function soft_delete_reference_row(p_table text, p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_table not in (
    'species', 'breeds', 'animal_statuses', 'veterinarians',
    'vaccines', 'medications', 'illness_types', 'feed_items', 'care_activity_types'
  ) then
    raise exception 'soft_delete_reference_row: % is not a reference catalogue table', p_table;
  end if;

  execute format('update %I set deleted_at = now() where id = $1 and org_id = $2', p_table)
    using p_id, auth_org_id();
end;
$$;

-- Owner-only — matches ranch_assignments_owner_update.
create or replace function unassign_ranch(p_assignment_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_owner() then
    raise exception 'only an owner may unassign a ranch';
  end if;

  update ranch_assignments
  set deleted_at = now()
  where id = p_assignment_id and org_id = auth_org_id();
end;
$$;

-- has_ranch_access-scoped, matching ranch_sections_update — manager-
-- writable for a ranch they're actually assigned to, same as the
-- section's own insert/update policy.
create or replace function soft_delete_ranch_section(p_section_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ranch_id uuid;
begin
  select ranch_id into v_ranch_id
  from ranch_sections
  where id = p_section_id and org_id = auth_org_id();

  if v_ranch_id is null or not has_ranch_access(v_ranch_id) then
    raise exception 'you do not have access to this ranch';
  end if;

  update ranch_sections set deleted_at = now() where id = p_section_id;
end;
$$;

-- Owner-only — matches invitations_owner_update.
create or replace function revoke_invitation(p_invitation_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_owner() then
    raise exception 'only an owner may revoke an invitation';
  end if;

  update invitations set deleted_at = now() where id = p_invitation_id and org_id = auth_org_id();
end;
$$;

grant execute on function soft_delete_reference_row(text, uuid) to authenticated;
grant execute on function unassign_ranch(uuid) to authenticated;
grant execute on function soft_delete_ranch_section(uuid) to authenticated;
grant execute on function revoke_invitation(uuid) to authenticated;
