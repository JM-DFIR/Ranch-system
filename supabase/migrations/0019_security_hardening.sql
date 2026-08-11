-- ---------------------------------------------------------------------
-- Security Definer Views — a real RLS bypass, found by Supabase's
-- security advisor, not a false positive to silence.
--
-- Postgres views run with the VIEW OWNER's privileges for RLS purposes
-- by default — this has been true since RLS existed, and it means
-- every one of the 9 views in 0016_views.sql, created by the migration
-- role (effectively superuser-equivalent), was bypassing every RLS
-- policy in 0014_rls.sql for anyone who queried them. An authenticated
-- user from ANY organisation could read v_animal_current and see every
-- organisation's animals, not just their own — the exact opposite of
-- what the whole schema is built around.
--
-- PG15 added `security_invoker` as an explicit, OFF-by-default view
-- option specifically to fix this — "off by default" for backward
-- compatibility, which is exactly the trap this project fell into by
-- not setting it. With security_invoker = true, a view runs with the
-- QUERYING role's privileges instead: RLS on the underlying tables
-- applies exactly as if the query had been written directly against
-- them, and the querying role needs its own GRANT on those tables,
-- which 0018_grants.sql already provides. Superuser/admin access is
-- unaffected either way — superusers bypass RLS regardless.
-- ---------------------------------------------------------------------
alter view v_animal_current set (security_invoker = true);
alter view v_ranch_stats set (security_invoker = true);
alter view v_org_stats set (security_invoker = true);
alter view v_animals_requiring_attention set (security_invoker = true);
alter view v_animal_attention_summary set (security_invoker = true);
alter view v_upcoming_vaccinations set (security_invoker = true);
alter view v_upcoming_vet_followups set (security_invoker = true);
alter view v_recent_activity set (security_invoker = true);
alter view v_animal_weight_series set (security_invoker = true);

-- ---------------------------------------------------------------------
-- Function search_path hardening — every SECURITY DEFINER function
-- already pinned search_path when it was written (0013, 0017: the ones
-- whose elevated privileges make an unpinned search_path a real
-- privilege-escalation vector via schema-injection). These ten are the
-- plain, invoker-rights trigger/utility functions that didn't get one,
-- since that risk doesn't apply to them the same way — pinning them
-- anyway is cheap and closes the advisor's "Function Search Path
-- Mutable" warning, which does not distinguish definer from invoker.
-- ---------------------------------------------------------------------
alter function uuid_generate_v7() set search_path = public;
alter function apply_audit_columns() set search_path = public;
alter function apply_updated_at_only() set search_path = public;
alter function create_default_org_settings() set search_path = public;
alter function prevent_lineage_cycle() set search_path = public;
alter function get_ancestors(uuid, integer) set search_path = public;
alter function get_descendants(uuid, integer) set search_path = public;
alter function compute_breeding_due_date() set search_path = public;
alter function seed_weight_from_birth() set search_path = public;
alter function prevent_self_role_escalation() set search_path = public;
