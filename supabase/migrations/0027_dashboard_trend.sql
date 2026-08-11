-- ---------------------------------------------------------------------
-- Session 7 — Owner Dashboard. blueprint.md §5 calls for the dominant
-- metric to carry "a trend against last month," and for the species
-- and male/female breakdowns to come from a view, never client-side
-- aggregation (session-pack.md, Session 7: "All data from Postgres
-- views. No client-side aggregation.").
--
-- Trend: there is no point-in-time snapshot of historical active
-- headcount anywhere in this schema — status changes aren't
-- event-sourced (only death is: record_death() flips status in the
-- same transaction it writes to `mortalities`, 0010/0017). Reconstructing
-- "how many animals were active exactly 30 days ago" would mean walking
-- audit_log's before/after jsonb per animal, which is not what that
-- table is shaped for and would not stay cheap as the herd grows. So
-- this exposes the two raw counts that make up net change over the
-- window — new_enrollments_last_30_days, deaths_last_30_days — and the
-- dashboard composes them into one "+N since last month" figure. This
-- is a deliberate, narrower reading of "trend" than a true historical
-- snapshot diff; flagged as an assumption, not a silent substitution.
--
-- species_breakdown is added to v_org_stats to match what v_ranch_stats
-- already exposes per ranch (0016_views.sql) — the Owner dashboard's
-- "Livestock by species" bar reads it directly from here rather than
-- summing v_ranch_stats rows in JS.
--
-- New columns appended strictly after the existing ones on both views
-- (the 42P16 rule — CREATE OR REPLACE VIEW rejects a reordered or
-- inserted column, only an appended one; see 0020, 0023).
-- security_invoker is restated explicitly and redundantly via ALTER
-- VIEW after, matching 0020/0023's fix for the same
-- CREATE-OR-REPLACE-doesn't-carry-it-forward gotcha.
-- ---------------------------------------------------------------------

create or replace view v_ranch_stats
with (security_invoker = true)
as
select
  r.id as ranch_id,
  r.org_id,
  r.name as ranch_name,
  coalesce(counts.active_animal_count, 0) as active_animal_count,
  coalesce(counts.male_count, 0) as male_count,
  coalesce(counts.female_count, 0) as female_count,
  coalesce(species_breakdown.breakdown, '{}'::jsonb) as species_breakdown,
  coalesce(attention.attention_count, 0) as attention_count,
  coalesce(trend.new_enrollments, 0) as new_enrollments_last_30_days,
  coalesce(trend.deaths, 0) as deaths_last_30_days
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
left join lateral (
  select
    (select count(*) from animals a
      join animal_statuses ast on ast.id = a.status_id
      where a.ranch_id = r.id and a.deleted_at is null and ast.is_active_status
        and a.created_at >= now() - interval '30 days') as new_enrollments,
    (select count(*) from mortalities mo
      where mo.ranch_id = r.id and mo.deleted_at is null
        and mo.date_of_death >= current_date - 30) as deaths
) trend on true
where r.deleted_at is null;

alter view v_ranch_stats set (security_invoker = true);

create or replace view v_org_stats
with (security_invoker = true)
as
select
  o.id as org_id,
  coalesce(counts.active_animal_count, 0) as active_animal_count,
  coalesce(counts.male_count, 0) as male_count,
  coalesce(counts.female_count, 0) as female_count,
  coalesce(attention.attention_count, 0) as animals_requiring_attention_count,
  coalesce(ranch_count.ranch_count, 0) as ranch_count,
  coalesce(trend.new_enrollments, 0) as new_enrollments_last_30_days,
  coalesce(trend.deaths, 0) as deaths_last_30_days,
  coalesce(species_breakdown.breakdown, '{}'::jsonb) as species_breakdown
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
) ranch_count on true
left join lateral (
  select
    (select count(*) from animals a
      join animal_statuses ast on ast.id = a.status_id
      where a.org_id = o.id and a.deleted_at is null and ast.is_active_status
        and a.created_at >= now() - interval '30 days') as new_enrollments,
    (select count(*) from mortalities mo
      where mo.org_id = o.id and mo.deleted_at is null
        and mo.date_of_death >= current_date - 30) as deaths
) trend on true
left join lateral (
  select jsonb_object_agg(sp.name, sp.cnt) as breakdown
  from (
    select s.name, count(*) as cnt
    from animals a
    join species s on s.id = a.species_id
    join animal_statuses ast on ast.id = a.status_id
    where a.org_id = o.id and a.deleted_at is null and ast.is_active_status
    group by s.name
  ) sp
) species_breakdown on true;

alter view v_org_stats set (security_invoker = true);

