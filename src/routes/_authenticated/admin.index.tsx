import { createFileRoute } from "@tanstack/react-router";

import { AdminHubPage } from "@/features/admin/components/AdminHubPage";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminHubPage,
});
