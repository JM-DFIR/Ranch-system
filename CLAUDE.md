# LIMS — Livestock Inventory Management System — Project Context

You are working on a production livestock management system for a Kenyan
ranch owner with two properties. It is treated as a flagship build: the
quality bar is "a senior engineer would approve this in review," not
"it works on my machine."

Read this file fully before writing any code. It reflects `blueprint.md`
v3.0 — a full document sits at the repo root; if a request conflicts with
either, stop and say so rather than silently deviating. If you find a
genuine contradiction between this file and `blueprint.md`, `blueprint.md`
wins — tell the user rather than picking one silently.

## 1. What this product is

A multi-ranch livestock records system. Every animal — cow, goat, sheep,
or any other species the owner adds — has an individual digital record
that is created once and updated for the rest of its life. The system
replaces paper books.

Two roles:

- **Owner** — every ranch, every action, plus user management,
  reference catalogues, org settings and the audit log.
- **Ranch Manager** — the same recording abilities, restricted to
  assigned ranches. The difference is scope, not capability. Managers
  record deaths and transfers routinely.

The owner will enrol several hundred animals by hand, each with a
photograph, either (a) live in the field on a phone, outdoors, on rural
mobile signal, or (b) photographed through the day with the phone's own
camera app and entered later from a laptop. **Both paths are in scope —
Enrollment Mode (mobile, live) and Batch Enrollment (desktop, from a
photo batch) are two capture surfaces over the same underlying flow.**
Whichever he ends up preferring, this pair of flows is the highest-stakes
part of the product: it's his first real experience of the software, and
a bad first session is judged a failure regardless of how good the other
fifty-odd screens are.

## 2. Stack — fixed, do not substitute

- React 19 + TypeScript 5 (strict, `noUncheckedIndexedAccess`) + **Vite**. Not Next.js.
- TanStack Router (type-safe routes AND type-safe search params)
- TanStack Query (all server state)
- TanStack Table v8 (all registers, full manual mode — see §3 register notes)
- Tailwind CSS v4 + shadcn/ui (components vendored into `src/components/ui`)
- React Hook Form + **Zod 4** — pinned. Do not write v3-style Zod APIs
  (`message:` instead of `error:`, etc.) and do not let a dependency
  bump silently move the major version.
