import { createFileRoute } from "@tanstack/react-router";

import { VeterinariansPage } from "@/features/health/components/VeterinariansPage";

// Session 8 (M3 remainder) — reachable directly, ahead of the full
// Health Hub it'll eventually live under.
export const Route = createFileRoute("/_authenticated/veterinarians")({
  component: VeterinariansPage,
});
