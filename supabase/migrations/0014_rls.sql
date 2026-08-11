-- ---------------------------------------------------------------------
-- Row Level Security — every table, default deny, then explicit
-- policies. Three rules hold everywhere in this file:
--
--   1. Never `FOR ALL`. It silently includes DELETE, and this schema
--      has no hard-delete policy on any business table, ever — soft
--      delete via `deleted_at` is the only removal mechanism that
--      exists. Every policy below is FOR SELECT / INSERT / UPDATE only.
--   2. Tables written exclusively through a SECURITY DEFINER RPC
--      (movements, mortalities, births, birth_offspring) get a SELECT
--      policy and deliberately NO insert/update policy — default deny
--      blocks direct client writes, and the RPC itself replicates the
--      authorization check manually since it bypasses RLS by design.
--   3. Every SELECT policy on a table that carries `deleted_at` filters
--      `deleted_at is null`. Soft delete is meant to hide a row from
--      normal queries, not just from the v_animal_current view — a
--      direct SELECT against the base table must not see it either.
--      (UPDATE policies deliberately do NOT add this filter yet: there
--      is no restore/delete action built in this session, so nothing
--      sets deleted_at in the first place. Whichever session adds one
--      needs to decide the restore path before locking UPDATE down.)
-- ---------------------------------------------------------------------

-- organizations ---------------------------------------------------------
-- No deleted_at on this table (blueprint.md §2.2) — nothing to filter.
alter table organizations enable row level security;

create policy organizations_select on organizations for select
  using (id = auth_org_id());

create policy organizations_owner_update on organizations for update
  using (id = auth_org_id() and is_owner())
  with check (id = auth_org_id() and is_owner());
-- No INSERT policy: the first org for a signup is created by the
-- onboarding Edge Function under service_role, which bypasses RLS.

-- organization_settings --------------------------------------------------
alter table organization_settings enable row level security;

create policy organization_settings_select on organization_settings for select
  using (org_id = auth_org_id());

create policy organization_settings_owner_update on organization_settings for update
  using (org_id = auth_org_id() and is_owner())
  with check (org_id = auth_org_id() and is_owner());

-- profiles ----------------------------------------------------------------
-- No deleted_at on this table — is_active is the deactivation switch.
alter table profiles enable row level security;

create policy profiles_select on profiles for select
  using (org_id = auth_org_id());

create policy profiles_owner_insert on profiles for insert
  with check (org_id = auth_org_id() and is_owner());

create policy profiles_owner_update on profiles for update
  using (org_id = auth_org_id() and is_owner())
  with check (org_id = auth_org_id() and is_owner());

-- Any user may update their own row (full_name/phone/avatar_url/
-- last_seen_at). role/org_id changes are blocked by the
-- prevent_self_role_escalation trigger below, not by this policy —
-- RLS predicates can't compare OLD vs NEW column-by-column, so this is
-- the one place in the schema a trigger does authorization work RLS
-- can't express on its own. This is the v3.0 correction to a v2.0 draft
-- that made profiles owner-only for every operation, which silently
-- blocked managers from editing their own contact details.
create policy profiles_self_update on profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

create or replace function prevent_self_role_escalation()
returns trigger
language plpgsql
as $$
begin
  if not is_owner() and (new.role is distinct from old.role or new.org_id is distinct from old.org_id) then
    raise exception 'only an owner may change role or organisation';
  end if;
  return new;
end;
$$;

create trigger profiles_guard_role_escalation
  before update on profiles
  for each row execute function prevent_self_role_escalation();

-- touch_presence() (0017) is the only writer of last_seen_at — a
-- SECURITY DEFINER RPC, not the general self-update policy, so it can
-- never become a side channel for anything else.

-- invitations ---------------------------------------------------------
alter table invitations enable row level security;

create policy invitations_select on invitations for select
  using (org_id = auth_org_id() and is_owner() and deleted_at is null);

create policy invitations_owner_insert on invitations for insert
  with check (org_id = auth_org_id() and is_owner());

