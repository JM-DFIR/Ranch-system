-- ---------------------------------------------------------------------
-- v_animals_requiring_attention — twelve rules, one row per
-- (animal_id, reason) — several rows may share a reason where more
-- than one record qualifies (e.g. two overdue vaccinations), which is
-- deliberate: the Attention Queue wants each specific issue, not a
-- collapsed flag. blueprint.md §2.7 lists eleven rules in its seed
-- table but a twelfth ("no health record logged") in prose elsewhere —
-- v3.0 resolved that contradiction by keeping all twelve (§0.5 #4).
--
-- Plain views, not materialized: always correct, never needs a
-- backfill, and a new rule ships as a migration rather than a data
-- migration (blueprint.md §2.7).
-- ---------------------------------------------------------------------
create or replace view v_animals_requiring_attention as
-- 1. Overdue vaccination
select a.id as animal_id, a.org_id, a.ranch_id, 'overdue_vaccination' as reason, 'high' as severity, v.next_due_date as due_date
from vaccinations v
join animals a on a.id = v.animal_id and a.deleted_at is null
where v.deleted_at is null and v.next_due_date is not null and v.next_due_date < current_date

union all

-- 2. Vaccination due soon (within 14 days)
select a.id, a.org_id, a.ranch_id, 'vaccination_due_soon', 'medium', v.next_due_date
from vaccinations v
join animals a on a.id = v.animal_id and a.deleted_at is null
where v.deleted_at is null and v.next_due_date between current_date and current_date + 14

union all

-- 3. Unresolved illness
select a.id, a.org_id, a.ranch_id, 'unresolved_illness', 'high', i.onset_date
from illnesses i
join animals a on a.id = i.animal_id and a.deleted_at is null
where i.deleted_at is null and i.status in ('suspected', 'confirmed', 'under_treatment')

union all

-- 4. Vet follow-up due
select a.id, a.org_id, a.ranch_id, 'vet_followup_due', 'high', vv.next_visit_date
from vet_visits vv
join vet_visit_animals vva on vva.vet_visit_id = vv.id and vva.deleted_at is null
join animals a on a.id = vva.animal_id and a.deleted_at is null
where vv.deleted_at is null and vv.next_visit_date is not null and vv.next_visit_date <= current_date

union all

-- 5. Treatment follow-up due
select a.id, a.org_id, a.ranch_id, 'treatment_followup_due', 'medium', t.follow_up_date
from treatments t
join animals a on a.id = t.animal_id and a.deleted_at is null
where t.deleted_at is null and t.follow_up_date is not null and t.follow_up_date <= current_date

union all

-- 6. Care activity overdue (animal-scoped only — a ranch-wide activity
-- overdue is a ranch-level concern, not an individual animal's)
select a.id, a.org_id, a.ranch_id, 'care_activity_overdue', 'medium', ca.next_due_date
from care_activities ca
join animals a on a.id = ca.animal_id and a.deleted_at is null
where ca.deleted_at is null and ca.animal_id is not null and ca.next_due_date is not null and ca.next_due_date < current_date

union all

-- 7. Pregnancy check due (served 45+ days, no check recorded)
select be.dam_id as animal_id, be.org_id, a.ranch_id, 'pregnancy_check_due', 'medium',
  coalesce(be.service_date, be.joining_start) + 45 as due_date
from breeding_events be
join animals a on a.id = be.dam_id and a.deleted_at is null
where be.deleted_at is null
  and be.status = 'served'
  and coalesce(be.service_date, be.joining_start) is not null
  and coalesce(be.service_date, be.joining_start) <= current_date - 45
  and not exists (
    select 1 from pregnancy_checks pc where pc.breeding_event_id = be.id and pc.deleted_at is null
  )

union all

-- 8. Calving/kidding imminent (within 14 days, point date or window)
select be.dam_id, be.org_id, a.ranch_id, 'calving_imminent', 'medium',
  coalesce(be.expected_due_date, be.expected_due_window_start)
from breeding_events be
join animals a on a.id = be.dam_id and a.deleted_at is null
where be.deleted_at is null
  and be.status in ('served', 'confirmed_pregnant')
  and (
    (be.expected_due_date is not null and be.expected_due_date between current_date and current_date + 14)
    or (be.expected_due_window_start is not null and be.expected_due_window_start <= current_date + 14
        and be.expected_due_window_end >= current_date)
  )

union all

-- 9. Inside withdrawal period
select t.animal_id, t.org_id, a.ranch_id, 'inside_withdrawal_period', 'info', t.withdrawal_until
from treatments t
join animals a on a.id = t.animal_id and a.deleted_at is null
where t.deleted_at is null and t.withdrawal_until is not null and t.withdrawal_until >= current_date

union all

-- 10. Losing condition (latest weight below previous, or BCS <= 2)
select w.animal_id, w.org_id, a.ranch_id, 'losing_condition', 'high', w.weight_date
from (
  select
    animal_id, org_id, weight_date, weight_kg, body_condition_score,
    lag(weight_kg) over (partition by animal_id order by weight_date) as prev_weight_kg,
    row_number() over (partition by animal_id order by weight_date desc) as rn
  from weight_records
  where deleted_at is null
) w
join animals a on a.id = w.animal_id and a.deleted_at is null
where w.rn = 1
  and (
    (w.prev_weight_kg is not null and w.weight_kg is not null and w.weight_kg < w.prev_weight_kg)
    or (w.body_condition_score is not null and w.body_condition_score <= 2)
  )

union all

-- 11. Incomplete enrolment (no photo, or no species — see 0006 for why
-- species_id is nullable: this is exactly the Tag Range Generator's
-- placeholder-record case surfacing itself back to the owner)
select a.id, a.org_id, a.ranch_id, 'incomplete_enrolment', 'info', null::date
from animals a
where a.deleted_at is null and (a.photo_path is null or a.species_id is null)

union all

-- 12. No health record logged in stale_health_days (default 120 —
-- blueprint.md §0.6 #7). Only active animals; a sold or deceased
-- animal being "quiet" is expected, not a signal. Newly-enrolled
-- animals get a grace period equal to the same window so day-one
-- enrolment doesn't immediately read as neglect.
select a.id, a.org_id, a.ranch_id, 'no_recent_health_record', 'info', null::date
from animals a
join animal_statuses ast on ast.id = a.status_id
join organization_settings os on os.org_id = a.org_id
where a.deleted_at is null
  and ast.is_active_status
  and a.created_at < now() - (os.stale_health_days || ' days')::interval
  and not exists (
    select 1 from vaccinations v
    where v.animal_id = a.id and v.deleted_at is null and v.date_administered >= current_date - os.stale_health_days
    union all
    select 1 from treatments t
    where t.animal_id = a.id and t.deleted_at is null and t.treatment_date >= current_date - os.stale_health_days
    union all
    select 1 from illnesses i
    where i.animal_id = a.id and i.deleted_at is null and i.onset_date >= current_date - os.stale_health_days
    union all
    select 1 from care_activities ca
    where ca.animal_id = a.id and ca.deleted_at is null and ca.activity_date >= current_date - os.stale_health_days
    union all
    select 1 from vet_visit_animals vva
    join vet_visits vv on vv.id = vva.vet_visit_id
    where vva.animal_id = a.id and vva.deleted_at is null and vv.visit_date >= current_date - os.stale_health_days
  );

-- ---------------------------------------------------------------------
-- v_animal_attention_summary — new in v3.0 (blueprint.md §0.5 #5). One
-- row per animal: worst severity + reason count. The register's badge
-- column and the dashboard's attention counterpoint join against THIS
-- view, never v_animals_requiring_attention directly — that view can
-- return several rows per animal, which would duplicate register rows
-- if joined into a paginated list.
-- ---------------------------------------------------------------------
create or replace view v_animal_attention_summary as
select
  animal_id,
  org_id,
  ranch_id,
  max(case severity when 'high' then 3 when 'medium' then 2 when 'info' then 1 else 0 end) as severity_rank,
  (array_agg(severity order by case severity when 'high' then 3 when 'medium' then 2 when 'info' then 1 else 0 end desc))[1] as worst_severity,
  count(*) as reason_count
from v_animals_requiring_attention
group by animal_id, org_id, ranch_id;

-- ---------------------------------------------------------------------
-- v_animal_current — animal + species/breed/status/ranch names
-- denormalised, plus a computed last_event_date for the register
-- column. Live animals only (deleted_at is null).
-- ---------------------------------------------------------------------
create or replace view v_animal_current as
select
  a.id,
  a.org_id,
  a.ranch_id,
  r.name as ranch_name,
  a.section_id,
  rs.name as section_name,
  a.tag_number,
  a.name,
  a.species_id,
  s.name as species_name,
  a.breed_id,
  b.name as breed_name,
  a.sex,
  a.color,
  a.date_of_birth,
  a.dob_is_estimated,
  a.acquisition_type,
  a.acquisition_date,
  a.dam_id,
  a.sire_id,
  a.status_id,
  st.name as status_name,
  st.is_active_status,
  st.color_token as status_color_token,
  a.photo_path,
  a.anitrac_ain,
  a.notes,
  le.last_event_date,
  a.created_at,
  a.updated_at,
  a.deleted_at
from animals a
join ranches r on r.id = a.ranch_id
left join ranch_sections rs on rs.id = a.section_id
left join species s on s.id = a.species_id
left join breeds b on b.id = a.breed_id
join animal_statuses st on st.id = a.status_id
left join lateral (
  select greatest(
    (select max(date_administered) from vaccinations where animal_id = a.id and deleted_at is null),
    (select max(treatment_date) from treatments where animal_id = a.id and deleted_at is null),
    (select max(onset_date) from illnesses where animal_id = a.id and deleted_at is null),
    (select max(weight_date) from weight_records where animal_id = a.id and deleted_at is null),
    (select max(movement_date) from movements where animal_id = a.id and deleted_at is null)
  ) as last_event_date
) le on true
where a.deleted_at is null;

-- ---------------------------------------------------------------------
-- v_ranch_stats — per-ranch dashboard card data.
-- ---------------------------------------------------------------------
create or replace view v_ranch_stats as
select
  r.id as ranch_id,
  r.org_id,
  r.name as ranch_name,
  coalesce(counts.active_animal_count, 0) as active_animal_count,
  coalesce(counts.male_count, 0) as male_count,
  coalesce(counts.female_count, 0) as female_count,
  coalesce(species_breakdown.breakdown, '{}'::jsonb) as species_breakdown,
  coalesce(attention.attention_count, 0) as attention_count
from ranches r
left join lateral (
  select
    count(*) filter (where ast.is_active_status) as active_animal_count,
    count(*) filter (where ast.is_active_status and a.sex = 'male') as male_count,
    count(*) filter (where ast.is_active_status and a.sex = 'female') as female_count
  from animals a
  join animal_statuses ast on ast.id = a.status_id
  where a.ranch_id = r.id and a.deleted_at is null
) counts on true
left join lateral (
  select jsonb_object_agg(sp.name, sp.cnt) as breakdown
  from (
    select s.name, count(*) as cnt
    from animals a
    join species s on s.id = a.species_id
    join animal_statuses ast on ast.id = a.status_id
    where a.ranch_id = r.id and a.deleted_at is null and ast.is_active_status
    group by s.name
  ) sp
) species_breakdown on true
left join lateral (
  select count(distinct animal_id) as attention_count
  from v_animal_attention_summary vas
  where vas.ranch_id = r.id
) attention on true
where r.deleted_at is null;

-- ---------------------------------------------------------------------
-- v_org_stats — org roll-up for the Owner dashboard.
-- ---------------------------------------------------------------------
create or replace view v_org_stats as
select
  o.id as org_id,
  coalesce(counts.active_animal_count, 0) as active_animal_count,
  coalesce(counts.male_count, 0) as male_count,
  coalesce(counts.female_count, 0) as female_count,
  coalesce(attention.attention_count, 0) as animals_requiring_attention_count,
  coalesce(ranch_count.ranch_count, 0) as ranch_count
from organizations o
left join lateral (
  select
    count(*) filter (where ast.is_active_status) as active_animal_count,
    count(*) filter (where ast.is_active_status and a.sex = 'male') as male_count,
    count(*) filter (where ast.is_active_status and a.sex = 'female') as female_count
  from animals a
  join animal_statuses ast on ast.id = a.status_id
  where a.org_id = o.id and a.deleted_at is null
) counts on true
left join lateral (
  select count(distinct animal_id) as attention_count
  from v_animal_attention_summary vas
  where vas.org_id = o.id
) attention on true
left join lateral (
  select count(*) as ranch_count from ranches r where r.org_id = o.id and r.deleted_at is null
) ranch_count on true;

-- ---------------------------------------------------------------------
-- v_upcoming_vaccinations / v_upcoming_vet_followups — next 30 days,
-- including anything already overdue (the dashboard's own query caps
-- and sorts; this view just defines "in range").
-- ---------------------------------------------------------------------
create or replace view v_upcoming_vaccinations as
select
  v.id as vaccination_id,
  v.org_id,
  a.id as animal_id,
  a.ranch_id,
  a.tag_number,
  a.name as animal_name,
  vac.name as vaccine_name,
  v.next_due_date
from vaccinations v
join animals a on a.id = v.animal_id and a.deleted_at is null
join vaccines vac on vac.id = v.vaccine_id
where v.deleted_at is null
  and v.next_due_date is not null
  and v.next_due_date <= current_date + 30;

create or replace view v_upcoming_vet_followups as
select
  vv.id as vet_visit_id,
  vv.org_id,
  vv.ranch_id,
  vv.veterinarian_id,
  vet.name as veterinarian_name,
  vv.next_visit_date,
  vv.purpose
from vet_visits vv
left join veterinarians vet on vet.id = vv.veterinarian_id
where vv.deleted_at is null
  and vv.next_visit_date is not null
  and vv.next_visit_date <= current_date + 30;

-- ---------------------------------------------------------------------
-- v_recent_activity — unified event feed across health, weights,
-- movement, breeding and mortality (blueprint.md §2.2). Powers both
-- the dashboard's recent-activity feed and (filtered to one animal)
-- feeds the Timeline tab's data.
-- ---------------------------------------------------------------------
create or replace view v_recent_activity as
select org_id, ranch_id, animal_id, event_type, event_date, description, actor_id, occurred_at
from (
  select v.org_id, a.ranch_id, v.animal_id, 'vaccination'::text as event_type, v.date_administered as event_date,
    'Vaccinated against ' || coalesce(vac.target_disease, vac.name) as description,
    v.created_by as actor_id, v.created_at as occurred_at
  from vaccinations v
  join animals a on a.id = v.animal_id
  join vaccines vac on vac.id = v.vaccine_id
  where v.deleted_at is null

  union all

  select t.org_id, a.ranch_id, t.animal_id, 'treatment', t.treatment_date,
    'Treated with ' || coalesce(m.name, t.custom_medication, 'medication'),
    t.created_by, t.created_at
  from treatments t
  join animals a on a.id = t.animal_id
  left join medications m on m.id = t.medication_id
  where t.deleted_at is null

  union all

  select i.org_id, a.ranch_id, i.animal_id, 'illness', i.onset_date,
    coalesce(it.name, i.custom_name, 'Illness') || ' reported',
    i.created_by, i.created_at
  from illnesses i
  join animals a on a.id = i.animal_id
  left join illness_types it on it.id = i.illness_type_id
  where i.deleted_at is null

  union all

  select w.org_id, a.ranch_id, w.animal_id, 'weight', w.weight_date,
    case when w.weight_kg is not null then 'Weighed at ' || w.weight_kg || ' kg' else 'Body condition scored' end,
    w.created_by, w.created_at
  from weight_records w
  join animals a on a.id = w.animal_id
  where w.deleted_at is null

  union all

  select mv.org_id, mv.to_ranch_id as ranch_id, mv.animal_id, 'movement', mv.movement_date,
    'Moved to ' || r2.name,
    mv.created_by, mv.created_at
  from movements mv
  join ranches r2 on r2.id = mv.to_ranch_id
  where mv.deleted_at is null

  union all

  select be.org_id, a.ranch_id, be.dam_id as animal_id, 'breeding', coalesce(be.service_date, be.joining_start),
    'Breeding event recorded',
    be.created_by, be.created_at
  from breeding_events be
  join animals a on a.id = be.dam_id
  where be.deleted_at is null

  union all

  select bi.org_id, a.ranch_id, bi.dam_id as animal_id, 'birth', bi.birth_date,
    'Gave birth — litter of ' || bi.litter_size,
    bi.created_by, bi.created_at
  from births bi
  join animals a on a.id = bi.dam_id
  where bi.deleted_at is null

  union all

  select mo.org_id, mo.ranch_id, mo.animal_id, 'mortality', mo.date_of_death, 'Death recorded',
    mo.created_by, mo.created_at
  from mortalities mo
  where mo.deleted_at is null
) events;

-- ---------------------------------------------------------------------
-- v_animal_weight_series — weight history with average daily gain via
-- window function. ADG is never stored (blueprint.md §2.3) so a
-- back-dated record can never leave a stale figure behind.
-- ---------------------------------------------------------------------
create or replace view v_animal_weight_series as
select
  w.id,
  w.org_id,
  w.animal_id,
  w.weight_date,
  w.weight_kg,
  w.method,
  w.body_condition_score,
  lag(w.weight_kg) over (partition by w.animal_id order by w.weight_date) as previous_weight_kg,
  lag(w.weight_date) over (partition by w.animal_id order by w.weight_date) as previous_weight_date,
  case
    when w.weight_kg is not null
      and lag(w.weight_kg) over (partition by w.animal_id order by w.weight_date) is not null
      and w.weight_date > lag(w.weight_date) over (partition by w.animal_id order by w.weight_date)
    then round(
      (w.weight_kg - lag(w.weight_kg) over (partition by w.animal_id order by w.weight_date))
      / (w.weight_date - lag(w.weight_date) over (partition by w.animal_id order by w.weight_date)),
      3
    )
    else null
  end as average_daily_gain_kg
from weight_records w
where w.deleted_at is null;
