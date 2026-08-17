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
    // Ranches module (blueprint.md §4.1) — statsList backs the List
    // page's cards (v_ranch_stats), detail/sections are keyed by
    // ranchId alone, same convention as animals.detail(animalId): a
    // ranch id is already globally unique, no org scoping needed in
    // the cache key itself (RLS already scopes the data).
    statsList: (orgId: string) => ["ranches", orgId, "stats-list"] as const,
    detail: (ranchId: string) => ["ranches", "detail", ranchId] as const,
    sections: (ranchId: string) => ["ranches", "detail", ranchId, "sections"] as const,
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
    // Session 8 — Record Treatment/Illness/Vet Visit reference options.
    medicationOptions: (orgId: string) => ["health", "medication-options", orgId] as const,
    illnessTypeOptions: (orgId: string) => ["health", "illness-type-options", orgId] as const,
    veterinarianOptions: (orgId: string) => ["health", "veterinarian-options", orgId] as const,
    veterinarianDirectory: (orgId: string) => ["health", "veterinarian-directory", orgId] as const,
    attentionQueue: (orgId: string, ranchId: string | undefined) => ["health", "attention-queue", orgId, ranchId] as const,
    // The animal profile's own "why is this flagged" list — the same
    // per-reason view as the queue, filtered to one animal, so a badge
    // reading "2 issues" always has somewhere to actually show them.
    animalAttentionReasons: (animalId: string) => ["health", "animal-attention-reasons", animalId] as const,
    // The four standalone health registers (Part 5's "M3 remainder").
    vaccinationRegister: (orgId: string, params: unknown) => ["health", orgId, "vaccination-register", params] as const,
    treatmentRegister: (orgId: string, params: unknown) => ["health", orgId, "treatment-register", params] as const,
    illnessRegister: (orgId: string, params: unknown) => ["health", orgId, "illness-register", params] as const,
    vetVisitRegister: (orgId: string, params: unknown) => ["health", orgId, "vet-visit-register", params] as const,
  },
  weights: {
    series: (animalId: string) => ["weights", "series", animalId] as const,
  },
  breeding: {
    events: (animalId: string) => ["breeding", "events", animalId] as const,
    pregnancyChecks: (breedingEventId: string) => ["breeding", "pregnancy-checks", breedingEventId] as const,
    births: (animalId: string) => ["breeding", "births", animalId] as const,
    // M4 — the standalone Breeding register and Breeding calendar.
    register: (orgId: string, params: unknown) => ["breeding", orgId, "register", params] as const,
    calendar: (orgId: string, ranchId: string | undefined) => ["breeding", orgId, "calendar", ranchId] as const,
    sireOptions: (orgId: string) => ["breeding", orgId, "sire-options"] as const,
  },
  movements: {
    list: (animalId: string) => ["movements", "list", animalId] as const,
    // M4 — the standalone Movements register.
    register: (orgId: string, params: unknown) => ["movements", orgId, "register", params] as const,
  },
  mortality: {
    // M4 — the standalone Mortality register.
    register: (orgId: string, params: unknown) => ["mortality", orgId, "register", params] as const,
  },
  feeding: {
    records: (animalId: string) => ["feeding", "records", animalId] as const,
    careActivities: (animalId: string) => ["feeding", "care-activities", animalId] as const,
    // M5 — reference options + the two standalone registers.
    feedItemOptions: (orgId: string) => ["feeding", orgId, "feed-item-options"] as const,
    careActivityTypeOptions: (orgId: string) => ["feeding", orgId, "care-activity-type-options"] as const,
    orgMembers: (orgId: string) => ["feeding", orgId, "org-members"] as const,
    feedingRegister: (orgId: string, params: unknown) => ["feeding", orgId, "feeding-register", params] as const,
    careActivityRegister: (orgId: string, params: unknown) => ["feeding", orgId, "care-activity-register", params] as const,
  },
  // Session 7 — Owner/Manager Dashboard. `filters` is the dashboard's
  // own {ranchIds, speciesId, dateFrom, dateTo} params object, kept
  // untyped here for the same reason animals.register's `params` is —
  // this factory only owns key shape, not the param contract (see
  // features/dashboard/schema.ts).
  dashboard: {
    stats: (orgId: string, filters: unknown) => ["dashboard", orgId, "stats", filters] as const,
    // Ranch stats moved to ranches.statsList (M7's Ranches module) —
    // dashboard's useRanchStats hook now keys off that directly so both
    // features share one cache entry.
    upcoming: (orgId: string, filters: unknown) => ["dashboard", orgId, "upcoming", filters] as const,
    recentActivity: (orgId: string, filters: unknown) => ["dashboard", orgId, "recent-activity", filters] as const,
    animalSearchOptions: (orgId: string) => ["dashboard", orgId, "animal-search-options"] as const,
    firstRun: (orgId: string) => ["dashboard", orgId, "first-run"] as const,
  },
  // M6 — the thirteen §17 reports. One namespace per reportId
  // (features/reports/registry.ts owns the id list), `params` untyped
  // for the same reason every other register's params key is.
  reports: {
    data: (orgId: string, reportId: string, params: unknown) => ["reports", orgId, reportId, params] as const,
  },
  // M6 — Command Palette's animal search (global search, blueprint.md
  // Part 4's "Command palette (⌘K) · Search Results").
  commandPalette: {
    animalSearch: (orgId: string, query: string) => ["command-palette", orgId, "animal-search", query] as const,
  },
  // M7 — Admin: Users & Roles, Invite User, Ranch Assignments,
  // Reference Data Manager, Organisation Settings, Audit Log.
  admin: {
    members: (orgId: string, page: number, pageSize: number) => ["admin", orgId, "members", page, pageSize] as const,
    ranchAssignments: (profileId: string) => ["admin", "ranch-assignments", profileId] as const,
    invitations: (orgId: string) => ["admin", orgId, "invitations"] as const,
    orgSettings: (orgId: string) => ["admin", orgId, "org-settings"] as const,
    auditLog: (orgId: string, params: unknown) => ["admin", orgId, "audit-log", params] as const,
    species: (orgId: string) => ["admin", orgId, "reference", "species"] as const,
    breeds: (orgId: string) => ["admin", orgId, "reference", "breeds"] as const,
    animalStatuses: (orgId: string) => ["admin", orgId, "reference", "animal-statuses"] as const,
    vaccines: (orgId: string) => ["admin", orgId, "reference", "vaccines"] as const,
    medications: (orgId: string) => ["admin", orgId, "reference", "medications"] as const,
    illnessTypes: (orgId: string) => ["admin", orgId, "reference", "illness-types"] as const,
    feedItems: (orgId: string) => ["admin", orgId, "reference", "feed-items"] as const,
    careActivityTypes: (orgId: string) => ["admin", orgId, "reference", "care-activity-types"] as const,
  },
} as const;
