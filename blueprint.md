# LIMS — Livestock Inventory Management System
## Technical Blueprint v3.0 — consolidated, review-corrected

**Prepared by Joe · Nairobi**
**Supersedes:** Ranch-System-Technical-Blueprint v2.0 and the findings discussion that followed it.
**Status:** every decision below is either client-confirmed or an engineering call made and recorded here. Section 8 lists the small number of things that still need a real-world answer from the client. Nothing else is blocked — build against this document.

> **What changed from v2.0.** v2.0 closed out the client's five open questions (§12–15 reconstruction, pricing, weights, no-migration, role scope). This version closes out a second round: a critical review of v2.0 itself found one real security hole, two internal contradictions, and several gaps that would have surfaced mid-build instead of now. Every finding was either fixed in the model below or deliberately deferred with a reason. See the decision ledger in §0.5.

---

# Part 0 — Foundations

## 0.1 What this system is

A multi-ranch livestock records system for a Kenyan owner with two properties, replacing paper exercise books and herder memory. Every animal — cow, goat, sheep, or any species the owner adds — gets one individual digital record, created once and updated for the rest of its life: origin, parents, every vaccination, treatment, illness, vet visit, weight, movement, breeding event, and eventual death. Nothing is ever deleted. Five users at most: the owner and up to four family members as ranch managers.

Two roles, differing in **scope, not capability**. A Ranch Manager can do everything the Owner can do — including recording deaths and transfers — but only on ranches assigned to them. The Owner has the same abilities everywhere, plus user management, reference catalogues, org settings, and the audit log.

## 0.2 The client's document was incomplete, and the reconstruction stands

The client's source PRD jumps from §11 to §16; §12–15 don't exist in the file he sent, and §16 is truncated. The reconstruction below was confirmed by the client and is not revisited:

| Missing § | Reconstructed as | Evidence |
|---|---|---|
| §12 | Health Management | vaccinations, treatments, illnesses, vet visits referenced in objectives, dashboard, reports |
| §13 | Breeding & Offspring | breeding/offspring referenced in objectives, dashboard, reports |
| §14 | Feeding & General Care | referenced in objectives |
| §15 | User Management & Access Control | referenced in role table and visibility rules |
| §16 | Search & Filtering | truncated to one bullet; rest inferred from §6 |

## 0.3 Nine signals that shape the architecture (unchanged from v2.0, still load-bearing)

1. **Individual-record-first.** Every animal has its own record, always — bulk data entry is solved with multi-select bulk actions (a UX layer), never with batch/mob records as the underlying model.
2. **Species is open-ended.** Species and breed are owner-extensible lookup tables, never hardcoded enums.
3. **No money, deliberately.** Zero prices, sales, costs, or profit in v1. Schema carries nullable cost columns and a feature flag so finance can switch on later without a rewrite; nothing renders it.
4. **Desktop-first for management, field-first for enrollment.** Both must work well — they are different jobs by different people at different times.
5. **Nothing is ever deleted.** Soft-delete and status-driven lifecycle throughout. A dead animal leaves active counts but stays fully browsable.
6. **Statuses are configurable**, not an enum — a table with an `is_active_status` flag driving live-inventory counts.
7. **"Requires attention" is computed**, never a field anyone sets. Overdue vaccination, unresolved illness, pending follow-up, and (as of this version — see §0.5) stale health record are all rules, not data entry.
8. **Two roles, ranch-scoped, many-to-many assignment.** A manager may hold several ranches.
9. **Plain language, confirmed actions.** No jargon, no "entity persisted." Destructive or significant actions confirm and toast.

## 0.4 Additions beyond the letter of the PRD (unchanged, still in scope)

- `anitrac_ain` on every animal — one nullable column against Kenya's national Animal Identification and Traceability system, costs nothing now, connects later.
- Audit log — the PRD asks for confirmation of changes; an owner overseeing managers needs to know *who* changed *what*.
- `withdrawal_until` on treatments, with a visible badge — protects the client as traceability becomes national.
- Weight tracking — confirmed in scope, designed in the client's own idiom (§2.4).
- Enrollment Mode — the direct answer to §0.5 below.

## 0.5 The decision that reshaped the architecture, and everything decided since

The client's answer to "how much history are we migrating" was **none**. He starts fresh: every animal enrolled by hand, one at a time, with a photograph, on a phone, outdoors, on rural signal, over several hundred repetitions. That is not a data migration — it is hundreds of consecutive create-with-photo operations, and it is the very first experience he will have of the software. If it is slow, or loses a record when the signal drops, the project is judged a failure in week one regardless of how good the other fifty screens are. Three consequences followed in v2.0 (installable PWA with a scoped offline write queue, a dedicated Enrollment Mode, a client-side image pipeline) and remain unchanged.

**What's new in this version is the decision ledger below** — every item a subsequent critical review raised, closed out one at a time. Nothing here is provisional; build against the "v3.0 decision" column.

