import { z } from "zod";

// The dashboard's own URL-encoded filters (session-pack.md, Session 7:
// "date range and species... encoded in the URL"). `ranch` is NOT here
// — that's `_authenticated`'s search param (Session 2), already global
// app-wide, reused as-is rather than duplicated. Scalar, matching the
// same shape convention `animalsSearchSchema` already established.
export const dashboardSearchSchema = z.object({
  species: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export type DashboardSearch = z.infer<typeof dashboardSearchSchema>;

export function hasActiveDashboardFilters(search: DashboardSearch): boolean {
  return !!search.species || !!search.dateFrom || !!search.dateTo;
}
