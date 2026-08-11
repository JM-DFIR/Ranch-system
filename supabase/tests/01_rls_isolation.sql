begin;
select plan(5);

select tests.clear_authentication();

-- ---------------------------------------------------------------------
-- Fixture: two orgs. Org 1 has Ranch A (manager assigned) and Ranch B
-- (manager NOT assigned), each with one animal, plus a soft-deleted
-- animal on Ranch A. Org 2 is a completely separate tenant with its
-- own ranch and animal, used only for the cross-org check.
-- ---------------------------------------------------------------------
insert into organizations (id, name) values
  ('a0000000-0000-0000-0000-000000000001', 'RLS Test Org 1'),
  ('a0000000-0000-0000-0000-000000000002', 'RLS Test Org 2');

insert into profiles (id, org_id, full_name, email, role) values
  ('a0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000001', 'Owner One', 'owner1@rls.test', 'owner'),
  ('a0000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000001', 'Manager One', 'mgr1@rls.test', 'ranch_manager'),
  ('a0000000-0000-0000-0000-000000000021', 'a0000000-0000-0000-0000-000000000002', 'Owner Two', 'owner2@rls.test', 'owner');

insert into ranches (id, org_id, name) values
  ('a0000000-0000-0000-0000-000000000101', 'a0000000-0000-0000-0000-000000000001', 'Ranch A'),
  ('a0000000-0000-0000-0000-000000000102', 'a0000000-0000-0000-0000-000000000001', 'Ranch B'),
  ('a0000000-0000-0000-0000-000000000201', 'a0000000-0000-0000-0000-000000000002', 'Org 2 Ranch');

insert into ranch_assignments (org_id, ranch_id, profile_id) values
  ('a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000101', 'a0000000-0000-0000-0000-000000000012');

insert into species (org_id, name) values
  ('a0000000-0000-0000-0000-000000000001', 'Cattle'),
  ('a0000000-0000-0000-0000-000000000002', 'Cattle');

insert into animal_statuses (org_id, name, is_active_status) values
  ('a0000000-0000-0000-0000-000000000001', 'Active', true),
  ('a0000000-0000-0000-0000-000000000002', 'Active', true);

insert into animals (id, org_id, ranch_id, tag_number, species_id, status_id) values
  ('a0000000-0000-0000-0000-000000001001', 'a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000101',
    'A-001', (select id from species where org_id = 'a0000000-0000-0000-0000-000000000001'),
    (select id from animal_statuses where org_id = 'a0000000-0000-0000-0000-000000000001')),
  ('a0000000-0000-0000-0000-000000001002', 'a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000102',
    'B-001', (select id from species where org_id = 'a0000000-0000-0000-0000-000000000001'),
    (select id from animal_statuses where org_id = 'a0000000-0000-0000-0000-000000000001')),
  ('a0000000-0000-0000-0000-000000001003', 'a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000101',
    'A-002-deleted', (select id from species where org_id = 'a0000000-0000-0000-0000-000000000001'),
    (select id from animal_statuses where org_id = 'a0000000-0000-0000-0000-000000000001')),
  ('a0000000-0000-0000-0000-000000002001', 'a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000201',
    'X-001', (select id from species where org_id = 'a0000000-0000-0000-0000-000000000002'),
    (select id from animal_statuses where org_id = 'a0000000-0000-0000-0000-000000000002'));

update animals set deleted_at = now() where id = 'a0000000-0000-0000-0000-000000001003';

-- ---------------------------------------------------------------------
-- As Manager One (org 1, assigned to Ranch A only)
-- ---------------------------------------------------------------------
select tests.authenticate_as(
  'a0000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000001', 'ranch_manager'
);

select ok(
  exists(select 1 from animals where id = 'a0000000-0000-0000-0000-000000001001'),
  'manager can read an animal on their assigned ranch'
);

select ok(
  not exists(select 1 from animals where id = 'a0000000-0000-0000-0000-000000001002'),
  'manager cannot read an animal on an unassigned ranch'
);

select ok(
  not exists(select 1 from animals where id = 'a0000000-0000-0000-0000-000000002001'),
  'cross-org animal is invisible even though the manager has no ranch conflict to hide behind'
);

select ok(
  not exists(select 1 from animals where id = 'a0000000-0000-0000-0000-000000001003'),
  'soft-deleted animal is invisible even on an assigned ranch'
);

-- ---------------------------------------------------------------------
-- Cross-org, the other direction: Owner One (org 1) must see zero rows
-- from org 2, despite org 2 having no RLS-relevant relationship to org 1
-- at all — the plainest possible cross-tenant leak check.
-- ---------------------------------------------------------------------
select tests.authenticate_as(
  'a0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000001', 'owner'
);

select is(
  (select count(*)::int from animals where org_id = 'a0000000-0000-0000-0000-000000000002'),
  0,
  'org 1 owner reading org 2''s animals by org_id returns zero rows'
);

select tests.clear_authentication();
select * from finish();
rollback;
