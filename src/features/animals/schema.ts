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
  sort: z.string().optional(),
  sortDir: z.enum(["asc", "desc"]).optional(),
  page: z.number().int().min(0).optional(),
  pageSize: z.union([z.literal(25), z.literal(50), z.literal(100), z.literal(200)]).optional(),
});

export type AnimalsSearch = z.infer<typeof animalsSearchSchema>;

export const DEFAULT_SORT = "tag_number";
export const DEFAULT_SORT_DIR = "asc";
export const DEFAULT_PAGE_SIZE: PageSize = 50;

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
    !!search.search
  );
}