| # | Topic | Where it lived before | v3.0 decision | Why |
|---|---|---|---|---|
| 1 | §12–15 reconstruction, pricing, weights, no-migration, role scope | v2.0 "Resolved with client" | **Unchanged.** Client-confirmed, outranks everything, not revisited. | — |
| 2 | Movements RLS policy | v2.0 §2.7, "asymmetric OR" | **Replaced.** Access required to the animal's *current* ranch only (server-verified against the `animals` row, never trusted from client input). No access check on the destination ranch at all. | The OR-of-either-endpoint design let a manager with *no* access to an animal's actual ranch write a movement claiming it arrived at *his* ranch, then have the RPC update `animals.ranch_id` — a full read-isolation bypass. The fix is simpler than what it replaces, not more complex, and still permits the one legitimate case cited (shipping an animal to an unmanaged ranch), because the shipping manager has access to the source by definition. See §3.3. |
| 3 | `profiles` RLS | v2.0 §2.7, blanket `is_owner()` | **Carved out.** Any user may update their own row's `full_name`, `phone`, `avatar_url`; `last_seen_at` is written via a dedicated RPC, not a raw update. `role` and `org_id` remain owner-only, enforced by trigger (RLS is row-level, it cannot itself distinguish which columns changed). | As specified, no manager could ever edit their own phone number, and `last_seen_at` had no writer. A blanket owner-only policy on a table that also carries self-service fields was a gap, not a deliberate restriction. |
| 4 | "Requires attention" rule count | v2.0 §0.3 said 11 rules in prose in one place, the seed table in §2.6 listed 11 but omitted "no health record in N days" that the prose elsewhere implied | **12 rules.** Added: *no health record logged in `organization_settings.stale_health_days` (default 120 — see §0.6 #7) days* → severity `info`. | Internal contradiction between prose and table; resolved by adding the rule rather than deleting the prose reference, since a genuinely quiet animal is exactly the kind of thing an owner wants surfaced. |
| 5 | Attention view shape | v2.0 §2.2, one view | **Split in two.** `v_animals_requiring_attention` keeps its one-row-per-reason shape for the Attention Queue screen. New `v_animal_attention_summary` returns one row per animal (worst severity, reason count) for the register column and dashboard badge. | The register needs exactly one badge per animal; joining a multi-row-per-animal view into a paginated table either duplicates rows or silently drops reasons. Nobody had written the aggregation — now it's a named view instead of an improvisation mid-build. |
| 6 | Screen count | v2.0 Part 3.3 header said 58, Part 6 said 47 | **58**, confirmed by re-tallying the itemized breakdown (5+4+2+4+6+4+8+3+5+2+2+2+2+5+4 = 58). | Arithmetic error in one reference, not a scope change. Fixed so it doesn't mis-scope the design-generation batching. |
| 7 | Offline tag-number collisions | Undefined in v2.0 | **Explicit conflict path.** The sync worker catches `unique_violation` on `(org_id, tag_number)` replay, marks that queue entry `status = 'conflict'` (never silently retried forever, never silently dropped), and the Sync panel surfaces it by name with a rename-and-resync action. | UUIDv7 keys prevent two *records* from colliding but do nothing for two *people* offline simultaneously claiming the same tag — rare with 5 users, but catastrophic on day one of a herd-wide enrollment if unhandled. |
| 8 | `created_by`/`updated_by` on synced writes | Implied trigger-only in v2.0 | **Explicit in the queue payload.** The audit trigger sets `created_by`/`updated_by` **only if `NULL`**; the client stamps the real author (the enrolling user, from their last authenticated session) into every queued write before it's replayed. | Records synced via an Edge Function running as `service_role` have no `auth.uid()` at replay time — a pure trigger default would attribute every offline record to nobody or to a service account. |
| 9 | Lineage cycle guard | Absent in v2.0 | **Added.** A trigger on `animals` rejects a `dam_id`/`sire_id` write if the proposed parent is already a descendant of the animal (bounded traversal, depth 20). | Depth-capping the recursive CTE stops an infinite loop but not a silently wrong family tree from a data-entry mistake. Writes to `dam_id`/`sire_id` are rare (birth-time or a manual correction), so the check is cheap where it matters. |
| 10 | Register pagination vs. virtualization | Both specified in v2.0 without reconciling them | **Pagination is primary.** Default page size 50 (25/50/100/200 selectable). Row virtualization only engages when the selected page size exceeds 100 — i.e., it protects the "dense view" option, and is inert at normal page sizes. | The two were specified as if compatible by default; they aren't — pagination controls and full-table virtualization are two different patterns. This reconciles them instead of leaving it to be improvised in Session 3. |
| 11 | Zod version | Unpinned in v2.0 | **Pinned to Zod 4** in the stack table and `CLAUDE.md`. | Zod 4 changed its error-customization API from v3. An eight-session build against an unpinned major version is exactly the drift Part 1 of the prompt pack warns about. |
| 12 | `reminders` table | Added implicitly in v2.0 schema, feature deferred to backlog | **Kept, explicitly inert.** Table ships in Session 1 alongside the finance columns it mirrors in spirit; nothing reads or writes it until the SMS/email reminders feature is actually scheduled. Flagged here so it's a deliberate yes, not a default one. | Consistent with the finance-columns precedent, but that precedent had explicit client sign-off and this table didn't — recording that difference honestly rather than pretending symmetry. |
| 13 | Enrollment Mode field test timing | v2.0 suggested testing on the client's phone after all of M0–M7 | **Pulled forward.** A thin offline slice — camera → tag → save → queue, no auto-increment, no "add more detail," no session summary — is built and field-tested on the client's actual phone, at an actual ranch, inside M2 (see §7), before the rest of Enrollment Mode is polished. | The entire offline architecture (scoped queue, last-write-wins, image compression targets) is a bet made once, on paper. Finding out it's wrong after building the polished version costs a rebuild; finding out before costs a few days. This is the single highest-value resequencing in the plan. |

Everything else from v2.0 — the schema shape, the security pattern, the design tokens, the module list, the stack — was reviewed and held. Where the review agreed with a v2.0 call (Vite over Next.js, Dexie over a full sync engine, shadcn vendored, TanStack Table manual mode, recursive-CTE lineage, polymorphic feeding/care scoping, 50,000-row register performance), it is not relitigated below; it is simply restated as final.

## 0.6 Second round — the client's answers to §8, and what they change

| # | Question | Client's answer | v3.0 decision |
|---|---|---|---|
| 1 | Tag numbering convention | Already in real use, per species: goats `M1`, `M2`, `M3`…; cattle `MUX 1`, `MUX 2`… | **Prefix is a per-species default, not a global scheme.** `species.default_tag_prefix` (nullable text) pre-fills Enrollment Mode's prefix field when that species is selected — owner-editable, and stored exactly as typed (no forced separator or zero-padding, since the confirmed real examples use neither). A new `tag_sequences` table (`org_id, prefix, next_number`) makes "next number for this prefix" atomic and reusable by both live enrollment and the Tag Range Generator. **`tag_number` itself stays a single freeform text column** — the prefix/sequence system is an entry-assist layered on top, never a constraint, because an animal bought in from elsewhere may arrive with a tag that fits no pattern at all. See §2.4, §2.2. |
| 2 | Which phone / how to enroll | Either: use whatever Android or iOS device he already has, **or** photograph animals through the day with the phone's own camera and do the actual record-entry later from a laptop | **Both paths are now in scope, not one chosen over the other.** Live mobile Enrollment Mode (as designed) remains primary. A second flow — **Batch Enrollment from Photos** — is added: upload a batch of photos taken earlier (any camera app), then work through them on a desktop-sized grid filling the same four identity fields per photo. It reuses the same image pipeline, the same `create_animal` queue operation, and the same duplicate-tag checking; it is a different capture surface, not a different data path. This is a genuine hedge, not scope creep — if live mobile capture proves clunky in the field test, he already has a working alternative that doesn't depend on it. Added as a 59th screen — see §4.2. |
| 3 | Storage cost (Supabase Pro past ~5,000 photographed animals) | **Confirmed — yes.** | Closed. No design change; this was a cost sign-off, not an architecture question. |
| 4 | Ranch names and count at launch | Owner should be able to create and name ranches himself, with full ranch capabilities from day one — not something we seed for him | **Confirmed as already the correct design** — `ranches` was always owner-writable (§2.2, §3), and the first-run onboarding checklist (§7, M5) already leads with "create your first ranch." What changes is intent, not schema: `seed.sql` carries only generic dev/demo ranch data, never the client's real ranch names, and real ranch setup is explicitly a first-run step the owner performs himself, not a launch-day data load. |
| 5 | Does a manager need read-only visibility into other managers' ranches? | **Not answered yet.** | Still open — current design (§3) assumes strict isolation. Carried forward as the sole remaining item in §8. |
| 6 | `reminders` table — build now or hold? | "Choose the best option for us" | **Build now, ship inert**, as v2.0 already leaned toward (decision ledger #12). Reasoning, made explicit since the call is now fully ours: the marginal cost is one small migration file with no consumer for a few months; the alternative cost is a second migration plus a fresh design pass when the SMS feature is eventually scheduled. Same shape as the finance precedent, at lower stakes. |
| 7 | `stale_health_days` default | "Same for this matter, which is the best approach?" | **Changed from 90 to 120.** A 90-day default sits right on top of the most common routine touch cadence for Kenyan cattle/goats (quarterly deworming) — an animal wormed on day 0 would be flagged as "quiet" on day 91, one day before its next scheduled routine touch, which reads as a false alarm rather than a useful signal. 120 days clears a full quarterly cycle with margin, so the rule only fires for animals that are genuinely going unrecorded, not ones on a normal quarterly rhythm. Still owner-configurable per `organization_settings.stale_health_days`. Updated in §2.7. |

---

# Part 1 — Technology stack

Supabase is fixed. Everything else is chosen to serve it, and was re-argued during review — no substitutions survived the argument.

| Layer | Choice | Why this and not the alternative |
|---|---|---|
| **Language** | TypeScript 5.x (strict, `noUncheckedIndexedAccess`) | End-to-end type safety from Postgres schema to React props via generated types. |
| **Framework** | React 19 + **Vite** | Not Next.js. Every screen is behind auth; RLS already enforces authorization, so a server layer would duplicate it for zero benefit. A Vite SPA is simpler, faster to build, deploys as static files. (TanStack Start exists as a later SSR path if ever needed — no reason to want it here.) |
| **Routing** | TanStack Router | Type-safe routes and type-safe search params — how filters become shareable URLs. |
| **Server state** | TanStack Query | Caching, background refetch, optimistic updates, single invalidation point. |
| **Tables** | TanStack Table v8, **full manual mode** | `manualSorting`/`manualFiltering`/`manualPagination` against Postgres. Pagination is primary (default page size 50); virtualization engages only above page size 100 — see decision ledger #10. |
| **UI** | Tailwind CSS v4 + **shadcn/ui**, vendored | Ours to restyle completely — this is what keeps the product from reading as a template. |
| **Forms** | React Hook Form + **Zod 4** (pinned) | One Zod schema per entity, reused for the form, the API boundary, and the CSV importer. |
| **Charts** | Recharts | Sufficient, composable, small. |
| **Icons** | Lucide | Consistent, tree-shakeable. |
| **Dates** | date-fns + `@date-fns/tz` | Africa/Nairobi throughout. Store UTC, render local. |
| **PWA** | `vite-plugin-pwa` (Workbox) | Installable, app-shell precached, offline-capable routes. |
| **Offline queue** | **Dexie** (IndexedDB) | Five queued operations plus persisted query cache — deliberately not a full local-first sync engine (PowerSync, ElectricSQL, etc.). Two users editing distinct animals makes genuine write conflicts rare enough that the 80/20 point sits here. Keep the read-cache (TanStack Query persistence) and the write-queue (Dexie) conceptually distinct — they solve different problems and are easy to conflate mid-build. |
| **Image pipeline** | `browser-image-compression` + Canvas/WebP | Client-side resize before upload — non-negotiable, see §0.5's field-test decision. |
| **Database** | **Supabase Postgres** | Fixed. Plus RLS, Storage, Auth, Edge Functions, `pg_cron`. |
| **Migrations** | Supabase CLI, SQL files in git | Every schema change reviewed and versioned. No dashboard clicking. |
| **Files** | Supabase Storage | Photos, covers, documents. Signed URLs, org-scoped buckets, no public buckets. |
| **Scheduled jobs** | `pg_cron` + Edge Function | Nightly recompute of due-date flags; optional future reminders. |
| **Errors** | Sentry | Source-mapped, release-tagged. |
| **Tests** | Vitest (unit) · Playwright (E2E) · **pgTAP (RLS)** | The pgTAP suite is the difference between "we wrote policies" and "we proved a manager cannot read another ranch" — see §3.5 for the specific negative test this review added. |
| **Hosting** | Netlify | Static SPA, branch previews. |
| **CI** | GitHub Actions | Typecheck → lint → unit → build → migration dry-run → E2E on preview. |

## 1.1 Repository layout

```
lims/
├─ supabase/
│  ├─ migrations/           0001_extensions.sql … 0018_views.sql
│  ├─ seed.sql
│  ├─ functions/            edge functions (Deno)
│  │  ├─ record-movement/   transactional transfer, server-verified source ranch
│  │  ├─ record-birth/      creates offspring + links lineage
│  │  ├─ record-death/
│  │  ├─ bulk-health-event/ one action → N records
│  │  ├─ bulk-weight-event/
│  │  └─ sync-relay/        replays queued offline writes, stamps created_by explicitly
│  └─ tests/                pgTAP RLS suites
├─ src/
│  ├─ app/                  providers, router, shell
│  ├─ routes/               file-based routes (TanStack Router)
│  ├─ features/             ranches/ animals/ enrollment/ health/
│  │                        weights/ breeding/ movements/ mortality/
│  │                        feeding/ reports/ admin/
│  │     └─ <feature>/      api.ts · schema.ts · components/ · hooks/
│  ├─ components/ui/        vendored shadcn primitives
│  ├─ components/patterns/  DataTable, PageHeader, StatCard,
│  │                        RecordDrawer, EmptyState, ConfirmDialog,
│  │                        FeatureGate, SyncIndicator
│  ├─ lib/                  supabase client, auth, permissions,
│  │                        formatters, query keys
│  │  ├─ offline/           dexie schema, write queue, conflict handling, sync worker
│  │  └─ media/              image resize + upload pipeline
│  ├─ types/                database.generated.ts
│  └─ styles/                tokens.css, globals.css
├─ e2e/
└─ docs/                    ADRs, schema diagram, runbook
```

Feature-sliced, not layer-sliced. Everything about breeding lives in `features/breeding/`. Never `src/components/BreedingForm.tsx`.

---

# Part 2 — Data model

## 2.1 Design rules (non-negotiable)

1. `org_id` on every business table. Multi-tenant from migration one.
2. **UUIDv7 primary keys**, generated client-side.
3. **Soft delete everywhere**: `deleted_at timestamptz`. Nothing is ever `DELETE`d.
4. `created_at`, `updated_at`, `created_by`, `updated_by` on every table, trigger-maintained — **trigger only fills these if `NULL`**, so an offline-relayed write can stamp the real author explicitly (decision #8).
5. **RLS enabled on every table**, default deny, then explicit policies.
6. **Every column referenced in an RLS policy is indexed.**
7. **Lookup tables, not enums**, for anything the owner might extend.
8. **Money columns exist, nullable, gated.** Built in code, absent from UI (§2.6).
9. **Primary keys generated client-side (UUIDv7)** so offline creation is safe from *record* collisions — it does not, on its own, prevent *business-key* collisions (tag numbers); see §2.7.4.

## 2.2 Schema

### Identity & tenancy
```
organizations        id, name, timezone, created_at
profiles             id → auth.users, org_id, full_name, phone, email,
                     avatar_url, role ('owner'|'ranch_manager'),
                     is_active, last_seen_at
invitations          id, org_id, email, role, token, expires_at,
                     accepted_at, invited_by
```

### Ranches
```
ranches              id, org_id, name, location, description,
                     size_acres, contact_name, contact_phone,
                     contact_email, status ('active'|'inactive'),
                     cover_image_path, notes, deleted_at
ranch_assignments    ranch_id, profile_id, assigned_at   — many-to-many
ranch_sections       id, ranch_id, name, description, sort_order
```

### Reference data (org-scoped, owner-editable)
```
species              id, org_id, name, icon_key,
                     default_gestation_days, default_tag_prefix?, is_system
breeds               id, org_id, species_id, name
animal_statuses      id, org_id, name, is_active_status, color_token,
                     is_system, sort_order
                     seed: Active(true) Transferred(true)
                           Deceased(false) Missing(false) Sold(false)
veterinarians        id, org_id, name, practice, phone, email, notes
vaccines             id, org_id, name, species_id?, target_disease,
                     default_interval_days, notes
medications          id, org_id, name, active_ingredient,
                     default_withdrawal_days, notes
illness_types        id, org_id, name, species_id?, notes
feed_items           id, org_id, name, unit, notes
care_activity_types  id, org_id, name
                     seed: Deworming, Dipping/Spraying, Hoof trimming,
                           Shearing, Castration, Weaning, Weighing
tag_sequences        org_id, prefix, next_number int
                     UNIQUE (org_id, prefix)
                     — backs the atomic next_tag_number(org_id, prefix)
                       RPC used by live Enrollment Mode, Batch Enrollment
                       and the Tag Range Generator. Not a constraint on
                       tag_number itself — see §2.4.
```

### Animals — the spine
```
animals
  id, org_id, ranch_id, section_id?
  tag_number                    UNIQUE (org_id, tag_number) WHERE deleted_at IS NULL
  name?
  species_id, breed_id?
  sex ('male'|'female'|'unknown')
  color?
  date_of_birth?, dob_is_estimated boolean
  acquisition_type ('born_on_ranch'|'purchased'|'gift'|'unknown')
  acquisition_date
  dam_id?  → animals.id
  sire_id? → animals.id
  status_id → animal_statuses
  photo_path?
  anitrac_ain?                  15-digit national identity
  notes?
  audit columns, deleted_at
```
Indexes: `(org_id, ranch_id)`, `(org_id, species_id)`, `(org_id, status_id)`, `(org_id, tag_number)`, `dam_id`, `sire_id`, trigram index on `tag_number` and `name`.

**Lineage-integrity trigger (new in v3.0):** `BEFORE INSERT OR UPDATE OF dam_id, sire_id ON animals` — reject the write if the proposed `dam_id`/`sire_id` is already a descendant of the animal (bounded traversal, depth 20 via `get_descendants`). Cheap because parent assignment is rare (birth time or a manual correction), and it's the difference between a wrong family tree and an *impossible* one being silently accepted.

### Health (reconstructed §12)
```
vet_visits           id, org_id, ranch_id, veterinarian_id?, visit_date,
                     purpose, findings, recommendations,
                     next_visit_date?, cost?, notes
vet_visit_animals    vet_visit_id, animal_id          — one visit, many animals
vaccinations         id, org_id, animal_id, vaccine_id, date_administered,
                     dose?, batch_number?, route?, administered_by_profile?,
                     veterinarian_id?, next_due_date?, notes
illnesses            id, org_id, animal_id, illness_type_id?, custom_name?,
                     onset_date, symptoms, severity ('mild'|'moderate'|'severe'),
                     diagnosis?, diagnosed_by?,
                     status ('suspected'|'confirmed'|'under_treatment'
                            |'recovered'|'chronic'),
                     resolved_date?, notes
treatments           id, org_id, animal_id, illness_id?, medication_id?,
                     custom_medication?, treatment_date, dosage?, route?,
                     duration_days?, administered_by_profile?,
                     veterinarian_id?, withdrawal_until?, outcome?,
                     follow_up_date?, cost?, notes
```

### Breeding (reconstructed §13)
```
breeding_events      id, org_id, dam_id, sire_id?, external_sire_note?,
                     method ('natural'|'artificial_insemination'),
                     service_date?, joining_start?, joining_end?,
                     technician?, straw_code?,
                     expected_due_date  (generated),
                     status ('served'|'confirmed_pregnant'|'not_pregnant'
                            |'delivered'|'aborted'),
                     notes
pregnancy_checks     id, breeding_event_id, check_date, method,
                     result ('pregnant'|'not_pregnant'|'inconclusive'),
                     estimated_days?, checked_by?
births               id, org_id, breeding_event_id?, dam_id, birth_date,
                     litter_size, ease ('unassisted'|'assisted'|'veterinary'),
                     complications?, notes
birth_offspring      birth_id, animal_id, sex, birth_weight?,
                     outcome ('live'|'stillborn'|'died_shortly_after')
```

`expected_due_date` is `service_date + species.default_gestation_days`, or a **window** from `joining_start + gestation` to `joining_end + gestation` for a group joining — one model handling both AI-dated cattle and buck-run goats. Lineage is a recursive CTE over `dam_id`/`sire_id`, exposed as `get_ancestors(animal_id, depth)` / `get_descendants(animal_id, depth)` — both depth-capped, and now guarded against cycles at write time (see above).

### Movement, mortality, feeding & care
```
movements            id, org_id, animal_id, from_ranch_id, from_section_id?,
                     to_ranch_id, to_section_id?, movement_date, reason,
                     permit_number?, notes, recorded_by
mortalities          id, org_id, animal_id, date_of_death, ranch_id,
                     section_id?, cause_category, cause_details?,
                     postmortem_done boolean, disposal_method?, notes
feeding_records      id, org_id, ranch_id, section_id?, animal_id?,
                     feed_item_id, feed_date, quantity, unit, notes
care_activities      id, org_id, animal_id?, ranch_id?, section_id?,
                     activity_type_id, activity_date, product?,
                     next_due_date?, performed_by?, notes
```
`from_ranch_id` on `movements` is **not nullable** — it is always populated server-side from the animal's actual current `ranch_id` at the moment the RPC runs, never trusted from client input (§3.3). `feeding_records`/`care_activities` carry `animal_id` and `ranch_id` as nullable with a `CHECK` enforcing exactly one scope set, so feed can be logged ranch-wide or an activity per-animal without a polymorphic mess.

### System
```
attachments          id, org_id, entity_type, entity_id, file_path,
                     file_name, mime_type, size_bytes, uploaded_by
audit_log            id, org_id, actor_id, table_name, record_id,
                     action ('insert'|'update'|'delete'|'restore'),
                     before jsonb, after jsonb, occurred_at
reminders            id, org_id, ranch_id?, animal_id?, kind, due_date,
                     status ('pending'|'sent'|'dismissed'|'done'),
                     sent_at, payload jsonb
                     — schema ships now, alongside finance; nothing reads
                       or writes it until the SMS/email feature is
                       scheduled (decision #12).
```

### Views (the dashboard and register run on these, never on client-side aggregation)
```
v_animal_current               animal + species/breed/status/ranch names denormalised
v_ranch_stats                  per ranch: totals, by species, by sex,
                               attention count, recent event counts
v_org_stats                    org roll-up for the owner dashboard
v_animals_requiring_attention  one row per (animal_id, reason) — Attention Queue detail
v_animal_attention_summary     one row per animal_id: worst severity, reason count
                               — register badge column + dashboard counterpoint (new)
v_upcoming_vaccinations        next_due_date within horizon, not yet done
v_upcoming_vet_followups
v_recent_activity              unioned event feed across all modules
v_animal_weight_series         weight history with ADG via window function
```

## 2.3 Weight tracking

Confirmed in scope, built in the client's own idiom — a plain record on the animal, not a production-analytics feature. No feedlot economics, no cost-per-kilo.

```
weight_records   id, org_id, animal_id, weight_date,
                 weight_kg numeric(6,2)?,
                 method ('scale'|'girth_tape'|'visual_estimate'),
                 body_condition_score smallint?,   -- 1–5
                 recorded_by, notes, audit cols, deleted_at
```

- `weight_kg` nullable; `body_condition_score` exists as a scaleless fallback — many ranches have no scale, and forcing a number means the module goes unused.
- `method` is recorded, because a girth-tape figure and a scale figure are not the same measurement and a chart that mixes them silently is a lie.
- **Average daily gain is derived, never stored** — a window function between consecutive records, so a back-dated entry can never leave a stale ADG behind.
- `birth_offspring.birth_weight` auto-seeds the animal's first `weight_records` row, so a home-bred animal's growth curve starts at day zero without double entry.
- Surfaces in three places: a Weights tab with sparkline + ADG on the profile, a Bulk Weigh Day quick-action, and a Weight & Growth report.
- Weighing also remains a `care_activity_type` for ranches that only want to log *that* it happened — the two don't conflict; one logs the event, the other logs the number.

## 2.4 Enrollment Mode — the first thing the client will ever use

Because there is no historical migration, the client's first real interaction with the system is capturing several hundred animals by hand. A twelve-field "Add Animal" form would make that take days.

- Full-screen, single-column, thumb-reachable, camera-first, designed at 390px.
- Sequence: **photo → tag number → species → sex → save → immediately next animal.** Four inputs, nothing else required.
- Species and sex are large tap targets, not dropdowns; both remember the last value.
- **Tag number gets a numeric keypad and auto-increments from the previous entry, seeded by a per-species prefix** — confirmed real-world convention: goats `M1`, `M2`, `M3`…, cattle `MUX 1`, `MUX 2`… (§0.6 #1). Selecting a species pre-fills `species.default_tag_prefix` into the prefix field; the owner can override it per session same as before. The suggested next number comes from `next_tag_number(org_id, prefix)` when online. **When offline**, the client tracks its own last-used number per prefix locally and increments without a server round trip — the existing duplicate-tag detection and sync-time conflict path (§2.5) is what reconciles this against the server on reconnect, exactly as it already does for any other offline tag collision. `tag_number` itself remains freeform text; the prefix/sequence system only ever suggests a value; the owner can always type something else — a purchased animal may arrive with a tag that fits no pattern at all.
- Optional fields (breed, colour, DOB, dam, sire, section, notes) collapse behind "Add more detail," fillable later from desktop. **Enrollment captures identity; management adds depth.**
- Persistent progress counter: "63 animals recorded today · 12 waiting to sync."
- Duplicate tag detection runs against the local queue and the server cache at entry time — this catches most cases but not a genuine two-user offline race; see §2.5 for the sync-time backstop that closes the rest.
- Target: **under 20 seconds per animal, fully offline-capable.**
- Supporting capability: pre-generate a tag range (e.g. `MUX 501`…`MUX 550`) as placeholder records via the same `tag_sequences` counter, then enrol against them, for ranches that number physical tags before working the animals.
- **Build order changed from v2.0** (decision #13): a thin vertical slice of this flow — camera, tag, save, queue, nothing else — is built and field-tested on the client's actual phone before the rest of the mode is polished. See §7.

**Batch Enrollment from Photos — new in this version (§0.6 #2).** The client may prefer to photograph animals through the day with the phone's own camera app, then sit down at a laptop and enter records against that batch — rather than, or alongside, live in-field capture. This is a second capture surface for the same underlying flow, not a separate feature:

- Desktop-sized screen: upload a folder or multi-select of photos, presented as a grid ordered by EXIF timestamp.
- Click a photo, fill the same four identity fields (tag, species, sex) with keyboard-first entry — on a laptop, tabbing between fields beats tapping — save, move to the next photo in the grid.
- Runs through the identical `lib/media/` compression pipeline, the identical `create_animal` queue operation, and the identical duplicate-tag checking as live Enrollment Mode. The only thing that differs is where the photo came from and how the four fields get typed.
- Exists specifically so that if live mobile capture proves clunky in the field test (§7, M2a), the client already has a working fallback that doesn't depend on it — not an afterthought, a deliberate hedge.

## 2.5 The offline write queue — what's newly specified

Covers exactly five operations: *add animal, attach photo, record health event, record weight, record movement.* Everything else requires connectivity and says so plainly.

- Client-generated UUIDv7 primary keys so a record created offline never collides with one created online.
- Photos held in the queue as blobs, uploaded on reconnect, photo first then record.
- Read-side: TanStack Query cache persisted to IndexedDB, kept conceptually separate from the write queue (§1).
- Sync indicator in the top bar, honest about state: hidden at zero, an ochre chip at n>0, a persistent offline banner when disconnected. Never a silent failure.
- **Conflict policy, made explicit (decision #7 and #8):**
  - *Record-level* conflicts: last write wins on server timestamp. With ≤5 users on distinct animals, genuine same-record conflicts are close to impossible — not engineering for this further.
  - *Business-key* conflicts (two offline users claiming the same `tag_number`): the sync worker catches the `unique_violation` on replay, marks that queue entry `conflict` — never silently retried, never silently dropped — and the sync panel surfaces it by tag number with a rename-and-resync action.
  - `created_by`/`updated_by` are stamped into the payload by the client at write time and carried through the queue; the audit trigger fills them only if absent, so a write relayed through `service_role` is still attributed to the person who actually made it.
- This is roughly 80% of the benefit of a full sync engine for about 20% of the complexity — the right point on that curve for two users editing distinct animals.

## 2.6 Finance: built in code, absent from the interface

```
organization_settings   org_id, timezone, weight_unit, stale_health_days,
                        feature_flags jsonb
                        -- { "finance": false, "weights": true, ... }
```

- Nullable `cost` columns exist on `treatments`, `vet_visits`, `feeding_records`, `care_activities`. Written by nothing, read by nothing in v1.
- `<FeatureGate flag="finance">` wraps every money-bearing field, column and report; renders `null` while off.
- Zod schemas mark cost fields `.optional()` — turning the flag on later is a config change, not a schema change.
- Future finance tables (`transactions`, `sale_events`, `purchase_events`) are documented in an ADR, not created.

## 2.7 The "requires attention" rule engine

`stale_health_days` (default 90, owner-editable per organization) now drives rule 12. Twelve rules, one row per `(animal_id, reason)` in `v_animals_requiring_attention`; aggregated to one row per animal in `v_animal_attention_summary` (decision #5).

| Reason | Condition | Severity |
|---|---|---|
| Overdue vaccination | `vaccinations.next_due_date < today` | high |
| Vaccination due soon | within 14 days | medium |
| Unresolved illness | `status IN ('suspected','confirmed','under_treatment')` | high |
| Vet follow-up due | `vet_visits.next_visit_date <= today` | high |
| Treatment follow-up due | `treatments.follow_up_date <= today` | medium |
| Care activity overdue | `care_activities.next_due_date < today` | medium |
| Pregnancy check due | breeding served 45+ days, no check recorded | medium |
| Calving/kidding imminent | within 14 days of `expected_due_date` | medium |
| Inside withdrawal period | `treatments.withdrawal_until >= today` | info |
| Losing condition | latest weight below previous, or BCS ≤ 2 | high |
| Incomplete enrolment | no photo, or no species set | info |
| **No health record logged** *(new)* | no vaccination/treatment/illness/vet visit/care activity in `stale_health_days` (default 120 — see §0.6 #7) | info |

A view, not a stored flag — always correct, no backfill, new rules ship as a migration.

## 2.8 Scale targets (unchanged, held after review)

| Concern | Target | How |
|---|---|---|
| Animal register | 50,000 rows, <300ms page load | Server-side pagination, indexed filters, virtualised rows above page size 100 |
| Search by partial tag | <150ms | `pg_trgm` GIN index on `tag_number`, `name` |
| Dashboard | <500ms | Aggregation in Postgres views |
| Photo storage | ~200 KB/animal | Client-side WebP resize — 5,000 animals ≈ 1 GB |
| Enrollment | <20s per animal | Enrollment Mode, field-tested early (§0.5 #13) |
| Offline queue | 500 pending writes | Dexie, blob storage for photos |

Reviewed and held: the register is not expected to be a real performance risk at this org's actual scale (hundreds to low thousands of animals against a 50,000-row ceiling) provided the indexes above are applied as specified.

---

# Part 3 — Security model

## 3.1 Helper functions (unchanged)

```sql
auth_org_id()            -- reads org from JWT claim, falls back to profiles
is_owner()                -- role check
has_ranch_access(uuid)    -- owner → true; manager → membership check
```
SECURITY DEFINER, to avoid recursive policy evaluation and keep RLS fast.

## 3.2 Standard policy shape (unchanged)

```sql
alter table animals enable row level security;

create policy animals_select on animals for select
  using ( org_id = auth_org_id() and has_ranch_access(ranch_id) );

create policy animals_insert on animals for insert
  with check ( org_id = auth_org_id() and has_ranch_access(ranch_id) );

create policy animals_update on animals for update
  using      ( org_id = auth_org_id() and has_ranch_access(ranch_id) )
  with check ( org_id = auth_org_id() and has_ranch_access(ranch_id) );
```

## 3.3 Movements — corrected (decision #2)

**v2.0 had a real hole here.** The original policy permitted the insert when the user had access to *either* the source or destination ranch:

```sql
-- v2.0 — DO NOT BUILD THIS. Kept here only so the review trail is legible.
create policy movements_insert on movements for insert
  with check ( org_id = auth_org_id()
               and ( has_ranch_access(from_ranch_id)
                     or has_ranch_access(to_ranch_id) ) );
```

The stated justification was "a manager transferring animals *out* to a ranch he doesn't manage" — which only ever requires access to the *source*. The OR also permitted the reverse: a manager with no access to an animal's actual ranch could insert a movement claiming it arrived at *his* ranch (foreign keys don't require SELECT rights under RLS), and the transactional RPC would then update `animals.ranch_id` to match — pulling any animal in the org into a manager's visible set with no legitimate access ever granted.

**v3.0 policy — simpler, and closes the hole:**

```sql
-- record_movement is a SECURITY DEFINER RPC, not a raw client insert.
-- It resolves the animal's current ranch server-side and never trusts
-- a client-supplied from_ranch_id.
create or replace function record_movement(
  p_animal_id uuid, p_to_ranch_id uuid, p_to_section_id uuid,
  p_movement_date date, p_reason text, p_permit_number text, p_notes text
) returns movements
language plpgsql security definer as $$
declare
  v_from_ranch_id uuid;
  v_org_id uuid;
begin
  select ranch_id, org_id into v_from_ranch_id, v_org_id
    from animals where id = p_animal_id and deleted_at is null;

  if v_org_id is distinct from auth_org_id() then
    raise exception 'not found';
  end if;

  if not has_ranch_access(v_from_ranch_id) then
    raise exception 'no access to the animal''s current ranch';
  end if;

  -- to_ranch_id requires no access check: it is a destination pointer
  -- within the same org, not a read grant.
  ...
end;
$$;
```

Access is required to the animal's **current** ranch, resolved from the `animals` table itself — never from client input — and there is **no** access requirement on the destination. This is strictly smaller than the v2.0 policy, not more complex, and it still fully covers the one legitimate case cited: a manager shipping an animal to an unmanaged ranch has access to the source by definition. `movements.from_ranch_id` is therefore `NOT NULL` and always server-populated (§2.2).

Read policy on `movements` is unchanged and correct as originally specified: visible if the user has access to either the source or destination ranch — reading about a ranch you can see is fine; writing a false claim about one you can't is the part that needed fixing.

## 3.4 Profiles — corrected (decision #3)

```sql
-- Owner: full access, unchanged.
create policy profiles_owner_all on profiles for all
  using ( org_id = auth_org_id() and is_owner() );

-- New: self-service, restricted by trigger rather than by policy,
-- because RLS predicates can't compare OLD vs NEW column-by-column.
create policy profiles_self_update on profiles for update
  using      ( id = auth.uid() )
  with check ( id = auth.uid() );

create or replace function prevent_self_role_escalation()
returns trigger language plpgsql as $$
begin
  if not is_owner() and (new.role is distinct from old.role
                          or new.org_id is distinct from old.org_id) then
    raise exception 'only an owner may change role or organisation';
  end if;
  return new;
end;
$$;

create trigger profiles_guard
  before update on profiles
  for each row execute function prevent_self_role_escalation();
```

`last_seen_at` is written via a dedicated `touch_presence()` RPC (SECURITY DEFINER, sets only that column for `auth.uid()`), not a raw table update, so it can't become a side channel for anything else.

## 3.5 Rules enforced, and the negative test v2.0 was missing

- `role` and `org_id` mirrored into the JWT via `app_metadata`; role checks cost nothing.
- **No hard DELETE policy on any business table.** Deletion is `update … set deleted_at`.
- Owner-only tables (`invitations`, `organizations`, `organization_settings`, reference catalogues) use `is_owner()`. `profiles` is now the carved-out exception above.
- `service_role` key exists only in Edge Functions, never in the client bundle.
- **pgTAP suite proves:**
  - a manager cannot read an unassigned ranch's animals;
  - a manager cannot escalate their own role or move themselves to another org;
  - cross-org reads return zero rows;
  - soft-deleted rows are invisible to normal queries;
  - a manager *can* transfer an animal out to a ranch they don't manage (the legitimate case);
  - **new** — a manager *cannot* record a movement claiming an animal whose current ranch they have no access to, even when the destination is their own ranch. This is the specific negative test that would have caught the v2.0 hole, and it did not exist until this review. It ships in Session 1 alongside the others.

---

# Part 4 — Modules & screens

## 4.1 Coverage matrix

| Client PRD § | Module | Primary screens |
|---|---|---|
| §7 Central Dashboard | **Dashboard** | Owner Overview · Manager Overview · Quick Actions |
| §8 Ranch Management | **Ranches** | Ranch List · Create/Edit Ranch · Ranch Detail · Sections |
| §9 Livestock Management | **Livestock** | Animal Register · Add Animal · Animal Profile · Edit · Bulk Import |
| §9 *(client decision)* | **Enrollment** | Enrollment Mode · Batch Enrollment from Photos · Tag Range Generator · Sync Queue |
| §4 *(client decision)* | **Weights** | Weight history on profile · Bulk Weigh Day · Growth report |
| §9.2 Animal Status | **Livestock / Admin** | Status chips throughout · Status catalogue in Admin |
| §10 Movement & Transfers | **Movements** | Movement Register · Record Transfer (single & bulk) · per-animal history |
| §11 Mortality | **Mortality** | Mortality Register · Record Death · per-animal record |
| §12 Health *(reconstructed)* | **Health** | Health Hub · Vaccinations · Treatments · Illnesses · Vet Visits · Veterinarians · Attention Queue |
| §13 Breeding *(reconstructed)* | **Breeding** | Breeding Register · Record Breeding · Pregnancy Check · Record Birth · Family Tree · Breeding Calendar |
| §14 Feeding & Care *(reconstructed)* | **Feeding & Care** | Feeding Log · Care Activities Log |
| §15 Users *(reconstructed)* | **Admin** | Users & Roles · Invite User · Ranch Assignments |
| §16 Search & Filtering | **Global** | Command palette (⌘K) · Search Results · filter bar on every register |
| §17 Reports | **Reports** | Report Gallery · Report Viewer · Export |
| §6 UX requirements | **Cross-cutting** | Shell, ranch scope switcher, toasts, confirm dialogs, empty states |

## 4.2 Screen inventory — **59 screens** (58 confirmed by tally per decision #6, plus Batch Enrollment added per §0.6 #2)

```
AUTH (5)          Login · Forgot Password · Reset Password ·
                  Accept Invitation · Session Expired

SHELL (4)         App Shell (sidebar + topbar + ranch scope switcher) ·
                  Command Palette · Notifications Panel ·
                  Sync Status Panel

DASHBOARD (2)     Owner Overview · Ranch Manager Overview

RANCHES (4)       Ranch List · Ranch Detail Overview ·
                  Create/Edit Ranch · Manage Sections

LIVESTOCK (6)     Animal Register · Animal Register (bulk-select state) ·
                  Add Animal (stepper) · Animal Profile ·
                  Edit Animal · Bulk Import (CSV mapping)

ENROLLMENT (5)    Enrollment Mode — camera step ·
                  Enrollment Mode — details step ·
                  Enrollment Session Summary ·
                  Tag Range Generator
                  — mobile-first frames, 390px
                  Batch Enrollment (desktop, from photos) — new, §0.6 #2

HEALTH (8)        Health Hub · Attention Queue · Vaccinations Register ·
                  Record Vaccination (drawer) · Treatments Register ·
                  Record Treatment (drawer) · Illnesses Register ·
                  Vet Visits Register

WEIGHTS (3)       Weight History (profile section) ·
                  Record Weight (drawer) · Bulk Weigh Day

BREEDING (5)      Breeding Register · Record Breeding Event ·
                  Record Pregnancy Check · Record Birth ·
                  Family Tree

MOVEMENT (2)      Movement Register · Transfer Wizard

MORTALITY (2)     Mortality Register · Record Death

FEEDING (2)       Feeding Log · Care Activities Log

REPORTS (2)       Report Gallery · Report Viewer

ADMIN (5)         Users & Roles · Invite User · Reference Data
                  Manager · Organisation Settings · Audit Log

SYSTEM (4)        Empty States set · Error / 404 ·
                  Onboarding Checklist · Offline Banner states
```

**Priority tiers**, for staged design generation:

- **Tier 1 — anchors (6):** App Shell, Animal Register, Animal Profile, Owner Dashboard, Enrollment Mode (camera), Record Vaccination drawer. These establish every pattern in the product.
- **Tier 2 — module leads (12):** one representative screen per remaining module.
- **Tier 3 — derivatives (41):** variations that follow mechanically once Tiers 1–2 are locked, including Batch Enrollment, which reuses the Enrollment Mode anchor's patterns rather than establishing new ones.

## 4.3 The eleven modules (unchanged from v2.0, held after review)

**1 · Dashboard** — role-aware, one dominant metric (*total active animals*), *animals requiring attention* as its counterpoint, 5–9 elements maximum on the default view.
**2 · Ranches** — cards on the list, §8.2's full detail breakdown on the ranch page.
**3 · Livestock** — the heart of the product; server-side register (§1, §2.8), tabbed profile (§Part 2 signature element is the Timeline).
**4 · Health** — hub, four registers, Attention Queue; every event recordable from three entry points via one shared drawer.
**5 · Breeding** — register, calendar with window-based due dates, recursive family tree.
**6 · Movements** — register + transfer wizard, bulk-capable, now server-verified per §3.3.
**7 · Mortality** — register + record-death flow; deceased animals leave active counts, stay browsable.
**8 · Feeding & Care** — two scope-flexible logs feeding the attention engine.
**9 · Reports** — gallery of the thirteen §17 reports, Postgres views/RPCs, never client aggregation.
**10 · Search** — ⌘K palette, trigram-indexed partial match.
**11 · Admin** — users, roles, ranch assignments, reference catalogues, org settings, audit log.

---

# Part 5 — Design direction (held after review — no findings against this section)

## 5.1 Thesis

Not a SaaS analytics dashboard — a **ledger for living animals**. Calm, legible, dense where density earns its place, free of decoration. Signature element: the **Animal Timeline**, a single vertical spine on the animal profile carrying every event of that animal's life. It is the one place the design is allowed to be memorable; everything else stays quiet.

## 5.2 Tokens

**Palette** — drawn from rangeland, not a template.

| Token | Hex | Use |
|---|---|---|
| `--acacia-900` | `#1B3A2F` | Primary brand, sidebar, headings |
| `--acacia-600` | `#2F6B54` | Primary actions, active states |
| `--ochre-500` | `#C2761E` | Single accent — sparing, current scope + key CTAs |
| `--bone-50` | `#FAF8F4` | App background |
| `--bone-100` | `#F1EDE6` | Surface, table stripes |
| `--ink-900` | `#1A1815` | Body text |
| `--ink-500` | `#6B655C` | Secondary text |
| `--line` | `#E2DCD2` | Borders, dividers |

Status colours are functional only, never decorative: `--ok #2F6B54` · `--warn #C2761E` · `--critical #A63A2B` · `--neutral #6B655C` · `--info #2C5D7C`.

**Typography** — three roles.

- **Display / headings — `Bricolage Grotesque`**, weights 500/600. Handles long ranch/animal names in headers.
- **Body / UI — `Inter`**, weights 400/500/600, optical sizing on, `cv05`/`ss01` enabled.
- **Data / tabular — `IBM Plex Mono`.** Every tag number, count, date, weight, dosage, ID. 500 tag numbers in a proportional face don't align and can't be scanned — this is the choice that most separates the product from a template. `font-variant-numeric: tabular-nums` on every numeric column.

Type scale: 12 / 13 / 14 / 16 / 20 / 26 / 34.

**Layout** — 8px grid. Sidebar 260px, collapses to 64px. Content max-width 1440px, tables full-bleed. Radius: cards 8px, inputs 6px, badges 4px — nothing is a pill. Elevation via border + background shift; shadows only on drawers/popovers.

**Motion** — 150ms ease-out on state change, 220ms on drawer entry. Nothing else moves. `prefers-reduced-motion` respected throughout.

**Dark mode** — tokens defined from day one; no toggle built until a later milestone. (Note: since nothing renders the `.dark` block until the toggle ships, treat the initial dark values as a placeholder pass, not a finished one — they can't really be validated without eyes on them in the live UI, and will want a revisit when the toggle actually ships.)

## 5.3 Interaction principles

1. **Record without leaving** — every "record X" opens a right-hand drawer over the current screen.
2. **Progressive disclosure** — default views show what's needed to decide; detail is one click away.
3. **Global scope, global filters** — ranch switcher and date/species filters apply app-wide, encoded in the URL.
4. **Plain language** — "Moved to Ranch B", not "Location entity updated." Button labels match their resulting toast.
5. **Confirm what matters** — deaths, transfers, status changes, deletions get a confirm dialog naming the specific animal.
6. **Empty states do work** — every empty register explains what belongs there and offers the action that fills it.

---

# Part 6 — Risk register

Ranked by cost-to-fix-later, not by confidence — a schema or policy risk outranks a component risk even when the component risk feels more certain.

| # | Risk | Where it lives | Status | Mitigation |
|---|---|---|---|---|
| 1 | Movements RLS allowed claiming an unmanaged animal into your own ranch | Schema/policy | **Closed** | Source-only, server-verified policy — §3.3 |
| 2 | `profiles` RLS blocked legitimate self-service edits | Schema/policy | **Closed** | Self-update policy + role-escalation trigger — §3.4 |
| 3 | Offline tag-number collision between two simultaneous enrollers | Schema/sync design | **Closed** | Explicit `conflict` state in sync worker, named in the sync panel — §2.5 |
| 4 | Attention badge needs one row per animal, view returns one row per reason | Schema/view design | **Closed** | `v_animal_attention_summary` added — §2.2, §2.7 |
| 5 | `created_by` attribution wrong for offline-relayed writes under `service_role` | Schema/trigger design | **Closed** | Trigger fills only if `NULL`; client stamps author into queue payload — §2.5 |
| 6 | Lineage cycle from a data-entry mistake | Schema/trigger | **Closed** | Write-time bounded ancestry check — §2.2 |
| 7 | Attention rule count contradicted itself (11 vs 12) | Documentation/spec | **Closed** | 12th rule added, `stale_health_days` configurable — §2.7 |
| 8 | Screen count contradicted itself (58 vs 47) | Documentation | **Closed** | 58 confirmed by tally — §4.2 |
| 9 | Zod major version unpinned across 8 sessions | Build config | **Closed** | Pinned to Zod 4 — Part 1 |
| 10 | **The offline architecture is a one-shot bet, untested against real conditions until after it's fully built** | Product/sequencing | **Open, scheduled — exposure reduced** | Thin-slice field test pulled into M2a, before Enrollment Mode polish — §7. Exposure is now lower than in v2.0: the client has confirmed a working fallback (Batch Enrollment from Photos, §0.6 #2) that doesn't depend on live in-field capture at all, so a bad M2a result no longer threatens the whole enrollment plan, only the mobile-specific path. Still the largest remaining *unknown* in the plan — everything else in this table is a day or two of engineering, this one is a real-world fact (his phone, his signal, his patience) no amount of design review resolves in advance. |
| 11 | Register pagination and virtualization specified without reconciling | Component design | **Closed** | Pagination primary, virtualization only above page size 100 — §1 |
| 12 | `reminders` table ships with no consumer for months | Schema (minor) | **Closed** | Client delegated the call (§0.6 #6); kept for consistency with the finance precedent, now with the same standing as that decision, not just an assumption. |

---

# Part 7 — Milestones

Twelve weeks to a production system. M2 is restructured from v2.0 to front-load the field test (decision #13) — this is the one change to the schedule itself.

| # | Milestone | Duration | Deliverable — how we know it's done |
|---|---|---|---|
| **M0** | **Foundations** | Wk 1 | Repo, CI, Supabase projects (dev/prod), full schema + RLS (including the corrected movements and profiles policies) + seed migrated, generated types, design tokens in code, app shell, auth working. |
| **M1** | **Walking Skeleton** ⭐ | Wk 2 | Log in → see a ranch → open the animal register → add an animal → view its profile. Thin but end-to-end, deployed to a preview URL. **First client demo.** |
| **M2a** | **Offline thin-slice field test** ⭐⭐ | Wk 3, early | The minimum offline flow — camera → tag → save → queue, no auto-increment, no "add more detail," no session summary — built and tested on the client's actual phone, at an actual ranch, on real signal. This is not a demo, it's a test: does compression hold, does the queue survive a reload, does 20 seconds/animal feel real on his hardware. **Go/no-go checkpoint for the rest of Enrollment Mode's design before more is built on top of unverified assumptions.** |
| **M2b** | **Livestock + Enrollment + Offline, full build** | Wk 3–4 | Full ranch CRUD + detail overview, self-service ranch creation live (§0.6 #4). Animal register with server-side filtering, sorting, pagination (§1), bulk select. Animal profile. Enrollment Mode polished per §2.4, including per-species tag prefixes and the `tag_sequences` counter. **Batch Enrollment from Photos built alongside it**, sharing the same image pipeline and queue operation (§0.6 #2) — a working fallback exists from this milestone on, not bolted on later. PWA install, offline write queue with conflict handling (§2.5), image pipeline. **Second demo — the client begins capturing his real herd, by whichever of the two enrollment paths he prefers.** |
| **M3** | **Health & Weights** | Wk 5–6 | Vaccinations, treatments, illnesses, vet visits, veterinarian directory. Bulk health events. Weight records, growth curves, bulk weigh day. Attention rule engine live — all 12 rules, both views. |
| **M4** | **Movement, Mortality, Breeding** | Wk 7–8 | Transactional movement (server-verified source ranch) and death RPCs. Breeding events, pregnancy checks, birth recording auto-creating linked offspring. Family tree. Breeding calendar. |
| **M5** | **Feeding, Care & Dashboard** | Wk 9 | Feeding and care logs. Both dashboards fully live against real views. Recent-activity feed. |
| **M6** | **Reports & Search** | Wk 10 | All thirteen §17 reports, filterable and exportable. Command palette. Global search. |
| **M7** | **Admin & Hardening** | Wk 11 | User management, invitations (with the corrected profiles self-service policy live), reference-data manager, audit log, org settings. pgTAP RLS suite green, **including the new movements negative test (§3.5)**. Playwright E2E on critical paths. Performance pass at 10,000 animals. |
| **M8** | **UAT, Migration & Launch** | Wk 12 | Client and manager trained. Runbook and backup policy documented. Production launch. (No historical migration — by design, per §0.5.) |

**Post-v1 backlog** (priced separately, discussed after launch): SMS/email reminders via Africa's Talking + Resend (activates the `reminders` table already in schema) · dark mode (tokens exist, need a validation pass once the toggle exists) · finance module activation (schema and gates already in place) · ANITRAC bulk sync · Swahili localisation · offline coverage extended beyond the five queued operations.

---

# Part 8 — Open questions for the client

Six of the original seven questions are resolved — see the §0.6 ledger for each answer and what it changed. One remains:

1. **Does a manager need to see other managers' ranches read-only, or is strict isolation correct?** Current design, including the corrected RLS in §3, assumes strict isolation: a manager sees only ranches assigned to them, full stop. This doesn't block M0–M2 — the policy is symmetric either way and easy to loosen later if the answer is "read-only visibility everywhere" — but it should be confirmed before §3's pgTAP suite is written in Session 1, since the suite needs to assert one behaviour or the other.
 
---

# Part 9 — What happens next

1. **Confirm §8** — one remaining question; it doesn't block starting M0.
2. **`CLAUDE.md` regenerated against this blueprint** — done, see the project root. Covers the movements/profiles RLS corrections, the Zod pin, the split attention views, per-species tag prefixes, Batch Enrollment, and the M2a/M2b resequencing.
3. **Lock these tokens** — they become the literal input to the Figma prompt, so generated screens and coded components share one source of truth.
4. **Write the Figma master prompt** against the confirmed 59-screen inventory, design system first, then screens in batches by module.
5. **Move to VS Code with Claude Code**, building feature folder by feature folder against Part 2 of this document, starting with M0.
