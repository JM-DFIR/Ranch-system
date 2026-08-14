import { z } from "zod";

// Shared by every report viewer (M6 — session-pack.md Part 5). `ranch`
// is already global via `_authenticated`. `species` only narrows the
// five reports that are already species-grouped in their own view
// (Inventory, Vaccination Compliance, Breeding Performance, Weight &
// Growth, and Attention Summary reads it via a join) — the seven
// "monthly count" reports (treatments, illnesses, movements,
// mortality, feeding, care, births) aren't species-columned in their
// views, so this filter is a no-op there rather than a wall of unused
// species dropdowns across reports where it wouldn't mean much anyway.
export const reportSearchSchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  species: z.string().optional(),
});

export type ReportSearch = z.infer<typeof reportSearchSchema>;
