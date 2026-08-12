import { useEffect, useState } from "react";

// For the record flows that are NOT among the five offline-queued
// operations (CLAUDE.md §8: treatment, illness, vet visit) — those
// require connectivity and say so plainly rather than queueing
// something the sync worker was never built to replay. Vaccination and
// weight don't need this; they go through the queue instead.
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const update = () => setIsOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  return isOnline;
}
