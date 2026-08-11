# LIMS — Claude Code Session Pack

\## Companion to blueprint.md v3.0 and CLAUDE.md

**Purpose:** everything Claude Code needs to build the design system and the six anchor screens, in code, correctly, first time — updated for every correction and addition in blueprint v3.0.

---

# Part 1 — How this pack works

Two layers, same as before:

**Layer 1 — `CLAUDE.md`**, already written, lives at the repo root. Claude Code reads it automatically at the start of every session. It carries the standing rules — stack, tokens, database/security rules, copy rules, the specific things this project has already gotten wrong once and must not get wrong again (the movements RLS hole, the profiles blanket-owner policy, the Zod version). This pack does not repeat that content — it assumes it's been read.

**Layer 2 — this document.** Bounded session prompts, one coherent chunk of work each, ending in a working, committed, verifiable state.

**The rhythm, unchanged:**

```
git commit  →  run session prompt  →  verify (typecheck, lint, build, look at it)
            →  run review prompt   →  git commit  →  next session
```

Never start a session on a dirty tree.

**What's different from the original pack, in one place, so nothing gets rebuilt the old way by habit:**

- Session 1's migrations now include `tag_sequences`, the `default_tag_prefix` column, the lineage cycle-guard trigger, the corrected `movements`/`profiles` policies, the split attention views, and `stale_health_days` defaulting to 120.
- Session 5 is now **two sub-sessions, not one** — a thin offline slice (5a) built and field-tested before the rest of Enrollment Mode is polished (5b), and 5b now also includes **Batch Enrollment from Photos**, a second capture surface the client asked to have available alongside live mobile enrollment.
- The screen count referenced throughout is **59**, not 58.
- Zod is pinned to v4 everywhere a version could be implied.

---

## Session 0 — Scaffold and design system

