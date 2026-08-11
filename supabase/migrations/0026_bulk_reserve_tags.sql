-- ---------------------------------------------------------------------
-- bulk_reserve_tags — backs the Tag Range Generator (session-pack.md,
-- Session 5b; blueprint.md §2.4), for ranches that number physical
-- tags before working the animals: reserve MUX 501-MUX 550 in one
-- call rather than 50 round trips. Each reservation is a genuine
-- animals row with species_id left null — the same "incomplete
-- enrolment" placeholder shape 0016_views.sql's attention rule 11
-- already documented and expects (a.photo_path is null or
-- a.species_id is null), not a new concept invented here.
--
-- Loops next_tag_number() rather than reimplementing its atomic
-- counter logic — one savepoint per iteration via PL/pgSQL's implicit
-- subtransaction on the loop body would be overkill here; a single
-- surrounding transaction for the whole batch is correct, since a
-- reservation batch either fully succeeds or the caller retries the
-- whole thing.
-- ---------------------------------------------------------------------
create or replace function bulk_reserve_tags(
  p_ranch_id   uuid,
  p_prefix     text,
  p_count      integer,
  p_species_id uuid default null,
  p_section_id uuid default null
)
returns setof animals
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id    uuid;
  v_status_id uuid;
  v_i         integer;
  v_tag       text;
  v_animal    animals;
begin
  if p_count is null or p_count < 1 or p_count > 500 then
    raise exception 'count must be between 1 and 500';
  end if;

  v_org_id := auth_org_id();

  if not has_ranch_access(p_ranch_id) then
    raise exception 'you do not have access to this ranch';
  end if;

  select id into v_status_id
  from animal_statuses
  where org_id = v_org_id and name = 'Active' and deleted_at is null
  limit 1;

  if v_status_id is null then
    raise exception 'no "Active" status is configured for this organisation';
  end if;

  for v_i in 1..p_count loop
    v_tag := next_tag_number(v_org_id, p_prefix);

    insert into animals (
      org_id, ranch_id, section_id, tag_number, species_id, status_id,
      sex, acquisition_type, created_by, updated_by
    ) values (
      v_org_id, p_ranch_id, p_section_id, v_tag, p_species_id, v_status_id,
      'unknown', 'unknown', auth.uid(), auth.uid()
    )
    returning * into v_animal;

    return next v_animal;
  end loop;
end;
$$;

grant execute on function bulk_reserve_tags to authenticated;
