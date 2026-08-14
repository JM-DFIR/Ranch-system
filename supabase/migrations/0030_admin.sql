-- ---------------------------------------------------------------------
-- M7 — Admin & Hardening (blueprint.md Part 7 / §4.1's ADMIN(5) screen
-- set): Users & Roles, Invite User, Reference Data Manager, Audit Log,
-- Organisation Settings.
-- ---------------------------------------------------------------------

-- ---------------------------------------------------------------------
-- ranch_assignments carried the same latent bug 0022 already fixed for
-- species/breeds/animal_statuses: a plain `unique (ranch_id, profile_id)`
-- table constraint, not scoped to `deleted_at is null`. Nothing exercised
-- it until now — Ranch Assignments editing (this migration's reason for
-- existing) unassigns a manager by soft-deleting their row, and
-- reassigning them later re-inserts one for the same (ranch_id,
-- profile_id) pair. Without this fix that insert fails with
-- unique_violation against the old soft-deleted row, forever — the same
-- "soft delete that isn't actually reversible" bug 0022's own comment
-- describes, just not caught until this table got a real write UI.
-- ---------------------------------------------------------------------
do $$
declare
  c record;
begin
  for c in
    select conname, conrelid::regclass::text as tbl
    from pg_constraint
    where contype = 'u'
      and conrelid = 'ranch_assignments'::regclass
  loop
    execute format('alter table %s drop constraint %I', c.tbl, c.conname);
  end loop;
end $$;

create unique index if not exists ranch_assignments_ranch_id_profile_id_unique
  on ranch_assignments (ranch_id, profile_id) where deleted_at is null;

-- ---------------------------------------------------------------------
-- v_org_members — Users & Roles register. Aggregates each profile's
-- live ranch assignments so the register doesn't do it client-side
-- (blueprint.md §2.1 rule: "aggregation happens in Postgres views").
-- security_invoker, same as every other view in this project — relies
-- entirely on profiles_select (org-wide, any member) and
-- ranch_assignments_select (owner sees all, a manager sees only their
-- own row) already carrying the real RLS; no redundant org filter here.
-- ---------------------------------------------------------------------
create or replace view v_org_members
with (security_invoker = true)
as
select
  p.id,
  p.org_id,
  p.full_name,
  p.email,
  p.phone,
  p.role,
  p.is_active,
  p.last_seen_at,
  p.created_at,
  coalesce(
    (
      select array_agg(r.name order by r.name)
      from ranch_assignments ra
      join ranches r on r.id = ra.ranch_id
      where ra.profile_id = p.id and ra.deleted_at is null and r.deleted_at is null
    ),
    array[]::text[]
  ) as ranch_names,
  (
    select count(*)
    from ranch_assignments ra
    where ra.profile_id = p.id and ra.deleted_at is null
  ) as ranch_count
from profiles p;

-- ---------------------------------------------------------------------
-- v_audit_log — the Audit Log viewer's read side. Joins the actor's
-- name so the UI never resolves actor_id -> profile client-side row by
-- row. security_invoker: audit_log_select is already owner-only
-- (org_id = auth_org_id() and is_owner()), so this view inherits that
-- exactly — a manager querying it directly gets zero rows, same as
-- querying audit_log itself.
-- ---------------------------------------------------------------------
create or replace view v_audit_log
with (security_invoker = true)
as
select
  al.id,
  al.org_id,
  al.actor_id,
  p.full_name as actor_name,
  al.table_name,
  al.record_id,
  al.action,
  al.before,
  al.after,
  al.occurred_at
from audit_log al
left join profiles p on p.id = al.actor_id;

grant select on v_org_members to authenticated;
grant select on v_audit_log to authenticated;
