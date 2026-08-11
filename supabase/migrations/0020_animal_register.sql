-- ---------------------------------------------------------------------
-- v_animal_current — extended with attention_severity/attention_count,
-- joined from v_animal_attention_summary (never
-- v_animals_requiring_attention directly — that view returns multiple
-- rows per animal and would duplicate register rows on a naive join;
-- blueprint.md §0.5 #5). PostgREST can't auto-embed a relationship
-- between two views the way it can between real FK-linked tables, so
-- rather than two round-trips merged in JS, the join happens here,
-- server-side, and the register queries one flat view.
--
-- WITH (security_invoker = true) is restated explicitly — CREATE OR
-- REPLACE VIEW does not reliably carry the option forward from 0019's
-- ALTER VIEW, and this is the exact property whose absence caused the
-- RLS bypass 0019 fixed. The ALTER VIEW right after is a second,
-- redundant safety net on top of the inline WITH clause — belt and
-- suspenders, deliberately, given what this project already got wrong
-- once here.
-- ---------------------------------------------------------------------
create or replace view v_animal_current
with (security_invoker = true)
as
select
  a.id,
  a.org_id,
  a.ranch_id,
  r.name as ranch_name,
  a.section_id,
  rs.name as section_name,
  a.tag_number,
  a.name,
  a.species_id,
  s.name as species_name,
  a.breed_id,
  b.name as breed_name,
  a.sex,
  a.color,
  a.date_of_birth,
  a.dob_is_estimated,
  a.acquisition_type,
  a.acquisition_date,
  a.dam_id,
  a.sire_id,
  a.status_id,
  st.name as status_name,
  st.is_active_status,
  st.color_token as status_color_token,
  a.photo_path,
  a.anitrac_ain,
  a.notes,
  le.last_event_date,
  a.created_at,
  a.updated_at,
  a.deleted_at,
  -- Appended after deleted_at, not inserted earlier in the list: Postgres's
  -- CREATE OR REPLACE VIEW (42P16) requires every pre-existing output column
  -- to keep its exact name AND ordinal position — it only allows new columns
  -- at the very end. Putting these between last_event_date and created_at
  -- (as an earlier version of this migration did) silently renames the view's
  -- 27th+ columns from Postgres's point of view and fails to apply.
  vas.worst_severity as attention_severity,
  coalesce(vas.reason_count, 0) as attention_reason_count
from animals a
join ranches r on r.id = a.ranch_id
left join ranch_sections rs on rs.id = a.section_id
left join species s on s.id = a.species_id
left join breeds b on b.id = a.breed_id
join animal_statuses st on st.id = a.status_id
left join lateral (
  select greatest(
    (select max(date_administered) from vaccinations where animal_id = a.id and deleted_at is null),
    (select max(treatment_date) from treatments where animal_id = a.id and deleted_at is null),
    (select max(onset_date) from illnesses where animal_id = a.id and deleted_at is null),
    (select max(weight_date) from weight_records where animal_id = a.id and deleted_at is null),
    (select max(movement_date) from movements where animal_id = a.id and deleted_at is null)
  ) as last_event_date
) le on true
left join v_animal_attention_summary vas on vas.animal_id = a.id
where a.deleted_at is null;

alter view v_animal_current set (security_invoker = true);

-- ---------------------------------------------------------------------
-- get_animal_facet_counts — faceted-filter live counts (ranch, species,
-- sex, status, section), each reflecting every OTHER active filter but
-- not its own — the standard faceted-search behaviour, computed
-- server-side in one round trip rather than fetched-and-counted in JS
-- (CLAUDE.md §6: "aggregation happens in Postgres views/RPCs, never
-- client-side"). Ranch counts feed both the register's own filter bar
-- and the App Shell's global ranch switcher (Session 2) — there is
-- still exactly one `ranch` URL param (_authenticated's), this just
-- gives a second entry point for setting it, with live counts, rather
-- than a competing local-only scope mechanism.
-- security invoker (the default for functions) — this must run under
-- the caller's own RLS, not bypass it.
-- ---------------------------------------------------------------------
create or replace function get_animal_facet_counts(
  p_ranch_id uuid default null,
  p_species_ids uuid[] default null,
  p_breed_ids uuid[] default null,
  p_sexes text[] default null,
  p_status_ids uuid[] default null,
  p_section_ids uuid[] default null,
  p_search text default null
)
returns jsonb
language sql
stable
set search_path = public
as $$
  select jsonb_build_object(
    'ranch', (
      select coalesce(jsonb_object_agg(x.ranch_id, x.cnt), '{}'::jsonb)
      from (
        select a.ranch_id, count(*) as cnt
        from v_animal_current a
        where (p_species_ids is null or a.species_id = any(p_species_ids))
          and (p_breed_ids is null or a.breed_id = any(p_breed_ids))
          and (p_sexes is null or a.sex = any(p_sexes))
          and (p_status_ids is null or a.status_id = any(p_status_ids))
          and (p_section_ids is null or a.section_id = any(p_section_ids))
          and (p_search is null or a.tag_number ilike '%' || p_search || '%' or a.name ilike '%' || p_search || '%')
        group by a.ranch_id
      ) x
    ),
    'species', (
      select coalesce(jsonb_object_agg(x.species_id, x.cnt), '{}'::jsonb)
      from (
        select a.species_id, count(*) as cnt
        from v_animal_current a
        where (p_ranch_id is null or a.ranch_id = p_ranch_id)
          and (p_breed_ids is null or a.breed_id = any(p_breed_ids))
          and (p_sexes is null or a.sex = any(p_sexes))
          and (p_status_ids is null or a.status_id = any(p_status_ids))
          and (p_section_ids is null or a.section_id = any(p_section_ids))
          and (p_search is null or a.tag_number ilike '%' || p_search || '%' or a.name ilike '%' || p_search || '%')
          and a.species_id is not null
        group by a.species_id
      ) x
    ),
    'sex', (
      select coalesce(jsonb_object_agg(x.sex, x.cnt), '{}'::jsonb)
      from (
        select a.sex, count(*) as cnt
        from v_animal_current a
        where (p_ranch_id is null or a.ranch_id = p_ranch_id)
          and (p_species_ids is null or a.species_id = any(p_species_ids))
          and (p_breed_ids is null or a.breed_id = any(p_breed_ids))
          and (p_status_ids is null or a.status_id = any(p_status_ids))
          and (p_section_ids is null or a.section_id = any(p_section_ids))
          and (p_search is null or a.tag_number ilike '%' || p_search || '%' or a.name ilike '%' || p_search || '%')
        group by a.sex
      ) x
    ),
    'status', (
      select coalesce(jsonb_object_agg(x.status_id, x.cnt), '{}'::jsonb)
      from (
        select a.status_id, count(*) as cnt
        from v_animal_current a
        where (p_ranch_id is null or a.ranch_id = p_ranch_id)
          and (p_species_ids is null or a.species_id = any(p_species_ids))
          and (p_breed_ids is null or a.breed_id = any(p_breed_ids))
          and (p_sexes is null or a.sex = any(p_sexes))
          and (p_section_ids is null or a.section_id = any(p_section_ids))
          and (p_search is null or a.tag_number ilike '%' || p_search || '%' or a.name ilike '%' || p_search || '%')
        group by a.status_id
      ) x
    ),
    'section', (
      select coalesce(jsonb_object_agg(x.section_id, x.cnt), '{}'::jsonb)
      from (
        select a.section_id, count(*) as cnt
        from v_animal_current a
        where (p_ranch_id is null or a.ranch_id = p_ranch_id)
          and (p_species_ids is null or a.species_id = any(p_species_ids))
          and (p_breed_ids is null or a.breed_id = any(p_breed_ids))
          and (p_sexes is null or a.sex = any(p_sexes))
          and (p_status_ids is null or a.status_id = any(p_status_ids))
          and (p_search is null or a.tag_number ilike '%' || p_search || '%' or a.name ilike '%' || p_search || '%')
          and a.section_id is not null
        group by a.section_id
      ) x
    )
  );
$$;

grant execute on function get_animal_facet_counts to authenticated;
grant select on v_animal_current to authenticated;
