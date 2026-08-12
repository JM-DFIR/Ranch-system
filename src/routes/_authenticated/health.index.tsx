import { createFileRoute } from "@tanstack/react-router";

import { HealthHubPage } from "@/features/health/components/HealthHubPage";

export const Route = createFileRoute("/_authenticated/health/")({
  component: HealthHubPage,
});
