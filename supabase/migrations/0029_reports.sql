-- ---------------------------------------------------------------------
-- M6 — Reports (session-pack.md Part 5; blueprint.md §17/Part 7).
-- Thirteen reports, twelve backed by a new aggregate view here (the
-- thirteenth, Financial, is gated behind FeatureGate flag="finance"
-- and needs no SQL — CLAUDE.md §9: nothing writes those columns yet).
--
-- Seven of the twelve ("Family C" — Treatment History, Illness/
-- Morbidity, Movement/Transfer, Mortality, Feeding Consumption, Care
-- Activity, Birth/Offspring) share one shape on purpose: month,
-- ranch_id/ranch_name, group_label, count(, quantity where relevant).
-- That's what lets one shared React chart/table component
-- (MonthlyCountReport.tsx) drive all seven, rather than one bespoke
-- report screen each — the SQL stays as plain, separate views (each
-- source table has different joins for its own group_label), only the
-- rendering is shared.
--
-- All plain views, security_invoker (the project default) — each one
-- aggregates from tables that already carry the real RLS
-- (has_ranch_access/has_animal_access), so a Manager's report
-- automatically covers only their own ranches with no extra filtering
-- needed here, same reasoning as every other view in this project.
-- ---------------------------------------------------------------------

-- 1. Livestock Inventory — current headcount by ranch/species/sex/status.
create or replace view v_inventory_report
with (security_invoker = true)
as
select
  a.org_id,
  a.ranch_id,
  r.name as ranch_name,
  a.species_id,
  s.name as species_name,
  a.sex,
  a.status_id,
  st.name as status_name,
  st.is_active_status,
  count(*) as count
from animals a
join ranches r on r.id = a.ranch_id
left join species s on s.id = a.species_id
join animal_statuses st on st.id = a.status_id
where a.deleted_at is null
group by a.org_id, a.ranch_id, r.name, a.species_id, s.name, a.sex, a.status_id, st.name, st.is_active_status;

-- 2. Vaccination Compliance — up to date vs. overdue, per ranch/species.
-- "Overdue" mirrors v_animals_requiring_attention's own
-- overdue_vaccination rule exactly, kept in sync deliberately.
create or replace view v_vaccination_compliance_report
with (security_invoker = true)
as
select
  a.org_id,
  a.ranch_id,
  r.name as ranch_name,
  a.species_id,
  s.name as species_name,
  count(*) filter (where st.is_active_status) as active_count,
  count(*) filter (
    where st.is_active_status and exists (
      select 1 from vaccinations v
      where v.animal_id = a.id and v.deleted_at is null
        and v.next_due_date is not null and v.next_due_date < current_date
    )
  ) as overdue_count
from animals a
join ranches r on r.id = a.ranch_id
left join species s on s.id = a.species_id
join animal_statuses st on st.id = a.status_id
where a.deleted_at is null
group by a.org_id, a.ranch_id, r.name, a.species_id, s.name;

