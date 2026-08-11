-- ---------------------------------------------------------------------
-- Reference data — org-scoped, owner-editable lookup tables. Never
-- Postgres enums: species, breed, status, vaccine, medication, illness
-- type and feed item are all things the owner can extend without a
-- migration (blueprint.md §2.1 rule 7).
-- ---------------------------------------------------------------------

create table species (
  id                     uuid primary key default uuid_generate_v7(),
  org_id                 uuid not null references organizations(id),
  name                   text not null,
  icon_key               text,
  default_gestation_days integer,
  default_tag_prefix     text,
  is_system              boolean not null default false,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  created_by             uuid references profiles(id),
  updated_by             uuid references profiles(id),
  deleted_at             timestamptz,
  unique (org_id, name)
);

create trigger species_audit
  before insert or update on species
  for each row execute function apply_audit_columns();

create table breeds (
  id         uuid primary key default uuid_generate_v7(),
  org_id     uuid not null references organizations(id),
  species_id uuid not null references species(id),
  name       text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references profiles(id),
  updated_by uuid references profiles(id),
  deleted_at timestamptz,
  unique (org_id, species_id, name)
);

create trigger breeds_audit
  before insert or update on breeds
  for each row execute function apply_audit_columns();

create table animal_statuses (
  id               uuid primary key default uuid_generate_v7(),
  org_id           uuid not null references organizations(id),
  name             text not null,
  is_active_status boolean not null default true,
  color_token      text not null default 'status-neutral',
  is_system        boolean not null default false,
  sort_order       integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  created_by       uuid references profiles(id),
  updated_by       uuid references profiles(id),
  deleted_at       timestamptz,
  unique (org_id, name)
);

create trigger animal_statuses_audit
  before insert or update on animal_statuses
  for each row execute function apply_audit_columns();

create table veterinarians (
  id         uuid primary key default uuid_generate_v7(),
  org_id     uuid not null references organizations(id),
  name       text not null,
  practice   text,
  phone      text,
  email      text,
  notes      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references profiles(id),
  updated_by uuid references profiles(id),
  deleted_at timestamptz
);

create trigger veterinarians_audit
  before insert or update on veterinarians
  for each row execute function apply_audit_columns();

create table vaccines (
  id                    uuid primary key default uuid_generate_v7(),
  org_id                uuid not null references organizations(id),
  name                  text not null,
  species_id            uuid references species(id),
  target_disease        text,
  default_interval_days integer,
  notes                 text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  created_by            uuid references profiles(id),
  updated_by            uuid references profiles(id),
  deleted_at            timestamptz
);

create trigger vaccines_audit
  before insert or update on vaccines
  for each row execute function apply_audit_columns();

create table medications (
  id                      uuid primary key default uuid_generate_v7(),
  org_id                  uuid not null references organizations(id),
  name                    text not null,
  active_ingredient       text,
  default_withdrawal_days integer,
  notes                   text,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  created_by              uuid references profiles(id),
  updated_by              uuid references profiles(id),
  deleted_at              timestamptz
);

create trigger medications_audit
  before insert or update on medications
  for each row execute function apply_audit_columns();

create table illness_types (
  id         uuid primary key default uuid_generate_v7(),
  org_id     uuid not null references organizations(id),
  name       text not null,
  species_id uuid references species(id),
  notes      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references profiles(id),
  updated_by uuid references profiles(id),
  deleted_at timestamptz
);

create trigger illness_types_audit
  before insert or update on illness_types
  for each row execute function apply_audit_columns();

create table feed_items (
  id         uuid primary key default uuid_generate_v7(),
  org_id     uuid not null references organizations(id),
  name       text not null,
  unit       text not null,
  notes      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references profiles(id),
  updated_by uuid references profiles(id),
  deleted_at timestamptz
);

create trigger feed_items_audit
  before insert or update on feed_items
  for each row execute function apply_audit_columns();

create table care_activity_types (
  id         uuid primary key default uuid_generate_v7(),
  org_id     uuid not null references organizations(id),
  name       text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references profiles(id),
  updated_by uuid references profiles(id),
  deleted_at timestamptz
);

create trigger care_activity_types_audit
  before insert or update on care_activity_types
  for each row execute function apply_audit_columns();

-- ---------------------------------------------------------------------
-- tag_sequences — new in v3.0 (blueprint.md §0.6 #1). A per-(org,
-- prefix) atomic counter backing the next_tag_number() RPC (0017).
-- Deliberately lean: a running counter, not a historical record, so it
-- skips the standard audit trigger and deleted_at. Natural key as the
-- primary key — there is no independent identity to a sequence row
-- beyond (org_id, prefix).
-- ---------------------------------------------------------------------
create table tag_sequences (
  org_id      uuid not null references organizations(id),
  prefix      text not null,
  next_number integer not null default 1,
  updated_at  timestamptz not null default now(),
  primary key (org_id, prefix)
);
