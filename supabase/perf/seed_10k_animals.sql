-- ---------------------------------------------------------------------
-- M7 performance pass — synthetic load for manual verification against
-- a real Supabase project at blueprint.md §17/Part 7's "10,000 animals"
-- scale. NOT a numbered migration and NOT part of the applied migration
-- chain — this is dev/perf-test data, same spirit as seed.sql's own
-- "never run against production" warning, and MUST be run against a
-- disposable dev/staging project only.
--
-- This environment has no Docker/Supabase CLI (see seed.sql's own
-- note), so the query plans below were never run from here — this
-- script generates the data; the EXPLAIN ANALYZE calls at the bottom
-- are for you to run in the Supabase SQL editor and read yourself.
--
-- Prerequisite: seed.sql already applied (uses its Dev Org / Ranch A /
-- Ranch B / species / breeds / statuses fixtures as the population to
-- insert against — org_id '00000000-0000-0000-0000-000000000001').
-- ---------------------------------------------------------------------

do $$
declare
  v_org_id     uuid := '00000000-0000-0000-0000-000000000001';
  v_ranch_a_id uuid := '00000000-0000-0000-0000-000000000010';
  v_ranch_b_id uuid := '00000000-0000-0000-0000-000000000011';
begin
  insert into animals (
    org_id, ranch_id, tag_number, name, species_id, breed_id, sex,
    date_of_birth, dob_is_estimated, acquisition_type, status_id
  )
  select
    v_org_id,
    case when n % 2 = 0 then v_ranch_a_id else v_ranch_b_id end,
    'PERF-' || lpad(n::text, 6, '0'),
    null, -- most animals in this system are never named, same as real data
    sp.id,
    br.id,
    (array['male', 'female', 'unknown'])[1 + (n % 3)],
    current_date - ((n % 2000) || ' days')::interval,
    (n % 5 = 0),
    (array['born_on_ranch', 'purchased', 'gift', 'unknown'])[1 + (n % 4)],
    -- weighted toward Active (sort_order 1), same shape as a real herd
    (select id from animal_statuses where org_id = v_org_id and sort_order = case when n % 10 = 0 then 1 + (n % 5) else 1 end)
  from generate_series(1, 10000) as n
  join species sp on sp.org_id = v_org_id and sp.name = (array['Cattle', 'Goat', 'Sheep'])[1 + (n % 3)]
  left join breeds br on br.org_id = v_org_id and br.species_id = sp.id and br.name = (
    select name from breeds where org_id = v_org_id and species_id = sp.id order by name limit 1 offset (n % 3)
  )
  on conflict (org_id, tag_number) where deleted_at is null do nothing;

  raise notice 'Seeded % animals (org %).', (select count(*) from animals where org_id = v_org_id and tag_number like 'PERF-%'), v_org_id;
end $$;

-- ---------------------------------------------------------------------
-- Run these by hand afterwards and read the plan — looking for "Index
-- Scan"/"Bitmap Index Scan" on the org_id/ranch_id/species_id/status_id
-- indexes from 0015_indexes.sql, not "Seq Scan" on animals. At 10k rows
-- a seq scan will still look "fast" in isolation (tens of ms) — the
-- real signal is which plan Postgres chose, since that's what tells you
-- whether it'll still hold at 50k+.
-- ---------------------------------------------------------------------

-- explain analyze
-- select a.id, a.tag_number, a.name, a.sex, a.date_of_birth, s.name as status_name
-- from animals a join animal_statuses s on s.id = a.status_id
-- where a.org_id = '00000000-0000-0000-0000-000000000001' and a.deleted_at is null
-- order by a.tag_number
-- limit 50;

-- explain analyze
-- select count(*) from animals
-- where org_id = '00000000-0000-0000-0000-000000000001' and deleted_at is null
--   and tag_number ilike '%447%';

-- To remove the synthetic rows afterwards — soft delete only, same rule
-- as everywhere else in this project (CLAUDE.md §6/§11: no hard DELETE
-- anywhere, including here). They'll stop counting as active headcount
-- and disappear from the default register view, same as any other
-- deceased/removed animal:
-- update animals set deleted_at = now()
-- where org_id = '00000000-0000-0000-0000-000000000001' and tag_number like 'PERF-%';
