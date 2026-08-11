-- ---------------------------------------------------------------------
-- organizations — the tenant root. Deliberately minimal: no org_id on
-- itself, no created_by (nothing exists yet to attribute it to), no
-- deleted_at (an org is never soft-deleted from inside itself).
-- ---------------------------------------------------------------------
create table organizations (
  id         uuid primary key default uuid_generate_v7(),
  name       text not null,
  timezone   text not null default 'Africa/Nairobi',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger organizations_updated_at
  before insert or update on organizations
  for each row execute function apply_updated_at_only();

-- ---------------------------------------------------------------------
-- organization_settings — one row per org. `timezone` lives on
-- `organizations` only (not duplicated here) to avoid two sources of
-- truth for the same value.
-- ---------------------------------------------------------------------
create table organization_settings (
  org_id           uuid primary key references organizations(id) on delete cascade,
  weight_unit      text not null default 'kg' check (weight_unit in ('kg', 'lb')),
  stale_health_days integer not null default 120,
  feature_flags    jsonb not null default '{"finance": false, "weights": true}'::jsonb,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  created_by       uuid,
  updated_by       uuid
);

create trigger organization_settings_audit
  before insert or update on organization_settings
  for each row execute function apply_audit_columns();

-- Every org gets a settings row the moment it exists — nothing else in
-- the schema creates one, and organization_settings.org_id is the
-- primary key, so a missing row would break the first settings read
-- rather than defaulting gracefully.
create or replace function create_default_org_settings()
returns trigger
language plpgsql
as $$
begin
  insert into organization_settings (org_id) values (new.id);
  return new;
end;
$$;

create trigger organizations_create_settings
  after insert on organizations
  for each row execute function create_default_org_settings();

-- ---------------------------------------------------------------------
-- profiles — one row per auth.users row. `is_active` is this table's
-- soft-delete mechanism (deactivate, don't remove a user record) so it
-- does not also get a deleted_at column — that would be two switches
-- for the same thing.
-- ---------------------------------------------------------------------
create table profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  org_id       uuid not null references organizations(id),
  full_name    text not null,
  phone        text,
  email        text not null,
  avatar_url   text,
  role         text not null check (role in ('owner', 'ranch_manager')),
  is_active    boolean not null default true,
  last_seen_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  created_by   uuid references profiles(id),
  updated_by   uuid references profiles(id)
);

create trigger profiles_audit
  before insert or update on profiles
  for each row execute function apply_audit_columns();

-- ---------------------------------------------------------------------
-- invitations — email, role and a bearer token; accepted_at marks the
-- point a profile is created for it.
-- ---------------------------------------------------------------------
create table invitations (
  id          uuid primary key default uuid_generate_v7(),
  org_id      uuid not null references organizations(id),
  email       text not null,
  role        text not null check (role in ('owner', 'ranch_manager')),
  token       text not null unique default encode(extensions.gen_random_bytes(32), 'hex'),
  expires_at  timestamptz not null default (now() + interval '14 days'),
  accepted_at timestamptz,
  invited_by  uuid not null references profiles(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

create trigger invitations_updated_at
  before insert or update on invitations
  for each row execute function apply_updated_at_only();
