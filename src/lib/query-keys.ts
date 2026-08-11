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
} as const;
