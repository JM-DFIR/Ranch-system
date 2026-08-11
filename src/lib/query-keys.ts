// Centralised TanStack Query key factory (CLAUDE.md §3). Every feature
// adds its own namespace here rather than inlining ad hoc key arrays —
// this is the single place invalidation logic can look to see what
// keys exist and how they nest.
export const queryKeys = {
  profile: {
    self: (userId: string) => ["profile", userId] as const,
  },
  ranches: {
    all: (orgId: string) => ["ranches", orgId] as const,
    list: (orgId: string) => ["ranches", orgId, "list"] as const,
    detail: (orgId: string, ranchId: string) => ["ranches", orgId, "detail", ranchId] as const,
  },
  animals: {
    all: (orgId: string) => ["animals", orgId] as const,
    // `params` is intentionally untyped here (kept in features/animals/api.ts,
    // not imported into lib) — this factory only owns key shape/namespacing,
    // not the param contract.
    register: (orgId: string, params: unknown) => ["animals", orgId, "register", params] as const,
    facetCounts: (orgId: string, params: unknown) => ["animals", orgId, "facet-counts", params] as const,
    filterOptions: (orgId: string) => ["animals", orgId, "filter-options"] as const,
    // Single-animal profile (Session 4) — a separate sub-tree keyed by
    // animalId rather than orgId, since these are detail reads, not
    // list reads; invalidating one animal's profile shouldn't touch
    // the register's cached pages.
    detail: (animalId: string) => ["animals", "detail", animalId] as const,
    profile: (animalId: string) => ["animals", "detail", animalId, "profile"] as const,
    lineage: (animalId: string, direction: string) => ["animals", "detail", animalId, "lineage", direction] as const,
    documents: (animalId: string) => ["animals", "detail", animalId, "documents"] as const,
    timeline: (animalId: string, eventType: string | undefined) =>
      ["animals", "detail", animalId, "timeline", eventType] as const,
    summaries: (ids: string[]) => ["animals", "summaries", [...ids].sort()] as const,
  },
  health: {
    vaccinations: (animalId: string) => ["health", "vaccinations", animalId] as const,
    treatments: (animalId: string) => ["health", "treatments", animalId] as const,
    illnesses: (animalId: string) => ["health", "illnesses", animalId] as const,
    vetVisits: (animalId: string) => ["health", "vet-visits", animalId] as const,
    // Reference data for the Record Vaccination drawer (Session 6) —
    // its own sub-tree, not nested under an animalId, since these are
    // org-wide catalogue reads, not per-animal ones.
    vaccineOptions: (orgId: string, speciesId: string | undefined) =>
      ["health", "vaccine-options", orgId, speciesId] as const,
    administeredByOptions: (orgId: string) => ["health", "administered-by-options", orgId] as const,
  },
  weights: {
    series: (animalId: string) => ["weights", "series", animalId] as const,
  },
  breeding: {
    events: (animalId: string) => ["breeding", "events", animalId] as const,
    pregnancyChecks: (breedingEventId: string) => ["breeding", "pregnancy-checks", breedingEventId] as const,
    births: (animalId: string) => ["breeding", "births", animalId] as const,
  },
  movements: {
    list: (animalId: string) => ["movements", "list", animalId] as const,
  },
  feeding: {
    records: (animalId: string) => ["feeding", "records", animalId] as const,
    careActivities: (animalId: string) => ["feeding", "care-activities", animalId] as const,
  },
} as const;
