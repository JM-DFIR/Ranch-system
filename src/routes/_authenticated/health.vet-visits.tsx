import { createFileRoute } from "@tanstack/react-router";

import { healthRegisterSearchSchema } from "@/features/health/schema";
import { VetVisitRegisterPage } from "@/features/health/components/VetVisitRegisterPage";

export const Route = createFileRoute("/_authenticated/health/vet-visits")({
  validateSearch: healthRegisterSearchSchema,
  component: VetVisitRegisterPage,
});
