# The record-drawer pattern

Established in Session 6 by the Record Vaccination drawer
(`src/features/health/components/RecordVaccinationDrawer.tsx`). Every
other "record X" action — treatment, weight, movement, care activity,
and the rest of blueprint.md's fifteen — copies this shape exactly.
Read this before building any of them; don't rederive the pattern from
scratch per feature.

## Why a shared pattern, not fifteen bespoke forms

The client enters most data from a list of hundreds of animals or from
a single animal's profile. Losing that place — a full-page form,
a redirect, a lost scroll position — is the exact failure mode this
pattern exists to prevent. One container, one mutation shape, one set
of conventions, so every record action feels identical no matter which
one it is.

## The container: `RecordDrawer`

`src/components/patterns/RecordDrawer.tsx`. A 480px right-hand sheet
over whatever the user was doing. Owns:

- Focus trap and Escape-to-close (from the underlying Radix `Sheet`).
- The dirty-close warning — pass `isDirty` (react-hook-form's
  `formState.isDirty`) and closing via Escape, overlay click, or a
  cancel button all funnel through the same confirm-before-discard
  dialog. Don't build a second dirty-check elsewhere.

Every "record X" form is `<RecordDrawer>`'s `children` — the drawer
itself never knows what's inside it.

## The three entry points

Every record action must be reachable from all three, sharing the one
drawer component:

1. **The animal profile** (`ProfileHeader.tsx` and similar) — the
   animal is pre-filled and **read-only**. Pass it as
   `preselectedAnimals` with exactly one entry.
2. **The register's bulk action bar** (`BulkActionBar.tsx`) — the
   current selection is pre-filled and **read-only**. Pass the
   selected rows as `preselectedAnimals`.
3. **The dashboard quick-action bar** (Session 7, not built yet as of
   Session 6) — no pre-selection. The drawer falls back to a
   **searchable multi-select** (`MultiCombobox`) so the user picks
   animals from scratch. Wire `searchableAnimals` once the dashboard
   exists; don't build a placeholder animal list ahead of that need.

A drawer component's props should always look like:

```ts
interface RecordXDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedAnimals?: { id: string; tagNumber: string; speciesId: string | null }[];
  searchableAnimals?: { id: string; tagNumber: string; speciesId: string | null }[];
}
```

`isReadOnlySelection = !!preselectedAnimals && preselectedAnimals.length > 0`
decides which of the two animal-picker UIs renders.

## Fields — the shared conventions

- **Combobox, not a plain `<Select>`**, for anything filtered from a
  catalogue with more than a handful of options (`src/components/
  patterns/Combobox.tsx`, built on `cmdk` + `Popover`). Vaccines,
  medications, veterinarians all qualify.
- **Inline "add new" on catalogue fields.** `Combobox`'s `onCreateNew`
  prop — reference tables are writable by any org member since
  `0021_reference_catalogue_manager_write.sql`, so this is a real
  insert, not owner-gated.
- **Filtered by species where the record type has one set, but only
  when the selection is single-species.** A mixed-species bulk
  selection sees the unfiltered catalogue rather than an arbitrary
  single species' filter — don't guess which species "wins."
- **"Administered/performed by" is a tagged union**, not two optional
  columns: `{ type: "profile"; id: string } | { type: "veterinarian"; id: string }`.
  This is what keeps the row from ever landing with both or neither
  set. Defaults to the current user (`type: "profile"`).
