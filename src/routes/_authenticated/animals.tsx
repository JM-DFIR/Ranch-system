import { createFileRoute } from "@tanstack/react-router";

import { animalsSearchSchema } from "@/features/animals/schema";
import { AnimalRegisterPage } from "@/features/animals/components/AnimalRegisterPage";

// Session 3 — the animal register. `ranch` is not part of this route's
// own search schema; it's inherited from the parent `_authenticated`
// route (Session 2's global ranch scope), read via AuthenticatedRoute
// in the components below rather than duplicated here.
export const Route = createFileRoute("/_authenticated/animals")({
  validateSearch: animalsSearchSchema,
  component: AnimalRegisterPage,
});
