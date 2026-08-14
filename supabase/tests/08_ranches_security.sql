-- ---------------------------------------------------------------------
-- The Ranches module (blueprint.md §4.1: Ranch List · Create/Edit Ranch
-- · Ranch Detail · Sections) is the first real UI consumer of
-- ranches_owner_insert/update and ranch_sections_insert/update
-- (0014_rls.sql) — proves the two properties that policy pair is
-- actually supposed to give:
--   - creating/structurally editing a ranch is owner-only;
--   - organising sections within a ranch is manager-writable, but only
--     for a ranch the manager actually has access to.
-- ---------------------------------------------------------------------
begin;
select plan(6);

select tests.clear_authentication();

insert into organizations (id, name) values ('f0000000-0000-0000-0000-000000000001', 'Ranches Test Org');

select tests.create_test_user('f0000000-0000-0000-0000-000000000011', 'owner@ranches.test');
select tests.create_test_user('f0000000-0000-0000-0000-000000000012', 'mgr@ranches.test');

insert into profiles (id, org_id, full_name, email, role) values
  ('f0000000-0000-0000-0000-000000000011', 'f0000000-0000-0000-0000-000000000001', 'Owner', 'owner@ranches.test', 'owner'),
  ('f0000000-0000-0000-0000-000000000012', 'f0000000-0000-0000-0000-000000000001', 'Manager', 'mgr@ranches.test', 'ranch_manager');

insert into ranches (id, org_id, name) values
  ('f0000000-0000-0000-0000-000000000101', 'f0000000-0000-0000-0000-000000000001', 'Ranch A'),
  ('f0000000-0000-0000-0000-000000000102', 'f0000000-0000-0000-0000-000000000001', 'Ranch B');

-- The manager is assigned to Ranch A only — Ranch B is a legitimate
-- ranch in the same org they simply have no access to.
insert into ranch_assignments (org_id, ranch_id, profile_id) values
  ('f0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000101', 'f0000000-0000-0000-0000-000000000012');

-- ---------------------------------------------------------------------
-- As the owner: create and structurally edit a ranch.
-- ---------------------------------------------------------------------
select tests.authenticate_as(
  'f0000000-0000-0000-0000-000000000011', 'f0000000-0000-0000-0000-000000000001', 'owner'
);

select lives_ok(
  $$ insert into ranches (id, org_id, name, location) values
       ('f0000000-0000-0000-0000-000000000103', 'f0000000-0000-0000-0000-000000000001', 'Ranch C', 'Nakuru') $$,
  'an owner can create a ranch'
);

select lives_ok(
  $$ update ranches set status = 'inactive' where id = 'f0000000-0000-0000-0000-000000000103' $$,
  'an owner can structurally edit a ranch'
);

-- ---------------------------------------------------------------------
-- As the manager: ranch creation/editing is out of reach, ranch_sections
-- on their OWN ranch (A) works, and ranch_sections on Ranch B (no
-- access) does not — the manager-writable-but-scoped property.
-- ---------------------------------------------------------------------
select tests.authenticate_as(
  'f0000000-0000-0000-0000-000000000012', 'f0000000-0000-0000-0000-000000000001', 'ranch_manager'
);

select throws_ok(
  $$ insert into ranches (id, org_id, name) values
       ('f0000000-0000-0000-0000-000000000104', 'f0000000-0000-0000-0000-000000000001', 'Manager''s Ranch') $$,
  'a manager cannot create a ranch'
);

select throws_ok(
  $$ update ranches set name = 'Renamed by manager' where id = 'f0000000-0000-0000-0000-000000000101' $$,
  'a manager cannot structurally edit a ranch, even one they manage'
);

select lives_ok(
  $$ insert into ranch_sections (org_id, ranch_id, name) values
       ('f0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000101', 'North paddock') $$,
  'a manager can add a section to a ranch they manage'
);

select throws_ok(
  $$ insert into ranch_sections (org_id, ranch_id, name) values
       ('f0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000102', 'Should not work') $$,
  'a manager cannot add a section to a ranch they do not manage'
);

select tests.clear_authentication();
select * from finish();
rollback;
