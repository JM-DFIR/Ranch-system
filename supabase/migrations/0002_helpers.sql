-- ---------------------------------------------------------------------
-- uuid_generate_v7() — client-generated-safe primary keys.
--
-- Postgres has no built-in UUIDv7 generator at the version this project
-- targets, so this implements the standard recipe: overlay the top 48
-- bits of a random UUID (from gen_random_uuid()) with a millisecond Unix
-- timestamp, then fix up the version nibble (7) and variant bits (10).
-- Time-ordered, globally unique, safe to generate offline on a client
-- and never collide with a server-generated id — see blueprint.md §2.1.
-- ---------------------------------------------------------------------
create or replace function uuid_generate_v7()
returns uuid
language plpgsql
volatile
as $$
declare
  unix_ts_ms bytea;
  uuid_bytes bytea;
begin
  unix_ts_ms = substring(int8send(floor(extract(epoch from clock_timestamp()) * 1000)::bigint) from 3);

  uuid_bytes = uuid_send(gen_random_uuid());
  uuid_bytes = overlay(uuid_bytes placing unix_ts_ms from 1 for 6);
  -- version nibble -> 7
  uuid_bytes = set_byte(uuid_bytes, 6, (b'0111' || get_byte(uuid_bytes, 6)::bit(4))::bit(8)::int);
  -- variant bits -> 10
  uuid_bytes = set_byte(uuid_bytes, 8, (b'10' || get_byte(uuid_bytes, 8)::bit(6))::bit(8)::int);

  return encode(uuid_bytes, 'hex')::uuid;
end;
$$;

-- ---------------------------------------------------------------------
-- apply_audit_columns() — created_at/created_by/updated_at/updated_by
-- on every business table, via a single BEFORE INSERT OR UPDATE trigger.
--
-- Per blueprint.md §0.5 decision #8 / CLAUDE.md §6: this fills
-- created_by/updated_by ONLY when the incoming value is NULL. It must
-- NOT overwrite a value the client already stamped into the row — the
-- offline sync worker stamps the real enrolling user into created_by
-- client-side before queueing, and a write later relayed through an
-- Edge Function under service_role has no auth.uid() of its own to fall
-- back on. created_at/created_by are always pinned back to their
-- original values on UPDATE — they are immutable after creation.
-- ---------------------------------------------------------------------
create or replace function apply_audit_columns()
returns trigger
language plpgsql
as $$
begin
  if TG_OP = 'INSERT' then
    new.created_at = coalesce(new.created_at, now());
    new.created_by = coalesce(new.created_by, auth.uid());
    new.updated_at = coalesce(new.updated_at, new.created_at);
    new.updated_by = coalesce(new.updated_by, new.created_by);
  elsif TG_OP = 'UPDATE' then
    new.created_at = old.created_at;
    new.created_by = old.created_by;
    new.updated_at = now();
    new.updated_by = coalesce(new.updated_by, auth.uid());
  end if;
  return new;
end;
$$;

comment on function apply_audit_columns() is
  'Attach as BEFORE INSERT OR UPDATE FOR EACH ROW on every business table. Fills created_by/updated_by only when NULL so offline-relayed writes keep their client-stamped author.';

-- ---------------------------------------------------------------------
-- apply_updated_at_only() — for the handful of tables that carry
-- created_at/updated_at but deliberately no created_by/updated_by
-- (organizations: nothing exists yet to attribute it to; invitations:
-- invited_by already captures the "who"). apply_audit_columns() would
-- error on these — it unconditionally touches all four columns.
-- ---------------------------------------------------------------------
create or replace function apply_updated_at_only()
returns trigger
language plpgsql
as $$
begin
  if TG_OP = 'INSERT' then
    new.created_at = coalesce(new.created_at, now());
    new.updated_at = coalesce(new.updated_at, new.created_at);
  elsif TG_OP = 'UPDATE' then
    new.created_at = old.created_at;
    new.updated_at = now();
  end if;
  return new;
end;
$$;