- Supabase: Postgres, Auth, RLS, Storage, Edge Functions, pg_cron
- Dexie (IndexedDB) — offline write queue only, kept conceptually
  separate from the TanStack Query cache persistence (also IndexedDB,
  but a different job — read cache vs. write queue, don't conflate them)
- vite-plugin-pwa (Workbox)
- Recharts, lucide-react, date-fns + @date-fns/tz
- Vitest, Playwright, pgTAP
- Deploy: Netlify. Migrations: Supabase CLI, SQL files in git.

## 3. Repository structure

```
src/
  app/                providers, router, root layout
  routes/             file-based routes (TanStack Router)
  features/           ranches/ animals/ enrollment/ health/ weights/
                      breeding/ movements/ mortality/ feeding/
                      reports/ admin/
    <feature>/
      api.ts          all Supabase queries + mutations for this feature
      schema.ts       Zod schemas
      components/
      hooks/
  components/ui/      vendored shadcn primitives — restyle freely
  components/patterns/ DataTable · PageHeader · StatCard · RecordDrawer
                       EmptyState · ConfirmDialog · FeatureGate
                       SyncIndicator · StatusBadge · AttentionBadge
  lib/
    supabase.ts       client singleton
    auth.ts           session, profile, role
    permissions.ts    can() helpers — mirrors RLS, never replaces it
    query-keys.ts     centralised TanStack Query key factory
    offline/          dexie schema, write queue, conflict handling, sync worker
    media/            image resize + upload pipeline (shared by Enrollment
                      Mode and Batch Enrollment — one pipeline, two callers)
    format.ts         dates, numbers, units
  types/
    database.generated.ts   — supabase gen types, never hand-edited
  styles/
    tokens.css
    globals.css
supabase/
  migrations/         NNNN_description.sql
  seed.sql            generic dev/demo data ONLY — never the client's real
                      ranch names. Real ranches are created by the owner
                      himself, first-run, via the app (see §6).
  functions/          Deno edge functions
  tests/              pgTAP RLS suites
```

**Feature-sliced, not layer-sliced.** Everything about breeding lives in
`features/breeding/`. Never create `src/components/BreedingForm.tsx`.

**Register note:** the animal register uses TanStack Table in full manual
mode with server-side pagination as the _primary_ mechanism (default page
size 50, selectable 25/50/100/200). Row virtualization only engages when
the selected page size exceeds 100 — it protects the "dense view" option,
it does not run alongside a normal 50-row page. Don't build both as if
they're independent features; they're one feature with a threshold.

## 4. Design tokens — the single source of truth

Defined in `src/styles/tokens.css`. **Never hardcode a hex value, a
font family, or a pixel radius anywhere else in the codebase.** If you
need a value that does not exist, add it to tokens.css and say so.

### Palette

Acacia (primary — rangeland green):
`50 #F0F5F2` `100 #DCE8E2` `200 #B9D1C5` `300 #8DB4A2` `400 #5C9179`
`500 #3D7C61` `600 #2F6B54` `700 #265545` `800 #1F4638` `900 #1B3A2F`
`950 #0F221B`

Ochre (single accent — used sparingly):
`50 #FDF6EC` `100 #F9E8CE` `200 #F2CE9A` `300 #E7AE60` `400 #D89138`
`500 #C2761E` `600 #A25C16` `700 #7F4515` `800 #663717` `900 #552F16`

Bone (warm neutrals — surfaces and text):
`50 #FAF8F4` `100 #F1EDE6` `200 #E2DCD2` `300 #CFC7B9` `400 #ADA396`
`500 #8A8175` `600 #6B655C` `700 #514C45` `800 #38342F` `900 #1A1815`

Semantic — **functional only, never decorative**:
`--ok #2F6B54` · `--warn #C2761E` · `--critical #A63A2B`
`--info #2C5D7C` · `--muted #6B655C`

Red means something is wrong. It never means "look here."

### Typography — three roles

- **Display / headings — `Bricolage Grotesque`**, weights 500/600.
  Slightly condensed; handles long ranch and animal names in headers.
- **Body / UI — `Inter`**, weights 400/500/600. `font-optical-sizing: auto`.
- **Data — `IBM Plex Mono`**, weight 400/500. **Every tag number, count,
  date, weight, dosage and ID.** This is not decoration: 500 tag numbers
  in a proportional face do not align and cannot be scanned. All numeric
  table columns use `font-variant-numeric: tabular-nums`.

Scale: 12 / 13 / 14 / 16 / 20 / 26 / 34 px.

### Layout

- 8px spacing grid. Use Tailwind's scale; never arbitrary values.
- Sidebar 260px, collapses to 64px icon rail.
- Content max-width 1440px; registers go full-bleed.
- Radius: cards 8px, inputs 6px, badges 4px. Nothing is a pill.
- Elevation via border + background shift. Shadows **only** on drawers,
  popovers and dropdowns.

### Motion

150ms ease-out on state change, 220ms on drawer entry. Nothing else
moves. `prefers-reduced-motion: reduce` must disable all of it.

### The signature element

The **Animal Timeline** on the animal profile — a single vertical spine
carrying every event in that animal's life, each event type with its own
marker. This is where the visual boldness is spent. Everything else in
the product stays quiet and disciplined.

## 5. Interface copy rules

Words are design material. Follow these exactly.

- **Plain language, never system language.** "Moved to Kilifi Ranch",
  not "Location entity updated". "Recorded a vaccination", not
  "Vaccination event persisted".
- **Active voice, and the button names its own outcome.** A button
  labelled `Record death` produces a toast reading `Death recorded`.
  Never `Submit`, never `Success!`.
- **Sentence case everywhere.** Not Title Case.
- **Errors explain what happened and what to do.** They do not apologise
  and they are never vague.
- **Empty states are invitations.** Every empty register explains what
  belongs there and offers the action that fills it. Never "No data".
- Confirm dialogs name the specific record: "Record the death of
  goat GP-0447?" — not "Are you sure?".

## 6. Database rules

- `org_id` on every business table. Multi-tenant from migration one.
- **UUIDv7 primary keys, generated client-side.** Offline creation
  depends on this — but note it only prevents _record_-level collisions.
  A business-key collision (two people claiming the same `tag_number`
  while both offline) is still possible and has its own explicit
  handling — see §7's sync-conflict rule.
- **Soft delete only.** `deleted_at timestamptz`. No hard DELETE exists
  anywhere in the application. Deceased animals leave active counts via
  status, and remain fully browsable.
- Audit columns on every table: `created_at`, `updated_at`,
  `created_by`, `updated_by` (trigger-maintained, **but the trigger only
  fills these if `NULL`** — writes relayed through an Edge Function under
  `service_role` must stamp the real author into the payload themselves,
  since there is no `auth.uid()` to fall back on at replay time).
- **RLS enabled on every table, default deny.** Then explicit policies.
- **Index every column referenced in an RLS policy.** No exceptions.
  Missing policy indexes are the top Supabase performance killer.
- Lookup tables, never Postgres enums, for anything the owner can
  extend: species, breeds, statuses, vaccines, medications, illness
  types, feed items, care activity types.
- **Tag numbers are freeform, always.** `species.default_tag_prefix`
  and the `tag_sequences` counter table exist purely to _suggest_ the
  next tag during enrollment (goats run `M1`, `M2`…; cattle run
  `MUX 1`, `MUX 2`…, per the client's existing convention) — never as a
  format constraint. A purchased animal may arrive with a tag that fits
  no pattern at all, and the field must accept it.
- The "requires attention" engine is **twelve rules**, not eleven —
  don't drop the "no health record logged in `stale_health_days` (default 120) days" rule if you're reconstructing it from memory. It lives in
  `v_animals_requiring_attention` (one row per animal per reason — drives
  the Attention Queue) and is separately aggregated in
  `v_animal_attention_summary` (one row per animal, worst severity — drives
  the register badge column and the dashboard counterpoint metric). Do not
  join the register against the per-reason view directly; it will
  duplicate rows.
- `dam_id`/`sire_id` writes on `animals` are guarded by a trigger that
  rejects a cycle (the proposed parent already being a descendant),
  bounded to depth 20 via `get_descendants`. Don't remove this thinking
  it's redundant with the depth-capped recursive CTEs — the CTE cap stops
  an infinite loop, it doesn't stop a wrong tree from being saved.
- Aggregation happens in Postgres views. Never fetch 5,000 rows to
  count them in JavaScript.
- Migrations are files in `supabase/migrations/`, applied via CLI.
  **Never make schema changes in the Supabase dashboard.**
- `seed.sql` is generic dev/demo data only. Real ranch creation is a
  first-run action the owner performs in the app himself — don't design
  around a fixed, pre-known set of ranch names.

## 7. Security rules

- `service_role` key exists only inside Edge Functions. If it ever
  appears in anything under `src/`, that is a critical bug — stop and
  raise it.
- `permissions.ts` mirrors RLS for UI affordances. It is a convenience
  layer, never the enforcement layer. RLS is the enforcement layer.
- Role and org_id are read from JWT `app_metadata`.
- Signed URLs for all Storage reads. No public buckets.
- **Movements: access is required to the animal's CURRENT ranch, and
  nothing else.** `record_movement` is a SECURITY DEFINER RPC that
  resolves the animal's `ranch_id` server-side from the `animals` table
  — it never trusts a client-supplied `from_ranch_id`. There is
  deliberately **no** access check on the destination ranch; it's a
  pointer, not a read grant. If you ever see or write a policy that
  checks `has_ranch_access(from) OR has_ranch_access(to)`, that is the
  exact hole this project already found and fixed once — a manager with
  no access to an animal's real ranch could otherwise claim it into his
  own by lying about the destination. Do not reintroduce the OR.
- **Profiles: row access is `id = auth.uid()` OR `is_owner()`, but
  `role`/`org_id` changes are trigger-guarded, not policy-guarded.**
  RLS predicates can't compare OLD vs. NEW column-by-column, so any user
  may update their own `full_name`/`phone`/`avatar_url` via the standard
  self-update policy, while a `BEFORE UPDATE` trigger
  (`prevent_self_role_escalation`) rejects a change to `role` or `org_id`
  unless the actor `is_owner()`. `last_seen_at` is written via a
  dedicated `touch_presence()` RPC, not a raw column update. Do not
  relax `profiles` to a blanket `is_owner()`-only policy — that was the
  v2.0 draft and it silently blocked managers from editing their own
  contact details.
- **No hard DELETE policy on any business table.** Deletion is
  `update … set deleted_at`.
- pgTAP must prove, at minimum: a manager cannot read an unassigned
  ranch's animals; a manager cannot escalate their own role; cross-org
  reads return zero rows; soft-deleted rows are invisible; a manager
  _can_ transfer an animal out to a ranch they don't manage; **and** a
  manager _cannot_ record a movement claiming an animal whose current
  ranch they have no access to, even when the destination is their own
  ranch. That last one is the negative test for the hole above — it is
  not optional, it's the whole point of having found the hole.

## 8. Offline sync — what "handled" actually means here

- Exactly five queued operations: `create_animal`, `attach_photo`,
  `create_health_event`, `create_weight`, `create_movement`. Everything
  else requires connectivity and says so.
- Record-level conflicts: last write wins on server timestamp. Fine at
  this scale (≤5 users, mostly distinct animals) — don't build more than
  this for record-level conflicts.
- **Business-key conflicts are a different case and need explicit
  handling.** Two people enrolling offline can legitimately both claim
  `tag_number = "M47"`. UUIDv7 keys don't prevent this — it's a
  `unique_violation` on `(org_id, tag_number)`, not a record collision.
  The sync worker must catch it, mark that queue entry `status =
'conflict'` (never silently retried forever, never silently dropped),
  and the sync panel must surface it by tag number with a
  rename-and-resync action. This is the specific failure mode that could
  corrupt the client's very first enrollment day if it's skipped.
- Tag auto-increment offline: when online, suggestions come from the
  atomic `next_tag_number(org_id, prefix)` RPC. When offline, the client
  tracks its own last-used number per prefix locally and increments
  without a round trip — the conflict handling above is what reconciles
  this on reconnect, same as any other offline tag collision. Don't try
  to build a second, separate offline-numbering scheme; reuse the
  existing conflict path.

## 9. Money is built but hidden

Nullable `cost` columns exist on treatments, vet visits, feeding records
and care activities. **Nothing writes them and nothing displays them in
v1.** Every money-bearing field, column and report must be wrapped in
`<FeatureGate flag="finance">`, which renders null while the flag is off.
This is deliberate: the client wants it switchable later without a
refactor. Do not remove the columns and do not surface them.

The `reminders` table ships the same way — schema exists from Session 1,
nothing reads or writes it until the SMS/email reminders feature is
actually scheduled post-v1. Same shape as finance, lower stakes.

## 10. Definition of done — every task

A task is not complete until all of these pass:

1. `pnpm typecheck` — zero errors. No `any`. No `@ts-ignore`.
2. `pnpm lint` — zero errors.
3. `pnpm build` — succeeds.
4. Loading, empty, and error states exist for every data-fetching view.
5. Keyboard accessible: visible focus ring, logical tab order, Escape
   closes overlays.
6. Responsive from 390px to 1920px. Enrollment and Batch Enrollment
   screens are designed at their real target width first (390px for
   Enrollment Mode, desktop widths for Batch Enrollment) — don't design
   Batch Enrollment mobile-first, it's a laptop-grid flow by definition.
7. `prefers-reduced-motion` respected.
8. No hardcoded colours, fonts or spacing outside tokens.css.
9. New tables have RLS policies AND a pgTAP test proving isolation. If
   the table is `movements` or `profiles`, the test must specifically
   cover the two negative cases in §7, not just the positive path.

## 11. Never do these

- Never use Next.js patterns, server components, or `next/*` imports.
- Never `localStorage` or `sessionStorage` for domain data — Dexie only.
- Never hard DELETE.
- Never hardcode a hex, font-family, or px radius outside tokens.css.
- Never fetch a whole table to filter or count it client-side.
- Never put the service_role key in client code.
- Never write a movements policy or RPC that grants access based on the
  destination ranch alone, or trusts a client-supplied `from_ranch_id`.
- Never apply a blanket `is_owner()`-only policy to `profiles`.
- Never let a Zod major-version bump happen silently — it's pinned to 4.
- Never treat an offline `unique_violation` on `tag_number` as a bug to
  retry away — it's an expected conflict with its own UI path.
- Never invent a schema field. If something is missing from
  `blueprint.md`, stop and ask.
- Never write a migration that drops or renames a column without
  flagging it explicitly first.
- Never leave a `TODO` without an accompanying question to the user.

## 12. Working style

- Small, focused commits with conventional messages
  (`feat(animals): server-side register filtering`).
- Before editing an existing file, read it fully.
- After a task, state plainly: what you built, what you skipped, what
  you assumed, and what you need from me.
- If you are more than 30% unsure about an approach, stop and ask
  rather than building the wrong thing well.
