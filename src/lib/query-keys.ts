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
  },
} as const;
