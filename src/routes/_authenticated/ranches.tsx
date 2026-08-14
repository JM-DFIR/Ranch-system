import { createFileRoute } from "@tanstack/react-router";

import { RanchListPage } from "@/features/ranches/components/RanchListPage";

export const Route = createFileRoute("/_authenticated/ranches")({
  component: RanchListPage,
});
