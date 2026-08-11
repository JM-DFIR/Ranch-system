-- ---------------------------------------------------------------------
-- seed.sql — LOCAL DEV / DEMO DATA ONLY. Never run against production.
--
-- Real ranch creation is a first-run action the owner performs himself
-- in the app (blueprint.md §0.6 #4) — the two ranches below are
-- generic placeholders for local development, never the client's real
-- ranch names.
--
-- A NOTE ON THE auth.users / auth.identities INSERTS BELOW: this is
-- the standard community-documented recipe for seeding working local
-- dev logins directly (bypassing the normal signup flow, which would
-- otherwise require an Edge Function or the Studio UI). It has not
-- been run against a live instance from this environment — this
-- machine has no Docker/Supabase CLI available to verify it (see the
-- Session 1 conversation). The exact auth.users column set has shifted
-- across GoTrue versions before; if `supabase db reset` errors on this
-- block specifically, that's the first place to look, not the rest of
-- the seed file.
-- ---------------------------------------------------------------------

do $$
declare
  v_org_id       uuid := '00000000-0000-0000-0000-000000000001';
  v_owner_id     uuid := '00000000-0000-0000-0000-000000000002';
  v_manager_id   uuid := '00000000-0000-0000-0000-000000000003';
  v_ranch_a_id   uuid := '00000000-0000-0000-0000-000000000010';
  v_ranch_b_id   uuid := '00000000-0000-0000-0000-000000000011';
  v_dev_password text := 'devpassword123'; -- local dev only
begin
  -- Organisation --------------------------------------------------------
  insert into organizations (id, name, timezone)
  values (v_org_id, 'Dev Org', 'Africa/Nairobi')
  on conflict (id) do nothing;

  -- auth.users + auth.identities — owner and manager -----------------------
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
  ) values
    ('00000000-0000-0000-0000-000000000000', v_owner_id, 'authenticated', 'authenticated',
     'owner@dev.local', extensions.crypt(v_dev_password, extensions.gen_salt('bf')),
     now(), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
     now(), now(), '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', v_manager_id, 'authenticated', 'authenticated',
     'manager@dev.local', extensions.crypt(v_dev_password, extensions.gen_salt('bf')),
     now(), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
     now(), now(), '', '', '', '')
  on conflict (id) do nothing;

  insert into auth.identities (
    id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
  ) values
    (gen_random_uuid(), v_owner_id, v_owner_id::text,
     jsonb_build_object('sub', v_owner_id::text, 'email', 'owner@dev.local'),
     'email', now(), now(), now()),
    (gen_random_uuid(), v_manager_id, v_manager_id::text,
     jsonb_build_object('sub', v_manager_id::text, 'email', 'manager@dev.local'),
     'email', now(), now(), now())
  on conflict do nothing;

  -- Profiles -------------------------------------------------------------
  -- organizations_create_settings (0003) has already fired by this point,
  -- so organization_settings for v_org_id exists.
  insert into profiles (id, org_id, full_name, email, role)
  values
    (v_owner_id, v_org_id, 'Dev Owner', 'owner@dev.local', 'owner'),
    (v_manager_id, v_org_id, 'Dev Manager', 'manager@dev.local', 'ranch_manager')
  on conflict (id) do nothing;

  -- Ranches — generic names only, per blueprint.md §0.6 #4 --------------
  insert into ranches (id, org_id, name, location, status, created_by)
  values
    (v_ranch_a_id, v_org_id, 'Ranch A', 'Dev fixture', 'active', v_owner_id),
    (v_ranch_b_id, v_org_id, 'Ranch B', 'Dev fixture', 'active', v_owner_id)
  on conflict (id) do nothing;

  insert into ranch_assignments (org_id, ranch_id, profile_id)
  values (v_org_id, v_ranch_b_id, v_manager_id)
  on conflict (ranch_id, profile_id) do nothing;

  -- Species — default_tag_prefix illustrates the client's real
  -- convention: goats "M1", "M2"…; cattle "MUX 1", "MUX 2"… -----------
  insert into species (org_id, name, default_gestation_days, default_tag_prefix, is_system)
  values
    (v_org_id, 'Cattle', 283, 'MUX ', true),
    (v_org_id, 'Goat', 150, 'M', true),
    (v_org_id, 'Sheep', 148, 'S', true),
    (v_org_id, 'Chicken', 21, 'C', true)
  on conflict (org_id, name) do nothing;

  -- Breeds — a handful common to Kenyan smallholder and ranch operations
  insert into breeds (org_id, species_id, name)
  select v_org_id, s.id, b.name
  from species s
  join (values
    ('Cattle', 'Boran'), ('Cattle', 'Sahiwal'), ('Cattle', 'Friesian'), ('Cattle', 'Ayrshire'),
    ('Goat', 'Galla'), ('Goat', 'Boer'), ('Goat', 'Toggenburg'),
    ('Sheep', 'Dorper'), ('Sheep', 'Red Maasai'),
    ('Chicken', 'Kienyeji'), ('Chicken', 'Kuroiler')
  ) as b(species_name, name) on b.species_name = s.name
  where s.org_id = v_org_id
  on conflict (org_id, species_id, name) do nothing;

  -- Animal statuses — the five from blueprint.md §2.2. Names are the
  -- contract record_death()/record_birth() (0017) look up by, so don't
  -- rename these without updating those functions.
  insert into animal_statuses (org_id, name, is_active_status, color_token, is_system, sort_order)
  values
    (v_org_id, 'Active', true, 'status-ok', true, 1),
    (v_org_id, 'Transferred', true, 'status-info', true, 2),
    (v_org_id, 'Deceased', false, 'status-neutral', true, 3),
    (v_org_id, 'Missing', false, 'status-warn', true, 4),
    (v_org_id, 'Sold', false, 'status-neutral', true, 5)
  on conflict (org_id, name) do nothing;

  -- Vaccines — starter catalogue relevant to Kenyan livestock ------------
  insert into vaccines (org_id, name, species_id, target_disease, default_interval_days)
  select v_org_id, v.name, s.id, v.target_disease, v.interval_days
  from (values
    ('FMD vaccine', 'Cattle', 'Foot-and-mouth disease', 180),
    ('Lumpy skin disease vaccine', 'Cattle', 'Lumpy skin disease', 365),
    ('CBPP vaccine', 'Cattle', 'Contagious bovine pleuropneumonia', 365),
    ('PPR vaccine', 'Goat', 'Peste des petits ruminants', 365),
    ('CCPP vaccine', 'Goat', 'Contagious caprine pleuropneumonia', 365),
    ('Newcastle disease vaccine', 'Chicken', 'Newcastle disease', 120)
  ) as v(name, species_name, target_disease, interval_days)
  left join species s on s.name = v.species_name and s.org_id = v_org_id;

  -- Medications ------------------------------------------------------------
  insert into medications (org_id, name, active_ingredient, default_withdrawal_days)
  values
    (v_org_id, 'Oxytetracycline LA', 'Oxytetracycline', 28),
    (v_org_id, 'Albendazole', 'Albendazole', 14),
    (v_org_id, 'Ivermectin', 'Ivermectin', 21),
    (v_org_id, 'Penicillin-Streptomycin', 'Penicillin, Streptomycin', 10);

  -- Illness types -------------------------------------------------------
  insert into illness_types (org_id, name, species_id)
  select v_org_id, i.name, s.id
  from (values
    ('East Coast fever', 'Cattle'), ('Mastitis', 'Cattle'), ('Foot rot', 'Cattle'),
    ('Pneumonia', 'Goat'), ('Bloat', 'Goat'),
    ('Coccidiosis', 'Chicken')
  ) as i(name, species_name)
  left join species s on s.name = i.species_name and s.org_id = v_org_id;

  -- Feed items -----------------------------------------------------------
  insert into feed_items (org_id, name, unit)
  values
    (v_org_id, 'Napier grass', 'kg'),
    (v_org_id, 'Dairy meal', 'kg'),
    (v_org_id, 'Mineral lick', 'kg'),
    (v_org_id, 'Hay', 'bales');

  -- Care activity types — the seed list from blueprint.md §2.2 ----------
  insert into care_activity_types (org_id, name)
  values
    (v_org_id, 'Deworming'),
    (v_org_id, 'Dipping/Spraying'),
    (v_org_id, 'Hoof trimming'),
    (v_org_id, 'Shearing'),
    (v_org_id, 'Castration'),
    (v_org_id, 'Weaning'),
    (v_org_id, 'Weighing');
end $$;
