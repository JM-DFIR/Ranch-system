import { useState } from "react";

// Species and sex both "remember last" (session-pack.md, Session 5b) —
// enrolling a herd is mostly one species and a run of the same sex, so
// the next animal starts from whatever was picked for the last one
// rather than a blank default. Scoped per profile, same reasoning as
// the register's column-visibility persistence (usePreferences.ts).
function storageKey(userId: string, field: string): string {
  return `lims:enroll:last-${field}:${userId}`;
}

export function useRememberedChoice(userId: string | undefined, field: string) {
  // userId is undefined for a beat while useAuth()'s profile query is
  // still in flight — hydration happens as a render-time adjustment
  // (comparing against a previous value tracked in state) rather than
  // a lazy useState initializer, which would miss the stored value
  // entirely if userId wasn't known yet on first render. Same pattern
  // as usePreferences.ts's useColumnVisibility/useDensity.
  const [loadedFor, setLoadedFor] = useState<string | undefined>(undefined);
  const [value, setValueState] = useState<string | undefined>(undefined);

  if (userId && userId !== loadedFor) {
    setLoadedFor(userId);
    setValueState(window.localStorage.getItem(storageKey(userId, field)) ?? undefined);
  }

  const setValue = (next: string | undefined) => {
    setValueState(next);
    if (userId && next) window.localStorage.setItem(storageKey(userId, field), next);
  };

  return [value, setValue] as const;
}
