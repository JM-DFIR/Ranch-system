create table attachments (
  id          uuid primary key default uuid_generate_v7(),
  org_id      uuid not null references organizations(id),
  entity_type text not null check (entity_type in ('animal', 'ranch')),
  entity_id   uuid not null,
  file_path   text not null,
  file_name   text not null,
  mime_type   text,
  size_bytes  bigint,
  uploaded_by uuid references profiles(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  created_by  uuid references profiles(id),
  updated_by  uuid references profiles(id),
  deleted_at  timestamptz
);

create trigger attachments_audit
  before insert or update on attachments
  for each row execute function apply_audit_columns();

-- audit_log — append-only, immutable once written. No updated_at, no
-- update trigger, no deleted_at: it is itself the record of history,
-- not a thing history happens to.
create table audit_log (
  id          uuid primary key default uuid_generate_v7(),
  org_id      uuid not null references organizations(id),
  actor_id    uuid references profiles(id),
  table_name  text not null,
  record_id   uuid,
  action      text not null check (action in ('insert', 'update', 'delete', 'restore')),
  before      jsonb,
  after       jsonb,
  occurred_at timestamptz not null default now()
);

-- reminders — schema ships now alongside the finance columns it mirrors
-- in spirit (blueprint.md §0.6 #6): nothing reads or writes this table
-- until the SMS/email reminders feature is actually scheduled post-v1.
create table reminders (
  id         uuid primary key default uuid_generate_v7(),
  org_id     uuid not null references organizations(id),
  ranch_id   uuid references ranches(id),
  animal_id  uuid references animals(id),
  kind       text not null,
  due_date   date not null,
  status     text not null default 'pending' check (status in ('pending', 'sent', 'dismissed', 'done')),
  sent_at    timestamptz,
  payload    jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references profiles(id),
  updated_by uuid references profiles(id),
  deleted_at timestamptz
);

create trigger reminders_audit
  before insert or update on reminders
  for each row execute function apply_audit_columns();

-- ---------------------------------------------------------------------
-- log_audit_event() — generic AFTER INSERT/UPDATE trigger populating
-- audit_log. Not explicitly itemised in the session pack's migration
-- list (which only calls for creating the audit_log table); this is
-- the obvious mechanism the table needs to actually do its stated job
-- (blueprint.md §0.3: "an owner overseeing managers needs to know who
-- changed what"). Attached to the tables where that question is most
-- likely to be asked — not every reference/lookup table, which would
-- be excessive for what those tables are.
-- ---------------------------------------------------------------------
create or replace function log_audit_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
begin
  v_org_id := coalesce(new.org_id, old.org_id);

  insert into audit_log (org_id, actor_id, table_name, record_id, action, before, after, occurred_at)
  values (
    v_org_id,
    auth.uid(),
    TG_TABLE_NAME,
    coalesce(new.id, old.id),
    lower(TG_OP),
    case when TG_OP in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
    case when TG_OP in ('INSERT', 'UPDATE') then to_jsonb(new) else null end,
    now()
  );

  return coalesce(new, old);
end;
$$;

create trigger animals_log_audit
  after insert or update on animals
  for each row execute function log_audit_event();

create trigger movements_log_audit
  after insert or update on movements
  for each row execute function log_audit_event();

create trigger mortalities_log_audit
  after insert or update on mortalities
  for each row execute function log_audit_event();

create trigger breeding_events_log_audit
  after insert or update on breeding_events
  for each row execute function log_audit_event();

create trigger births_log_audit
  after insert or update on births
  for each row execute function log_audit_event();

create trigger vaccinations_log_audit
  after insert or update on vaccinations
  for each row execute function log_audit_event();

create trigger treatments_log_audit
  after insert or update on treatments
  for each row execute function log_audit_event();

create trigger illnesses_log_audit
  after insert or update on illnesses
  for each row execute function log_audit_event();