create policy invitations_owner_update on invitations for update
  using (org_id = auth_org_id() and is_owner())
  with check (org_id = auth_org_id() and is_owner());

-- ranches ---------------------------------------------------------------
alter table ranches enable row level security;

create policy ranches_select on ranches for select
  using (org_id = auth_org_id() and has_ranch_access(id) and deleted_at is null);

-- Creating and structurally editing a ranch (name, contacts, status) is
-- an owner action, distinct from operating within an assigned ranch —
-- see blueprint.md §0.6 #4.
create policy ranches_owner_insert on ranches for insert
  with check (org_id = auth_org_id() and is_owner());

create policy ranches_owner_update on ranches for update
  using (org_id = auth_org_id() and is_owner())
  with check (org_id = auth_org_id() and is_owner());

-- ranch_assignments -------------------------------------------------------
alter table ranch_assignments enable row level security;

create policy ranch_assignments_select on ranch_assignments for select
  using (org_id = auth_org_id() and (is_owner() or profile_id = auth.uid()) and deleted_at is null);

create policy ranch_assignments_owner_insert on ranch_assignments for insert
  with check (org_id = auth_org_id() and is_owner());

create policy ranch_assignments_owner_update on ranch_assignments for update
  using (org_id = auth_org_id() and is_owner())
  with check (org_id = auth_org_id() and is_owner());

-- ranch_sections ----------------------------------------------------------
-- Unlike the ranch itself, organising sections within a ranch you
-- already manage is operational, not structural — managers can write.
alter table ranch_sections enable row level security;

create policy ranch_sections_select on ranch_sections for select
  using (org_id = auth_org_id() and has_ranch_access(ranch_id) and deleted_at is null);

create policy ranch_sections_insert on ranch_sections for insert
  with check (org_id = auth_org_id() and has_ranch_access(ranch_id));

create policy ranch_sections_update on ranch_sections for update
  using (org_id = auth_org_id() and has_ranch_access(ranch_id))
  with check (org_id = auth_org_id() and has_ranch_access(ranch_id));

-- Reference/lookup tables ------------------------------------------------
-- Same shape for all nine: any org member can read (they're filling
-- forms with this data), only the owner can extend or edit the
-- catalogue.
do $$
declare
  t text;
begin
  foreach t in array array[
    'species', 'breeds', 'animal_statuses', 'veterinarians',
    'vaccines', 'medications', 'illness_types', 'feed_items', 'care_activity_types'
  ]
  loop
    execute format('alter table %I enable row level security', t);
    execute format(
      'create policy %I on %I for select using (org_id = auth_org_id() and deleted_at is null)',
      t || '_select', t
    );
    execute format(
      'create policy %I on %I for insert with check (org_id = auth_org_id() and is_owner())',
      t || '_owner_insert', t
    );
    execute format(
      'create policy %I on %I for update using (org_id = auth_org_id() and is_owner()) with check (org_id = auth_org_id() and is_owner())',
      t || '_owner_update', t
    );
  end loop;
end $$;

-- tag_sequences -----------------------------------------------------------
-- Touched only by the next_tag_number() RPC (SECURITY DEFINER, 0017).
-- No deleted_at on this table (blueprint.md §2.2 — a lean counter, not
-- a historical record). SELECT is exposed for debugging/admin
-- visibility; no client write path.
alter table tag_sequences enable row level security;

create policy tag_sequences_select on tag_sequences for select
  using (org_id = auth_org_id());

-- animals -----------------------------------------------------------------
alter table animals enable row level security;

create policy animals_select on animals for select
  using (org_id = auth_org_id() and has_ranch_access(ranch_id) and deleted_at is null);

create policy animals_insert on animals for insert
  with check (org_id = auth_org_id() and has_ranch_access(ranch_id));

create policy animals_update on animals for update
  using (org_id = auth_org_id() and has_ranch_access(ranch_id))
  with check (org_id = auth_org_id() and has_ranch_access(ranch_id));

-- vet_visits ----------------------------------------------------------------
alter table vet_visits enable row level security;

create policy vet_visits_select on vet_visits for select
  using (org_id = auth_org_id() and has_ranch_access(ranch_id) and deleted_at is null);

