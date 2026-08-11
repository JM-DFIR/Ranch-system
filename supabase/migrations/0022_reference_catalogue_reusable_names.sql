-- ---------------------------------------------------------------------
-- species/breeds/animal_statuses were defined (0005_reference.sql) with
-- a plain `unique(org_id, name)` / `unique(org_id, species_id, name)`
-- constraint — not scoped to deleted_at is null. That means once a row
-- is soft-deleted, its name stays permanently reserved: adding it back
-- later fails with unique_violation, the exact opposite of "soft
-- delete, no hard DELETE" (CLAUDE.md §6/§11) actually being reversible
-- in practice. animals.tag_number already got this right
-- (animals_org_tag_unique, 0006_animals.sql: "a soft-deleted record's
-- tag number can be reused") — this migration brings the reference
-- catalogues in line with that same pattern, prompted by trying to
-- remove and later re-add a species (Chicken) for real.
--
-- Constraint names are looked up rather than hardcoded, since Postgres
-- auto-generates them from column order and this only needs to run
-- once regardless of what they turned out to be.
-- ---------------------------------------------------------------------
do $$
declare
  c record;
begin
  for c in
    select conname, conrelid::regclass::text as tbl
    from pg_constraint
    where contype = 'u'
      and conrelid in ('species'::regclass, 'breeds'::regclass, 'animal_statuses'::regclass)
  loop
    execute format('alter table %s drop constraint %I', c.tbl, c.conname);
  end loop;
end $$;

create unique index if not exists species_org_id_name_unique
  on species (org_id, name) where deleted_at is null;

create unique index if not exists breeds_org_id_species_id_name_unique
  on breeds (org_id, species_id, name) where deleted_at is null;

create unique index if not exists animal_statuses_org_id_name_unique
  on animal_statuses (org_id, name) where deleted_at is null;
