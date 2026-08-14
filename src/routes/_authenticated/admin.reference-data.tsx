import { createFileRoute } from "@tanstack/react-router";

import { ReferenceDataPage } from "@/features/admin/components/ReferenceDataPage";

export const Route = createFileRoute("/_authenticated/admin/reference-data")({
  component: ReferenceDataPage,
});
