-- ---------------------------------------------------------------------
-- animals — the spine of the product. Every animal has exactly one row,
-- created once, updated for the rest of its life, never deleted.
-- ---------------------------------------------------------------------
create table animals (
  id                uuid primary key default uuid_generate_v7(),
  org_id            uuid not null references organizations(id),
  ranch_id          uuid not null references ranches(id),
  section_id        uuid references ranch_sections(id),
  tag_number        text not null,
  name              text,
  -- Nullable: the Tag Range Generator (blueprint.md §2.4) pre-creates
  -- placeholder records — a reserved tag against a ranch — before the
  -- animal is actually enrolled against it. A placeholder with no
  -- species set is exactly what attention rule 11 ("incomplete
  -- enrolment", 0016) exists to surface, not a data error to prevent.
  species_id        uuid references species(id),
  breed_id          uuid references breeds(id),
  sex               text not null default 'unknown' check (sex in ('male', 'female', 'unknown')),
  color             text,
  date_of_birth     date,
  dob_is_estimated  boolean not null default false,
  acquisition_type  text not null default 'unknown'
                      check (acquisition_type in ('born_on_ranch', 'purchased', 'gift', 'unknown')),
  acquisition_date  date,
  dam_id            uuid references animals(id),
  sire_id           uuid references animals(id),
  status_id         uuid not null references animal_statuses(id),
  photo_path        text,
  anitrac_ain       text check (anitrac_ain is null or anitrac_ain ~ '^[0-9]{15}$'),
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  created_by        uuid references profiles(id),
  updated_by        uuid references profiles(id),
  deleted_at        timestamptz
);

create trigger animals_audit
  before insert or update on animals
  for each row execute function apply_audit_columns();

-- Uniqueness only applies while the animal is live — a soft-deleted
-- record's tag number can be reused (blueprint.md §2.2).
create unique index animals_org_tag_unique
  on animals (org_id, tag_number)
  where deleted_at is null;

-- Partial-match search: people remember "…447", not the whole tag.
create index animals_tag_trgm on animals using gin (tag_number extensions.gin_trgm_ops);
create index animals_name_trgm on animals using gin (name extensions.gin_trgm_ops);

-- ---------------------------------------------------------------------
-- Lineage cycle guard — new in v3.0 (blueprint.md §0.5 #15). Rejects a
-- dam_id/sire_id write that would make an animal its own ancestor.
-- Depth-capped recursive CTEs elsewhere stop an infinite loop; this is
-- what stops a wrong tree from being saved in the first place. Writes
-- to these two columns are rare (birth time or a manual correction),
-- so the traversal cost here is a non-issue.
-- ---------------------------------------------------------------------
create or replace function prevent_lineage_cycle()
returns trigger
language plpgsql
as $$
declare
  is_cycle boolean;
begin
  if new.dam_id is null and new.sire_id is null then
    return new;
  end if;

  if new.dam_id = new.id or new.sire_id = new.id then
    raise exception 'an animal cannot be its own parent';
  end if;

  with recursive descendants as (
    select a.id, 1 as depth
    from animals a
    where (a.dam_id = new.id or a.sire_id = new.id) and a.deleted_at is null
    union all
    select a.id, d.depth + 1
    from animals a
    join descendants d on a.dam_id = d.id or a.sire_id = d.id
    where d.depth < 20 and a.deleted_at is null
  )
  select exists (
    select 1 from descendants
    where id = new.dam_id or id = new.sire_id
  ) into is_cycle;

  if is_cycle then
    raise exception 'this would create a cycle in the animal''s lineage — the proposed parent is already a descendant';
  end if;

  return new;
end;
$$;

create trigger animals_prevent_lineage_cycle
  before insert or update of dam_id, sire_id on animals
  for each row execute function prevent_lineage_cycle();

-- ---------------------------------------------------------------------
-- get_ancestors / get_descendants — recursive lineage, depth-capped.
-- Backs the Family Tree screen (Session 4). Placed here rather than in
-- the views migration because they operate directly on animals'
-- self-referential columns, not on a derived/denormalised view.
-- ---------------------------------------------------------------------
create or replace function get_ancestors(p_animal_id uuid, p_max_depth integer default 5)
returns table (id uuid, depth integer, relation text)
language sql
stable
as $$
  with recursive ancestors as (
    select a.dam_id as id, 1 as depth, 'dam'::text as relation
    from animals a where a.id = p_animal_id and a.dam_id is not null
    union all
    select a.sire_id, 1, 'sire'::text
    from animals a where a.id = p_animal_id and a.sire_id is not null
    union all
    select a.dam_id, anc.depth + 1, 'dam'::text
    from animals a
    join ancestors anc on a.id = anc.id
    where a.dam_id is not null and anc.depth < p_max_depth
    union all
    select a.sire_id, anc.depth + 1, 'sire'::text
    from animals a
    join ancestors anc on a.id = anc.id
    where a.sire_id is not null and anc.depth < p_max_depth
  )
  select id, depth, relation from ancestors where id is not null;
$$;

create or replace function get_descendants(p_animal_id uuid, p_max_depth integer default 5)
returns table (id uuid, depth integer)
language sql
stable
as $$
  with recursive descendants as (
    select a.id, 1 as depth
    from animals a
    where (a.dam_id = p_animal_id or a.sire_id = p_animal_id) and a.deleted_at is null
    union all
    select a.id, d.depth + 1
    from animals a
    join descendants d on a.dam_id = d.id or a.sire_id = d.id
    where d.depth < p_max_depth and a.deleted_at is null
  )
  select id, depth from descendants;
$$;
