create table ranches (
  id             uuid primary key default uuid_generate_v7(),
  org_id         uuid not null references organizations(id),
  name           text not null,
  location       text,
  description    text,
  size_acres     numeric(10, 2),
  contact_name   text,
  contact_phone  text,
  contact_email  text,
  status         text not null default 'active' check (status in ('active', 'inactive')),
  cover_image_path text,
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  created_by     uuid references profiles(id),
  updated_by     uuid references profiles(id),
  deleted_at     timestamptz
);

create trigger ranches_audit
  before insert or update on ranches
  for each row execute function apply_audit_columns();

-- Many-to-many: a manager may hold several ranches, a ranch may have
-- several managers. `deleted_at` here is a real audit fact worth
-- keeping — "who was assigned to this ranch, and when did that end" —
-- not just structural bookkeeping.
create table ranch_assignments (
  id          uuid primary key default uuid_generate_v7(),
  org_id      uuid not null references organizations(id),
  ranch_id    uuid not null references ranches(id),
  profile_id  uuid not null references profiles(id),
  assigned_at timestamptz not null default now(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  created_by  uuid references profiles(id),
  updated_by  uuid references profiles(id),
  deleted_at  timestamptz,
  unique (ranch_id, profile_id)
);

create trigger ranch_assignments_audit
  before insert or update on ranch_assignments
  for each row execute function apply_audit_columns();

-- The PRD's "internal locations" — paddocks, sheds, etc.
create table ranch_sections (
  id          uuid primary key default uuid_generate_v7(),
  org_id      uuid not null references organizations(id),
  ranch_id    uuid not null references ranches(id),
  name        text not null,
  description text,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  created_by  uuid references profiles(id),
  updated_by  uuid references profiles(id),
  deleted_at  timestamptz
);

create trigger ranch_sections_audit
  before insert or update on ranch_sections
  for each row execute function apply_audit_columns();
