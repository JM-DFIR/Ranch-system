-- ---------------------------------------------------------------------
-- record_movement — corrected in v3.0 (blueprint.md §3.3). Resolves
-- the animal's CURRENT ranch itself, server-side, and checks access
-- against that — never against a client-supplied from_ranch_id. No
-- access check on the destination: it's a pointer, not a read grant.
-- SECURITY DEFINER, so it bypasses RLS on `movements` and `animals`
-- entirely — the authorization check below is the enforcement, not a
-- courtesy, because nothing else will catch it.
-- ---------------------------------------------------------------------
create or replace function record_movement(
  p_animal_id     uuid,
  p_to_ranch_id   uuid,
  p_to_section_id uuid default null,
  p_movement_date date default current_date,
  p_reason        text default null,
  p_permit_number text default null,
  p_notes         text default null
)
returns movements
language plpgsql
security definer
set search_path = public
as $$
declare
  v_from_ranch_id   uuid;
  v_from_section_id uuid;
  v_org_id          uuid;
  v_movement        movements;
begin
  select ranch_id, section_id, org_id into v_from_ranch_id, v_from_section_id, v_org_id
  from animals
  where id = p_animal_id and deleted_at is null
  for update;

  if v_org_id is null or v_org_id is distinct from auth_org_id() then
    raise exception 'animal not found';
  end if;

  if not has_ranch_access(v_from_ranch_id) then
    raise exception 'you do not have access to this animal''s current ranch';
  end if;

  if p_to_ranch_id is null then
    raise exception 'destination ranch is required';
  end if;

  insert into movements (
    org_id, animal_id, from_ranch_id, from_section_id, to_ranch_id, to_section_id,
    movement_date, reason, permit_number, notes, recorded_by, created_by
  ) values (
    v_org_id, p_animal_id, v_from_ranch_id, v_from_section_id, p_to_ranch_id, p_to_section_id,
    p_movement_date, p_reason, p_permit_number, p_notes, auth.uid(), auth.uid()
  )
  returning * into v_movement;

  update animals
  set ranch_id = p_to_ranch_id, section_id = p_to_section_id
  where id = p_animal_id;

  return v_movement;
end;
$$;

-- ---------------------------------------------------------------------
-- record_death — inserts mortalities and flips the animal to Deceased
-- in one transaction (blueprint.md §2.9), which is what makes deceased
-- animals drop out of active counts while staying in history.
-- ---------------------------------------------------------------------
create or replace function record_death(
  p_animal_id        uuid,
  p_date_of_death     date,
  p_cause_category    text,
  p_cause_details      text default null,
  p_postmortem_done    boolean default false,
  p_disposal_method    text default null,
  p_notes              text default null
)
returns mortalities
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ranch_id            uuid;
  v_section_id          uuid;
  v_org_id              uuid;
  v_deceased_status_id  uuid;
  v_mortality           mortalities;
begin
  select ranch_id, section_id, org_id into v_ranch_id, v_section_id, v_org_id
  from animals
  where id = p_animal_id and deleted_at is null
  for update;

  if v_org_id is null or v_org_id is distinct from auth_org_id() then
    raise exception 'animal not found';
  end if;

  if not has_ranch_access(v_ranch_id) then
    raise exception 'you do not have access to this animal''s ranch';
  end if;

  select id into v_deceased_status_id
  from animal_statuses
  where org_id = v_org_id and name = 'Deceased' and deleted_at is null
  limit 1;

  if v_deceased_status_id is null then
    raise exception 'no "Deceased" status is configured for this organisation';
  end if;

  insert into mortalities (
    org_id, animal_id, date_of_death, ranch_id, section_id, cause_category,
    cause_details, postmortem_done, disposal_method, notes, created_by
  ) values (
    v_org_id, p_animal_id, p_date_of_death, v_ranch_id, v_section_id, p_cause_category,
    p_cause_details, p_postmortem_done, p_disposal_method, p_notes, auth.uid()
  )
  returning * into v_mortality;

  update animals set status_id = v_deceased_status_id where id = p_animal_id;

  return v_mortality;
end;
$$;

