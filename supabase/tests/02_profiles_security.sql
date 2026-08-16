begin;
select plan(4);

select tests.clear_authentication();

insert into organizations (id, name) values ('b0000000-0000-0000-0000-000000000001', 'Profiles Test Org');

select tests.create_test_user('b0000000-0000-0000-0000-000000000011', 'owner@profiles.test');
select tests.create_test_user('b0000000-0000-0000-0000-000000000012', 'mgr@profiles.test');

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
-- pgTAP's throws_ok has no (sql, description) 2-arg form, AND its
-- 3-arg form is (sql, errcode, errmsg) — the 3rd position is always
-- compared against the caught exception's actual message text, never
-- treated as a free-standing description. A description needs the
-- full 4-arg form: (sql, errcode, errmsg, description). Found running
-- this suite for the first time — both prior attempts (bare
-- description, then errcode-only) failed for exactly this reason.
-- prevent_self_role_escalation's raise exception (0014_rls.sql) is a
-- plain RAISE EXCEPTION, always SQLSTATE P0001.
select throws_ok(
  $$ update profiles set role = 'owner' where id = 'b0000000-0000-0000-0000-000000000012' $$,
  'P0001',
  'only an owner may change role or organisation',
  'a manager cannot change their own role to owner'
);

select throws_ok(
  $$ update profiles set org_id = 'b0000000-0000-0000-0000-000000000099' where id = 'b0000000-0000-0000-0000-000000000012' $$,
  'P0001',
  'only an owner may change role or organisation',
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
