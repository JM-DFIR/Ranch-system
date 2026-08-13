import { createFileRoute } from "@tanstack/react-router";

import { feedingRegisterSearchSchema } from "@/features/feeding/schema";
import { CareActivityRegisterPage } from "@/features/feeding/components/CareActivityRegisterPage";

export const Route = createFileRoute("/_authenticated/feeding/care")({
  validateSearch: feedingRegisterSearchSchema,
  component: CareActivityRegisterPage,
});
