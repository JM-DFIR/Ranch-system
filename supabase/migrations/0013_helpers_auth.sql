-- ---------------------------------------------------------------------
-- Security-definer helper functions — blueprint.md §2.7 / §3.1. This
-- pattern avoids recursive RLS policy evaluation and keeps policies
-- fast: each helper runs with the definer's (postgres/table-owner)
-- privileges, bypassing the caller's own RLS on the tables it reads
-- internally, rather than re-triggering another round of policy checks.
-- ---------------------------------------------------------------------

create or replace function auth_org_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid,
    (select org_id from profiles where id = auth.uid())
  );
$$;

create or replace function is_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'owner',
    (select role = 'owner' from profiles where id = auth.uid()),
    false
  );
$$;

create or replace function has_ranch_access(p_ranch_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select p_ranch_id is not null and (
    is_owner() or exists (
      select 1 from ranch_assignments ra
      where ra.ranch_id = p_ranch_id
        and ra.profile_id = auth.uid()
        and ra.deleted_at is null
    )
  );
$$;

-- Not one of the three functions blueprint.md names explicitly, but the
-- same recursion-avoidance rationale applies: eight-plus tables (health
-- records, weights, breeding events…) scope access via an animal's
-- current ranch rather than a ranch_id column of their own. Without
-- this, that subquery would be repeated verbatim in every one of their
-- policies in 0014; with it, each policy is a one-line call.
-- Excludes a soft-deleted animal deliberately: hiding the animal but
-- leaving its vaccinations/treatments/weights reachable through this
-- helper would make "soft-deleted rows are invisible" true for the
-- animal and false for everything hanging off it.
create or replace function has_animal_access(p_animal_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from animals a
    where a.id = p_animal_id
      and a.deleted_at is null
      and a.org_id = auth_org_id()
      and has_ranch_access(a.ranch_id)
  );
$$;

-- ---------------------------------------------------------------------
-- JWT custom claims — role and org_id mirrored into auth.users so
-- policy checks read them straight off the token (auth.jwt()) instead
-- of hitting profiles on every request (blueprint.md §3.5). Runs as the
-- migration owner (postgres), which has write access to auth.users —
-- this is the standard Supabase custom-claims pattern.
-- ---------------------------------------------------------------------
create or replace function sync_profile_claims()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  update auth.users
  set raw_app_meta_data =
    coalesce(raw_app_meta_data, '{}'::jsonb)
    || jsonb_build_object('org_id', new.org_id, 'role', new.role)
  where id = new.id;
  return new;
end;
$$;

create trigger profiles_sync_claims
  after insert or update of org_id, role on profiles
  for each row execute function sync_profile_claims();
