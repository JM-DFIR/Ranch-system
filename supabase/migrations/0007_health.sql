create table vet_visits (
  id              uuid primary key default uuid_generate_v7(),
  org_id          uuid not null references organizations(id),
  ranch_id        uuid not null references ranches(id),
  veterinarian_id uuid references veterinarians(id),
  visit_date      date not null,
  purpose         text,
  findings        text,
  recommendations text,
  next_visit_date date,
  cost            numeric(12, 2), -- nullable, gated behind FeatureGate flag="finance" — see blueprint.md §2.6
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  created_by      uuid references profiles(id),
  updated_by      uuid references profiles(id),
  deleted_at      timestamptz
);

create trigger vet_visits_audit
  before insert or update on vet_visits
  for each row execute function apply_audit_columns();

-- One visit, many animals.
create table vet_visit_animals (
  id           uuid primary key default uuid_generate_v7(),
  org_id       uuid not null references organizations(id),
  vet_visit_id uuid not null references vet_visits(id),
  animal_id    uuid not null references animals(id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  created_by   uuid references profiles(id),
  updated_by   uuid references profiles(id),
  deleted_at   timestamptz,
  unique (vet_visit_id, animal_id)
);

create trigger vet_visit_animals_audit
  before insert or update on vet_visit_animals
  for each row execute function apply_audit_columns();

create table vaccinations (
  id                    uuid primary key default uuid_generate_v7(),
  org_id                uuid not null references organizations(id),
  animal_id             uuid not null references animals(id),
  vaccine_id            uuid not null references vaccines(id),
  date_administered     date not null,
  dose                  text,
  batch_number          text,
  route                 text,
  administered_by_profile uuid references profiles(id),
  veterinarian_id       uuid references veterinarians(id),
  next_due_date         date,
  notes                 text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  created_by            uuid references profiles(id),
  updated_by            uuid references profiles(id),
  deleted_at            timestamptz
);

create trigger vaccinations_audit
  before insert or update on vaccinations
  for each row execute function apply_audit_columns();

create table illnesses (
  id              uuid primary key default uuid_generate_v7(),
  org_id          uuid not null references organizations(id),
  animal_id       uuid not null references animals(id),
  illness_type_id uuid references illness_types(id),
  custom_name     text,
  onset_date      date not null,
  symptoms        text,
  severity        text not null check (severity in ('mild', 'moderate', 'severe')),
  diagnosis       text,
  diagnosed_by    text,
  status          text not null default 'suspected'
                    check (status in ('suspected', 'confirmed', 'under_treatment', 'recovered', 'chronic')),
  resolved_date   date,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  created_by      uuid references profiles(id),
  updated_by      uuid references profiles(id),
  deleted_at      timestamptz
);

create trigger illnesses_audit
  before insert or update on illnesses
  for each row execute function apply_audit_columns();

create table treatments (
  id                      uuid primary key default uuid_generate_v7(),
  org_id                  uuid not null references organizations(id),
  animal_id               uuid not null references animals(id),
  illness_id              uuid references illnesses(id),
  medication_id           uuid references medications(id),
  custom_medication       text,
  treatment_date          date not null,
  dosage                  text,
  route                   text,
  duration_days           integer,
  administered_by_profile uuid references profiles(id),
  veterinarian_id         uuid references veterinarians(id),
  withdrawal_until        date,
  outcome                 text,
  follow_up_date          date,
  cost                    numeric(12, 2), -- nullable, gated — see blueprint.md §2.6
  notes                   text,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  created_by              uuid references profiles(id),
  updated_by              uuid references profiles(id),
  deleted_at              timestamptz
);

create trigger treatments_audit
  before insert or update on treatments
  for each row execute function apply_audit_columns();
