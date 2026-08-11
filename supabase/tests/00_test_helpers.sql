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

-- `GRANT ... ON ALL FUNCTIONS` only covers functions that exist at the
-- moment it runs — pgtap's assertion functions (ok, is, throws_ok,
-- plan, finish, …) didn't exist when 0018_grants.sql granted on the
-- extensions schema, since that migration runs before this file ever
-- does. Every test file calls these while already running as
-- `authenticated` (after authenticate_as() switches role), so they
-- need to be re-grantable here, right after pgtap actually exists.
grant usage on schema extensions to authenticated;
grant execute on all functions in schema extensions to authenticated;

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

-- profiles.id is a foreign key to auth.users(id) (0003) — a fixture
-- can't insert a profile row for a UUID auth.users has never heard of.
-- This creates the minimal auth.users row a test profile needs to
-- satisfy that FK. No auth.identities row — these fixtures are never
-- actually logged into, only referenced by id, so the fuller shape
-- seed.sql uses for real dev logins isn't needed here.
-- SECURITY DEFINER, unlike the two functions above: this only does a
-- plain INSERT with no role-switching side effect to worry about, so
-- it's safe to make it always run with the definer's (table-owner)
-- privileges — meaning it works regardless of which role happens to be
-- calling it, rather than depending on every test file calling it
-- before authenticate_as() has switched the session to `authenticated`.
create or replace function tests.create_test_user(p_user_id uuid, p_email text default null)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000', p_user_id, 'authenticated', 'authenticated',
    coalesce(p_email, p_user_id::text || '@pgtap.test'),
    extensions.crypt('testpassword', extensions.gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
    '', '', '', ''
  )
  on conflict (id) do nothing;
end;
$$;

-- Once a test file calls authenticate_as(), the session is running as
-- `authenticated` for everything after — including any SECOND call to
-- authenticate_as()/clear_authentication() later in the same file
-- (01_rls_isolation.sql does exactly this). Both the schema and its
-- functions need to be usable/callable by that role, not just by
-- whatever powerful role the SQL editor originally connects as.
grant usage on schema tests to authenticated;
grant execute on all functions in schema tests to authenticated;
