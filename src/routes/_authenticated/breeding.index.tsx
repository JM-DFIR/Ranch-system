import { createFileRoute } from "@tanstack/react-router";

import { breedingRegisterSearchSchema } from "@/features/breeding/schema";
import { BreedingRegisterPage } from "@/features/breeding/components/BreedingRegisterPage";

export const Route = createFileRoute("/_authenticated/breeding/")({
  validateSearch: breedingRegisterSearchSchema,
  component: BreedingRegisterPage,
});
