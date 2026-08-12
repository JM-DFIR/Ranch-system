import { createFileRoute } from "@tanstack/react-router";

import { AttentionQueuePage } from "@/features/attention/components/AttentionQueuePage";

// Session 8 (M3 remainder) — reachable directly and from the dashboard's
// attention counterpoint, ahead of the full Health Hub it'll eventually
// live under.
export const Route = createFileRoute("/_authenticated/attention")({
  component: AttentionQueuePage,
});
