import { createFileRoute, Outlet } from "@tanstack/react-router";

import { HealthSectionNav } from "@/features/health/components/HealthSectionNav";

// Health Hub layout (session-pack.md Part 5 — "M3 remainder"). Every
// route nested under `/health` (the hub itself at the index, plus the
// four standalone registers) shares this tab strip — same layout+Outlet
// shape as `_authenticated/animals.$animalId.tsx`.
export const Route = createFileRoute("/_authenticated/health")({
  component: HealthLayout,
});

function HealthLayout() {
  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <HealthSectionNav />
      <Outlet />
    </div>
  );
}
