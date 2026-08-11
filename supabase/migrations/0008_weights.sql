-- weight_records — a plain record in the client's own idiom (blueprint
-- §2.3): what did this animal weigh, and when. No feedlot economics.
create table weight_records (
  id                    uuid primary key default uuid_generate_v7(),
  org_id                uuid not null references organizations(id),
  animal_id             uuid not null references animals(id),
  weight_date           date not null,
  weight_kg             numeric(6, 2),
  method                text not null check (method in ('scale', 'girth_tape', 'visual_estimate')),
  body_condition_score  smallint check (body_condition_score between 1 and 5),
  recorded_by           uuid references profiles(id),
  notes                 text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  created_by            uuid references profiles(id),
  updated_by            uuid references profiles(id),
  deleted_at            timestamptz,
  constraint weight_records_has_a_reading check (weight_kg is not null or body_condition_score is not null)
);

create trigger weight_records_audit
  before insert or update on weight_records
  for each row execute function apply_audit_columns();

comment on constraint weight_records_has_a_reading on weight_records is
  'Many ranches have no scale — a weight record must carry a weight_kg, a body_condition_score, or both, but not neither. Average daily gain is derived at query time (window function), never stored, so a back-dated record can never leave a stale figure behind.';
