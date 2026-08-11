create table breeding_events (
  id                       uuid primary key default uuid_generate_v7(),
  org_id                   uuid not null references organizations(id),
  dam_id                   uuid not null references animals(id),
  sire_id                  uuid references animals(id),
  external_sire_note       text,
  method                   text not null check (method in ('natural', 'artificial_insemination')),
  service_date             date,
  joining_start            date,
  joining_end              date,
  technician                text,
  straw_code               text,
  -- Computed by trigger below, not a Postgres GENERATED column — the
  -- computation needs species.default_gestation_days via dam_id, a
  -- cross-table lookup generated columns cannot express. Split into a
  -- single date (service_date known, e.g. AI in cattle) and a window
  -- pair (only a joining period known, e.g. a buck run with goats) —
  -- see blueprint.md §2.2.
  expected_due_date        date,
  expected_due_window_start date,
  expected_due_window_end  date,
  status                   text not null default 'served'
                             check (status in ('served', 'confirmed_pregnant', 'not_pregnant', 'delivered', 'aborted')),
  notes                    text,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  created_by               uuid references profiles(id),
  updated_by               uuid references profiles(id),
  deleted_at                timestamptz
);

create trigger breeding_events_audit
  before insert or update on breeding_events
  for each row execute function apply_audit_columns();

create or replace function compute_breeding_due_date()
returns trigger
language plpgsql
as $$
declare
  v_gestation_days integer;
begin
  select s.default_gestation_days into v_gestation_days
  from animals a
  join species s on s.id = a.species_id
  where a.id = new.dam_id;

  new.expected_due_date = null;
  new.expected_due_window_start = null;
  new.expected_due_window_end = null;

  if v_gestation_days is null then
    return new;
  end if;

  if new.service_date is not null then
    new.expected_due_date = new.service_date + v_gestation_days;
  elsif new.joining_start is not null then
    new.expected_due_window_start = new.joining_start + v_gestation_days;
    new.expected_due_window_end = coalesce(new.joining_end, new.joining_start) + v_gestation_days;
  end if;

  return new;
end;
$$;

create trigger breeding_events_compute_due_date
  before insert or update of dam_id, service_date, joining_start, joining_end on breeding_events
  for each row execute function compute_breeding_due_date();

create table pregnancy_checks (
  id                uuid primary key default uuid_generate_v7(),
  org_id            uuid not null references organizations(id),
  breeding_event_id uuid not null references breeding_events(id),
  check_date        date not null,
  method            text,
  result            text not null check (result in ('pregnant', 'not_pregnant', 'inconclusive')),
  estimated_days    integer,
  checked_by        uuid references profiles(id),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  created_by        uuid references profiles(id),
  updated_by        uuid references profiles(id),
  deleted_at        timestamptz
);

create trigger pregnancy_checks_audit
  before insert or update on pregnancy_checks
  for each row execute function apply_audit_columns();

create table births (
  id                uuid primary key default uuid_generate_v7(),
  org_id            uuid not null references organizations(id),
  breeding_event_id uuid references breeding_events(id),
  dam_id            uuid not null references animals(id),
  birth_date        date not null,
  litter_size       integer not null default 1,
  ease              text not null default 'unassisted' check (ease in ('unassisted', 'assisted', 'veterinary')),
  complications     text,
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  created_by        uuid references profiles(id),
  updated_by        uuid references profiles(id),
  deleted_at        timestamptz
);

create trigger births_audit
  before insert or update on births
  for each row execute function apply_audit_columns();

create table birth_offspring (
  id           uuid primary key default uuid_generate_v7(),
  org_id       uuid not null references organizations(id),
  birth_id     uuid not null references births(id),
  animal_id    uuid not null references animals(id),
  sex          text not null check (sex in ('male', 'female', 'unknown')),
  birth_weight numeric(6, 2),
  outcome      text not null default 'live' check (outcome in ('live', 'stillborn', 'died_shortly_after')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  created_by   uuid references profiles(id),
  updated_by   uuid references profiles(id),
  deleted_at   timestamptz,
  unique (birth_id, animal_id)
);

create trigger birth_offspring_audit
  before insert or update on birth_offspring
  for each row execute function apply_audit_columns();

-- A home-bred animal's growth curve starts at day zero without anyone
-- typing the same number twice (blueprint.md §2.3).
create or replace function seed_weight_from_birth()
returns trigger
language plpgsql
as $$
declare
  v_birth_date date;
  v_org_id uuid;
begin
  if new.birth_weight is null then
    return new;
  end if;

  select b.birth_date, b.org_id into v_birth_date, v_org_id
  from births b where b.id = new.birth_id;

  insert into weight_records (org_id, animal_id, weight_date, weight_kg, method, notes, created_by)
  values (v_org_id, new.animal_id, v_birth_date, new.birth_weight, 'scale', 'Birth weight', new.created_by);

  return new;
end;
$$;

create trigger birth_offspring_seed_weight
  after insert on birth_offspring
  for each row execute function seed_weight_from_birth();
