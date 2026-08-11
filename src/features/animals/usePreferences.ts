import { useState } from "react";
import type { OnChangeFn, VisibilityState } from "@tanstack/react-table";

import type { Density } from "@/components/patterns/DataTable";

// "Persists per user" (session-pack.md, Session 3) — read as scoped to
// the individual using this browser, not synced across every device
// they ever sign in on. That would need a `profiles.preferences`
// column and a mutation path that doesn't exist yet for what is a
// lightweight display preference; localStorage keyed by profile id is
// the proportionate choice here, same reasoning as the sidebar
// collapse state (AppShell.tsx).
function storageKey(userId: string, suffix: string) {
  return `lims:animals:${suffix}:${userId}`;
}

// `userId` is undefined for a beat while useAuth()'s profile query is
// still in flight even after the route guard confirms a session
// exists. Hydration happens as a render-time adjustment (React's
// documented pattern for "reset state when a prop changes", comparing
// against a previous value tracked in state) rather than in an effect,
// so the stored value still applies once userId becomes known instead
// of silently never loading, without costing an extra commit.
export function useColumnVisibility(userId: string | undefined) {
  const [loadedFor, setLoadedFor] = useState<string | undefined>(undefined);
  const [visibility, setVisibilityState] = useState<VisibilityState>({});

  if (userId && userId !== loadedFor) {
    setLoadedFor(userId);
    const raw = window.localStorage.getItem(storageKey(userId, "columns"));
    setVisibilityState(raw ? (JSON.parse(raw) as VisibilityState) : {});
  }

  const setVisibility: OnChangeFn<VisibilityState> = (updater) => {
    setVisibilityState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      if (userId) window.localStorage.setItem(storageKey(userId, "columns"), JSON.stringify(next));
      return next;
    });
  };

  return [visibility, setVisibility] as const;
}

export function useDensity(userId: string | undefined) {
  const [loadedFor, setLoadedFor] = useState<string | undefined>(undefined);
  const [density, setDensityState] = useState<Density>("comfortable");

  if (userId && userId !== loadedFor) {
    setLoadedFor(userId);
    const raw = window.localStorage.getItem(storageKey(userId, "density"));
    setDensityState(raw === "compact" ? "compact" : "comfortable");
  }

  const setDensity = (value: Density) => {
    setDensityState(value);
    if (userId) window.localStorage.setItem(storageKey(userId, "density"), value);
  };

  return [density, setDensity] as const;
}
