import { createFileRoute } from "@tanstack/react-router";

import { dashboardSearchSchema } from "@/features/dashboard/schema";
import { DashboardPage } from "@/features/dashboard/components/DashboardPage";

// Session 7 — the Owner/Manager Dashboard, replacing the Session-0
// placeholder that only existed so `/` resolved to something.
export const Route = createFileRoute("/_authenticated/")({
  validateSearch: dashboardSearchSchema,
  component: DashboardPage,
});
