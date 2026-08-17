import { z } from "zod";

export const PAGE_SIZES = [25, 50, 100, 200] as const;
export type PageSize = (typeof PAGE_SIZES)[number];

// URL-encoded register state (blueprint.md, Session 3) — deliberately
// single-value per facet, not arrays: blueprint's own example
// (`/animals?ranch=x&species=goat&status=active`) is scalar, and it
// keeps the URL clean rather than JSON-encoded arrays. `ranch` itself
// is NOT here — that's `_authenticated`'s search param (Session 2),
// shared app-wide, not duplicated per-route. Defaults are applied at
// the point of use, not baked in here, so the URL stays minimal.
export const animalsSearchSchema = z.object({
  species: z.string().optional(),
  breed: z.string().optional(),
  sex: z.enum(["male", "female", "unknown"]).optional(),
  status: z.string().optional(),
  section: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  search: z.string().optional(),
  // "1" = only animals with an open attention reason (any severity).
  // The dashboard's attention counterpoint metric (Session 7) links
  // here rather than to a standalone Attention Queue screen, which
  // isn't built yet (blueprint.md Part 4's coverage matrix lists it
  // under the future Health module) — this makes that link land
  // somewhere real today instead of a disabled placeholder.
  attention: z.literal("1").optional(),
  sort: z.string().optional(),
  sortDir: z.enum(["asc", "desc"]).optional(),
  page: z.number().int().min(0).optional(),
  pageSize: z.union([z.literal(25), z.literal(50), z.literal(100), z.literal(200)]).optional(),
});

export type AnimalsSearch = z.infer<typeof animalsSearchSchema>;

export const DEFAULT_SORT = "tag_number";
export const DEFAULT_SORT_DIR = "asc";
export const DEFAULT_PAGE_SIZE: PageSize = 50;

// Edit Animal — every identity field enrollment collects, minus the two
// with their own dedicated, purpose-built flows already: ranch (Transfer,
// which resolves from_ranch_id server-side and has its own access-control
// story, CLAUDE.md §7 — a plain field edit here would bypass all of that)
// and status (Change status / Record death). Photo replacement is out of
// scope too — it needs the camera/compression pipeline, not a form field.
export const animalEditSchema = z
  .object({
    tagNumber: z.string().min(1, { error: "Tag number is required." }),
    name: z.string().optional(),
    speciesId: z.string().min(1, { error: "Choose a species." }),
    breedId: z.string().optional(),
    sex: z.enum(["male", "female", "unknown"], { error: "Choose a sex." }),
    color: z.string().optional(),
    dateOfBirth: z.string().optional(),
    dobIsEstimated: z.boolean(),
    acquisitionType: z.enum(["born_on_ranch", "purchased", "gift", "unknown"], { error: "Choose how this animal was acquired." }),
    acquisitionDate: z.string().optional(),
    damId: z.string().optional(),
    sireId: z.string().optional(),
    sectionId: z.string().optional(),
    anitracAin: z.string().optional(),
    notes: z.string().optional(),
  })
  .refine((data) => !data.dateOfBirth || data.dateOfBirth <= new Date().toISOString().slice(0, 10), {
    error: "Date of birth can't be in the future.",
    path: ["dateOfBirth"],
  })
  .refine((data) => !data.acquisitionDate || data.acquisitionDate <= new Date().toISOString().slice(0, 10), {
    error: "Acquisition date can't be in the future.",
    path: ["acquisitionDate"],
  })
  .refine((data) => !data.anitracAin || /^\d{15}$/.test(data.anitracAin), {
    // Matches animals.anitrac_ain's own check constraint exactly
    // (0006_animals.sql: `anitrac_ain ~ '^[0-9]{15}$'`) — caught here,
    // in plain language, instead of surfacing Postgres's raw
    // check-violation message as a generic "Couldn't save changes."
    error: "ANITRAC AIN must be exactly 15 digits.",
    path: ["anitracAin"],
  })
  .refine((data) => !data.damId || !data.sireId || data.damId !== data.sireId, {
    error: "Dam and sire can't be the same animal.",
    path: ["sireId"],
  });

export type AnimalEditValues = z.infer<typeof animalEditSchema>;

// Shared by FilterBar (its own "Clear filters" button) and
// AnimalRegisterPage (which empty-state copy to show) — one
// definition of "a filter is active" so the two can't drift.
export function hasActiveAnimalFilters(search: AnimalsSearch, ranch: string | undefined): boolean {
  return (
    !!ranch ||
    !!search.species ||
    !!search.breed ||
    !!search.sex ||
    !!search.status ||
    !!search.section ||
    !!search.dateFrom ||
    !!search.dateTo ||
    !!search.search ||
    !!search.attention
  );
}
