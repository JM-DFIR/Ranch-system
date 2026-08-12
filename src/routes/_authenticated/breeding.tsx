import { createFileRoute, Outlet } from "@tanstack/react-router";

import { BreedingSectionNav } from "@/features/breeding/components/BreedingSectionNav";

// Breeding layout (M4 — session-pack.md Part 5), same shape as
// `_authenticated/health.tsx` — the register and calendar share one
// tab strip.
export const Route = createFileRoute("/_authenticated/breeding")({
  component: BreedingLayout,
});

function BreedingLayout() {
  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <BreedingSectionNav />
      <Outlet />
    </div>
  );
}
