-- ---------------------------------------------------------------------
-- Session 8 (M3 remainder) — Record Treatment, Record Illness, Record
-- Vet Visit. Same shape as bulk_health_event/bulk_weight_event
-- (0017_rpc.sql): SECURITY DEFINER, per-animal has_ranch_access check,
-- one insert per selected animal. Treatments and illnesses are
-- offline-ineligible (CLAUDE.md §8's five queued operations are fixed —
-- create_animal, attach_photo, create_health_event, create_weight,
-- create_movement — treatment/illness/vet-visit are not among them),
-- so these RPCs are only ever called online; the client shows "requires
-- connectivity" rather than queueing.
-- ---------------------------------------------------------------------

create or replace function bulk_treatment_event(
  p_animal_ids               uuid[],
  p_treatment_date           date,
  p_illness_id               uuid default null,
  p_medication_id            uuid default null,
  p_custom_medication        text default null,
  p_dosage                   text default null,
  p_route                    text default null,
  p_duration_days            integer default null,
  p_administered_by_profile  uuid default null,
  p_veterinarian_id          uuid default null,
  p_withdrawal_until         date default null,
  p_outcome                  text default null,
  p_follow_up_date           date default null,
  p_notes                    text default null
)
returns setof treatments
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
      insert into treatments (
        org_id, animal_id, illness_id, medication_id, custom_medication, treatment_date, dosage, route,
        duration_days, administered_by_profile, veterinarian_id, withdrawal_until, outcome, follow_up_date,
        notes, created_by
      ) values (
        v_org_id, v_animal_id, p_illness_id, p_medication_id, p_custom_medication, p_treatment_date, p_dosage, p_route,
        p_duration_days, coalesce(p_administered_by_profile, auth.uid()), p_veterinarian_id, p_withdrawal_until, p_outcome,
        p_follow_up_date, p_notes, auth.uid()
      )
      returning *;
  end loop;
end;
$$;

create or replace function bulk_illness_event(
  p_animal_ids      uuid[],
  p_onset_date      date,
  p_severity        text,
  p_illness_type_id uuid default null,
  p_custom_name     text default null,
  p_symptoms        text default null,
  p_diagnosis       text default null,
  p_diagnosed_by    text default null,
  p_status          text default 'suspected',
  p_resolved_date   date default null,
  p_notes           text default null
)
returns setof illnesses
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
      insert into illnesses (
        org_id, animal_id, illness_type_id, custom_name, onset_date, symptoms, severity,
        diagnosis, diagnosed_by, status, resolved_date, notes, created_by
      ) values (
        v_org_id, v_animal_id, p_illness_type_id, p_custom_name, p_onset_date, p_symptoms, p_severity,
        p_diagnosis, p_diagnosed_by, p_status, p_resolved_date, p_notes, auth.uid()
      )
      returning *;
  end loop;
end;
$$;

-- ---------------------------------------------------------------------
-- record_vet_visit — unlike the two above, a vet visit is naturally
-- one-record-many-animals already (vet_visits + the vet_visit_animals
-- junction, 0007_health.sql), not N independent rows, so this is a
-- single insert into vet_visits followed by N junction rows rather than
-- a per-animal loop of full inserts. vet_visits.ranch_id is NOT NULL —
-- a visit happens at one physical place — so every selected animal must
-- share one ranch; this raises rather than silently picking the first
-- animal's ranch and mis-scoping the rest.
-- ---------------------------------------------------------------------
create or replace function record_vet_visit(
  p_animal_ids       uuid[],
  p_visit_date       date,
  p_veterinarian_id  uuid default null,
  p_purpose          text default null,
  p_findings         text default null,
  p_recommendations  text default null,
  p_next_visit_date  date default null,
  p_notes            text default null
)
returns vet_visits
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id         uuid;
  v_ranch_id       uuid;
  v_ranch_count    integer;
  v_animal_id      uuid;
  v_visit          vet_visits;
begin
  if array_length(p_animal_ids, 1) is null or array_length(p_animal_ids, 1) = 0 then
    raise exception 'at least one animal is required';
  end if;

  select count(distinct ranch_id), min(ranch_id), min(org_id) into v_ranch_count, v_ranch_id, v_org_id
  from animals
  where id = any(p_animal_ids) and deleted_at is null;

  if v_ranch_count is null or v_ranch_count = 0 then
    raise exception 'animal not found';
  end if;

  if v_ranch_count > 1 then
    raise exception 'all animals on a vet visit must be on the same ranch';
  end if;

  if v_org_id is distinct from auth_org_id() then
    raise exception 'animal not found';
  end if;

  if not has_ranch_access(v_ranch_id) then
    raise exception 'you do not have access to this ranch';
  end if;

  insert into vet_visits (
    org_id, ranch_id, veterinarian_id, visit_date, purpose, findings, recommendations, next_visit_date, notes, created_by
  ) values (
    v_org_id, v_ranch_id, p_veterinarian_id, p_visit_date, p_purpose, p_findings, p_recommendations, p_next_visit_date, p_notes, auth.uid()
  )
  returning * into v_visit;

  foreach v_animal_id in array p_animal_ids
  loop
    insert into vet_visit_animals (org_id, vet_visit_id, animal_id, created_by)
    values (v_org_id, v_visit.id, v_animal_id, auth.uid());
  end loop;

  return v_visit;
end;
$$;

grant execute on function bulk_treatment_event to authenticated;
grant execute on function bulk_illness_event to authenticated;
grant execute on function record_vet_visit to authenticated;
