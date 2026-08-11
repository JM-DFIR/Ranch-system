-- ---------------------------------------------------------------------
-- v_recent_activity — extended for the Timeline tab (Session 4). The
-- original view (0016_views.sql) already existed to power both the
-- dashboard's recent-activity feed and, filtered to one animal, the
-- Timeline — but it was missing three event types the Timeline's own
-- spec calls for (vet visits, illness resolution, the animal's own
-- birth/acquisition as its first event), had no actor display name,
-- and no per-row identity or expand detail. All fixed here rather than
-- forking a second view, per the original comment's intent.
--
-- New columns (actor_name, source_id, details) are appended after the
-- existing ones rather than interleaved — CREATE OR REPLACE VIEW
-- rejects a column being renamed or reordered, only appended (the
-- exact 42P16 mistake 0020 made and fixed once already).
--
-- `details` is a small type-specific jsonb blob (dose/route/withdrawal/
-- etc.) so the Timeline can expand an entry in place without a second
-- query per row while someone scrolls a life's worth of events.
-- `source_id` + `event_type` together are the row's real identity —
-- there is no single id column since branches come from different
-- source tables.
--
-- WITH (security_invoker = true) is restated explicitly, same as
-- 0020_animal_register.sql's v_animal_current fix — CREATE OR REPLACE
-- VIEW does not carry the option forward from 0019's ALTER VIEW, and
-- omitting it here would silently reopen the exact RLS-bypass 0019
-- fixed for this same view. The ALTER VIEW after is the same redundant
-- safety net 0020 used.
-- ---------------------------------------------------------------------
create or replace view v_recent_activity
with (security_invoker = true)
as
select
  org_id, ranch_id, animal_id, event_type, event_date, description, actor_id, occurred_at,
  actor_name, source_id, details