- **Auto-calculated, editable, plain-language fields** (next due date
  from a vaccine's `default_interval_days`, a treatment's withdrawal
  date from a medication's `default_withdrawal_days`, etc.): compute
  once when the driving field changes, but stop overwriting the moment
  the user edits the calculated field by hand. Same "suggestion, never
  a constraint" rule Enrollment Mode's tag suggestion already follows
  (`lib/offline/tagCounter.ts`) — track a `*Touched` boolean, don't
  fight the user's own edit.

## Schema

One Zod schema per record type, exported from
`features/<domain>/schema.ts` for reuse across the form, and later, any
CSV importer that writes the same shape. Zod 4 syntax throughout
(`error:`, not v3's `message:` — CLAUDE.md pins the major version).

## The mutation

`useMutation` with this exact shape (see `features/health/hooks.ts`'s
`useRecordVaccination` for the reference implementation):

1. **`mutationFn`** calls the feature's own `record<X>()` in
   `features/<domain>/api.ts`, which itself branches on
   `navigator.onLine`:
   - **Online:** calls the SECURITY DEFINER bulk RPC directly
     (`bulk_health_event`, `bulk_weight_event`, `record_movement`, ...).
   - **Offline:** calls the matching `enqueueCreate<X>()` in
     `lib/offline/queue.ts`, with `createdBy` stamped from the current
     profile explicitly — never left to the audit trigger, since a
     future service-role relay would have no `auth.uid()` to fall back
     on (CLAUDE.md §8).
   - Return a result that carries what Undo needs: created row ids
     when online, the queue entry's id when offline. Don't return
     `void` — Undo can't reverse a write it can't address.
2. **`onMutate`** — optimistic update, but only for the single-animal
   case. Patch the one query most likely already on screen (the
   record type's own list for that animal); a bulk selection isn't
   worth patching N separate caches ahead of the real data when the
   toast already confirms the write. Snapshot the previous cache value
   for rollback.
3. **`onError`** — restore the snapshot.
4. **`onSettled`** — invalidate, for every affected animal: that
   record type's own list, the animal's detail/profile query, and the
   org-wide `animals.all` key (covers the register and both attention
   views, since neither has its own separate cache entry — they're
   embedded in `v_animal_current`'s columns).
5. **Bulk mode routes through the RPC's own `p_animal_ids` array** —
   one call writes N individual records (CLAUDE.md's
   individual-record-first rule), never a loop of N separate calls.

## The online-only variant

Added in Session 8 (Record Treatment / Record Illness / Record Vet
Visit — `src/features/health/components/RecordTreatmentDrawer.tsx` is
the reference). CLAUDE.md §8's five offline-queued operations are
fixed — `create_animal`, `attach_photo`, `create_health_event`,
`create_weight`, `create_movement`. Everything else, including these
three and eventually breeding/birth/mortality, is **online-only**:

- `record<X>()` in `api.ts` calls the RPC directly, with no
  `navigator.onLine` branch and no `enqueueCreate<X>()` — there is
  nothing for the offline queue to do here, and adding one would be
  building offline support CLAUDE.md never asked for.
- The drawer reads `useOnlineStatus()` (`lib/hooks/useOnlineStatus.ts`)
  and renders `<OfflineBlock />` (`components/patterns/OfflineBlock.tsx`)
  when offline — "you're offline, this needs a connection" — with the
  submit button disabled to match, rather than letting the form submit
  into a network call that's guaranteed to fail.
- Everything else about the drawer — schema, entry points, Combobox
  fields, mutation invalidation shape, toast + Undo — is identical to
  the offline-eligible flows above.

Use `CatalogueOrCustomField` (`components/patterns/
CatalogueOrCustomField.tsx`) for any field shaped like `medication_id`/
`custom_medication` — a real either/or in the schema (unlike vaccine's
catalogue-only `vaccine_id`), not something to flatten into a single
combobox for convenience.

## Toast and Undo

`toast.success("<Outcome>", { duration: 8000, action: { label: "Undo", onClick: ... } })`.
The outcome names itself — "Vaccination recorded" / "Vaccination
recorded for 24 animals" — never "Success" (CLAUDE.md §5).

Undo must be a **real reversal**, not a decorative button:

- **Online:** soft-delete the exact rows the RPC returned
  (`deleted_at = now()` — still no hard DELETE, an undo is a deletion
  too).
- **Offline:** cancel the queue entry outright via
  `cancelQueuedEntry()`, which only succeeds while the entry is still
  `'pending'` — if the sync worker already picked it up, there's a
  real write to reason about, not a queue entry to drop, so undo
  correctly declines rather than racing the sync worker.

## Checklist for the next "record X" flow

- [ ] Schema in `features/<domain>/schema.ts`, Zod 4 syntax.
- [ ] `record<X>()` in `features/<domain>/api.ts`, branching on
      `navigator.onLine`, calling the same RPC both the online path
      and the offline sync worker use.
- [ ] `enqueueCreate<X>()` in `lib/offline/queue.ts` if it doesn't
      already exist, returning the entry id.
- [ ] Sync handler in `lib/offline/sync.ts` if the operation type is
      new (all five from CLAUDE.md §8 already have handlers as of
      Session 5b — treatment/weight/movement's own record actions
      still need their own drawers, not new queue plumbing).
- [ ] `use<X>Options` hooks for any catalogue fields, `useRecord<X>()`
      mutation hook following the shape above.
- [ ] Drawer component: `RecordDrawer` container,
      `preselectedAnimals`/`searchableAnimals` props, `Combobox`/
      `MultiCombobox` for catalogue and animal fields, dirty-close via
      `isDirty`.
- [ ] Wired from all three entry points that exist yet (profile,
      register bulk bar; dashboard quick-actions once Session 7 ships).
- [ ] Toast with a real Undo.
