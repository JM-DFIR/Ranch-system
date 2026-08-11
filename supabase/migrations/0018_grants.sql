-- ---------------------------------------------------------------------
-- Privilege grants for `authenticated` — a gap surfaced during manual
-- verification of Session 1 (ERROR 42501: permission denied for table
-- animals). RLS policies (0014) restrict which ROWS a role can see or
-- touch once it's allowed to query a table; they say nothing about
-- whether the role may attempt the operation on the table AT ALL.
-- Postgres checks table-level privileges FIRST and denies before RLS
-- is ever evaluated if the role has no GRANT. This project's Supabase
-- bootstrap does not appear to auto-grant this for tables created via
-- migration (some project setups do), so it has to be explicit.
--
-- This migration is purely additive — it grants exactly what each
-- table's existing RLS policies from 0014 already allow, nothing more.
-- No DELETE is granted anywhere, matching "no hard delete policy on
-- any business table" — even a future accidental DELETE policy would
-- still be blocked at this layer without a matching GRANT here.
-- ---------------------------------------------------------------------

grant usage on schema public to authenticated;

-- SELECT + INSERT + UPDATE — every table with a client-facing write
-- policy in 0014.
do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles', 'invitations', 'ranches', 'ranch_assignments', 'ranch_sections',
    'species', 'breeds', 'animal_statuses', 'veterinarians', 'vaccines',
    'medications', 'illness_types', 'feed_items', 'care_activity_types',
    'animals', 'vet_visits', 'vet_visit_animals', 'vaccinations', 'illnesses',
    'treatments', 'weight_records', 'breeding_events', 'pregnancy_checks',
    'feeding_records', 'care_activities', 'attachments', 'reminders'
  ]
  loop
    execute format('grant select, insert, update on %I to authenticated', t);
  end loop;
end $$;

-- SELECT + UPDATE only — no client-facing INSERT policy exists for
-- these (organizations is created by the onboarding Edge Function
-- under service_role; organization_settings is auto-created by the
-- organizations_create_settings trigger, 0003).
grant select, update on organizations to authenticated;
grant select, update on organization_settings to authenticated;

-- SELECT only — written exclusively through SECURITY DEFINER RPCs
-- (record_movement, record_death, record_birth, next_tag_number, 0017)
-- or, for audit_log, an internal trigger. The calling role never needs
-- its own INSERT/UPDATE grant here: the RPC executes with the function
-- owner's privileges, not the caller's.
do $$
declare
  t text;
begin
  foreach t in array array['tag_sequences', 'births', 'birth_offspring', 'movements', 'mortalities', 'audit_log']
  loop
    execute format('grant select on %I to authenticated', t);
  end loop;
end $$;

-- Views (0016) — a view is its own object with its own privilege
-- check, even though the query it runs still applies RLS from the
-- underlying tables using the caller's rights.
do $$
declare
  v text;
begin
  foreach v in array array[
    'v_animal_current', 'v_ranch_stats', 'v_org_stats',
    'v_animals_requiring_attention', 'v_animal_attention_summary',
    'v_upcoming_vaccinations', 'v_upcoming_vet_followups',
    'v_recent_activity', 'v_animal_weight_series'
  ]
  loop
    execute format('grant select on %I to authenticated', v);
  end loop;
end $$;

-- Functions default to PUBLIC EXECUTE in vanilla Postgres, but given
-- table grants were NOT auto-provided in this project, don't assume
-- function grants were either — explicit beats a second surprise.
grant execute on all functions in schema public to authenticated;

-- extensions schema (pgcrypto, pg_trgm, pg_cron — 0001): covers what
-- exists as of this migration. pgtap is added later, by
-- supabase/tests/00_test_helpers.sql, which re-grants on this same
-- schema itself once its own functions exist — see the note there.
grant usage on schema extensions to authenticated;
grant execute on all functions in schema extensions to authenticated;

-- Grants for the `tests` schema deliberately do NOT live here. A fresh
-- `supabase db reset` applies numbered migrations, in order, before
-- anything under supabase/tests/ ever runs — the `tests` schema
-- wouldn't exist yet when this file's turn came, so a grant on it here
-- would break that path. Those grants are in
-- supabase/tests/00_test_helpers.sql instead, right where the schema
-- itself is created.