from (
  select v.org_id, a.ranch_id, v.animal_id, 'vaccination'::text as event_type, v.date_administered as event_date,
    'Vaccinated against ' || coalesce(vac.target_disease, vac.name) as description,
    v.created_by as actor_id, v.created_at as occurred_at,
    p.full_name as actor_name, v.id as source_id,
    jsonb_build_object(
      'vaccine_name', vac.name, 'dose', v.dose, 'batch_number', v.batch_number, 'route', v.route,
      'next_due_date', v.next_due_date, 'veterinarian_name', vet.name
    ) as details
  from vaccinations v
  join animals a on a.id = v.animal_id
  join vaccines vac on vac.id = v.vaccine_id
  left join profiles p on p.id = v.created_by
  left join veterinarians vet on vet.id = v.veterinarian_id
  where v.deleted_at is null

  union all

  select t.org_id, a.ranch_id, t.animal_id, 'treatment', t.treatment_date,
    'Treated with ' || coalesce(m.name, t.custom_medication, 'medication'),
    t.created_by, t.created_at,
    p.full_name, t.id,
    jsonb_build_object(
      'medication_name', coalesce(m.name, t.custom_medication), 'dosage', t.dosage, 'route', t.route,
      'duration_days', t.duration_days, 'withdrawal_until', t.withdrawal_until, 'outcome', t.outcome,
      'veterinarian_name', vet.name
    )
  from treatments t
  join animals a on a.id = t.animal_id
  left join medications m on m.id = t.medication_id
  left join profiles p on p.id = t.created_by
  left join veterinarians vet on vet.id = t.veterinarian_id
  where t.deleted_at is null

  union all

  -- Illness onset and resolution are two separate spine entries — a
  -- resolved illness is worth its own "back to health" moment on the
  -- Timeline, not just a mutated onset row.
  select i.org_id, a.ranch_id, i.animal_id, 'illness', i.onset_date,
    coalesce(it.name, i.custom_name, 'Illness') || ' reported',
    i.created_by, i.created_at,
    p.full_name, i.id,
    jsonb_build_object('illness_name', coalesce(it.name, i.custom_name), 'severity', i.severity, 'symptoms', i.symptoms)
  from illnesses i
  join animals a on a.id = i.animal_id
  left join illness_types it on it.id = i.illness_type_id
  left join profiles p on p.id = i.created_by
  where i.deleted_at is null

  union all

  select i.org_id, a.ranch_id, i.animal_id, 'illness_resolved', i.resolved_date,
    coalesce(it.name, i.custom_name, 'Illness') || ' resolved',
    i.updated_by, i.updated_at,
    p.full_name, i.id,
    jsonb_build_object('illness_name', coalesce(it.name, i.custom_name))
  from illnesses i
  join animals a on a.id = i.animal_id
  left join illness_types it on it.id = i.illness_type_id
  left join profiles p on p.id = i.updated_by
  where i.deleted_at is null and i.status = 'recovered' and i.resolved_date is not null

  union all

  select w.org_id, a.ranch_id, w.animal_id, 'weight', w.weight_date,
    case when w.weight_kg is not null then 'Weighed at ' || w.weight_kg || ' kg' else 'Body condition scored' end,
    w.created_by, w.created_at,
    p.full_name, w.id,
    jsonb_build_object('weight_kg', w.weight_kg, 'body_condition_score', w.body_condition_score, 'method', w.method)
  from weight_records w
  join animals a on a.id = w.animal_id
  left join profiles p on p.id = w.created_by
  where w.deleted_at is null

  union all

  select mv.org_id, mv.to_ranch_id as ranch_id, mv.animal_id, 'movement', mv.movement_date,
    'Moved to ' || r2.name,
    mv.created_by, mv.created_at,
    p.full_name, mv.id,
    jsonb_build_object('from_ranch_name', r1.name, 'to_ranch_name', r2.name, 'reason', mv.reason)
  from movements mv
  join ranches r1 on r1.id = mv.from_ranch_id
  join ranches r2 on r2.id = mv.to_ranch_id
  left join profiles p on p.id = mv.created_by
  where mv.deleted_at is null

  union all

  select be.org_id, a.ranch_id, be.dam_id as animal_id, 'breeding', coalesce(be.service_date, be.joining_start),
    'Breeding event recorded',
    be.created_by, be.created_at,
    p.full_name, be.id,
    jsonb_build_object('method', be.method, 'sire_id', be.sire_id, 'external_sire_note', be.external_sire_note)
  from breeding_events be
  join animals a on a.id = be.dam_id
  left join profiles p on p.id = be.created_by
  where be.deleted_at is null

  union all

  select bi.org_id, a.ranch_id, bi.dam_id as animal_id, 'birth', bi.birth_date,
    'Gave birth — litter of ' || bi.litter_size,
    bi.created_by, bi.created_at,
    p.full_name, bi.id,
    jsonb_build_object('litter_size', bi.litter_size, 'ease', bi.ease, 'complications', bi.complications)
  from births bi
  join animals a on a.id = bi.dam_id
  left join profiles p on p.id = bi.created_by
  where bi.deleted_at is null

  union all

  select mo.org_id, mo.ranch_id, mo.animal_id, 'mortality', mo.date_of_death, 'Death recorded',
    mo.created_by, mo.created_at,
    p.full_name, mo.id,
    jsonb_build_object('cause_category', mo.cause_category, 'cause_details', mo.cause_details)
  from mortalities mo
  left join profiles p on p.id = mo.created_by
  where mo.deleted_at is null

  union all

  -- Vet visits are many-animals-to-one-visit — one Timeline entry per
  -- animal on the visit, same as every other per-animal event type.
  select vv.org_id, vv.ranch_id, vva.animal_id, 'vet_visit', vv.visit_date,
    coalesce('Vet visit — ' || vv.purpose, 'Vet visit'),
    vv.created_by, vv.created_at,
    p.full_name, vv.id,
    jsonb_build_object(
      'veterinarian_name', vet.name, 'purpose', vv.purpose, 'findings', vv.findings,
      'recommendations', vv.recommendations, 'next_visit_date', vv.next_visit_date
    )
  from vet_visits vv
  join vet_visit_animals vva on vva.vet_visit_id = vv.id and vva.deleted_at is null
  left join veterinarians vet on vet.id = vv.veterinarian_id
  left join profiles p on p.id = vv.created_by
  where vv.deleted_at is null

  union all

  -- The animal's own first Timeline entry — born on the ranch or
  -- acquired from elsewhere. Not sourced from any transaction table;
  -- animals itself carries date_of_birth/acquisition_date/
  -- acquisition_type directly (0006_animals.sql).
  select a.org_id, a.ranch_id, a.id as animal_id, 'origin',
    coalesce(a.acquisition_date, a.date_of_birth, a.created_at::date),
    case
      when a.acquisition_type = 'born_on_ranch' then 'Born on the ranch'
      when a.acquisition_type = 'purchased' then 'Purchased'
      when a.acquisition_type = 'gift' then 'Received as a gift'
      else 'Enrolled'
    end,
    a.created_by, a.created_at,
    p.full_name, a.id,
    jsonb_build_object(
      'acquisition_type', a.acquisition_type, 'dob_is_estimated', a.dob_is_estimated,
      'dam_id', a.dam_id, 'sire_id', a.sire_id
    )
  from animals a
  left join profiles p on p.id = a.created_by
  where a.deleted_at is null
) events;

alter view v_recent_activity set (security_invoker = true);

grant select on v_recent_activity to authenticated;
