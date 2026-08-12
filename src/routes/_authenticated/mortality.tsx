import { createFileRoute } from "@tanstack/react-router";

import { mortalityRegisterSearchSchema } from "@/features/mortality/schema";
import { MortalityRegisterPage } from "@/features/mortality/components/MortalityRegisterPage";

export const Route = createFileRoute("/_authenticated/mortality")({
  validateSearch: mortalityRegisterSearchSchema,
  component: MortalityRegisterPage,
});
