import { createFileRoute } from "@tanstack/react-router";

import { healthRegisterSearchSchema } from "@/features/health/schema";
import { TreatmentRegisterPage } from "@/features/health/components/TreatmentRegisterPage";

export const Route = createFileRoute("/_authenticated/health/treatments")({
  validateSearch: healthRegisterSearchSchema,
  component: TreatmentRegisterPage,
});
