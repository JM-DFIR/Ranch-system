-- movements — written only through the record_movement() RPC (0017),
-- never a direct client insert. from_ranch_id is NOT NULL and always
-- resolved server-side from the animal's current ranch_id at the
-- moment the RPC runs — never trusted from client input. This is the
-- v3.0 security correction; see blueprint.md §3.3 for the full story
-- of the hole it closes.
create table movements (
  id              uuid primary key default uuid_generate_v7(),
  org_id          uuid not null references organizations(id),
  animal_id       uuid not null references animals(id),
  from_ranch_id   uuid not null references ranches(id),
  from_section_id uuid references ranch_sections(id),
  to_ranch_id     uuid not null references ranches(id),
  to_section_id   uuid references ranch_sections(id),
  movement_date   date not null,
  reason          text,
  permit_number   text,
  notes           text,
  recorded_by     uuid references profiles(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  created_by      uuid references profiles(id),
  updated_by      uuid references profiles(id),
  deleted_at      timestamptz
);

create trigger movements_audit
  before insert or update on movements
  for each row execute function apply_audit_columns();

-- mortalities — written only through the record_death() RPC (0017),
-- which also flips the animal's status to Deceased in the same
-- transaction (blueprint.md §2.9).
create table mortalities (
  id                uuid primary key default uuid_generate_v7(),
  org_id            uuid not null references organizations(id),
  animal_id         uuid not null references animals(id),
  date_of_death     date not null,
  ranch_id          uuid not null references ranches(id),
  section_id        uuid references ranch_sections(id),
  cause_category    text not null,
  cause_details     text,
  postmortem_done   boolean not null default false,
  disposal_method   text,
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  created_by        uuid references profiles(id),
  updated_by        uuid references profiles(id),
  deleted_at        timestamptz
);

create trigger mortalities_audit
  before insert or update on mortalities
  for each row execute function apply_audit_columns();