> Initialise the project.
>
> 1. `git init` if not already a repository, before anything else. Then scaffold a Vite + React 19 + TypeScript project with pnpm. Enable TypeScript strict mode plus `noUncheckedIndexedAccess`.
> 2. Install and configure: Tailwind CSS v4, shadcn/ui (vendored to `src/components/ui`), TanStack Router with file-based routing, TanStack Query, TanStack Table v8, React Hook Form, **Zod 4** (pin the exact major version in `package.json`, don't leave it as a caret range that could jump majors later), date-fns with `@date-fns/tz`, lucide-react, Recharts, Dexie, vite-plugin-pwa.
> 3. Create `src/styles/tokens.css` implementing every token in CLAUDE.md §4 as a Tailwind v4 `@theme` block. Map the shadcn CSS variables (`--background`, `--foreground`, `--primary`, `--muted`, `--border`, `--ring`, etc.) onto our palette so shadcn components inherit our identity rather than the default slate. Include a `.dark` block with correct dark values, but do not build any dark-mode toggle yet — treat these dark values as a first pass that will need revisiting once the toggle actually exists and they can be seen live, not as a finished deliverable.
> 4. Load the three fonts — Bricolage Grotesque, Inter, IBM Plex Mono — via `@fontsource-variable` packages, self-hosted, not Google CDN. Register them as `--font-display`, `--font-sans`, `--font-mono`.
> 5. Add a utility class `.tabular` applying `font-family: var(--font-mono); font-variant-numeric: tabular-nums;` for all numeric data cells.
> 6. Set up ESLint, Prettier, and `pnpm` scripts: `dev`, `build`, `typecheck`, `lint`, `test`, `db:types` (stubbed for now, wired properly in Session 1).
> 7. Configure vite-plugin-pwa: `registerType: 'prompt'`, app shell precached, manifest with name "LIMS", theme colour `#1B3A2F`, standalone display, portrait orientation.
> 8. Build a route at `/kitchen-sink` that renders **every token and primitive on one page**: full colour ramps as swatches with hex labels, the type scale in all three faces, all button variants and sizes, all input states including error, badges in every semantic colour, a sample card, a sample table row with tabular numerals, and a sample empty state.
>
> The kitchen sink is how we lock the visual language before building anything real. Make it genuinely complete.
>
> Do not create any Supabase code, routes, or features yet.
>
> **Done when:** `pnpm dev` serves `/kitchen-sink`, typecheck and lint are clean, the page demonstrates every token, and `git log` shows an initial commit.

---

## Session 1 — Database, RLS, types

> Build the complete database layer from `blueprint.md` Part 2 and Part 3. Work only in `supabase/`. This session carries every correction from the v3.0 review — read `blueprint.md` §0.5, §0.6, §2, and §3 before writing a single migration, not just the schema tables. Getting the corrected policies right here is much cheaper than finding the old holes again in Session 7's hardening pass.
>
> Write numbered migrations in this order:
>
> 1. `0001_extensions.sql` — `pgcrypto`, `pg_trgm`, `pg_cron`.
> 2. `0002_helpers.sql` — `updated_at` trigger function; `uuid_generate_v7()`; the audit-column trigger. **The audit trigger sets `created_by`/`updated_by` only when the incoming value is `NULL`** — it must not overwrite a value the client already stamped into the row (needed for offline-relayed writes, see Session 5).
> 3. `0003_identity.sql` — `organizations`; `organization_settings` (`feature_flags jsonb` defaulting to `{"finance": false, "weights": true}`, plus `stale_health_days integer default 120`, `weight_unit`); `profiles`; `invitations`.
> 4. `0004_ranches.sql` — `ranches`, `ranch_assignments`, `ranch_sections`.
> 5. `0005_reference.sql` — `species` (including `default_tag_prefix text`), `breeds`, `animal_statuses`, `veterinarians`, `vaccines`, `medications`, `illness_types`, `feed_items`, `care_activity_types`, and **`tag_sequences`** (`org_id, prefix, next_number int`, `UNIQUE (org_id, prefix)`).
> 6. `0006_animals.sql` — the `animals` table exactly as specified, including `anitrac_ain`, `dob_is_estimated`, `dam_id`, `sire_id`, partial unique index on `(org_id, tag_number) WHERE deleted_at IS NULL`, GIN trigram indexes on `tag_number` and `name`, and **the lineage cycle-guard trigger** (`BEFORE INSERT OR UPDATE OF dam_id, sire_id` — reject if the proposed parent is already a descendant, bounded traversal depth 20).
> 7. `0007_health.sql` — `vet_visits`, `vet_visit_animals`, `vaccinations`, `illnesses`, `treatments` (with `withdrawal_until` and nullable `cost`).
> 8. `0008_weights.sql` — `weight_records`. `weight_kg` nullable, `body_condition_score` smallint nullable, `method` constrained to scale/girth_tape/visual_estimate, CHECK that at least one of weight or BCS is present.
> 9. `0009_breeding.sql` — `breeding_events`, `pregnancy_checks`, `births`, `birth_offspring`, **plus the trigger that auto-seeds a `weight_records` row from `birth_offspring.birth_weight` when present** — this was specified in prose in the blueprint but easy to drop if you're only reading the table list, so it's called out here explicitly.
> 10. `0010_movement_mortality.sql` — `movements` (**`from_ranch_id` is `NOT NULL`** — it is always resolved server-side, never supplied by the client, see the RPC in migration 17), `mortalities`.
> 11. `0011_feeding_care.sql` — `feeding_records`, `care_activities`, each with a CHECK enforcing exactly one of animal/ranch scope.
> 12. `0012_system.sql` — `attachments`, `audit_log`, `reminders` (ships now per client decision, inert until the SMS/email feature is scheduled — nothing in this session or any later one should write to it).
> 13. `0013_helpers_auth.sql` — SECURITY DEFINER functions `auth_org_id()`, `is_owner()`, `has_ranch_access(uuid)`.
> 14. `0014_rls.sql` — enable RLS on every table, default deny, then policies. Two of these are corrected from the original design and must be built exactly as follows, not as a "manager access to either endpoint" shortcut:
>     - **`movements`** has no client-facing INSERT policy at all — inserts happen only through the `record_movement` RPC (migration 17), which is SECURITY DEFINER and resolves `from_ranch_id` from the animal's actual current `ranch_id`, checked against `has_ranch_access`. There is deliberately no access check on the destination ranch. If you find yourself writing `has_ranch_access(from_ranch_id) OR has_ranch_access(to_ranch_id)` anywhere, stop — that is the exact hole this project found and closed once already.
>     - **`profiles`** gets an owner-all policy (`is_owner()`) plus a self-update policy (`id = auth.uid()`) for the safe columns, guarded by a `BEFORE UPDATE` trigger (`prevent_self_role_escalation`) that rejects any change to `role` or `org_id` unless the actor `is_owner()`. `last_seen_at` is written only through a separate `touch_presence()` RPC, not the general update path.
>     - No DELETE policies anywhere, on any table.
> 15. `0015_indexes.sql` — index every column referenced in any policy, plus the obvious query paths, plus a unique index backing `tag_sequences (org_id, prefix)`.
> 16. `0016_views.sql` — `v_animal_current`; `v_ranch_stats`; `v_org_stats`; **`v_animals_requiring_attention` with all twelve rules** (the eleventh from the original list plus "no health record logged in `organization_settings.stale_health_days` days," severity `info` — don't build eleven, the twelfth was a documented gap, not an optional extra); **`v_animal_attention_summary`** (new — one row per animal, worst severity + reason count, aggregated from the view above — this is what the register badge column and the dashboard join against, never the per-reason view directly); `v_upcoming_vaccinations`; `v_upcoming_vet_followups`; `v_recent_activity`; `v_animal_weight_series` (ADG via window function).
> 17. `0017_rpc.sql` — transactional functions:
>     - `record_movement(animal_id, to_ranch_id, to_section_id, movement_date, reason, permit_number, notes)` — SECURITY DEFINER. Looks up the animal's current `ranch_id`/`org_id` itself, checks `org_id = auth_org_id()` and `has_ranch_access(current_ranch_id)`, raises if either fails, then inserts into `movements` with `from_ranch_id` set from what it just looked up (never from an argument) and updates `animals.ranch_id`/`section_id` in the same transaction.
>     - `record_birth` — insert `births`, create N offspring `animals` rows with `dam_id`/`sire_id`, insert `birth_offspring`, update `breeding_events.status = 'delivered'`, seed weight records per the trigger above.
>     - `record_death` — insert `mortalities`, set `animals.status_id` to Deceased.
>     - `bulk_health_event` — array of animal IDs + one event payload → N individual records.
>     - `bulk_weight_event` — same pattern for weights.
>     - **`next_tag_number(org_id, prefix)`** — new. Atomically `INSERT ... ON CONFLICT (org_id, prefix) DO UPDATE SET next_number = tag_sequences.next_number + 1 RETURNING next_number`, returns `prefix || next_number`. Used by live Enrollment Mode when online, Batch Enrollment, and the Tag Range Generator.
>     - **`touch_presence()`** — new. SECURITY DEFINER, sets `profiles.last_seen_at = now()` for `auth.uid()` only, nothing else.
> 18. `seed.sql` — one demo org, an owner and a manager profile, two **generically named** demo ranches (never the client's real ranch names — real ranch creation is a first-run action the owner performs himself), seeded species (Cattle 283d, Goat 150d, Sheep 148d, Chicken 21d) **with example `default_tag_prefix` values illustrating the pattern** (e.g. Goat → `M`, Cattle → `MUX `), common Kenyan breeds, the five animal statuses, and a starter catalogue of vaccines, medications and illness types relevant to Kenyan livestock.
>
> Then write pgTAP tests in `supabase/tests/` proving:
>
> - a manager cannot read animals on an unassigned ranch;
> - a manager cannot change their own role or org_id (test both a direct table update attempt and confirm the trigger fires even via the self-update policy);
> - a manager _can_ update their own `full_name`/`phone`/`avatar_url`;
> - cross-org queries return zero rows;
> - soft-deleted rows are invisible;
> - a manager _can_ transfer an animal out to a ranch they do not manage (call `record_movement` from a session with access to the animal's current ranch, destination unmanaged — must succeed);
> - **a manager cannot record a movement claiming an animal whose current ranch they have no access to, even when the destination is their own ranch** — this is the negative test for the hole that was found and fixed; it is not optional;
> - `dam_id`/`sire_id` cannot be set to create a lineage cycle;
> - `next_tag_number` is safe under concurrent calls (two calls for the same prefix never return the same number).
>
> Finally, generate `src/types/database.generated.ts` and wire up the `pnpm db:types` script.
>
> Write no application code this session.
>
> **Done when:** migrations apply cleanly to a fresh local Supabase, seed loads, all pgTAP tests pass — including the two negative tests above — and types generate.

---

## Session 2 — Auth and the App Shell _(anchor 1)_

> Build authentication and the application shell.
>
> **Auth:** Supabase email/password. Routes for login, forgot password, reset password, accept invitation. Protected route wrapper redirecting unauthenticated users to login and preserving the intended destination. `lib/auth.ts` exposing session, profile, role and org. `lib/permissions.ts` with a `can(action, resource)` helper mirroring the RLS matrix from CLAUDE.md §7 — including the corrected shape of movement permissions (checked against the animal's current ranch, not either endpoint) and the profiles self-service carve-out.
>
> **App Shell — this is an anchor screen; every other screen inherits from it.**
>
> - Left sidebar, 260px, acacia-900 background. Wordmark in Bricolage Grotesque at top. Navigation grouped: _Overview_ (Dashboard) · _Livestock_ (Animals, Enrollment, Batch Enrollment) · _Records_ (Health, Weights, Breeding, Movements, Mortality, Feeding & Care) · _Insight_ (Reports) · _Manage_ (Ranches, Admin). Collapses to a 64px icon rail with tooltips; state persists.
> - Top bar, left to right: **ranch scope switcher** (combobox, "All ranches" or a specific ranch — sets scope app-wide, encoded in the URL via TanStack Router), global search trigger with the ⌘K hint, sync indicator, notifications bell, profile menu.
> - **SyncIndicator** — reads the Dexie queue. Hidden at zero pending and zero conflicts. At n pending, an ochre chip: "3 records waiting to sync." **At any item in `conflict` state, a distinct — not just a bigger number — indicator**, since a conflict needs a decision from the user (typically a duplicate tag), not just patience; opens a panel listing pending and conflicted items separately, with manual retry on pending and a rename-and-resync action on conflicts. When offline, a persistent unobtrusive banner: "You're offline. Records are being saved on this device." Never a silent failure, and never collapse "waiting" and "stuck" into the same visual state.
> - Role-aware nav: managers do not see Admin.
> - Mobile: sidebar becomes a bottom sheet; top bar keeps the ranch switcher and search.
>
> Also build shared patterns in `components/patterns/`: `PageHeader` (title, description, actions slot, breadcrumbs), `RecordDrawer` (right-hand drawer, 480px, universal container for every "record X" action — traps focus, closes on Escape, warns on dirty close), `EmptyState`, `ConfirmDialog`, `StatusBadge`, `AttentionBadge`, `FeatureGate`, `StatCard`.
>
> **Done when:** a user can log in, see the shell, switch ranch scope with the URL updating, collapse the sidebar, distinguish a pending-sync state from a conflict state in the indicator, and the whole thing works at 390px.

---

## Session 3 — The Animal Register _(anchor 2)_

> Build the animal register at `/animals`. This is the most demanding component in the product — treat it accordingly.
>
> Build a reusable `DataTable` in `components/patterns/` on TanStack Table v8 in **full manual mode** (`manualSorting`, `manualFiltering`, `manualPagination`), then use it for the animal register.
>
> Requirements:
>
> - **Server-side everything.** Sorting, filtering, and pagination all execute in Postgres against `v_animal_current` joined to `v_animal_attention_summary` for the badge column — **not** `v_animals_requiring_attention`, which returns multiple rows per animal and will duplicate register rows if joined directly. Assume 50,000 rows.
> - **Pagination is the primary mechanism, not virtualization.** Default page size 50, selectable 25/50/100/200, in the URL search params. **Row virtualization only engages when the selected page size exceeds 100** — at 25/50/100 the table renders plainly; it exists specifically to keep the 200-row "dense view" option responsive. Don't build it to run unconditionally alongside pagination controls; that's two competing patterns fighting for the same job.
> - **URL-encoded state** via TanStack Router typed search params: ranch, species, breed, sex, status, section, date range, sort, page, page size, search. A filtered view must be shareable as a link.
> - **Faceted filters** with live counts (reflecting the other active filters, not just a flat count): ranch, species, sex, status, section.
> - **Search** on tag number and name, debounced 250ms, using the trigram indexes. Partial matches must work.
> - **Columns:** photo thumbnail (32px, rounded, fallback to a species glyph), tag number (mono, tabular), name, species, breed, sex, age (derived from DOB, "~" when estimated), ranch, section, status badge, attention badge (from the summary view), last event date. Column visibility toggle; persists per user.
> - **Row selection** with a floating bulk action bar on selection: Record vaccination · Record treatment · Record weight · Transfer · Change status · Export. Shows "24 animals selected" and a clear-selection action.
> - **Row click** opens the animal profile. Row hover reveals a quick-actions menu.
> - **Density toggle:** comfortable / compact — independent of the pagination/virtualization behaviour above, this is purely a row-height preference.
> - **Empty state:** "No animals recorded yet" with a primary action pointing to Enrollment Mode and a secondary "Add one animal." If filters are active instead, say so and offer to clear them.
> - Loading state is a skeleton table matching the real column widths — never a spinner.
>
> All Supabase access goes through `features/animals/api.ts`. All query keys through the central factory.
>
> **Done when:** 5,000 seeded animals filter and sort in under 300ms, every filter is in the URL, bulk selection works, and the attention badge column correctly shows one badge per animal even for animals with multiple open reasons.

---

## Session 4 — The Animal Profile and Timeline _(anchor 3 — the signature screen)_

> Build the animal profile at `/animals/$animalId`. This is the screen that makes the product make sense to the client. Give it real care.
>
> **Header:** large photo (upload/replace affordance), tag number in mono at display size, name, species and breed, sex glyph, age with estimated indicator, current ranch and section, status badge, attention badges. Primary actions: Record health event · Record weight · Transfer · Edit. Overflow menu: Record death and Change status, both behind a naming confirm dialog.
>
> **Tabs:** Overview · Health · Weights · Breeding · Movements · Feeding & Care · Lineage · Documents · **Timeline**.
>
> - **Overview** — summary grid: identity, dates, parents (linked), last vaccination, last treatment, last vet visit, last weight with ADG, current pregnancy status if relevant, three most recent events.
> - **Health** — sub-sections for vaccinations, treatments, illnesses, vet visits, each a compact table with a record action. Active withdrawal period shows as a prominent ochre banner: "Not for sale or slaughter until 14 March 2027."
> - **Weights** — Recharts line chart over time, points coloured by measurement method, ADG between consecutive records in a table beneath. If only BCS exists, chart that on a 1–5 axis instead. Empty state explains a scale isn't required.
> - **Lineage** — recursive family tree via `get_ancestors`/`get_descendants`, selected animal centred, three generations by default with expansion, each node a card with photo/tag/sex, clicking navigates.
> - **Timeline — the signature element.** Single vertical spine, reverse chronological: born or acquired, every vaccination, treatment, illness onset/resolution, vet visit, weight, movement, breeding, birth given, death. Each event type its own marker shape and semantic colour. Sticky month headers. Each entry: date in mono, plain-language description ("Vaccinated against lumpy skin disease"), who recorded it, expands in place. Filterable by event type. This is the one place the design is allowed to be memorable.
> - **Documents** — reads from `attachments` (`entity_type = 'animal'`), upload/view/download, signed URLs only.
>
> **Done when:** every tab renders real data, the timeline reads as a coherent life story, and the whole profile works at 390px.

---

## Session 5a — Offline thin slice _(field-test checkpoint — build this before 5b)_

> **This is deliberately the smallest possible slice, not a shortcut on the way to the full Enrollment Mode.** Read `blueprint.md` §0.5 #13 and §6 (Part 7 milestones, M2a) before starting: the entire offline architecture is a bet made on paper, and this session exists to test it against reality before more is built on top of it.
>
> Build only:
>
> 1. `lib/media/` — image pipeline: resize to max 1600px long edge, re-encode to WebP targeting ≤200 KB, generate a 320px thumbnail, entirely client-side before any network call. Show the compressed size to the user.
> 2. `lib/offline/` — a Dexie database with a `writeQueue` table (client-generated UUIDv7 id, operation type, payload, photo blobs, `created_by` **stamped by the client at write time, not left to the server trigger**, created_at, attempt count, last error, `status: 'pending' | 'syncing' | 'synced' | 'conflict' | 'failed'`). A sync worker drains the queue on reconnect and on an interval, photo first then record, exponential backoff on transient failures. **On a `unique_violation` from the server (a duplicate `tag_number`), mark that entry `conflict` — do not retry it automatically and do not drop it.** Support only `create_animal` and `attach_photo` for this session; the other three operations arrive in 5b.
> 3. The minimum enrollment screen: camera opens via `capture="environment"`, shutter, then tag number (plain text input is fine here — no auto-increment yet, no species/sex quick-entry, no "add more detail"), save, back to camera. No progress strip, no session summary.
>
> **Then stop and field-test it.** Enrol ten animals with the network disabled in devtools, on the actual target device if it's available yet, reload the page, re-enable the network, confirm all ten sync with photos intact. If a real device and real rural-equivalent signal are available for this session, use them — this is the point of building the slice this small.
>
> **Done when:** the ten-animal offline round-trip works, and you can report honestly on compressed photo size, perceived save latency, and anything that felt slow enough to worry about before Session 5b adds polish on top of it.

---

## Session 5b — Enrollment Mode, Batch Enrollment, and the rest of the offline queue _(anchor 4 — highest stakes)_

> Build out the rest of Enrollment Mode and the new Batch Enrollment flow, on top of the infrastructure from 5a. Read `blueprint.md` §0.6 #1 and #2 first — both the tag-prefix system and Batch Enrollment are new since the original design and change this session's scope.
>
> **Finish the offline queue:** extend `writeQueue` to support all five operations (`create_animal`, `attach_photo`, `create_health_event`, `create_weight`, `create_movement`). Persist the TanStack Query cache to IndexedDB, kept as a separate mechanism from the write queue — one is a read cache, one is a write log, don't merge them.
>
> **Live Enrollment Mode, full flow, mobile-first at 390px:**
>
> - Full screen, no sidebar, single column, thumb-reachable. Exit control returns to the app with a session summary.
> - **Step 1 — photo.** Camera opens immediately. Large shutter. Retake and skip both available.
> - **Step 2 — identity.** Tag number (numeric keypad), species (large tap targets, remembers last), sex (three large targets, remembers last), Save. **Tag number auto-suggests from the selected species' `default_tag_prefix`** (goat → `M`, cattle → `MUX `, per the client's existing convention — don't invent a different default format) **plus the next number**: when online, from the `next_tag_number(org_id, prefix)` RPC; when offline, from a small local counter per prefix that the client tracks itself without a round trip. Either way the field stays freely editable — a purchased animal's tag may not fit the pattern at all, and the suggestion must never become a constraint. Everything else (breed, colour, DOB, dam, sire, section, notes) collapses behind "Add more detail."
> - On save: write to the queue with `created_by` stamped explicitly, 600ms confirmation, straight back to the camera. Never a full page reload.
> - **Duplicate detection** against the local queue and server cache at entry time. This is a first line of defence, not the only one — the sync-time `conflict` handling from 5a is what catches the case this can't (two people enrolling offline at once).
> - Persistent progress strip: "63 animals recorded today · 12 waiting to sync."
> - Session summary on exit: count enrolled, thumbnails, sync status, "Continue enrolling" action.
>
> **Batch Enrollment from Photos — new flow, desktop-sized, at `/enroll/batch`:**
>
> - Upload a folder or multi-select of photos (any source — this is explicitly for photos taken earlier with the phone's own camera app, not our camera capture).
> - Grid, ordered by EXIF timestamp where available, falling back to file order.
> - Click a photo → the same four identity fields as live Enrollment Mode, but **keyboard-first**: tab order goes tag → species → sex → save, no need to reach for the mouse between animals. Same tag-prefix suggestion logic as above.
> - Runs through the identical `lib/media/` pipeline and the identical `create_animal` queue operation as live Enrollment Mode — this is a different capture surface over the same underlying flow, not a parallel implementation. If you find yourself duplicating the compression or queue logic here, stop and extract the shared piece instead.
> - Same duplicate detection as live mode.
>
> **Also build the Tag Range Generator** at `/enroll/tags` — pre-create placeholder records across a numbered range using `next_tag_number` in bulk (e.g. reserve `MUX 501`–`MUX 550` in one call), for ranches that number physical tags before working the animals.
>
> Write Vitest tests for the queue: records survive a page reload, drain in order, retry correctly after a transient failure, and **a `unique_violation` reply correctly lands the entry in `conflict` state rather than retrying forever or silently vanishing.**
>
> **Done when:** you can enrol ten animals offline through either surface (live camera or a batch upload) with the network disabled, reload, re-enable, and watch everything sync with photos intact — and deliberately create a tag collision between two "users" to confirm it lands as a visible conflict, not a crash or a silent loss.

---

## Session 6 — Record Vaccination drawer _(anchor 5 — the universal record pattern)_

> Build the record-vaccination flow. It is small, but it establishes the pattern that fifteen other "record X" actions will copy exactly — so get it right and document it.
>
> - Opens in `RecordDrawer` over whatever the user was doing. The user never loses their place in a list of 400 animals.
> - Reachable from three entry points, all sharing one component: the dashboard quick-action bar, the animal profile, and the register's bulk action bar.
> - Fields: animal(s) — pre-filled and read-only when entered from a profile or a selection, otherwise a searchable multi-select; vaccine (combobox from the catalogue, filtered by the selected animal's species where the vaccine has one set, with an inline "add new vaccine" affordance); date administered (defaults to today); dose; batch number; route; administered by (defaults to current user, changeable, with a veterinarian option); next due date (auto-calculated from the vaccine's default interval, editable, calculation shown in plain words); notes.
> - React Hook Form + Zod, schema exported from `features/health/schema.ts` for reuse.
> - Optimistic update, rollback on failure, TanStack Query invalidation of the animal, the register, and both attention views.
> - When multiple animals are selected, route through `bulk_health_event` so one action writes N individual records.
> - Toast on success: "Vaccination recorded for 24 animals" with an Undo holding 8 seconds.
> - Dirty-close warning.
> - Queues offline via `create_health_event`, with `created_by` stamped client-side the same way `create_animal` is.
>
> Then write `docs/patterns/record-drawer.md` documenting this as the canonical pattern.
>
> **Done when:** the drawer works from all three entry points, bulk mode writes N records, and it functions offline.

---

## Session 7 — The Owner Dashboard _(anchor 6)_

> Build the dashboard at `/`. Follow blueprint.md §5 (design direction) strictly: **one dominant metric, five to nine elements on the default view, everything else behind a drill-down.** Resist the urge to fill space.
>
> **Owner variant:**
>
> - **Dominant metric, top-left:** total active animals from `v_org_stats`, set three times larger than anything around it, in mono, with a trend against last month. Directly beside it, its counterpoint: **animals requiring attention**, sourced from `v_animal_attention_summary` (worst-severity counts, not the raw per-reason view), in critical/warn colour, linking to the Attention Queue.
> - **Ranch comparison strip:** one card per ranch — cover image, headcount, species split, attention count.
> - **Livestock by species** — compact horizontal bar.
> - **Male / female split** — single stacked bar with counts.
> - **Upcoming** — merged, date-sorted list of vaccinations and vet follow-ups due in the next 30 days, capped at eight with "view all."
> - **Recent activity** — unified feed from `v_recent_activity`, ten items, each linking to its animal.
> - **Quick Actions** — persistent bar, the nine actions from the client's §7.2, each opening the relevant drawer.
> - **Global filters** — date range and species, applied to every widget at once, encoded in the URL.
>
> **Manager variant:** identical structure, scoped to assigned ranches, ranch comparison strip omitted when only one ranch is assigned.
>
> All data from Postgres views. No client-side aggregation.
>
> **First-run state:** when the org has zero animals — which, per `blueprint.md` §0.6 #4, may also mean zero ranches, since ranch creation is entirely the owner's own first-run action now, not seeded — replace the whole dashboard with an onboarding checklist: create your first ranch, add your species (with a tag prefix, if he wants the suggestion feature to work from day one), start enrolling. Make it welcoming, not empty — this is what the client sees before anything else in the product.
>
> **Done when:** both variants render from views, global filters drive every widget, and first-run shows the checklist and survives the genuinely-zero-ranches case without breaking.

---

# Part 4 — Guardrail prompts

Same three as before, updated to check for the specific mistakes this project has already made once.

## 4.1 State audit — run before any new agent instance writes code

> Before you write or modify anything, produce a state audit. Do not skip this and do not begin coding until I have replied.
>
> 1. Read `CLAUDE.md` and `blueprint.md` and confirm you have understood the stack, tokens, and the corrected rules. State the three rules you consider most likely to be accidentally violated — and specifically check whether either of these two has crept back in anywhere: a `movements` policy or RPC that grants access via the destination ranch, or a blanket `is_owner()`-only policy on `profiles`.
> 2. Run `git log --oneline -15` and `git status`. Report the current branch and whether the tree is clean.
> 3. List every file under `src/features/` and `supabase/migrations/`, and state what appears to be built.
> 4. Run `pnpm typecheck`, `pnpm lint` and `pnpm build`. Report the actual results — do not assume they pass.
> 5. Fill in this table honestly:
>
> | Session                                         | Scope | Status                                 | Evidence         |
> | ----------------------------------------------- | ----- | -------------------------------------- | ---------------- |
> | S0 Scaffold & tokens                            |       | Complete / Partial / Missing / Unknown | files or commits |
> | S1 Database & RLS                               |       |                                        |                  |
> | S2 Auth & App Shell                             |       |                                        |                  |
> | S3 Animal Register                              |       |                                        |                  |
> | S4 Animal Profile                               |       |                                        |                  |
> | S5a Offline thin slice + field test             |       |                                        |                  |
> | S5b Enrollment, Batch Enrollment, offline queue |       |                                        |                  |
> | S6 Record drawer                                |       |                                        |                  |
> | S7 Dashboard                                    |       |                                        |                  |
>
> 6. Specifically check and report: does `tag_sequences` exist and is `next_tag_number` atomic under concurrency? Does `v_animal_attention_summary` exist separately from `v_animals_requiring_attention`, and does the register join against the summary view? Does the offline queue have a distinct `conflict` state, or does it just retry everything the same way?
> 7. List anything that looks half-finished, contradictory, or that you do not understand.
> 8. State what you believe the next task is, and wait for my confirmation.
>
> Mark anything you cannot verify as **Unknown**. A wrong "Complete" is far more damaging than an honest "Unknown."

## 4.2 Self-review — run at the end of every session

> Review the work you just completed against `CLAUDE.md` §10 (definition of done) and §11 (never do these).
>
> Go file by file through everything you created or changed and report:
>
> - Any hardcoded colour, font family or radius outside `tokens.css`
> - Any `any`, `@ts-ignore`, or unhandled promise
> - Any data-fetching view missing a loading, empty or error state
> - Any table fetched in full to be filtered or counted client-side
> - Any new table without an RLS policy or without a pgTAP test
> - **If you touched `movements` or `profiles` this session: does the policy match CLAUDE.md §7 exactly, or has either the OR-endpoint shortcut or the blanket owner-only policy reappeared?**
> - Any interactive element unreachable by keyboard or missing a focus ring
> - Any copy that breaks the §5 rules — system language, title case, vague errors, "No data" empty states
> - Anything you left as a TODO
>
> Fix everything you can fix without new decisions. List anything requiring a decision from me. Then state, in one paragraph, what you built, what you deliberately skipped, and what you assumed.

## 4.3 Safe resume — after a crash, credit exhaustion, or model switch

> The previous session ended unexpectedly and you may be missing context. Assume nothing about what was completed.
>
> 1. Run the state audit in 4.1 in full.
> 2. Additionally, run `git diff HEAD` and report any uncommitted work.
> 3. Identify anything that appears to be **mid-change** — a half-written migration, a component importing something that does not exist, a feature folder with an `api.ts` but no components.
> 4. Recommend one of: (a) commit the uncommitted work as-is, (b) complete the half-finished change first, or (c) revert to the last clean commit. Give your reasoning.
>
> **Do not write any new feature code until I have chosen.**

---

# Part 5 — After the anchors

Once Sessions 0–7 (5a and 5b counted as one milestone) are complete, you have a deployable spine and every pattern in the product is established. The remaining thirty-odd screens are recombinations of what already exists.

Order for the rest, following `blueprint.md` Part 7:

- **M3 remainder** — treatments, illnesses, vet visits, veterinarians, attention queue (built against `v_animals_requiring_attention`, the per-reason view — the register and dashboard already use the summary view from Session 3/7), bulk weigh day
- **M4** — movements register + transfer wizard (both calling `record_movement`, never a raw insert), mortality, breeding, family tree, breeding calendar
- **M5** — feeding log, care activities, manager dashboard variant
- **M6** — thirteen §17 reports, command palette, global search
- **M7** — admin, users (self-service profile edits now live from Session 1's corrected policy), reference data manager (including `default_tag_prefix` as an editable field per species), audit log, org settings (`stale_health_days` editable here), hardening
- **M8** — UAT, training, launch. No historical migration, by design — the owner's own enrollment sessions **are** the data load.

**One suggestion, updated from the original pack.** Session 5a already puts a thin offline slice in front of the client early rather than waiting until the whole spine is done — that was the single biggest sequencing change in v3.0, precisely so this suggestion doesn't come too late to act on. Once 5b is done, put both enrollment surfaces in front of him on his own hardware: the live mobile flow outside with real signal, and a stack of photos taken earlier fed through Batch Enrollment on whatever laptop he'd actually use. Which one he reaches for by habit after a week is a better answer than any amount of further design review.
