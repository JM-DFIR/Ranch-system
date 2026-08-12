import { createFileRoute } from "@tanstack/react-router";

import { healthRegisterSearchSchema } from "@/features/health/schema";
import { VaccinationRegisterPage } from "@/features/health/components/VaccinationRegisterPage";

export const Route = createFileRoute("/_authenticated/health/vaccinations")({
  validateSearch: healthRegisterSearchSchema,
  component: VaccinationRegisterPage,
});
