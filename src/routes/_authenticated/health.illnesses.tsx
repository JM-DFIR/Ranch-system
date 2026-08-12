import { createFileRoute } from "@tanstack/react-router";

import { healthRegisterSearchSchema } from "@/features/health/schema";
import { IllnessRegisterPage } from "@/features/health/components/IllnessRegisterPage";

export const Route = createFileRoute("/_authenticated/health/illnesses")({
  validateSearch: healthRegisterSearchSchema,
  component: IllnessRegisterPage,
});
