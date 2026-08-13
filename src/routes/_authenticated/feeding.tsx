import { createFileRoute, Outlet } from "@tanstack/react-router";

import { FeedingSectionNav } from "@/features/feeding/components/FeedingSectionNav";

// Feeding & Care layout (M5 — session-pack.md Part 5), same shape as
// `_authenticated/health.tsx` — the feeding log and care activities
// share one tab strip.
export const Route = createFileRoute("/_authenticated/feeding")({
  component: FeedingLayout,
});

function FeedingLayout() {
  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <FeedingSectionNav />
      <Outlet />
    </div>
  );
}
