-- ---------------------------------------------------------------------
-- Every column referenced in an RLS policy is indexed here — missing
-- policy indexes are the single biggest Supabase performance killer
-- (blueprint.md §2.1 rule 6) — plus the obvious query paths for the
-- register and dashboard views built in 0016.
-- ---------------------------------------------------------------------

-- org_id — the first predicate in every policy in this schema.
do $$
declare
  t text;
begin
  foreach t in array array[
    'organization_settings', 'profiles', 'invitations', 'ranches',
    'ranch_assignments', 'ranch_sections', 'species', 'breeds',
    'animal_statuses', 'veterinarians', 'vaccines', 'medications',
    'illness_types', 'feed_items', 'care_activity_types', 'tag_sequences',
    'animals', 'vet_visits', 'vet_visit_animals', 'vaccinations',
    'illnesses', 'treatments', 'weight_records', 'breeding_events',
    'pregnancy_checks', 'births', 'birth_offspring', 'movements',
    'mortalities', 'feeding_records', 'care_activities', 'attachments',
    'audit_log', 'reminders'
  ]
  loop
    execute format('create index if not exists %I on %I (org_id)', t || '_org_id_idx', t);
  end loop;
end $$;

-- ranch_id / ranch-scoped policy columns
create index ranches_id_idx on ranches (id); -- redundant with PK, kept explicit for policy-column documentation
create index ranch_assignments_ranch_id_idx on ranch_assignments (ranch_id);
create index ranch_assignments_profile_id_idx on ranch_assignments (profile_id);
create index ranch_sections_ranch_id_idx on ranch_sections (ranch_id);
create index vet_visits_ranch_id_idx on vet_visits (ranch_id);
create index mortalities_ranch_id_idx on mortalities (ranch_id);
create index feeding_records_ranch_id_idx on feeding_records (ranch_id);
create index care_activities_ranch_id_idx on care_activities (ranch_id);
create index movements_from_ranch_id_idx on movements (from_ranch_id);
create index movements_to_ranch_id_idx on movements (to_ranch_id);
create index reminders_ranch_id_idx on reminders (ranch_id);

-- animals — the obvious query paths named explicitly in blueprint.md §2.2
create index animals_org_ranch_idx on animals (org_id, ranch_id);
create index animals_org_species_idx on animals (org_id, species_id);
create index animals_org_status_idx on animals (org_id, status_id);
create index animals_dam_id_idx on animals (dam_id);
create index animals_sire_id_idx on animals (sire_id);
create index animals_section_id_idx on animals (section_id);
-- animals_org_tag_unique (0006) already covers (org_id, tag_number)

-- animal_id — the policy column on every animal-linked table
create index vet_visit_animals_animal_id_idx on vet_visit_animals (animal_id);
create index vet_visit_animals_vet_visit_id_idx on vet_visit_animals (vet_visit_id);
create index vaccinations_animal_id_idx on vaccinations (animal_id);
create index vaccinations_next_due_date_idx on vaccinations (next_due_date) where next_due_date is not null;
create index illnesses_animal_id_idx on illnesses (animal_id);
create index illnesses_status_idx on illnesses (status);
create index treatments_animal_id_idx on treatments (animal_id);
create index treatments_follow_up_date_idx on treatments (follow_up_date) where follow_up_date is not null;
create index treatments_withdrawal_until_idx on treatments (withdrawal_until) where withdrawal_until is not null;
create index weight_records_animal_id_idx on weight_records (animal_id, weight_date);
create index care_activities_next_due_date_idx on care_activities (next_due_date) where next_due_date is not null;
create index care_activities_animal_id_idx on care_activities (animal_id);
create index feeding_records_animal_id_idx on feeding_records (animal_id);
create index birth_offspring_animal_id_idx on birth_offspring (animal_id);
create index movements_animal_id_idx on movements (animal_id);
create index mortalities_animal_id_idx on mortalities (animal_id);

-- breeding
create index breeding_events_dam_id_idx on breeding_events (dam_id);
create index breeding_events_sire_id_idx on breeding_events (sire_id);
create index breeding_events_status_idx on breeding_events (status);
create index breeding_events_due_date_idx on breeding_events (expected_due_date) where expected_due_date is not null;
create index pregnancy_checks_breeding_event_id_idx on pregnancy_checks (breeding_event_id);
create index births_dam_id_idx on births (dam_id);
create index births_breeding_event_id_idx on births (breeding_event_id);

-- vet visits / vaccines / veterinarians used as FK lookup targets
create index vet_visits_veterinarian_id_idx on vet_visits (veterinarian_id);
create index vet_visits_next_visit_date_idx on vet_visits (next_visit_date) where next_visit_date is not null;
create index vaccinations_vaccine_id_idx on vaccinations (vaccine_id);
create index treatments_medication_id_idx on treatments (medication_id);
create index treatments_illness_id_idx on treatments (illness_id);
create index breeds_species_id_idx on breeds (species_id);
create index vaccines_species_id_idx on vaccines (species_id);
create index illness_types_species_id_idx on illness_types (species_id);

-- attachments — polymorphic policy columns
create index attachments_entity_idx on attachments (entity_type, entity_id);

-- reminders
create index reminders_animal_id_idx on reminders (animal_id);
create index reminders_due_date_idx on reminders (due_date) where status = 'pending';

-- audit_log — read by table/record for the animal Timeline and Admin > Audit Log
create index audit_log_record_idx on audit_log (table_name, record_id);
create index audit_log_occurred_at_idx on audit_log (occurred_at desc);