create policy vet_visits_insert on vet_visits for insert
  with check (org_id = auth_org_id() and has_ranch_access(ranch_id));

create policy vet_visits_update on vet_visits for update
  using (org_id = auth_org_id() and has_ranch_access(ranch_id))
  with check (org_id = auth_org_id() and has_ranch_access(ranch_id));

-- Animal-linked tables ------------------------------------------------------
-- Same shape for all: access follows the animal's current ranch via
-- has_animal_access() (which itself already excludes a soft-deleted
-- animal — see 0013). No FOR ALL, no DELETE, ever.
do $$
declare
  t text;
begin
  foreach t in array array['vet_visit_animals', 'vaccinations', 'illnesses', 'treatments', 'weight_records']
  loop
    execute format('alter table %I enable row level security', t);
    execute format(
      'create policy %I on %I for select using (org_id = auth_org_id() and has_animal_access(animal_id) and deleted_at is null)',
      t || '_select', t
    );
    execute format(
      'create policy %I on %I for insert with check (org_id = auth_org_id() and has_animal_access(animal_id))',
      t || '_insert', t
    );
    execute format(
      'create policy %I on %I for update using (org_id = auth_org_id() and has_animal_access(animal_id)) with check (org_id = auth_org_id() and has_animal_access(animal_id))',
      t || '_update', t
    );
  end loop;
end $$;

-- breeding_events -----------------------------------------------------------
alter table breeding_events enable row level security;

create policy breeding_events_select on breeding_events for select
  using (org_id = auth_org_id() and has_animal_access(dam_id) and deleted_at is null);

create policy breeding_events_insert on breeding_events for insert
  with check (org_id = auth_org_id() and has_animal_access(dam_id));

create policy breeding_events_update on breeding_events for update
  using (org_id = auth_org_id() and has_animal_access(dam_id))
  with check (org_id = auth_org_id() and has_animal_access(dam_id));

-- pregnancy_checks ------------------------------------------------------------
alter table pregnancy_checks enable row level security;

create policy pregnancy_checks_select on pregnancy_checks for select
  using (
    org_id = auth_org_id()
    and deleted_at is null
    and exists (
      select 1 from breeding_events be
      where be.id = pregnancy_checks.breeding_event_id and has_animal_access(be.dam_id)
    )
  );

create policy pregnancy_checks_insert on pregnancy_checks for insert
  with check (
    org_id = auth_org_id()
    and exists (
      select 1 from breeding_events be
      where be.id = pregnancy_checks.breeding_event_id and has_animal_access(be.dam_id)
    )
  );

create policy pregnancy_checks_update on pregnancy_checks for update
  using (
    org_id = auth_org_id()
    and exists (
      select 1 from breeding_events be
      where be.id = pregnancy_checks.breeding_event_id and has_animal_access(be.dam_id)
    )
  )
  with check (
    org_id = auth_org_id()
    and exists (
      select 1 from breeding_events be
      where be.id = pregnancy_checks.breeding_event_id and has_animal_access(be.dam_id)
    )
  );

-- births / birth_offspring — RPC-only writes -------------------------------
-- record_birth() (0017) inserts both tables, plus the offspring animals
-- rows, plus the breeding_events status update, all in one transaction.
-- No direct client insert/update policy on either table.
alter table births enable row level security;

create policy births_select on births for select
  using (org_id = auth_org_id() and has_animal_access(dam_id) and deleted_at is null);

alter table birth_offspring enable row level security;

create policy birth_offspring_select on birth_offspring for select
  using (org_id = auth_org_id() and has_animal_access(animal_id) and deleted_at is null);

-- movements — RPC-only writes, corrected policy ------------------------------
-- v3.0 correction (blueprint.md §3.3): the v2.0 draft permitted an
-- insert when the user had access to EITHER the source or destination
-- ranch, which let a manager with no access to an animal's real ranch
-- claim it into their own by lying about the destination. There is now
-- no client insert/update policy at all — record_movement() resolves
-- the animal's current ranch_id itself and checks has_ranch_access
-- against that, never against a client-supplied from_ranch_id. Do not
-- add an insert policy here without re-reading that section first.
alter table movements enable row level security;

