-- ---------------------------------------------------------------------
-- The pgTAP test the v3.0 review found missing (blueprint.md §3.5).
-- The v2.0 movements policy allowed an INSERT when the user had access
-- to EITHER the source or destination ranch — which meant a manager
-- with no access to an animal's real ranch could still claim it into
-- their own by lying about the destination. record_movement() (0017)
-- was rewritten to resolve the source ranch itself, server-side, and
-- check access against that alone. This file is what proves it.
-- ---------------------------------------------------------------------
begin;
select plan(4);

select tests.clear_authentication();

insert into organizations (id, name) values ('c0000000-0000-0000-0000-000000000001', 'Movements Test Org');

select tests.create_test_user('c0000000-0000-0000-0000-000000000011', 'owner@mv.test');
select tests.create_test_user('c0000000-0000-0000-0000-000000000012', 'mgr@mv.test');

insert into profiles (id, org_id, full_name, email, role) values
  ('c0000000-0000-0000-0000-000000000011', 'c0000000-0000-0000-0000-000000000001', 'Owner', 'owner@mv.test', 'owner'),
  ('c0000000-0000-0000-0000-000000000012', 'c0000000-0000-0000-0000-000000000001', 'Manager', 'mgr@mv.test', 'ranch_manager');

-- Ranch A: assigned to the manager. Ranch B: unmanaged, a legitimate
-- shipping destination. Ranch C: also unmanaged — this is the ranch
-- the manager will try to falsely claim an animal arrived FROM.
insert into ranches (id, org_id, name) values
  ('c0000000-0000-0000-0000-000000000101', 'c0000000-0000-0000-0000-000000000001', 'Ranch A'),
  ('c0000000-0000-0000-0000-000000000102', 'c0000000-0000-0000-0000-000000000001', 'Ranch B'),
  ('c0000000-0000-0000-0000-000000000103', 'c0000000-0000-0000-0000-000000000001', 'Ranch C');

insert into ranch_assignments (org_id, ranch_id, profile_id) values
  ('c0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000101', 'c0000000-0000-0000-0000-000000000012');

insert into species (org_id, name) values ('c0000000-0000-0000-0000-000000000001', 'Cattle');
insert into animal_statuses (org_id, name, is_active_status) values ('c0000000-0000-0000-0000-000000000001', 'Active', true);

insert into animals (id, org_id, ranch_id, tag_number, species_id, status_id) values
  ('c0000000-0000-0000-0000-000000001001', 'c0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000101',
    'A-001', (select id from species where org_id = 'c0000000-0000-0000-0000-000000000001'),
    (select id from animal_statuses where org_id = 'c0000000-0000-0000-0000-000000000001')),
  ('c0000000-0000-0000-0000-000000001002', 'c0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000103',
    'C-001', (select id from species where org_id = 'c0000000-0000-0000-0000-000000000001'),
    (select id from animal_statuses where org_id = 'c0000000-0000-0000-0000-000000000001'));

select tests.authenticate_as(
  'c0000000-0000-0000-0000-000000000012', 'c0000000-0000-0000-0000-000000000001', 'ranch_manager'
);

-- Positive case: the manager ships an animal FROM their own ranch (A)
-- TO a ranch they don't manage (B). This is the normal operation the
-- policy exists to permit.
select lives_ok(
  $$ select record_movement(
       'c0000000-0000-0000-0000-000000001001'::uuid,
       'c0000000-0000-0000-0000-000000000102'::uuid
     ) $$,
  'manager can transfer an animal out to a ranch they do not manage'
);

select is(
  (select ranch_id from animals where id = 'c0000000-0000-0000-0000-000000001001'),
  'c0000000-0000-0000-0000-000000000102'::uuid,
  'the animal''s ranch_id actually updated to the destination'
);

-- Negative case — the one that matters most: the manager tries to
-- claim an animal whose current ranch (C) they have no access to,
-- naming their OWN ranch (A) as the destination. This must fail.
select throws_ok(
  $$ select record_movement(
       'c0000000-0000-0000-0000-000000001002'::uuid,
       'c0000000-0000-0000-0000-000000000101'::uuid
     ) $$,
  'manager cannot claim an animal from a ranch they do not manage, even into their own ranch'
);

select is(
  (select ranch_id from animals where id = 'c0000000-0000-0000-0000-000000001002'),
  'c0000000-0000-0000-0000-000000000103'::uuid,
  'the animal never left ranch C — the rejected call had no side effect'
);

select tests.clear_authentication();
select * from finish();
rollback;
