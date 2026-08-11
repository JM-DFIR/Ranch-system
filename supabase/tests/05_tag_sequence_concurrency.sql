-- ---------------------------------------------------------------------
-- next_tag_number() correctness. Honest scope note: pgTAP runs a test
-- file in a single session/transaction, so this cannot simulate two
-- real concurrent connections racing each other — that would need
-- something like dblink or pg_background, which is more machinery than
-- this project's actual concurrency profile (≤5 users) justifies. What
-- this DOES exercise is both branches the race-safety in 0017 depends
-- on: the first call takes the "row doesn't exist yet, insert" path,
-- every call after takes the "row exists, update" path, and the
-- allocated numbers must never repeat or skip either way.
-- ---------------------------------------------------------------------
begin;
select plan(4);

select tests.clear_authentication();

insert into organizations (id, name) values ('e0000000-0000-0000-0000-000000000001', 'Tag Sequence Test Org');
select tests.create_test_user('e0000000-0000-0000-0000-000000000011', 'owner@tag.test');

insert into profiles (id, org_id, full_name, email, role) values
  ('e0000000-0000-0000-0000-000000000011', 'e0000000-0000-0000-0000-000000000001', 'Owner', 'owner@tag.test', 'owner');

select tests.authenticate_as(
  'e0000000-0000-0000-0000-000000000011', 'e0000000-0000-0000-0000-000000000001', 'owner'
);

select is(
  next_tag_number('e0000000-0000-0000-0000-000000000001', 'M'),
  'M1',
  'first call for a fresh prefix allocates 1 (the insert branch)'
);

select is(
  next_tag_number('e0000000-0000-0000-0000-000000000001', 'M'),
  'M2',
  'second call for the same prefix allocates 2, not a repeat (the update branch)'
);

select is(
  next_tag_number('e0000000-0000-0000-0000-000000000001', 'M'),
  'M3',
  'third call continues the sequence with no gaps or repeats'
);

select is(
  next_tag_number('e0000000-0000-0000-0000-000000000001', 'MUX '),
  'MUX 1',
  'a different prefix in the same org gets its own independent counter starting at 1'
);

select tests.clear_authentication();
select * from finish();
rollback;