create policy movements_select on movements for select
  using (
    org_id = auth_org_id()
    and (has_ranch_access(from_ranch_id) or has_ranch_access(to_ranch_id))
    and deleted_at is null
  );

-- mortalities — RPC-only writes ----------------------------------------------
alter table mortalities enable row level security;

create policy mortalities_select on mortalities for select
  using (org_id = auth_org_id() and has_ranch_access(ranch_id) and deleted_at is null);

-- feeding_records / care_activities ------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array['feeding_records', 'care_activities']
  loop
    execute format('alter table %I enable row level security', t);
    execute format(
      $f$create policy %I on %I for select using (
        org_id = auth_org_id() and deleted_at is null and (
          (ranch_id is not null and has_ranch_access(ranch_id)) or
          (animal_id is not null and has_animal_access(animal_id))
        )
      )$f$,
      t || '_select', t
    );
    execute format(
      $f$create policy %I on %I for insert with check (
        org_id = auth_org_id() and (
          (ranch_id is not null and has_ranch_access(ranch_id)) or
          (animal_id is not null and has_animal_access(animal_id))
        )
      )$f$,
      t || '_insert', t
    );
    execute format(
      $f$create policy %I on %I for update using (
        org_id = auth_org_id() and (
          (ranch_id is not null and has_ranch_access(ranch_id)) or
          (animal_id is not null and has_animal_access(animal_id))
        )
      ) with check (
        org_id = auth_org_id() and (
          (ranch_id is not null and has_ranch_access(ranch_id)) or
          (animal_id is not null and has_animal_access(animal_id))
        )
      )$f$,
      t || '_update', t
    );
  end loop;
end $$;

-- attachments -----------------------------------------------------------------
alter table attachments enable row level security;

create policy attachments_select on attachments for select
  using (
    org_id = auth_org_id()
    and deleted_at is null
    and (
      (entity_type = 'animal' and has_animal_access(entity_id)) or
      (entity_type = 'ranch' and has_ranch_access(entity_id))
    )
  );

create policy attachments_insert on attachments for insert
  with check (
    org_id = auth_org_id() and (
      (entity_type = 'animal' and has_animal_access(entity_id)) or
      (entity_type = 'ranch' and has_ranch_access(entity_id))
    )
  );

create policy attachments_update on attachments for update
  using (
    org_id = auth_org_id() and (
      (entity_type = 'animal' and has_animal_access(entity_id)) or
      (entity_type = 'ranch' and has_ranch_access(entity_id))
    )
  )
  with check (
    org_id = auth_org_id() and (
      (entity_type = 'animal' and has_animal_access(entity_id)) or
      (entity_type = 'ranch' and has_ranch_access(entity_id))
    )
  );

-- audit_log — owner-only read, no client write path ----------------------------
-- No deleted_at on this table — it is the record of history, not a
-- thing history happens to (0012).
alter table audit_log enable row level security;

create policy audit_log_select on audit_log for select
  using (org_id = auth_org_id() and is_owner());

-- reminders — inert in v1, still fully scoped ------------------------------------
alter table reminders enable row level security;

create policy reminders_select on reminders for select
  using (
    org_id = auth_org_id()
    and deleted_at is null
    and (ranch_id is null or has_ranch_access(ranch_id))
    and (animal_id is null or has_animal_access(animal_id))
  );

create policy reminders_insert on reminders for insert
  with check (
    org_id = auth_org_id()
    and (ranch_id is null or has_ranch_access(ranch_id))
    and (animal_id is null or has_animal_access(animal_id))
  );

create policy reminders_update on reminders for update
  using (
    org_id = auth_org_id()
    and (ranch_id is null or has_ranch_access(ranch_id))
    and (animal_id is null or has_animal_access(animal_id))
  )
  with check (
    org_id = auth_org_id()
    and (ranch_id is null or has_ranch_access(ranch_id))
    and (animal_id is null or has_animal_access(animal_id))
  );