-- 3. Attention Summary — count by reason/severity, org-wide. A thin
-- regrouping of the existing per-reason view, never joined against the
-- register directly (blueprint.md §0.5 #5's own rule, applies here too).
-- species_id joined in fresh (v_animals_requiring_attention doesn't
-- carry it) so this report can be filtered the same way the other
-- species-grouped reports are.
create or replace view v_attention_summary_report
with (security_invoker = true)
as
select vra.org_id, vra.ranch_id, a.species_id, vra.reason, vra.severity, count(*) as count
from v_animals_requiring_attention vra
join animals a on a.id = vra.animal_id
group by vra.org_id, vra.ranch_id, a.species_id, vra.reason, vra.severity;

-- 4. Breeding Performance — conception rate per ranch/species.
create or replace view v_breeding_performance_report
with (security_invoker = true)
as
select
  be.org_id,
  a.ranch_id,
  r.name as ranch_name,
  a.species_id,
  s.name as species_name,
  count(*) as served_count,
  count(*) filter (where be.status = 'confirmed_pregnant') as confirmed_pregnant_count,
  count(*) filter (where be.status = 'not_pregnant') as not_pregnant_count,
  count(*) filter (where be.status = 'delivered') as delivered_count,
  count(*) filter (where be.status = 'aborted') as aborted_count
from breeding_events be
join animals a on a.id = be.dam_id
join ranches r on r.id = a.ranch_id
left join species s on s.id = a.species_id
where be.deleted_at is null
group by be.org_id, a.ranch_id, r.name, a.species_id, s.name;

-- 5. Weight & Growth — average daily gain per ranch/species/month
-- (blueprint.md §2.3 names this report explicitly). Reads
-- v_animal_weight_series so ADG is never recomputed a second way.
create or replace view v_weight_growth_report
with (security_invoker = true)
as
select
  w.org_id,
  a.ranch_id,
  r.name as ranch_name,
  a.species_id,
  s.name as species_name,
  date_trunc('month', w.weight_date)::date as month,
  avg(w.average_daily_gain_kg) as avg_adg_kg,
  count(*) as reading_count
from v_animal_weight_series w
join animals a on a.id = w.animal_id
join ranches r on r.id = a.ranch_id
left join species s on s.id = a.species_id
where w.average_daily_gain_kg is not null
group by w.org_id, a.ranch_id, r.name, a.species_id, s.name, date_trunc('month', w.weight_date);

-- 6. Treatment History — treatments per month, grouped by medication.
create or replace view v_treatment_report
with (security_invoker = true)
as
select
  t.org_id,
  a.ranch_id,
  r.name as ranch_name,
  date_trunc('month', t.treatment_date)::date as month,
  coalesce(m.name, t.custom_medication, 'Unspecified') as group_label,
  count(*) as count
from treatments t
join animals a on a.id = t.animal_id
join ranches r on r.id = a.ranch_id
left join medications m on m.id = t.medication_id
where t.deleted_at is null
group by t.org_id, a.ranch_id, r.name, date_trunc('month', t.treatment_date), coalesce(m.name, t.custom_medication, 'Unspecified');

-- 7. Illness / Morbidity — illnesses per month, grouped by illness type.
create or replace view v_illness_report
with (security_invoker = true)
as
select
  i.org_id,
  a.ranch_id,
  r.name as ranch_name,
  date_trunc('month', i.onset_date)::date as month,
  coalesce(it.name, i.custom_name, 'Unspecified') as group_label,
  count(*) as count
from illnesses i
join animals a on a.id = i.animal_id
join ranches r on r.id = a.ranch_id
left join illness_types it on it.id = i.illness_type_id
where i.deleted_at is null
group by i.org_id, a.ranch_id, r.name, date_trunc('month', i.onset_date), coalesce(it.name, i.custom_name, 'Unspecified');

-- 8. Movement / Transfer — movements per month, grouped by destination ranch.
create or replace view v_movement_report
with (security_invoker = true)
as
select
  mv.org_id,
  mv.from_ranch_id as ranch_id,
  r1.name as ranch_name,
  date_trunc('month', mv.movement_date)::date as month,
  r2.name as group_label,
  count(*) as count
from movements mv
join ranches r1 on r1.id = mv.from_ranch_id
join ranches r2 on r2.id = mv.to_ranch_id
where mv.deleted_at is null
group by mv.org_id, mv.from_ranch_id, r1.name, date_trunc('month', mv.movement_date), r2.name;

-- 9. Mortality — deaths per month, grouped by cause category.
create or replace view v_mortality_report
with (security_invoker = true)
as
select
  mo.org_id,
  mo.ranch_id,
  r.name as ranch_name,
  date_trunc('month', mo.date_of_death)::date as month,
  mo.cause_category as group_label,
  count(*) as count
from mortalities mo
join ranches r on r.id = mo.ranch_id
where mo.deleted_at is null
group by mo.org_id, mo.ranch_id, r.name, date_trunc('month', mo.date_of_death), mo.cause_category;

-- 10. Feeding Consumption — quantity per month, grouped by feed item
-- AND unit (0011_feeding_care.sql lets each record's unit differ from
-- the feed item's own default, e.g. logged as bales one day and kg the
-- next) — grouping by unit too means `sum(quantity)` is only ever a
-- sum of like units, never a silently-wrong kg+bales total. ranch_id
-- is resolved via animals for the animal-scoped rows (the same
-- "exactly one scope" duality the register itself handles) so a
-- report row always has one ranch to sit under, whichever scope the
-- entry was actually logged against.
create or replace view v_feeding_report
with (security_invoker = true)
as
select
  fr.org_id,
  coalesce(fr.ranch_id, a.ranch_id) as ranch_id,
  coalesce(r.name, r2.name) as ranch_name,
  date_trunc('month', fr.feed_date)::date as month,
  fi.name || ' (' || fr.unit || ')' as group_label,
  count(*) as count,
  sum(fr.quantity) as quantity
from feeding_records fr
left join ranches r on r.id = fr.ranch_id
left join animals a on a.id = fr.animal_id
left join ranches r2 on r2.id = a.ranch_id
join feed_items fi on fi.id = fr.feed_item_id
where fr.deleted_at is null
group by fr.org_id, coalesce(fr.ranch_id, a.ranch_id), coalesce(r.name, r2.name), date_trunc('month', fr.feed_date), fi.name, fr.unit;

-- 11. Care Activity — activities per month, grouped by activity type.
create or replace view v_care_activity_report
with (security_invoker = true)
as
select
  ca.org_id,
  coalesce(ca.ranch_id, a.ranch_id) as ranch_id,
  coalesce(r.name, r2.name) as ranch_name,
  date_trunc('month', ca.activity_date)::date as month,
  cat.name as group_label,
  count(*) as count
from care_activities ca
left join ranches r on r.id = ca.ranch_id
left join animals a on a.id = ca.animal_id
left join ranches r2 on r2.id = a.ranch_id
join care_activity_types cat on cat.id = ca.activity_type_id
where ca.deleted_at is null
group by ca.org_id, coalesce(ca.ranch_id, a.ranch_id), coalesce(r.name, r2.name), date_trunc('month', ca.activity_date), cat.name;

-- 12. Birth / Offspring — births per month, grouped by outcome.
create or replace view v_birth_report
with (security_invoker = true)
as
select
  bi.org_id,
  a.ranch_id,
  r.name as ranch_name,
  date_trunc('month', bi.birth_date)::date as month,
  bo.outcome as group_label,
  count(*) as count
from births bi
join animals a on a.id = bi.dam_id
join ranches r on r.id = a.ranch_id
join birth_offspring bo on bo.birth_id = bi.id and bo.deleted_at is null
where bi.deleted_at is null
group by bi.org_id, a.ranch_id, r.name, date_trunc('month', bi.birth_date), bo.outcome;

grant select on v_inventory_report to authenticated;
grant select on v_vaccination_compliance_report to authenticated;
grant select on v_attention_summary_report to authenticated;
grant select on v_breeding_performance_report to authenticated;
grant select on v_weight_growth_report to authenticated;
grant select on v_treatment_report to authenticated;
grant select on v_illness_report to authenticated;
grant select on v_movement_report to authenticated;
grant select on v_mortality_report to authenticated;
grant select on v_feeding_report to authenticated;
grant select on v_care_activity_report to authenticated;
grant select on v_birth_report to authenticated;