-- ---------------------------------------------------------------------
-- Global species filter (session-pack.md, Session 7: "date range and
-- species, applied to every widget at once, encoded in the URL").
-- v_upcoming_vaccinations already joins `animals a`, so appending
-- species_id is a one-column addition. v_upcoming_vet_followups is
-- deliberately NOT given a species_id: it's sourced straight from
-- vet_visits, which is many-animals-to-one-visit (0016_views.sql) — a
-- single visit can span more than one species, so there is no single
-- species_id to attach to that half of the merged "Upcoming" list. The
-- species filter narrows the vaccinations half only; vet follow-ups
-- always show. Documented here rather than silently dropped.
-- ---------------------------------------------------------------------
create or replace view v_upcoming_vaccinations
with (security_invoker = true)
as
select
  v.id as vaccination_id,
  v.org_id,
  a.id as animal_id,
  a.ranch_id,
  a.tag_number,
  a.name as animal_name,
  vac.name as vaccine_name,
  v.next_due_date,
  a.species_id
from vaccinations v
join animals a on a.id = v.animal_id and a.deleted_at is null
join vaccines vac on vac.id = v.vaccine_id
where v.deleted_at is null
  and v.next_due_date is not null
  and v.next_due_date <= current_date + 30;

alter view v_upcoming_vaccinations set (security_invoker = true);

-- ---------------------------------------------------------------------
-- v_recent_activity, again — species_id appended for the dashboard's
-- global species filter. Three branches (movement, mortality, vet_visit)
-- didn't already join `animals` for their own purposes, so each gets a
-- new join purely to reach species_id; every other branch already had
-- `animals a` in scope. Column order: the 42P16 append rule again —
-- species_id goes after `details`, the last column from 0023.
-- ---------------------------------------------------------------------
create or replace view v_recent_activity
with (security_invoker = true)
as
select
  org_id, ranch_id, animal_id, event_type, event_date, description, actor_id, occurred_at,
  actor_name, source_id, details, species_id
from (
  select v.org_id, a.ranch_id, v.animal_id, 'vaccination'::text as event_type, v.date_administered as event_date,
    'Vaccinated against ' || coalesce(vac.target_disease, vac.name) as description,
    v.created_by as actor_id, v.created_at as occurred_at,
    p.full_name as actor_name, v.id as source_id,
    jsonb_build_object(
      'vaccine_name', vac.name, 'dose', v.dose, 'batch_number', v.batch_number, 'route', v.route,
      'next_due_date', v.next_due_date, 'veterinarian_name', vet.name
    ) as details,
    a.species_id
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
    ),
    a.species_id
  from treatments t
  join animals a on a.id = t.animal_id
  left join medications m on m.id = t.medication_id
  left join profiles p on p.id = t.created_by
  left join veterinarians vet on vet.id = t.veterinarian_id
  where t.deleted_at is null

  union all

  select i.org_id, a.ranch_id, i.animal_id, 'illness', i.onset_date,
    coalesce(it.name, i.custom_name, 'Illness') || ' reported',
    i.created_by, i.created_at,
    p.full_name, i.id,
    jsonb_build_object('illness_name', coalesce(it.name, i.custom_name), 'severity', i.severity, 'symptoms', i.symptoms),
    a.species_id
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
    jsonb_build_object('illness_name', coalesce(it.name, i.custom_name)),
    a.species_id
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
    jsonb_build_object('weight_kg', w.weight_kg, 'body_condition_score', w.body_condition_score, 'method', w.method),
    a.species_id
  from weight_records w
  join animals a on a.id = w.animal_id
  left join profiles p on p.id = w.created_by
  where w.deleted_at is null

  union all

  select mv.org_id, mv.to_ranch_id as ranch_id, mv.animal_id, 'movement', mv.movement_date,
    'Moved to ' || r2.name,
    mv.created_by, mv.created_at,
    p.full_name, mv.id,
    jsonb_build_object('from_ranch_name', r1.name, 'to_ranch_name', r2.name, 'reason', mv.reason),
    a.species_id
  from movements mv
  join ranches r1 on r1.id = mv.from_ranch_id
  join ranches r2 on r2.id = mv.to_ranch_id
  left join animals a on a.id = mv.animal_id
  left join profiles p on p.id = mv.created_by
  where mv.deleted_at is null

  union all

  select be.org_id, a.ranch_id, be.dam_id as animal_id, 'breeding', coalesce(be.service_date, be.joining_start),
    'Breeding event recorded',
    be.created_by, be.created_at,
    p.full_name, be.id,
    jsonb_build_object('method', be.method, 'sire_id', be.sire_id, 'external_sire_note', be.external_sire_note),
    a.species_id
  from breeding_events be
  join animals a on a.id = be.dam_id
  left join profiles p on p.id = be.created_by
  where be.deleted_at is null

  union all

  select bi.org_id, a.ranch_id, bi.dam_id as animal_id, 'birth', bi.birth_date,
    'Gave birth — litter of ' || bi.litter_size,
    bi.created_by, bi.created_at,
    p.full_name, bi.id,
    jsonb_build_object('litter_size', bi.litter_size, 'ease', bi.ease, 'complications', bi.complications),
    a.species_id
  from births bi
  join animals a on a.id = bi.dam_id
  left join profiles p on p.id = bi.created_by
  where bi.deleted_at is null

  union all

  select mo.org_id, mo.ranch_id, mo.animal_id, 'mortality', mo.date_of_death, 'Death recorded',
    mo.created_by, mo.created_at,
    p.full_name, mo.id,
    jsonb_build_object('cause_category', mo.cause_category, 'cause_details', mo.cause_details),
    a.species_id
  from mortalities mo
  left join animals a on a.id = mo.animal_id
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
    ),
    a.species_id
  from vet_visits vv
  join vet_visit_animals vva on vva.vet_visit_id = vv.id and vva.deleted_at is null
  left join animals a on a.id = vva.animal_id
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
    ),
    a.species_id
  from animals a
  left join profiles p on p.id = a.created_by
  where a.deleted_at is null
) events;

