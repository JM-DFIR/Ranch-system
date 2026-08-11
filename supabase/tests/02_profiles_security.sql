begin;
select plan(4);

select tests.clear_authentication();

insert into organizations (id, name) values ('b0000000-0000-0000-0000-000000000001', 'Profiles Test Org');

insert into profiles (id, org_id, full_name, email, role) values
  ('b0000000-0000-0000-0000-000000000011', 'b0000000-0000-0000-0000-000000000001', 'Owner', 'owner@profiles.test', 'owner'),
  ('b0000000-0000-0000-0000-000000000012', 'b0000000-0000-0000-0000-000000000001', 'Manager', 'mgr@profiles.test', 'ranch_manager');

-- ---------------------------------------------------------------------
-- As the manager: self-service edits to safe columns must work.
-- ---------------------------------------------------------------------
select tests.authenticate_as(
  'b0000000-0000-0000-0000-000000000012', 'b0000000-0000-0000-0000-000000000001', 'ranch_manager'
);

select lives_ok(
  $$ update profiles set phone = '+254700000000', full_name = 'Manager Renamed'
     where id = 'b0000000-0000-0000-0000-000000000012' $$,
  'a manager can update their own phone/full_name'
);

-- ---------------------------------------------------------------------
-- Still the manager: escalating their own role or org must be blocked
-- by the trigger, not merely discouraged by the policy.
-- ---------------------------------------------------------------------
select throws_ok(
  $$ update profiles set role = 'owner' where id = 'b0000000-0000-0000-0000-000000000012' $$,
  'a manager cannot change their own role to owner'
);

select throws_ok(
  $$ update profiles set org_id = 'b0000000-0000-0000-0000-000000000099' where id = 'b0000000-0000-0000-0000-000000000012' $$,
  'a manager cannot move themselves to a different organisation'
);

-- ---------------------------------------------------------------------
-- As the owner: changing another profile's role is the legitimate
-- path, and the guard trigger must not block it.
-- ---------------------------------------------------------------------
select tests.authenticate_as(
  'b0000000-0000-0000-0000-000000000011', 'b0000000-0000-0000-0000-000000000001', 'owner'
);

select lives_ok(
  $$ update profiles set role = 'owner' where id = 'b0000000-0000-0000-0000-000000000012' $$,
  'an owner can change another profile''s role'
);

select tests.clear_authentication();
select * from finish();
rollback;
