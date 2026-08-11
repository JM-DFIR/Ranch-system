-- feeding_records and care_activities both carry animal_id and
-- ranch_id as nullable, with a CHECK that exactly one scope is set —
-- feed can be logged for a whole ranch, or a care activity for one
-- animal, without a polymorphic mess (blueprint.md §2.2).
create table feeding_records (
  id           uuid primary key default uuid_generate_v7(),
  org_id       uuid not null references organizations(id),
  ranch_id     uuid references ranches(id),
  section_id   uuid references ranch_sections(id),
  animal_id    uuid references animals(id),
  feed_item_id uuid not null references feed_items(id),
  feed_date    date not null,
  quantity     numeric(10, 2) not null,
  unit         text not null,
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  created_by   uuid references profiles(id),
  updated_by   uuid references profiles(id),
  deleted_at   timestamptz,
  constraint feeding_records_exactly_one_scope check (num_nonnulls(animal_id, ranch_id) = 1)
);

create trigger feeding_records_audit
  before insert or update on feeding_records
  for each row execute function apply_audit_columns();

create table care_activities (
  id               uuid primary key default uuid_generate_v7(),
  org_id           uuid not null references organizations(id),
  animal_id        uuid references animals(id),
  ranch_id         uuid references ranches(id),
  section_id       uuid references ranch_sections(id),
  activity_type_id uuid not null references care_activity_types(id),
  activity_date    date not null,
  product          text,
  next_due_date    date,
  performed_by     uuid references profiles(id),
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  created_by       uuid references profiles(id),
  updated_by       uuid references profiles(id),
  deleted_at       timestamptz,
  constraint care_activities_exactly_one_scope check (num_nonnulls(animal_id, ranch_id) = 1)
);

create trigger care_activities_audit
  before insert or update on care_activities
  for each row execute function apply_audit_columns();