alter view v_recent_activity set (security_invoker = true);

-- ---------------------------------------------------------------------
-- get_dashboard_stats — the Owner/Manager dashboard's dominant metric,
-- attention counterpoint, species bar and sex split, all in one round
-- trip, parameterized by the three things Session 7's global filters
-- can express: ranch scope (an explicit array so the Manager variant
-- can pass its assigned ranches, and the Owner variant can pass a
-- single selected ranch from the existing app-wide switcher — both
-- read as "no restriction beyond RLS" when null), species, and a
-- created-at date range (same enrollment-date semantics
-- fetchAnimalRegister already uses for dateFrom/dateTo, so the one
-- "date range" concept means the same thing everywhere in the app).
--
-- Deliberately NOT filtered by the date range: new_enrollments_last_30_days
-- and deaths_last_30_days. Those are the fixed "trend against last
-- month" figure from v_org_stats/v_ranch_stats above — a distinct,
-- fixed 30-day concept, not the user-adjustable range filter. Applying
-- the range filter to the trend numbers too would make "trend" mean
-- something different depending on what filter happens to be active,
-- which would be confusing rather than more correct.
--
-- Built as a function (not a view) because it takes parameters — same
-- reason get_animal_facet_counts (0020_animal_register.sql) is a
-- function and not a view. security invoker (the default) — runs under
-- the caller's own RLS via v_animal_current, same as that function.
-- ---------------------------------------------------------------------
create or replace function get_dashboard_stats(
  p_ranch_ids uuid[] default null,
  p_species_id uuid default null,
  p_date_from date default null,
  p_date_to date default null
)
returns jsonb
language sql
stable
set search_path = public
as $$
  select jsonb_build_object(
    'active_animal_count', (
      select count(*) from v_animal_current a
      where a.is_active_status
        and (p_ranch_ids is null or a.ranch_id = any(p_ranch_ids))
        and (p_species_id is null or a.species_id = p_species_id)
        and (p_date_from is null or a.created_at::date >= p_date_from)
        and (p_date_to is null or a.created_at::date <= p_date_to)
    ),
    'male_count', (
      select count(*) from v_animal_current a
      where a.is_active_status and a.sex = 'male'
        and (p_ranch_ids is null or a.ranch_id = any(p_ranch_ids))
        and (p_species_id is null or a.species_id = p_species_id)
        and (p_date_from is null or a.created_at::date >= p_date_from)
        and (p_date_to is null or a.created_at::date <= p_date_to)
    ),
    'female_count', (
      select count(*) from v_animal_current a
      where a.is_active_status and a.sex = 'female'
        and (p_ranch_ids is null or a.ranch_id = any(p_ranch_ids))
        and (p_species_id is null or a.species_id = p_species_id)
        and (p_date_from is null or a.created_at::date >= p_date_from)
        and (p_date_to is null or a.created_at::date <= p_date_to)
    ),
    'attention_count', (
      select count(distinct vas.animal_id)
      from v_animal_attention_summary vas
      join v_animal_current a on a.id = vas.animal_id
      where (p_ranch_ids is null or a.ranch_id = any(p_ranch_ids))
        and (p_species_id is null or a.species_id = p_species_id)
    ),
    'species_breakdown', (
      select coalesce(jsonb_object_agg(x.species_name, x.cnt), '{}'::jsonb)
      from (
        select a.species_name, count(*) as cnt
        from v_animal_current a
        where a.is_active_status and a.species_name is not null
          and (p_ranch_ids is null or a.ranch_id = any(p_ranch_ids))
          and (p_species_id is null or a.species_id = p_species_id)
          and (p_date_from is null or a.created_at::date >= p_date_from)
          and (p_date_to is null or a.created_at::date <= p_date_to)
        group by a.species_name
      ) x
    ),
    'new_enrollments_last_30_days', (
      select count(*) from v_animal_current a
      where a.is_active_status and a.created_at >= now() - interval '30 days'
        and (p_ranch_ids is null or a.ranch_id = any(p_ranch_ids))
        and (p_species_id is null or a.species_id = p_species_id)
    ),
    'deaths_last_30_days', (
      select count(*)
      from mortalities mo
      join v_animal_current a on a.id = mo.animal_id
      where mo.deleted_at is null and mo.date_of_death >= current_date - 30
        and (p_ranch_ids is null or mo.ranch_id = any(p_ranch_ids))
        and (p_species_id is null or a.species_id = p_species_id)
    )
  );
$$;

grant execute on function get_dashboard_stats to authenticated;
