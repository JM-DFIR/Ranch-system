import { WifiOff } from "lucide-react";

// For the "record X" flows that are NOT among the five offline-queued
// operations (CLAUDE.md §8: treatment, illness, vet visit) — this says
// so plainly rather than letting the form submit into a network call
// that's guaranteed to fail. Vaccination and weight never render this;
// they queue instead.
export function OfflineBlock() {
  return (
    <div className="flex items-center gap-2 rounded-card border border-status-warn/25 bg-status-warn/10 px-3 py-2.5 text-13 text-status-warn">
      <WifiOff className="size-4 shrink-0" aria-hidden />
      You're offline. This needs a connection — reconnect and try again.
    </div>
  );
}
