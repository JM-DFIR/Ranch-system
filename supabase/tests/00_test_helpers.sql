-- ---------------------------------------------------------------------
-- Shared pgTAP test helpers. Deliberately NOT wrapped in begin/rollback
-- — these functions need to persist across the other numbered test
-- files in this directory, which each run in their own transaction.
-- Assumes the standard Supabase local stack (roles `anon`,
-- `authenticated`, `service_role`, `postgres` already exist) — this has
-- not been run against a live instance from this environment; see the
-- note at the top of ../seed.sql.
-- ---------------------------------------------------------------------
create extension if not exists pgtap with schema extensions;

create schema if not exists tests;

-- Simulates an authenticated request as a given user/org/role by
-- setting the same JWT claims auth_org_id()/is_owner() read, and
-- switching to the `authenticated` role so RLS actually applies —
-- running as `postgres` (the migration owner) bypasses RLS entirely,
-- which would make every test pass for the wrong reason.
create or replace function tests.authenticate_as(p_user_id uuid, p_org_id uuid, p_role text)
returns void
language plpgsql
as $$
begin
  perform set_config(
    'request.jwt.claims',
    json_build_object(
      'sub', p_user_id::text,
      'app_metadata', json_build_object('org_id', p_org_id::text, 'role', p_role)
    )::text,
    true
  );
  execute 'set local role authenticated';
end;
$$;

-- Drops back to an unauthenticated context.
create or replace function tests.clear_authentication()
returns void
language plpgsql
as $$
begin
  perform set_config('request.jwt.claims', '', true);
  execute 'reset role';
end;
$$;
