import { useEffect, useState } from "react";

// Generic debounce for anything driving a server round trip off typed
// input (search boxes, live-count filters) — not feature-specific, so
// it lives in lib rather than under a single feature.
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timeout);
  }, [value, delayMs]);

  return debounced;
}