-- ---------------------------------------------------------------------
-- record_birth — one button, four tables, all or nothing (blueprint.md
-- §2.9): insert births, create N offspring animals rows with dam_id/
-- sire_id populated, insert birth_offspring (which in turn seeds a
-- weight_records row per offspring via the 0009 trigger), and mark the
-- breeding_events row delivered.
--
-- p_offspring is a jsonb array of objects:
--   { "tag_number": "M118", "sex": "female", "birth_weight": 3.2, "outcome": "live" }
-- sex/outcome default to 'unknown'/'live' when omitted.
-- ---------------------------------------------------------------------
create or replace function record_birth(
  p_dam_id             uuid,
  p_birth_date         date,
  p_offspring          jsonb,
  p_breeding_event_id  uuid default null,
  p_ease               text default 'unassisted',
  p_complications      text default null,
  p_notes              text default null
)
returns births
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id             uuid;
  v_ranch_id           uuid;
  v_section_id         uuid;
  v_species_id         uuid;
  v_sire_id            uuid;
  v_birth              births;
  v_offspring_item     jsonb;
  v_new_animal_id      uuid;
  v_live_status_id     uuid;
  v_deceased_status_id uuid;
begin
  select org_id, ranch_id, section_id, species_id into v_org_id, v_ranch_id, v_section_id, v_species_id
  from animals
  where id = p_dam_id and deleted_at is null;

  if v_org_id is null or v_org_id is distinct from auth_org_id() then
    raise exception 'dam not found';
  end if;

  if not has_ranch_access(v_ranch_id) then
    raise exception 'you do not have access to this dam''s ranch';
  end if;

  if p_breeding_event_id is not null then
    select sire_id into v_sire_id from breeding_events where id = p_breeding_event_id;
  end if;

  select id into v_live_status_id
    from animal_statuses where org_id = v_org_id and name = 'Active' and deleted_at is null limit 1;
  select id into v_deceased_status_id
    from animal_statuses where org_id = v_org_id and name = 'Deceased' and deleted_at is null limit 1;

  insert into births (org_id, breeding_event_id, dam_id, birth_date, litter_size, ease, complications, notes, created_by)
  values (
    v_org_id, p_breeding_event_id, p_dam_id, p_birth_date,
    greatest(jsonb_array_length(p_offspring), 1), p_ease, p_complications, p_notes, auth.uid()
  )
  returning * into v_birth;

  for v_offspring_item in select * from jsonb_array_elements(p_offspring)
  loop
    insert into animals (
      org_id, ranch_id, section_id, tag_number, species_id, sex, date_of_birth,
      acquisition_type, dam_id, sire_id, status_id, created_by
    ) values (
      v_org_id, v_ranch_id, v_section_id,
      v_offspring_item ->> 'tag_number',
      v_species_id,
      coalesce(v_offspring_item ->> 'sex', 'unknown'),
      p_birth_date,
      'born_on_ranch',
      p_dam_id,
      v_sire_id,
      case when coalesce(v_offspring_item ->> 'outcome', 'live') = 'live'
        then v_live_status_id else v_deceased_status_id end,
      auth.uid()
    )
    returning id into v_new_animal_id;

    insert into birth_offspring (org_id, birth_id, animal_id, sex, birth_weight, outcome, created_by)
    values (
      v_org_id, v_birth.id, v_new_animal_id,
      coalesce(v_offspring_item ->> 'sex', 'unknown'),
      nullif(v_offspring_item ->> 'birth_weight', '')::numeric,
      coalesce(v_offspring_item ->> 'outcome', 'live'),
      auth.uid()
    );
  end loop;

  if p_breeding_event_id is not null then
    update breeding_events set status = 'delivered' where id = p_breeding_event_id;
  end if;

  return v_birth;
end;
$$;

-- ---------------------------------------------------------------------
-- bulk_health_event — one action, N individual vaccination records.
-- This is the answer to bulk entry without violating "every animal has
-- its own record" (blueprint.md §2.9 / §0.3 signal 1).
-- ---------------------------------------------------------------------
create or replace function bulk_health_event(
  p_animal_ids               uuid[],
  p_vaccine_id               uuid,
  p_date_administered        date,
  p_dose                     text default null,
  p_batch_number             text default null,
  p_route                    text default null,
  p_administered_by_profile  uuid default null,
  p_veterinarian_id          uuid default null,
  p_next_due_date            date default null,
  p_notes                    text default null
)
returns setof vaccinations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_animal_id uuid;
  v_org_id    uuid;
  v_ranch_id  uuid;
