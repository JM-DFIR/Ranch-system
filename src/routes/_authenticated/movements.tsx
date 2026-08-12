import { createFileRoute } from "@tanstack/react-router";

import { movementRegisterSearchSchema } from "@/features/movements/schema";
import { MovementRegisterPage } from "@/features/movements/components/MovementRegisterPage";

export const Route = createFileRoute("/_authenticated/movements")({
  validateSearch: movementRegisterSearchSchema,
  component: MovementRegisterPage,
});
