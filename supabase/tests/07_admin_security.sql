-- ---------------------------------------------------------------------
-- M7 — proves the RLS surface the new Admin screens depend on:
--   - ranch_assignments: owner-only write, and the 0030 partial-unique
--     fix actually works (unassign then reassign the same pair);
--   - organization_settings: owner-only update, member-readable;
--   - invitations: owner-only insert, invisible to a manager;
--   - audit_log: owner-only select — a manager gets zero rows, not an
--     error (RLS filters, it doesn't throw).
-- ---------------------------------------------------------------------
begin;
select plan(10);

select tests.clear_authentication();

insert into organizations (id, name) values ('d0000000-0000-0000-0000-000000000001', 'Admin Test Org');

select tests.create_test_user('d0000000-0000-0000-0000-000000000011', 'owner@admin.test');
select tests.create_test_user('d0000000-0000-0000-0000-000000000012', 'mgr@admin.test');

insert into profiles (id, org_id, full_name, email, role) values
  ('d0000000-0000-0000-0000-000000000011', 'd0000000-0000-0000-0000-000000000001', 'Owner', 'owner@admin.test', 'owner'),
  ('d0000000-0000-0000-0000-000000000012', 'd0000000-0000-0000-0000-000000000001', 'Manager', 'mgr@admin.test', 'ranch_manager');

insert into ranches (id, org_id, name) values
  ('d0000000-0000-0000-0000-000000000101', 'd0000000-0000-0000-0000-000000000001', 'Ranch A');

-- A fixture row inserted directly (bypassing RLS, same as the fixtures
-- above) so the select-only assertions below have something real to
-- either find or correctly fail to find — an empty table would make
-- both the owner-can-see and manager-cannot-see checks trivially true
-- for the wrong reason.
insert into audit_log (org_id, actor_id, table_name, record_id, action, after) values
  ('d0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000011', 'ranches',
   'd0000000-0000-0000-0000-000000000101', 'insert', '{}'::jsonb);

-- ---------------------------------------------------------------------
-- ranch_assignments: owner can assign, unassign (soft-delete), and
-- reassign the SAME (ranch_id, profile_id) pair — the exact case 0030's
-- partial unique index exists for. Fixed id reused across both inserts
-- on purpose so the second insert would collide under the old plain
-- `unique(ranch_id, profile_id)` constraint if the fix ever regressed.
-- ---------------------------------------------------------------------
select tests.authenticate_as(
  'd0000000-0000-0000-0000-000000000011', 'd0000000-0000-0000-0000-000000000001', 'owner'
);

select lives_ok(
  $$ insert into ranch_assignments (id, org_id, ranch_id, profile_id) values
       ('d0000000-0000-0000-0000-000000000201', 'd0000000-0000-0000-0000-000000000001',
        'd0000000-0000-0000-0000-000000000101', 'd0000000-0000-0000-0000-000000000012') $$,
  'an owner can assign a manager to a ranch'
);

-- Goes through the unassign_ranch RPC (0032_soft_delete_rpcs.sql), not
-- a plain UPDATE — Postgres RLS requires the row RESULTING from an
-- UPDATE to still satisfy the table's SELECT policy, and
-- ranch_assignments_select filters deleted_at is null, so a plain
-- client-side `update ... set deleted_at = now()` rejects its own
-- write with 42501. Confirmed against a real local instance, not
-- assumed.
select lives_ok(
  $$ select unassign_ranch('d0000000-0000-0000-0000-000000000201') $$,
  'an owner can unassign (soft-delete) that assignment'
);

select lives_ok(
  $$ insert into ranch_assignments (id, org_id, ranch_id, profile_id) values
       ('d0000000-0000-0000-0000-000000000202', 'd0000000-0000-0000-0000-000000000001',
        'd0000000-0000-0000-0000-000000000101', 'd0000000-0000-0000-0000-000000000012') $$,
  'reassigning the same manager to the same ranch after unassignment does not hit the old unique constraint'
);

-- organization_settings: owner can update.
select lives_ok(
  $$ update organization_settings set stale_health_days = 90
     where org_id = 'd0000000-0000-0000-0000-000000000001' $$,
  'an owner can update organisation settings'
);

select is(
  (select count(*)::int from audit_log where org_id = 'd0000000-0000-0000-0000-000000000001'),
  1,
  'an owner reading the audit log sees the seeded row'
);

-- ---------------------------------------------------------------------
-- Now as the manager: everything above must fail or return nothing.
-- ---------------------------------------------------------------------
select tests.authenticate_as(
  'd0000000-0000-0000-0000-000000000012', 'd0000000-0000-0000-0000-000000000001', 'ranch_manager'
);

-- throws_ok's 3rd argument is the expected error MESSAGE, not a
-- description — see 02_profiles_security.sql's note; description is
-- the 4th argument. An RLS WITH CHECK failure on INSERT is always
-- 42501, with Postgres's own standard message.
select throws_ok(
  $$ insert into ranch_assignments (id, org_id, ranch_id, profile_id) values
       ('d0000000-0000-0000-0000-000000000203', 'd0000000-0000-0000-0000-000000000001',
        'd0000000-0000-0000-0000-000000000101', 'd0000000-0000-0000-0000-000000000012') $$,
  '42501',
  'new row violates row-level security policy for table "ranch_assignments"',
  'a manager cannot assign ranches, including to themselves'
);

-- Not throws_ok: organization_settings_owner_update's USING clause
-- excludes the manager entirely (is_owner() is false), so the row is
-- never matched in the first place — an UPDATE whose USING clause
-- matches no rows is a silent no-op in Postgres, not a thrown
-- exception (only a WITH CHECK failure on a row that WAS matched
-- throws). The actual, correct assertion is that the value is
-- untouched, not that an error was raised.
select lives_ok(
  $$ update organization_settings set stale_health_days = 30
     where org_id = 'd0000000-0000-0000-0000-000000000001' $$,
  'a manager''s attempt to change organisation settings runs without error...'
);
select is(
  (select stale_health_days from organization_settings where org_id = 'd0000000-0000-0000-0000-000000000001'),
  90,
  '...but silently changes nothing, since organization_settings_owner_update never matched the row'
);

select throws_ok(
  $$ insert into invitations (org_id, email, role, invited_by) values
       ('d0000000-0000-0000-0000-000000000001', 'someone@example.com', 'ranch_manager',
        'd0000000-0000-0000-0000-000000000012') $$,
  '42501',
  'new row violates row-level security policy for table "invitations"',
  'a manager cannot invite a new user'
);

select is(
  (select count(*)::int from audit_log where org_id = 'd0000000-0000-0000-0000-000000000001'),
  0,
  'a manager reading the audit log gets zero rows, not an error'
);

select tests.clear_authentication();
select * from finish();
rollback;