begin
  foreach v_animal_id in array p_animal_ids
  loop
    select org_id, ranch_id into v_org_id, v_ranch_id
    from animals where id = v_animal_id and deleted_at is null;

    if v_org_id is null or v_org_id is distinct from auth_org_id() or not has_ranch_access(v_ranch_id) then
      raise exception 'you do not have access to animal %', v_animal_id;
    end if;

    return query
      insert into vaccinations (
        org_id, animal_id, vaccine_id, date_administered, dose, batch_number, route,
        administered_by_profile, veterinarian_id, next_due_date, notes, created_by
      ) values (
        v_org_id, v_animal_id, p_vaccine_id, p_date_administered, p_dose, p_batch_number, p_route,
        coalesce(p_administered_by_profile, auth.uid()), p_veterinarian_id, p_next_due_date, p_notes, auth.uid()
      )
      returning *;
  end loop;
end;
$$;

-- ---------------------------------------------------------------------
-- bulk_weight_event — same pattern, for Bulk Weigh Day (blueprint.md §2.3).
-- ---------------------------------------------------------------------
create or replace function bulk_weight_event(
  p_animal_ids            uuid[],
  p_weight_date           date,
  p_method                text,
  p_weight_kg             numeric default null,
  p_body_condition_score  smallint default null,
  p_notes                 text default null
)
returns setof weight_records
language plpgsql
security definer
set search_path = public
as $$
declare
  v_animal_id uuid;
  v_org_id    uuid;
  v_ranch_id  uuid;
begin
  if p_weight_kg is null and p_body_condition_score is null then
    raise exception 'a weight record needs a weight_kg, a body_condition_score, or both';
  end if;

  foreach v_animal_id in array p_animal_ids
  loop
    select org_id, ranch_id into v_org_id, v_ranch_id
    from animals where id = v_animal_id and deleted_at is null;

    if v_org_id is null or v_org_id is distinct from auth_org_id() or not has_ranch_access(v_ranch_id) then
      raise exception 'you do not have access to animal %', v_animal_id;
    end if;

    return query
      insert into weight_records (
        org_id, animal_id, weight_date, weight_kg, method, body_condition_score, recorded_by, notes, created_by
      ) values (
        v_org_id, v_animal_id, p_weight_date, p_weight_kg, p_method, p_body_condition_score, auth.uid(), p_notes, auth.uid()
      )
      returning *;
  end loop;
end;
$$;

-- ---------------------------------------------------------------------
-- next_tag_number — atomic per-(org, prefix) counter backing live
-- Enrollment Mode, Batch Enrollment and the Tag Range Generator
-- (blueprint.md §0.6 #1). UPDATE-first, INSERT-on-not-found, retrying
-- on a unique_violation race — safe under concurrent calls for the
-- same prefix, which is exactly what the pgTAP suite proves.
-- ---------------------------------------------------------------------
create or replace function next_tag_number(p_org_id uuid, p_prefix text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_allocated integer;
begin
  if p_org_id is distinct from auth_org_id() then
    raise exception 'not authorised for this organisation';
  end if;

  loop
    update tag_sequences
    set next_number = next_number + 1, updated_at = now()
    where org_id = p_org_id and prefix = p_prefix
    returning next_number - 1 into v_allocated;

    exit when found;

    begin
      insert into tag_sequences (org_id, prefix, next_number) values (p_org_id, p_prefix, 2);
      v_allocated := 1;
      exit;
    exception when unique_violation then
      -- another concurrent call inserted the row first — loop back and
      -- take the UPDATE branch instead.
    end;
  end loop;

  return p_prefix || v_allocated;
end;
$$;

-- ---------------------------------------------------------------------
-- touch_presence — the only writer of profiles.last_seen_at. A narrow
-- RPC rather than folding this into the general self-update policy
-- (blueprint.md §3.4), so it can never become a side channel for
-- anything else.
-- ---------------------------------------------------------------------
create or replace function touch_presence()
returns void
language sql
security definer
set search_path = public
as $$
  update profiles set last_seen_at = now() where id = auth.uid();
$$;
