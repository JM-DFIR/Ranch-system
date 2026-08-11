begin;
select plan(3);

select tests.clear_authentication();

insert into organizations (id, name) values ('d0000000-0000-0000-0000-000000000001', 'Lineage Test Org');
select tests.create_test_user('d0000000-0000-0000-0000-000000000011', 'owner@lineage.test');

insert into profiles (id, org_id, full_name, email, role) values
  ('d0000000-0000-0000-0000-000000000011', 'd0000000-0000-0000-0000-000000000001', 'Owner', 'owner@lineage.test', 'owner');
insert into ranches (id, org_id, name) values
  ('d0000000-0000-0000-0000-000000000101', 'd0000000-0000-0000-0000-000000000001', 'Ranch A');
insert into species (org_id, name) values ('d0000000-0000-0000-0000-000000000001', 'Cattle');
insert into animal_statuses (org_id, name, is_active_status) values ('d0000000-0000-0000-0000-000000000001', 'Active', true);

select tests.authenticate_as(
  'd0000000-0000-0000-0000-000000000011', 'd0000000-0000-0000-0000-000000000001', 'owner'
);

-- Grandparent -> Parent -> Child, a legitimate three-generation chain.
insert into animals (id, org_id, ranch_id, tag_number, species_id, status_id) values
  ('d0000000-0000-0000-0000-000000001001', 'd0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000101',
    'GRANDPARENT', (select id from species where org_id = 'd0000000-0000-0000-0000-000000000001'),
    (select id from animal_statuses where org_id = 'd0000000-0000-0000-0000-000000000001'));

insert into animals (id, org_id, ranch_id, tag_number, species_id, status_id, dam_id) values
  ('d0000000-0000-0000-0000-000000001002', 'd0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000101',
    'PARENT', (select id from species where org_id = 'd0000000-0000-0000-0000-000000000001'),
    (select id from animal_statuses where org_id = 'd0000000-0000-0000-0000-000000000001'),
    'd0000000-0000-0000-0000-000000001001');

select lives_ok(
  $$ insert into animals (id, org_id, ranch_id, tag_number, species_id, status_id, dam_id)
     values (
       'd0000000-0000-0000-0000-000000001003', 'd0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000101',
       'CHILD', (select id from species where org_id = 'd0000000-0000-0000-0000-000000000001'),
       (select id from animal_statuses where org_id = 'd0000000-0000-0000-0000-000000000001'),
       'd0000000-0000-0000-0000-000000001002'
     ) $$,
  'a legitimate three-generation chain (grandparent -> parent -> child) is accepted'
);

-- The cycle: make the grandparent descend from its own grandchild.
select throws_ok(
  $$ update animals set dam_id = 'd0000000-0000-0000-0000-000000001003'
     where id = 'd0000000-0000-0000-0000-000000001001' $$,
  'setting a descendant as a proposed parent is rejected as a lineage cycle'
);

-- The direct case: an animal cannot be its own parent.
select throws_ok(
  $$ update animals set dam_id = id where id = 'd0000000-0000-0000-0000-000000001001' $$,
  'an animal cannot be set as its own dam'
);

select tests.clear_authentication();
select * from finish();
rollback;
