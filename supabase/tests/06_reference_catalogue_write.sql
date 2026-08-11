-- ---------------------------------------------------------------------
-- Proves the policy change in 0021_reference_catalogue_manager_write.sql:
-- a ranch manager can now insert into and soft-delete from the
-- reference/lookup tables (species, breeds, etc. — breeds exercised
-- here as the representative case), which used to be is_owner()-only.
-- The org boundary itself must still hold — that half of the original
-- policy was never in question, only the owner-vs-manager half.
--
-- Also proves 0022_reference_catalogue_reusable_names.sql: a name is
-- reusable once its row is soft-deleted, same as animals.tag_number
-- already worked. Found for real trying to remove and re-add a species
-- (Chicken) — worth locking in as a test, not just a manual fix.
-- ---------------------------------------------------------------------
begin;
select plan(5);

select tests.clear_authentication();

insert into organizations (id, name) values
  ('e0000000-0000-0000-0000-000000000001', 'Reference Catalogue Test Org'),
  ('e0000000-0000-0000-0000-000000000002', 'Other Org');

select tests.create_test_user('e0000000-0000-0000-0000-000000000011', 'owner@refcat.test');
select tests.create_test_user('e0000000-0000-0000-0000-000000000012', 'mgr@refcat.test');

insert into profiles (id, org_id, full_name, email, role) values
  ('e0000000-0000-0000-0000-000000000011', 'e0000000-0000-0000-0000-000000000001', 'Owner', 'owner@refcat.test', 'owner'),
  ('e0000000-0000-0000-0000-000000000012', 'e0000000-0000-0000-0000-000000000001', 'Manager', 'mgr@refcat.test', 'ranch_manager');

insert into species (id, org_id, name) values
  ('e0000000-0000-0000-0000-000000000201', 'e0000000-0000-0000-0000-000000000001', 'Cattle');

select tests.authenticate_as(
  'e0000000-0000-0000-0000-000000000012', 'e0000000-0000-0000-0000-000000000001', 'ranch_manager'
);

-- Positive: a manager can now extend the catalogue.
select lives_ok(
  $$ insert into breeds (id, org_id, species_id, name) values
       ('e0000000-0000-0000-0000-000000000301', 'e0000000-0000-0000-0000-000000000001',
        'e0000000-0000-0000-0000-000000000201', 'Boran') $$,
  'a manager can insert a new breed'
);

-- Positive: a manager can soft-delete it.
select lives_ok(
  $$ update breeds set deleted_at = now() where id = 'e0000000-0000-0000-0000-000000000301' $$,
  'a manager can soft-delete a breed'
);

select isnt(
  (select deleted_at from breeds where id = 'e0000000-0000-0000-0000-000000000301'),
  null,
  'the breed is actually marked deleted, not just accepted silently'
);

-- Positive: the freed-up name is reusable, not permanently reserved —
-- this is the bug 0022 fixed (plain unique(org_id, name) previously
-- blocked this with a unique_violation regardless of deleted_at).
select lives_ok(
  $$ insert into breeds (id, org_id, species_id, name) values
       ('e0000000-0000-0000-0000-000000000303', 'e0000000-0000-0000-0000-000000000001',
        'e0000000-0000-0000-0000-000000000201', 'Boran') $$,
  'a soft-deleted breed''s name can be reused'
);

-- Negative: the org boundary from the original policy still holds —
-- relaxing owner-only to member-only must not have widened this too.
select throws_ok(
  $$ insert into breeds (id, org_id, species_id, name) values
       ('e0000000-0000-0000-0000-000000000302', 'e0000000-0000-0000-0000-000000000002',
        'e0000000-0000-0000-0000-000000000201', 'Cross-org breed') $$,
  'a manager still cannot insert a breed into a different organisation'
);

select tests.clear_authentication();
select * from finish();
rollback;
